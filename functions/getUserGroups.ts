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

    // Fetch all group details in parallel
    const groupIds = memberships.map(m => m.group_id);
    const groupPromises = groupIds.map(id => 
      base44.asServiceRole.entities.CreatorGroup.filter({ id })
    );
    
    const groupResults = await Promise.all(groupPromises);
    const activeGroups = groupResults.flat().filter(g => g && g.status === 'active');
    
    // Deduplicate by ID
    const uniqueGroups = Array.from(new Map(activeGroups.map(g => [g.id, g])).values());

    return Response.json({ groups: uniqueGroups });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});