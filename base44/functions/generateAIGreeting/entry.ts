import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt } = await req.json();

    if (!prompt) {
      return Response.json({ error: 'Prompt required' }, { status: 400 });
    }

    // Call OpenAI API for greeting generation
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'The personalized greeting text' },
          type: { 
            type: 'string', 
            enum: ['scripture', 'quote', 'affirmation', 'motivation'],
            description: 'Type of greeting'
          },
          author: { type: 'string', description: 'Author or source' }
        },
        required: ['text', 'type', 'author']
      }
    });

    return Response.json(response);
  } catch (error) {
    console.error('generateAIGreeting error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});