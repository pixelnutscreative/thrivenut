import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Gift, Sparkles, Trophy, Users, Settings, Play, X, Edit, Archive, Trash2, History, RotateCcw } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { useTheme } from '../components/shared/useTheme';
import LoveAwaySpinner from '../components/loveaway/LoveAwaySpinner';
import LoveAwayEntriesList from '../components/loveaway/LoveAwayEntriesList';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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
    entry_mode: 'tiktok',
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

  const [showHistory, setShowHistory] = useState(false);

  const { data: loveAways = [] } = useQuery({
    queryKey: ['loveAways'],
    queryFn: () => base44.entities.LoveAway.list('-created_date'),
  });

  // Filter out archived unless showing history
  const activeLoveAways = loveAways.filter(l => l.status !== 'archived');
  const pastWinners = loveAways.filter(l => l.status === 'winner_selected' || l.winner_username);

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
        entry_mode: 'tiktok',
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

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.LoveAway.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['loveAways'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LoveAway.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['loveAways'] })
  });

  const statusColors = {
    upcoming: 'bg-blue-100 text-blue-700',
    active: 'bg-green-100 text-green-700',
    closed: 'bg-gray-100 text-gray-700',
    winner_selected: 'bg-purple-100 text-purple-700',
    archived: 'bg-gray-200 text-gray-500'
  };

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${textClass}`}>Love Away</h1>
            <p className="text-gray-500 mt-1">Manage giveaways and pick random winners</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowHistory(!showHistory)}>
              <History className="w-4 h-4 mr-2" />
              {showHistory ? 'Hide History' : 'Winners History'}
            </Button>
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
                  <div className="space-y-2">
                     <Label>Entry Mode</Label>
                     <div className="flex gap-4">
                        <div 
                          className={`flex-1 p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.entry_mode === 'tiktok' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}
                          onClick={() => setFormData({...formData, entry_mode: 'tiktok'})}
                        >
                            <div className="font-bold mb-1">TikTok Users</div>
                            <div className="text-xs text-gray-500">Search by TikTok username. Good for live giveaways.</div>
                        </div>
                        <div 
                          className={`flex-1 p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.entry_mode === 'generic' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}
                          onClick={() => setFormData({...formData, entry_mode: 'generic'})}
                        >
                            <div className="font-bold mb-1">Generic / Manual</div>
                            <div className="text-xs text-gray-500">Enter any name (Grandma, Joe, Email). Good for offline/mixed.</div>
                        </div>
                     </div>
                  </div>

                  <Input
                    placeholder="Giveaway Title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                  <Textarea
                    placeholder="Prize Description (e.g. 1-on-1 Call, Gift Card, Mystery Box)"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                  <Input
                    placeholder="Prize Value (e.g., $100, Priceless)"
                    value={formData.prize_value}
                    onChange={(e) => setFormData({ ...formData, prize_value: e.target.value })}
                  />

                  <Button onClick={handleCreate} className="w-full" style={{ backgroundColor: primaryColor }}>
                    Create Giveaway
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Winners History Panel */}
        {showHistory && (
          <Card className="mb-6 bg-purple-50 border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                Winners Hall of Fame
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastWinners.map(winner => (
                   <div key={winner.id} className="bg-white p-4 rounded-lg shadow-sm border flex items-center justify-between">
                      <div>
                          <div className="font-bold text-gray-800">{winner.winner_username}</div>
                          <div className="text-xs text-gray-500">{winner.title}</div>
                          <div className="text-xs text-purple-600 mt-1">Won: {winner.prize_value}</div>
                      </div>
                      <Trophy className="w-8 h-8 text-yellow-300 opacity-50" />
                   </div>
                ))}
                {pastWinners.length === 0 && (
                  <div className="col-span-full text-center text-gray-500 py-4">No winners recorded yet!</div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active/Upcoming Giveaways */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeLoveAways.map(giveaway => (
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
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Settings className="w-4 h-4 text-gray-500" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-40 p-1">
                      <div className="space-y-1">
                        {giveaway.status !== 'archived' && (
                            <button 
                                className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
                                onClick={() => updateStatusMutation.mutate({ id: giveaway.id, status: 'archived' })}
                            >
                                <Archive className="w-4 h-4" /> Archive
                            </button>
                        )}
                        {giveaway.status === 'archived' && (
                            <button 
                                className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
                                onClick={() => updateStatusMutation.mutate({ id: giveaway.id, status: 'active' })}
                            >
                                <RotateCcw className="w-4 h-4" /> Restore
                            </button>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="w-full text-left px-2 py-1.5 text-sm hover:bg-red-50 text-red-600 rounded flex items-center gap-2">
                                <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Giveaway?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete "{giveaway.title}" and all its entries. This cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-red-600 hover:bg-red-700"
                                onClick={() => deleteMutation.mutate(giveaway.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-600">{giveaway.description}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    {giveaway.entry_mode === 'generic' ? <Users className="w-3 h-3" /> : <Gift className="w-3 h-3" />}
                    Type: {giveaway.entry_mode === 'generic' ? 'Manual/Generic' : 'TikTok Users'}
                </div>
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
                  {(giveaway.status === 'active' || giveaway.status === 'upcoming') && (
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