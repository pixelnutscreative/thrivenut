import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // MIGRATION SIMULATION REPORT
    // READ-ONLY - NO DATA MODIFICATIONS
    
    const report = {
      timestamp: new Date().toISOString(),
      mode: 'DRY_RUN_SIMULATION',
      warnings: [],
      summary: {},
      conflicts: [],
      sampleMappings: {},
      recommendations: []
    };

    // 1. Fetch all entities that contain TikTok usernames
    console.log('Fetching TikTokContact records...');
    const tiktokContacts = await base44.asServiceRole.entities.TikTokContact.list();
    
    console.log('Fetching PersonalContact records...');
    const personalContacts = await base44.asServiceRole.entities.PersonalContact.list();
    
    console.log('Fetching TikTokCreator records...');
    const tiktokCreators = await base44.asServiceRole.entities.TikTokCreator.list();
    
    console.log('Fetching Gifter records...');
    const gifters = await base44.asServiceRole.entities.Gifter.list();
    
    console.log('Fetching LiveSchedule records...');
    const liveSchedules = await base44.asServiceRole.entities.LiveSchedule.list();
    
    console.log('Fetching BattlePlan records...');
    const battlePlans = await base44.asServiceRole.entities.BattlePlan.list();

    // 2. Extract all unique TikTok usernames from all sources
    const usernameMap = new Map(); // username -> sources array
    
    // From TikTokContact (both legacy fields)
    tiktokContacts.forEach(contact => {
      const username = contact.username || contact.tiktok_username;
      if (username) {
        const normalized = username.toLowerCase().replace(/^@/, '');
        if (!usernameMap.has(normalized)) {
          usernameMap.set(normalized, []);
        }
        usernameMap.get(normalized).push({
          source: 'TikTokContact',
          id: contact.id,
          display_name: contact.display_name,
          phonetic: contact.phonetic || contact.phonetic_spelling,
          created_by: contact.created_by
        });
      }
    });

    // From PersonalContact.social_handles.tiktok
    personalContacts.forEach(contact => {
      const username = contact.social_handles?.tiktok;
      if (username) {
        const normalized = username.toLowerCase().replace(/^@/, '');
        if (!usernameMap.has(normalized)) {
          usernameMap.set(normalized, []);
        }
        usernameMap.get(normalized).push({
          source: 'PersonalContact',
          id: contact.id,
          name: contact.name,
          created_by: contact.created_by
        });
      }
    });

    // From TikTokCreator.username
    tiktokCreators.forEach(creator => {
      if (creator.username) {
        const normalized = creator.username.toLowerCase().replace(/^@/, '');
        if (!usernameMap.has(normalized)) {
          usernameMap.set(normalized, []);
        }
        usernameMap.get(normalized).push({
          source: 'TikTokCreator',
          id: creator.id,
          engagement_enabled: creator.engagement_enabled,
          created_by: creator.created_by
        });
      }
    });

    // From Gifter.username
    gifters.forEach(gifter => {
      if (gifter.username) {
        const normalized = gifter.username.toLowerCase().replace(/^@/, '');
        if (!usernameMap.has(normalized)) {
          usernameMap.set(normalized, []);
        }
        usernameMap.get(normalized).push({
          source: 'Gifter',
          id: gifter.id,
          screen_name: gifter.screen_name,
          phonetic: gifter.phonetic,
          created_by: gifter.created_by
        });
      }
    });

    // From LiveSchedule.host_username
    liveSchedules.forEach(schedule => {
      if (schedule.host_username) {
        const normalized = schedule.host_username.toLowerCase().replace(/^@/, '');
        if (!usernameMap.has(normalized)) {
          usernameMap.set(normalized, []);
        }
        usernameMap.get(normalized).push({
          source: 'LiveSchedule',
          id: schedule.id,
          created_by: schedule.created_by
        });
      }
    });

    // From BattlePlan.opponent (freeform text - needs review)
    battlePlans.forEach(plan => {
      if (plan.opponent) {
        const normalized = plan.opponent.toLowerCase().replace(/^@/, '');
        if (!usernameMap.has(normalized)) {
          usernameMap.set(normalized, []);
        }
        usernameMap.get(normalized).push({
          source: 'BattlePlan',
          id: plan.id,
          battle_date: plan.battle_date,
          created_by: plan.created_by
        });
      }
    });

    // 3. Count unique usernames and identify conflicts
    const uniqueUsernames = usernameMap.size;
    const existingTikTokContacts = tiktokContacts.length;
    
    report.summary = {
      unique_tiktok_usernames_found: uniqueUsernames,
      existing_tiktok_contact_records: existingTikTokContacts,
      canonical_records_to_create: uniqueUsernames - existingTikTokContacts,
      entities_scanned: {
        TikTokContact: tiktokContacts.length,
        PersonalContact: personalContacts.length,
        TikTokCreator: tiktokCreators.length,
        Gifter: gifters.length,
        LiveSchedule: liveSchedules.length,
        BattlePlan: battlePlans.length
      }
    };

    // 4. Identify conflicts (same username, different display names/phonetics)
    usernameMap.forEach((sources, username) => {
      if (sources.length > 1) {
        // Check for conflicting display names or phonetics
        const displayNames = new Set();
        const phonetics = new Set();
        
        sources.forEach(source => {
          if (source.display_name) displayNames.add(source.display_name);
          if (source.screen_name) displayNames.add(source.screen_name);
          if (source.phonetic) phonetics.add(source.phonetic);
        });

        if (displayNames.size > 1 || phonetics.size > 1) {
          report.conflicts.push({
            username,
            total_occurrences: sources.length,
            conflicting_display_names: Array.from(displayNames),
            conflicting_phonetics: Array.from(phonetics),
            sources: sources.map(s => ({
              entity: s.source,
              id: s.id,
              created_by: s.created_by
            }))
          });
        }
      }
    });

    // 5. Generate sample mappings
    // PersonalContact -> TikTokContact (10 examples)
    const personalContactSamples = personalContacts
      .filter(pc => pc.social_handles?.tiktok)
      .slice(0, 10)
      .map(pc => {
        const username = pc.social_handles.tiktok.toLowerCase().replace(/^@/, '');
        const sources = usernameMap.get(username) || [];
        const existingTikTokContact = sources.find(s => s.source === 'TikTokContact');
        
        return {
          personal_contact_id: pc.id,
          personal_contact_name: pc.name,
          tiktok_username: username,
          action: existingTikTokContact ? 'LINK_TO_EXISTING' : 'CREATE_NEW_THEN_LINK',
          existing_tiktok_contact_id: existingTikTokContact?.id || null,
          would_preserve: ['nickname', 'notes', 'phone', 'email', 'birthday', 'custom_fields']
        };
      });

    report.sampleMappings.PersonalContact = personalContactSamples;

    // Gifter -> TikTokContact (10 examples)
    const gifterSamples = gifters
      .slice(0, 10)
      .map(gifter => {
        const username = gifter.username.toLowerCase().replace(/^@/, '');
        const sources = usernameMap.get(username) || [];
        const existingTikTokContact = sources.find(s => s.source === 'TikTokContact');
        
        return {
          gifter_id: gifter.id,
          gifter_username: username,
          gifter_screen_name: gifter.screen_name,
          gifter_phonetic: gifter.phonetic,
          action: existingTikTokContact ? 'LINK_TO_EXISTING' : 'CREATE_NEW_THEN_LINK',
          existing_tiktok_contact_id: existingTikTokContact?.id || null,
          note: 'Gifter record would gain tiktok_contact_id field'
        };
      });

    report.sampleMappings.Gifter = gifterSamples;

    // TikTokCreator -> TikTokContact (10 examples)
    const creatorSamples = tiktokCreators
      .slice(0, 10)
      .map(creator => {
        const username = creator.username.toLowerCase().replace(/^@/, '');
        const sources = usernameMap.get(username) || [];
        const existingTikTokContact = sources.find(s => s.source === 'TikTokContact');
        
        return {
          tiktok_creator_id: creator.id,
          tiktok_username: username,
          engagement_enabled: creator.engagement_enabled,
          action: existingTikTokContact ? 'LINK_TO_EXISTING' : 'CREATE_NEW_THEN_LINK',
          existing_tiktok_contact_id: existingTikTokContact?.id || null,
          note: 'TikTokCreator would gain tiktok_contact_id field, username preserved temporarily'
        };
      });

    report.sampleMappings.TikTokCreator = creatorSamples;

    // 6. Recommendations
    report.recommendations = [
      {
        priority: 'HIGH',
        issue: `Found ${report.conflicts.length} conflicts where same username has different display names or phonetics`,
        action: 'Review conflicts manually before migration. Decide which display name/phonetic is canonical.'
      },
      {
        priority: 'MEDIUM',
        issue: `${report.summary.canonical_records_to_create} new TikTokContact records would be created`,
        action: 'Verify this number seems reasonable for your user base'
      },
      {
        priority: 'MEDIUM',
        issue: 'BattlePlan.opponent is freeform text',
        action: 'Some BattlePlan opponents may not match existing usernames. Manual review recommended.'
      },
      {
        priority: 'LOW',
        issue: 'Legacy fields will be preserved temporarily',
        action: 'After migration validation (30 days), cleanup phase will remove redundant fields'
      }
    ];

    // 7. Confirmation
    report.confirmation = {
      zero_write_operations_performed: true,
      data_modification: 'NONE',
      records_created: 0,
      records_updated: 0,
      records_deleted: 0,
      constraints_enforced: 'NONE',
      mode: 'READ_ONLY_SIMULATION'
    };

    return Response.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('Migration simulation error:', error);
    return Response.json({ 
      success: false,
      error: error.message,
      confirmation: {
        zero_write_operations_performed: true,
        error_occurred_during_read: true
      }
    }, { status: 500 });
  }
});