import { NextRequest, NextResponse } from 'next/server';

// All available DiceBear v9.x styles (camelCase)
const DICEBEAR_STYLES = {
  adventurer: 'adventurer',
  'adventurer-neutral': 'adventurer-neutral',
  avataaars: 'avataaars',
  'avataaars-neutral': 'avataaars-neutral',
  'big-ears': 'big-ears',
  'big-ears-neutral': 'big-ears-neutral',
  'big-smile': 'big-smile',
  bottts: 'bottts',
  'bottts-neutral': 'bottts-neutral',
  croodles: 'croodles',
  'croodles-neutral': 'croodles-neutral',
  'fun-emoji': 'fun-emoji',
  icons: 'icons',
  identicon: 'identicon',
  lorelei: 'lorelei',
  'lorelei-neutral': 'lorelei-neutral',
  micah: 'micah',
  miniavs: 'miniavs',
  'open-peeps': 'open-peeps',
  personas: 'personas',
  'pixel-art': 'pixel-art',
  'pixel-art-neutral': 'pixel-art-neutral',
  shapes: 'shapes',
  thumbs: 'thumbs'
} as const;

type DiceBearStyle = keyof typeof DICEBEAR_STYLES;

// Map description to DiceBear style
function getDiceBearStyle(description: string): DiceBearStyle {
  const descLower = description.toLowerCase();
  
  if (descLower.includes('robot') || descLower.includes('cyborg')) {
    return 'bottts';
  } else if (descLower.includes('pixel') || descLower.includes('8bit')) {
    return 'pixel-art';
  } else if (descLower.includes('emoji') || descLower.includes('smiley')) {
    return 'fun-emoji';
  } else if (descLower.includes('icon') || descLower.includes('symbol')) {
    return 'icons';
  } else if (descLower.includes('identicon') || descLower.includes('github')) {
    return 'identicon';
  } else if (descLower.includes('minimal') || descLower.includes('simple')) {
    return 'miniavs';
  } else if (descLower.includes('shapes') || descLower.includes('geometric')) {
    return 'shapes';
  } else if (descLower.includes('thumbs') || descLower.includes('thumb')) {
    return 'thumbs';
  } else if (descLower.includes('neutral') || descLower.includes('professional')) {
    return 'avataaars-neutral';
  } else if (descLower.includes('colorful') || descLower.includes('vibrant')) {
    return 'lorelei';
  } else if (descLower.includes('cartoon') || descLower.includes('funny')) {
    return 'micah';
  } else if (descLower.includes('sketch') || descLower.includes('doodle')) {
    return 'open-peeps';
  } else if (descLower.includes('person') || descLower.includes('detailed')) {
    return 'personas';
  } else if (descLower.includes('adventure') || descLower.includes('explorer')) {
    return 'adventurer';
  } else if (descLower.includes('cute') || descLower.includes('sweet')) {
    return 'big-ears';
  } else if (descLower.includes('smile') || descLower.includes('happy')) {
    return 'big-smile';
  } else if (descLower.includes('croodle') || descLower.includes('monster')) {
    return 'croodles';
  }
  
  // Default to avataaars - most customizable for characters
  return 'avataaars';
}

// Generate DiceBear character with parameters based on description
function generateDiceBearCharacter(characterName: string, description: string): {
  imageUrl: string;
  style: string;
  params: Record<string, string>;
} {
  const style = getDiceBearStyle(description);
  const descLower = description.toLowerCase();
  const params = new URLSearchParams();
  
  // Always set seed for consistent generation
  params.set('seed', characterName || `character-${Date.now()}`);
  
  // Set format (SVG is default, but we specify it for clarity)
  params.set('format', 'svg');
  
  // Add parameters based on style
  switch (style) {
    case 'avataaars':
      configureAvataaars(params, descLower);
      break;
    case 'bottts':
      configureBottts(params, descLower);
      break;
    case 'micah':
      configureMicah(params, descLower);
      break;
    case 'lorelei':
      configureLorelei(params, descLower);
      break;
    case 'personas':
      configurePersonas(params, descLower);
      break;
    case 'pixel-art':
      configurePixelArt(params, descLower);
      break;
    case 'adventurer':
      configureAdventurer(params, descLower);
      break;
    case 'big-ears':
      configureBigEars(params, descLower);
      break;
    case 'open-peeps':
      configureOpenPeeps(params, descLower);
      break;
    default:
      // For other styles, just use default parameters
      params.set('backgroundColor', getBackgroundColor(descLower));
      break;
  }
  
  // Build the DiceBear URL
  const baseUrl = `https://api.dicebear.com/9.x/${style}/svg`;
  const imageUrl = `${baseUrl}?${params.toString()}`;
  
  // Convert params to object
  const paramsObj: Record<string, string> = {};
  params.forEach((value, key) => {
    paramsObj[key] = value;
  });
  
  return {
    imageUrl,
    style,
    params: paramsObj
  };
}

