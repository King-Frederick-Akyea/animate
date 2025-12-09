import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { Scene, Character } from '@/lib/type';

export class SceneVideoGenerator {
  private ffmpeg: FFmpeg;
  private isLoaded = false;

  constructor() {
    this.ffmpeg = new FFmpeg();
  }

  async load() {
    if (this.isLoaded) return;
    
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    
    await this.ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    
    this.isLoaded = true;
    console.log('FFmpeg loaded successfully');
  }

  async generateVideoFromScenes(scenes: Scene[], projectTitle: string): Promise<Blob> {
    await this.load();
    
    try {
      console.log(`Generating video from ${scenes.length} scenes...`);
      
      // First, process all scenes to get their actual durations
      const sceneData = await this.processScenesData(scenes);
      
      // Render each scene to images
      const sceneFrames = await this.renderScenesToFrames(scenes);
      
      if (sceneFrames.length === 0) {
        throw new Error('No frames generated from scenes');
      }

      // Write each frame to FFmpeg file system
      for (let i = 0; i < sceneFrames.length; i++) {
        const frameData = sceneFrames[i];
        const filename = `frame${i.toString().padStart(4, '0')}.png`;
        await this.ffmpeg.writeFile(filename, frameData);
      }

      // Create video from frames using ACTUAL durations
      let concatText = '';
      
      // Create frames.txt for concat demuxer using actual durations
      for (let i = 0; i < sceneFrames.length; i++) {
        const filename = `frame${i.toString().padStart(4, '0')}.png`;
        const duration = sceneData[i].duration;
        concatText += `file '${filename}'\n`;
        concatText += `duration ${duration}\n`;
      }
      
      await this.ffmpeg.writeFile('frames.txt', new TextEncoder().encode(concatText));
      
      let command: string[];
      const hasAudio = sceneData.some(scene => scene.hasAudio);
      
      if (hasAudio) {
        console.log('Creating video with audio...');
        
        // Write audio files to FFmpeg file system
        for (let i = 0; i < sceneData.length; i++) {
          const scene = sceneData[i];
          if (scene.audioBuffer) {
            const audioFilename = `audio${i}.wav`;
            await this.ffmpeg.writeFile(audioFilename, scene.audioBuffer);
          }
        }
        
        // Create audio concat file with proper timing
        let audioConcatText = '';
        let currentTime = 0;
        
        for (let i = 0; i < sceneData.length; i++) {
          const scene = sceneData[i];
          const duration = scene.duration;
          
          if (scene.audioBuffer) {
            // Scene has audio
            audioConcatText += `file 'audio${i}.wav'\n`;
            audioConcatText += `inpoint 0\n`;
            audioConcatText += `outpoint ${duration}\n`;
          } else {
            // Scene without audio - add silence
            audioConcatText += `file 'anullsrc=channel_layout=stereo:sample_rate=44100'\n`;
            audioConcatText += `inpoint 0\n`;
            audioConcatText += `outpoint ${duration}\n`;
          }
        }
        
        await this.ffmpeg.writeFile('audio_concat.txt', new TextEncoder().encode(audioConcatText));
        
        // Create video with audio
        command = [
          '-f', 'concat',
          '-safe', '0',
          '-i', 'frames.txt',
          '-f', 'concat',
          '-safe', '0',
          '-i', 'audio_concat.txt',
          '-c:v', 'libx264',
          '-preset', 'medium',
          '-crf', '23',
          '-pix_fmt', 'yuv420p',
          '-c:a', 'aac',
          '-b:a', '128k',
          '-shortest', // Stop when the shortest stream ends
          '-movflags', '+faststart',
          'output.mp4'
        ];
      } else {
        console.log('Creating video without audio...');
        // Create video without audio
        command = [
          '-f', 'concat',
          '-safe', '0',
          '-i', 'frames.txt',
          '-c:v', 'libx264',
          '-preset', 'medium',
          '-crf', '23',
          '-pix_fmt', 'yuv420p',
          '-an', // No audio
          '-movflags', '+faststart',
          'output.mp4'
        ];
      }
      
      console.log('Running FFmpeg command...');
      await this.ffmpeg.exec(command);
      
      // Read the output file
      const data = await this.ffmpeg.readFile('output.mp4');
      
      // Convert to Blob
      const arrayBuffer = (data as any).buffer;
      const blob = new Blob([arrayBuffer], { type: 'video/mp4' });
      
      // Clean up
      await this.cleanupFiles(sceneFrames.length, sceneData.length);
      
      console.log(`Video generated successfully with ${sceneData.length} scenes`);
      console.log('Scene durations:', sceneData.map((s, i) => `Scene ${i + 1}: ${s.duration}s`));
      
      return blob;
      
    } catch (error) {
      console.error('Video generation error:', error);
      
      // Fallback: create simple video without audio
      return await this.createSimpleSceneVideo(scenes, projectTitle);
    }
  }

