import { createClientFromRequest } from 'npm:@base44/sdk@0.8.3';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Define the group types to seed
        const groupTypes = [
            { key: 'business', name: 'Business', description: 'Internal teams, employee resources, company updates', enabled_tabs: ['feed', 'resources', 'events', 'members'] },
            { key: 'agency', name: 'Agency', description: 'Client management & TikTok collaboration', enabled_tabs: ['feed', 'resources', 'training', 'events', 'members'] },
            { key: 'family', name: 'Family', description: 'Event planning & memory sharing', enabled_tabs: ['feed', 'events', 'resources', 'members'] },
            { key: 'subscription', name: 'Subscription', description: 'Paid membership funnel', enabled_tabs: ['feed', 'resources', 'training', 'events', 'members'] },
            { key: 'coaching', name: 'Coaching Program', description: 'Client programs, worksheets, progress tracking', enabled_tabs: ['resources', 'training', 'events', 'members', 'requests'] },
            { key: 'course', name: 'Course Community', description: 'Students in a specific course', enabled_tabs: ['feed', 'resources', 'training', 'events', 'members'] },
            { key: 'membership', name: 'Membership Site', description: 'Tiered access, exclusive content', enabled_tabs: ['feed', 'resources', 'training', 'events', 'members'] },
            { key: 'ai-graphics', name: 'AI Graphics', description: 'AI art prompts & workflows', enabled_tabs: ['feed', 'resources', 'qa', 'events', 'members'] },
            { key: 'faceless', name: 'Faceless Content', description: 'No-camera channel strategies', enabled_tabs: ['feed', 'resources', 'training', 'events', 'members'] },
            { key: 'niche-content', name: 'Niche Content', description: 'Specific verticals (finance, crime, education)', enabled_tabs: ['feed', 'resources', 'training', 'events', 'members'] },
            { key: 'interest', name: 'Interest/Hobby', description: 'General enthusiast community', enabled_tabs: ['feed', 'resources', 'events', 'qa', 'members'] },
            { key: 'health', name: 'Health & Wellness', description: 'Fitness & nutrition community', enabled_tabs: ['feed', 'resources', 'events', 'qa', 'members'] },
            { key: 'faith', name: 'Faith-Based', description: 'Study & spiritual community', enabled_tabs: ['feed', 'resources', 'events', 'members'] },
            { key: 'support', name: 'Support Group', description: 'Shared challenges & resources', enabled_tabs: ['feed', 'resources', 'qa', 'members'] },
            { key: 'project', name: 'Project Collaboration', description: 'Temporary team workspace', enabled_tabs: ['feed', 'resources', 'events', 'requests', 'members'] },
            { key: 'local', name: 'Local Community', description: 'Neighborhood or city group', enabled_tabs: ['feed', 'events', 'members'] },
            { key: 'client-portal', name: 'Client Portal', description: 'Private workspace for client projects & deliverables', enabled_tabs: ['resources', 'requests', 'members', 'events', 'training'] }
        ];

        let created = 0;
        let updated = 0;

        // Check and create/update each type
        for (const type of groupTypes) {
            // Check if exists by key (using filter since we can't search by key directly if it's not unique indexed in this context, 
            // but key should be unique logically. Entity GroupType uses 'key' property).
            const existing = await base44.entities.GroupType.filter({ key: type.key });
            
            if (existing && existing.length > 0) {
                // Update existing
                await base44.entities.GroupType.update(existing[0].id, type);
                updated++;
            } else {
                // Create new
                await base44.entities.GroupType.create(type);
                created++;
            }
        }

        return Response.json({
            status: 'success',
            created,
            updated,
            total: groupTypes.length
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});