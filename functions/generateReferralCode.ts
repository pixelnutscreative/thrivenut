import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Blocked words/patterns
const BLOCKED_PATTERNS = [
  'admin', 'root', 'system', 'thrive', 'official', 'support', 
  'help', 'mod', 'moderator', 'staff', 'team', 'pixel', 'bot',
  'fuck', 'shit', 'damn', 'ass', 'sex', 'porn', 'scam', 'fake'
];

function generateRandomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
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

    const { action, customCode } = await req.json();

    // Check if user already has a referral link
    const existingLinks = await base44.asServiceRole.entities.ReferralLink.filter({ 
      user_email: user.email 
    });

    if (action === 'generate' && existingLinks.length === 0) {
      // Generate new random code
      let code = generateRandomCode();
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
        total_clicks: 0,
        total_signups: 0,
        total_upgrades: 0,
        reward_level: 1,
        is_active: true
      });

      return Response.json({ 
        success: true, 
        referral_code: code,
        message: 'Referral code generated! You can customize it anytime.'
      });
    }

    if (action === 'customize' && customCode) {
      // Validate custom code
      const cleanCode = customCode.toUpperCase().trim().replace(/[^A-Z0-9-]/g, '');
      
      if (cleanCode.length < 3 || cleanCode.length > 30) {
        return Response.json({ 
          error: 'Code must be 3-30 characters' 
        }, { status: 400 });
      }

      if (!isCodeValid(cleanCode)) {
        return Response.json({ 
          error: 'This code contains blocked words. Please choose another.' 
        }, { status: 400 });
      }

      // Check if code is already taken
      const taken = await base44.asServiceRole.entities.ReferralLink.filter({ 
        referral_code: cleanCode 
      });

      if (taken.length > 0 && taken[0].user_email !== user.email) {
        return Response.json({ 
          error: 'This code is already taken. Try another!' 
        }, { status: 400 });
      }

      // Update code
      await base44.asServiceRole.entities.ReferralLink.update(existingLinks[0].id, {
        referral_code: cleanCode
      });

      return Response.json({ 
        success: true, 
        referral_code: cleanCode 
      });
    }

    // Get current code
    if (existingLinks.length > 0) {
      return Response.json({ 
        success: true,
        referral_code: existingLinks[0].referral_code,
        stats: {
          clicks: existingLinks[0].total_clicks || 0,
          signups: existingLinks[0].total_signups || 0,
          upgrades: existingLinks[0].total_upgrades || 0
        }
      });
    }

    return Response.json({ 
      error: 'No referral code found. Generate one first.' 
    }, { status: 404 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});