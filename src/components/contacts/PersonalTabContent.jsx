import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Instagram, Facebook, Youtube, Twitter, Linkedin, Twitch, Star, Calendar, Trash2 } from 'lucide-react';
import NotesWithHistory from './NotesWithHistory';

const veteranBranches = [
  { value: 'ARMY', label: 'Army' },
  { value: 'NAVY', label: 'Navy' },
  { value: 'AF', label: 'Air Force' },
  { value: 'USMC', label: 'Marines' },
  { value: 'USCG', label: 'Coast Guard' },
  { value: 'NG', label: 'National Guard' },
  { value: 'Other', label: 'Other/Unknown' }
];

const generations = ['Gen Z', 'Millennial', 'Gen X', 'Boomer', 'Silent', 'Other'];

const defaultFamilyRoles = [
  'Mom', 'Dad', 'Single Mom', 'Single Dad', 'SAHM', 'SAHD', 
  'Grandma', 'Grandpa', 'Widow', 'Widower', 'Empty Nester', 
  'Foster Parent', 'Step-Parent', 'Caregiver'
];

const defaultSocialPlatforms = [
  { key: 'instagram', label: 'Instagram', icon: Instagram },
  { key: 'facebook', label: 'Facebook', icon: Facebook },
  { key: 'youtube', label: 'YouTube', icon: Youtube },
  { key: 'twitter', label: 'X / Twitter', icon: Twitter },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { key: 'threads', label: 'Threads', icon: null },
  { key: 'twitch', label: 'Twitch', icon: Twitch },
  { key: 'discord', label: 'Discord', icon: null },
  { key: 'snapchat', label: 'Snapchat', icon: null },
  { key: 'pinterest', label: 'Pinterest', icon: null },
];

