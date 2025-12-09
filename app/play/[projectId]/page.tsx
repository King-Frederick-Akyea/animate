'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Play, Pause, SkipBack, SkipForward, Volume2, Home, VolumeX } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Scene } from '@/lib/type';

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [scenes, setScenes] = useState<Scene[]>([]);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sceneDurationRef = useRef<number>(0);

  // Define currentScene after scenes are loaded
  const currentScene = scenes[currentSceneIndex];

  useEffect(() => {
    if (projectId) {
      fetchScenes();
    }
  }, [projectId]);

  useEffect(() => {
    // This useEffect handles the playback logic
    if (currentScene) {
      sceneDurationRef.current = currentScene.duration;
      
      if (isPlaying) {
        startProgressTimer();
        if (audioRef.current && currentScene.audio_url) {
          audioRef.current.play().catch(console.error);
        }
      } else {
        stopProgressTimer();
        if (audioRef.current) {
          audioRef.current.pause();
        }
      }
    }

    return () => {
      stopProgressTimer();
    };
  }, [isPlaying, currentSceneIndex, currentScene]); // currentScene is now properly defined

  const fetchScenes = async () => {
    try {
      const { data: scenesData, error } = await supabase
        .from('scenes')
        .select(`
          *,
          scene_characters (
            *,
            characters (*)
          )
        `)
        .eq('project_id', projectId)
        .order('scene_number');

      if (error) throw error;
      setScenes(scenesData || []);
      
      if (scenesData && scenesData.length > 0) {
        setCurrentSceneIndex(0);
      }
    } catch (error: any) {
      console.error('Failed to load scenes:', error);
      toast.error('Failed to load animation');
    } finally {
      setLoading(false);
    }
  };

  const startProgressTimer = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNextScene();
          return 0;
        }
        const increment = 100 / (sceneDurationRef.current * 10); // Update every 100ms
        return Math.min(prev + increment, 100);
      });
    }, 100);
  }, [sceneDurationRef]);

  const stopProgressTimer = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNextScene = () => {
    stopProgressTimer();
    setProgress(0);
    if (currentSceneIndex < scenes.length - 1) {
      setCurrentSceneIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
      toast.success('Animation completed!');
    }
  };

  const handlePrevScene = () => {
    stopProgressTimer();
    setProgress(0);
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex(prev => prev - 1);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const handleSceneSelect = (index: number) => {
    stopProgressTimer();
    setCurrentSceneIndex(index);
    setProgress(0);
    setIsPlaying(false);
  };

  // Handle audio ended event
  const handleAudioEnded = () => {
    if (isPlaying) {
      handleNextScene();
    }
  };

  // Handle audio errors
  const handleAudioError = (error: any) => {
    console.error('Audio error:', error);
    toast.error('Failed to play audio');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading animation...</p>
        </div>
      </div>
    );
  }

  if (scenes.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">No Scenes Found</h1>
          <p className="text-gray-400 mb-8">Create some scenes in the editor first!</p>
          <button
            onClick={() => router.push(`/editor/${projectId}`)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:opacity-90 transition font-medium"
          >
            Go to Editor
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Animation Canvas */}
      <div className="relative h-screen bg-black overflow-hidden">
        {currentScene && (
          <>
            {/* Background */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
              style={{
                backgroundImage: currentScene.background_image_url 
                  ? `url(${currentScene.background_image_url})`
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                opacity: isPlaying ? 1 : 0.9
              }}
            />

            {/* Dark overlay for better character visibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

            {/* Characters */}
            {currentScene.scene_characters?.map((sceneChar) => (
              <div
                key={sceneChar.id}
                className="absolute transition-all duration-1000 ease-in-out"
                style={{
                  left: `${sceneChar.position_x}%`,
                  bottom: `${sceneChar.position_y}%`,
                  transform: `translate(-50%, 50%) scale(${sceneChar.scale})`,
                  filter: 'drop-shadow(0 10px 8px rgba(0,0,0,0.5))'
                }}
              >
                <div
                  className="h-40 w-32 rounded-xl shadow-2xl border-4 border-white/20"
                  style={{
                    backgroundImage: sceneChar.characters.image_url 
                      ? `url(${sceneChar.characters.image_url})`
                      : 'linear-gradient(to bottom right, #f59e0b, #d97706)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                {/* Character Name */}
                <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-black/70 px-3 py-1 rounded-lg text-sm whitespace-nowrap">
                  {sceneChar.characters.name}
                </div>
              </div>
            ))}

            {/* Scene Info */}
            <div className="absolute top-4 left-4 bg-black/70 px-4 py-2 rounded-full backdrop-blur-sm">
              <span className="font-medium">Scene {currentScene.scene_number} of {scenes.length}</span>
              {currentScene.audio_url && (
                <span className="ml-2 text-blue-400">🎵</span>
              )}
            </div>

            {/* Scene Description */}
            {currentScene.description && (
              <div className="absolute top-20 left-4 right-4 bg-black/60 backdrop-blur-sm rounded-xl p-4 max-w-md">
                <p className="text-sm">{currentScene.description}</p>
              </div>
            )}

            {/* Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gray-800">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Time Indicator */}
            <div className="absolute top-12 right-4 bg-black/70 px-3 py-1 rounded-full text-sm">
              {Math.floor((progress / 100) * currentScene.duration)}s / {currentScene.duration}s
            </div>

            {/* Audio Element */}
            {currentScene.audio_url && (
              <audio
                ref={audioRef}
                src={currentScene.audio_url}
                onEnded={handleAudioEnded}
                onError={handleAudioError}
                volume={isMuted ? 0 : volume}
                preload="auto"
              />
            )}
          </>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 to-transparent p-6 pt-12">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-3 hover:bg-gray-800 rounded-full transition bg-black/50 backdrop-blur-sm"
                title="Back to Dashboard"
              >
                <Home className="h-6 w-6" />
              </button>
              
              <button
                onClick={() => router.push(`/editor/${projectId}`)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
              >
                Edit Project
              </button>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center space-x-6">
              <button
                onClick={handlePrevScene}
                disabled={currentSceneIndex === 0}
                className="p-3 hover:bg-gray-800 rounded-full transition disabled:opacity-50 bg-black/50 backdrop-blur-sm"
                title="Previous Scene"
              >
                <SkipBack className="h-6 w-6" />
              </button>

              <button
                onClick={handlePlayPause}
                className="p-5 bg-white text-black rounded-full hover:bg-gray-200 transition transform hover:scale-105"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8" />
                ) : (
                  <Play className="h-8 w-8 ml-1" />
                )}
              </button>

              <button
                onClick={handleNextScene}
                disabled={currentSceneIndex === scenes.length - 1}
                className="p-3 hover:bg-gray-800 rounded-full transition disabled:opacity-50 bg-black/50 backdrop-blur-sm"
                title="Next Scene"
              >
                <SkipForward className="h-6 w-6" />
              </button>
            </div>

            {/* Volume Controls */}
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleMute}
                className="p-2 hover:bg-gray-800 rounded-full transition"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-24 accent-purple-600"
              />
            </div>
          </div>

          {/* Scene Selection */}
          <div className="mt-4">
            <div className="text-sm text-gray-400 mb-2">
              Select Scene ({currentSceneIndex + 1} of {scenes.length})
            </div>
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {scenes.map((scene, index) => (
                <button
                  key={scene.id}
                  onClick={() => handleSceneSelect(index)}
                  className={`px-4 py-3 rounded-lg transition flex-shrink-0 min-w-[120px] ${
                    index === currentSceneIndex
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                      : 'bg-gray-800 hover:bg-gray-700'
                  }`}
                >
                  <div className="font-medium">Scene {scene.scene_number}</div>
                  <div className="text-xs text-gray-300 truncate mt-1">
                    {scene.description?.substring(0, 20) || 'No description'}
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs">
                    <span>{scene.duration}s</span>
                    {scene.audio_url && (
                      <span className="text-blue-400">🎵</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Playback Status */}
          <div className="mt-4 text-center text-sm text-gray-400">
            {isPlaying ? 'Playing' : 'Paused'} • Scene {currentSceneIndex + 1} of {scenes.length}
          </div>
        </div>
      </div>
    </div>
  );
}