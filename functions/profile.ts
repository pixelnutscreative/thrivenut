import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { action, email, data } = await req.json();

        // GET PROFILE: Fetch another user's profile by email
        if (action === 'get_profile') {
            if (!email) return Response.json({ error: 'Email required' }, { status: 400 });
            
            // Use service role to search across all users
            const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: email });
            const profile = profiles[0];

            if (!profile) {
                return Response.json({ found: false });
            }

            if (!profile.allow_sharing) {
                return Response.json({ found: true, restricted: true });
            }

            return Response.json({ found: true, profile });
        }

        // SUGGEST: Create a suggestion for another user
        if (action === 'suggest') {
            const { target_email, suggestion_type, content, message } = data;
            
            await base44.asServiceRole.entities.ProfileSuggestion.create({
                to_email: target_email,
                from_email: user.email,
                from_name: user.full_name || 'A friend',
                suggestion_type,
                content,
                message,
                status: 'pending'
            });

            return Response.json({ success: true });
        }
        
        // GET SUGGESTIONS: Get suggestions for me
        if (action === 'get_suggestions') {
             const suggestions = await base44.asServiceRole.entities.ProfileSuggestion.filter({ 
                 to_email: user.email,
                 status: 'pending' 
             }, '-created_date');
             return Response.json({ suggestions });
        }
        
        // RESOLVE SUGGESTION: Accept/Reject
        if (action === 'resolve_suggestion') {
            const { id, status, profile_data } = data; // status = 'accepted' or 'rejected'
            
            // Update status
            await base44.asServiceRole.entities.ProfileSuggestion.update(id, { status });
            
            // If accepted and data provided, update my profile
            if (status === 'accepted' && profile_data) {
                const myProfiles = await base44.entities.UserProfile.filter({ user_email: user.email });
                let myProfile = myProfiles[0];
                
                if (!myProfile) {
                    // Create if doesn't exist
                    myProfile = await base44.entities.UserProfile.create({
                        user_email: user.email,
                        ...profile_data
                    });
                } else {
                    // Merge update (specifically for arrays like wish_list)
                    if (profile_data.wish_list && Array.isArray(profile_data.wish_list)) {
                         const currentList = myProfile.wish_list || [];
                         // Append new items
                         const newList = [...currentList, ...profile_data.wish_list];
                         await base44.entities.UserProfile.update(myProfile.id, { wish_list: newList });
                    } else {
                        // General update for other fields
                        await base44.entities.UserProfile.update(myProfile.id, profile_data);
                    }
                }
            }
            
            return Response.json({ success: true });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});