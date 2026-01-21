import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getAspectRatio = (width, height) => {
  if (width === height) return '1:1';
  if (width === 1024 && height === 768) return '4:3';
  if (width === 768 && height === 1024) return '3:4';
  if (width === 1280 && height === 768) return '16:9';
  if (width === 768 && height === 1280) return '9:16';
  return '1:1';
};

const mapSizeToDalleSize = (width, height) => {
  const sizes = ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'];
  const targetSize = width * height;
  
  let bestSize = '1024x1024';
  let bestDiff = Math.abs(1024 * 1024 - targetSize);
  
  for (const size of sizes) {
    const [w, h] = size.split('x').map(Number);
    const diff = Math.abs(w * h - targetSize);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestSize = size;
    }
  }
  
  return bestSize;
};

const makeDalleRequest = async (openaiApiKey, prompt, width, height, attempt = 1) => {
  try {
    const dalleSize = mapSizeToDalleSize(width, height);
    
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        n: 1,
        size: dalleSize,
        quality: 'standard',
        style: 'vivid'
      })
    });

    // Handle OpenAI error codes
    if (response.status === 400) {
      const errorText = await response.text();
      return { error: `Invalid prompt or parameters: ${errorText}`, status: 400 };
    }
    if (response.status === 401) {
      return { error: 'Invalid OpenAI API key - check your configuration', status: 401 };
    }
    if (response.status === 429) {
      if (attempt < 3) {
        const backoffMs = Math.pow(2, attempt - 1) * 1000;
        console.log(`Rate limit hit, retrying in ${backoffMs}ms (attempt ${attempt + 1}/3)`);
        await sleep(backoffMs);
        return makeDalleRequest(openaiApiKey, prompt, width, height, attempt + 1);
      }
      return { error: 'Rate limit reached - please wait a moment', status: 429 };
    }
    if (response.status === 500 || response.status === 503) {
      if (attempt < 3) {
        const backoffMs = Math.pow(2, attempt - 1) * 1000;
        console.log(`OpenAI service error, retrying in ${backoffMs}ms (attempt ${attempt + 1}/3)`);
        await sleep(backoffMs);
        return makeDalleRequest(openaiApiKey, prompt, width, height, attempt + 1);
      }
      return { error: 'OpenAI service error - retrying...', status: 500 };
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI DALL-E API error:', response.status, errorText);
      return { error: `API error (${response.status}): ${errorText}`, status: response.status };
    }

    const result = await response.json();
    const imageUrl = result.data?.[0]?.url;
    
    if (!imageUrl) {
      console.error('No image URL in response:', JSON.stringify(result));
      return { error: 'No image generated', status: 500 };
    }

    return { url: imageUrl, size: dalleSize };
  } catch (error) {
    console.error('Request error:', error.message);
    throw error;
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, width, height } = await req.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const aspectRatio = getAspectRatio(width || 768, height || 768);
    console.log(`Generating image with aspect ratio: ${aspectRatio}`);

    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!googleApiKey) {
      return Response.json({ error: 'Image generation service not configured' }, { status: 500 });
    }

    const result = await makeGoogleImagenRequest(googleApiKey, prompt, aspectRatio);
    
    if (result.error) {
      return Response.json({ error: result.error }, { status: result.status || 500 });
    }

    return Response.json(result);

  } catch (error) {
    console.error('Error generating image:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});