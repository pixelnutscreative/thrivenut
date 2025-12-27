import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Plus, Gift, Users, Heart, Video, Moon, ShoppingBag, 
  MessageCircle, BookOpen, DollarSign, Calendar, Sparkles, 
  Pencil, Flame, Zap, Award, X, ChevronDown, ChevronRight, Sticker, Trash2, Building2, Lightbulb
} from 'lucide-react';
import QuickAddContactSelect from './QuickAddContactSelect';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, parseISO, isAfter } from 'date-fns';

// Battle inventory icons
const battleInventoryItems = [
  { key: 'boxing_gloves', label: 'Gloves', icon: '🥊' },
  { key: 'lightning_bolts', label: 'Bolts', icon: '⚡' },
  { key: 'mist_clouds', label: 'Mist', icon: '🌫️' },
  { key: 'hammers', label: 'Hammers', icon: '🔨' },
  { key: 'timers', label: 'Timers', icon: '⏱️' },
];

// Engagement roles
const engagementRoles = {
  gifter: { label: 'Gifts', icon: Gift, color: 'bg-amber-100 text-amber-700' },
  tapper: { label: 'Taps', icon: Heart, color: 'bg-pink-100 text-pink-700' },
  live_commenter: { label: 'Comments (LIVE)', icon: MessageCircle, color: 'bg-teal-100 text-teal-700' },
  post_commenter: { label: 'Comments (Posts)', icon: MessageCircle, color: 'bg-cyan-100 text-cyan-700' },
  fan_stickers: { label: 'Fan Stickers', icon: Sticker, color: 'bg-fuchsia-100 text-fuchsia-700' },
  sharer: { label: 'Shares to Story', icon: BookOpen, color: 'bg-blue-100 text-blue-700' },
  hype_person: { label: 'Hype Person', icon: Zap, color: 'bg-yellow-100 text-yellow-700' },
};

const creatorRoles = {
  creator_to_watch: { label: 'Creator to Watch', icon: Video, color: 'bg-indigo-100 text-indigo-700' },
  tiktok_shop_affiliate: { label: 'TT Shop Affiliate', icon: ShoppingBag, color: 'bg-lime-100 text-lime-700' },
  tiktok_seller: { label: 'TikTok Seller', icon: DollarSign, color: 'bg-orange-100 text-orange-700' },
  sleep_lives: { label: 'Sleep Lives', icon: Moon, color: 'bg-slate-100 text-slate-700' },
};

// Battle roles
const battleRoles = {
  loves_to_battle: { label: 'Loves to Battle', icon: Award, color: 'bg-red-100 text-red-700' },
  battle_sniper: { label: 'Battle Sniper', icon: Flame, color: 'bg-orange-100 text-orange-700' },
};

// Relationship roles (stacked in battle section) - removed irl_friend since it's in header now
const relationshipRoles = {
  subscriber: { label: 'Subscriber', color: 'bg-cyan-100 text-cyan-700' },
  superfan: { label: 'Superfan', color: 'bg-rose-100 text-rose-700' },
  discord: { label: 'Discord', color: 'bg-violet-100 text-violet-700' }
};

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Default live stream types (alphabetical)
const defaultLiveTypes = [
  'ASMR', 'Battle', 'Chat', 'Co-Host', 'Cooking', 'DIY/Crafts', 
  'Engagement', 'Fitness', 'Gaming', 'Multi-Guest', 'Music', 
  'Q&A', 'Religious', 'Sleep', 'Storytime', 'Talk Show', 'Teaching', 'Unboxing'
];

function ContactInventoryDisplay({ contactId }) {
  const { data: activePowerUps = [] } = useQuery({
    queryKey: ['battlePowerUps', contactId],
    queryFn: async () => {
      if (!contactId) return [];
      const items = await base44.entities.BattlePowerUp.filter({ contact_id: contactId });
      return items.filter(item => {
        if (item.is_used) return false;
        const expires = addDays(parseISO(item.acquired_date), 5);
        return isAfter(expires, new Date());
      });
    },
    enabled: !!contactId
  });

  const summary = activePowerUps.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = 0;
    acc[item.type] += item.quantity;
    return acc;
  }, {});

  if (activePowerUps.length === 0) {
    return <div className="text-center text-xs text-red-400 py-1">No active items</div>;
  }

  const icons = {
    'Glove': '🥊',
    'Mist': '🌫️',
    'Sniper': '🎯',
    'Jet': '✈️',
    'Sub': '🌊',
    'Other': '❓'
  };

  return (
    <div className="grid grid-cols-3 gap-1">
      {Object.entries(summary).map(([type, count]) => (
        <div key={type} className="text-center bg-white/50 rounded p-1">
          <span className="text-xs mr-1">{icons[type] || '❓'}</span>
          <span className="text-xs font-bold">{count}</span>
        </div>
      ))}
    </div>
  );
}

