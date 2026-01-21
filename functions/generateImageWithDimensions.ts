import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const makeNanoBananaRequest = async (nanoBananaKey, prompt, normalizedWidth, normalizedHeight, attempt = 1) => {
  try {
    const response = await fetch('https://api.nanobanana.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${nanoBananaKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: prompt,
        width: normalizedWidth,
        height: normalizedHeight,
        num_inference_steps: 25,
        guidance_scale: 7.5
      })
    });

    // Handle specific error codes
    if (response.status === 401) {
      return { error: 'Invalid API key - please check your Nano Banana configuration', status: 401 };
    }
    if (response.status === 429) {
      if (attempt < 3) {
        const backoffMs = Math.pow(2, attempt - 1) * 1000;
        console.log(`Rate limit hit, retrying in ${backoffMs}ms (attempt ${attempt + 1}/3)`);
        await sleep(backoffMs);
        return makeNanoBananaRequest(nanoBananaKey, prompt, normalizedWidth, normalizedHeight, attempt + 1);
      }
      return { error: 'Rate limit reached - please try again in a moment', status: 429 };
    }
    if (response.status === 500) {
      if (attempt < 3) {
        const backoffMs = Math.pow(2, attempt - 1) * 1000;
        console.log(`Service error, retrying in ${backoffMs}ms (attempt ${attempt + 1}/3)`);
        await sleep(backoffMs);
        return makeNanoBananaRequest(nanoBananaKey, prompt, normalizedWidth, normalizedHeight, attempt + 1);
      }
      return { error: 'Service temporarily unavailable - retrying in 5 seconds', status: 500 };
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Nano Banana API error:', response.status, errorText);
      return { error: `API error (${response.status}): ${errorText}`, status: response.status };
    }

    const result = await response.json();
    const imageUrl = result.images?.[0]?.url || result.image?.[0]?.url;
    
    if (!imageUrl) {
      console.error('No image URL in response:', JSON.stringify(result));
      return { error: `No image URL returned: ${JSON.stringify(result)}`, status: 500 };
    }

    return { url: imageUrl, width: normalizedWidth, height: normalizedHeight };
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

    const { prompt, width, height, referenceImageUrls } = await req.json();

    if (!width || !height) {
      return Response.json({ error: 'Width and height are required' }, { status: 400 });
    }

    // Normalize dimensions to valid Nano Banana sizes (must be multiples of 64)
    const normalizeSize = (size) => {
      const normalized = Math.round(size / 64) * 64;
      return Math.max(512, normalized);
    };

    const normalizedWidth = normalizeSize(width);
    const normalizedHeight = normalizeSize(height);

    console.log(`Generating image: ${normalizedWidth}x${normalizedHeight}`);

    const nanoBananaKey = Deno.env.get('NANO_BANANA_API_KEY');
    if (!nanoBananaKey) {
      return Response.json({ error: 'Image generation service not configured' }, { status: 500 });
    }

    const result = await makeNanoBananaRequest(nanoBananaKey, prompt, normalizedWidth, normalizedHeight);
    
    if (result.error) {
      return Response.json({ error: result.error }, { status: result.status || 500 });
    }

    return Response.json(result);

  } catch (error) {
    console.error('Error generating image:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});