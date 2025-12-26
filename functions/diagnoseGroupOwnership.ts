import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me(); // Just to have context, though we target specific email

    const targetGroupId = '694dd4febb855460a89c614b';
    const targetEmail = 'pixelnutscreative@gmail.com';

    // 1. Check Reality
    const existing = await base44.asServiceRole.entities.CreatorGroupMember.filter({
      group_id: targetGroupId,
      user_email: targetEmail
    });

    const beforeState = existing.length > 0 ? existing[0] : null;

    // 2. Force Update
    let afterState;
    if (beforeState) {
      await base44.asServiceRole.entities.CreatorGroupMember.update(beforeState.id, {
        role: 'owner',
        level: 'Owner',
        status: 'active'
      });
      // Fetch again to confirm
      const updated = await base44.asServiceRole.entities.CreatorGroupMember.filter({ id: beforeState.id });
      afterState = updated[0];
    } else {
      // Create if missing
      afterState = await base44.asServiceRole.entities.CreatorGroupMember.create({
        group_id: targetGroupId,
        user_email: targetEmail,
        role: 'owner',
        level: 'Owner',
        status: 'active',
        joined_date: new Date().toISOString()
      });
    }

    return Response.json({
      group_id: targetGroupId,
      user_email: targetEmail,
      before: beforeState,
      after: afterState,
      fix_applied: true
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});