import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { question, transcript, context_type, content_title } = await req.json();

        const user = await base44.auth.me();
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!question || !transcript) {
            return Response.json({ error: 'Missing question or transcript' }, { status: 400 });
        }

        const prompt = `
You are a helpful AI assistant for a creator community.
The user is asking a question about a specific piece of content: "${content_title}".

Context (Transcript):
"""
${transcript.substring(0, 50000)} 
"""
(Transcript truncated to 50k chars if longer to fit context window)

User Question:
${question}

Answer the question based ONLY on the provided transcript. If the answer is not in the transcript, say "I couldn't find the answer in the content provided."
Keep the answer concise and helpful.
`;

        const response = await base44.integrations.Core.InvokeLLM({
            prompt: prompt,
            add_context_from_internet: false
        });

        return Response.json({ answer: response });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});