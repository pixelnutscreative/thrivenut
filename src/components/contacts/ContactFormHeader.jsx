import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Star, Upload, X, Plus, Users, Globe, Lock, Pencil, Eye, EyeOff, ChevronDown, PlusCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { base44 } from '@/api/base44Client';

const colorOptions = [
  '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', 
  '#3B82F6', '#6366F1', '#84CC16', '#14B8A6', '#F97316',
  '#A855F7', '#F472B6', '#FB7185', '#FBBF24', '#34D399',
  '#60A5FA', '#818CF8', '#A3E635', '#2DD4BF', '#FB923C',
  '#C084FC', '#E879F9'
];

// Default clubs/groups with special formatting (alphabetical)
const defaultClubs = [
  { id: 'authentically_me', label: 'AuthenticallyMe', display: 'AuthenticallyMe' },
  { id: 'boss_metri', label: 'Boss Metri', display: 'Boss Metri' },
  { id: 'gen_x', label: 'Gen ❌', display: 'Gen X' },
  { id: 'group_7', label: 'Group 7', display: 'Group 7' },
  { id: 'group_god', label: 'Group God', display: 'Group God' },
  { id: 'mathy_mob', label: 'Mathy Mob', display: 'Mathy Mob' },
  { id: 'pixel_nuts', label: 'Pixel Nuts', display: 'Pixel Nuts' },
  { id: 'team_foley', label: 'Team Foley', display: 'Team Foley' },
  { id: 'washed_up_moms', label: "Washed Up Mom's Club", display: "Washed Up Mom's Club" },
  { id: 'we_do_not_care', label: 'We Do Not Care Club', display: 'We Do Not Care Club' },
  { id: 'we_do_not_have', label: 'We Do Not Have Club', display: 'We Do Not Have Club' },
];

