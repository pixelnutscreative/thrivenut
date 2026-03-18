import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userEmail } = await req.json();

    if (!userEmail) {
      return Response.json({ error: 'userEmail required' }, { status: 400 });
    }

    const records = await base44.asServiceRole.entities.UserPreferences.filter({ user_email: userEmail });
    
    return Response.json({ 
      found: records.length > 0, 
      count: records.length,
      record: records[0] || null, 
      email: userEmail,
      allRecords: records
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});