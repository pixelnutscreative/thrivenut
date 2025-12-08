import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Plus, Calendar, Heart, Trash2, Edit, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../components/shared/useTheme';
import ImageUploader from '../components/settings/ImageUploader';

export default function FamilyMembers() {
  const queryClient = useQueryClient();
  const { isDark, bgClass, textClass, cardBgClass, inputBgClass } = useTheme();
  
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    relationship: 'child',
    age: '',
    profile_image_url: '',
    favorite_color: '#FF69B4',
    schedule_checkins: false,
    checkin_frequency: 'weekly',
    checkin_day: 'Saturday',
    notes: ''
  });

  const { data: familyMembers = [], isLoading } = useQuery({
    queryKey: ['familyMembers'],
    queryFn: async () => {
      return await base44.entities.FamilyMember.filter({ is_active: true }, 'name');
    }
  });

  const createMemberMutation = useMutation({
    mutationFn: (data) => base44.entities.FamilyMember.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyMembers'] });
      resetForm();
    }
  });

  const updateMemberMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FamilyMember.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyMembers'] });
      resetForm();
    }
  });

  const deleteMemberMutation = useMutation({
    mutationFn: (id) => base44.entities.FamilyMember.update(id, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyMembers'] });
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      nickname: '',
      relationship: 'child',
      age: '',
      profile_image_url: '',
      favorite_color: '#FF69B4',
      schedule_checkins: false,
      checkin_frequency: 'weekly',
      checkin_day: 'Saturday',
      notes: ''
    });
    setEditingMember(null);
    setShowForm(false);
  };

  const handleEdit = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name || '',
      nickname: member.nickname || '',
      relationship: member.relationship || 'child',
      age: member.age || '',
      profile_image_url: member.profile_image_url || '',
      favorite_color: member.favorite_color || '#FF69B4',
      schedule_checkins: member.schedule_checkins || false,
      checkin_frequency: member.checkin_frequency || 'weekly',
      checkin_day: member.checkin_day || 'Saturday',
      notes: member.notes || ''
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    const data = {
      ...formData,
      age: formData.age ? parseInt(formData.age) : null
    };

    if (editingMember) {
      updateMemberMutation.mutate({ id: editingMember.id, data });
    } else {
      createMemberMutation.mutate(data);
    }
  };

  const relationshipIcons = {
    child: '👶',
    spouse: '💑',
    parent: '👨‍👩',
    sibling: '👯',
    close_friend: '🤝',
    extended_family: '👨‍👩‍👧‍👦',
    other: '💙'
  };

  return (
    <div className={`min-h-screen ${bgClass} ${textClass} p-4 md:p-8`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-500" />
            <h1 className="text-3xl font-bold">Family & Friends</h1>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-purple-600 to-pink-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Person
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {familyMembers.map((member) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className={cardBgClass}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {member.profile_image_url ? (
                          <img 
                            src={member.profile_image_url} 
                            alt={member.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                            style={{ backgroundColor: member.favorite_color + '30' }}
                          >
                            {relationshipIcons[member.relationship]}
                          </div>
                        )}
                        <div>
                          <CardTitle className="text-lg">{member.name}</CardTitle>
                          {member.nickname && (
                            <p className="text-sm text-gray-500">"{member.nickname}"</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEdit(member)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => deleteMemberMutation.mutate(member.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium capitalize">{member.relationship.replace('_', ' ')}</span>
                      {member.age && <span className="text-gray-500">• Age {member.age}</span>}
                    </div>
                    {member.schedule_checkins && (
                      <div className="flex items-center gap-2 text-sm text-purple-600">
                        <Calendar className="w-4 h-4" />
                        <span>1-on-1 {member.checkin_frequency} ({member.checkin_day})</span>
                      </div>
                    )}
                    {member.notes && (
                      <p className="text-sm text-gray-600 mt-2">{member.notes}</p>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Form Dialog */}
        <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMember ? 'Edit' : 'Add'} Family Member
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <Label>Photo</Label>
                  <ImageUploader
                    currentImage={formData.profile_image_url}
                    onImageChange={(url) => setFormData({ ...formData, profile_image_url: url })}
                    aspectRatio="square"
                    size="small"
                  />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <Label>Nickname</Label>
                    <Input
                      value={formData.nickname}
                      onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                      placeholder="What you call them"
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Relationship *</Label>
                  <Select 
                    value={formData.relationship} 
                    onValueChange={(v) => setFormData({ ...formData, relationship: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="spouse">Spouse</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="close_friend">Close Friend</SelectItem>
                      <SelectItem value="extended_family">Extended Family</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Age</Label>
                  <Input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div>
                <Label>Favorite Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.favorite_color}
                    onChange={(e) => setFormData({ ...formData, favorite_color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={formData.favorite_color}
                    onChange={(e) => setFormData({ ...formData, favorite_color: e.target.value })}
                    placeholder="#FF69B4"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div 
                  onClick={() => setFormData({ ...formData, schedule_checkins: !formData.schedule_checkins })}
                  className="flex items-start gap-3 cursor-pointer"
                >
                  <Checkbox checked={formData.schedule_checkins} />
                  <div>
                    <Label className="cursor-pointer">Schedule Regular 1-on-1 Time</Label>
                    <p className="text-sm text-gray-500">Remind me to spend quality time</p>
                  </div>
                </div>

                {formData.schedule_checkins && (
                  <div className="ml-7 mt-3 grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Frequency</Label>
                      <Select 
                        value={formData.checkin_frequency} 
                        onValueChange={(v) => setFormData({ ...formData, checkin_frequency: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Preferred Day</Label>
                      <Select 
                        value={formData.checkin_day} 
                        onValueChange={(v) => setFormData({ ...formData, checkin_day: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                            <SelectItem key={day} value={day}>{day}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any special notes..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!formData.name || createMemberMutation.isPending || updateMemberMutation.isPending}
                  className="bg-gradient-to-r from-purple-600 to-pink-600"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {editingMember ? 'Update' : 'Add'} Member
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}