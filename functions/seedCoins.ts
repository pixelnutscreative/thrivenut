import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    const base44 = createClientFromRequest(req);
    // Check if they exist first to avoid duplicates
    const existing = await base44.asServiceRole.entities.CustomCoin.list();
    if (existing.length === 0) {
        await base44.asServiceRole.entities.CustomCoin.create({symbol: 'PNIC', name: 'Pixel Nuts Coin', current_price: 0.0069, updated_by: 'system'});
        await base44.asServiceRole.entities.CustomCoin.create({symbol: 'MIRX', name: 'MIRX', current_price: 1.23, updated_by: 'system'});
        return Response.json({success: true, message: "Created"});
    }
    return Response.json({success: true, message: "Already exist"});
});