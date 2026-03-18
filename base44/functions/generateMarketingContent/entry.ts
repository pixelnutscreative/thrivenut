import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { feature, contentType, targetAudience = "creators", tone = "Pixel Style (Humorous)" } = await req.json();

        if (!feature || !contentType) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const prompt = `
        You are an expert social media marketer for "Thrive Nut", an all-in-one life and creator management app.
        
        Write marketing content for the following feature: "${feature}"
        Content Type: ${contentType}
        Target Audience: ${targetAudience}
        Tone: ${tone}

        Context about Thrive Nut:
        - It combines personal wellness (habits, journaling, health) with professional creator tools.
        - "Social Media Suite" features (TikTok CRM, Live Schedule, Battle Prep) are premium upgrades.
        - If tone is "Pixel Style", be encouraging, slightly witty, and focused on "organizing the chaos" with humor.
        - If tone is "Neurospicy Friendly", be direct, avoid fluff, and focus on dopamine/executive function support.

        Specific instructions for the content:
        - If the feature is "TikTok Engagement" or "Creator CRM", emphasize that this is part of the "Social Media Suite" upgrade.
        - Focus on the benefit: saving time, reducing overwhelm, making more money, or feeling better.
        - Use emojis relevant to the feature.
        - If it's a script, include scene direction in [brackets].
        - If it's a caption, include 3-5 relevant hashtags including #ThriveNut.

        Return ONLY the generated content text, formatted nicely.
        `;

        const result = await base44.integrations.Core.InvokeLLM({
            prompt: prompt,
            response_json_schema: {
                type: "object",
                properties: {
                    content: { type: "string" }
                }
            }
        });

        return Response.json(result);

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});