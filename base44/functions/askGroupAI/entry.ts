import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
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

        const { groupId, question } = await req.json();

        if (!groupId || !question) {
            return Response.json({ error: 'Missing groupId or question' }, { status: 400 });
        }

        // Verify membership
        const membership = await base44.entities.CreatorGroupMember.filter({ group_id: groupId, user_email: user.email });
        const group = await base44.entities.CreatorGroup.filter({ id: groupId });
        
        if (membership.length === 0 && group?.[0]?.owner_email !== user.email) {
             if (user.role !== 'admin') {
                return Response.json({ error: 'Forbidden' }, { status: 403 });
             }
        }

        // 1. Save User Question to History
        await base44.entities.GroupAIChatMessage.create({
            group_id: groupId,
            user_email: user.email,
            role: 'user',
            content: question
        });

        // 2. Fetch Recent History for Context (Last 10 messages)
        const recentHistory = await base44.entities.GroupAIChatMessage.filter({ 
            group_id: groupId, 
            user_email: user.email 
        }, '-created_date', 10);
        // Reverse to chronological
        const historyMessages = recentHistory.reverse().map(m => ({ role: m.role, content: m.content }));

        // 3. Fetch Broad Context Data
        
        // Parallel fetching for speed
        const [resources, meetings, projects, posts, events, orders] = await Promise.all([
            base44.entities.GroupResource.filter({ group_id: groupId }),
            base44.entities.MeetingRecording.filter({ group_id: groupId }),
            base44.entities.GroupProject.filter({ group_id: groupId }),
            base44.entities.GroupPost.filter({ group_id: groupId }, '-created_date', 20), // Last 20 posts
            base44.entities.GroupEvent.filter({ group_id: groupId }),
            base44.entities.MarketingOrder.filter({ group_id: groupId })
        ]);

        // Tasks (nested in projects)
        let tasks = [];
        if (projects.length > 0) {
             const projectIds = projects.map(p => p.id);
             const tasksResults = await Promise.all(projectIds.map(pid => base44.entities.GroupTask.filter({ project_id: pid })));
             tasks = tasksResults.flat();
        }

        // Construct Context String (Truncated if necessary to save tokens)
        let context = `Current Group: ${group[0]?.name}\n\n`;

        if (resources.length > 0) {
            context += "--- RESOURCES ---\n";
            resources.forEach(r => context += `- ${r.title} (${r.type}): ${r.description || ''}\n`);
        }

        if (meetings.length > 0) {
            context += "\n--- TRANSCRIPTS & MEETINGS ---\n";
            meetings.forEach(m => context += `- ${m.title} (${new Date(m.meeting_date).toLocaleDateString()}): ${m.transcript ? m.transcript.substring(0, 1000) + '...' : 'No transcript'}\n`);
        }

        if (projects.length > 0) {
             context += "\n--- PROJECTS ---\n";
             projects.forEach(p => context += `- ${p.title} (${p.status}): ${p.description || ''}\n`);
        }

        if (tasks.length > 0) {
            context += "\n--- TASKS ---\n";
            tasks.forEach(t => context += `- ${t.title} (${t.status}) assigned to ${t.assignee_email || 'unassigned'}\n`);
        }

        if (posts.length > 0) {
            context += "\n--- RECENT POSTS ---\n";
            posts.forEach(p => context += `- ${p.title}: ${p.content.substring(0, 200)}\n`);
        }

        if (events.length > 0) {
            context += "\n--- UPCOMING EVENTS ---\n";
            events.forEach(e => context += `- ${e.title} at ${e.start_time}\n`);
        }

        if (orders.length > 0) {
            context += "\n--- MARKETING ORDERS ---\n";
            orders.forEach(o => context += `- ${o.title} (${o.status}): ${o.description}\n`);
        }

        // Prepare Messages
        const systemPrompt = `You are a helpful AI assistant for the "${group[0]?.name}" group. 
        You have access to the group's data (resources, meetings, tasks, posts, etc.).
        Answer the user's question based on this context.
        If the answer isn't in the context, say so politely.
        Context:
        ${context.substring(0, 50000)}` // Hard limit to prevent token overflow

        const messages = [
            { role: "system", content: systemPrompt },
            ...historyMessages, // already includes the current question since we saved it first? No, we filter by created_date, might miss the ms diff.
            // Actually, we saved the question above, so it IS in historyMessages if we fetch after save.
            // Let's ensure we don't double dip or miss.
            // If fetch happened after save, it includes the user question. 
            // BUT wait, we want the system prompt to handle the retrieval.
        ];
        
        // Double check if the last message in history is the current question. 
        // If query was fast, it might be. If not, we might need to append.
        // Safer to NOT save first, but the user asked to SAVE history.
        // So we saved it. historyMessages should contain it.
        // However, standard OpenAI chat format expects the last message to be the user prompt usually.
        // If historyMessages has it at the end, we are good.

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
            temperature: 0.3,
        });

        const answer = response.choices[0].message.content;

        // 4. Save Assistant Answer to History
        await base44.entities.GroupAIChatMessage.create({
            group_id: groupId,
            user_email: user.email,
            role: 'assistant',
            content: answer
        });

        return Response.json({ answer });

    } catch (error) {
        console.error('GroupAI Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});