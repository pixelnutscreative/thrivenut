import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, Swords, Gift, Users, Heart, Video, Moon, ShoppingBag, 
  MessageCircle, BookOpen, DollarSign, Calendar, Sparkles, Loader2
} from 'lucide-react';
import NotesWithHistory from './NotesWithHistory';
import SearchableContactSelect from '../tiktok/SearchableContactSelect';

// Organized roles by category
const roleCategories = {
  battle: {
    title: 'Battle & Competition',
    roles: {
      battle_sniper: { label: 'Battle Sniper', icon: Swords, color: 'bg-red-100 text-red-700', borderColor: 'border-red-300' },
    }
  },
  engagement: {
    title: 'Engagement Style',
    roles: {
      gifter: { label: 'Gifter', icon: Gift, color: 'bg-amber-100 text-amber-700', borderColor: 'border-amber-300' },
      tapper: { label: 'Tapper', icon: Heart, color: 'bg-pink-100 text-pink-700', borderColor: 'border-pink-300' },
      authentic_commenter: { label: 'Commenter', icon: MessageCircle, color: 'bg-teal-100 text-teal-700', borderColor: 'border-teal-300' },
      sharer: { label: 'Story Sharer', icon: BookOpen, color: 'bg-blue-100 text-blue-700', borderColor: 'border-blue-300' },
      engaging_bestie: { label: 'Engaging Bestie', icon: Users, color: 'bg-purple-100 text-purple-700', borderColor: 'border-purple-300' },
    }
  },
  creator: {
    title: 'Creator & Business',
    roles: {
      creator_to_watch: { label: 'Creator to Watch', icon: Video, color: 'bg-indigo-100 text-indigo-700', borderColor: 'border-indigo-300' },
      tiktok_shop_affiliate: { label: 'Shop Affiliate', icon: ShoppingBag, color: 'bg-lime-100 text-lime-700', borderColor: 'border-lime-300' },
      tiktok_seller: { label: 'TikTok Seller', icon: DollarSign, color: 'bg-orange-100 text-orange-700', borderColor: 'border-orange-300' },
      sleep_lives: { label: 'Sleep Lives', icon: Moon, color: 'bg-slate-100 text-slate-700', borderColor: 'border-slate-300' },
    }
  }
};

// Text-based roles (relationship)
const textRoles = {
  subscriber: { label: 'Subscriber', text: 'Sub', color: 'bg-cyan-100 text-cyan-700', borderColor: 'border-cyan-300' },
  superfan: { label: 'Superfan', text: 'Superfan', color: 'bg-rose-100 text-rose-700', borderColor: 'border-rose-300' },
  irl_friend: { label: 'Friend IRL', text: 'IRL', color: 'bg-green-100 text-green-700', borderColor: 'border-green-300' },
  discord: { label: 'Discord', text: 'Discord', color: 'bg-violet-100 text-violet-700', borderColor: 'border-violet-300' }
};

// Flatten all roles for backwards compatibility
const allIconRoles = Object.values(roleCategories).reduce((acc, cat) => ({ ...acc, ...cat.roles }), {});
const roleConfig = { ...allIconRoles, ...textRoles };

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const defaultLiveStreamTypes = [
  'Teaching', 'Engagement', 'Entertainment', 'Gaming', 'Music', 
  'Cooking', 'DIY/Crafts', 'Storytime', 'Co-host', 'Battle', 
  'Q&A', 'Unboxing', 'Fitness', 'ASMR', 'Talk Show', 'Religious'
];

