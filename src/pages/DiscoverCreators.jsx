import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Copy, Check, Video, RefreshCw, MessageCircle, Users, ExternalLink, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function DiscoverCreators() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch all shared calendar items grouped by creator
  const { data: sharedItems = [] } = useQuery({
    queryKey: ['sharedCalendarItems'],
    queryFn: async () => {
      const items = await base44.entities.ContentCalendarItem.filter({ share_to_directory: true });
      return items;
    },
    initialData: [],
  });

  // Fetch preferences to get tiktok usernames and community info
  const { data: allPreferences = [] } = useQuery({
    queryKey: ['allUserPreferences'],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.list();
      return prefs.filter(p => p.tiktok_username && p.allow_in_community_directory);
    },
    initialData: [],
  });

  const { data: allProfiles = [] } = useQuery({
    queryKey: ['allUserProfiles'],
    queryFn: async () => {
      return await base44.entities.UserProfile.list();
    },
    initialData: [],
  });

  // Discord workshop signup URL
  const discordWorkshopUrl = "https://pixelnutscreative.com/discord-workshop";

  // Group shared items by creator email
  const directoryCreators = React.useMemo(() => {
    const grouped = {};
    
    // Add creators who have shared calendar items
    sharedItems.forEach(item => {
      const email = item.created_by;
      if (!grouped[email]) {
        const pref = allPreferences.find(p => p.user_email === email);
        const profile = allProfiles.find(p => p.user_email === email);
        // Better name logic: TikTok username > Nickname > Real Name > Email
        const displayName = pref?.tiktok_username || profile?.nickname || profile?.real_name || email.split('@')[0];
        
        grouped[email] = {
          email,
          tiktok_username: displayName,
          discord_username: pref?.discord_username,
          discord_invite_link: pref?.discord_invite_link,
          discord_public: pref?.discord_public,
          communities: pref?.communities || [],
          items: []
        };
      }
      grouped[email].items.push(item);
    });
    
    // Also add creators who just have community info but no calendar items
    allPreferences.forEach(pref => {
      if (!grouped[pref.user_email] && (pref.discord_public || (pref.communities && pref.communities.some(c => c.is_public)))) {
        grouped[pref.user_email] = {
          email: pref.user_email,
          tiktok_username: pref.tiktok_username || pref.user_email.split('@')[0],
          discord_username: pref.discord_username,
          discord_invite_link: pref.discord_invite_link,
          discord_public: pref.discord_public,
          communities: pref.communities || [],
          items: []
        };
      }
    });
    
    return Object.values(grouped);
  }, [sharedItems, allPreferences]);

  // Search results
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim() || !searchAttempted) return [];
    const cleanQuery = searchQuery.replace('@', '').trim().toLowerCase();
    return directoryCreators.filter(c => 
      c.tiktok_username.toLowerCase().includes(cleanQuery)
    );
  }, [directoryCreators, searchQuery, searchAttempted]);

  const addToCalendarMutation = useMutation({
    mutationFn: async ({ creator, item }) => {
      return await base44.entities.LiveSchedule.create({
        host_username: creator.tiktok_username,
        recurring_days: [item.day_of_week],
        time: item.time,
        live_types: [item.type === 'live' ? 'regular' : item.type],
        priority: 5,
        is_recurring: item.is_recurring !== false,
        notes: item.title || 'Added from ThriveNut',
        audience_restriction: item.audience || 'all_ages',
        creator_timezone: 'America/New_York'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['liveSchedules'] });
      alert('Added to your Creator Calendar!');
    },
  });

  const handleSearch = () => {
    setSearchAttempted(true);
  };

  const generateInviteMessage = () => {
    const message = `Hey! I use ThriveNut to plan my TikTok content and track live schedules. It's super helpful for staying organized! 

You can share your live schedule with the community too. Check it out: ${window.location.origin}

Would love to see you there! 🎉`;
    
    navigator.clipboard.writeText(message);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  const displayResults = searchAttempted && searchQuery.trim() ? searchResults : directoryCreators;
  const noResults = searchAttempted && searchQuery.trim() && searchResults.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Discover Creators</h1>
          <p className="text-gray-600 mt-1">Find and follow ThriveNut creators' live schedules</p>
        </div>

        {/* Discord Workshop Promo */}
        <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Discord Workshop / Open Office Hours</h3>
                  <p className="text-white/80 text-sm">Join Pixel twice a month for help with Discord, Canva & more!</p>
                </div>
              </div>
              <Button
                onClick={() => window.open(discordWorkshopUrl, '_blank')}
                className="bg-white text-purple-600 hover:bg-gray-100 shrink-0"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Register Now
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Input
                placeholder="Search by TikTok username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button 
                onClick={handleSearch}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* No Results / Invite */}
        {noResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="p-8 text-center space-y-4">
                <p className="text-gray-600">
                  It looks like <span className="font-semibold">@{searchQuery}</span> either isn't sharing their lives or isn't on ThriveNut yet.
                </p>
                <Button
                  onClick={generateInviteMessage}
                  variant="outline"
                  className="gap-2"
                >
                  {copiedInvite ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied Invite Message!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Invite Message
                    </>
                  )}
                </Button>
                <p className="text-sm text-gray-500">
                  Send them an invite to join ThriveNut and share their schedule!
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Results */}
        {displayResults.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">
              {searchAttempted && searchQuery.trim() ? 'Search Results' : 'Community Directory'}
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayResults.map((creator, index) => (
                <motion.div
                  key={creator.email}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-purple-600">@{creator.tiktok_username}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Community Links */}
                      {(creator.discord_public || creator.communities?.some(c => c.is_public)) && (
                        <div className="flex flex-wrap gap-2 pb-2 border-b border-gray-100">
                          {creator.discord_public && creator.discord_invite_link && (
                            <a
                              href={creator.discord_invite_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs hover:bg-indigo-200 transition-colors"
                            >
                              <MessageCircle className="w-3 h-3" />
                              Discord
                              {creator.discord_username && <span className="opacity-70">@{creator.discord_username}</span>}
                            </a>
                          )}
                          {creator.communities?.filter(c => c.is_public).map((community, idx) => (
                            <a
                              key={idx}
                              href={community.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
                                community.platform === 'skool' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                                community.platform === 'facebook' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                                'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              <Users className="w-3 h-3" />
                              {community.name || community.platform}
                              {community.is_paid && <Badge className="text-[10px] bg-amber-100 text-amber-700 ml-1">Paid</Badge>}
                              {community.is_free && !community.is_paid && <Badge className="text-[10px] bg-green-100 text-green-700 ml-1">Free</Badge>}
                            </a>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-sm text-gray-600">
                        {creator.items.length} live{creator.items.length !== 1 ? 's' : ''} shared
                      </p>
                      
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {creator.items.map((item) => (
                          <div key={item.id} className="p-3 rounded-lg bg-pink-50 border border-pink-200">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className="text-xs bg-pink-100 border-pink-300">
                                    <Video className="w-3 h-3 mr-1" />
                                    Live
                                  </Badge>
                                  {item.is_recurring && (
                                    <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200">
                                      <RefreshCw className="w-3 h-3 mr-1" />
                                      Weekly
                                    </Badge>
                                  )}
                                  {item.audience === '18+' && (
                                    <Badge className="text-xs bg-red-100 text-red-700">18+</Badge>
                                  )}
                                </div>
                                {item.title && (
                                  <p className="font-semibold text-sm mt-1 truncate">{item.title}</p>
                                )}
                                <p className="text-xs text-gray-600 mt-1">
                                  📅 {item.day_of_week}s at {item.time}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => addToCalendarMutation.mutate({ creator, item })}
                                disabled={addToCalendarMutation.isPending}
                                className="shrink-0 border-purple-300 text-purple-700 hover:bg-purple-50"
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!searchAttempted && directoryCreators.length === 0 && (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="p-12 text-center">
              <p className="text-gray-600 mb-4">
                No creators are sharing their schedules in the directory yet.
              </p>
              <p className="text-sm text-gray-500">
                Be the first! Share your schedule in your TikTok Goals settings.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}