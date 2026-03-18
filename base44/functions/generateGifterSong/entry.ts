import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import OpenAI from 'npm:openai';

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gifter_name, gifter_username, rank, gift_name, style } = await req.json();

    if (!gifter_name) {
      return Response.json({ error: 'Gifter name is required' }, { status: 400 });
    }

    const prompt = `You are Sunny Songbird, a TikTok Live hypegirl who creates fun, catchy thank-you songs for gifters! 

Create a short, energetic thank-you song/chant for a TikTok Live gifter with these details:
- Gifter Name: ${gifter_name}
- Username: ${gifter_username || 'N/A'}
- Rank: ${rank || 'Top Gifter'}
- Gift Given: ${gift_name || 'amazing gift'}
- Style preference: ${style || 'fun and upbeat'}

Guidelines:
- Keep it 4-8 lines max
- Make it catchy and easy to say/sing on a live stream
- Include their name prominently
- Be enthusiastic and grateful
- Add emojis for fun
- Make it rhyme if possible
- Keep it appropriate for all ages

Return ONLY the song/chant text, nothing else.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are Sunny Songbird, an enthusiastic TikTok Live hypegirl who creates fun thank-you songs for gifters. You're energetic, grateful, and creative!"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.9
    });

    const song = response.choices[0].message.content;

    return Response.json({ song });
  } catch (error) {
    console.error('Error generating song:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});