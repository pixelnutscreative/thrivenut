import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { shiftId, groupId, modEmails, action } = await req.json();

        // 1. Fetch Shift Details
        const shifts = await base44.entities.ModShift.filter({ id: shiftId });
        if (!shifts.length) return Response.json({ error: 'Shift not found' }, { status: 404 });
        const shift = shifts[0];

        // 2. Fetch Group
        const groups = await base44.entities.CreatorGroup.filter({ id: groupId });
        const group = groups[0];

        if (action === 'notify_available') {
            // Notify all potential mods that a shift is open
            // Typically "member" role or specific "mod" role if implemented. 
            // For now, notify the provided list of emails.
            
            for (const email of modEmails) {
                await base44.integrations.Core.SendEmail({
                    to: email,
                    subject: `New Mod Shift Available: ${shift.title}`,
                    body: `
                        Hi there!
                        
                        A new mod shift is available in ${group.name}.
                        
                        Shift: ${shift.title}
                        Time: ${new Date(shift.start_time).toLocaleString()} - ${new Date(shift.end_time).toLocaleString()}
                        
                        Log in to the group dashboard to claim this shift!
                    `
                });
            }
        } else if (action === 'invite') {
             for (const email of modEmails) {
                await base44.integrations.Core.SendEmail({
                    to: email,
                    subject: `You're invited to Mod: ${shift.title}`,
                    body: `
                        Hi there!
                        
                        You've been invited to mod a stream in ${group.name}.
                        
                        Shift: ${shift.title}
                        Time: ${new Date(shift.start_time).toLocaleString()} - ${new Date(shift.end_time).toLocaleString()}
                        
                        Please accept or decline in the dashboard.
                    `
                });
            }
        }

        return Response.json({ success: true });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});