import { NextRequest, NextResponse } from 'next/server';

// Free image generation using Unsplash and text generation
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

export async function POST(request: NextRequest) {
  let sceneNumber = 1;
  let prompt = 'cartoon scene';
  
  try {
    const body = await request.json();
    prompt = body.prompt || 'cartoon scene';
    sceneNumber = body.sceneNumber || 1;

    // Generate scene description using a free text generation API
    const sceneKeywords = prompt.toLowerCase().includes('forest') ? 'cartoon forest' :
                         prompt.toLowerCase().includes('city') ? 'cartoon city' :
                         prompt.toLowerCase().includes('beach') ? 'cartoon beach' :
                         prompt.toLowerCase().includes('house') ? 'cartoon house interior' :
                         'cartoon landscape';

    const sceneDescription = `Scene ${sceneNumber}: ${prompt.substring(0, 100)}...`;

    // Get background image from Unsplash (free tier)
    let backgroundUrl = '';
    
    if (UNSPLASH_ACCESS_KEY) {
      try {
        const unsplashResponse = await fetch(
          `https://api.unsplash.com/photos/random?query=${encodeURIComponent(sceneKeywords)}&orientation=landscape`,
          {
            headers: {
              'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
            },
          }
        );

        if (unsplashResponse.ok) {
          const unsplashData = await unsplashResponse.json();
          backgroundUrl = unsplashData.urls?.regular || '';
        }
      } catch (unsplashError) {
        console.log('Unsplash API error, using fallback');
      }
    }

    // Fallback image sources (free APIs)
    if (!backgroundUrl) {
      // Use Picsum for random images
      const seed = Date.now() + sceneNumber;
      backgroundUrl = `https://picsum.photos/seed/${seed}/800/600`;
    }

    // Generate character suggestions
    const characterSets = [
      ['Benny the Bear', 'Rosie the Rabbit', 'Oliver the Owl'],
      ['Max the Monkey', 'Lily the Lion', 'Toby the Turtle'],
      ['Chloe the Cat', 'Danny the Dog', 'Polly the Parrot'],
      ['Gary the Goat', 'Fiona the Fox', 'Henry the Hippo']
    ];
    
    const randomSet = characterSets[sceneNumber % characterSets.length];

    return NextResponse.json({
      description: sceneDescription,
      backgroundUrl: backgroundUrl,
      suggestedCharacters: randomSet,
    });
  } catch (error: any) {
    console.error('Scene generation error:', error);
    
    // Return mock data with preserved sceneNumber
    return NextResponse.json({
      description: `Scene ${sceneNumber}: A beautiful cartoon scene`,
      backgroundUrl: `https://picsum.photos/800/600?random=${Date.now()}`,
      suggestedCharacters: ['Hero', 'Sidekick', 'Villain'],
    });
  }
}