function QuickInventoryAdd({ contactId, contactName }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState('Glove');
  const [qty, setQty] = useState(1);

  const addMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.BattlePowerUp.create({
        contact_id: contactId,
        contact_name: contactName,
        type,
        quantity: qty,
        acquired_date: format(new Date(), 'yyyy-MM-dd'),
        expires_date: format(addDays(new Date(), 5), 'yyyy-MM-dd')
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['battlePowerUps'] });
      setIsOpen(false);
      setQty(1);
    }
  });

  if (!contactId) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="h-5 text-[10px] px-2 bg-white border-red-200 text-red-600 hover:bg-red-50">
          <Plus className="w-3 h-3 mr-1" /> Add
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2">
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-700">Add Power-Up</h4>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Glove">🥊 Glove</SelectItem>
              <SelectItem value="Mist">🌫️ Mist</SelectItem>
              <SelectItem value="Sniper">🎯 Sniper</SelectItem>
              <SelectItem value="Jet">✈️ Jet</SelectItem>
              <SelectItem value="Sub">🌊 Sub</SelectItem>
            </SelectContent>
          </Select>
          <Input 
            type="number" 
            min="1" 
            value={qty} 
            onChange={(e) => setQty(parseInt(e.target.value) || 1)}
            className="h-7 text-xs" 
          />
          <Button 
            size="sm" 
            className="w-full h-7 text-xs bg-red-600 hover:bg-red-700"
            onClick={() => addMutation.mutate()}
            disabled={addMutation.isPending}
          >
            {addMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function TikTokTabContent({ 
  formData, 
  setFormData, 
  contacts, 
  categories, 
  savedCustomRoles,
  onSaveCustomRole,
  editingContactId,
  onQuickAddContact,
  isProfile = false
}) {
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [showCustomRoleInput, setShowCustomRoleInput] = useState(false);
  const [showEngagementSettings, setShowEngagementSettings] = useState(false);
  const [newAccountUsername, setNewAccountUsername] = useState('');
  const [newAccountDisplay, setNewAccountDisplay] = useState('');
  const [newAccountPhonetic, setNewAccountPhonetic] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [customLiveType, setCustomLiveType] = useState('');

  // Fetch master database for lookups
  const { data: allMasterContacts = [] } = useQuery({
    queryKey: ['masterTikTokContacts'],
    queryFn: () => base44.entities.TikTokContact.list('username', 5000),
    staleTime: 5 * 60 * 1000,
  });

  const { data: activePowerUps = [] } = useQuery({
    queryKey: ['battlePowerUps', editingContactId],
    queryFn: async () => {
      if (!editingContactId) return [];
      const items = await base44.entities.BattlePowerUp.filter({ contact_id: editingContactId });
      // Client-side filter for expiration
      return items.filter(item => {
        if (item.is_used) return false;
        const expires = addDays(parseISO(item.acquired_date), 5);
        return isAfter(expires, new Date());
      });
    },
    enabled: !!editingContactId
  });

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

  const toggleLiveStreamType = (type) => {
    const current = formData.live_stream_types || [];
    setFormData({
      ...formData,
      live_stream_types: current.includes(type) 
        ? current.filter(t => t !== type)
        : [...current, type]
    });
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
      {/* Feature Toggles - Purple themed (Hidden on Profile) */}
      {!isProfile && (
        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
          <h4 className="font-semibold text-sm mb-2 text-purple-800">Enable Features</h4>
          <div className="grid grid-cols-3 gap-2">
            {/* Engage with inline edit */}
            <div
              className={`flex items-center justify-between p-2 border rounded-lg cursor-pointer hover:bg-white text-xs ${formData.engagement_enabled ? 'border-purple-400 bg-purple-100' : 'border-purple-200 bg-white'}`}
            >
              <div 
                className="flex items-center gap-1 flex-1"
                onClick={() => setFormData({ ...formData, engagement_enabled: !formData.engagement_enabled })}
              >
                <Checkbox checked={formData.engagement_enabled} />
                <Sparkles className="w-3 h-3 text-purple-500" />
                <span className="text-purple-700 font-medium">Engage</span>
              </div>
              {formData.engagement_enabled && (
                <Popover open={showEngagementSettings} onOpenChange={setShowEngagementSettings}>
                  <PopoverTrigger asChild>
                    <button className="p-1 hover:bg-purple-200 rounded" onClick={(e) => e.stopPropagation()}>
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
              className={`flex items-center gap-1 p-2 border rounded-lg cursor-pointer hover:bg-white text-xs ${formData.calendar_enabled ? 'border-blue-400 bg-blue-100' : 'border-purple-200 bg-white'}`}
            >
              <Checkbox checked={formData.calendar_enabled} />
              <Calendar className="w-3 h-3 text-blue-500" />
              <span className="text-purple-700 font-medium text-[10px]">+ Creator Cal</span>
            </div>
            
            <div
              onClick={() => setFormData({ ...formData, is_gifter: !formData.is_gifter })}
              className={`flex items-center gap-1 p-2 border rounded-lg cursor-pointer hover:bg-white text-xs ${formData.is_gifter ? 'border-amber-400 bg-amber-100' : 'border-purple-200 bg-white'}`}
            >
              <Checkbox checked={formData.is_gifter} />
              <Gift className="w-3 h-3 text-amber-500" />
              <span className="text-purple-700 font-medium text-[10px]">Top Gifter</span>
            </div>
          </div>
        </div>
      )}



      {/* Primary TikTok Account - Blue themed */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-sm text-blue-800">TikTok Accounts</h4>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
            onClick={() => setShowAddAccount(true)}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Primary account row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-blue-700">Username</Label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
              <Input
                placeholder="username"
                value={(formData.username || '')}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.replace('@', '').trim() })}
                className="pl-6"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-blue-700">Display Name</Label>
            <Input
              placeholder="TikTok display name"
              value={formData.display_name || ''}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-blue-700">Phonetic</Label>
            <Input
              placeholder="For songs"
              value={formData.phonetic || ''}
              onChange={(e) => setFormData({ ...formData, phonetic: e.target.value })}
            />
          </div>
        </div>

        {/* Additional TikTok Accounts */}
        {(formData.other_tiktok_accounts?.length > 0 || showAddAccount) && (
          <div className="mt-3 space-y-3 pt-3 border-t border-blue-200">
            <Label className="text-xs font-semibold text-blue-800">Additional Accounts</Label>
            
            {formData.other_tiktok_accounts?.map((acc, idx) => {
              const account = typeof acc === 'string' ? { username: acc, display_name: '', phonetic: '' } : acc;
              return (
                <div key={idx} className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                      <Input
                        value={account.username}
                        onChange={(e) => {
                          const updated = [...(formData.other_tiktok_accounts || [])];
                          updated[idx] = { ...account, username: e.target.value.replace('@', '') };
                          setFormData({ ...formData, other_tiktok_accounts: updated });
                        }}
                        className="pl-6 h-8 text-xs"
                      />
                    </div>
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
                      className="flex-1 h-8 text-xs"
                    />
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-red-500" onClick={() => removeOtherAccount(idx)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Add new account form */}
            {showAddAccount && (
              <div className="grid grid-cols-3 gap-3 bg-blue-100/50 p-2 rounded-lg">
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                  <Input
                    placeholder="username"
                    value={newAccountUsername}
                    onChange={(e) => setNewAccountUsername(e.target.value.replace('@', ''))}
                    className="pl-6 h-8 text-xs"
                    autoFocus
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
                    className="flex-1 h-8 text-xs"
                  />
                  <Button 
                    size="sm" 
                    className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-xs" 
                    onClick={() => {
                      addOtherAccount();
                      setShowAddAccount(false);
                    }}
                    disabled={!newAccountUsername.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Creator & Battle Info inside blue box */}
        <div className="mt-3">
          {/* Engagement Column - Teal themed - Hidden on Profile */}
          {!isProfile && (
            <div className="p-2 bg-teal-50 rounded-lg border border-teal-200 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(engagementRoles).map(([key, config]) => (
                  <RoleButton key={key} roleKey={key} config={config} small />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* How did you find each other? - Green themed - Hidden on Profile */}
      {!isProfile && (
        <div className="p-3 bg-green-50 rounded-lg border border-green-200 space-y-2">
          <Label className="text-xs font-semibold text-green-800">How did you find each other?</Label>
          <div className="flex gap-2 items-center">
            <div
              onClick={() => setFormData({ ...formData, found_on_fyf: !formData.found_on_fyf, met_through_id: formData.found_on_fyf ? formData.met_through_id : null })}
              className={`flex items-center gap-1 px-3 py-1.5 border rounded-lg cursor-pointer text-xs ${formData.found_on_fyf ? 'border-green-500 bg-green-100 text-green-700' : 'border-gray-200 bg-white'}`}
            >
              <Checkbox checked={formData.found_on_fyf} className="h-3 w-3" />
              <span>FYF</span>
            </div>
            <span className="text-gray-400 text-xs">or</span>
            <div className="flex-1 flex gap-1">
              <QuickAddContactSelect
                contacts={contacts?.filter(c => c.id !== editingContactId) || []}
                value={formData.met_through_id || ''}
                onChange={(v) => setFormData({ ...formData, met_through_id: v, found_on_fyf: false })}
                onQuickAdd={onQuickAddContact}
                placeholder="Through a contact..."
                disabled={formData.found_on_fyf}
                useMasterDb={true}
              />
              {formData.met_through_id && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-gray-400 hover:text-red-500"
                  onClick={() => setFormData({ ...formData, met_through_id: null })}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          {formData.met_through_id && (
            <p className="text-xs text-green-600">
              Connected through: @{contacts?.find(c => c.id === formData.met_through_id)?.username || allMasterContacts?.find(c => c.id === formData.met_through_id)?.username || 'Unknown'}
            </p>
          )}
        </div>
      )}

      {/* TikTok Notes - Hidden on Profile */}
      {!isProfile && (
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
      )}

      {/* Relationship & Custom Fields - Combined Rose themed */}
      <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1 flex-1">
            {/* Relationship roles - Hide on Profile */}
            {!isProfile && Object.entries(relationshipRoles).map(([key, config]) => (
              <Badge
                key={key}
                variant={formData.role?.includes(key) ? 'default' : 'outline'}
                className={`cursor-pointer text-xs ${formData.role?.includes(key) ? 'bg-rose-600' : config.color}`}
                onClick={() => toggleRole(key)}
              >
                {config.label}
              </Badge>
            ))}
            {/* Custom fields inline */}
            {savedCustomRoles?.map(role => {
              const customRole = `custom:${role}`;
              return (
                <Badge
                  key={role}
                  variant={formData.role?.includes(customRole) ? 'default' : 'outline'}
                  className={`cursor-pointer text-xs ${formData.role?.includes(customRole) ? 'bg-purple-600' : 'bg-white text-purple-700 border-purple-300'}`}
                  onClick={() => toggleRole(customRole)}
                >
                  {role}
                </Badge>
              );
            })}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`h-6 w-6 p-0 ${showCustomRoleInput ? 'text-purple-600' : 'text-rose-600 hover:text-rose-700'}`}
            onClick={() => setShowCustomRoleInput(!showCustomRoleInput)}
          >
            <Pencil className="w-3 h-3" />
          </Button>
        </div>
        {showCustomRoleInput && (
          <div className="flex gap-2">
            <Input
              placeholder="Add custom..."
              value={customRoleInput}
              onChange={(e) => setCustomRoleInput(e.target.value)}
              className="h-7 text-xs"
              autoFocus
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
              className="h-7 px-2"
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
        )}
      </div>

      {/* Live Stream Types - Simple alphabetical with custom */}
      <Collapsible>
        <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 bg-violet-50 rounded-lg border border-violet-200 hover:bg-violet-100 transition-colors">
          <ChevronRight className="w-4 h-4 text-violet-600" />
          <span className="font-medium text-sm text-violet-800">Live Stream Types</span>
          {formData.live_stream_types?.length > 0 && (
            <span className="text-xs text-violet-600">({formData.live_stream_types.length} selected)</span>
          )}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 p-3 bg-violet-50 rounded-lg border border-violet-200 space-y-2">
          <div className="flex flex-wrap gap-1">
            {defaultLiveTypes.map(type => (
              <Badge
                key={type}
                variant={formData.live_stream_types?.includes(type) ? 'default' : 'outline'}
                className={`cursor-pointer text-xs ${formData.live_stream_types?.includes(type) ? 'bg-violet-600' : 'bg-white text-violet-700'}`}
                onClick={() => toggleLiveStreamType(type)}
              >
                {type}
              </Badge>
            ))}
            {/* Custom live types */}
            {formData.live_stream_types?.filter(t => !defaultLiveTypes.includes(t)).map(type => (
              <Badge
                key={type}
                variant="default"
                className="cursor-pointer text-xs bg-purple-600"
                onClick={() => toggleLiveStreamType(type)}
              >
                {type} ✕
              </Badge>
            ))}
          </div>
          <div className="flex gap-2 pt-1">
            <Input
              placeholder="Add custom type..."
              value={customLiveType}
              onChange={(e) => setCustomLiveType(e.target.value)}
              className="h-7 text-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customLiveType.trim()) {
                  toggleLiveStreamType(customLiveType.trim());
                  setCustomLiveType('');
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 px-2"
              onClick={() => {
                if (customLiveType.trim()) {
                  toggleLiveStreamType(customLiveType.trim());
                  setCustomLiveType('');
                }
              }}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Collapsible Details Section */}
      <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
        <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 bg-gray-100 rounded-lg border hover:bg-gray-200 transition-colors">
          {detailsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span className="font-medium text-sm text-gray-700">More Details</span>
          <span className="text-xs text-gray-500">(Mods, Agencies, etc.)</span>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-3">
          {/* Mods Section - Pink/Indigo themed */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <Label className="text-xs font-semibold text-indigo-800">They mod for...</Label>
              <p className="text-[10px] text-indigo-600">Who does this person moderate for?</p>
              <QuickAddContactSelect
                contacts={contacts?.filter(c => c.id !== editingContactId && !formData.mods_for?.includes(c.id)) || []}
                value=""
                onChange={(v) => {
                  if (v && !formData.mods_for?.includes(v)) {
                    setFormData({ ...formData, mods_for: [...(formData.mods_for || []), v] });
                  }
                }}
                onQuickAdd={onQuickAddContact}
                placeholder="Search contacts..."
                useMasterDb={true}
              />
              <div className="flex flex-wrap gap-1">
                {formData.mods_for?.map(id => {
                  const contact = contacts?.find(c => c.id === id) || allMasterContacts?.find(c => c.id === id);
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
              <QuickAddContactSelect
                contacts={contacts?.filter(c => c.id !== editingContactId && !formData.their_mods?.includes(c.id)) || []}
                value=""
                onChange={(v) => {
                  if (v && !formData.their_mods?.includes(v)) {
                    setFormData({ ...formData, their_mods: [...(formData.their_mods || []), v] });
                  }
                }}
                onQuickAdd={onQuickAddContact}
                placeholder="Search contacts..."
                useMasterDb={true}
              />
              <div className="flex flex-wrap gap-1">
                {formData.their_mods?.map(id => {
                  const contact = contacts?.find(c => c.id === id) || allMasterContacts?.find(c => c.id === id);
                  return contact ? (
                    <Badge key={id} variant="secondary" className="cursor-pointer text-xs" onClick={() => setFormData({ ...formData, their_mods: formData.their_mods.filter(m => m !== id) })}>
                      @{contact.username} ✕
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          </div>

          {/* Agencies - Amber themed */}
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 space-y-3">
            <Label className="text-xs font-semibold text-amber-800">Agencies</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-amber-700">Live Agency</Label>
                <Input
                  placeholder="Agency name"
                  value={formData.live_agency || ''}
                  onChange={(e) => setFormData({ ...formData, live_agency: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-amber-700">Shop Agency</Label>
                <Input
                  placeholder="Shop agency"
                  value={formData.shop_agency || ''}
                  onChange={(e) => setFormData({ ...formData, shop_agency: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-amber-700">Started Going Live</Label>
              <Input
                placeholder="e.g., Summer 2023"
                value={formData.started_going_live || ''}
                onChange={(e) => setFormData({ ...formData, started_going_live: e.target.value })}
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}