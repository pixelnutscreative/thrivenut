import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Reserved words/patterns (not available)
const BLOCKED_PATTERNS = [
  'admin', 'root', 'system', 'thrive', 'official', 'support', 
  'help', 'mod', 'moderator', 'staff', 'team', 'bot',
  'fuck', 'shit', 'damn', 'ass', 'sex', 'porn', 'scam', 'fake'
];

function generateRandomCode() {
  const chars = 'abcdefghjklmnpqrstuvwxyz23456789'; // Exclude confusing chars, lowercase
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function getTikTokUsername(base44, userEmail) {
  try {
    const contacts = await base44.asServiceRole.entities.TikTokContact.filter({ 
      user_email: userEmail,
      is_me: true 
    });
    if (contacts.length > 0 && contacts[0].username) {
      return contacts[0].username.replace('@', '').toLowerCase();
    }
  } catch (error) {
    console.log('No TikTok username found');
  }
  return null;
}

function isCodeValid(code) {
  const lower = code.toLowerCase();
  return !BLOCKED_PATTERNS.some(pattern => lower.includes(pattern));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, customCode, codeLabel, linkId } = await req.json();

    // Check if user already has referral links
    const existingLinks = await base44.asServiceRole.entities.ReferralLink.filter({ 
      user_email: user.email 
    });

    // Auto-generate if explicitly requested OR if fetching but none exist
    if (action === 'generate' || (action === 'get' && existingLinks.length === 0)) {
      // Check limit (7 codes max)
      if (existingLinks.length >= 7) {
        return Response.json({ 
          error: 'Maximum 7 referral codes allowed' 
        }, { status: 400 });
      }

      // Try TikTok username first, then random
      let code = await getTikTokUsername(base44, user.email);
      
      if (!code || !isCodeValid(code)) {
        code = generateRandomCode();
      }
      
      let attempts = 0;
      
      // Ensure unique code
      while (attempts < 10) {
        const existing = await base44.asServiceRole.entities.ReferralLink.filter({ 
          referral_code: code 
        });
        if (existing.length === 0) break;
        code = generateRandomCode();
        attempts++;
      }

      // Create referral link
      const newLink = await base44.asServiceRole.entities.ReferralLink.create({
        user_email: user.email,
        referral_code: code,
        code_label: codeLabel || '',
        total_clicks: 0,
        total_signups: 0,
        total_upgrades: 0,
        reward_level: 1,
        is_active: true,
        is_primary: existingLinks.length === 0 // First code is primary
      });

      // If this was an implicit generation ('get'), return the list format expected by the frontend query
      if (action === 'get') {
        return Response.json({ 
          success: true,
          links: [{
            id: newLink.id,
            referral_code: newLink.referral_code,
            code_label: newLink.code_label || '',
            is_primary: newLink.is_primary || false,
            is_active: newLink.is_active,
            stats: {
              clicks: 0,
              signups: 0,
              upgrades: 0
            }
          }]
        });
      }

      return Response.json({ 
        success: true, 
        link: newLink,
        message: 'Referral code generated! You can customize it anytime.'
      });
    }

    if (action === 'customize' && customCode && linkId) {
      // Validate custom code (lowercase only)
      const cleanCode = customCode.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
      
      if (cleanCode.length < 3 || cleanCode.length > 30) {
        return Response.json({ 
          error: 'Code must be 3-30 characters' 
        }, { status: 400 });
      }

      if (!isCodeValid(cleanCode)) {
        return Response.json({ 
          error: 'This code is not available. Please choose another.' 
        }, { status: 400 });
      }

      // Check if code is already taken
      const taken = await base44.asServiceRole.entities.ReferralLink.filter({ 
        referral_code: cleanCode 
      });

      if (taken.length > 0 && taken[0].id !== linkId) {
        return Response.json({ 
          error: 'This code is already taken. Try another!' 
        }, { status: 400 });
      }

      // Update code
      await base44.asServiceRole.entities.ReferralLink.update(linkId, {
        referral_code: cleanCode,
        code_label: codeLabel || ''
      });

      return Response.json({ 
        success: true, 
        referral_code: cleanCode 
      });
    }

    if (action === 'delete' && linkId) {
      // Don't allow deleting if it's the only link
      if (existingLinks.length === 1) {
        return Response.json({ 
          error: 'Cannot delete your only referral code' 
        }, { status: 400 });
      }

      await base44.asServiceRole.entities.ReferralLink.delete(linkId);

      return Response.json({ 
        success: true 
      });
    }

    // Get all codes
    if (existingLinks.length > 0) {
      const linksWithStats = existingLinks.map(link => ({
        id: link.id,
        referral_code: link.referral_code,
        code_label: link.code_label || '',
        is_primary: link.is_primary || false,
        is_active: link.is_active,
        stats: {
          clicks: link.total_clicks || 0,
          signups: link.total_signups || 0,
          upgrades: link.total_upgrades || 0
        }
      }));

      return Response.json({ 
        success: true,
        links: linksWithStats
      });
    }

    return Response.json({ 
      error: 'No referral codes found. Generate one first.' 
    }, { status: 404 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});