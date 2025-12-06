import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// Initialize Groq client
const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured');
  return new Groq({ apiKey });
};

// Hugging Face API configuration
const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models';
const HUGGINGFACE_MODEL = 'gpt2'; // Reliable model for story generation (can be changed to mistralai/Mistral-7B-Instruct-v0.2 or meta-llama/Llama-2-7b-chat-hf)

// Initialize Hugging Face client
const getHuggingFaceHeaders = () => {
  const apiToken = process.env.HUGGINGFACE_API_TOKEN;
  if (!apiToken) throw new Error('HUGGINGFACE_API_TOKEN is not configured');
  return {
    'Authorization': `Bearer ${apiToken}`,
    'Content-Type': 'application/json',
  };
};

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 30,
  windowMs: 60 * 1000,
};

// Simple in-memory rate limiter
const requestTracker = new Map<string, { count: number; resetTime: number }>();

const checkRateLimit = (ip: string) => {
  const now = Date.now();
  const userData = requestTracker.get(ip);
  
  if (!userData || now > userData.resetTime) {
    requestTracker.set(ip, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
    return true;
  }
  
  if (userData.count >= RATE_LIMIT.maxRequests) {
    return false;
  }
  
  userData.count++;
  return true;
};

export async function POST(request: NextRequest) {
  const clientIp = request.headers.get('x-forwarded-for') || request.ip || 'unknown';
  
  try {
    // Validate request
    const { prompt, genre = 'fantasy', ageGroup = 'children', length = 'medium' } = await request.json();
    
    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: 'Story prompt is required' },
        { status: 400 }
      );
    }

    // Check rate limit
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: `Please try again in a minute. Free tier allows ${RATE_LIMIT.maxRequests} requests per minute.`
        },
        { status: 429 }
      );
    }

    console.log(`📖 Generating story for: "${prompt}"`);
    
    // Try Groq first, fallback to Hugging Face
    let story: string;
    let modelUsed = 'llama-3.1-8b-instant';
    
    try {
      story = await generateStoryWithGroq({
        prompt: prompt.trim(),
        genre,
        ageGroup,
        length
      });
      console.log(`✅ Story generated with Groq (${story.length} characters)`);
    } catch (groqError: any) {
      console.warn('⚠️ Groq failed, trying Hugging Face:', groqError.message);
      
      // Fallback to Hugging Face
      try {
        story = await generateStoryWithHuggingFace({
          prompt: prompt.trim(),
          genre,
          ageGroup,
          length
        });
        modelUsed = HUGGINGFACE_MODEL;
        console.log(`✅ Story generated with Hugging Face (${story.length} characters)`);
      } catch (hfError: any) {
        console.error('❌ Both Groq and Hugging Face failed');
        throw new Error(`Story generation failed. Groq error: ${groqError.message}. Hugging Face error: ${hfError.message}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      story,
      format: 'structured',
      model: modelUsed,
      length: story.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Story generation error:', error);
    
    // User-friendly error messages
    let errorMessage = 'Failed to generate story';
    let statusCode = 500;
    let instructions = '';
    
    if (error.message.includes('GROQ_API_KEY')) {
      errorMessage = 'API key not configured';
      instructions = 'Get a free API key from https://console.groq.com and add GROQ_API_KEY=your_key to .env.local';
      statusCode = 400;
    } else if (error.message.includes('rate limit')) {
      errorMessage = 'Rate limit exceeded';
      statusCode = 429;
      instructions = 'Free tier has limits. Wait a minute or upgrade your plan.';
    } else if (error.message.includes('quota')) {
      errorMessage = 'API quota exceeded';
      instructions = 'Check your Groq console for quota limits.';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Request timeout';
      instructions = 'The story was taking too long. Try a simpler prompt.';
    } else if (error.message.includes('Invalid API key')) {
      errorMessage = 'Invalid API key';
      instructions = 'Check your GROQ_API_KEY in .env.local';
      statusCode = 401;
    } else if (error.message.includes('decommissioned') || error.message.includes('Model has been decommissioned')) {
      errorMessage = 'Model has been decommissioned';
      instructions = 'The AI model has been updated. The code has been fixed to use llama-3.1-8b-instant. Please try again.';
      statusCode = 400;
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        details: error.message,
        instructions,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  }
}

// Story generation with Groq
async function generateStoryWithGroq(options: {
  prompt: string;
  genre: string;
  ageGroup: string;
  length: 'short' | 'medium' | 'long';
}): Promise<string> {
  const { prompt, genre, ageGroup, length } = options;
  
  const groq = getGroqClient();
  
  // Define length constraints
  const lengthConfig = {
    short: { maxTokens: 800, sceneCount: 3 },
    medium: { maxTokens: 1200, sceneCount: 4 },
    long: { maxTokens: 2000, sceneCount: 5 }
  }[length];
  
  // Create system prompt for cartoon story format
  const systemPrompt = `You are a professional children's cartoon story writer. 
Create a story about "${prompt}" with this EXACT format:

=== STORY START ===
TITLE: [Creative Title Here]
GENRE: ${genre}
AGE GROUP: ${ageGroup}

SUMMARY: [2-3 sentence engaging summary]

CHARACTERS:
• [Character 1 name] - [Brief description, age, personality]
• [Character 2 name] - [Brief description, age, personality]

${Array.from({ length: lengthConfig.sceneCount }, (_, i) => 
`SCENE ${i + 1}: [Scene title]
LOCATION: [Vivid location description]
CHARACTERS: [Character names present]
ACTION: [What happens in this scene]
DIALOGUE: ["Character name says: 'Actual spoken dialogue here'", "Another character says: 'More dialogue here'"]

`).join('')}

MORAL: [The lesson learned]

STORY ENDING: [1-2 sentence conclusion]
=== STORY END ===

CRITICAL REQUIREMENTS:
1. EVERY scene MUST have dialogue in the DIALOGUE field
2. Dialogue must be in quotes with character names, like: "Character Name: 'What they say'"
3. Include at least 2-3 lines of dialogue per scene
4. Make it ${ageGroup}-appropriate
5. Include colorful, animated descriptions
6. Each scene should advance the plot
7. Dialogue should reveal character personality and move the story forward
8. Keep sentences simple and engaging`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Create a ${genre} story for ${ageGroup} about: ${prompt}` }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.8,
      max_tokens: lengthConfig.maxTokens,
      top_p: 0.9,
      stream: false,
    });
    
    const story = completion.choices[0]?.message?.content;
    
    if (!story) {
      throw new Error('No story generated - empty response from AI');
    }
    
    // Validate the story format
    if (!story.includes('=== STORY START ===') || !story.includes('=== STORY END ===')) {
      console.warn('⚠️ Story format warning - adding headers');
      return `=== STORY START ===\n${story}\n=== STORY END ===`;
    }
    
    return story;
    
  } catch (error: any) {
    // Handle Groq API errors
    console.error('Groq API error:', error);
    
    // Check for HTTP status codes
    if (error.status || error.statusCode) {
      const status = error.status || error.statusCode;
      switch (status) {
        case 401:
          throw new Error('Invalid API key - check your GROQ_API_KEY');
        case 429:
          throw new Error('Rate limit exceeded - free tier has limits');
        case 503:
          throw new Error('Service temporarily unavailable - try again soon');
        default:
          throw new Error(`API error: ${status} - ${error.message || 'Unknown error'}`);
      }
    }
    
    // Check for specific Groq error messages
    if (error.message) {
      if (error.message.includes('API key') || error.message.includes('authentication')) {
        throw new Error('Invalid API key - check your GROQ_API_KEY');
      }
      if (error.message.includes('rate limit') || error.message.includes('quota')) {
        throw new Error('Rate limit exceeded - free tier has limits');
      }
      if (error.message.includes('decommissioned') || error.message.includes('model') || error.message.includes('not found')) {
        throw new Error('Model not available - the model has been decommissioned. Please update the model name in the code.');
      }
    }
    
    // Check for Groq error object structure
    if (error.error && error.error.message) {
      if (error.error.message.includes('decommissioned')) {
        throw new Error('Model has been decommissioned. Please update to a current model.');
      }
      if (error.error.code === 'model_decommissioned') {
        throw new Error('Model has been decommissioned. Please update to a current model.');
      }
    }
    
    throw error;
  }
}