// Helper functions for each style
function configureAvataaars(params: URLSearchParams, descLower: string): void {
  // Background
  params.set('backgroundColor', getBackgroundColor(descLower));
  
  // Hair
  if (descLower.includes('long hair')) {
    params.set('top', 'longHair');
  } else if (descLower.includes('short hair')) {
    params.set('top', 'shortHair');
  } else if (descLower.includes('bald')) {
    params.set('top', 'noHair');
  }
  
  // Hair color
  if (descLower.includes('blonde')) params.set('hairColor', 'f8d25c');
  if (descLower.includes('brown hair')) params.set('hairColor', 'a78c5b');
  if (descLower.includes('black hair')) params.set('hairColor', '2c2c2c');
  if (descLower.includes('red hair')) params.set('hairColor', 'c2560a');
  if (descLower.includes('blue hair')) params.set('hairColor', '1e40af');
  if (descLower.includes('green hair')) params.set('hairColor', '15803d');
  if (descLower.includes('purple hair')) params.set('hairColor', '7c3aed');
  if (descLower.includes('pink hair')) params.set('hairColor', 'db2777');
  
  // Mouth
  if (descLower.includes('smile') || descLower.includes('happy')) {
    params.set('mouth', 'smile');
  } else if (descLower.includes('sad')) {
    params.set('mouth', 'sad');
  }
  
  // Eyes
  if (descLower.includes('happy')) params.set('eyes', 'happy');
  if (descLower.includes('sad')) params.set('eyes', 'sad');
  if (descLower.includes('closed')) params.set('eyes', 'closed');
  if (descLower.includes('wink')) params.set('eyes', 'wink');
  
  // Glasses
  if (descLower.includes('glasses')) {
    params.set('accessories', 'round');
    params.set('accessoriesProbability', '100');
  }
  
  // Facial hair
  if (descLower.includes('beard') || descLower.includes('mustache')) {
    params.set('facialHair', 'beard');
  }
}

function configureBottts(params: URLSearchParams, descLower: string): void {
  params.set('backgroundColor', getBackgroundColor(descLower));
  
  // Robot style
  if (descLower.includes('detailed')) params.set('style', 'detailed');
  if (descLower.includes('simple')) params.set('style', 'circles');
  
  // Robot color
  if (descLower.includes('silver') || descLower.includes('metal')) {
    params.set('color', 'd1d5db');
  } else if (descLower.includes('gold')) {
    params.set('color', 'fbbf24');
  } else if (descLower.includes('blue')) {
    params.set('color', '1d4ed8');
  } else if (descLower.includes('red')) {
    params.set('color', 'dc2626');
  } else if (descLower.includes('green')) {
    params.set('color', '16a34a');
  }
  
  // Light/eye color
  if (descLower.includes('blue light') || descLower.includes('blue eye')) {
    params.set('lightColor', '3b82f6');
  } else if (descLower.includes('red light') || descLower.includes('red eye')) {
    params.set('lightColor', 'ef4444');
  } else if (descLower.includes('green light') || descLower.includes('green eye')) {
    params.set('lightColor', '10b981');
  }
}

function configureMicah(params: URLSearchParams, descLower: string): void {
  params.set('backgroundColor', getBackgroundColor(descLower));
  
  // Face
  if (descLower.includes('happy')) params.set('face', 'happy');
  if (descLower.includes('sad')) params.set('face', 'sad');
  if (descLower.includes('surprised')) params.set('face', 'surprised');
  if (descLower.includes('angry')) params.set('face', 'angry');
  
  // Hair
  if (descLower.includes('short hair')) params.set('hair', 'short');
  if (descLower.includes('long hair')) params.set('hair', 'long');
  if (descLower.includes('bald')) params.set('hair', 'none');
  
  // Hair color
  if (descLower.includes('pink hair')) params.set('hairColor', 'f472b6');
  if (descLower.includes('blue hair')) params.set('hairColor', '60a5fa');
  if (descLower.includes('green hair')) params.set('hairColor', '34d399');
}

function configureLorelei(params: URLSearchParams, descLower: string): void {
  params.set('backgroundColor', getBackgroundColor(descLower));
  
  // Hair
  if (descLower.includes('long')) params.set('hair', 'long');
  if (descLower.includes('short')) params.set('hair', 'short');
  if (descLower.includes('bald')) params.set('hair', 'none');
  
  // Hair color
  if (descLower.includes('pink')) params.set('hairColor', 'pink');
  if (descLower.includes('blue')) params.set('hairColor', 'blue');
  if (descLower.includes('green')) params.set('hairColor', 'green');
  if (descLower.includes('purple')) params.set('hairColor', 'purple');
  
  // Accessories
  if (descLower.includes('flower') || descLower.includes('flowers')) {
    params.set('accessories', 'flower');
  }
  if (descLower.includes('glasses')) {
    params.set('accessories', 'glasses');
  }
}

