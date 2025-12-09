import { NextRequest, NextResponse } from 'next/server';

// Free image generation using Unsplash and text generation
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt = 'cartoon scene',
      sceneNumber = 1,
      storyTitle,
      storyGenre,
      sceneTitle,
      sceneLocation,
      sceneAction,
      sceneCharacters = [],
      allCharacters = [],
      storyContext
    } = body;

    // Build comprehensive scene description from story context
    let sceneDescription = '';
    if (sceneTitle && sceneLocation && sceneAction) {
      sceneDescription = `Scene ${sceneNumber}: ${sceneTitle}\nLocation: ${sceneLocation}\nAction: ${sceneAction}`;
      if (sceneCharacters.length > 0) {
        sceneDescription += `\nCharacters: ${sceneCharacters.join(', ')}`;
      }
    } else {
      sceneDescription = `Scene ${sceneNumber}: ${prompt.substring(0, 100)}`;
    }

    // Build image search query from story context
    let imageQuery = 'cartoon';
    
    if (sceneLocation) {
      // Extract location keywords
      const locationLower = sceneLocation.toLowerCase();
      if (locationLower.includes('forest') || locationLower.includes('jungle') || locationLower.includes('woods')) {
        imageQuery = 'cartoon forest magical';
      } else if (locationLower.includes('castle') || locationLower.includes('palace') || locationLower.includes('kingdom')) {
        imageQuery = 'cartoon castle fantasy';
      } else if (locationLower.includes('beach') || locationLower.includes('ocean') || locationLower.includes('sea')) {
        imageQuery = 'cartoon beach ocean';
      } else if (locationLower.includes('city') || locationLower.includes('town') || locationLower.includes('village')) {
        imageQuery = 'cartoon village town';
      } else if (locationLower.includes('mountain') || locationLower.includes('hill')) {
        imageQuery = 'cartoon mountain landscape';
      } else if (locationLower.includes('cave') || locationLower.includes('tunnel')) {
        imageQuery = 'cartoon cave adventure';
      } else if (locationLower.includes('garden') || locationLower.includes('flower')) {
        imageQuery = 'cartoon garden flowers';
      } else {
        // Use location directly
        imageQuery = `cartoon ${sceneLocation}`;
      }
    } else if (storyGenre) {
      imageQuery = `cartoon ${storyGenre}`;
    }

    // Add character context to image query if available
    if (sceneCharacters.length > 0) {
      const charNames = sceneCharacters.slice(0, 2).join(' ');
      imageQuery += ` ${charNames}`;
    }

    // Get background image from Unsplash (free tier)
    let backgroundUrl = '';
    
    if (UNSPLASH_ACCESS_KEY) {
      try {
        const unsplashResponse = await fetch(
          `https://api.unsplash.com/photos/random?query=${encodeURIComponent(imageQuery)}&orientation=landscape`,
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

    // Fallback: Use seed-based image that matches the scene
    if (!backgroundUrl) {
      // Create a seed from scene details for consistent images
      const seedString = `${sceneNumber}-${sceneLocation || prompt}-${storyTitle || ''}`;
      const seed = seedString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      backgroundUrl = `https://picsum.photos/seed/${seed}/800/600`;
    }

    // Use characters from story context
    const suggestedCharacters = sceneCharacters.length > 0 
      ? sceneCharacters 
      : (allCharacters.length > 0 
          ? allCharacters.slice(0, 3).map((c: any) => c.name || c)
          : ['Hero', 'Friend', 'Villain']);

    return NextResponse.json({
      description: sceneDescription,
      backgroundUrl: backgroundUrl,
      suggestedCharacters: suggestedCharacters,
    });
  } catch (error: any) {
    console.error('Scene generation error:', error);
    
    // Return mock data with preserved sceneNumber
    return NextResponse.json({
      description: `Scene ${1}: A beautiful cartoon scene`,
      backgroundUrl: `https://picsum.photos/800/600?random=${Date.now()}`,
      suggestedCharacters: ['Hero', 'Sidekick', 'Villain'],
    });
  }
}