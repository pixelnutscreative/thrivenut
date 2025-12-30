import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

        const { username } = await req.json(); // Keep for backward compat, but official api uses auth user

        // 1. Try Official Integration First
        try {
            const accessToken = await base44.asServiceRole.connectors.getAccessToken('tiktok');
            if (accessToken) {
                // Fetch stats from official API
                // user.info.stats scope required
                const fields = 'follower_count,following_count,likes_count,video_count,display_name,avatar_url';
                const apiRes = await fetch(`https://open.tiktokapis.com/v2/user/info/?fields=${fields}`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    }
                });
                
                const apiData = await apiRes.json();
                
                if (apiData.data && apiData.data.user) {
                    const u = apiData.data.user;
                    return Response.json({
                        followers: u.follower_count,
                        following: u.following_count,
                        likes: u.likes_count,
                        videoCount: u.video_count,
                        avatar: u.avatar_url,
                        username: u.display_name, // Official name
                        source: 'official_api',
                        timestamp: new Date().toISOString()
                    });
                }
                console.log("TikTok API Error or Empty:", JSON.stringify(apiData));
            }
        } catch (integrationError) {
            console.log("Integration check failed (not connected):", integrationError.message);
        }

        // 2. Fallback to Scraping if no integration or integration failed
        if (!username) return Response.json({ error: 'Username required for scraping fallback' }, { status: 400 });

        const cleanUsername = username.replace('@', '').trim();

        try {
            const res = await fetch(`https://www.tiktok.com/@${cleanUsername}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5'
                }
            });
            
            const html = await res.text();
            
            const followersMatch = html.match(/data-e2e="followers-count"[^>]*>([^<]+)<\//);
            const followingMatch = html.match(/data-e2e="following-count"[^>]*>([^<]+)<\//);
            const likesMatch = html.match(/data-e2e="likes-count"[^>]*>([^<]+)<\//);
            
            if (followersMatch && likesMatch) {
                return Response.json({
                    followers: followersMatch[1],
                    following: followingMatch ? followingMatch[1] : '0',
                    likes: likesMatch[1],
                    timestamp: new Date().toISOString(),
                    source: 'scrape'
                });
            } 
            
            const sigiMatch = html.match(/<script id="SIGI_STATE" type="application\/json">(.*?)<\/script>/);
            if (sigiMatch) {
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
                        timestamp: new Date().toISOString(),
                        source: 'scrape'
                    });
                }
            }

            throw new Error('Stats not found in HTML');

        } catch (scrapeError) {
             console.error('Scrape error:', scrapeError);
             return Response.json({ error: 'scrape_failed', details: scrapeError.message }, { status: 422 });
        }

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});