function configurePersonas(params: URLSearchParams, descLower: string): void {
  params.set('backgroundColor', getBackgroundColor(descLower));
  
  // Clothing
  if (descLower.includes('shirt')) params.set('clothing', 'shirt');
  if (descLower.includes('hoodie')) params.set('clothing', 'hoodie');
  if (descLower.includes('formal')) params.set('clothing', 'formal');
  
  // Clothing color
  if (descLower.includes('red clothing')) params.set('clothingColor', 'red');
  if (descLower.includes('blue clothing')) params.set('clothingColor', 'blue');
  if (descLower.includes('green clothing')) params.set('clothingColor', 'green');
  
  // Accessories
  if (descLower.includes('glasses')) params.set('accessories', 'glasses');
}

function configurePixelArt(params: URLSearchParams, descLower: string): void {
  params.set('backgroundColor', getBackgroundColor(descLower));
  
  // Hair
  if (descLower.includes('short')) params.set('hair', 'short01,short02,short03');
  if (descLower.includes('long')) params.set('hair', 'long01,long02,long03');
  
  // Accessories
  if (descLower.includes('glasses')) params.set('accessories', 'glasses01,glasses02,glasses03');
}

function configureAdventurer(params: URLSearchParams, descLower: string): void {
  params.set('backgroundColor', getBackgroundColor(descLower));
  
  // Hair
  if (descLower.includes('short')) params.set('hair', 'short01,short02');
  if (descLower.includes('long')) params.set('hair', 'long01,long02');
  
  // Accessories
  if (descLower.includes('glasses')) params.set('accessories', 'glasses');
  if (descLower.includes('hat')) params.set('hat', 'hat01,hat02');
}

function configureBigEars(params: URLSearchParams, descLower: string): void {
  params.set('backgroundColor', getBackgroundColor(descLower));
  
  // Face
  if (descLower.includes('happy')) params.set('face', 'smile');
  if (descLower.includes('sad')) params.set('face', 'sad');
  
  // Hair
  if (descLower.includes('short')) params.set('hair', 'short');
  if (descLower.includes('long')) params.set('hair', 'long');
}

function configureOpenPeeps(params: URLSearchParams, descLower: string): void {
  params.set('backgroundColor', getBackgroundColor(descLower));
  
  // Body
  if (descLower.includes('sitting')) params.set('body', 'sitting');
  if (descLower.includes('standing')) params.set('body', 'standing');
  
  // Face
  if (descLower.includes('smile')) params.set('face', 'smile');
  if (descLower.includes('sad')) params.set('face', 'sad');
}

// Helper function to get background color
function getBackgroundColor(descLower: string): string {
  if (descLower.includes('blue background') || descLower.includes('sky')) {
    return '93c5fd';
  } else if (descLower.includes('green background') || descLower.includes('grass')) {
    return '86efac';
  } else if (descLower.includes('red background')) {
    return 'fca5a5';
  } else if (descLower.includes('yellow background') || descLower.includes('sun')) {
    return 'fde047';
  } else if (descLower.includes('purple background')) {
    return 'd8b4fe';
  } else if (descLower.includes('pink background')) {
    return 'f9a8d4';
  } else if (descLower.includes('orange background')) {
    return 'fdba74';
  } else if (descLower.includes('gray background') || descLower.includes('grey background')) {
    return 'd1d5db';
  } else if (descLower.includes('black background')) {
    return '000000';
  } else if (descLower.includes('white background')) {
    return 'ffffff';
  }
  
  // Default gradient
  return 'b6e3f4,c0aede,d1d4f9';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const characterName = body.characterName || 'Character';
    const description = body.description || '';
    
    console.log(`Generating DiceBear character: ${characterName}`);
    console.log(`Description: ${description}`);
    
    // Generate with DiceBear
    const { imageUrl, style, params } = generateDiceBearCharacter(characterName, description);
    
    console.log(`Generated with style: ${style}`);
    console.log(`URL: ${imageUrl.substring(0, 100)}...`);
    
    return NextResponse.json({
      success: true,
      name: characterName,
      description: description,
      imageUrl: imageUrl,
      characterType: 'dicebear_avatar',
      style: style,
      parameters: params,
      note: `Generated with DiceBear ${style} style. Using v9.x API.`
    });
    
  } catch (error: any) {
    console.error('Character generation error:', error);
    
    // Simple fallback
    const body = await request.json().catch(() => ({}));
    const name = body?.characterName || 'Character';
    const desc = body?.description || '';
    
    // Fallback with basic avataaars
    const seed = encodeURIComponent(name);
    const fallbackUrl = `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4&mouth=smile&eyes=happy`;
    
    return NextResponse.json({
      success: true,
      name: name,
      description: desc,
      imageUrl: fallbackUrl,
      characterType: 'avatar',
      style: 'avataaars',
      note: 'Fallback avatar generated'
    });
  }
}