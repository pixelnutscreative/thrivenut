import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    const coins = await base44.asServiceRole.entities.CustomCoin.filter({symbol: 'PNIC'});
    if (coins.length > 0) {
        await base44.asServiceRole.entities.CustomCoin.update(coins[0].id, {
            current_price: 0.006147,
            updated_by: 'system'
        });
        return Response.json({success: true, message: "Updated PNIC to 0.006147"});
    }
    return Response.json({success: false, message: "PNIC not found"});
});