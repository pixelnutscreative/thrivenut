import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Plus, Gift, Users, Heart, Video, Moon, ShoppingBag, 
  MessageCircle, BookOpen, DollarSign, Calendar, Sparkles, 
  Pencil, Flame, Zap, Award, X, Search
} from 'lucide-react';
import SearchableContactSelect from '../tiktok/SearchableContactSelect';

// Battle inventory icons
const battleInventoryItems = [
  { key: 'boxing_gloves', label: 'Gloves', icon: '🥊' },
  { key: 'lightning_bolts', label: 'Bolts', icon: '⚡' },
  { key: 'mist_clouds', label: 'Mist', icon: '🌫️' },
  { key: 'hammers', label: 'Hammers', icon: '🔨' },
  { key: 'timers', label: 'Timers', icon: '⏱️' },
];

// All roles organized in three columns
const battleRoles = {
  loves_to_battle: { label: 'Loves to Battle', icon: Award, color: 'bg-red-100 text-red-700' },
  battle_sniper: { label: 'Battle Sniper', icon: Flame, color: 'bg-orange-100 text-orange-700' },
};

const engagementRoles = {
  gifter: { label: 'Gifts', icon: Gift, color: 'bg-amber-100 text-amber-700' },
  tapper: { label: 'Taps', icon: Heart, color: 'bg-pink-100 text-pink-700' },
  authentic_commenter: { label: 'Comments', icon: MessageCircle, color: 'bg-teal-100 text-teal-700' },
  sharer: { label: 'Shares to Story', icon: BookOpen, color: 'bg-blue-100 text-blue-700' },
  hype_person: { label: 'Hype Person', icon: Zap, color: 'bg-yellow-100 text-yellow-700' },
};

const creatorRoles = {
  creator_to_watch: { label: 'Creator to Watch', icon: Video, color: 'bg-indigo-100 text-indigo-700' },
  tiktok_shop_affiliate: { label: 'Shop Affiliate', icon: ShoppingBag, color: 'bg-lime-100 text-lime-700' },
  tiktok_seller: { label: 'TikTok Seller', icon: DollarSign, color: 'bg-orange-100 text-orange-700' },
  sleep_lives: { label: 'Sleep Lives', icon: Moon, color: 'bg-slate-100 text-slate-700' },
};

