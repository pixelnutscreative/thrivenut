import { createClientFromRequest } from 'npm:@base44/sdk@0.8.3';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Fetch all groups (handling pagination if needed, but simple list for now)
        // .list returns array. 
        // If there are many, we might need a loop with skip/limit, but let's start with a large limit.
        const groups = await base44.entities.CreatorGroup.list(); 
        
        let migrated = 0;
        let skipped = 0;

        for (const group of groups) {
            // Check if fields are missing. 
            // We use welcome_mat_title as the indicator.
            if (!group.welcome_mat_title) {
                await base44.entities.CreatorGroup.update(group.id, {
                    welcome_mat_title: `Welcome to ${group.name}!`,
                    welcome_mat_description: "Welcome! Click below to learn more about what we do.",
                    welcome_mat_video_url: "",
                    welcome_mat_button_text: "I'm Interested",
                    interested_dashboard_header: "Ready to join? Here's what you need to know.",
                    interested_signup_info: "Follow the steps below to become a member.",
                    interested_video_url: "",
                    interested_attribution_prompt: "Who shared this with you?"
                });
                migrated++;
            } else {
                skipped++;
            }
        }

        return Response.json({
            migrated,
            skipped,
            total: groups.length
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});