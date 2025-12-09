import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

// Initialize Groq client for AI scene descriptions
const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  return new Groq({ apiKey });
};

// Generate enhanced scene description using AI
async function generateAISceneDescription(options: {
  sceneNumber: number;
  sceneTitle: string;
  sceneLocation: string;
  sceneAction: string;
  sceneCharacters: string[];
  storyTitle?: string;
  storyGenre?: string;
  storyContext?: string;
  dialogue?: string;
}): Promise<string> {
  const groq = getGroqClient();
  if (!groq) {
    // Fallback to basic description if Groq is not available
    return `Scene ${options.sceneNumber}: ${options.sceneTitle}\nLocation: ${options.sceneLocation}\nAction: ${options.sceneAction}${options.sceneCharacters.length > 0 ? `\nCharacters: ${options.sceneCharacters.join(', ')}` : ''}`;
  }

  try {
    const systemPrompt = `You are a professional cartoon animation scene director. Create a vivid, detailed scene description for a children's cartoon animation.

Your task is to create an engaging scene description that:
1. Captures the visual atmosphere and mood
2. Describes the setting in colorful, animated terms
3. Mentions the characters present and their actions
4. Sets up the scene for animation
5. Is appropriate for children's content
6. Is concise but descriptive (2-3 sentences)

Format your response as a single paragraph scene description, not a list.`;

    const userPrompt = `Create a scene description for:

Story: ${options.storyTitle || 'A cartoon story'}
Genre: ${options.storyGenre || 'fantasy'}
Scene ${options.sceneNumber}: ${options.sceneTitle}
Location: ${options.sceneLocation}
Action: ${options.sceneAction}
Characters: ${options.sceneCharacters.join(', ') || 'Various characters'}
${options.dialogue ? `Dialogue: ${options.dialogue}` : ''}
${options.storyContext ? `Story Context: ${options.storyContext}` : ''}

Create a vivid, animated scene description that brings this scene to life for a children's cartoon.`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 200,
      top_p: 0.9,
      stream: false,
    });

    const aiDescription = completion.choices[0]?.message?.content?.trim();
    if (aiDescription) {
      return aiDescription;
    }
  } catch (error) {
    console.error('AI scene description generation error:', error);
  }

  // Fallback to structured description
  return `Scene ${options.sceneNumber}: ${options.sceneTitle}\nLocation: ${options.sceneLocation}\nAction: ${options.sceneAction}${options.sceneCharacters.length > 0 ? `\nCharacters: ${options.sceneCharacters.join(', ')}` : ''}`;
}

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
      storyContext,
      dialogue
    } = body;

    // Generate AI-enhanced scene description
    let sceneDescription = '';
    if (sceneTitle && sceneLocation && sceneAction) {
      sceneDescription = await generateAISceneDescription({
        sceneNumber,
        sceneTitle,
        sceneLocation,
        sceneAction,
        sceneCharacters: Array.isArray(sceneCharacters) ? sceneCharacters : [],
        storyTitle,
        storyGenre,
        storyContext,
        dialogue
      });
    } else {
      sceneDescription = `Scene ${sceneNumber}: ${prompt.substring(0, 100)}`;
    }

    let imageQuery = 'cartoon';
    
    if (sceneLocation) {
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
        imageQuery = `cartoon ${sceneLocation}`;
      }
    } else if (storyGenre) {
      imageQuery = `cartoon ${storyGenre}`;
    }

    if (sceneCharacters.length > 0) {
      const charNames = sceneCharacters.slice(0, 2).join(' ');
      imageQuery += ` ${charNames}`;
    }

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

    if (!backgroundUrl) {
      const seedString = `${sceneNumber}-${sceneLocation || prompt}-${storyTitle || ''}`;
      const seed = seedString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      backgroundUrl = `https://picsum.photos/seed/${seed}/800/600`;
    }

    const suggestedCharacters = sceneCharacters.length > 0 
      ? sceneCharacters 
      : (allCharacters.length > 0 
          ? allCharacters.slice(0, 3).map((c: any) => c.name || c)
          : ['Hero', 'Friend', 'Villain']);

    return NextResponse.json({
      success: true,
      description: sceneDescription,
      backgroundUrl: backgroundUrl,
      suggestedCharacters: suggestedCharacters,
      sceneTitle: sceneTitle || `Scene ${sceneNumber}`,
      sceneLocation: sceneLocation || '',
      sceneAction: sceneAction || '',
    });
  } catch (error: any) {
    console.error('Scene generation error:', error);
    
    // Fallback response
    // const fallbackDescription = sceneTitle && sceneLocation && sceneAction
    //   ? `Scene ${body.sceneNumber || 1}: ${sceneTitle}\nLocation: ${sceneLocation}\nAction: ${sceneAction}`
    //   : `Scene ${body.sceneNumber || 1}: A beautiful cartoon scene`;
    
    // return NextResponse.json({
    //   success: false,
    //   description: fallbackDescription,
    //   backgroundUrl: `https://picsum.photos/800/600?random=${Date.now()}`,
    //   suggestedCharacters: ['Hero', 'Sidekick', 'Villain'],
    //   sceneTitle: body.sceneTitle || `Scene ${body.sceneNumber || 1}`,
    //   sceneLocation: body.sceneLocation || '',
    //   sceneAction: body.sceneAction || '',
    // });
  }
}