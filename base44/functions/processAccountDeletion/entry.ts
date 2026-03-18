import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Only admins can trigger deletion processing
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find all pending deletion requests that are past their 30-day period
    const now = new Date();
    const allRequests = await base44.asServiceRole.entities.AccountDeletionRequest.filter({ 
      status: 'pending' 
    });

    const requestsToProcess = allRequests.filter(req => {
      const deletionDate = new Date(req.scheduled_deletion_date);
      return deletionDate <= now;
    });

    const processed = [];
    const errors = [];

    for (const request of requestsToProcess) {
      try {
        const userEmail = request.user_email;

        // Get all entities for this user
        const entities = [
          'UserPreferences', 'UserProfile', 'ReferralLink', 'ReferralActivity',
          'Goal', 'Task', 'JournalEntry', 'MoodLog', 'WaterLog', 'SleepLog',
          'NutritionLog', 'CycleLog', 'DailySelfCareLog', 'Supplement', 'SupplementLog',
          'Medication', 'MedicationLog', 'Pet', 'CareReminder', 'PetActivityLog',
          'QuickNote', 'PersonalContact', 'FamilyMember', 'BrainDump',
          'ActivityLog', 'NotificationSaved', 'NotificationRead', 'SavedMotivation',
          'AIToolPurchase', 'CouponCode', 'ContentRequest', 'ContentSubmission',
          'PromotionCampaign', 'Brand', 'PromotedOffer', 'ContentCard',
          'ContentPlatformOutput', 'AssetLink', 'WorkflowStep', 'ChecklistTemplate',
          'ChecklistItem', 'SupportTicket', 'FeedbackItem', 'BetaTester'
        ];

        let deletedCount = 0;

        // Delete all user data
        for (const entityName of entities) {
          const records = await base44.asServiceRole.entities[entityName].filter({ 
            created_by: userEmail 
          });
          
          for (const record of records) {
            await base44.asServiceRole.entities[entityName].delete(record.id);
            deletedCount++;
          }

          // Also check for user_email field
          const emailRecords = await base44.asServiceRole.entities[entityName].filter({ 
            user_email: userEmail 
          });
          
          for (const record of emailRecords) {
            await base44.asServiceRole.entities[entityName].delete(record.id);
            deletedCount++;
          }
        }

        // Mark deletion request as completed
        await base44.asServiceRole.entities.AccountDeletionRequest.update(request.id, {
          status: 'completed',
          actual_deletion_date: new Date().toISOString(),
          records_deleted: deletedCount
        });

        processed.push({
          email: userEmail,
          recordsDeleted: deletedCount,
          requestDate: request.requested_date
        });

      } catch (error) {
        errors.push({
          email: request.user_email,
          error: error.message
        });
      }
    }

    return Response.json({
      success: true,
      processed,
      errors,
      totalProcessed: processed.length
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});