// Story generation with Hugging Face
async function generateStoryWithHuggingFace(options: {
  prompt: string;
  genre: string;
  ageGroup: string;
  length: 'short' | 'medium' | 'long';
}): Promise<string> {
  const { prompt, genre, ageGroup, length } = options;
  
  const headers = getHuggingFaceHeaders();
  
  // Define length constraints
  const lengthConfig = {
    short: { maxLength: 800, sceneCount: 3 },
    medium: { maxLength: 1200, sceneCount: 4 },
    long: { maxLength: 2000, sceneCount: 5 }
  }[length];
  
  // Create the full prompt for Hugging Face
  const fullPrompt = `You are a professional children's cartoon story writer. 
Create a ${genre} story for ${ageGroup} about: ${prompt}

Format the story EXACTLY like this:

=== STORY START ===
TITLE: [Creative Title Here]
GENRE: ${genre}
AGE GROUP: ${ageGroup}

SUMMARY: [2-3 sentence engaging summary]

CHARACTERS:
• [Character 1 name] - [Brief description, age, personality]
• [Character 2 name] - [Brief description, age, personality]

${Array.from({ length: lengthConfig.sceneCount }, (_, i) => 
`SCENE ${i + 1}: [Scene title]
LOCATION: [Vivid location description]
CHARACTERS: [Character names present]
ACTION: [What happens in this scene]
DIALOGUE: ["Character dialogue in quotes"]

`).join('')}

MORAL: [The lesson learned]

STORY ENDING: [1-2 sentence conclusion]
=== STORY END ===

Guidelines:
1. Make it ${ageGroup}-appropriate
2. Include colorful, animated descriptions
3. Each scene should advance the plot
4. Include fun dialogue that reveals character
5. Keep sentences simple and engaging`;

  try {
    const response = await fetch(`${HUGGINGFACE_API_URL}/${HUGGINGFACE_MODEL}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        inputs: fullPrompt,
        parameters: {
          max_new_tokens: lengthConfig.maxLength,
          temperature: 0.8,
          top_p: 0.9,
          return_full_text: false,
        },
        options: {
          wait_for_model: true,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Handle Hugging Face response format
    let story: string;
    if (Array.isArray(data) && data[0]?.generated_text) {
      story = data[0].generated_text;
    } else if (data.generated_text) {
      story = data.generated_text;
    } else if (typeof data === 'string') {
      story = data;
    } else {
      throw new Error('Unexpected response format from Hugging Face');
    }

    if (!story || story.trim().length === 0) {
      throw new Error('No story generated - empty response from Hugging Face');
    }

    // Validate the story format
    if (!story.includes('=== STORY START ===') || !story.includes('=== STORY END ===')) {
      console.warn('⚠️ Story format warning - adding headers');
      return `=== STORY START ===\n${story}\n=== STORY END ===`;
    }

    return story;

  } catch (error: any) {
    console.error('Hugging Face API error:', error);
    
    if (error.message.includes('HUGGINGFACE_API_TOKEN')) {
      throw new Error('Invalid API token - check your HUGGINGFACE_API_TOKEN');
    }
    
    if (error.message.includes('model is currently loading')) {
      throw new Error('Model is loading, please wait a moment and try again');
    }
    
    throw error;
  }
}

// Optional: GET endpoint for health check
export async function GET() {
  const apiKeyConfigured = !!process.env.GROQ_API_KEY;
  
  return NextResponse.json({
    status: 'operational',
    service: 'Groq Story Generator',
    api_key_configured: apiKeyConfigured,
    rate_limit: `${RATE_LIMIT.maxRequests} requests per minute`,
    supported_models: ['llama3-70b-8192', 'llama3-8b-8192', 'llama-3.1-8b-instant', 'gemma2-9b-it'],
    timestamp: new Date().toISOString(),
    instructions: apiKeyConfigured 
      ? 'POST /api/story with { prompt, genre?, ageGroup?, length? }'
      : 'Add GROQ_API_KEY to .env.local from https://console.groq.com'
  });
}