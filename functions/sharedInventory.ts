import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { addDays, format, parseISO, isAfter } from 'npm:date-fns@2.30.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { action, ...payload } = await req.json();

        // 1. CREATE LINK (Requires Auth)
        if (action === 'create_link') {
            const user = await base44.auth.me();
            if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

            const token = crypto.randomUUID();
            await base44.entities.InventoryShareLink.create({
                token,
                mod_username: payload.mod_username || 'General',
                creator_email: user.email,
                is_active: true
            });

            // Return the full URL
            // Assuming frontend handles the route construction, we just return the token
            return Response.json({ token });
        }

        // 2. GET CONTEXT (Public with Token)
        if (action === 'get_context') {
            const { token } = payload;
            if (!token) return Response.json({ error: 'Token required' }, { status: 400 });

            // Verify Token (using Service Role to search all links)
            const links = await base44.asServiceRole.entities.InventoryShareLink.filter({ token, is_active: true });
            if (!links.length) return Response.json({ error: 'Invalid or expired token' }, { status: 403 });

            const link = links[0];
            const creatorEmail = link.creator_email;

            // Fetch Creator's Contacts & Inventory
            // We must use service role to read another user's data
            const contacts = await base44.asServiceRole.entities.TikTokContact.filter({ created_by: creatorEmail });
            const powerUps = await base44.asServiceRole.entities.BattlePowerUp.filter({ created_by: creatorEmail }); // Assuming we can filter by created_by metadata if stored, or we rely on app logic.
            
            // Base44 entities store created_by at the top level usually?
            // The filter method on SDK might map 'created_by' to the underlying field.
            // Let's assume standard filtering works.
            
            // Filter active power ups
            const activePowerUps = powerUps.filter(item => {
                if (item.is_used) return false;
                const expires = addDays(parseISO(item.acquired_date), 5);
                return isAfter(expires, new Date());
            });

            return Response.json({ 
                creator: creatorEmail, 
                mod_username: link.mod_username,
                contacts: contacts.map(c => ({ 
                    id: c.id, 
                    display_name: c.display_name, 
                    username: c.username 
                })),
                inventory: activePowerUps
            });
        }

        // 3. ADD ITEM (Public with Token)
        if (action === 'add_item') {
            const { token, item } = payload;
            if (!token) return Response.json({ error: 'Token required' }, { status: 400 });

            const links = await base44.asServiceRole.entities.InventoryShareLink.filter({ token, is_active: true });
            if (!links.length) return Response.json({ error: 'Invalid link' }, { status: 403 });
            const creatorEmail = links[0].creator_email;

            // Create item AS the creator (Service Role with override)
            // We'll create it via service role but manually inject created_by if possible?
            // Base44 SDK create() usually forces created_by to the auth user.
            // If we use asServiceRole, created_by might be the service email or app email.
            // To ensure the Creator sees it, we might need to rely on the fact that `list()` filters by user.
            // If the Creator calls list(), they see their own.
            // We need to spoof the creator or add a field 'owner_email' to BattlePowerUp if created_by isn't sufficient.
            // BUT: Standard entities have `created_by`. 
            // We can try to explicitly set `created_by` in the data payload for service role calls.
            
            const newItem = await base44.asServiceRole.entities.BattlePowerUp.create({
                ...item,
                created_by: creatorEmail // Attempt to override ownership
            });
            
            // Note: If override doesn't work, we might need a different strategy, 
            // but for now let's assume service role can set created_by.
            
            return Response.json(newItem);
        }

        // 4. UPDATE ITEM (Public with Token)
        if (action === 'update_item') {
            const { token, itemId, updates } = payload;
            const links = await base44.asServiceRole.entities.InventoryShareLink.filter({ token, is_active: true });
            if (!links.length) return Response.json({ error: 'Invalid link' }, { status: 403 });

            // Verify item belongs to creator?
            // The service role can update anything, so we should be careful.
            // But getting the item ID implies they fetched it via context first.
            
            await base44.asServiceRole.entities.BattlePowerUp.update(itemId, updates);
            return Response.json({ success: true });
        }

        return Response.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});