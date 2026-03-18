import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me().catch(() => null);
        
        let isSuperAdmin = false;
        if (user) {
             const realUserEmail = user.email.toLowerCase();
             const adminEmails = ['pixelnutscreative@gmail.com', 'pixel@thrivenut.app'];
             isSuperAdmin = adminEmails.includes(realUserEmail);
        }

        if (isSuperAdmin) {
             // Return ALL active groups for super admin
             const groups = await base44.asServiceRole.entities.CreatorGroup.filter({ status: 'active' });
             return Response.json({ groups });
        }
        
        // For regular users, only public discovery groups
        const groups = await base44.asServiceRole.entities.CreatorGroup.filter({ 
            status: 'active',
            allow_public_discovery: true 
        });
        
        return Response.json({ groups });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});