import { NextRequest, NextResponse } from 'next/server';

// Groq Audio API configuration
const GROQ_API_URL = 'https://api.groq.com/openai/v1/audio/speech';
const GROQ_MODEL = 'playai-tts';
const DEFAULT_VOICE = 'Fritz-PlayAI';

const AVAILABLE_VOICES = [
  'Fritz-PlayAI',
];

export async function POST(request: NextRequest) {
  try {
    const { text, voice = DEFAULT_VOICE, response_format = 'wav' } = await request.json();

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: 'Text is required for audio generation' },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'Text is too long. Maximum 5000 characters.' },
        { status: 400 }
      );
    }

    // Validate voice
    if (!AVAILABLE_VOICES.includes(voice)) {
      return NextResponse.json(
        { error: `Invalid voice. Available voices: ${AVAILABLE_VOICES.join(', ')}` },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not configured' },
        { status: 500 }
      );
    }

    console.log(`🔊 Generating audio for text: "${text.substring(0, 50)}..."`);

    // Call Groq Audio API
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        input: text.trim(),
        voice: voice,
        response_format: response_format,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq Audio API error:', errorText);
      
      let errorMessage = 'Failed to generate audio';
      if (response.status === 401) {
        errorMessage = 'Invalid API key - check your GROQ_API_KEY';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded';
      } else if (response.status === 400) {
        errorMessage = `Invalid request: ${errorText}`;
      }

      return NextResponse.json(
        { error: errorMessage, details: errorText },
        { status: response.status }
      );
    }

    // Get the audio data
    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');

    console.log(`✅ Audio generated successfully (${audioBuffer.byteLength} bytes)`);

    return NextResponse.json({
      success: true,
      audio: audioBase64,
      format: response_format,
      voice: voice,
      text_length: text.length,
      audio_size: audioBuffer.byteLength,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Audio generation error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate audio',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET endpoint for health check and available voices
export async function GET() {
  const apiKeyConfigured = !!process.env.GROQ_API_KEY;
  
  return NextResponse.json({
    status: 'operational',
    service: 'Groq Audio TTS',
    api_key_configured: apiKeyConfigured,
    model: GROQ_MODEL,
    available_voices: AVAILABLE_VOICES,
    default_voice: DEFAULT_VOICE,
    supported_formats: ['wav'],
    max_text_length: 5000,
    timestamp: new Date().toISOString(),
    instructions: apiKeyConfigured 
      ? 'POST /api/audio/speech with { text, voice?, response_format? }'
      : 'Add GROQ_API_KEY to .env.local from https://console.groq.com'
  });
}

