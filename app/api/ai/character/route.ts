import { NextRequest, NextResponse } from 'next/server';

// Free avatar generation using DiceBear API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const characterName = body.characterName || 'Character';
    const description = body.description || '';

    // Use DiceBear API for free avatars
    const avatarStyles = [
      'avataaars',  // Avatar style
      'bottts',     // Robot style
      'micah',      // Fun style
      'miniavs',    // Mini avatars
      'personas',   // Personas
    ];

    const randomStyle = avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
    
    // Generate character description based on name
    const characterTypes = ['heroic', 'funny', 'wise', 'playful', 'mysterious', 'friendly'];
    const randomType = characterTypes[Math.floor(Math.random() * characterTypes.length)];
    
    const charDescription = description 
      ? `${description.substring(0, 100)}...`
      : `A ${randomType} cartoon character named ${characterName} who loves adventures`;

    // Generate avatar URL
    const encodedName = encodeURIComponent(characterName);
    const imageUrl = `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${encodedName}&backgroundColor=4f46e5`;

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