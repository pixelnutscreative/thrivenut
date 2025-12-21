import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, familyMemberId, linkedEmail, enabledModules, defaultLandingPage = 'KidsJournal' } = body || {};

    if (!action) {
      return Response.json({ error: 'Missing action' }, { status: 400 });
    }

    // Helper: verify parent owns the family member
    const verifyOwnership = async () => {
      if (!familyMemberId) throw new Error('familyMemberId is required');
      const fmList = await base44.asServiceRole.entities.FamilyMember.filter({ id: familyMemberId });
      const fm = fmList?.[0];
      if (!fm) throw new Error('Family member not found');
      if ((fm.created_by || '').toLowerCase() !== (user.email || '').toLowerCase()) {
        throw new Error('Forbidden');
      }
      return fm;
    };

    if (action === 'get') {
      const fm = await verifyOwnership();
      const childEmail = (linkedEmail || fm.linked_user_email || '').trim();
      if (!childEmail) {
        return Response.json({
          ok: true,
          familyMember: { id: fm.id, name: fm.name, nickname: fm.nickname },
          preferences: null
        });
      }

      const prefs = await base44.asServiceRole.entities.UserPreferences.filter({ user_email: childEmail }, '-updated_date');
      const pref = prefs?.[0] || null;
      return Response.json({
        ok: true,
        familyMember: { id: fm.id, name: fm.name, nickname: fm.nickname, linked_user_email: childEmail },
        preferences: pref ? {
          enabled_modules: pref.enabled_modules || [],
          default_landing_page: pref.default_landing_page || null
        } : null
      });
    }

    if (action === 'set') {
      const fm = await verifyOwnership();
      const childEmail = (linkedEmail || fm.linked_user_email || '').trim();
      if (!childEmail) throw new Error('No linked email on this family member');

      // Ensure at least Journal is included
      const requested = Array.isArray(enabledModules) ? enabledModules : [];
      const unique = Array.from(new Set(['journal', ...requested]));

      const prefs = await base44.asServiceRole.entities.UserPreferences.filter({ user_email: childEmail }, '-updated_date');
      if (prefs.length > 0) {
        await base44.asServiceRole.entities.UserPreferences.update(prefs[0].id, {
          enabled_modules: unique,
          default_landing_page: defaultLandingPage || 'KidsJournal'
        });
      } else {
        await base44.asServiceRole.entities.UserPreferences.create({
          user_email: childEmail,
          enabled_modules: unique,
          default_landing_page: defaultLandingPage || 'KidsJournal'
        });
      }

      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message || 'Server error' }, { status: 500 });
  }
});