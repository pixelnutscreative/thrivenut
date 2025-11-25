import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shareGifterData, formatGifterListForEmail } from '../components/gifter/useGifterSharing';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, User, Loader2, Search, UserPlus, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function GifterManager() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: preferences } = useQuery({
    queryKey: ['preferences', user?.email],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: user.email });
      return prefs[0] || null;
    },
    enabled: !!user,
  });

  // Fetch contacts marked as gifters
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['tiktokContacts', user?.email],
    queryFn: () => base44.entities.TikTokContact.filter({ created_by: user.email }, '-created_date'),
    enabled: !!user,
  });

  const gifters = contacts.filter(c => c.is_gifter);

  const filteredGifters = gifters.filter(g =>
    g.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.screen_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Gifter Manager</h1>
            <p className="text-gray-600 mt-1">Your gifters for thank-you songs</p>
          </div>
          <Link to={createPageUrl('TikTokContacts')}>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Manage Contacts
            </Button>
          </Link>
        </div>

        {/* Info Card */}
        <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Gift className="w-6 h-6 text-amber-600" />
              <div>
                <p className="font-medium text-gray-800">Gifters are now managed from TikTok Contacts</p>
                <p className="text-sm text-gray-600">Add contacts and enable "Gifter" to track them here</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search gifters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Gifter List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : filteredGifters.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 mb-4">No gifters found.</p>
              <Link to={createPageUrl('TikTokContacts')}>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Gifters in Contacts
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredGifters.map((gifter, index) => (
              <motion.div
                key={gifter.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg">{gifter.screen_name || gifter.display_name || gifter.username}</h3>
                        <p className="text-purple-600">@{gifter.username}</p>
                        {gifter.phonetic && (
                          <p className="text-sm text-gray-500 italic mt-1">
                            🎵 "{gifter.phonetic}"
                          </p>
                        )}
                      </div>
                      <Link to={createPageUrl('TikTokContacts')}>
                        <Button variant="outline" size="sm">
                          Edit in Contacts
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}