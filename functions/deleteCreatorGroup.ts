import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { groupId } = await req.json();

    if (!groupId) {
        return Response.json({ error: 'Group ID is required' }, { status: 400 });
    }

    const user = await base44.auth.me();
    if (!user) {
        return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const group = await base44.entities.CreatorGroup.get(groupId);
    // Allow if owner OR if specific admin email
    const isSuperAdmin = ['pixelnutscreative@gmail.com', 'pixel@thrivenut.app'].includes(user.email.toLowerCase());
    
    if (group.owner_email !== user.email && !isSuperAdmin) {
        return Response.json({ error: 'Only the owner can delete this group' }, { status: 403 });
    }

    // Delete related records first (manual cascade)
    // 1. Members
    const members = await base44.asServiceRole.entities.CreatorGroupMember.filter({ group_id: groupId });
    await Promise.all(members.map(m => base44.asServiceRole.entities.CreatorGroupMember.delete(m.id)));

    // 2. Posts (Feed)
    try {
        const posts = await base44.asServiceRole.entities.GroupPost.filter({ group_id: groupId });
        await Promise.all(posts.map(p => base44.asServiceRole.entities.GroupPost.delete(p.id)));
    } catch (e) { console.log('No posts to delete or error', e); }

    // 3. Events
    try {
        const events = await base44.asServiceRole.entities.GroupEvent.filter({ group_id: groupId });
        await Promise.all(events.map(e => base44.asServiceRole.entities.GroupEvent.delete(e.id)));
    } catch (e) { console.log('No events to delete or error', e); }

    // 4. Resources
    try {
        const resources = await base44.asServiceRole.entities.GroupResource.filter({ group_id: groupId });
        await Promise.all(resources.map(r => base44.asServiceRole.entities.GroupResource.delete(r.id)));
    } catch (e) { console.log('No resources to delete or error', e); }
    
    // 5. Training
    try {
        const trainings = await base44.asServiceRole.entities.GroupTraining.filter({ group_id: groupId });
        await Promise.all(trainings.map(t => base44.asServiceRole.entities.GroupTraining.delete(t.id)));
    } catch (e) { console.log('No training to delete or error', e); }

    // 6. Delete the Group itself
    await base44.entities.CreatorGroup.delete(groupId);

    return Response.json({ success: true });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});