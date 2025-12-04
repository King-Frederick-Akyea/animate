import { NextRequest, NextResponse } from 'next/server';

// Free story generation using Hugging Face Inference API (free tier)
const HUGGINGFACE_API_TOKEN = process.env.HUGGINGFACE_API_TOKEN;

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Try using Hugging Face if token is available
    if (HUGGINGFACE_API_TOKEN) {
      try {
        const response = await fetch(
          'https://api-inference.huggingface.co/models/gpt2',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${HUGGINGFACE_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              inputs: `Create a children's cartoon story about: ${prompt}. The story should be suitable for kids and have 4 scenes.`,
              parameters: {
                max_new_tokens: 300,
                temperature: 0.7,
                top_p: 0.9,
              },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          let storyText = '';
          
          if (Array.isArray(data)) {
            storyText = data[0]?.generated_text || '';
          } else if (data && typeof data === 'object') {
            storyText = data.generated_text || '';
          }
          
          // Format the story with scenes
          const formattedStory = storyText || `Once upon a time, ${prompt}.

Scene 1: Introduction of characters
Scene 2: The adventure begins
Scene 3: Overcoming challenges
Scene 4: Happy ending with lessons learned`;

          return NextResponse.json({ story: formattedStory });
        }
      } catch (hfError) {
        console.log('Hugging Face API error:', hfError);
      }
    }

    // Fallback: Generate a structured story
    const characters = ['friendly bear', 'clever rabbit', 'wise owl', 'playful squirrel'];
    const settings = ['magical forest', 'colorful village', 'enchanted garden', 'mysterious mountain'];
    const conflicts = ['lost treasure', 'missing friend', 'broken rainbow', 'dark cloud'];
    
    const randomChar = characters[Math.floor(Math.random() * characters.length)];
    const randomSetting = settings[Math.floor(Math.random() * settings.length)];
    const randomConflict = conflicts[Math.floor(Math.random() * conflicts.length)];
    
    const mockStory = `${prompt || 'In a wonderful world'}, there lived a ${randomChar} in the ${randomSetting}. 
One day, they discovered a ${randomConflict} and decided to help.

Scene 1: Meet ${randomChar} in the ${randomSetting}
Scene 2: Discover the problem: ${randomConflict}
Scene 3: Journey to find a solution with friends
Scene 4: Success! Everyone celebrates and learns about friendship`;

    return NextResponse.json({ story: mockStory });
  } catch (error: any) {
    console.error('Story generation error:', error);
    
    // Return a simple story as last resort
    const simpleStory = `${prompt || 'A beautiful cartoon story'} with happy characters learning valuable lessons.

Scene 1: Characters are introduced
Scene 2: Adventure begins
Scene 3: Overcoming obstacles together
Scene 4: Happy ending with moral lesson`;
    
    return NextResponse.json({ story: simpleStory });
  }
}