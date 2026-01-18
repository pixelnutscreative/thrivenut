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
    
    console.log('getUserGroups called for:', effectiveEmail);
    console.log('memberships found:', memberships.length);

    if (memberships.length === 0) {
      return Response.json({ groups: [], memberships: [], preferences: [] });
    }

    // Extract groupIds for a single efficient query
    const groupIds = memberships.map(m => m.group_id);

    // Fetch all group details in one call using the $in operator
    const groups = await base44.asServiceRole.entities.CreatorGroup.filter({ 
      id: { $in: groupIds }, 
      status: 'active' 
    });
    
    console.log('groups found:', groups.length);
    
    // Fetch UserGroupPreferences for sorting
    const preferences = await base44.asServiceRole.entities.UserGroupPreference.filter({
      user_email: effectiveEmail,
      group_id: { $in: groupIds }
    });
    
    console.log('preferences found:', preferences.length);
    
    // Deduplicate by ID
    const uniqueGroups = Array.from(new Map(groups.map(g => [g.id, g])).values());

    // Sort by last_accessed_at (most recent first)
    uniqueGroups.sort((a, b) => {
      const prefA = preferences.find(p => p.group_id === a.id);
      const prefB = preferences.find(p => p.group_id === b.id);
      
      const lastA = prefA?.last_accessed_at ? new Date(prefA.last_accessed_at) : new Date(0);
      const lastB = prefB?.last_accessed_at ? new Date(prefB.last_accessed_at) : new Date(0);
      
      return lastB.getTime() - lastA.getTime();
    });
    
    console.log('Groups sorted by last_accessed_at:', uniqueGroups.map(g => {
      const pref = preferences.find(p => p.group_id === g.id);
      return { name: g.name, last_accessed: pref?.last_accessed_at || 'never' };
    }));

    return Response.json({ groups: uniqueGroups, memberships, preferences });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});