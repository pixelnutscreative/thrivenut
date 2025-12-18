import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Plus, Calendar, Trash2, Edit, Save, Gift, Shirt, Palette, Heart, Check, ExternalLink, Camera, Sparkles, MessageCircle, Music, Utensils, Coffee, TriangleAlert, User, Eye, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../components/shared/useTheme';
import ImageUploader from '../components/settings/ImageUploader';
import { Switch } from '@/components/ui/switch';

// Import Shared Components
import ProfileFavoritesTab from '../components/contacts/ProfileFavoritesTab';
import MomentsTabContent from '../components/contacts/MomentsTabContent';

export default function FamilyMembers() {
  const queryClient = useQueryClient();
  const { bgClass, textClass, cardBgClass } = useTheme();
  
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  
  // "My View" vs "Their View" Toggle State
  const [viewMode, setViewMode] = useState('mine'); // 'mine' or 'theirs'
  const [linkedProfile, setLinkedProfile] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    linked_user_email: '',
    relationship: 'child',
    age: '',
    profile_image_url: '',
    favorite_color: '#FF69B4',
    schedule_checkins: false,
    checkin_frequency: 'weekly',
    checkin_day: 'Saturday',
    notes: '',
    clothing_sizes: { top: '', bottom: '', shoe: '', dress: '', ring: '', hat: '', other: '' },
    interests: '',
    wish_list: [],
    beauty_profile: { hair_color_preference: '', nail_polish_preference: '', makeup_notes: '', scent_notes: '' },
    style_profile: { vibe: '', favorite_brands: '', favorite_materials: '', disliked_materials: '' },
    food_profile: { likes: '', dislikes: '', allergies: [], dietary_restrictions: [], coffee_order: '', cocktail_order: '', notes: '' },
    memorable_moments: []
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
      linked_user_email: '',
      relationship: 'child',
      age: '',
      profile_image_url: '',
      favorite_color: '#FF69B4',
      schedule_checkins: false,
      checkin_frequency: 'weekly',
      checkin_day: 'Saturday',
      notes: '',
      clothing_sizes: { top: '', bottom: '', shoe: '', dress: '', ring: '', hat: '', other: '' },
      interests: '',
      wish_list: [],
      beauty_profile: { hair_color_preference: '', nail_polish_preference: '', makeup_notes: '', scent_notes: '' },
      style_profile: { vibe: '', favorite_brands: '', favorite_materials: '', disliked_materials: '' },
      food_profile: { likes: '', dislikes: '', allergies: [], dietary_restrictions: [], coffee_order: '', cocktail_order: '', notes: '' },
      memorable_moments: []
    });
    setEditingMember(null);
    setShowForm(false);
    setActiveTab('basic');
    setLinkedProfile(null);
    setViewMode('mine');
  };

  const handleEdit = async (member) => {
    setEditingMember(member);
    
    // Fetch linked profile but DON'T overwrite local data immediately
    // Just store it in linkedProfile state for the toggle
    if (member.linked_user_email) {
      try {
        const res = await base44.functions.invoke('profile', { action: 'get_profile', email: member.linked_user_email });
        if (res.data.found && res.data.profile) {
          setLinkedProfile(res.data.profile);
        } else {
          setLinkedProfile(null);
        }
      } catch (e) {
        console.error("Failed to fetch linked profile", e);
        setLinkedProfile(null);
      }
    } else {
      setLinkedProfile(null);
    }

    setFormData({
      ...member,
      // Ensure objects exist
      clothing_sizes: member.clothing_sizes || {},
      beauty_profile: member.beauty_profile || {},
      style_profile: member.style_profile || {},
      food_profile: member.food_profile || {},
      wish_list: member.wish_list || [],
      memorable_moments: member.memorable_moments || []
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
    child: '👶', spouse: '💑', parent: '👨‍👩', sibling: '👯',
    close_friend: '🤝', extended_family: '👨‍👩‍👧‍👦', other: '💙'
  };

  return (
    <div className={`min-h-screen ${bgClass} ${textClass} p-4 md:p-8`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-500" />
            <h1 className="text-3xl font-bold">Family & Friends</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/Settings?section=profile'}
              className="border-purple-200 hover:bg-purple-50 text-purple-700"
            >
              <User className="w-4 h-4 mr-2" />
              Manage My Profile
            </Button>
            <Button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Person
            </Button>
          </div>
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
                            style={{ backgroundColor: (member.favorite_color || '#FF69B4') + '30' }}
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
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(member)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteMemberMutation.mutate(member.id)} className="text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium capitalize">{member.relationship.replace('_', ' ')}</span>
                      {member.age && <span className="text-gray-500">• Age {member.age}</span>}
                    </div>
                    
                    {/* Quick Badges */}
                    <div className="flex flex-wrap gap-2">
                      {member.wish_list && member.wish_list.length > 0 && (
                        <div className="px-2 py-1 bg-pink-100 text-pink-700 rounded-md text-xs flex items-center gap-1">
                          <Gift className="w-3 h-3" />
                          {member.wish_list.length} wishes
                        </div>
                      )}
                      {member.clothing_sizes?.top && (
                        <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs flex items-center gap-1">
                          <Shirt className="w-3 h-3" />
                          Sizes
                        </div>
                      )}
                      {member.style_profile?.vibe && (
                        <div className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs flex items-center gap-1">
                          <Palette className="w-3 h-3" />
                          {member.style_profile.vibe}
                        </div>
                      )}
                    </div>

                    {member.schedule_checkins && (
                      <div className="flex items-center gap-2 text-sm text-purple-600">
                        <Calendar className="w-4 h-4" />
                        <span>1-on-1 {member.checkin_frequency}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between pr-8">
                <DialogTitle>{editingMember ? 'Edit' : 'Add'} Person</DialogTitle>
                
                {/* VIEW TOGGLE */}
                {linkedProfile && (
                  <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                    <button
                      onClick={() => setViewMode('mine')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                        viewMode === 'mine' 
                          ? 'bg-white text-purple-700 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      My View
                    </button>
                    <button
                      onClick={() => setViewMode('theirs')}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                        viewMode === 'theirs' 
                          ? 'bg-purple-600 text-white shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Their View
                    </button>
                  </div>
                )}
              </div>
            </DialogHeader>

            {/* Info Banner when viewing their profile */}
            {viewMode === 'theirs' && linkedProfile && (
              <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg flex items-center gap-2 text-sm text-purple-800">
                <Globe className="w-4 h-4" />
                <span>Viewing data from their connected Thrive profile. <strong>Read-only.</strong></span>
              </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-2">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="style">Sizes & Style</TabsTrigger>
                <TabsTrigger value="food">Food & Favorites</TabsTrigger>
                <TabsTrigger value="wishes">Interests & Wishes</TabsTrigger>
                <TabsTrigger value="moments">Moments</TabsTrigger>
              </TabsList>

              <div className="mt-4 space-y-4">
                {/* BASIC INFO TAB */}
                <TabsContent value="basic" className="space-y-4">
                  <div className="mb-4">
                    <Label>Link to App User (Email)</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="email@example.com" 
                        value={formData.linked_user_email} 
                        onChange={(e) => setFormData({ ...formData, linked_user_email: e.target.value })} 
                      />
                      {linkedProfile ? (
                        <div className="flex items-center gap-1 text-green-600 text-sm font-medium whitespace-nowrap">
                          <Check className="w-4 h-4" /> Linked
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 mt-2">
                          Enter their Thrive account email to see their wishlist & sizes.
                        </p>
                      )}
                    </div>
                  </div>

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
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Name *</Label>
                          <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div>
                          <Label>Nickname</Label>
                          <Input value={formData.nickname} onChange={(e) => setFormData({ ...formData, nickname: e.target.value })} />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Relationship *</Label>
                          <Select value={formData.relationship} onValueChange={(v) => setFormData({ ...formData, relationship: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
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
                          <Input type="number" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Favorite Color</Label>
                    <div className="flex gap-2">
                      <Input type="color" value={formData.favorite_color || '#FF69B4'} onChange={(e) => setFormData({ ...formData, favorite_color: e.target.value })} className="w-20 h-10" />
                      <Input value={formData.favorite_color} onChange={(e) => setFormData({ ...formData, favorite_color: e.target.value })} />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div onClick={() => setFormData({ ...formData, schedule_checkins: !formData.schedule_checkins })} className="flex items-center gap-2 cursor-pointer mb-3">
                      <Checkbox checked={formData.schedule_checkins} />
                      <Label className="cursor-pointer">Schedule 1-on-1 Check-ins</Label>
                    </div>
                    {formData.schedule_checkins && (
                      <div className="grid grid-cols-2 gap-4 ml-6">
                        <div>
                          <Label>Frequency</Label>
                          <Select value={formData.checkin_frequency} onValueChange={(v) => setFormData({ ...formData, checkin_frequency: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Day</Label>
                          <Select value={formData.checkin_day} onValueChange={(v) => setFormData({ ...formData, checkin_day: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                                <SelectItem key={d} value={d}>{d}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* SHARED COMPONENTS FOR OTHER TABS */}
                {/* Note: We pass isReadOnly based on viewMode */}
                
                {/* Sizes & Style */}
                <TabsContent value="style" className="mt-0">
                  <ProfileFavoritesTab 
                    formData={formData} 
                    setFormData={setFormData}
                    isProfile={false}
                    linkedProfileData={viewMode === 'theirs' ? linkedProfile : null} // Pass linked data directly if in "theirs" mode
                    linkedEmail={formData.linked_user_email}
                  />
                </TabsContent>

                {/* Food & Favorites */}
                <TabsContent value="food" className="mt-0">
                  {/* Reuse ProfileFavoritesTab but switch to food subtab initially? 
                      Actually ProfileFavoritesTab manages its own internal tabs.
                      Since we have split tabs in parent, we might need to force the active tab in ProfileFavoritesTab
                      OR just render it. The user sees "Food & Favorites" as a tab here.
                      But ProfileFavoritesTab HAS "Food & Faves" as a subtab.
                      
                      Wait, ProfileFavoritesTab has ALL 3 sections (Sizes, Food, Wishes) inside it.
                      The user wants specific tabs in the parent modal.
                      
                      Solution: Render ProfileFavoritesTab but hide its internal tabs and force show specific content?
                      No, ProfileFavoritesTab is a self-contained component with Tabs.
                      
                      Better: Just render ProfileFavoritesTab in one "Favorites" tab like People.js does?
                      BUT the screenshot shows specific tabs: "Sizes & Style", "Food & Favorites".
                      
                      Let's stick to the structure in the screenshot:
                      The user said "favorites and moments needs to match the family section".
                      So ProfileFavoritesTab SHOULD match FamilyMembers.js structure.
                      
                      If I use ProfileFavoritesTab here, I get nested tabs which might be weird if I also have parent tabs.
                      
                      Let's check `ProfileFavoritesTab.js` again. It has TabsList with "Sizes", "Food", "Wishes".
                      If I put it inside "style" tab here, users will see the "Sizes" subtab by default.
                      
                      Actually, `People.js` uses `ProfileFavoritesTab` which contains ALL that info.
                      In `FamilyMembers.js`, I have separate tabs for Style, Food, Wishes.
                      
                      To unify them, `People.js` should probably just use `ProfileFavoritesTab` (which it does).
                      And `FamilyMembers.js` can ALSO use `ProfileFavoritesTab` but maybe I should collapse the parent tabs?
                      
                      Let's collapse parent tabs in FamilyMembers to: "Basic", "Favorites & Details", "Moments".
                      Then "Favorites & Details" renders `ProfileFavoritesTab` which has the sub-tabs.
                      This aligns with `People.js`.
                  */}
                </TabsContent>
              </div>
            </Tabs>
            
            {/* REDO TABS FOR FAMILY MEMBERS TO MATCH PEOPLE.JS STRUCTURE */}
            {/* Using a new simplified tab structure for FamilyMembers to align with People.js */}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}