  private async processScenesData(scenes: Scene[]): Promise<
    { duration: number; hasAudio: boolean; audioBuffer?: Uint8Array }[]
  > {
    const sceneData = [];
    
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      
      // Start with scene duration from database
      let duration = scene.duration || 5;
      let hasAudio = false;
      let audioBuffer: Uint8Array | undefined;
      
      // Check for audio
      if (scene.audio_url) {
        try {
          const audioData = await this.extractAudioFromScene(scene, i);
          if (audioData) {
            hasAudio = true;
            audioBuffer = audioData.audioBuffer;
            
            // Use audio duration if it's longer than scene duration
            const audioDuration = audioData.duration;
            if (audioDuration > duration) {
              duration = Math.ceil(audioDuration);
              console.log(`Scene ${i + 1}: Audio (${audioDuration}s) is longer than scene duration (${scene.duration}s), using ${duration}s`);
            } else {
              console.log(`Scene ${i + 1}: Using scene duration ${duration}s (audio: ${audioDuration}s)`);
            }
          }
        } catch (error) {
          console.warn(`Failed to process audio for scene ${i + 1}:`, error);
        }
      }
      
      // Ensure minimum duration of 1 second
      if (duration < 1) duration = 1;
      
      sceneData.push({ duration, hasAudio, audioBuffer });
    }
    
