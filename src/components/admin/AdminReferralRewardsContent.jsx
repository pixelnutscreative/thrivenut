import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Trash2, Save, Gift } from 'lucide-react';

export default function AdminReferralRewardsContent() {
  const queryClient = useQueryClient();
  const [showAddReward, setShowAddReward] = useState(false);
  const [newReward, setNewReward] = useState({
    level: 1,
    thrive_signups_required: 0,
    social_suite_upgrades_required: 0,
    reward_type: 'credits',
    reward_name: '',
    reward_description: '',
    reward_emoji: '🏆',
    credit_amount: 0,
    is_active: true,
    sort_order: 0
  });

  // Fetch rewards
  const { data: rewards = [], isLoading } = useQuery({
    queryKey: ['thriveReferralRewards'],
    queryFn: () => base44.entities.ThriveReferralReward.list('sort_order', 50)
  });

  // Fetch point config
  const { data: pointsConfig = [] } = useQuery({
    queryKey: ['referralPointsConfig'],
    queryFn: () => base44.entities.ReferralPointsConfig.list()
  });

  const createRewardMutation = useMutation({
    mutationFn: (data) => base44.entities.ThriveReferralReward.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thriveReferralRewards'] });
      setShowAddReward(false);
      setNewReward({
        level: rewards.length + 1,
        thrive_signups_required: 0,
        social_suite_upgrades_required: 0,
        reward_type: 'credits',
        reward_name: '',
        reward_description: '',
        reward_emoji: '🏆',
        credit_amount: 0,
        is_active: true,
        sort_order: rewards.length
      });
    }
  });

  const updateRewardMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ThriveReferralReward.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['thriveReferralRewards'] })
  });

  const deleteRewardMutation = useMutation({
    mutationFn: (id) => base44.entities.ThriveReferralReward.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['thriveReferralRewards'] })
  });

  const updatePointsConfigMutation = useMutation({
    mutationFn: async ({ key, value }) => {
      const existing = pointsConfig.find(c => c.config_key === key);
      if (existing) {
        return base44.entities.ReferralPointsConfig.update(existing.id, { points_value: value });
      } else {
        return base44.entities.ReferralPointsConfig.create({ config_key: key, points_value: value });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['referralPointsConfig'] })
  });

  const signupPoints = pointsConfig.find(c => c.config_key === 'points_per_signup')?.points_value || 10;
  const upgradePoints = pointsConfig.find(c => c.config_key === 'points_per_upgrade')?.points_value || 50;

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Points Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Points Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Points per FREE Sign-up</Label>
              <Input
                type="number"
                value={signupPoints}
                onChange={(e) => updatePointsConfigMutation.mutate({ 
                  key: 'points_per_signup', 
                  value: parseInt(e.target.value) 
                })}
              />
            </div>
            <div>
              <Label>Points per Social Add-on Upgrade ($77/year)</Label>
              <Input
                type="number"
                value={upgradePoints}
                onChange={(e) => updatePointsConfigMutation.mutate({ 
                  key: 'points_per_upgrade', 
                  value: parseInt(e.target.value) 
                })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reward Levels */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Reward Levels</CardTitle>
            <Button onClick={() => setShowAddReward(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" /> Add Reward
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rewards.map(reward => (
              <div key={reward.id} className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{reward.reward_emoji}</span>
                    <div>
                      <p className="font-semibold">Level {reward.level}: {reward.reward_name}</p>
                      <p className="text-sm text-gray-600">{reward.reward_description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={reward.is_active}
                      onCheckedChange={(checked) => updateRewardMutation.mutate({ 
                        id: reward.id, 
                        data: { is_active: checked } 
                      })}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteRewardMutation.mutate(reward.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2 text-xs">
                  {reward.thrive_signups_required > 0 && (
                    <Badge variant="outline">{reward.thrive_signups_required} signups</Badge>
                  )}
                  {reward.social_suite_upgrades_required > 0 && (
                    <Badge variant="outline">{reward.social_suite_upgrades_required} upgrades</Badge>
                  )}
                  <Badge>{reward.reward_type}</Badge>
                </div>
              </div>
            ))}
          </div>

          {/* Add Reward Form */}
          {showAddReward && (
            <div className="mt-4 p-4 bg-purple-50 border-2 border-purple-300 rounded-lg space-y-3">
              <h3 className="font-semibold">Add New Reward Level</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label>Level #</Label>
                  <Input
                    type="number"
                    value={newReward.level}
                    onChange={(e) => setNewReward({ ...newReward, level: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Emoji</Label>
                  <Input
                    value={newReward.reward_emoji}
                    onChange={(e) => setNewReward({ ...newReward, reward_emoji: e.target.value })}
                    maxLength={2}
                  />
                </div>
                <div>
                  <Label>Signups Required</Label>
                  <Input
                    type="number"
                    value={newReward.thrive_signups_required}
                    onChange={(e) => setNewReward({ ...newReward, thrive_signups_required: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Social Upgrades Required</Label>
                  <Input
                    type="number"
                    value={newReward.social_suite_upgrades_required}
                    onChange={(e) => setNewReward({ ...newReward, social_suite_upgrades_required: parseInt(e.target.value) })}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Reward Name</Label>
                  <Input
                    value={newReward.reward_name}
                    onChange={(e) => setNewReward({ ...newReward, reward_name: e.target.value })}
                    placeholder="e.g., Bronze Star, Free Month"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Reward Description</Label>
                  <Textarea
                    value={newReward.reward_description}
                    onChange={(e) => setNewReward({ ...newReward, reward_description: e.target.value })}
                    placeholder="What do they get?"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Reward Type</Label>
                  <Select 
                    value={newReward.reward_type} 
                    onValueChange={(v) => setNewReward({ ...newReward, reward_type: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="credits">Thrive Credits</SelectItem>
                      <SelectItem value="shoutout">Social Media Shoutout</SelectItem>
                      <SelectItem value="engagement_card_promotion">Featured on Engagement Page</SelectItem>
                      <SelectItem value="one_on_one">1-on-1 with Pixel</SelectItem>
                      <SelectItem value="toolbox_trial">AI Toolbox Trial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowAddReward(false)} variant="outline">Cancel</Button>
                <Button 
                  onClick={() => createRewardMutation.mutate(newReward)}
                  disabled={!newReward.reward_name}
                >
                  <Save className="w-4 h-4 mr-2" /> Create Reward
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}