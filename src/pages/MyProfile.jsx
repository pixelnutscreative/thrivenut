import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Shirt, Palette, Heart, Gift, Save, User, Inbox, Check, X, Plus } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';
import { motion, AnimatePresence } from 'framer-motion';

export default function MyProfile() {
  const queryClient = useQueryClient();
  const { bgClass, textClass, cardBgClass } = useTheme();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('style');
  const [saveMessage, setSaveMessage] = useState('');

  // Profile Form State
  const [formData, setFormData] = useState({
    clothing_sizes: { top: '', bottom: '', shoe: '', dress: '', ring: '', hat: '', other: '' },
    interests: '',
    wish_list: [],
    beauty_profile: { hair_color_preference: '', nail_polish_preference: '', makeup_notes: '', scent_notes: '' },
    style_profile: { vibe: '', favorite_brands: '', favorite_materials: '', disliked_materials: '' },
    allow_sharing: true,
    allow_suggestions: true
  });

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  // Fetch My Profile
  const { data: profile } = useQuery({
    queryKey: ['myProfile', user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ user_email: user?.email });
      return profiles[0] || null;
    },
    enabled: !!user
  });

  // Fetch Suggestions
  const { data: suggestions = [] } = useQuery({
    queryKey: ['suggestions'],
    queryFn: async () => {
      const res = await base44.functions.invoke('profile', { action: 'get_suggestions' });
      return res.data.suggestions || [];
    },
    enabled: !!user
  });

  // Init form
  useEffect(() => {
    if (profile) {
      setFormData({
        clothing_sizes: profile.clothing_sizes || { top: '', bottom: '', shoe: '', dress: '', ring: '', hat: '', other: '' },
        interests: profile.interests || '',
        wish_list: profile.wish_list || [],
        beauty_profile: profile.beauty_profile || { hair_color_preference: '', nail_polish_preference: '', makeup_notes: '', scent_notes: '' },
        style_profile: profile.style_profile || { vibe: '', favorite_brands: '', favorite_materials: '', disliked_materials: '' },
        allow_sharing: profile.allow_sharing !== false,
        allow_suggestions: profile.allow_suggestions !== false
      });
    }
  }, [profile]);

  // Mutations
  const saveProfileMutation = useMutation({
    mutationFn: async (data) => {
      if (profile) {
        return await base44.entities.UserProfile.update(profile.id, data);
      } else {
        return await base44.entities.UserProfile.create({
          user_email: user?.email,
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      setSaveMessage('Profile saved!');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  });

  const resolveSuggestionMutation = useMutation({
    mutationFn: async ({ id, status, profile_data }) => {
      return await base44.functions.invoke('profile', { 
        action: 'resolve_suggestion', 
        data: { id, status, profile_data } 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suggestions'] });
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    }
  });

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

  return (
    <div className={`min-h-screen ${bgClass} ${textClass} p-4 md:p-8`}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              My Profile
            </h1>
            <p className="text-gray-500">Manage your sizes, favorites, and wish list for family to see.</p>
          </div>
          <Button 
            onClick={() => saveProfileMutation.mutate(formData)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
            disabled={saveProfileMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {saveProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {saveMessage && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-100 text-green-800 p-3 rounded-lg text-center font-medium">
            {saveMessage}
          </motion.div>
        )}

        {/* SUGGESTIONS INBOX */}
        {suggestions.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-amber-800 flex items-center gap-2">
                <Inbox className="w-5 h-5" />
                Suggestions ({suggestions.length})
              </CardTitle>
              <CardDescription>Friends have suggested items for you!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {suggestions.map(sug => (
                <div key={sug.id} className="bg-white p-3 rounded-lg border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
                  <div>
                    <p className="font-medium text-gray-800">
                      <span className="text-purple-600">{sug.from_name}</span> suggested a {sug.suggestion_type === 'wish_list_item' ? 'Gift' : 'Change'}:
                    </p>
                    {sug.suggestion_type === 'wish_list_item' ? (
                      <div className="mt-1 text-sm bg-gray-50 p-2 rounded">
                        <strong>{sug.content.item}</strong>
                        {sug.content.link && <a href={sug.content.link} target="_blank" className="block text-blue-500 text-xs truncate">{sug.content.link}</a>}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 mt-1">{JSON.stringify(sug.content)}</p>
                    )}
                    {sug.message && <p className="text-xs text-gray-500 mt-1 italic">"{sug.message}"</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-red-200 hover:bg-red-50 text-red-600"
                      onClick={() => resolveSuggestionMutation.mutate({ id: sug.id, status: 'rejected' })}
                    >
                      <X className="w-4 h-4 mr-1" /> Decline
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => resolveSuggestionMutation.mutate({ 
                        id: sug.id, 
                        status: 'accepted',
                        profile_data: sug.suggestion_type === 'wish_list_item' ? { wish_list: [sug.content] } : sug.content 
                      })}
                    >
                      <Check className="w-4 h-4 mr-1" /> Accept & Add
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* MAIN PROFILE TABS */}
        <Card className={cardBgClass}>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="style">Sizes & Style</TabsTrigger>
                <TabsTrigger value="beauty">Beauty Profile</TabsTrigger>
                <TabsTrigger value="wishes">Interests & Wishes</TabsTrigger>
              </TabsList>

              <TabsContent value="style" className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div><Label>Top Size</Label><Input value={formData.clothing_sizes.top} onChange={(e) => updateNested('clothing_sizes', 'top', e.target.value)} /></div>
                  <div><Label>Bottom Size</Label><Input value={formData.clothing_sizes.bottom} onChange={(e) => updateNested('clothing_sizes', 'bottom', e.target.value)} /></div>
                  <div><Label>Shoe Size</Label><Input value={formData.clothing_sizes.shoe} onChange={(e) => updateNested('clothing_sizes', 'shoe', e.target.value)} /></div>
                  <div><Label>Ring Size</Label><Input value={formData.clothing_sizes.ring} onChange={(e) => updateNested('clothing_sizes', 'ring', e.target.value)} /></div>
                </div>
                
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium flex items-center gap-2"><Palette className="w-4 h-4" /> Style Preferences</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Your Vibe</Label>
                      <Select value={formData.style_profile.vibe} onValueChange={(v) => updateNested('style_profile', 'vibe', v)}>
                        <SelectTrigger><SelectValue placeholder="Select vibe" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="classic">Classic</SelectItem>
                          <SelectItem value="boho">Boho</SelectItem>
                          <SelectItem value="trendy">Trendy</SelectItem>
                          <SelectItem value="sporty">Sporty</SelectItem>
                          <SelectItem value="grunge">Grunge</SelectItem>
                          <SelectItem value="preppy">Preppy</SelectItem>
                          <SelectItem value="glam">Glam</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Favorite Brands</Label><Input value={formData.style_profile.favorite_brands} onChange={(e) => updateNested('style_profile', 'favorite_brands', e.target.value)} /></div>
                    <div><Label>Love Materials</Label><Input value={formData.style_profile.favorite_materials} onChange={(e) => updateNested('style_profile', 'favorite_materials', e.target.value)} /></div>
                    <div><Label>Hate Materials</Label><Input value={formData.style_profile.disliked_materials} onChange={(e) => updateNested('style_profile', 'disliked_materials', e.target.value)} /></div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="beauty" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div><Label>Hair Dye Preference</Label><Input value={formData.beauty_profile.hair_color_preference} onChange={(e) => updateNested('beauty_profile', 'hair_color_preference', e.target.value)} /></div>
                  <div><Label>Nail Polish Favorites</Label><Input value={formData.beauty_profile.nail_polish_preference} onChange={(e) => updateNested('beauty_profile', 'nail_polish_preference', e.target.value)} /></div>
                  <div className="col-span-2"><Label>Makeup Notes</Label><Textarea value={formData.beauty_profile.makeup_notes} onChange={(e) => updateNested('beauty_profile', 'makeup_notes', e.target.value)} /></div>
                </div>
              </TabsContent>

              <TabsContent value="wishes" className="space-y-6">
                <div>
                  <Label>Current Interests & Obsessions</Label>
                  <Textarea value={formData.interests} onChange={(e) => setFormData({ ...formData, interests: e.target.value })} />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2"><Gift className="w-4 h-4" /> Wish List</Label>
                    <Button size="sm" variant="outline" onClick={addWishItem}><Plus className="w-3 h-3 mr-1" /> Add</Button>
                  </div>
                  {formData.wish_list.map((item, idx) => (
                    <div key={idx} className="flex gap-2 items-start bg-gray-50 p-2 rounded">
                      <div className="grid gap-2 flex-1">
                        <Input placeholder="Item" value={item.item} onChange={(e) => updateWishItem(idx, 'item', e.target.value)} />
                        <Input placeholder="Link" value={item.link} onChange={(e) => updateWishItem(idx, 'link', e.target.value)} />
                      </div>
                      <Button size="icon" variant="ghost" onClick={() => removeWishItem(idx)} className="text-red-400"><X className="w-4 h-4" /></Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Checkbox checked={formData.allow_sharing} onCheckedChange={(c) => setFormData({ ...formData, allow_sharing: c })} />
                <Label>Allow family to find this profile by my email</Label>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Checkbox checked={formData.allow_suggestions} onCheckedChange={(c) => setFormData({ ...formData, allow_suggestions: c })} />
                <Label>Allow family to suggest wish list items</Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}