import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    // For now, return a mock story
    // In production, integrate with OpenAI GPT-4 or Hugging Face
    const mockStory = `Once upon a time, in a colorful cartoon village, lived a friendly bear named Benny and a clever rabbit named Rosie. They decided to go on an adventure to find the magical rainbow flowers that only bloom when someone does a kind deed.

Scene 1: Benny and Rosie meet in the village square. They discuss their plan to find the rainbow flowers.
Scene 2: They journey through the Whispering Woods, helping a lost bird find its nest.
Scene 3: They discover the rainbow flowers blooming because of their kind deed.
Scene 4: Return to the village and share the flowers with everyone.`;

    return NextResponse.json({ story: mockStory });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}