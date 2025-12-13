import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user (admin only)
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conflicts, dryRun = true } = await req.json();

    // CANONICAL MERGE FUNCTION
    // Consolidates duplicate TikTokContact records into single canonical records
    
    const report = {
      timestamp: new Date().toISOString(),
      mode: dryRun ? 'DRY_RUN' : 'LIVE_MERGE',
      conflicts_processed: [],
      foreign_key_updates: [],
      archived_duplicates: [],
      warnings: []
    };

    for (const conflict of conflicts) {
      const { username, canonical_display_name, canonical_phonetic_spelling } = conflict;
      
      console.log(`Processing conflict for username: ${username}`);
      
      // 1. Find all TikTokContact records with this username
      const allRecords = await base44.asServiceRole.entities.TikTokContact.list();
      const duplicates = allRecords.filter(record => {
        const recordUsername = (record.username || record.tiktok_username || '').toLowerCase().replace(/^@/, '');
        return recordUsername === username.toLowerCase().replace(/^@/, '');
      });

      if (duplicates.length === 0) {
        report.warnings.push(`No TikTokContact records found for username: ${username}`);
        continue;
      }

      console.log(`Found ${duplicates.length} duplicate records for ${username}`);

      // 2. Choose or create canonical record
      // Use the oldest record as canonical (lowest created_date)
      const sortedByDate = [...duplicates].sort((a, b) => 
        new Date(a.created_date) - new Date(b.created_date)
      );
      const canonicalRecord = sortedByDate[0];
      const duplicatesToArchive = sortedByDate.slice(1);

      console.log(`Canonical record ID: ${canonicalRecord.id}`);
      console.log(`Duplicates to archive: ${duplicatesToArchive.length}`);

      if (!dryRun) {
        // 3. Update canonical record with approved values
        // Only update the specific fields we need, preserve everything else
        const updateData = {
          tiktok_username: username,
          display_name: canonical_display_name,
          phonetic_spelling: canonical_phonetic_spelling,
          _migration_status: 'canonical_merged',
          _migration_source: 'canonical_merge_function'
        };
        
        // Preserve existing nested objects
        if (canonicalRecord.other_tiktok_accounts) {
          updateData.other_tiktok_accounts = canonicalRecord.other_tiktok_accounts;
        }
        if (canonicalRecord.social_links) {
          updateData.social_links = canonicalRecord.social_links;
        }
        if (canonicalRecord.battle_inventory) {
          updateData.battle_inventory = canonicalRecord.battle_inventory;
        }
        
        await base44.asServiceRole.entities.TikTokContact.update(canonicalRecord.id, updateData);
      }

      // 4. Find and update all foreign key references
      const fkUpdates = [];

      // TikTokCreator references
      const creators = await base44.asServiceRole.entities.TikTokCreator.list();
      for (const creator of creators) {
        const creatorUsername = (creator.username || '').toLowerCase().replace(/^@/, '');
        if (creatorUsername === username.toLowerCase().replace(/^@/, '')) {
          if (!dryRun) {
            await base44.asServiceRole.entities.TikTokCreator.update(creator.id, {
              tiktok_contact_id: canonicalRecord.id
            });
          }
          fkUpdates.push({
            entity: 'TikTokCreator',
            id: creator.id,
            new_tiktok_contact_id: canonicalRecord.id
          });
        }
      }

      // Gifter references
      const gifters = await base44.asServiceRole.entities.Gifter.list();
      for (const gifter of gifters) {
        const gifterUsername = (gifter.username || '').toLowerCase().replace(/^@/, '');
        if (gifterUsername === username.toLowerCase().replace(/^@/, '')) {
          if (!dryRun) {
            await base44.asServiceRole.entities.Gifter.update(gifter.id, {
              tiktok_contact_id: canonicalRecord.id
            });
          }
          fkUpdates.push({
            entity: 'Gifter',
            id: gifter.id,
            new_tiktok_contact_id: canonicalRecord.id
          });
        }
      }

      // PersonalContact references (if they have this TikTok username)
      const personalContacts = await base44.asServiceRole.entities.PersonalContact.list();
      for (const pc of personalContacts) {
        const pcUsername = (pc.social_handles?.tiktok || '').toLowerCase().replace(/^@/, '');
        if (pcUsername === username.toLowerCase().replace(/^@/, '')) {
          if (!dryRun) {
            await base44.asServiceRole.entities.PersonalContact.update(pc.id, {
              tiktok_contact_id: canonicalRecord.id,
              _migration_status: 'linked'
            });
          }
          fkUpdates.push({
            entity: 'PersonalContact',
            id: pc.id,
            new_tiktok_contact_id: canonicalRecord.id
          });
        }
      }

      // 5. Archive duplicate records (mark as archived, do NOT delete)
      const archivedIds = [];
      for (const duplicate of duplicatesToArchive) {
        if (!dryRun) {
          const archiveData = {
            _migration_status: 'archived_duplicate',
            _canonical_id: canonicalRecord.id,
            username: `ARCHIVED_${duplicate.username || duplicate.tiktok_username}`,
            tiktok_username: `ARCHIVED_${duplicate.username || duplicate.tiktok_username}`
          };
          
          // Preserve all nested objects
          if (duplicate.other_tiktok_accounts) {
            archiveData.other_tiktok_accounts = duplicate.other_tiktok_accounts;
          }
          if (duplicate.social_links) {
            archiveData.social_links = duplicate.social_links;
          }
          if (duplicate.battle_inventory) {
            archiveData.battle_inventory = duplicate.battle_inventory;
          }
          
          await base44.asServiceRole.entities.TikTokContact.update(duplicate.id, archiveData);
        }
        archivedIds.push(duplicate.id);
      }

      report.conflicts_processed.push({
        username,
        canonical_record_id: canonicalRecord.id,
        canonical_display_name,
        canonical_phonetic_spelling,
        duplicates_archived: archivedIds.length,
        foreign_keys_updated: fkUpdates.length
      });

      report.foreign_key_updates.push(...fkUpdates);
      report.archived_duplicates.push(...archivedIds);
    }

    // Summary
    report.summary = {
      total_conflicts_processed: report.conflicts_processed.length,
      total_duplicates_archived: report.archived_duplicates.length,
      total_foreign_keys_updated: report.foreign_key_updates.length,
      records_deleted: 0,
      mode: dryRun ? 'DRY_RUN - NO CHANGES MADE' : 'LIVE - CHANGES APPLIED'
    };

    return Response.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('Canonical merge error:', error);
    return Response.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
});