export default function PersonalTabContent({ formData, setFormData, hidePrivateInfo, isProfile = false }) {
  const [showSocialPicker, setShowSocialPicker] = useState(false);
  const [customSocialName, setCustomSocialName] = useState('');
  const [customSocialValue, setCustomSocialValue] = useState('');

  const handleAddNote = (note) => {
    setFormData(prev => ({
      ...prev,
      personal_notes: [...(prev.personal_notes || []), note]
    }));
  };

  const socialLinks = formData.social_links || {};
  const activeSocials = Object.entries(socialLinks).filter(([_, v]) => v);

  const handleAddSocial = (platform) => {
    setFormData({ 
      ...formData, 
      social_links: { ...socialLinks, [platform]: '' } 
    });
    setShowSocialPicker(false);
  };

  const handleRemoveSocial = (platform) => {
    const updated = { ...socialLinks };
    delete updated[platform];
    setFormData({ ...formData, social_links: updated });
  };

  const handleAddCustomSocial = () => {
    if (customSocialName.trim()) {
      const key = `custom_${customSocialName.toLowerCase().replace(/\s+/g, '_')}`;
      setFormData({ 
        ...formData, 
        social_links: { ...socialLinks, [key]: customSocialValue } 
      });
      setCustomSocialName('');
      setCustomSocialValue('');
      setShowSocialPicker(false);
    }
  };

  const availablePlatforms = defaultSocialPlatforms.filter(p => !socialLinks.hasOwnProperty(p.key));

  return (
    <div className="space-y-4">
      {/* Link to App User (Email) - Only for contacts, not profile */}
      {!isProfile && (
        <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
          <Label className="text-xs font-semibold text-blue-800">Link to App User (Email)</Label>
          <p className="text-[10px] text-blue-600 mb-1.5">Link to their account to see their self-managed wishlist & sizes.</p>
          <Input
            type="email"
            placeholder="their-email@example.com"
            value={formData.linked_user_email || ''}
            onChange={(e) => setFormData({ ...formData, linked_user_email: e.target.value })}
            className="bg-white"
          />
        </div>
      )}

      {/* Contact Info */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Phone</Label>
          <Input
            type={hidePrivateInfo ? "password" : "tel"}
            placeholder="(555) 123-4567"
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Email</Label>
          <Input
            type={hidePrivateInfo ? "password" : "email"}
            placeholder="email@example.com"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
      </div>

      {/* Personal Notes - Hidden on Profile */}
      {!isProfile && (
        <NotesWithHistory
          notes={formData.personal_notes || []}
          onAddNote={handleAddNote}
          label="Personal Notes"
        />
      )}

      {/* Key Statuses - Veteran & Recovery */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-gradient-to-r from-red-50 via-white to-blue-50 border border-red-200 space-y-2">
          <div
            onClick={() => setFormData({ ...formData, is_veteran: !formData.is_veteran })}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Checkbox checked={formData.is_veteran} />
            <span className="text-lg">🇺🇸</span>
            <Label className="cursor-pointer font-semibold text-blue-800 text-sm">Veteran</Label>
          </div>

          {formData.is_veteran && (
            <Select 
              value={formData.veteran_branch || ''} 
              onValueChange={(v) => setFormData({ ...formData, veteran_branch: v })}
            >
              <SelectTrigger className="h-8"><SelectValue placeholder="Branch..." /></SelectTrigger>
              <SelectContent>
                {veteranBranches.map(branch => (
                  <SelectItem key={branch.value} value={branch.value}>{branch.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="p-3 rounded-lg bg-green-50 border border-green-200 space-y-2">
          <div
            onClick={() => setFormData({ ...formData, is_in_recovery: !formData.is_in_recovery })}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Checkbox checked={formData.is_in_recovery} />
            <span className="text-lg">💚</span>
            <Label className="cursor-pointer font-semibold text-green-800 text-sm">In Recovery</Label>
          </div>

          {formData.is_in_recovery && (
            <Input
              type="date"
              placeholder="Sobriety date"
              value={formData.sobriety_date || ''}
              onChange={(e) => setFormData({ ...formData, sobriety_date: e.target.value })}
              className="h-8"
            />
          )}
        </div>
      </div>

      {/* Special Dates */}
      <div className="space-y-2 p-3 bg-purple-50 rounded-lg border border-purple-100">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold text-purple-900 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Special Dates & Anniversaries
          </Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-purple-700 hover:bg-purple-100"
            onClick={() => {
              const newDate = { id: Date.now().toString(), date: '', title: '', type: 'milestone', is_special_date: true };
              setFormData({
                ...formData,
                moments: [...(formData.moments || []), newDate],
                memorable_moments: [...(formData.moments || []), newDate]
              });
            }}
          >
            <Plus className="w-3 h-3 mr-1" /> Add Date
          </Button>
        </div>
        
        <div className="space-y-2">
          {/* Show moments that are flagged as special dates or look like special dates */}
          {(formData.moments || []).filter(m => m.is_special_date || m.type === 'milestone').map((moment, idx) => (
            <div key={moment.id || idx} className="flex gap-2 items-center">
              <Input
                type="date"
                value={moment.date}
                onChange={(e) => {
                  const updated = [...(formData.moments || [])];
                  const index = updated.findIndex(m => m.id === moment.id);
                  if (index !== -1) {
                    updated[index] = { ...updated[index], date: e.target.value };
                    setFormData({ ...formData, moments: updated, memorable_moments: updated });
                  }
                }}
                className="h-8 w-32 bg-white"
              />
              <Input
                placeholder="Event Name (e.g. Wedding Anniversary)"
                value={moment.title}
                onChange={(e) => {
                  const updated = [...(formData.moments || [])];
                  const index = updated.findIndex(m => m.id === moment.id);
                  if (index !== -1) {
                    updated[index] = { ...updated[index], title: e.target.value };
                    setFormData({ ...formData, moments: updated, memorable_moments: updated });
                  }
                }}
                className="h-8 flex-1 bg-white"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-gray-400 hover:text-red-500"
                onClick={() => {
                  const updated = (formData.moments || []).filter(m => m.id !== moment.id);
                  setFormData({ ...formData, moments: updated, memorable_moments: updated });
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {(!formData.moments || formData.moments.filter(m => m.is_special_date || m.type === 'milestone').length === 0) && (
            <p className="text-xs text-gray-400 italic px-1">No additional special dates added.</p>
          )}
        </div>
      </div>

      {/* Birthday & Generation */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Birthday</Label>
          <Input
            type="date"
            value={formData.birthday || ''}
            onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Generation</Label>
          <Select 
            value={formData.generation || ''} 
            onValueChange={(v) => setFormData({ ...formData, generation: v })}
          >
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              {generations.map(gen => (
                <SelectItem key={gen} value={gen}>{gen}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Family Roles */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Family Roles</Label>
        <div className="flex flex-wrap gap-1">
          {defaultFamilyRoles.map(role => (
            <Badge
              key={role}
              variant={formData.family_roles?.includes(role) ? 'default' : 'outline'}
              className={`cursor-pointer text-xs ${formData.family_roles?.includes(role) ? 'bg-rose-600' : 'bg-rose-50 text-rose-700'}`}
              onClick={() => {
                const current = formData.family_roles || [];
                setFormData({
                  ...formData,
                  family_roles: current.includes(role) 
                    ? current.filter(r => r !== role)
                    : [...current, role]
                });
              }}
            >
              {role}
            </Badge>
          ))}
        </div>
      </div>

      {/* Social Links - Flexible Add */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">Social Media</Label>
          <span className="text-xs text-gray-400">( ⭐ = show on engagement tracker )</span>
        </div>
        
        {/* Active social links */}
        <div className="space-y-2">
          {Object.entries(socialLinks).map(([key, value]) => {
            const isCustom = key.startsWith('custom_');
            const platform = defaultSocialPlatforms.find(p => p.key === key);
            const label = isCustom ? key.replace('custom_', '').replace(/_/g, ' ') : platform?.label || key;
            const Icon = platform?.icon;
            const isEngageEnabled = formData.social_engagement?.[key];
            
            return (
              <div key={key} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const current = formData.social_engagement || {};
                    setFormData({ 
                      ...formData, 
                      social_engagement: { 
                        ...current, 
                        [key]: !current[key] 
                      } 
                    });
                  }}
                  className={`p-1 rounded hover:bg-yellow-100 transition-colors`}
                  title={isEngageEnabled ? 'Tracking engagement - click to disable' : 'Click to track engagement'}
                >
                  <Star className={`w-4 h-4 ${isEngageEnabled ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                </button>
                <div className="w-20 flex items-center gap-1 text-xs text-gray-600">
                  {Icon && <Icon className="w-4 h-4" />}
                  <span className="capitalize truncate">{label}</span>
                </div>
                <Input
                  placeholder={`@username or URL`}
                  value={value || ''}
                  onChange={(e) => setFormData({ ...formData, social_links: { ...socialLinks, [key]: e.target.value } })}
                  className="h-8 text-xs flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                  onClick={() => handleRemoveSocial(key)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>

        {/* Add social button */}
        {!showSocialPicker ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => setShowSocialPicker(true)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Social
          </Button>
        ) : (
          <div className="p-3 border rounded-lg bg-gray-50 space-y-2">
            <div className="flex flex-wrap gap-1">
              {availablePlatforms.map(platform => (
                <Badge
                  key={platform.key}
                  variant="outline"
                  className="cursor-pointer text-xs hover:bg-purple-50"
                  onClick={() => handleAddSocial(platform.key)}
                >
                  {platform.label}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2 pt-2 border-t">
              <Input
                placeholder="Custom platform name"
                value={customSocialName}
                onChange={(e) => setCustomSocialName(e.target.value)}
                className="h-8 text-xs"
              />
              <Button
                type="button"
                size="sm"
                className="h-8"
                onClick={handleAddCustomSocial}
                disabled={!customSocialName.trim()}
              >
                Add
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => setShowSocialPicker(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}