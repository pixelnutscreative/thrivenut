import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shareGifterData } from '../components/gifter/useGifterSharing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, Trophy, Medal, Award } from 'lucide-react';
import { format, startOfWeek } from 'date-fns';
import { motion } from 'framer-motion';
import { getEffectiveUserEmail } from '../components/admin/ImpersonationBanner';

export default function GiftEntry() {
  const queryClient = useQueryClient();
  // Week ending Sunday
  const getWeekEndingSunday = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? 0 : 7 - day;
    d.setDate(d.getDate() + diff);
    return format(d, 'yyyy-MM-dd');
  };
  const [selectedWeek, setSelectedWeek] = useState(getWeekEndingSunday(new Date()));
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    gifter_id: '',
    gift_id: '',
    rank: ''
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Get effective email (real user or impersonated)
  const effectiveEmail = user ? getEffectiveUserEmail(user.email) : null;

  const { data: preferences } = useQuery({
    queryKey: ['preferences', effectiveEmail],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: effectiveEmail });
      return prefs[0] || null;
    },
    enabled: !!effectiveEmail,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['tiktokContacts', effectiveEmail],
    queryFn: () => base44.entities.TikTokContact.filter({ created_by: effectiveEmail }, 'display_name'),
    enabled: !!effectiveEmail,
  });

  const gifters = contacts.filter(c => c.is_gifter);

  // Gift library is shared across all users
  const { data: gifts = [] } = useQuery({
    queryKey: ['gifts'],
    queryFn: () => base44.entities.Gift.list('name'),
  });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['giftingEntries', selectedWeek, effectiveEmail],
    queryFn: () => base44.entities.GiftingEntry.filter({ week: selectedWeek, created_by: effectiveEmail }),
    enabled: !!effectiveEmail,
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const gifter = gifters.find(g => g.id === data.gifter_id);
      const gift = gifts.find(g => g.id === data.gift_id);
      
      return base44.entities.GiftingEntry.create({
        ...data,
        week: selectedWeek,
        gifter_username: gifter?.username,
        gifter_screen_name: gifter?.display_name || gifter?.username,
        gifter_phonetic: gifter?.phonetic,
        gift_name: gift?.name
      });
    },
    onSuccess: async (newEntry) => {
      queryClient.invalidateQueries({ queryKey: ['giftingEntries'] });
      setFormData({ gifter_id: '', gift_id: '', rank: '' });
      
      const rankEmoji = { '1st': '🥇', '2nd': '🥈', '3rd': '🥉' };
      await shareGifterData(
        preferences,
        `🎁 New Gift Entry - Week Ending ${format(new Date(selectedWeek), 'MMM d, yyyy')}`,
        `New gift entry recorded:\n\n${rankEmoji[newEntry.rank] || '⭐'} ${newEntry.gifter_screen_name} (@${newEntry.gifter_username})\nGift: ${newEntry.gift_name}\n\n---\nFrom ThriveNut Gift Entry`
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GiftingEntry.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['giftingEntries'] });
    },
  });

  const handleSubmit = () => {
    if (!formData.gifter_id || !formData.gift_id || !formData.rank) {
      alert('Please fill in all required fields');
      return;
    }
    createMutation.mutate(formData);
  };

  const selectedGifter = gifters.find(g => g.id === formData.gifter_id);

  const getRankIcon = (rank) => {
    switch (rank) {
      case '1st': return <Trophy className="w-5 h-5 text-yellow-500" />;
      case '2nd': return <Medal className="w-5 h-5 text-gray-400" />;
      case '3rd': return <Award className="w-5 h-5 text-amber-600" />;
      default: return null;
    }
  };

  const sortedEntries = [...entries].sort((a, b) => {
    const rankOrder = { '1st': 1, '2nd': 2, '3rd': 3 };
    return (rankOrder[a.rank] || 4) - (rankOrder[b.rank] || 4);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gift Entry</h1>
          <p className="text-gray-600 mt-1">Record top gifters for each week</p>
        </div>

        {/* Week Selector */}
        <Card>
          <CardContent className="p-4">
            <Label>Week Ending (Sunday)</Label>
            <Input
              type="date"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">Select the Sunday when the gallery closes</p>
          </CardContent>
        </Card>

        {/* Entry Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Gift Entry</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gifter *</Label>
                  <Select
                    value={formData.gifter_id}
                    onValueChange={(value) => setFormData({ ...formData, gifter_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gifter" />
                    </SelectTrigger>
                    <SelectContent>
                      {gifters.map(gifter => (
                        <SelectItem key={gifter.id} value={gifter.id}>
                          {gifter.display_name || gifter.username} (@{gifter.username})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedGifter?.phonetic && (
                    <p className="text-xs text-purple-600 italic">
                      🎵 Phonetic: "{selectedGifter.phonetic}"
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Gift *</Label>
                  <Select
                    value={formData.gift_id}
                    onValueChange={(value) => setFormData({ ...formData, gift_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gift" />
                    </SelectTrigger>
                    <SelectContent>
                      {gifts.map(gift => (
                        <SelectItem key={gift.id} value={gift.id}>
                          {gift.name} {gift.league_range ? `(${gift.league_range})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Rank *</Label>
                <div className="flex gap-4">
                  {['1st', '2nd', '3rd'].map(rank => (
                    <label
                      key={rank}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.rank === rank
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="rank"
                        value={rank}
                        checked={formData.rank === rank}
                        onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                        className="sr-only"
                      />
                      {rank === '1st' && <Trophy className="w-5 h-5 text-yellow-500" />}
                      {rank === '2nd' && <Medal className="w-5 h-5 text-gray-400" />}
                      {rank === '3rd' && <Award className="w-5 h-5 text-amber-600" />}
                      <span className="font-medium">{rank}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </CardContent>
        </Card>

        {/* This Week's Entries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Entries for Week Ending {format(new Date(selectedWeek), 'MMM d, yyyy')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              </div>
            ) : sortedEntries.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No entries for this week yet</p>
            ) : (
              <div className="space-y-3">
                {sortedEntries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getRankIcon(entry.rank)}
                      <div>
                        <p className="font-semibold">{entry.gifter_screen_name}</p>
                        <p className="text-sm text-purple-600">@{entry.gifter_username}</p>
                        <p className="text-xs text-gray-500">Gift: {entry.gift_name}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(entry.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}