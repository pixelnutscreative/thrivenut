import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const records = [
            {title:"What EXACTLY is broken with Groups right now?", details:"Go to Groups, tell me step by step what happens, what error shows, can you create a group?", asked_by:"Pixel Poster", question_type:"Question", answer_type:"Text", priority:"🔥 Urgent", status:"Unanswered", nikole_read:false, pixel_read:true, pinned:true, batch_ready:false},
            {title:"Do you have existing groups in ThriveNut or starting fresh?", details:"Need to know if there is existing group data to preserve. What did groups used to do when they worked?", asked_by:"Pixel Poster", question_type:"Question", answer_type:"Text", priority:"🔥 Urgent", status:"Unanswered", nikole_read:false, pixel_read:true, pinned:true, batch_ready:false},
            {title:"Preferences won't save — keeps reverting", details:"Users report preferences (timezone, settings) will not save and keep reverting. Core complaint from the whole team.", asked_by:"Nikole", question_type:"Bug", priority:"🔥 Urgent", status:"Unanswered", nikole_read:true, pixel_read:false, pinned:false, batch_ready:false},
            {title:"Groups functionality completely broken", details:"Groups have not worked properly since November. Users cannot create or access groups properly.", asked_by:"Nikole", question_type:"Bug", priority:"🔥 Urgent", status:"Unanswered", nikole_read:true, pixel_read:false, pinned:false, batch_ready:false},
            {title:"Onboarding loop — keeps showing onboarding to existing users", details:"Users who already onboarded keep getting sent back. The onboarding_completed flag defaults to false.", asked_by:"Nikole", question_type:"Bug", priority:"🔥 Urgent", status:"Unanswered", nikole_read:true, pixel_read:false, pinned:false, batch_ready:false},
            {title:"App sorting/filtering by output type not working", details:"AI Toolbox filter by text/image/video/audio output type doesn't work correctly.", asked_by:"Nikole", question_type:"Bug", priority:"Normal", status:"Unanswered", nikole_read:true, pixel_read:false, pinned:false, batch_ready:false},
            {title:"THRIVE Zoom meeting links broken — 404 errors", details:"Meeting links and URL redirects broken. Email link was the only working entry point for members.", asked_by:"Nikole", question_type:"Bug", priority:"Normal", status:"Unanswered", nikole_read:true, pixel_read:false, pinned:false, batch_ready:false},
            {title:"Pixel Press image display broken in delivery app", details:"Images in the Pixel Press prompt library are not displaying correctly in the gallery.", asked_by:"Nikole", question_type:"Bug", priority:"Normal", status:"Unanswered", nikole_read:true, pixel_read:false, pinned:false, batch_ready:false},
            {title:"Content Marketplace / Battle Poster workflow incomplete", details:"Payment and file delivery automation not complete for the Content Marketplace.", asked_by:"Nikole", question_type:"Task", priority:"When You Get To It", status:"Unanswered", nikole_read:true, pixel_read:false, pinned:false, batch_ready:false}
        ];

        const results = [];
        for (const record of records) {
            // Note: mapped "is_pinned" to "pinned" to match the actual entity schema
            const res = await base44.asServiceRole.entities.PixelBoard.create(record);
            results.push(res.id);
        }

        return Response.json({ success: true, count: results.length, ids: results });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});