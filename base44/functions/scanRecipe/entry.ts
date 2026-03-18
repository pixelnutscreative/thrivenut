import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { file_url } = await req.json();

        if (!file_url) {
            return Response.json({ error: 'No file URL provided' }, { status: 400 });
        }

        // Use LLM to extract recipe
        const result = await base44.integrations.Core.InvokeLLM({
            prompt: `
            Analyze this image of a recipe. 
            Extract the title, ingredients, and instructions.
            Format the output as a clean, readable text block suitable for a notes field.
            Example format:
            
            Title: [Recipe Name]
            
            Ingredients:
            - Item 1
            - Item 2
            
            Instructions:
            1. Step 1
            2. Step 2
            `,
            file_urls: [file_url], // Pass the image URL
            response_json_schema: {
                type: "object",
                properties: {
                    title: { type: "string" },
                    content: { type: "string" }
                }
            }
        });

        return Response.json(result);

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});