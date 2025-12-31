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

        const { groupId, question, history = [] } = await req.json();

        if (!groupId || !question) {
            return Response.json({ error: 'Missing groupId or question' }, { status: 400 });
        }

        // Verify membership
        const membership = await base44.entities.CreatorGroupMember.filter({ group_id: groupId, user_email: user.email });
        const group = await base44.entities.CreatorGroup.filter({ id: groupId });
        
        if (membership.length === 0 && group?.[0]?.owner_email !== user.email) {
             // Check if super admin
             if (user.role !== 'admin') {
                return Response.json({ error: 'Forbidden' }, { status: 403 });
             }
        }

        // Fetch Context Data
        // 1. Resources
        const resources = await base44.entities.GroupResource.filter({ group_id: groupId });
        
        // 2. Meeting Transcripts
        const meetings = await base44.entities.MeetingRecording.filter({ group_id: groupId });
        
        // 3. Projects & Tasks
        const projects = await base44.entities.GroupProject.filter({ group_id: groupId });
        let tasks = [];
        if (projects.length > 0) {
            // Fetch tasks for all projects
             const projectIds = projects.map(p => p.id);
             // We have to loop or use Promise.all if filter doesn't support "in" yet or just fetch all group tasks if we had a direct link, but we don't.
             // Actually, GroupTask has project_id. 
             // Let's just fetch all tasks for these projects. 
             // Optimization: Fetch tasks for each project in parallel
             const taskPromises = projectIds.map(pid => base44.entities.GroupTask.filter({ project_id: pid }));
             const tasksResults = await Promise.all(taskPromises);
             tasks = tasksResults.flat();
        }

        // Construct Context String
        let context = `Current Group: ${group[0]?.name}\n\n`;

        if (resources.length > 0) {
            context += "--- RESOURCES ---\n";
            resources.forEach(r => {
                context += `Title: ${r.title}\nDescription: ${r.description || 'N/A'}\nURL: ${r.url}\nType: ${r.type}\n\n`;
            });
        }

        if (meetings.length > 0) {
            context += "--- MEETING RECORDS & TRANSCRIPTS ---\n";
            meetings.forEach(m => {
                context += `Meeting: ${m.title} (${new Date(m.meeting_date).toLocaleDateString()})\nSummary/Transcript: ${m.transcript || 'No transcript available'}\n\n`;
            });
        }

        if (tasks.length > 0) {
            context += "--- TASKS ---\n";
            tasks.forEach(t => {
                context += `Task: ${t.title}\nStatus: ${t.status}\nAssignee: ${t.assignee_email || 'Unassigned'}\nDescription: ${t.description || ''}\n\n`;
            });
        }

        if (projects.length > 0) {
             context += "--- PROJECTS ---\n";
             projects.forEach(p => {
                 context += `Project: ${p.title}\nStatus: ${p.status}\nDescription: ${p.description || ''}\n\n`;
             });
        }

        // Prepare Messages for LLM
        const messages = [
            {
                role: "system",
                content: `You are a helpful AI assistant for the "${group[0]?.name}" client portal/group. 
                Your goal is to answer questions based strictly on the provided context (resources, meetings, tasks).
                If the answer is not in the context, politely say you don't have that information.
                Keep answers concise and professional.
                
                Context Data:
                ${context}`
            },
            ...history.map(h => ({ role: h.role, content: h.content })), // History
            { role: "user", content: question }
        ];

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: messages,
            temperature: 0.3, // Lower temperature for more factual answers
        });

        return Response.json({ answer: response.choices[0].message.content });

    } catch (error) {
        console.error('GroupAI Error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});