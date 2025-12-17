import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Shirt, Utensils, Heart, Gift, Lock, Globe, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProfileFavoritesTab({ 
  formData, 
  setFormData, 
  isProfile = false,
  linkedEmail = null // Email of the user this contact is linked to (if any)
}) {
  const [activeSubTab, setActiveSubTab] = useState('sizes');
  const [viewMode, setViewMode] = useState('mine'); // 'mine' or 'theirs'

  // Fetch public profile if we're in "theirs" mode and have a linked email
  const { data: publicProfile, isLoading, refetch } = useQuery({
    queryKey: ['publicProfile', linkedEmail],
    queryFn: async () => {
      if (!linkedEmail) return null;
      try {
        const response = await base44.functions.invoke('getPublicProfile', { email: linkedEmail });
        return response.data;
      } catch (e) {
        console.error("Failed to fetch public profile", e);
        return null;
      }
    },
    enabled: !!linkedEmail && viewMode === 'theirs' && !isProfile
  });

  const data = (viewMode === 'theirs' && publicProfile && !isProfile) ? publicProfile : formData;
  const isReadOnly = viewMode === 'theirs' && !isProfile;

  const updateNested = (category, field, value) => {
    if (isReadOnly) return;
    setFormData(prev => ({
      ...prev,
      [category]: { ...prev[category], [field]: value }
    }));
  };

  const addListItem = (listName, emptyItem) => {
    if (isReadOnly) return;
    setFormData(prev => ({
      ...prev,
      [listName]: [...(prev[listName] || []), emptyItem]
    }));
  };

  const updateListItem = (listName, index, field, value) => {
    if (isReadOnly) return;
    const newList = [...(formData[listName] || [])];
    newList[index] = { ...newList[index], [field]: value };
    setFormData(prev => ({ ...prev, [listName]: newList }));
  };

  const removeListItem = (listName, index) => {
    if (isReadOnly) return;
    setFormData(prev => ({
      ...prev,
      [listName]: (formData[listName] || []).filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-4">
      {/* View Toggle - Only show if not editing self and there is a linked email */}
      {!isProfile && linkedEmail && (
        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2">
            <Globe className={`w-4 h-4 ${viewMode === 'theirs' ? 'text-purple-600' : 'text-gray-400'}`} />
            <span className="text-sm font-medium text-purple-900">
              {viewMode === 'theirs' ? `Viewing ${publicProfile?.nickname || 'Creator'}'s Profile` : 'Editing My Notes'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${viewMode === 'mine' ? 'font-bold text-gray-800' : 'text-gray-500'}`}>My Notes</span>
            <Switch 
              checked={viewMode === 'theirs'}
              onCheckedChange={(checked) => setViewMode(checked ? 'theirs' : 'mine')}
            />
            <span className={`text-xs ${viewMode === 'theirs' ? 'font-bold text-purple-700' : 'text-gray-500'}`}>Their Profile</span>
          </div>
        </div>
      )}

      {/* Sub Tabs */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3 bg-gray-100/50">
          <TabsTrigger value="sizes" className="text-xs">Sizes & Style</TabsTrigger>
          <TabsTrigger value="food" className="text-xs">Food & Faves</TabsTrigger>
          <TabsTrigger value="wishes" className="text-xs">Wishes</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <AnimatePresence mode="wait">
            {/* SIZES & STYLE */}
            <TabsContent value="sizes" className="mt-0 focus-visible:ring-0">
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs text-gray-500">Top</Label><Input disabled={isReadOnly} value={data.clothing_sizes?.top || ''} onChange={(e) => updateNested('clothing_sizes', 'top', e.target.value)} className="h-8" /></div>
                  <div><Label className="text-xs text-gray-500">Bottom</Label><Input disabled={isReadOnly} value={data.clothing_sizes?.bottom || ''} onChange={(e) => updateNested('clothing_sizes', 'bottom', e.target.value)} className="h-8" /></div>
                  <div><Label className="text-xs text-gray-500">Shoe</Label><Input disabled={isReadOnly} value={data.clothing_sizes?.shoe || ''} onChange={(e) => updateNested('clothing_sizes', 'shoe', e.target.value)} className="h-8" /></div>
                  <div><Label className="text-xs text-gray-500">Dress</Label><Input disabled={isReadOnly} value={data.clothing_sizes?.dress || ''} onChange={(e) => updateNested('clothing_sizes', 'dress', e.target.value)} className="h-8" /></div>
                  <div><Label className="text-xs text-gray-500">Ring</Label><Input disabled={isReadOnly} value={data.clothing_sizes?.ring || ''} onChange={(e) => updateNested('clothing_sizes', 'ring', e.target.value)} className="h-8" /></div>
                  <div><Label className="text-xs text-gray-500">Hat</Label><Input disabled={isReadOnly} value={data.clothing_sizes?.hat || ''} onChange={(e) => updateNested('clothing_sizes', 'hat', e.target.value)} className="h-8" /></div>
                </div>
                <div className="space-y-2 pt-2 border-t">
                  <div><Label className="text-xs text-gray-500">Style Vibe</Label><Input disabled={isReadOnly} value={data.style_profile?.vibe || ''} onChange={(e) => updateNested('style_profile', 'vibe', e.target.value)} className="h-8" /></div>
                  <div><Label className="text-xs text-gray-500">Favorite Brands</Label><Input disabled={isReadOnly} value={data.style_profile?.favorite_brands || ''} onChange={(e) => updateNested('style_profile', 'favorite_brands', e.target.value)} className="h-8" /></div>
                </div>
              </motion.div>
            </TabsContent>

            {/* FOOD & FAVES */}
            <TabsContent value="food" className="mt-0 focus-visible:ring-0">
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div>
                  <Label className="text-xs text-gray-500">Food Likes</Label>
                  <Input disabled={isReadOnly} value={data.food_preferences?.likes || ''} onChange={(e) => updateNested('food_preferences', 'likes', e.target.value)} className="h-8" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Food Dislikes</Label>
                  <Input disabled={isReadOnly} value={data.food_preferences?.dislikes || ''} onChange={(e) => updateNested('food_preferences', 'dislikes', e.target.value)} className="h-8" />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Favorite Restaurants</Label>
                  <Input disabled={isReadOnly} value={data.food_preferences?.favorite_restaurants || ''} onChange={(e) => updateNested('food_preferences', 'favorite_restaurants', e.target.value)} className="h-8" />
                </div>
                <div className="pt-2 border-t">
                  <Label className="text-xs text-gray-500 mb-2 block">Allergies</Label>
                  {(data.allergies || []).map((allergy, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <Input disabled={isReadOnly} value={allergy.name} onChange={(e) => updateListItem('allergies', idx, 'name', e.target.value)} placeholder="Allergy" className="h-8" />
                      <Input disabled={isReadOnly} value={allergy.severity} onChange={(e) => updateListItem('allergies', idx, 'severity', e.target.value)} placeholder="Severity" className="h-8 w-24" />
                      {!isReadOnly && <Button size="sm" variant="ghost" onClick={() => removeListItem('allergies', idx)} className="h-8 w-8 p-0 text-red-400">×</Button>}
                    </div>
                  ))}
                  {!isReadOnly && <Button size="sm" variant="outline" onClick={() => addListItem('allergies', { name: '', severity: 'mild' })} className="h-7 text-xs">+ Add Allergy</Button>}
                </div>
              </motion.div>
            </TabsContent>

            {/* WISHES & INTERESTS */}
            <TabsContent value="wishes" className="mt-0 focus-visible:ring-0">
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <div>
                  <Label className="text-xs text-gray-500">Interests / Hobbies</Label>
                  <Input disabled={isReadOnly} value={data.interests || ''} onChange={(e) => isProfile ? setFormData({...formData, interests: e.target.value}) : setFormData({...formData, interests: e.target.value})} className="h-8" />
                </div>
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs text-gray-500">Wish List</Label>
                    {!isReadOnly && <Button size="sm" variant="ghost" onClick={() => addListItem('wish_list', { item: '', link: '' })} className="h-6 text-xs text-purple-600">+ Add Item</Button>}
                  </div>
                  <div className="space-y-2">
                    {(data.wish_list || []).map((item, idx) => (
                      <div key={idx} className="p-2 bg-gray-50 rounded border border-gray-100">
                        <div className="flex gap-2 mb-1">
                          <Input disabled={isReadOnly} value={item.item} onChange={(e) => updateListItem('wish_list', idx, 'item', e.target.value)} placeholder="Item name" className="h-7 text-xs font-medium" />
                          {!isReadOnly && <Button size="sm" variant="ghost" onClick={() => removeListItem('wish_list', idx)} className="h-7 w-7 p-0 text-red-400">×</Button>}
                        </div>
                        <Input disabled={isReadOnly} value={item.link} onChange={(e) => updateListItem('wish_list', idx, 'link', e.target.value)} placeholder="https://..." className="h-7 text-xs text-blue-600" />
                      </div>
                    ))}
                    {(data.wish_list || []).length === 0 && <p className="text-xs text-gray-400 italic text-center py-2">No wishes added yet</p>}
                  </div>
                </div>
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </div>
      </Tabs>
    </div>
  );
}