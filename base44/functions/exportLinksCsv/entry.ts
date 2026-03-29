import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return new Response("Unauthorized", { status: 401 });
        }

        // Fetch User Resources (My Stuff)
        const myResources = await base44.entities.UserResource.filter({ user_email: user.email });

        // Fetch Design Resources (Pixel's Place)
        // Using asServiceRole to ensure we can read them regardless of any RLS on DesignResource
        const pixelResources = await base44.asServiceRole.entities.DesignResource.filter({});

        // Build CSV content
        let csvContent = "Source,Title,URL,Description,Category\n";

        // Append My Stuff
        myResources.forEach(res => {
            const title = `"${(res.title || '').replace(/"/g, '""')}"`;
            const url = `"${(res.url || '').replace(/"/g, '""')}"`;
            const desc = `"${(res.description || res.notes || '').replace(/"/g, '""')}"`;
            const cat = `"${(res.category || '').replace(/"/g, '""')}"`;
            csvContent += `My Stuff,${title},${url},${desc},${cat}\n`;
        });

        // Append Pixel's Place
        pixelResources.forEach(res => {
            const title = `"${(res.name || '').replace(/"/g, '""')}"`;
            const url = `"${(res.link || '').replace(/"/g, '""')}"`;
            const desc = `"${(res.description || '').replace(/"/g, '""')}"`;
            const cat = `"${(Array.isArray(res.category) ? res.category.join(', ') : (res.category || '')).replace(/"/g, '""')}"`;
            csvContent += `Pixel's Place,${title},${url},${desc},${cat}\n`;
        });

        return new Response(csvContent, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': 'attachment; filename="links_export.csv"'
            }
        });
    } catch (error) {
        return new Response(`Error: ${error.message}`, { status: 500 });
    }
});