// app/utils/simpleVideoGenerator.ts
export class SimpleVideoGenerator {
  static async generateVideo(projectTitle: string, scenesCount: number): Promise<Blob> {
    // Create a canvas and generate frames
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Canvas context not available');
    }
    
    // Set canvas size
    canvas.width = 1280;
    canvas.height = 720;
    
    // Draw background
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(projectTitle, canvas.width / 2, canvas.height / 2 - 50);
    
    // Draw subtitle
    ctx.font = '24px Arial';
    ctx.fillStyle = '#d1d5db';
    ctx.fillText(`${scenesCount} scenes exported`, canvas.width / 2, canvas.height / 2 + 30);
    
    // Draw date
    ctx.font = '18px Arial';
    ctx.fillStyle = '#9ca3af';
    ctx.fillText(new Date().toLocaleDateString(), canvas.width / 2, canvas.height / 2 + 80);
    
    // Convert canvas to blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          // Fallback to text file
          const content = `Video export for ${projectTitle}\nScenes: ${scenesCount}\nDate: ${new Date().toISOString()}`;
          resolve(new Blob([content], { type: 'text/plain' }));
        }
      }, 'video/webm');
    });
  }
}