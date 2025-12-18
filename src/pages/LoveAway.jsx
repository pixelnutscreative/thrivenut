import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Gift, Sparkles, Trophy, Users, Settings, Play, X, Edit } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { useTheme } from '../components/shared/useTheme';
import LoveAwaySpinner from '../components/loveaway/LoveAwaySpinner';
import LoveAwayEntriesList from '../components/loveaway/LoveAwayEntriesList';

export default function LoveAway() {
  const queryClient = useQueryClient();
  const { isDark, bgClass, primaryColor, textClass, cardBgClass } = useTheme();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEntriesDialog, setShowEntriesDialog] = useState(null);
  const [showSpinner, setShowSpinner] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    prize_value: '',
    entry_methods: [],
    required_gift_name: '',
    minimum_gift_value: 0,
    entries_per_action: 1,
    multipliers_enabled: {},
    multiplier_values: {
      superfan: 3,
      subscriber: 2,
      mod: 2,
      early_bird_first_10: 2,
      early_bird_first_50: 1.5,
      during_live: 3,
      first_hour: 2,
      loyalty_1_year: 1.5,
      loyalty_6_months: 1.25,
      referral_per_friend: 5,
      streak_combo: 2
    },
    start_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    end_date: '',
    status: 'upcoming'
  });

  const { data: loveAways = [] } = useQuery({
    queryKey: ['loveAways'],
    queryFn: () => base44.entities.LoveAway.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LoveAway.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loveAways'] });
      setShowCreateDialog(false);
      setFormData({
        title: '',
        description: '',
        prize_value: '',
        entry_methods: [],
        required_gift_name: '',
        minimum_gift_value: 0,
        entries_per_action: 1,
        multipliers_enabled: {},
        multiplier_values: {
          superfan: 3,
          subscriber: 2,
          mod: 2,
          early_bird_first_10: 2,
          early_bird_first_50: 1.5,
          during_live: 3,
          first_hour: 2,
          loyalty_1_year: 1.5,
          loyalty_6_months: 1.25,
          referral_per_friend: 5,
          streak_combo: 2
        },
        start_date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        end_date: '',
        status: 'upcoming'
      });
    }
  });

  const entryMethods = [
    { value: 'purchase', label: 'Purchase During Live' },
    { value: 'gift_any', label: 'Any Gift' },
    { value: 'gift_specific', label: 'Specific Gift' },
    { value: 'attendance', label: 'Attendance' },
    { value: 'shares', label: 'Shares' },
    { value: 'taps', label: 'Taps/Likes' },
    { value: 'manual', label: 'Manual Entry' }
  ];

  const multipliers = [
    { id: 'superfan', label: 'SuperFan', defaultValue: 3 },
    { id: 'subscriber', label: 'Subscriber', defaultValue: 2 },
    { id: 'mod', label: 'Mod', defaultValue: 2 },
    { id: 'early_bird', label: 'Early Bird (First 10/50)', defaultValue: 2 },
    { id: 'time_bonus', label: 'Time Bonus (Live/First Hour)', defaultValue: 3 },
    { id: 'loyalty', label: 'Loyalty (Following Length)', defaultValue: 1.5 },
    { id: 'referral', label: 'Referral Bonus', defaultValue: 5 },
    { id: 'streak', label: 'Streak Combo', defaultValue: 2 }
  ];

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const statusColors = {
    upcoming: 'bg-blue-100 text-blue-700',
    active: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-700',
    winner_selected: 'bg-purple-100 text-purple-700'
  };

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${textClass}`}>Love Away</h1>
            <p className="text-gray-500 mt-1">Manage giveaways and pick random winners</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button style={{ backgroundColor: primaryColor }}>
                <Plus className="w-4 h-4 mr-2" />
                New Love Away
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Love Away Giveaway</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input
                  placeholder="Giveaway Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
                <Textarea
                  placeholder="Prize Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
                <Input
                  placeholder="Prize Value (e.g., $100, Custom Mug)"
                  value={formData.prize_value}
                  onChange={(e) => setFormData({ ...formData, prize_value: e.target.value })}
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium">How to Enter (Optional Notes)</label>
                  <Textarea
                    placeholder="e.g. Send a rose, Share the live..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="p-4 bg-purple-50 rounded-lg text-sm text-purple-800">
                  <p>✨ <strong>Simplified!</strong> You can manually add entries and multiply them (2x, 3x, 10x) directly in the Entries list.</p>
                </div>

                <Button onClick={handleCreate} className="w-full" style={{ backgroundColor: primaryColor }}>
                  Create Giveaway
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Active/Upcoming Giveaways */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loveAways.map(giveaway => (
            <Card key={giveaway.id} className={cardBgClass}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="w-5 h-5" style={{ color: primaryColor }} />
                      {giveaway.title}
                    </CardTitle>
                    <Badge className={`mt-2 ${statusColors[giveaway.status]}`}>
                      {giveaway.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">{giveaway.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Prize Value:</span>
                  <span className="font-semibold">{giveaway.prize_value}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Total Entries:</span>
                  <span className="font-semibold text-purple-600">{giveaway.total_entries || 0}</span>
                </div>
                {giveaway.end_date && (
                  <div className="text-xs text-gray-400">
                    Ends: {format(new Date(giveaway.end_date), 'MMM d, yyyy h:mm a')}
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        <Users className="w-4 h-4 mr-1" />
                        Entries ({giveaway.total_entries || 0})
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Entries for {giveaway.title}</DialogTitle>
                      </DialogHeader>
                      <LoveAwayEntriesList giveawayId={giveaway.id} />
                    </DialogContent>
                  </Dialog>
                  {giveaway.status === 'active' && (
                    <Button
                      size="sm"
                      className="flex-1"
                      style={{ backgroundColor: primaryColor }}
                      onClick={() => setShowSpinner(giveaway)}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Draw Winner
                    </Button>
                  )}
                </div>
                {giveaway.winner_username && (
                  <div className="pt-2 border-t flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-semibold">Winner: {giveaway.winner_username}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {loveAways.length === 0 && (
          <Card className={cardBgClass}>
            <CardContent className="py-12 text-center text-gray-500">
              <Gift className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No giveaways yet. Create your first Love Away!</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Spinner Modal */}
      {showSpinner && (
        <LoveAwaySpinner
          giveaway={showSpinner}
          onClose={() => setShowSpinner(null)}
        />
      )}
    </div>
  );
}