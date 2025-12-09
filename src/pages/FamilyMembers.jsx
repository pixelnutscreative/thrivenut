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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Plus, Calendar, Trash2, Edit, Save, Gift, Shirt, Palette, Heart, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../components/shared/useTheme';
import ImageUploader from '../components/settings/ImageUploader';

export default function FamilyMembers() {
  const queryClient = useQueryClient();
  const { bgClass, textClass, cardBgClass } = useTheme();
  
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [linkedProfile, setLinkedProfile] = useState(null);
  const [suggestionMode, setSuggestionMode] = useState(false);
  const [suggestionData, setSuggestionData] = useState({ item: '', link: '', notes: '' });
  
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
    style_profile: { vibe: '', favorite_brands: '', favorite_materials: '', disliked_materials: '' }
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
      style_profile: { vibe: '', favorite_brands: '', favorite_materials: '', disliked_materials: '' }
    });
    setEditingMember(null);
    setShowForm(false);
    setActiveTab('basic');
    setLinkedProfile(null);
    setSuggestionMode(false);
  };

  const handleEdit = async (member) => {
    setEditingMember(member);
    
    // Check for linked profile
    let profileData = {};
    let isLinked = false;
    
    if (member.linked_user_email) {
      try {
        const res = await base44.functions.invoke('profile', { action: 'get_profile', email: member.linked_user_email });
        if (res.data.found && res.data.profile) {
          profileData = res.data.profile;
          isLinked = true;
          setLinkedProfile(res.data.profile);
        }
      } catch (e) {
        console.error("Failed to fetch linked profile", e);
      }
    }

    setFormData({
      name: member.name || '',
      nickname: member.nickname || '',
      linked_user_email: member.linked_user_email || '',
      relationship: member.relationship || 'child',
      age: member.age || '',
      profile_image_url: member.profile_image_url || '',
      favorite_color: member.favorite_color || '#FF69B4',
      schedule_checkins: member.schedule_checkins || false,
      checkin_frequency: member.checkin_frequency || 'weekly',
      checkin_day: member.checkin_day || 'Saturday',
      notes: member.notes || '',
      
      // Use linked data if available, otherwise local
      clothing_sizes: isLinked ? (profileData.clothing_sizes || {}) : (member.clothing_sizes || { top: '', bottom: '', shoe: '', dress: '', ring: '', hat: '', other: '' }),
      interests: isLinked ? (profileData.interests || '') : (member.interests || ''),
      wish_list: isLinked ? (profileData.wish_list || []) : (member.wish_list || []),
      beauty_profile: isLinked ? (profileData.beauty_profile || {}) : (member.beauty_profile || { hair_color_preference: '', nail_polish_preference: '', makeup_notes: '', scent_notes: '' }),
      style_profile: isLinked ? (profileData.style_profile || {}) : (member.style_profile || { vibe: '', favorite_brands: '', favorite_materials: '', disliked_materials: '' })
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

  const updateNested = (category, field, value) => {
    setFormData(prev => ({
      ...prev,
      [category]: { ...prev[category], [field]: value }
    }));
  };

  const addWishItem = () => {
    setFormData(prev => ({
      ...prev,
      wish_list: [...prev.wish_list, { item: '', link: '', notes: '' }]
    }));
  };

  const updateWishItem = (index, field, value) => {
    const newList = [...formData.wish_list];
    newList[index] = { ...newList[index], [field]: value };
    setFormData(prev => ({ ...prev, wish_list: newList }));
  };

  const removeWishItem = (index) => {
    setFormData(prev => ({
      ...prev,
      wish_list: prev.wish_list.filter((_, i) => i !== index)
    }));
  };

  const sendSuggestion = useMutation({
    mutationFn: async () => {
      return await base44.functions.invoke('profile', { 
        action: 'suggest', 
        data: {
          target_email: formData.linked_user_email,
          suggestion_type: 'wish_list_item',
          content: suggestionData,
          message: 'Suggested from Family list'
        }
      });
    },
    onSuccess: () => {
      setSuggestionMode(false);
      setSuggestionData({ item: '', link: '', notes: '' });
      alert("Suggestion sent!");
    }
  });

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
              onClick={() => window.location.href = '/MyProfile'}
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
              <DialogTitle>{editingMember ? 'Edit' : 'Add'} Person</DialogTitle>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="style">Sizes & Style</TabsTrigger>
                <TabsTrigger value="wishes">Interests & Wishes</TabsTrigger>
              </TabsList>

              <div className="mt-4 space-y-4">
                {/* BASIC INFO TAB */}
                <TabsContent value="basic" className="space-y-4">
                  {linkedProfile ? (
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-blue-800">Linked to <strong>{formData.linked_user_email}</strong></span>
                      </div>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Read Only Mode</span>
                    </div>
                  ) : (
                     <div className="mb-4">
                       <Label>Link to App User (Email)</Label>
                       <div className="flex gap-2">
                         <Input 
                           placeholder="email@example.com" 
                           value={formData.linked_user_email} 
                           onChange={(e) => setFormData({ ...formData, linked_user_email: e.target.value })} 
                         />
                         <p className="text-xs text-gray-500 mt-1">
                           Link to their account to see their self-managed wishlist & sizes.
                         </p>
                       </div>
                     </div>
                  )}

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

                {/* SIZES & STYLE TAB */}
                <TabsContent value="style" className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2 text-purple-600"><Shirt className="w-4 h-4" /> Clothing Sizes {linkedProfile && <span className="text-xs font-normal text-gray-500">(Managed by them)</span>}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div><Label className="text-xs">Top/Shirt</Label><Input disabled={!!linkedProfile} value={formData.clothing_sizes?.top || ''} onChange={(e) => updateNested('clothing_sizes', 'top', e.target.value)} /></div>
                      <div><Label className="text-xs">Bottom/Pant</Label><Input disabled={!!linkedProfile} value={formData.clothing_sizes?.bottom || ''} onChange={(e) => updateNested('clothing_sizes', 'bottom', e.target.value)} /></div>
                      <div><Label className="text-xs">Shoe</Label><Input disabled={!!linkedProfile} value={formData.clothing_sizes?.shoe || ''} onChange={(e) => updateNested('clothing_sizes', 'shoe', e.target.value)} /></div>
                      <div><Label className="text-xs">Dress/Suit</Label><Input disabled={!!linkedProfile} value={formData.clothing_sizes?.dress || ''} onChange={(e) => updateNested('clothing_sizes', 'dress', e.target.value)} /></div>
                      <div><Label className="text-xs">Ring</Label><Input disabled={!!linkedProfile} value={formData.clothing_sizes?.ring || ''} onChange={(e) => updateNested('clothing_sizes', 'ring', e.target.value)} /></div>
                      <div><Label className="text-xs">Hat</Label><Input disabled={!!linkedProfile} value={formData.clothing_sizes?.hat || ''} onChange={(e) => updateNested('clothing_sizes', 'hat', e.target.value)} /></div>
                      <div className="col-span-2"><Label className="text-xs">Other Notes</Label><Input disabled={!!linkedProfile} value={formData.clothing_sizes?.other || ''} onChange={(e) => updateNested('clothing_sizes', 'other', e.target.value)} /></div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2 text-pink-600"><Palette className="w-4 h-4" /> Beauty & Style</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div><Label>Hair Color Preference</Label><Input placeholder="e.g. Platinum Blonde, Midnight Blue" value={formData.beauty_profile?.hair_color_preference || ''} onChange={(e) => updateNested('beauty_profile', 'hair_color_preference', e.target.value)} /></div>
                      <div><Label>Nail Polish Favorites</Label><Input placeholder="e.g. OPI Bubble Bath, Neon Green" value={formData.beauty_profile?.nail_polish_preference || ''} onChange={(e) => updateNested('beauty_profile', 'nail_polish_preference', e.target.value)} /></div>
                      <div><Label>Style Vibe</Label>
                        <Select value={formData.style_profile?.vibe || ''} onValueChange={(v) => updateNested('style_profile', 'vibe', v)}>
                          <SelectTrigger><SelectValue placeholder="Select vibe" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="classic">Classic / Timeless</SelectItem>
                            <SelectItem value="boho">Boho / Hippie</SelectItem>
                            <SelectItem value="trendy">Trendy / Modern</SelectItem>
                            <SelectItem value="sporty">Sporty / Athleisure</SelectItem>
                            <SelectItem value="grunge">Grunge / Edgy</SelectItem>
                            <SelectItem value="preppy">Preppy</SelectItem>
                            <SelectItem value="glam">Glam / High Fashion</SelectItem>
                            <SelectItem value="minimalist">Minimalist</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div><Label>Favorite Brands</Label><Input placeholder="e.g. Nike, Zara, Thrift Stores" value={formData.style_profile?.favorite_brands || ''} onChange={(e) => updateNested('style_profile', 'favorite_brands', e.target.value)} /></div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div><Label>Loves Materials</Label><Input placeholder="e.g. Cotton, Silk, Linen" value={formData.style_profile?.favorite_materials || ''} onChange={(e) => updateNested('style_profile', 'favorite_materials', e.target.value)} /></div>
                      <div><Label>Hates Materials</Label><Input placeholder="e.g. Wool (itchy!), Polyester" value={formData.style_profile?.disliked_materials || ''} onChange={(e) => updateNested('style_profile', 'disliked_materials', e.target.value)} /></div>
                    </div>
                  </div>
                </TabsContent>

                {/* INTERESTS & WISHES TAB */}
                <TabsContent value="wishes" className="space-y-6">
                  <div>
                    <Label className="flex items-center gap-2 mb-2"><Heart className="w-4 h-4 text-red-500" /> Interests & Obsessions</Label>
                    <Textarea 
                      placeholder="What are they into right now? Minecraft, Dinosaurs, Baking, etc."
                      value={formData.interests}
                      onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2"><Gift className="w-4 h-4 text-purple-500" /> Wish List / Gift Ideas</Label>
                      {!linkedProfile ? (
                        <Button size="sm" variant="outline" onClick={addWishItem}><Plus className="w-3 h-3 mr-1" /> Add Item</Button>
                      ) : (
                        <Button size="sm" className="bg-purple-100 text-purple-700 hover:bg-purple-200" onClick={() => setSuggestionMode(!suggestionMode)}>
                           Suggest Item
                        </Button>
                      )}
                    </div>

                    {suggestionMode && (
                      <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg space-y-2 mb-4">
                        <h4 className="text-sm font-semibold text-purple-800">Suggest an Item</h4>
                        <Input placeholder="Item Name" value={suggestionData.item} onChange={(e) => setSuggestionData({...suggestionData, item: e.target.value})} />
                        <Input placeholder="Link" value={suggestionData.link} onChange={(e) => setSuggestionData({...suggestionData, link: e.target.value})} />
                        <Button size="sm" onClick={() => sendSuggestion.mutate()} disabled={!suggestionData.item}>Send Suggestion</Button>
                      </div>
                    )}
                    
                    {formData.wish_list?.length === 0 && (
                      <div className="text-center p-4 bg-gray-50 rounded-lg border border-dashed text-gray-400 text-sm">
                        No items in wish list yet.
                      </div>
                    )}

                    <div className="space-y-3">
                      {formData.wish_list?.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-start bg-gray-50 p-2 rounded-lg">
                          <div className="grid gap-2 flex-1">
                            <Input 
                              disabled={!!linkedProfile}
                              placeholder="Item Name" 
                              value={item.item} 
                              onChange={(e) => updateWishItem(idx, 'item', e.target.value)} 
                              className="bg-white"
                            />
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <ExternalLink className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                                <Input 
                                  disabled={!!linkedProfile}
                                  placeholder="Link (http://...)" 
                                  value={item.link} 
                                  onChange={(e) => updateWishItem(idx, 'link', e.target.value)} 
                                  className="pl-8 bg-white"
                                />
                              </div>
                              <Input 
                                disabled={!!linkedProfile}
                                placeholder="Notes (Size, Color...)" 
                                value={item.notes} 
                                onChange={(e) => updateWishItem(idx, 'notes', e.target.value)} 
                                className="flex-1 bg-white"
                              />
                            </div>
                          </div>
                          {!linkedProfile && (
                            <Button size="icon" variant="ghost" onClick={() => removeWishItem(idx)} className="text-gray-400 hover:text-red-500">
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </div>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button onClick={handleSubmit} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  Save Member
                </Button>
              </div>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}