import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Copy, Check } from 'lucide-react';
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

  // Fetch preferences to get tiktok usernames
  const { data: allPreferences = [] } = useQuery({
    queryKey: ['allUserPreferences'],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.list();
      return prefs.filter(p => p.tiktok_username && p.allow_in_community_directory);
    },
    initialData: [],
  });

  // Group shared items by creator email
  const directoryCreators = React.useMemo(() => {
    const grouped = {};
    sharedItems.forEach(item => {
      const email = item.created_by;
      if (!grouped[email]) {
        const pref = allPreferences.find(p => p.user_email === email);
        grouped[email] = {
          email,
          tiktok_username: pref?.tiktok_username || email.split('@')[0],
          items: []
        };
      }
      grouped[email].items.push(item);
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
                      <p className="text-sm text-gray-600">
                        {creator.items.length} shared item{creator.items.length !== 1 ? 's' : ''}
                      </p>
                      
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {creator.items.map((item) => (
                          <div key={item.id} className={`p-3 rounded-lg space-y-2 ${
                            item.type === 'live' ? 'bg-pink-50' : 
                            item.type === 'post' ? 'bg-purple-50' : 'bg-teal-50'
                          }`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {item.type === 'live' ? '🔴 Live' : item.type === 'post' ? '📱 Post' : '💬 Engage'}
                                  </Badge>
                                  {item.audience === '18+' && (
                                    <Badge className="text-xs bg-red-100 text-red-700">18+</Badge>
                                  )}
                                </div>
                                {item.title && (
                                  <p className="font-semibold text-sm mt-1">{item.title}</p>
                                )}
                                <p className="text-xs text-gray-600">
                                  {item.day_of_week} at {item.time}
                                </p>
                              </div>
                            </div>
                            {item.type === 'live' && (
                              <Button
                                size="sm"
                                onClick={() => addToCalendarMutation.mutate({ creator, item })}
                                disabled={addToCalendarMutation.isPending}
                                className="w-full bg-purple-600 hover:bg-purple-700"
                              >
                                <Plus className="w-3 h-3 mr-1" />
                                Add to My Calendar
                              </Button>
                            )}
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