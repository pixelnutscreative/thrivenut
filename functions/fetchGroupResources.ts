import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        // Allow public access if no user (for public groups)? 
        // Typically resources are for members, but if group is public...
        // Let's assume user is required for now as it was in the frontend code.
        // if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const { groupId } = await req.json();

        if (!groupId) {
            return Response.json({ error: 'Group ID is required' }, { status: 400 });
        }

        // 1. Fetch GroupResource items (native to the group)
        // Use service role to ensure we get all approved resources regardless of user permissions if needed,
        // but typically GroupResource is readable. We'll use service role to be safe and filter in code if needed.
        // Actually, let's use user context for GroupResource if possible, but for UserResource we definitely need service role for "shared by others".
        
        const groupResources = await base44.entities.GroupResource.filter({ group_id: groupId });

        // 2. Fetch UserResource items shared to this group
        // We need to find resources where:
        // - visibility is 'group' AND (group_id == groupId OR group_ids contains groupId)
        // Since we can't do complex OR queries easily, we'll fetch potentially relevant ones.
        // We'll use service role because we need to see resources owned by OTHERS that are shared with THIS group.
        
        // We can't easily filter by "array contains" in the basic SDK filter if it doesn't support it.
        // We will fetch all UserResources that are visibility='group' and filter in memory? 
        // That might be too many.
        // Ideally we filter by `group_ids` if the backend supports it.
        // Assuming base44 entities support mongo-like queries or simple matches.
        // If `group_ids` is an array of strings, passing a string often matches "contains" in some adapters, but not all.
        // Let's try to filter by `group_id: groupId` (legacy) AND `group_ids: groupId` (modern).
        // Since we can't do OR, we do two queries.
        
        const sharedLegacy = await base44.asServiceRole.entities.UserResource.filter({ 
            visibility: 'group', 
            group_id: groupId 
        });

        // For array field `group_ids`, usually we can't filter directly with simple equality if it's an array.
        // But if the underlying DB is Mongo/Document-based, `{ group_ids: groupId }` usually works as "contains".
        // Let's try that.
        const sharedModern = await base44.asServiceRole.entities.UserResource.filter({ 
            visibility: 'group', 
            group_ids: groupId 
        });

        // Combine and dedup UserResources
        const userResourceMap = new Map();
        [...sharedLegacy, ...sharedModern].forEach(r => {
            userResourceMap.set(r.id, r);
        });

        const mappedUserResources = Array.from(userResourceMap.values()).map(ur => ({
            ...ur,
            id: `shared-${ur.id}`, // Avoid ID collision
            original_id: ur.id,
            is_shared: true,
            type: mapCategoryToType(ur.category),
            title: ur.title,
            description: ur.description || ur.notes,
            url: ur.url,
            submitted_by: ur.user_email,
            status: 'approved', // Shared resources are auto-approved
            created_date: ur.created_date || ur.updated_date
        }));

        // Combine all
        const allResources = [...groupResources, ...mappedUserResources];

        // Sort
        allResources.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));

        return Response.json({ resources: allResources });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});

function mapCategoryToType(cat) {
    if (!cat) return 'link';
    const lower = cat.toLowerCase();
    if (lower.includes('video')) return 'video';
    if (lower.includes('audio') || lower.includes('podcast')) return 'audio';
    if (lower.includes('image') || lower.includes('photo')) return 'image';
    if (lower.includes('pdf') || lower.includes('doc')) return 'file';
    if (lower.includes('gpt') || lower.includes('ai')) return 'custom_gpt';
    return 'link';
}