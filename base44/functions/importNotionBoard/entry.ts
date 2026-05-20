import { createClientFromRequest } from 'npm:@base44/sdk@0.8.29';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        const rawData = [
            ["Make a Brand Content Manager Feature in THRIVE", "ThriveNut", "When You Get To It"],
            ["Thrive Rebuild", "ThriveNut", "When You Get To It"],
            ["Comment Trigger Ecosystem (Nuts + Bots)", "AI Tools", "When You Get To It"],
            ["Embed Code for The Happy One", "Websites", "When You Get To It"],
            ["Affiliate", "Offers", "When You Get To It"],
            ["Testimonial Nut", "AI Tools", "When You Get To It"],
            ["No Code Nut", "AI Tools", "When You Get To It"],
            ["Report BUG - AEO Funnel", "Websites", "When You Get To It"],
            ["Privacy Policy + Terms and Conditions Nut", "Websites", "When You Get To It"],
            ["Find Upscaler for AI Images", "AI Tools", "When You Get To It"],
            ["Teeny Tiny Nut Instagram", "Social Media", "When You Get To It"],
            ["ProShot Nut", "AI Tools", "When You Get To It"],
            ["Make short clips of My AI Journey", "Social Media", "When You Get To It"],
            ["Unshelfables", "Projects", "When You Get To It"],
            ["Google Cloud Billing", "Personal", "When You Get To It"],
            ["Bellator Life", "Personal", "When You Get To It"],
            ["Sub Sticker Nut", "AI Tools", "When You Get To It"],
            ["Add TikTok Coin Link", "Social Media", "When You Get To It"],
            ["Coach Brandy LIVE Workshop", "Projects", "When You Get To It"],
            ["Write and Publish Pixel Heroes Animation Announcement", "Social Media", "Normal"],
            ["TikTok Shop GPTs Announcement", "Social Media", "Normal"],
            ["$7 NutSnaps Launch Plan", "Offers", "Normal"],
            ["Print on Demand Course", "Offers", "Normal"],
            ["Finish LGN Funnel + Circle 5 Heads-up", "Websites", "Normal"],
            ["Facebook Cover Template Fix", "Social Media", "When You Get To It"],
            ["Daily Schedule Planner", "Projects", "When You Get To It"],
            ["Offertunity Page Templates", "Offers", "Normal"],
            ["Annie Berryhill Follow-up", "Personal", "Normal"],
            ["Canva Brand Guide Tutorial", "AI Tools", "Normal"],
            ["Concentration Music", "Personal", "When You Get To It"],
            ["Comment Funnel Course", "Websites", "Normal"],
            ["Social Media Templates", "Social Media", "Normal"],
            ["Logo Showcase Page", "Projects", "When You Get To It"],
            ["Biz Kids Project", "Projects", "Normal"],
            ["Meta Ads Adorable Campaign", "Offers", "Normal"],
            ["VIP Client Room", "Offers", "Normal"],
            ["Pixel Nuts Toolkit Update", "Projects", "Normal"],
            ["NutPals Party - Nut of the Week", "AI Tools", "When You Get To It"],
            ["Motivation Master GPT", "AI Tools", "When You Get To It"],
            ["Fix Untitled GPT", "AI Tools", "When You Get To It"],
            ["Sustainable Sourcing Savvy GPT", "AI Tools", "When You Get To It"],
            ["Ethical Expert GPT", "AI Tools", "When You Get To It"],
            ["Summit Strategist GPT", "AI Tools", "When You Get To It"],
            ["Podcast Boss GPT", "AI Tools", "When You Get To It"],
            ["Donation Director GPT", "AI Tools", "When You Get To It"],
            ["Charity Champion GPT", "AI Tools", "When You Get To It"],
            ["Bot Builder GPT", "AI Tools", "When You Get To It"],
            ["Chat Champion GPT", "AI Tools", "When You Get To It"],
            ["Service Star GPT", "AI Tools", "When You Get To It"],
            ["Network Nurturer GPT", "AI Tools", "When You Get To It"],
            ["Ask Me Anything GPT", "AI Tools", "When You Get To It"],
            ["Solution Stacks GPT", "AI Tools", "When You Get To It"],
            ["Tech Untangler GPT", "AI Tools", "When You Get To It"],
            ["High Tech Helper GPT", "AI Tools", "When You Get To It"],
            ["AI Training Wizard Setup", "AI Tools", "When You Get To It"],
            ["AI Lip-Sync Video", "AI Tools", "When You Get To It"],
            ["Paint by Number Nut Maps", "AI Tools", "When You Get To It"],
            ["Kids Books and Coloring AI", "AI Tools", "When You Get To It"],
            ["Tiffany Script AI Film Test", "AI Tools", "When You Get To It"],
            ["Bible Believers App Series", "Personal", "Normal"],
            ["AI Chatbot Tutorial", "AI Tools", "When You Get To It"],
            ["AI Profitable Businesses", "AI Tools", "When You Get To It"],
            ["Relationship Decision Nut", "AI Tools", "When You Get To It"]
        ];

        let added = 0;
        let skipped = 0;
        let total = rawData.length;

        for (const row of rawData) {
            const [title, category, priority] = row;
            const existing = await base44.asServiceRole.entities.PixelBoard.filter({ title });
            
            if (existing && existing.length > 0) {
                skipped++;
                continue;
            }

            await base44.asServiceRole.entities.PixelBoard.create({
                title,
                category,
                priority,
                question_type: "Task",
                asked_by: "Nikole",
                status: "Unanswered",
                nikole_read: true,
                pixel_read: false,
                batch_ready: false,
                choices: [],
                answer_type: "Text",
                is_pinned: false
            });
            added++;
        }

        return Response.json({ success: true, added, skipped, total });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});