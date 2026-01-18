import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userEmail } = await req.json();
    const effectiveEmail = userEmail || user.email;

    // Fetch user's active group memberships
    const memberships = await base44.asServiceRole.entities.CreatorGroupMember.filter({ 
      user_email: effectiveEmail, 
      status: 'active' 
    });

    if (memberships.length === 0) {
      return Response.json({ groups: [] });
    }

    // Extract groupIds for a single efficient query
    const groupIds = memberships.map(m => m.group_id);

    // Fetch all group details in one call using the $in operator
    const groups = await base44.asServiceRole.entities.CreatorGroup.filter({ 
      id: { $in: groupIds }, 
      status: 'active' 
    });
    
    // Deduplicate by ID
    const uniqueGroups = Array.from(new Map(groups.map(g => [g.id, g])).values());

    return Response.json({ groups: uniqueGroups, memberships });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});