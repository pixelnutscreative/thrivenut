import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const { username } = await req.json();
        if (!username) return Response.json({ error: 'Username required' }, { status: 400 });

        // Clean username
        const cleanUsername = username.replace('@', '').trim();

        try {
            // Attempt to scrape
            const res = await fetch(`https://www.tiktok.com/@${cleanUsername}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5'
                }
            });
            
            const html = await res.text();
            
            // Look for data-e2e attributes which are fairly stable on TikTok
            const followersMatch = html.match(/data-e2e="followers-count"[^>]*>([^<]+)<\//);
            const followingMatch = html.match(/data-e2e="following-count"[^>]*>([^<]+)<\//);
            const likesMatch = html.match(/data-e2e="likes-count"[^>]*>([^<]+)<\//);
            
            if (followersMatch && likesMatch) {
                return Response.json({
                    followers: followersMatch[1],
                    following: followingMatch ? followingMatch[1] : '0',
                    likes: likesMatch[1],
                    timestamp: new Date().toISOString()
                });
            } 
            
            // Fallback: Check for SIGI_STATE (JSON data embedded in page)
            const sigiMatch = html.match(/<script id="SIGI_STATE" type="application\/json">(.*?)<\/script>/);
            if (sigiMatch) {
                try {
                    const data = JSON.parse(sigiMatch[1]);
                    const userModule = data.UserModule;
                    const userId = Object.keys(userModule.users)[0];
                    const stats = userModule.stats[userId];
                    
                    if (stats) {
                        return Response.json({
                            followers: stats.followerCount,
                            following: stats.followingCount,
                            likes: stats.heartCount,
                            videoCount: stats.videoCount,
                            timestamp: new Date().toISOString()
                        });
                    }
                } catch (e) {
                    console.error("SIGI parse error", e);
                }
            }

            throw new Error('Stats not found in HTML');

        } catch (scrapeError) {
             console.error('Scrape error:', scrapeError);
             // Return 422 to indicate scraping failed but request was valid
             // This tells frontend to show manual input
             return Response.json({ error: 'scrape_failed', details: scrapeError.message }, { status: 422 });
        }

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});