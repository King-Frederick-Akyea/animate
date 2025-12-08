import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const characterName = body.characterName || 'Character';
    const description = body.description || '';

    // Choose avatar style based on description keywords
    const descLower = description.toLowerCase();
    let avatarStyle = 'avataaars'; // default
    
    if (descLower.includes('robot') || descLower.includes('cyborg') || descLower.includes('mech')) {
      avatarStyle = 'bottts';
    } else if (descLower.includes('animal') || descLower.includes('bear') || 
               descLower.includes('rabbit') || descLower.includes('cat') ||
               descLower.includes('dog') || descLower.includes('fox')) {
      avatarStyle = 'personas';
    } else if (descLower.includes('cute') || descLower.includes('kawaii') || 
               descLower.includes('chibi')) {
      avatarStyle = 'micah';
    } else if (descLower.includes('pixel') || descLower.includes('8bit')) {
      avatarStyle = 'pixel-art';
    } else if (descLower.includes('minimal') || descLower.includes('simple')) {
      avatarStyle = 'miniavs';
    } else if (descLower.includes('adventure') || descLower.includes('hero')) {
      avatarStyle = 'adventurer';
    }

    // Create a seed from the character name and description
    const seed = `${characterName}-${description.substring(0, 50)}`.replace(/[^a-zA-Z0-9]/g, '-');
    const encodedSeed = encodeURIComponent(seed);
    
    // Create the image URL with simple customization
    const imageUrl = `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${encodedSeed}&backgroundColor=4f46e5&radius=50`;

    return NextResponse.json({
      success: true,
      name: characterName,
      description: description,
      imageUrl: imageUrl,
      characterType: 'cartoon'
    });
  } catch (error: any) {
    console.error('Character generation error:', error);
    
    // Simple fallback - use DiceBear with the character name as seed
    const body = await request.json().catch(() => ({}));
    const name = body?.characterName || 'Character';
    const desc = body?.description || 'A cartoon character';
    
    const fallbackSeed = encodeURIComponent(name);
    const fallbackUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${fallbackSeed}&backgroundColor=4f46e5&radius=50`;
    
    return NextResponse.json({
      success: true,
      name: name,
      description: desc,
      imageUrl: fallbackUrl,
      characterType: 'cartoon'
    });
  }
}