export default function ContactFormHeader({ formData, setFormData, onSave, isSaving, isEditing, sharedClubs = [], onAddSharedClub, hiddenClubs = [], onToggleClubVisibility, primaryColor }) {
  const [newClub, setNewClub] = useState('');
  const [showClubsModal, setShowClubsModal] = useState(false);
  const [shareNewClub, setShareNewClub] = useState(false);
  const [showHiddenClubs, setShowHiddenClubs] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const buttonColor = primaryColor || '#8B5CF6';

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData({ ...formData, image_url: file_url });
  };

  return (
    <div className="space-y-4 pb-4 border-b">
      {/* Top row with favorite, friend IRL, color, and save */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, is_favorite: !formData.is_favorite })}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Star className={`w-5 h-5 ${formData.is_favorite ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
          </button>
          
          {/* Friend IRL toggle */}
          <div
            onClick={() => {
              const current = formData.role || [];
              setFormData({
                ...formData,
                role: current.includes('irl_friend')
                  ? current.filter(r => r !== 'irl_friend')
                  : [...current, 'irl_friend']
              });
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border cursor-pointer transition-colors text-xs ${
              formData.role?.includes('irl_friend')
                ? 'bg-green-100 border-green-400 text-green-700'
                : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-green-300'
            }`}
          >
            <Checkbox checked={formData.role?.includes('irl_friend')} className="h-3 w-3" />
            <span className="font-medium">Friend IRL</span>
          </div>
          
          {/* Favorite Color with popover */}
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-400">Color</span>
            <div
              className="w-5 h-5 rounded-full ring-2 ring-offset-1 ring-gray-300"
              style={{ backgroundColor: formData.color || '#000000' }}
            />
            <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="relative w-5 h-5 rounded-full border-2 border-dashed border-gray-300 hover:border-purple-400 flex items-center justify-center"
                >
                  <Plus className="w-3 h-3 text-gray-400" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="start">
                <div className="grid grid-cols-6 gap-1.5">
                  {colorOptions.map(color => (
                    <div
                      key={color}
                      onClick={() => {
                        setFormData({ ...formData, color });
                        setShowColorPicker(false);
                      }}
                      className={`w-6 h-6 rounded-full cursor-pointer hover:scale-110 transition-transform ${formData.color === color ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t flex items-center gap-2">
                  <span className="text-xs text-gray-500">Custom:</span>
                  <label className="relative w-6 h-6 rounded-full border-2 border-dashed border-gray-300 hover:border-purple-400 cursor-pointer flex items-center justify-center overflow-hidden">
                    <Plus className="w-3 h-3 text-gray-400" />
                    <Input
                      type="color"
                      value={formData.color || '#000000'}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </label>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <Button
          onClick={onSave}
          disabled={isSaving}
          size="sm"
          style={{ backgroundColor: buttonColor }}
          className="hover:opacity-90"
        >
          {isEditing ? 'Update' : 'Add'}
        </Button>
      </div>

      {/* Photo and names row */}
      <div className="flex gap-4">
        {/* Photo upload */}
        <div className="flex-shrink-0">
          <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
            {formData.image_url ? (
              <>
                <img src={formData.image_url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, image_url: '' })}
                  className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full hover:bg-gray-50">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-xs text-gray-400 mt-1">Photo</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* Name fields */}
        <div className="flex-1 grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Real Name</Label>
            <Input
              placeholder="Their actual name"
              value={formData.real_name || ''}
              onChange={(e) => setFormData({ ...formData, real_name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Nickname</Label>
            <Input
              placeholder="What you call them"
              value={formData.nickname || ''}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Clubs/Groups Section */}
      <div className="space-y-2 pt-2">
        <div className="flex items-center gap-2">
          <Label className="text-xs text-gray-500">Clubs & Groups</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 text-purple-600 hover:text-purple-700"
            onClick={() => setShowClubsModal(true)}
          >
            <Pencil className="w-3 h-3" />
          </Button>
        </div>
        
        {/* Show selected clubs only */}
        <div className="flex flex-wrap gap-1">
          {/* Default clubs that are selected - sorted alphabetically */}
          {defaultClubs
            .filter(club => formData.clubs?.includes(club.id))
            .map(club => (
              <Badge
                key={club.id}
                variant="default"
                className="text-xs bg-purple-600"
              >
                {club.label}
              </Badge>
            ))}
          {/* Shared community clubs that are selected */}
          {sharedClubs
            .filter(club => formData.clubs?.includes(`shared:${club.id}`))
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(club => (
              <Badge
                key={`shared-${club.id}`}
                variant="default"
                className="text-xs bg-green-600"
              >
                {club.name}
              </Badge>
            ))}
          {/* Custom clubs - sorted alphabetically */}
          {[...(formData.custom_clubs || [])]
            .sort((a, b) => a.localeCompare(b))
            .map((club, idx) => (
              <Badge
                key={`custom-${idx}`}
                variant="default"
                className="text-xs bg-teal-600"
              >
                {club}
              </Badge>
            ))}
          {(!formData.clubs?.length && !formData.custom_clubs?.length) && (
            <span className="text-xs text-gray-400 italic">No clubs selected</span>
          )}
        </div>
      </div>

      {/* Clubs Modal */}
      <Dialog open={showClubsModal} onOpenChange={setShowClubsModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Clubs & Groups
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            {/* Visible clubs */}
            <div className="grid grid-cols-2 gap-1.5">
              {defaultClubs.filter(club => !hiddenClubs.includes(club.id)).map(club => {
                const isActive = formData.clubs?.includes(club.id);
                return (
                  <div
                    key={club.id}
                    className={`flex items-center gap-1.5 p-1.5 rounded-lg border transition-colors ${
                      isActive ? 'bg-purple-100 border-purple-300' : 'bg-white border-gray-200 hover:border-purple-200'
                    }`}
                  >
                    <Checkbox 
                      checked={isActive} 
                      onCheckedChange={() => {
                        const current = formData.clubs || [];
                        setFormData({
                          ...formData,
                          clubs: isActive 
                            ? current.filter(c => c !== club.id)
                            : [...current, club.id]
                        });
                      }}
                      className="h-3.5 w-3.5"
                    />
                    <span className={`text-xs flex-1 truncate ${isActive ? 'font-medium text-purple-700' : 'text-gray-600'}`}>
                      {club.label}
                    </span>
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onToggleClubVisibility?.(club.id); }}
                        className="p-0.5 hover:bg-gray-200 rounded"
                      >
                        <EyeOff className="w-3 h-3 text-gray-400" />
                      </button>
                  </div>
                );
              })}
            </div>

            {/* Custom clubs */}
            {formData.custom_clubs?.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5">
                {[...(formData.custom_clubs || [])]
                  .sort((a, b) => a.localeCompare(b))
                  .map((club, idx) => (
                    <div
                      key={`custom-${idx}`}
                      className="flex items-center gap-1.5 p-1.5 bg-teal-50 rounded-lg border border-teal-200"
                    >
                      <Checkbox checked={true} disabled className="h-3.5 w-3.5" />
                      <span className="text-xs text-teal-700 flex-1 truncate">{club}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            custom_clubs: formData.custom_clubs.filter((_, i) => i !== idx)
                          });
                        }}
                        className="p-0.5 hover:bg-teal-200 rounded"
                      >
                        <X className="w-3 h-3 text-teal-600" />
                      </button>
                    </div>
                  ))}
              </div>
            )}

            {/* Community shared clubs */}
            {sharedClubs.filter(c => c.is_approved).length > 0 && (
              <div className="pt-2 border-t">
                <Label className="text-xs text-green-600 flex items-center gap-1 mb-1.5">
                  <Globe className="w-3 h-3" /> Community
                </Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {sharedClubs
                    .filter(c => c.is_approved)
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map(club => {
                      const clubKey = `shared:${club.id}`;
                      const isActive = formData.clubs?.includes(clubKey);
                      return (
                        <div
                          key={club.id}
                          className={`flex items-center gap-1.5 p-1.5 rounded-lg border transition-colors ${
                            isActive ? 'bg-green-100 border-green-300' : 'bg-white border-gray-200 hover:border-green-200'
                          }`}
                        >
                          <Checkbox 
                            checked={isActive}
                            onCheckedChange={() => {
                              const current = formData.clubs || [];
                              setFormData({
                                ...formData,
                                clubs: isActive 
                                  ? current.filter(c => c !== clubKey)
                                  : [...current, clubKey]
                              });
                            }}
                            className="h-3.5 w-3.5"
                          />
                          <span className={`text-xs flex-1 truncate ${isActive ? 'font-medium text-green-700' : 'text-gray-600'}`}>
                            {club.name}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Hidden clubs - collapsible */}
            {hiddenClubs.length > 0 && (
              <div className="pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowHiddenClubs(!showHiddenClubs)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                >
                  <EyeOff className="w-3 h-3" />
                  <span>{hiddenClubs.length} hidden</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showHiddenClubs ? 'rotate-180' : ''}`} />
                </button>
                {showHiddenClubs && (
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {defaultClubs.filter(club => hiddenClubs.includes(club.id)).map(club => (
                      <button
                        key={club.id}
                        type="button"
                        onClick={() => onToggleClubVisibility?.(club.id)}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 bg-gray-100 rounded hover:bg-gray-200"
                      >
                        <Eye className="w-3 h-3" />
                        {club.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Add custom club */}
            <div className="pt-2 border-t">
              <div className="flex gap-1.5">
                <Input
                  placeholder="Add custom club..."
                  value={newClub}
                  onChange={(e) => setNewClub(e.target.value)}
                  className="h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newClub.trim()) {
                      e.preventDefault();
                      if (shareNewClub && onAddSharedClub) {
                        onAddSharedClub(newClub.trim());
                      }
                      setFormData({
                        ...formData,
                        custom_clubs: [...(formData.custom_clubs || []), newClub.trim()]
                      });
                      setNewClub('');
                      setShareNewClub(false);
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  className="h-8 px-2 bg-teal-600 hover:bg-teal-700"
                  onClick={() => {
                    if (newClub.trim()) {
                      if (shareNewClub && onAddSharedClub) {
                        onAddSharedClub(newClub.trim());
                      }
                      setFormData({
                        ...formData,
                        custom_clubs: [...(formData.custom_clubs || []), newClub.trim()]
                      });
                      setNewClub('');
                      setShareNewClub(false);
                    }
                  }}
                  disabled={!newClub.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 mt-1.5 text-xs">
                <Switch
                  checked={shareNewClub}
                  onCheckedChange={setShareNewClub}
                  className="scale-75"
                />
                <span className={shareNewClub ? 'text-green-600' : 'text-gray-400'}>
                  {shareNewClub ? 'Share with community' : 'Keep private'}
                </span>
              </div>
            </div>
          </div>

          <Button
            className="w-full bg-purple-600 hover:bg-purple-700 mt-2"
            onClick={() => setShowClubsModal(false)}
          >
            Done
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}