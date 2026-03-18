import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, style, width, height } = await req.json();

    const apiKey = Deno.env.get('NANO_BANANA_API_KEY');
    if (!apiKey) {
      return Response.json({ error: 'Nano Banana API key not configured' }, { status: 500 });
    }

    // Construct full prompt with style
    const fullPrompt = style ? `${prompt}, ${style} style` : prompt;

    // Call Nano Banana API
    const response = await fetch('https://api.nanobanana.ai/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: fullPrompt,
        width: width || 512,
        height: height || 512,
        num_inference_steps: 30,
        guidance_scale: 7.5
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Nano Banana API error:', error);
      return Response.json({ error: 'Failed to generate image' }, { status: 500 });
    }

    const result = await response.json();
    
    return Response.json({ 
      image_url: result.images?.[0]?.url || result.image_url,
      prompt: fullPrompt
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});