import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { userEmail } = await req.json();

    if (!userEmail) {
      return Response.json({ error: 'userEmail required' }, { status: 400 });
    }

    // Fetch all records for this user
    const records = await base44.asServiceRole.entities.UserPreferences.filter({ user_email: userEmail });
    
    if (records.length <= 1) {
      return Response.json({ 
        message: 'No duplicates found',
        count: records.length
      });
    }

    // Sort by updated_date descending to find most recent
    const sorted = records.sort((a, b) => {
      const dateA = new Date(a.updated_date || 0);
      const dateB = new Date(b.updated_date || 0);
      return dateB - dateA;
    });

    const keepRecord = sorted[0];
    const deleteRecords = sorted.slice(1);

    console.log(`🧹 CLEANUP: Keeping record ${keepRecord.id} (updated: ${keepRecord.updated_date})`);
    console.log(`🗑️  DELETING ${deleteRecords.length} older records`);

    // Delete all duplicates
    for (const record of deleteRecords) {
      await base44.asServiceRole.entities.UserPreferences.delete(record.id);
      console.log(`✅ Deleted ${record.id}`);
    }

    // Verify only 1 remains
    const final = await base44.asServiceRole.entities.UserPreferences.filter({ user_email: userEmail });

    return Response.json({ 
      success: true,
      deleted: deleteRecords.length,
      remaining: final.length,
      keptRecordId: keepRecord.id,
      email: userEmail
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});