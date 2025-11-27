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
  Target, Heart, TrendingUp, Clock, Loader2, Edit, Mail
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

const categoryIcons = {
  spiritual: '🙏',
  health: '💪',
  personal: '🎯',
  financial: '💰',
  relationship: '❤️',
  learning: '📚',
  other: '✨'
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700'
};

export default function GoalSharing() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingShare, setEditingShare] = useState(null);
  const [formData, setFormData] = useState({
    viewer_email: '',
    relationship: 'friend',
    shared_goal_ids: [],
    notes: ''
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // My goals (to select from when sharing)
  const { data: myGoals = [] } = useQuery({
    queryKey: ['myGoals', user?.email],
    queryFn: () => base44.entities.Goal.filter({ created_by: user.email, status: 'active' }),
    enabled: !!user,
  });

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

  // Get shared goals for viewing
  const { data: viewableGoals = {} } = useQuery({
    queryKey: ['viewableGoals', receivedShares],
    queryFn: async () => {
      const acceptedShares = receivedShares.filter(s => s.status === 'accepted');
      const goalsBySharer = {};
      
      for (const share of acceptedShares) {
        let goals = [];
        
        if (share.shared_goal_ids && share.shared_goal_ids.length > 0) {
          // Fetch specific goals by ID
          const allSharerGoals = await base44.entities.Goal.filter({ 
            created_by: share.sharer_email 
          });
          goals = allSharerGoals.filter(g => share.shared_goal_ids.includes(g.id));
        } else {
          // Legacy: fetch all goals
          goals = await base44.entities.Goal.filter({ 
            created_by: share.sharer_email,
            status: 'active'
          });
        }
        
        goalsBySharer[share.sharer_email] = {
          share,
          goals
        };
      }
      
      return goalsBySharer;
    },
    enabled: receivedShares.length > 0,
  });

  const createShareMutation = useMutation({
    mutationFn: async (data) => {
      const share = await base44.entities.GoalShare.create({
        ...data,
        sharer_email: user.email,
        sharer_name: user.full_name,
        status: 'pending'
      });
      
      // Send email notification
      const selectedGoals = myGoals.filter(g => data.shared_goal_ids.includes(g.id));
      const goalList = selectedGoals.map(g => `• ${categoryIcons[g.category] || '🎯'} ${g.title}`).join('\n');
      
      await base44.integrations.Core.SendEmail({
        to: data.viewer_email,
        subject: `${user.full_name || user.email} wants to share goals with you!`,
        body: `Hi there!\n\n${user.full_name || user.email} would like to share their goals with you on ThriveNut.\n\n${selectedGoals.length > 0 ? `They want to share ${selectedGoals.length} goal(s):\n${goalList}\n\n` : ''}Log in to ThriveNut to accept or decline this invitation.\n\n---\nThriveNut - Crush your goals, thrive daily`
      });
      
      return share;
    },
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
      setEditingShare(null);
      resetForm();
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
      shared_goal_ids: [],
      notes: ''
    });
    setEditingShare(null);
  };

  const toggleGoalSelection = (goalId) => {
    setFormData(prev => ({
      ...prev,
      shared_goal_ids: prev.shared_goal_ids.includes(goalId)
        ? prev.shared_goal_ids.filter(id => id !== goalId)
        : [...prev.shared_goal_ids, goalId]
    }));
  };

  const selectAllGoals = () => {
    setFormData(prev => ({
      ...prev,
      shared_goal_ids: myGoals.map(g => g.id)
    }));
  };

  const deselectAllGoals = () => {
    setFormData(prev => ({
      ...prev,
      shared_goal_ids: []
    }));
  };

  const handleInvite = () => {
    if (!formData.viewer_email.trim()) return;
    if (formData.shared_goal_ids.length === 0) {
      alert('Please select at least one goal to share');
      return;
    }
    createShareMutation.mutate(formData);
  };

  const handleUpdateShare = () => {
    if (!editingShare) return;
    updateShareMutation.mutate({
      id: editingShare.id,
      data: { shared_goal_ids: formData.shared_goal_ids }
    });
  };

  const handleEditShare = (share) => {
    setEditingShare(share);
    setFormData({
      viewer_email: share.viewer_email,
      relationship: share.relationship,
      shared_goal_ids: share.shared_goal_ids || [],
      notes: share.notes || ''
    });
    setShowInviteModal(true);
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
            <p className="text-gray-600 mt-1">Share specific goals with people you trust</p>
          </div>
          <Button
            onClick={() => { resetForm(); setShowInviteModal(true); }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Share Goals
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
                        wants to share {invite.shared_goal_ids?.length || 'their'} goal(s) with you
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
            <TabsTrigger value="viewing">Goals Shared With Me</TabsTrigger>
            <TabsTrigger value="sharing">Goals I'm Sharing</TabsTrigger>
          </TabsList>

          {/* Goals Shared With Me */}
          <TabsContent value="viewing" className="space-y-4">
            {acceptedReceived.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Eye className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No Shared Goals Yet</h3>
                  <p className="text-gray-600">
                    When someone shares their goals with you and you accept, you'll see them here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {acceptedReceived.map(share => {
                  const data = viewableGoals[share.sharer_email];
                  const goals = data?.goals || [];
                  
                  return (
                    <motion.div
                      key={share.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                <Users className="w-4 h-4 text-purple-600" />
                              </div>
                              {share.sharer_name || share.sharer_email}
                            </CardTitle>
                            <Badge>{relationships.find(r => r.id === share.relationship)?.label}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {goals.length === 0 ? (
                            <p className="text-gray-500 text-sm">No goals available</p>
                          ) : (
                            <div className="grid md:grid-cols-2 gap-3">
                              {goals.map(goal => (
                                <div key={goal.id} className="p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-start gap-2">
                                    <span className="text-lg">{categoryIcons[goal.category] || '🎯'}</span>
                                    <div className="flex-1">
                                      <p className="font-medium text-gray-800">{goal.title}</p>
                                      {goal.description && (
                                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{goal.description}</p>
                                      )}
                                      {goal.target_value && (
                                        <div className="mt-2">
                                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>Progress</span>
                                            <span>{goal.current_value || 0} / {goal.target_value}</span>
                                          </div>
                                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div 
                                              className="h-full bg-purple-500 rounded-full transition-all"
                                              style={{ width: `${Math.min(100, ((goal.current_value || 0) / goal.target_value) * 100)}%` }}
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Goals I'm Sharing */}
          <TabsContent value="sharing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  People I'm Sharing With
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sentShares.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600">You haven't shared your goals with anyone yet.</p>
                    <Button
                      onClick={() => { resetForm(); setShowInviteModal(true); }}
                      variant="outline"
                      className="mt-4"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Share Goals
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sentShares.map(share => {
                      const sharedGoalCount = share.shared_goal_ids?.length || 0;
                      const sharedGoalNames = myGoals
                        .filter(g => share.shared_goal_ids?.includes(g.id))
                        .map(g => g.title);
                      
                      return (
                        <div key={share.id} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{share.viewer_name || share.viewer_email}</p>
                                <Badge className={statusColors[share.status]}>{share.status}</Badge>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">
                                  {relationships.find(r => r.id === share.relationship)?.label}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  {sharedGoalCount} goal{sharedGoalCount !== 1 ? 's' : ''} shared
                                </span>
                              </div>
                              {sharedGoalNames.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {sharedGoalNames.slice(0, 3).map((name, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {name}
                                    </Badge>
                                  ))}
                                  {sharedGoalNames.length > 3 && (
                                    <Badge variant="secondary" className="text-xs">
                                      +{sharedGoalNames.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                              {share.notes && (
                                <p className="text-sm text-gray-500 mt-2">{share.notes}</p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditShare(share)}
                                className="text-purple-500 hover:text-purple-700 hover:bg-purple-50"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm('Stop sharing with this person?')) {
                                    deleteShareMutation.mutate(share.id);
                                  }
                                }}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Invite/Edit Modal */}
      <Dialog open={showInviteModal} onOpenChange={(open) => { if (!open) resetForm(); setShowInviteModal(open); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingShare ? 'Edit Shared Goals' : 'Share Your Goals'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {!editingShare && (
              <>
                <div className="space-y-2">
                  <Label>Their Email Address</Label>
                  <Input
                    type="email"
                    placeholder="friend@example.com"
                    value={formData.viewer_email}
                    onChange={(e) => setFormData({ ...formData, viewer_email: e.target.value })}
                  />
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    They'll receive an email notification
                  </p>
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
              </>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Goals to Share</Label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAllGoals} className="text-xs h-7">
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={deselectAllGoals} className="text-xs h-7">
                    Clear
                  </Button>
                </div>
              </div>
              
              {myGoals.length === 0 ? (
                <div className="p-4 text-center bg-gray-50 rounded-lg">
                  <Target className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">No active goals to share</p>
                  <p className="text-xs text-gray-400">Create some goals first!</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2">
                  {myGoals.map(goal => (
                    <div
                      key={goal.id}
                      onClick={() => toggleGoalSelection(goal.id)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.shared_goal_ids.includes(goal.id)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox checked={formData.shared_goal_ids.includes(goal.id)} />
                        <span className="text-lg">{categoryIcons[goal.category] || '🎯'}</span>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{goal.title}</p>
                          <p className="text-xs text-gray-500 capitalize">{goal.category}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <p className="text-sm text-gray-600">
                {formData.shared_goal_ids.length} goal{formData.shared_goal_ids.length !== 1 ? 's' : ''} selected
              </p>
            </div>

            {!editingShare && (
              <div className="space-y-2">
                <Label>Note (Optional)</Label>
                <Textarea
                  placeholder="Add a personal note..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { resetForm(); setShowInviteModal(false); }}>
              Cancel
            </Button>
            <Button
              onClick={editingShare ? handleUpdateShare : handleInvite}
              disabled={
                (!editingShare && !formData.viewer_email.trim()) || 
                formData.shared_goal_ids.length === 0 || 
                createShareMutation.isPending ||
                updateShareMutation.isPending
              }
              className="bg-purple-600 hover:bg-purple-700"
            >
              {(createShareMutation.isPending || updateShareMutation.isPending) ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              {editingShare ? 'Update' : 'Send Invitation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}