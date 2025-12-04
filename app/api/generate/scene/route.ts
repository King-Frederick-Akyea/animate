import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { projectId, sceneNumber, story } = await request.json();

    // Mock scene generation
    // In production, use Stable Diffusion API or similar
    const scenes = [
      {
        description: "Benny and Rosie meet in the village square",
        backgroundUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop",
      },
      {
        description: "Whispering Woods with magical trees",
        backgroundUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&h=600&fit=crop",
      },
      {
        description: "Rainbow flower garden",
        backgroundUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
      },
      {
        description: "Village celebration",
        backgroundUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=600&fit=crop",
      },
    ];

    const sceneIndex = (sceneNumber - 1) % scenes.length;
    
    return NextResponse.json(scenes[sceneIndex]);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}