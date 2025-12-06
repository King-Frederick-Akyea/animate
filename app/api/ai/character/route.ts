import { NextRequest, NextResponse } from 'next/server';

// Character image generation using DiceBear API with description-based seeding
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const characterName = body.characterName || 'Character';
    const description = body.description || '';

    // Use description to determine avatar style and seed
    const descriptionLower = description.toLowerCase();
    
    // Choose style based on description keywords
    let avatarStyle = 'avataaars'; // default
    if (descriptionLower.includes('robot') || descriptionLower.includes('cyborg')) {
      avatarStyle = 'bottts';
    } else if (descriptionLower.includes('animal') || descriptionLower.includes('bear') || descriptionLower.includes('rabbit')) {
      avatarStyle = 'personas';
    } else if (descriptionLower.includes('cute') || descriptionLower.includes('fun')) {
      avatarStyle = 'micah';
    } else if (descriptionLower.includes('mini') || descriptionLower.includes('small')) {
      avatarStyle = 'miniavs';
    }

    // Create a seed from name + description for consistent generation
    const seed = `${characterName}-${description}`.substring(0, 50);
    const encodedSeed = encodeURIComponent(seed);
    
    // Generate character description
    const charDescription = description.trim() || `A cartoon character named ${characterName}`;

    // Generate avatar URL with seed based on name and description
    const imageUrl = `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${encodedSeed}&backgroundColor=4f46e5&radius=50`;

    return NextResponse.json({
      name: characterName,
      description: charDescription,
      imageUrl: imageUrl,
      characterType: 'cartoon',
    });
  } catch (error: any) {
    console.error('Character generation error:', error);
    
    // Fallback character data
    return NextResponse.json({
      name: 'Character',
      description: 'A friendly cartoon character',
      imageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`,
      characterType: 'cartoon',
    });
  }
}