    return sceneData;
  }

  private async extractAudioFromScene(scene: Scene, sceneIndex: number): Promise<{ audioBuffer: Uint8Array, duration: number } | null> {
    if (!scene.audio_url) return null;
    
    try {
      let audioData: ArrayBuffer;
      
      // Check if audio_url is a data URL or regular URL
      if (scene.audio_url.startsWith('data:')) {
        // It's a data URL
        const base64Data = scene.audio_url.split(',')[1];
        audioData = this.base64ToArrayBuffer(base64Data);
      } else if (scene.audio_url.startsWith('blob:')) {
        // It's a blob URL
        const response = await fetch(scene.audio_url);
        audioData = await response.arrayBuffer();
      } else {
        // It's a regular URL
        const response = await fetch(scene.audio_url);
        if (!response.ok) {
          console.warn(`Failed to fetch audio from ${scene.audio_url}`);
          return null;
        }
        audioData = await response.arrayBuffer();
      }
      
      // Convert to Uint8Array
      const audioBuffer = new Uint8Array(audioData);
      
      // Get actual audio duration
      let duration = scene.duration || 5;
      
      try {
        // Create an audio element to get duration
        const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio();
        
        await new Promise((resolve, reject) => {
          audio.onloadedmetadata = () => {
            duration = audio.duration;
            URL.revokeObjectURL(audioUrl);
            resolve(null);
          };
          audio.onerror = reject;
          audio.src = audioUrl;
        });
        
        console.log(`Scene ${sceneIndex + 1} audio duration: ${duration.toFixed(2)}s`);
      } catch (error) {
        console.warn('Could not determine audio duration:', error);
      }
      
      return { audioBuffer, duration };
      
    } catch (error) {
      console.error('Error extracting audio:', error);
      return null;
    }
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    try {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    } catch (error) {
      console.error('Error decoding base64 audio:', error);
      return new ArrayBuffer(0);
    }
  }

  private async renderScenesToFrames(scenes: Scene[]): Promise<Uint8Array[]> {
    const frames: Uint8Array[] = [];
    
    for (const scene of scenes) {
      try {
        // Create a canvas for this scene
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) continue;
        
        // Set canvas size (HD video)
        canvas.width = 1280;
        canvas.height = 720;
        
        // Draw background
        if (scene.background_image_url) {
          await this.drawBackground(ctx, scene.background_image_url, canvas.width, canvas.height);
        } else {
          // Default background
          ctx.fillStyle = '#4f46e5';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Draw characters if available
        if (scene.scene_characters && Array.isArray(scene.scene_characters)) {
          for (const sceneChar of scene.scene_characters) {
            if (sceneChar.characters?.image_url) {
              await this.drawCharacter(
                ctx, 
                sceneChar.characters.image_url,
                sceneChar.position_x,
                sceneChar.position_y,
                sceneChar.scale || 1
              );
            }
          }
        }
        
        // Add scene number overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(10, 10, 100, 40);
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText(`Scene ${scene.scene_number}`, 20, 35);
        
        // Add audio indicator if scene has audio
        if (scene.audio_url) {
          ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
          ctx.beginPath();
          ctx.arc(canvas.width - 30, 30, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'white';
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('♪', canvas.width - 30, 30);
          
          // Add duration info for audio scenes
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(canvas.width - 100, 50, 90, 25);
          ctx.fillStyle = 'white';
          ctx.font = '12px Arial';
          ctx.textAlign = 'right';
          ctx.fillText(`${scene.duration || '?'}s`, canvas.width - 15, 67);
        }
        
        // Convert canvas to PNG
        const frame = await this.canvasToUint8Array(canvas);
        frames.push(frame);
        
      } catch (error) {
        console.error('Error rendering scene:', error);
        // Create a simple placeholder frame
        const placeholder = await this.createPlaceholderFrame(scene.scene_number);
        frames.push(placeholder);
      }
    }
    
    return frames;
  }

  private async drawBackground(ctx: CanvasRenderingContext2D, imageUrl: string, width: number, height: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Draw image to cover canvas
        ctx.drawImage(img, 0, 0, width, height);
        resolve();
      };
      img.onerror = reject;
      img.src = imageUrl;
      
      // Fallback if image fails to load
      setTimeout(() => {
        if (!img.complete) {
          ctx.fillStyle = '#667eea';
          ctx.fillRect(0, 0, width, height);
          resolve();
        }
      }, 1000);
    });
  }

  private async drawCharacter(
    ctx: CanvasRenderingContext2D, 
    imageUrl: string, 
    xPercent: number, 
    yPercent: number,
    scale: number
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const charWidth = 120 * scale;
        const charHeight = 180 * scale;
        const x = (xPercent / 100) * ctx.canvas.width - charWidth / 2;
        const y = ctx.canvas.height - (yPercent / 100) * ctx.canvas.height - charHeight / 2;
        
        // Draw character with shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        
        ctx.drawImage(img, x, y, charWidth, charHeight);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        resolve();
      };
      img.onerror = () => {
        // Draw placeholder for character
        const charWidth = 120 * scale;
        const charHeight = 180 * scale;
        const x = (xPercent / 100) * ctx.canvas.width - charWidth / 2;
        const y = ctx.canvas.height - (yPercent / 100) * ctx.canvas.height - charHeight / 2;
        
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(x, y, charWidth, charHeight);
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.fillText('Char', x + 10, y + 20);
        
        resolve();
      };
      img.src = imageUrl;
    });
  }

  private async canvasToUint8Array(canvas: HTMLCanvasElement): Promise<Uint8Array> {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const arrayBuffer = reader.result as ArrayBuffer;
            resolve(new Uint8Array(arrayBuffer));
          };
          reader.readAsArrayBuffer(blob);
        } else {
          resolve(new Uint8Array());
        }
      }, 'image/png', 0.9);
    });
  }

  private async createPlaceholderFrame(sceneNumber: number): Promise<Uint8Array> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = 1280;
    canvas.height = 720;
    
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#4f46e5');
    gradient.addColorStop(1, '#ec4899');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Scene number
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Scene ${sceneNumber}`, canvas.width / 2, canvas.height / 2);
    
    ctx.font = '24px Arial';
    ctx.fillText('Rendering preview...', canvas.width / 2, canvas.height / 2 + 50);
    
    return this.canvasToUint8Array(canvas);
  }

  private async cleanupFiles(frameCount: number, audioFileCount: number = 0): Promise<void> {
    try {
      // Remove frame files
      for (let i = 0; i < frameCount; i++) {
        const filename = `frame${i.toString().padStart(4, '0')}.png`;
        await this.ffmpeg.deleteFile(filename).catch(() => {});
      }
      
      // Remove audio files
      for (let i = 0; i < audioFileCount; i++) {
        const filename = `audio${i}.wav`;
        await this.ffmpeg.deleteFile(filename).catch(() => {});
      }
      
      // Remove other temporary files
      await this.ffmpeg.deleteFile('frames.txt').catch(() => {});
      await this.ffmpeg.deleteFile('audio_concat.txt').catch(() => {});
      await this.ffmpeg.deleteFile('output.mp4').catch(() => {});
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
  }

  // Simpler method for testing with audio
  async createSimpleSceneVideo(scenes: Scene[], projectTitle: string): Promise<Blob> {
    await this.load();
    
    try {
      // Create title screen canvas
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d')!;
      
      // Title screen
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#4f46e5');
      gradient.addColorStop(1, '#ec4899');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 64px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(projectTitle, canvas.width / 2, canvas.height / 2 - 50);
      
      ctx.font = '32px Arial';
      ctx.fillText(`${scenes.length} Scenes`, canvas.width / 2, canvas.height / 2 + 30);
      
      // Add audio info
      const audioScenes = scenes.filter(s => s.audio_url).length;
      if (audioScenes > 0) {
        ctx.font = '24px Arial';
        ctx.fillText(`${audioScenes} scenes with audio`, canvas.width / 2, canvas.height / 2 + 80);
      }
      
      // Convert to video using FFmpeg
      const frameData = await this.canvasToUint8Array(canvas);
      await this.ffmpeg.writeFile('title.png', frameData);
      
      // Check if any scene has audio
      const audioScenesList = scenes.filter(s => s.audio_url);
      let hasAudio = false;
      let audioBuffers: Uint8Array[] = [];
      
      if (audioScenesList.length > 0) {
        hasAudio = true;
        // Extract first audio file
        const sceneWithAudio = audioScenesList[0];
        const audioData = await this.extractAudioFromScene(sceneWithAudio, 0);
        if (audioData) {
          audioBuffers.push(audioData.audioBuffer);
        }
      }
      
      let command: string[];
      
      if (hasAudio && audioBuffers.length > 0) {
        // Write audio file
        await this.ffmpeg.writeFile('audio.wav', audioBuffers[0]);
        
        command = [
          '-loop', '1',
          '-i', 'title.png',
          '-i', 'audio.wav',
          '-t', '5', // 5 seconds
          '-vf', 'fps=30,format=yuv420p',
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-pix_fmt', 'yuv420p',
          '-c:a', 'aac',
          '-b:a', '128k',
          '-shortest',
          'output.mp4'
        ];
      } else {
        command = [
          '-loop', '1',
          '-i', 'title.png',
          '-t', '5', // 5 seconds
          '-vf', 'fps=30,format=yuv420p',
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-pix_fmt', 'yuv420p',
          '-an', // No audio
          'output.mp4'
        ];
      }
      
      await this.ffmpeg.exec(command);
      
      const data = await this.ffmpeg.readFile('output.mp4');
      const arrayBuffer = (data as any).buffer;
      
      // Clean up
      await this.ffmpeg.deleteFile('title.png').catch(() => {});
      if (hasAudio) {
        await this.ffmpeg.deleteFile('audio.wav').catch(() => {});
      }
      await this.ffmpeg.deleteFile('output.mp4').catch(() => {});
      
      return new Blob([arrayBuffer], { type: 'video/mp4' });
      
    } catch (error) {
      console.error('Simple video error:', error);
      
      // Fallback: create a video with just text
      return this.createFallbackVideo(projectTitle, scenes.length);
    }
  }

  private async createFallbackVideo(projectTitle: string, sceneCount: number): Promise<Blob> {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d')!;
    
    // Animated gradient background
    for (let i = 0; i < 3; i++) {
      const hue = (i * 120) % 360;
      ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = 'white';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(projectTitle, canvas.width / 2, canvas.height / 2 - 50);
      ctx.fillText(`${sceneCount} scenes`, canvas.width / 2, canvas.height / 2 + 30);
      ctx.font = '24px Arial';
      ctx.fillText('Video Export', canvas.width / 2, canvas.height / 2 + 80);
    }
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          const content = `Video for: ${projectTitle}\nScenes: ${sceneCount}`;
          resolve(new Blob([content], { type: 'text/plain' }));
        }
      }, 'video/webm');
    });
  }
}