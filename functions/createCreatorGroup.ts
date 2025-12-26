import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { name, type, funnel_content } = await req.json();

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Create the Group
    const group = await base44.entities.CreatorGroup.create({
      name,
      owner_email: user.email,
      invite_code: Math.random().toString(36).substring(7).toUpperCase(),
      status: 'active',
      type,
      ...funnel_content
    });

    // 2. Ensure Owner Membership
    // We check first to avoid duplicates if race conditions occur
    const existing = await base44.asServiceRole.entities.CreatorGroupMember.filter({ 
      group_id: group.id, 
      user_email: user.email 
    });

    if (existing.length > 0) {
      await base44.asServiceRole.entities.CreatorGroupMember.update(existing[0].id, {
        role: 'owner',
        level: 'Owner',
        status: 'active'
      });
    } else {
      await base44.asServiceRole.entities.CreatorGroupMember.create({
        group_id: group.id,
        user_email: user.email,
        role: 'owner',
        level: 'Owner',
        status: 'active',
        joined_date: new Date().toISOString()
      });
    }

    return Response.json(group);

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});