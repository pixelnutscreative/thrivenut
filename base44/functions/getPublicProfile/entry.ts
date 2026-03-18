import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { email } = await req.json();

    if (!email) {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    // Use service role to fetch user profile since we're reading another user's data
    // Security: Only return data allowed by privacy settings
    const profiles = await base44.asServiceRole.entities.UserProfile.filter({ user_email: email });
    const profile = profiles[0];

    if (!profile) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    const privacy = profile.privacy_settings || {};
    
    // Check global sharing permission
    if (profile.allow_sharing === false) {
      return Response.json({ error: 'Profile is private' }, { status: 403 });
    }

    // Construct public profile based on privacy settings
    const publicProfile = {
      // Basic info is always public if sharing is enabled
      real_name: profile.real_name,
      nickname: profile.nickname,
      image_url: profile.image_url,
      phonetic: profile.phonetic,
      
      // Conditionally shared fields
      clothing_sizes: privacy.share_sizes ? profile.clothing_sizes : {},
      wish_list: privacy.share_wishlist ? profile.wish_list : [],
      social_links: privacy.share_socials ? profile.social_links : {},
      
      // Recovery & Military
      is_in_recovery: privacy.share_recovery ? profile.is_in_recovery : false,
      recovery_date: privacy.share_recovery ? profile.recovery_date : null,
      is_veteran: privacy.share_military ? profile.is_veteran : false,
      veteran_branch: privacy.share_military ? profile.veteran_branch : null,
      
      // Preferences
      favorite_color: privacy.share_color ? profile.favorite_color : null,
      beauty_profile: privacy.share_beauty ? profile.beauty_profile : {},
      style_profile: privacy.share_style ? profile.style_profile : {},
      food_preferences: profile.food_preferences || {}, // Assuming food is generally safe/shared if profile is public
      allergies: privacy.share_allergies ? profile.allergies : [],
      dietary_restrictions: profile.dietary_restrictions || [],
      
      // Creator Info
      creator_info: privacy.share_creator_info ? {
        role: profile.role,
        creator_notes: profile.creator_notes,
        live_stream_types: profile.live_stream_types,
        calendar_enabled: profile.calendar_enabled
      } : {}
    };

    return Response.json(publicProfile);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});