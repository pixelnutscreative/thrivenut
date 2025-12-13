import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Save, Plus, Trash2, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminReferralSystem() {
  const queryClient = useQueryClient();
  const [editingReward, setEditingReward] = useState(null);
  const [showAddReward, setShowAddReward] = useState(false);

  // Fetch points config
  const { data: pointsConfig = [] } = useQuery({
    queryKey: ['pointsConfig'],
    queryFn: () => base44.entities.ReferralPointsConfig.filter({})
  });

  // Fetch rewards
  const { data: rewards = [] } = useQuery({
    queryKey: ['rewardLevels'],
    queryFn: () => base44.entities.ThriveReferralReward.filter({}, 'level')
  });

  const signupConfig = pointsConfig.find(c => c.config_key === 'points_per_signup');
  const upgradeConfig = pointsConfig.find(c => c.config_key === 'points_per_upgrade');

  const [pointsPerSignup, setPointsPerSignup] = useState(signupConfig?.points_value || 1);
  const [pointsPerUpgrade, setPointsPerUpgrade] = useState(upgradeConfig?.points_value || 5);

  const updatePointsMutation = useMutation({
    mutationFn: async ({ key, value }) => {
      const existing = pointsConfig.find(c => c.config_key === key);
      if (existing) {
        return base44.entities.ReferralPointsConfig.update(existing.id, { points_value: value });
      }
      return base44.entities.ReferralPointsConfig.create({ config_key: key, points_value: value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pointsConfig'] });
    }
  });

  const saveRewardMutation = useMutation({
    mutationFn: async (data) => {
      if (data.id) {
        return base44.entities.ThriveReferralReward.update(data.id, data);
      }
      return base44.entities.ThriveReferralReward.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewardLevels'] });
      setEditingReward(null);
      setShowAddReward(false);
    }
  });

  const deleteRewardMutation = useMutation({
    mutationFn: (id) => base44.entities.ThriveReferralReward.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rewardLevels'] });
    }
  });

  const handleSavePoints = () => {
    updatePointsMutation.mutate({ key: 'points_per_signup', value: pointsPerSignup });
    updatePointsMutation.mutate({ key: 'points_per_upgrade', value: pointsPerUpgrade });
  };

  return (
    <div className="space-y-6">
      {/* Points Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Points System</CardTitle>
          <CardDescription>Configure how many points users earn</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Points Per Signup</Label>
              <Input
                type="number"
                value={pointsPerSignup}
                onChange={(e) => setPointsPerSignup(parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
            <div>
              <Label>Points Per Upgrade</Label>
              <Input
                type="number"
                value={pointsPerUpgrade}
                onChange={(e) => setPointsPerUpgrade(parseInt(e.target.value) || 0)}
                min="0"
              />
            </div>
          </div>
          <Button onClick={handleSavePoints} disabled={updatePointsMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {updatePointsMutation.isPending ? 'Saving...' : 'Save Points Config'}
          </Button>
        </CardContent>
      </Card>

      {/* Rewards Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reward Levels</CardTitle>
              <CardDescription>Manage what users earn at each level</CardDescription>
            </div>
            <Button onClick={() => setShowAddReward(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Reward
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {rewards.map(reward => (
            <Card key={reward.id} className="border-2">
              <CardContent className="pt-4">
                {editingReward?.id === reward.id ? (
                  <div className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <Label>Level</Label>
                        <Input
                          type="number"
                          value={editingReward.level}
                          onChange={(e) => setEditingReward({ ...editingReward, level: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Points Required</Label>
                        <Input
                          type="number"
                          value={editingReward.points_required}
                          onChange={(e) => setEditingReward({ ...editingReward, points_required: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <Label>Reward Name</Label>
                        <Input
                          value={editingReward.reward_name}
                          onChange={(e) => setEditingReward({ ...editingReward, reward_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Emoji</Label>
                        <Input
                          value={editingReward.reward_emoji}
                          onChange={(e) => setEditingReward({ ...editingReward, reward_emoji: e.target.value })}
                          maxLength={2}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={editingReward.reward_description}
                        onChange={(e) => setEditingReward({ ...editingReward, reward_description: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => saveRewardMutation.mutate(editingReward)} disabled={saveRewardMutation.isPending}>
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => setEditingReward(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{reward.reward_emoji || '🏆'}</span>
                        <div>
                          <p className="font-semibold">Level {reward.level}: {reward.reward_name}</p>
                          <p className="text-sm text-gray-600">{reward.points_required} points required</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{reward.reward_description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditingReward(reward)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteRewardMutation.mutate(reward.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Add New Reward */}
          {showAddReward && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="border-2 border-purple-300">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <h3 className="font-semibold">Add New Reward</h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <Label>Level</Label>
                        <Input
                          type="number"
                          placeholder="e.g., 1"
                          onChange={(e) => setEditingReward({ ...editingReward, level: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Points Required</Label>
                        <Input
                          type="number"
                          placeholder="e.g., 10"
                          onChange={(e) => setEditingReward({ ...editingReward, points_required: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <Label>Reward Name</Label>
                        <Input
                          placeholder="e.g., Free Month"
                          onChange={(e) => setEditingReward({ ...editingReward, reward_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Emoji</Label>
                        <Input
                          placeholder="🎁"
                          maxLength={2}
                          onChange={(e) => setEditingReward({ ...editingReward, reward_emoji: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        placeholder="What they get..."
                        onChange={(e) => setEditingReward({ ...editingReward, reward_description: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => saveRewardMutation.mutate({ ...editingReward, is_active: true })}
                        disabled={saveRewardMutation.isPending || !editingReward?.reward_name}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Create Reward
                      </Button>
                      <Button variant="outline" onClick={() => { setShowAddReward(false); setEditingReward(null); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}