// Relationship roles
const relationshipRoles = {
  subscriber: { label: 'Subscriber', color: 'bg-cyan-100 text-cyan-700' },
  superfan: { label: 'Superfan', color: 'bg-rose-100 text-rose-700' },
  irl_friend: { label: 'Friend IRL', color: 'bg-green-100 text-green-700' },
  discord: { label: 'Discord', color: 'bg-violet-100 text-violet-700' }
};

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
  editingContactId
}) {
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [showEngagementSettings, setShowEngagementSettings] = useState(false);
  const [newAccountUsername, setNewAccountUsername] = useState('');
  const [newAccountDisplay, setNewAccountDisplay] = useState('');
  const [newAccountPhonetic, setNewAccountPhonetic] = useState('');

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

  const updateBattleInventory = (key, value) => {
    setFormData(prev => ({
      ...prev,
      battle_inventory: {
        ...(prev.battle_inventory || {}),
        [key]: Math.max(0, parseInt(value) || 0)
      }
    }));
  };

  const addOtherAccount = () => {
    if (newAccountUsername.trim()) {
      const newAccount = {
        username: newAccountUsername.replace('@', '').trim(),
        display_name: newAccountDisplay.trim(),
        phonetic: newAccountPhonetic.trim()
      };
      setFormData({ 
        ...formData, 
        other_tiktok_accounts: [...(formData.other_tiktok_accounts || []), newAccount] 
      });
      setNewAccountUsername('');
      setNewAccountDisplay('');
      setNewAccountPhonetic('');
    }
  };

  const removeOtherAccount = (index) => {
    const updated = [...(formData.other_tiktok_accounts || [])];
    updated.splice(index, 1);
    setFormData({ ...formData, other_tiktok_accounts: updated });
  };

  // Render a role button
  const RoleButton = ({ roleKey, config, small = false }) => {
    const Icon = config.icon;
    const isActive = formData.role?.includes(roleKey);
    return (
      <div
        onClick={() => toggleRole(roleKey)}
        className={`flex items-center gap-1 px-2 py-1 rounded-lg border cursor-pointer text-xs transition-all ${
          isActive
            ? 'border-purple-500 bg-purple-50 text-purple-700'
            : 'border-gray-200 hover:border-purple-300 bg-white text-gray-600'
        }`}
      >
        <Checkbox checked={isActive} className="h-3 w-3" />
        {Icon && <Icon className="w-3 h-3" />}
        <span className={`${small ? 'text-[10px]' : 'text-xs'} ${isActive ? 'font-medium' : ''}`}>{config.label}</span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Feature Toggles */}
      <div className="p-3 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-sm mb-2">Enable Features</h4>
        <div className="grid grid-cols-3 gap-2">
          {/* Engage with inline edit */}
          <div
            className={`flex items-center justify-between p-2 border rounded-lg cursor-pointer hover:bg-white text-xs ${formData.engagement_enabled ? 'border-purple-300 bg-purple-50' : ''}`}
          >
            <div 
              className="flex items-center gap-1 flex-1"
              onClick={() => setFormData({ ...formData, engagement_enabled: !formData.engagement_enabled })}
            >
              <Checkbox checked={formData.engagement_enabled} />
              <Sparkles className="w-3 h-3 text-purple-500" />
              <span className="text-gray-700 font-medium">Engage</span>
            </div>
            {formData.engagement_enabled && (
              <Popover open={showEngagementSettings} onOpenChange={setShowEngagementSettings}>
                <PopoverTrigger asChild>
                  <button className="p-1 hover:bg-purple-100 rounded" onClick={(e) => e.stopPropagation()}>
                    <Pencil className="w-3 h-3 text-purple-500" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3">
                  <div className="space-y-3">
                    <h5 className="font-semibold text-sm text-purple-800">Engagement Frequency</h5>
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
                </PopoverContent>
              </Popover>
            )}
          </div>
          
          <div
            onClick={() => setFormData({ ...formData, calendar_enabled: !formData.calendar_enabled })}
            className={`flex items-center gap-1 p-2 border rounded-lg cursor-pointer hover:bg-white text-xs ${formData.calendar_enabled ? 'border-blue-300 bg-blue-50' : ''}`}
          >
            <Checkbox checked={formData.calendar_enabled} />
            <Calendar className="w-3 h-3 text-blue-500" />
            <span className="text-gray-700 font-medium text-[10px]">+ Creator Cal</span>
          </div>
          
          <div
            onClick={() => setFormData({ ...formData, is_gifter: !formData.is_gifter })}
            className={`flex items-center gap-1 p-2 border rounded-lg cursor-pointer hover:bg-white text-xs ${formData.is_gifter ? 'border-amber-300 bg-amber-50' : ''}`}
          >
            <Checkbox checked={formData.is_gifter} />
            <Gift className="w-3 h-3 text-amber-500" />
            <span className="text-gray-700 font-medium text-[10px]">Top Gifter</span>
          </div>
        </div>
      </div>

      {/* Primary TikTok Account */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Username</Label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
            <Input
              placeholder="username"
              value={(formData.username || '')}
              onChange={(e) => setFormData({ ...formData, username: e.target.value.replace('@', '').trim() })}
              className="pl-5"
            />
          </div>
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

      {/* Other TikTok Accounts */}
      <div className="space-y-2">
        <Label className="text-xs text-gray-500">Other TikTok Accounts</Label>
        
        {/* Existing other accounts */}
        {formData.other_tiktok_accounts?.map((acc, idx) => {
          // Handle both old string format and new object format
          const account = typeof acc === 'string' ? { username: acc, display_name: '', phonetic: '' } : acc;
          return (
            <div key={idx} className="grid grid-cols-3 gap-2 items-end">
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                <Input
                  value={account.username}
                  onChange={(e) => {
                    const updated = [...(formData.other_tiktok_accounts || [])];
                    updated[idx] = { ...account, username: e.target.value.replace('@', '') };
                    setFormData({ ...formData, other_tiktok_accounts: updated });
                  }}
                  className="pl-5 h-8 text-xs"
                />
              </div>
              <Input
                placeholder="Display name"
                value={account.display_name || ''}
                onChange={(e) => {
                  const updated = [...(formData.other_tiktok_accounts || [])];
                  updated[idx] = { ...account, display_name: e.target.value };
                  setFormData({ ...formData, other_tiktok_accounts: updated });
                }}
                className="h-8 text-xs"
              />
              <div className="flex gap-1">
                <Input
                  placeholder="Phonetic"
                  value={account.phonetic || ''}
                  onChange={(e) => {
                    const updated = [...(formData.other_tiktok_accounts || [])];
                    updated[idx] = { ...account, phonetic: e.target.value };
                    setFormData({ ...formData, other_tiktok_accounts: updated });
                  }}
                  className="h-8 text-xs flex-1"
                />
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => removeOtherAccount(idx)}>
                  <X className="w-3 h-3 text-gray-400" />
                </Button>
              </div>
            </div>
          );
        })}
        
        {/* Add new account row */}
        <div className="grid grid-cols-3 gap-2 items-end">
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
            <Input
              placeholder="username"
              value={newAccountUsername}
              onChange={(e) => setNewAccountUsername(e.target.value.replace('@', ''))}
              className="pl-5 h-8 text-xs"
            />
          </div>
          <Input
            placeholder="Display name"
            value={newAccountDisplay}
            onChange={(e) => setNewAccountDisplay(e.target.value)}
            className="h-8 text-xs"
          />
          <div className="flex gap-1">
            <Input
              placeholder="Phonetic"
              value={newAccountPhonetic}
              onChange={(e) => setNewAccountPhonetic(e.target.value)}
              className="h-8 text-xs flex-1"
            />
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={addOtherAccount}
              disabled={!newAccountUsername.trim()}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* How did you find them? */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
        <Label className="text-xs font-semibold text-blue-800">How did you find them?</Label>
        <div className="flex gap-2 items-center">
          <div
            onClick={() => setFormData({ ...formData, found_on_fyp: !formData.found_on_fyp, met_through_id: formData.found_on_fyp ? formData.met_through_id : null })}
            className={`flex items-center gap-1 px-3 py-1.5 border rounded-lg cursor-pointer text-xs ${formData.found_on_fyp ? 'border-blue-500 bg-blue-100 text-blue-700' : 'border-gray-200 bg-white'}`}
          >
            <Checkbox checked={formData.found_on_fyp} className="h-3 w-3" />
            <span>Found on FYP</span>
          </div>
          <span className="text-gray-400 text-xs">or</span>
          <div className="flex-1">
            <SearchableContactSelect
              contacts={contacts?.filter(c => c.id !== editingContactId) || []}
              value={formData.met_through_id || ''}
              onChange={(v) => setFormData({ ...formData, met_through_id: v, found_on_fyp: false })}
              placeholder="Through a contact..."
              disabled={formData.found_on_fyp}
            />
          </div>
        </div>
        {formData.met_through_id && (
          <p className="text-xs text-blue-600">
            Found through: @{contacts?.find(c => c.id === formData.met_through_id)?.username || 'Unknown'}
          </p>
        )}
      </div>

      {/* TikTok Notes - Simple single field */}
      <div className="space-y-1">
        <Label className="text-xs">TikTok Notes</Label>
        <Textarea
          placeholder="Add notes about this person's TikTok presence..."
          value={formData.tiktok_notes_text || ''}
          onChange={(e) => setFormData({ ...formData, tiktok_notes_text: e.target.value })}
          rows={2}
          className="text-sm"
        />
      </div>

      {/* Relationship Roles */}
      <div className="space-y-2">
        <Label className="text-xs text-gray-500 font-medium">Relationship</Label>
        <div className="flex flex-wrap gap-1">
          {Object.entries(relationshipRoles).map(([key, config]) => (
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

      {/* Three Column Roles: Battle | Engagement | Creator */}
      <div className="grid grid-cols-3 gap-3">
        {/* Battle Column */}
        <div className="space-y-2">
          <Label className="text-xs text-gray-500 font-medium">Battle</Label>
          <div className="space-y-1">
            {Object.entries(battleRoles).map(([key, config]) => (
              <RoleButton key={key} roleKey={key} config={config} small />
            ))}
          </div>
          
          {/* Battle Inventory */}
          {(formData.role?.includes('loves_to_battle') || formData.role?.includes('battle_sniper')) && (
            <div className="p-2 bg-red-50 rounded border border-red-200 space-y-1">
              <span className="text-[10px] font-semibold text-red-700">Inventory</span>
              <div className="grid grid-cols-5 gap-1">
                {battleInventoryItems.map(item => (
                  <div key={item.key} className="text-center">
                    <span className="text-sm">{item.icon}</span>
                    <Input
                      type="number"
                      min="0"
                      value={formData.battle_inventory?.[item.key] || 0}
                      onChange={(e) => updateBattleInventory(item.key, e.target.value)}
                      className="h-6 text-[10px] text-center p-0"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Engagement Column */}
        <div className="space-y-2">
          <Label className="text-xs text-gray-500 font-medium">Engagement</Label>
          <div className="space-y-1">
            {Object.entries(engagementRoles).map(([key, config]) => (
              <RoleButton key={key} roleKey={key} config={config} small />
            ))}
          </div>
        </div>

        {/* Creator Column */}
        <div className="space-y-2">
          <Label className="text-xs text-gray-500 font-medium">Creator</Label>
          <div className="space-y-1">
            {Object.entries(creatorRoles).map(([key, config]) => (
              <RoleButton key={key} roleKey={key} config={config} small />
            ))}
          </div>
        </div>
      </div>

      {/* Custom Roles */}
      <div className="space-y-2">
        <Label className="text-xs text-gray-500 font-medium">Custom Roles</Label>
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

      {/* Mods Section - Clearer labels */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
          <Label className="text-xs font-semibold text-indigo-800">They mod for...</Label>
          <p className="text-[10px] text-indigo-600">Who does this person moderate for?</p>
          <SearchableContactSelect
            contacts={contacts?.filter(c => c.id !== editingContactId && !formData.mods_for?.includes(c.id)) || []}
            value=""
            onChange={(v) => {
              if (v && !formData.mods_for?.includes(v)) {
                setFormData({ ...formData, mods_for: [...(formData.mods_for || []), v] });
              }
            }}
            placeholder="Search contacts..."
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

        <div className="space-y-2 p-3 bg-pink-50 rounded-lg border border-pink-200">
          <Label className="text-xs font-semibold text-pink-800">Their mods are...</Label>
          <p className="text-[10px] text-pink-600">Who moderates for this person?</p>
          <SearchableContactSelect
            contacts={contacts?.filter(c => c.id !== editingContactId && !formData.their_mods?.includes(c.id)) || []}
            value=""
            onChange={(v) => {
              if (v && !formData.their_mods?.includes(v)) {
                setFormData({ ...formData, their_mods: [...(formData.their_mods || []), v] });
              }
            }}
            placeholder="Search contacts..."
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
    </div>
  );
}