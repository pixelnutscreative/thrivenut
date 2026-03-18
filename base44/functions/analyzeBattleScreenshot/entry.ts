import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload file first
    const uploadRes = await base44.integrations.Core.UploadFile({ file });
    const fileUrl = uploadRes.file_url;

    // Use AI to analyze the screenshot
    const analysisRes = await base44.integrations.Core.InvokeLLM({
      prompt: `Analyze this TikTok battle screenshot and extract the MVP (Most Valuable Player) information.
      
      Please identify and extract:
      1. The top 3 MVPs on the creator's side (our side) - their usernames and gift amounts
      2. The top 3 MVPs on the opponent's side - their usernames and gift amounts
      
      Return the data in this exact JSON format:
      {
        "our_mvps": [
          { "rank": 1, "username": "username1", "gifts_received": 5000 },
          { "rank": 2, "username": "username2", "gifts_received": 3000 },
          { "rank": 3, "username": "username3", "gifts_received": 1500 }
        ],
        "opponent_mvps": [
          { "rank": 1, "username": "opponent1", "gifts_received": 4000 },
          { "rank": 2, "username": "opponent2", "gifts_received": 2500 },
          { "rank": 3, "username": "opponent3", "gifts_received": 1000 }
        ]
      }
      
      If you cannot identify all top 3, include what you can find. Leave empty array if no MVP data is visible.`,
      file_urls: [fileUrl],
      response_json_schema: {
        type: 'object',
        properties: {
          our_mvps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                rank: { type: 'number' },
                username: { type: 'string' },
                gifts_received: { type: 'number' }
              }
            }
          },
          opponent_mvps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                rank: { type: 'number' },
                username: { type: 'string' },
                gifts_received: { type: 'number' }
              }
            }
          }
        }
      }
    });

    return Response.json({
      our_mvps: analysisRes.our_mvps || [],
      opponent_mvps: analysisRes.opponent_mvps || []
    });
  } catch (error) {
    console.error('Screenshot analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});