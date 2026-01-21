import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

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

    // Call Nano Banana API with explicit dimensions
    const nanoBananaKey = Deno.env.get('NANO_BANANA_API_KEY');
    if (!nanoBananaKey) {
      return Response.json({ error: 'Image generation service not configured' }, { status: 500 });
    }

    const response = await fetch('https://api.nanobanana.ai/v1/images/generations', {
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Nano Banana error:', errorText);
      return Response.json({ error: 'Image generation failed' }, { status: 500 });
    }

    const result = await response.json();
    const imageUrl = result.images?.[0]?.url || result.image?.[0]?.url;
    
    if (!imageUrl) {
      console.error('No image URL in response:', result);
      return Response.json({ error: 'No image generated' }, { status: 500 });
    }

    return Response.json({ 
      url: imageUrl,
      width: normalizedWidth,
      height: normalizedHeight
    });

  } catch (error) {
    console.error('Error generating image:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});