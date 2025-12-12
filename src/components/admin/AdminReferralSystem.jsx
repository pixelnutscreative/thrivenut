import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2, Edit, Trophy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export default function AdminReferralSystem() {
  const queryClient = useQueryClient();
  const [showAddLevel, setShowAddLevel] = useState(false);
  const [editingLevel, setEditingLevel] = useState(null);
  const [newLevel, setNewLevel] = useState({
    level: 1,
    signups_required: 5,
    reward_name: '',
    reward_description: '',
    reward_emoji: '🎉',
    sort_order: 0
  });

  const { data: rewardLevels = [], isLoading } = useQuery({
    queryKey: ['referralRewardLevels'],
    queryFn: () => base44.entities.ReferralRewardLevel.list('sort_order'),
  });

  const { data: referralLinks = [] } = useQuery({
    queryKey: ['referralLinks'],
    queryFn: () => base44.entities.ReferralLink.list('-total_signups'),
  });

  const createLevelMutation = useMutation({
    mutationFn: (data) => base44.entities.ReferralRewardLevel.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referralRewardLevels'] });
      setShowAddLevel(false);
      setNewLevel({ level: 1, signups_required: 5, reward_name: '', reward_description: '', reward_emoji: '🎉', sort_order: 0 });
    },
  });

  const updateLevelMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ReferralRewardLevel.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['referralRewardLevels'] });
      setEditingLevel(null);
    },
  });

  const deleteLevelMutation = useMutation({
    mutationFn: (id) => base44.entities.ReferralRewardLevel.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['referralRewardLevels'] }),
  });

  if (isLoading) {
    return <Loader2 className="w-6 h-6 animate-spin mx-auto" />;
  }

  return (
    <div className="space-y-6">
      {/* Referral Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Referral System Overview</CardTitle>
          <CardDescription>Track referral activity and manage reward levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Total Referrers</p>
              <p className="text-2xl font-bold text-purple-900">{referralLinks.length}</p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total Signups</p>
              <p className="text-2xl font-bold text-blue-900">
                {referralLinks.reduce((sum, link) => sum + (link.total_signups || 0), 0)}
              </p>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Total Clicks</p>
              <p className="text-2xl font-bold text-green-900">
                {referralLinks.reduce((sum, link) => sum + (link.total_clicks || 0), 0)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reward Levels Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reward Levels</CardTitle>
              <CardDescription>Configure rewards for referral milestones</CardDescription>
            </div>
            <Dialog open={showAddLevel} onOpenChange={setShowAddLevel}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Level
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Reward Level</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Level Number</Label>
                      <Input
                        type="number"
                        value={newLevel.level}
                        onChange={(e) => setNewLevel({ ...newLevel, level: parseInt(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Signups Required</Label>
                      <Input
                        type="number"
                        value={newLevel.signups_required}
                        onChange={(e) => setNewLevel({ ...newLevel, signups_required: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Reward Name</Label>
                    <Input
                      value={newLevel.reward_name}
                      onChange={(e) => setNewLevel({ ...newLevel, reward_name: e.target.value })}
                      placeholder="Bronze Star"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Emoji Icon</Label>
                    <Input
                      value={newLevel.reward_emoji}
                      onChange={(e) => setNewLevel({ ...newLevel, reward_emoji: e.target.value })}
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reward Description</Label>
                    <Input
                      value={newLevel.reward_description}
                      onChange={(e) => setNewLevel({ ...newLevel, reward_description: e.target.value })}
                      placeholder="What they get at this level"
                    />
                  </div>
                  <Button
                    onClick={() => createLevelMutation.mutate(newLevel)}
                    disabled={!newLevel.reward_name || createLevelMutation.isPending}
                    className="w-full"
                  >
                    {createLevelMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create Level
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rewardLevels.map((level) => (
              <div key={level.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                <span className="text-2xl">{level.reward_emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Level {level.level}: {level.reward_name}</p>
                    <Badge variant="outline">{level.signups_required} signups</Badge>
                  </div>
                  {level.reward_description && (
                    <p className="text-sm text-gray-600 mt-1">{level.reward_description}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteLevelMutation.mutate(level.id)}
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {rewardLevels.length === 0 && (
              <p className="text-center text-gray-400 py-8">No reward levels configured yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Top Referrers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Referrers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {referralLinks.slice(0, 10).map((link, idx) => (
              <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-400">#{idx + 1}</span>
                  <div>
                    <p className="font-medium">{link.user_email}</p>
                    <p className="text-sm text-gray-500">Code: {link.referral_code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <p className="font-bold text-purple-600">{link.total_signups || 0}</p>
                    <p className="text-xs text-gray-500">Signups</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-blue-600">{link.total_clicks || 0}</p>
                    <p className="text-xs text-gray-500">Clicks</p>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    Level {link.reward_level || 1}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}