export default function TikTokTabContent({ 
  formData, 
  setFormData, 
  contacts, 
  categories, 
  savedCustomRoles,
  onSaveCustomRole,
  onCreateAndLink,
  isCreatingLink,
  editingContactId
}) {
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [newOtherTikTok, setNewOtherTikTok] = useState('');
  const [newModForName, setNewModForName] = useState('');
  const [newTheirModName, setNewTheirModName] = useState('');

  const toggleRole = (role) => {
    setFormData(prev => ({
      ...prev,
      role: prev.role?.includes(role)
        ? prev.role.filter(r => r !== role)
        : [...(prev.role || []), role]
    }));
  };

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      engagement_days: prev.engagement_days?.includes(day)
        ? prev.engagement_days.filter(d => d !== day)
        : [...(prev.engagement_days || []), day]
    }));
  };

  const handleAddNote = (note) => {
    setFormData(prev => ({
      ...prev,
      tiktok_notes: [...(prev.tiktok_notes || []), note]
    }));
  };

  return (
    <div className="space-y-4">
      {/* Feature Toggles */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-sm mb-2">Enable Features</h4>
        <div className="grid grid-cols-3 gap-2">
          <div
            onClick={() => setFormData({ ...formData, engagement_enabled: !formData.engagement_enabled })}
            className="flex items-center gap-1 p-2 border rounded-lg cursor-pointer hover:bg-white text-xs"
          >
            <Checkbox checked={formData.engagement_enabled} />
            <Sparkles className="w-3 h-3 text-purple-500" />
            <span className="text-gray-700 font-medium">Engage</span>
          </div>
          <div
            onClick={() => setFormData({ ...formData, calendar_enabled: !formData.calendar_enabled })}
            className="flex items-center gap-1 p-2 border rounded-lg cursor-pointer hover:bg-white text-xs"
          >
            <Checkbox checked={formData.calendar_enabled} />
            <Calendar className="w-3 h-3 text-blue-500" />
          </div>
          <div
            onClick={() => setFormData({ ...formData, is_gifter: !formData.is_gifter })}
            className="flex items-center gap-1 p-2 border rounded-lg cursor-pointer hover:bg-white text-xs"
          >
            <Checkbox checked={formData.is_gifter} />
            <Gift className="w-3 h-3 text-amber-500" />
            <span className="text-gray-700 font-medium">GG</span>
          </div>
        </div>
      </div>

      {/* TikTok Identity */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Username</Label>
          <Input
            placeholder="@username"
            value={formData.username || ''}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Display Name</Label>
          <Input
            placeholder="TikTok display name"
            value={formData.display_name || ''}
            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Phonetic</Label>
          <Input
            placeholder="For songs"
            value={formData.phonetic || ''}
            onChange={(e) => setFormData({ ...formData, phonetic: e.target.value })}
          />
        </div>
      </div>

      {/* Roles */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Roles</Label>
        
        {/* Categorized Icon Roles */}
        {Object.entries(roleCategories).map(([catKey, category]) => (
          <div key={catKey} className="space-y-1.5">
            <span className="text-xs text-gray-500 font-medium">{category.title}</span>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(category.roles).map(([key, config]) => {
                const Icon = config.icon;
                const isActive = formData.role?.includes(key);
                return (
                  <div
                    key={key}
                    onClick={() => toggleRole(key)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border-2 cursor-pointer text-xs transition-all ${
                      isActive
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300 bg-white'
                    }`}
                  >
                    <Checkbox checked={isActive} className="h-3 w-3" />
                    <Icon className="w-3.5 h-3.5" />
                    <span className={isActive ? 'text-purple-700 font-medium' : 'text-gray-600'}>{config.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Relationship Roles */}
        <div className="space-y-1.5">
          <span className="text-xs text-gray-500 font-medium">Relationship</span>
          <div className="flex flex-wrap gap-1">
            {Object.entries(textRoles).map(([key, config]) => (
              <Badge
                key={key}
                variant={formData.role?.includes(key) ? 'default' : 'outline'}
                className={`cursor-pointer text-xs ${formData.role?.includes(key) ? 'bg-purple-600' : config.color}`}
                onClick={() => toggleRole(key)}
              >
                {config.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Custom Roles */}
        <div className="space-y-1.5">
          <span className="text-xs text-gray-500 font-medium">Custom Roles</span>
          <div className="flex flex-wrap gap-1">
            {savedCustomRoles?.map(role => {
              const customRole = `custom:${role}`;
              return (
                <Badge
                  key={role}
                  variant={formData.role?.includes(customRole) ? 'default' : 'outline'}
                  className={`cursor-pointer text-xs ${formData.role?.includes(customRole) ? 'bg-teal-600' : 'bg-teal-50 text-teal-700'}`}
                  onClick={() => toggleRole(customRole)}
                >
                  {role}
                </Badge>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add custom role..."
              value={customRoleInput}
              onChange={(e) => setCustomRoleInput(e.target.value)}
              className="h-8 text-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customRoleInput.trim()) {
                  const customRole = `custom:${customRoleInput.trim()}`;
                  if (!formData.role?.includes(customRole)) {
                    setFormData({ ...formData, role: [...(formData.role || []), customRole] });
                  }
                  onSaveCustomRole?.(customRoleInput.trim());
                  setCustomRoleInput('');
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8"
              onClick={() => {
                if (customRoleInput.trim()) {
                  const customRole = `custom:${customRoleInput.trim()}`;
                  if (!formData.role?.includes(customRole)) {
                    setFormData({ ...formData, role: [...(formData.role || []), customRole] });
                  }
                  onSaveCustomRole?.(customRoleInput.trim());
                  setCustomRoleInput('');
                }
              }}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Engagement Settings */}
      {formData.engagement_enabled && (
        <div className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400 space-y-3">
          <h4 className="font-semibold text-sm text-purple-800">Engagement Settings</h4>
          <Select 
            value={formData.engagement_frequency || 'multiple_per_week'} 
            onValueChange={(v) => setFormData({ ...formData, engagement_frequency: v })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="multiple_per_week">Specific Days</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>

          {formData.engagement_frequency === 'multiple_per_week' && (
            <div className="flex flex-wrap gap-1">
              {daysOfWeek.map(day => (
                <Badge
                  key={day}
                  variant={formData.engagement_days?.includes(day) ? 'default' : 'outline'}
                  className="cursor-pointer text-xs"
                  onClick={() => toggleDay(day)}
                >
                  {day.slice(0, 3)}
                </Badge>
              ))}
            </div>
          )}

          {formData.engagement_frequency === 'monthly' && (
            <Select 
              value={String(formData.engagement_day_of_month || 1)} 
              onValueChange={(v) => setFormData({ ...formData, engagement_day_of_month: parseInt(v) })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <SelectItem key={day} value={String(day)}>
                    {day === 1 ? '1st' : day === 2 ? '2nd' : day === 3 ? '3rd' : `${day}th`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      {/* Mods Section */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">Mods For</Label>
          <SearchableContactSelect
            contacts={contacts?.filter(c => c.id !== editingContactId && !formData.mods_for?.includes(c.id)) || []}
            value=""
            onChange={(v) => {
              if (v && !formData.mods_for?.includes(v)) {
                setFormData({ ...formData, mods_for: [...(formData.mods_for || []), v] });
              }
            }}
            placeholder="Search..."
          />
          <div className="flex flex-wrap gap-1">
            {formData.mods_for?.map(id => {
              const contact = contacts?.find(c => c.id === id);
              return contact ? (
                <Badge key={id} variant="secondary" className="cursor-pointer text-xs" onClick={() => setFormData({ ...formData, mods_for: formData.mods_for.filter(m => m !== id) })}>
                  @{contact.username} ✕
                </Badge>
              ) : null;
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Their Mods</Label>
          <SearchableContactSelect
            contacts={contacts?.filter(c => c.id !== editingContactId && !formData.their_mods?.includes(c.id)) || []}
            value=""
            onChange={(v) => {
              if (v && !formData.their_mods?.includes(v)) {
                setFormData({ ...formData, their_mods: [...(formData.their_mods || []), v] });
              }
            }}
            placeholder="Search..."
          />
          <div className="flex flex-wrap gap-1">
            {formData.their_mods?.map(id => {
              const contact = contacts?.find(c => c.id === id);
              return contact ? (
                <Badge key={id} variant="secondary" className="cursor-pointer text-xs" onClick={() => setFormData({ ...formData, their_mods: formData.their_mods.filter(m => m !== id) })}>
                  @{contact.username} ✕
                </Badge>
              ) : null;
            })}
          </div>
        </div>
      </div>

      {/* Other TikTok Accounts */}
      <div className="space-y-2">
        <Label className="text-xs">Other TikTok Accounts</Label>
        <div className="flex gap-2">
          <Input
            placeholder="@otheraccount"
            value={newOtherTikTok}
            onChange={(e) => setNewOtherTikTok(e.target.value)}
            className="h-8"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newOtherTikTok.trim()) {
                const cleaned = newOtherTikTok.replace('@', '').trim();
                if (!formData.other_tiktok_accounts?.includes(cleaned)) {
                  setFormData({ ...formData, other_tiktok_accounts: [...(formData.other_tiktok_accounts || []), cleaned] });
                }
                setNewOtherTikTok('');
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => {
              if (newOtherTikTok.trim()) {
                const cleaned = newOtherTikTok.replace('@', '').trim();
                if (!formData.other_tiktok_accounts?.includes(cleaned)) {
                  setFormData({ ...formData, other_tiktok_accounts: [...(formData.other_tiktok_accounts || []), cleaned] });
                }
                setNewOtherTikTok('');
              }
            }}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-1">
          {formData.other_tiktok_accounts?.map((acc, idx) => (
            <Badge
              key={idx}
              variant="secondary"
              className="cursor-pointer text-xs bg-pink-100 text-pink-700"
              onClick={() => setFormData({ ...formData, other_tiktok_accounts: formData.other_tiktok_accounts.filter((_, i) => i !== idx) })}
            >
              @{acc} ✕
            </Badge>
          ))}
        </div>
      </div>

      {/* Live Stream Types */}
      <div className="space-y-2">
        <Label className="text-xs">Live Stream Types</Label>
        <div className="flex flex-wrap gap-1">
          {defaultLiveStreamTypes.map(type => (
            <Badge
              key={type}
              variant={formData.live_stream_types?.includes(type) ? 'default' : 'outline'}
              className={`cursor-pointer text-xs ${formData.live_stream_types?.includes(type) ? 'bg-violet-600' : 'bg-violet-50 text-violet-700'}`}
              onClick={() => {
                const current = formData.live_stream_types || [];
                setFormData({
                  ...formData,
                  live_stream_types: current.includes(type) 
                    ? current.filter(t => t !== type)
                    : [...current, type]
                });
              }}
            >
              {type}
            </Badge>
          ))}
        </div>
      </div>

      {/* Agencies */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Live Agency</Label>
          <Input
            placeholder="Agency name"
            value={formData.live_agency || ''}
            onChange={(e) => setFormData({ ...formData, live_agency: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Shop Agency</Label>
          <Input
            placeholder="Shop agency"
            value={formData.shop_agency || ''}
            onChange={(e) => setFormData({ ...formData, shop_agency: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Started Going Live</Label>
        <Input
          placeholder="e.g., Summer 2023"
          value={formData.started_going_live || ''}
          onChange={(e) => setFormData({ ...formData, started_going_live: e.target.value })}
        />
      </div>

      {/* TikTok Notes */}
      <NotesWithHistory
        notes={formData.tiktok_notes || []}
        onAddNote={handleAddNote}
        label="TikTok Notes"
      />
    </div>
  );
}