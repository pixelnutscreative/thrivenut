import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, UserPlus, Send, Check, X, Eye, Trash2, 
  Target, Heart, TrendingUp, Clock, Loader2 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const relationships = [
  { id: 'mentor', label: 'Mentor' },
  { id: 'mentee', label: 'Mentee' },
  { id: 'family', label: 'Family Member' },
  { id: 'friend', label: 'Friend' },
  { id: 'coworker', label: 'Coworker' },
  { id: 'tiktok_creator', label: 'TikTok Creator Friend' },
  { id: 'other', label: 'Other' }
];

const goalTypes = [
  { id: 'all', label: 'All Goals', icon: Target },
  { id: 'tiktok', label: 'TikTok Goals', icon: TrendingUp },
  { id: 'personal', label: 'Personal Goals', icon: Target },
  { id: 'wellness', label: 'Wellness Goals', icon: Heart }
];

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700'
};

export default function GoalSharing() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedShare, setSelectedShare] = useState(null);
  const [formData, setFormData] = useState({
    viewer_email: '',
    relationship: 'friend',
    shared_goal_types: ['all'],
    notes: ''
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Shares I've sent (people who can see my goals)
  const { data: sentShares = [] } = useQuery({
    queryKey: ['goalSharesSent', user?.email],
    queryFn: () => base44.entities.GoalShare.filter({ sharer_email: user.email }),
    enabled: !!user,
  });

  // Shares I've received (people whose goals I can see)
  const { data: receivedShares = [] } = useQuery({
    queryKey: ['goalSharesReceived', user?.email],
    queryFn: () => base44.entities.GoalShare.filter({ viewer_email: user.email }),
    enabled: !!user,
  });

  // Get goals for accepted shares
  const { data: sharedGoals = {} } = useQuery({
    queryKey: ['sharedGoals', receivedShares],
    queryFn: async () => {
      const acceptedShares = receivedShares.filter(s => s.status === 'accepted');
      const goals = {};
      
      for (const share of acceptedShares) {
        const contentGoals = await base44.entities.ContentGoal.filter({ 
          created_by: share.sharer_email 
        }, '-week_starting', 1);
        
        goals[share.sharer_email] = {
          share,
          contentGoal: contentGoals[0] || null
        };
      }
      
      return goals;
    },
    enabled: receivedShares.length > 0,
  });

  const createShareMutation = useMutation({
    mutationFn: (data) => base44.entities.GoalShare.create({
      ...data,
      sharer_email: user.email,
      sharer_name: user.full_name,
      status: 'pending'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goalSharesSent'] });
      setShowInviteModal(false);
      resetForm();
    },
  });

  const updateShareMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GoalShare.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goalSharesReceived'] });
      queryClient.invalidateQueries({ queryKey: ['goalSharesSent'] });
    },
  });

  const deleteShareMutation = useMutation({
    mutationFn: (id) => base44.entities.GoalShare.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goalSharesSent'] });
      queryClient.invalidateQueries({ queryKey: ['goalSharesReceived'] });
    },
  });

  const resetForm = () => {
    setFormData({
      viewer_email: '',
      relationship: 'friend',
      shared_goal_types: ['all'],
      notes: ''
    });
  };

  const toggleGoalType = (typeId) => {
    setFormData(prev => {
      if (typeId === 'all') {
        return { ...prev, shared_goal_types: ['all'] };
      }
      
      let newTypes = prev.shared_goal_types.filter(t => t !== 'all');
      if (newTypes.includes(typeId)) {
        newTypes = newTypes.filter(t => t !== typeId);
      } else {
        newTypes.push(typeId);
      }
      
      if (newTypes.length === 0) {
        newTypes = ['all'];
      }
      
      return { ...prev, shared_goal_types: newTypes };
    });
  };

  const handleInvite = () => {
    if (!formData.viewer_email.trim()) return;
    createShareMutation.mutate(formData);
  };

  const handleAccept = (share) => {
    updateShareMutation.mutate({
      id: share.id,
      data: { status: 'accepted', viewer_name: user.full_name }
    });
  };

  const handleDecline = (share) => {
    updateShareMutation.mutate({
      id: share.id,
      data: { status: 'declined' }
    });
  };

  const pendingInvites = receivedShares.filter(s => s.status === 'pending');
  const acceptedReceived = receivedShares.filter(s => s.status === 'accepted');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Goal Sharing</h1>
            <p className="text-gray-600 mt-1">Share your goals and view others' progress</p>
          </div>
          <Button
            onClick={() => setShowInviteModal(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Someone
          </Button>
        </div>

        {/* Pending Invitations */}
        {pendingInvites.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-700">
                  <Clock className="w-5 h-5" />
                  Pending Invitations ({pendingInvites.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pendingInvites.map(invite => (
                  <div key={invite.id} className="flex items-center justify-between p-4 bg-white rounded-lg">
                    <div>
                      <p className="font-semibold">{invite.sharer_name || invite.sharer_email}</p>
                      <p className="text-sm text-gray-600">
                        wants to share their {invite.shared_goal_types?.join(', ') || 'all'} goals with you
                      </p>
                      <Badge className="mt-1">{relationships.find(r => r.id === invite.relationship)?.label}</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAccept(invite)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDecline(invite)}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Tabs defaultValue="viewing" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="viewing">Goals I'm Viewing</TabsTrigger>
            <TabsTrigger value="sharing">My Sharing Settings</TabsTrigger>
          </TabsList>

          {/* Goals I'm Viewing */}
          <TabsContent value="viewing" className="space-y-4">
            {acceptedReceived.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Eye className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No Shared Goals Yet</h3>
                  <p className="text-gray-600">
                    When someone shares their goals with you and you accept, you'll see their progress here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {acceptedReceived.map(share => {
                  const goalData = sharedGoals[share.sharer_email];
                  const contentGoal = goalData?.contentGoal;
                  
                  return (
                    <motion.div
                      key={share.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">
                              {share.sharer_name || share.sharer_email}
                            </CardTitle>
                            <Badge>{relationships.find(r => r.id === share.relationship)?.label}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {contentGoal ? (
                            <div className="space-y-3">
                              <p className="text-sm text-gray-600">
                                Week of {format(new Date(contentGoal.week_starting), 'MMM d, yyyy')}
                              </p>
                              
                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-purple-50 rounded-lg">
                                  <p className="text-xs text-gray-600">Posts</p>
                                  <p className="text-xl font-bold text-purple-600">
                                    {contentGoal.posts_completed || 0}/{contentGoal.posts_goal || 0}
                                  </p>
                                </div>
                                <div className="p-3 bg-pink-50 rounded-lg">
                                  <p className="text-xs text-gray-600">Lives</p>
                                  <p className="text-xl font-bold text-pink-600">
                                    {contentGoal.lives_completed || 0}/{contentGoal.lives_goal || 0}
                                  </p>
                                </div>
                                <div className="p-3 bg-green-50 rounded-lg">
                                  <p className="text-xs text-gray-600">Shop Lives</p>
                                  <p className="text-xl font-bold text-green-600">
                                    {contentGoal.shop_lives_completed || 0}/{contentGoal.shop_lives_goal || 0}
                                  </p>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-lg">
                                  <p className="text-xs text-gray-600">Engagement</p>
                                  <p className="text-xl font-bold text-blue-600">
                                    {contentGoal.engagement_completed || 0}/{contentGoal.engagement_goal || 0}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No goals set for this week</p>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* My Sharing Settings */}
          <TabsContent value="sharing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  People Who Can View My Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sentShares.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">You haven't shared your goals with anyone yet.</p>
                    <Button
                      onClick={() => setShowInviteModal(true)}
                      variant="outline"
                      className="mt-4"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invite Someone
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sentShares.map(share => (
                      <div key={share.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-semibold">{share.viewer_name || share.viewer_email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={statusColors[share.status]}>{share.status}</Badge>
                            <Badge variant="outline">
                              {relationships.find(r => r.id === share.relationship)?.label}
                            </Badge>
                          </div>
                          {share.notes && (
                            <p className="text-sm text-gray-500 mt-1">{share.notes}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteShareMutation.mutate(share.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Invite Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Someone to View Your Goals</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Their Email Address</Label>
              <Input
                type="email"
                placeholder="friend@example.com"
                value={formData.viewer_email}
                onChange={(e) => setFormData({ ...formData, viewer_email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Relationship</Label>
              <Select
                value={formData.relationship}
                onValueChange={(value) => setFormData({ ...formData, relationship: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {relationships.map(rel => (
                    <SelectItem key={rel.id} value={rel.id}>{rel.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>What to Share</Label>
              <div className="grid grid-cols-2 gap-2">
                {goalTypes.map(type => {
                  const Icon = type.icon;
                  return (
                    <div
                      key={type.id}
                      onClick={() => toggleGoalType(type.id)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.shared_goal_types.includes(type.id)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox checked={formData.shared_goal_types.includes(type.id)} />
                        <Icon className="w-4 h-4" />
                        <span className="text-sm">{type.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Note (Optional)</Label>
              <Textarea
                placeholder="Add a personal note..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={!formData.viewer_email.trim() || createShareMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {createShareMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}