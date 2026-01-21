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

    // Try Nano Banana first (if API key available)
    const nanoBananaKey = Deno.env.get('NANO_BANANA_API_KEY');
    if (nanoBananaKey) {
      try {
        const response = await fetch('https://api.nanobanana.ai/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${nanoBananaKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt,
            width: width,
            height: height,
            num_inference_steps: 30,
            guidance_scale: 7.5
          })
        });

        if (response.ok) {
          const result = await response.json();
          return Response.json({ 
            url: result.images?.[0]?.url || result.image_url
          });
        }
      } catch (e) {
        console.warn('Nano Banana API failed, falling back to integration:', e.message);
      }
    }

    // Fallback to Core integration with dimension specification
    const imageResponse = await base44.integrations.Core.GenerateImage({
      prompt: `${prompt}\n\nMUST be exactly ${width}px × ${height}px (aspect ratio ${(width/height).toFixed(2)})`,
      existing_image_urls: referenceImageUrls
    });

    return Response.json({ 
      url: imageResponse.url
    });

  } catch (error) {
    console.error('Error generating image:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});