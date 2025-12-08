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
import { Plus, Gift, Sparkles, Trophy, Users, Settings, Play, X } from 'lucide-react';
import { format } from 'date-fns';
import { useTheme } from '../components/shared/useTheme';
import LoveAwaySpinner from '../components/loveaway/LoveAwaySpinner';

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
            <h1 className={`text-3xl font-bold ${textClass}`}>Love Away Giveaways</h1>
            <p className="text-gray-500 mt-1">Manage giveaways with multipliers and winner selection</p>
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
                  <label className="text-sm font-medium">Entry Methods</label>
                  <div className="grid grid-cols-2 gap-2">
                    {entryMethods.map(method => (
                      <div
                        key={method.value}
                        onClick={() => {
                          const methods = formData.entry_methods.includes(method.value)
                            ? formData.entry_methods.filter(m => m !== method.value)
                            : [...formData.entry_methods, method.value];
                          setFormData({ ...formData, entry_methods: methods });
                        }}
                        className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          formData.entry_methods.includes(method.value)
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox checked={formData.entry_methods.includes(method.value)} />
                          <span className="text-sm">{method.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    placeholder="Entries per action"
                    value={formData.entries_per_action}
                    onChange={(e) => setFormData({ ...formData, entries_per_action: parseInt(e.target.value) || 1 })}
                  />
                  <Input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    placeholder="End Date"
                  />
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Entry Multipliers
                  </h3>
                  {multipliers.map(mult => (
                    <div key={mult.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={formData.multipliers_enabled[mult.id] || false}
                          onCheckedChange={(checked) => setFormData({
                            ...formData,
                            multipliers_enabled: { ...formData.multipliers_enabled, [mult.id]: checked }
                          })}
                        />
                        <span className="text-sm">{mult.label}</span>
                      </div>
                      {formData.multipliers_enabled[mult.id] && (
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.multiplier_values[mult.id] || mult.defaultValue}
                          onChange={(e) => setFormData({
                            ...formData,
                            multiplier_values: { ...formData.multiplier_values, [mult.id]: parseFloat(e.target.value) }
                          })}
                          className="w-20"
                        />
                      )}
                    </div>
                  ))}
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
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowEntriesDialog(giveaway)}
                  >
                    <Users className="w-4 h-4 mr-1" />
                    Entries
                  </Button>
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