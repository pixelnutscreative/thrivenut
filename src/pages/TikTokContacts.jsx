import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Search, Trash2, Edit, Star, 
  Users, Gift, Heart, Video, Calendar,
  ChevronDown, ChevronRight, Loader2, Upload, Check, X, FileSpreadsheet, Filter,
  Sparkles, Lightbulb, Download, Swords, DollarSign, ShoppingBag, MessageCircle, BookOpen, Moon, Building2
} from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { getEffectiveUserEmail } from '../components/admin/ImpersonationBanner';
import MasterContactPicker from '../components/tiktok/MasterContactPicker';
import ContactFormHeader from '../components/contacts/ContactFormHeader';
import TikTokTabContent from '../components/contacts/TikTokTabContent';
import PersonalTabContent from '../components/contacts/PersonalTabContent';
import BusinessTabContent from '../components/contacts/BusinessTabContent';

// Icon-based roles
const iconRoles = {
  battle_sniper: { label: 'Battle Sniper', icon: Swords, color: 'bg-red-100 text-red-700', borderColor: 'border-red-300' },
  tiktok_seller: { label: 'TikTok Seller', icon: DollarSign, color: 'bg-orange-100 text-orange-700', borderColor: 'border-orange-300' },
  gifter: { label: 'Gifter', icon: Gift, color: 'bg-amber-100 text-amber-700', borderColor: 'border-amber-300' },
  tiktok_shop_affiliate: { label: 'TikTok Shop Affiliate', icon: ShoppingBag, color: 'bg-lime-100 text-lime-700', borderColor: 'border-lime-300' },
  authentic_commenter: { label: 'Authentic Commenter', icon: MessageCircle, color: 'bg-teal-100 text-teal-700', borderColor: 'border-teal-300' },
  sharer: { label: 'Shares to Story', icon: BookOpen, color: 'bg-blue-100 text-blue-700', borderColor: 'border-blue-300' },
  creator_to_watch: { label: 'Creator to Watch', icon: Video, color: 'bg-indigo-100 text-indigo-700', borderColor: 'border-indigo-300' },
  engaging_bestie: { label: 'Engaging Bestie', icon: Users, color: 'bg-purple-100 text-purple-700', borderColor: 'border-purple-300' },
  tapper: { label: 'Tapper', icon: Heart, color: 'bg-pink-100 text-pink-700', borderColor: 'border-pink-300' },
  sleep_lives: { label: 'Sleep Lives', icon: Moon, color: 'bg-slate-100 text-slate-700', borderColor: 'border-slate-300' }
};

// Text-based roles
const textRoles = {
  subscriber: { label: 'Subscriber', text: 'Sub', color: 'bg-cyan-100 text-cyan-700', borderColor: 'border-cyan-300' },
  superfan: { label: 'Superfan', text: 'Superfan', color: 'bg-rose-100 text-rose-700', borderColor: 'border-rose-300' },
  irl_friend: { label: 'Friend IRL', text: 'IRL', color: 'bg-green-100 text-green-700', borderColor: 'border-green-300' },
  discord: { label: 'Discord', text: 'Discord', color: 'bg-violet-100 text-violet-700', borderColor: 'border-violet-300' }
};

const roleConfig = { ...iconRoles, ...textRoles };

const defaultFormData = {
  real_name: '',
  nickname: '',
  image_url: '',
  username: '',
  display_name: '',
  phonetic: '',
  role: [],
  categories: [],
  is_favorite: false,
  engagement_enabled: false,
  engagement_frequency: 'multiple_per_week',
  engagement_days: [],
  engagement_day_of_month: 1,
  color: '#6B7280',
  calendar_enabled: false,
  is_gifter: false,
  mods_for: [],
  their_mods: [],
  other_tiktok_accounts: [],
  social_links: {},
  live_stream_types: [],
  live_agency: '',
  shop_agency: '',
  started_going_live: '',
  tiktok_notes: [],
  phone: '',
  email: '',
  birthday: '',
  generation: '',
  gender: '',
  is_veteran: false,
  veteran_branch: '',
  is_in_recovery: false,
  sobriety_date: '',
  family_roles: [],
  occupation: '',
  is_service_professional: false,
  service_type: '',
  is_mlm: false,
  personal_notes: [],
  businesses: []
};

export default function TikTokContacts() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRoles, setFilterRoles] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [formTab, setFormTab] = useState('tiktok');
  const [formData, setFormData] = useState(defaultFormData);
  const [filterVeterans, setFilterVeterans] = useState(false);
  
  // CSV Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvData, setCsvData] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(null);
  const [importRoles, setImportRoles] = useState(['custom:TikTok Lead']);

  const [user, setUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const effectiveEmail = user ? getEffectiveUserEmail(user.email) : null;

  const { data: contacts = [] } = useQuery({
    queryKey: ['tiktokContacts', effectiveEmail],
    queryFn: () => base44.entities.TikTokContact.filter({ created_by: effectiveEmail }, '-created_date'),
    enabled: !!effectiveEmail,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['engagementCategories', effectiveEmail],
    queryFn: () => base44.entities.EngagementCategory.filter({ created_by: effectiveEmail }, 'name'),
    enabled: !!effectiveEmail,
  });

  const { data: preferences } = useQuery({
    queryKey: ['preferences', effectiveEmail],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: effectiveEmail }, '-updated_date');
      return prefs[0] || null;
    },
    enabled: !!effectiveEmail,
  });

  const savedCustomRoles = preferences?.custom_tiktok_roles || [];

  const saveCustomRoleMutation = useMutation({
    mutationFn: async (newRole) => {
      const currentRoles = preferences?.custom_tiktok_roles || [];
      if (!currentRoles.includes(newRole)) {
        if (preferences?.id) {
          await base44.entities.UserPreferences.update(preferences.id, {
            custom_tiktok_roles: [...currentRoles, newRole]
          });
        }
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['preferences'] }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TikTokContact.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TikTokContact.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TikTokContact.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] }),
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }) => base44.entities.TikTokContact.update(id, { is_favorite: !isFavorite }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] }),
  });

  const toggleFeatureMutation = useMutation({
    mutationFn: ({ id, field, currentValue }) => base44.entities.TikTokContact.update(id, { [field]: !currentValue }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] }),
  });

  const { data: allMasterContacts = [] } = useQuery({
    queryKey: ['allMasterContacts'],
    queryFn: () => base44.entities.TikTokContact.list('username', 2000),
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingContact(null);
    setFormData(defaultFormData);
    setFormTab('tiktok');
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      ...defaultFormData,
      ...contact
    });
    setFormTab('tiktok');
    setShowModal(true);
  };

  const handleSubmit = () => {
    const cleanData = {
      ...formData,
      username: (formData.username || '').replace('@', '').trim()
    };
    
    if (editingContact) {
      updateMutation.mutate({ id: editingContact.id, data: cleanData });
    } else {
      createMutation.mutate(cleanData);
    }
  };

  const quickFilterRoles = ['subscriber', 'superfan', 'irl_friend', 'discord', 'custom:TikTok Lead'];
  const dropdownRoles = Object.keys(roleConfig).filter(r => !quickFilterRoles.includes(r));

  const toggleFilterRole = (role) => {
    setFilterRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const filteredContacts = contacts
    .filter(c => {
      const matchesSearch = 
        c.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.real_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.nickname?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRoles.length === 0 || filterRoles.some(role => c.role?.includes(role));
      const matchesVeteran = !filterVeterans || c.is_veteran;

      if (activeTab === 'engagement') return matchesSearch && matchesRole && matchesVeteran && c.engagement_enabled;
      if (activeTab === 'calendar') return matchesSearch && matchesRole && matchesVeteran && c.calendar_enabled;
      if (activeTab === 'gifters') return matchesSearch && matchesRole && matchesVeteran && c.is_gifter;
      return matchesSearch && matchesRole && matchesVeteran;
    })
    .sort((a, b) => {
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      return 0;
    });

  const ContactCard = ({ contact }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <Card className={`relative overflow-hidden ${contact.is_favorite ? 'ring-2 ring-amber-400' : ''}`}>
        <div className="h-2" style={{ backgroundColor: contact.color || '#8B5CF6' }} />
        
        <CardContent className="p-4">
          <div className="absolute top-4 right-3 flex flex-col items-end gap-1">
            <div className="flex items-center gap-1">
              <button onClick={() => handleEdit(contact)} className="p-1 hover:bg-gray-100 rounded">
                <Edit className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
              <button onClick={() => { if (confirm('Delete this contact?')) deleteMutation.mutate(contact.id); }} className="p-1 hover:bg-gray-100 rounded">
                <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
              </button>
              <button onClick={() => toggleFavoriteMutation.mutate({ id: contact.id, isFavorite: contact.is_favorite })} className="p-1 hover:bg-gray-100 rounded">
                <Star className={`w-4 h-4 ${contact.is_favorite ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
              </button>
            </div>
            {contact.is_veteran && <span className="text-sm" title="Veteran">🇺🇸</span>}
          </div>

          <div className="space-y-3">
            {/* Photo + Names */}
            <div className="flex items-start gap-3">
              {contact.image_url ? (
                <img src={contact.image_url} alt="" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-gray-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg truncate">
                  {contact.real_name || contact.nickname || contact.display_name || `@${contact.username}`}
                </h3>
                {contact.nickname && contact.real_name && (
                  <p className="text-sm text-gray-500">"{contact.nickname}"</p>
                )}
                {contact.username && (
                  <p 
                    className="text-sm text-purple-600 cursor-pointer hover:underline"
                    onClick={() => window.open(`https://tiktok.com/@${contact.username}`, '_blank')}
                  >
                    @{contact.username}
                  </p>
                )}
              </div>
            </div>

            {/* Roles */}
            <div className="space-y-1 pt-2 border-t">
              <div className="flex flex-wrap items-center gap-0.5">
                {Object.entries(iconRoles).map(([roleKey, config]) => {
                  const isActive = contact.role?.includes(roleKey);
                  const RoleIcon = config.icon;
                  return (
                    <button
                      key={roleKey}
                      onClick={(e) => {
                        e.stopPropagation();
                        const newRoles = isActive 
                          ? (contact.role || []).filter(r => r !== roleKey)
                          : [...(contact.role || []), roleKey];
                        base44.entities.TikTokContact.update(contact.id, { role: newRoles });
                        queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
                      }}
                      className={`p-1.5 rounded-full border transition-all cursor-pointer hover:scale-110 ${
                        isActive ? config.color + ' border-transparent' : 'bg-white text-gray-300 ' + config.borderColor + ' hover:bg-gray-50'
                      }`}
                      title={config.label}
                    >
                      <RoleIcon className="w-3 h-3" />
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {Object.entries(textRoles).map(([roleKey, config]) => {
                  const isActive = contact.role?.includes(roleKey);
                  return (
                    <button
                      key={roleKey}
                      onClick={(e) => {
                        e.stopPropagation();
                        const newRoles = isActive 
                          ? (contact.role || []).filter(r => r !== roleKey)
                          : [...(contact.role || []), roleKey];
                        base44.entities.TikTokContact.update(contact.id, { role: newRoles });
                        queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
                      }}
                      className={`px-2 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer hover:scale-105 ${
                        isActive ? config.color + ' border-transparent' : 'bg-white text-gray-400 ' + config.borderColor + ' hover:bg-gray-50'
                      }`}
                    >
                      {config.text}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Feature toggles */}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFeatureMutation.mutate({ id: contact.id, field: 'engagement_enabled', currentValue: contact.engagement_enabled });
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all cursor-pointer hover:scale-105 ${
                  contact.engagement_enabled ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
                title="Engagement Tracking"
              >
                <Sparkles className={`w-3 h-3 ${contact.engagement_enabled ? 'fill-purple-500' : ''}`} />
                <span className="font-medium">Engage</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFeatureMutation.mutate({ id: contact.id, field: 'calendar_enabled', currentValue: contact.calendar_enabled });
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all cursor-pointer hover:scale-105 ${
                  contact.calendar_enabled ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
                title="Creator Calendar"
              >
                <Calendar className={`w-4 h-4 ${contact.calendar_enabled ? 'fill-blue-500' : ''}`} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFeatureMutation.mutate({ id: contact.id, field: 'is_gifter', currentValue: contact.is_gifter });
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all cursor-pointer hover:scale-105 ${
                  contact.is_gifter ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
                title="Gifter for Songs"
              >
                <Gift className={`w-3 h-3 ${contact.is_gifter ? 'fill-amber-500' : ''}`} />
                <span className="font-medium">GG</span>
              </button>
            </div>

            {/* Business indicator */}
            {contact.businesses?.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Building2 className="w-3 h-3" />
                <span>{contact.businesses.length} business{contact.businesses.length > 1 ? 'es' : ''}</span>
              </div>
            )}
          </div>

          {contact.role?.includes('custom:TikTok Lead') && (
            <div className="absolute bottom-3 right-3 p-1.5 rounded-full bg-teal-100 text-teal-700" title="TikTok Lead">
              <Lightbulb className="w-4 h-4" />
            </div>
          )}

          {contact.is_service_professional && (
            <div className="absolute bottom-3 left-3">
              <span className="text-lg" title="Service Professional">❤️</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Contacts</h1>
            <p className="text-gray-600 mt-1">Your central hub for all connections</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs md:text-sm text-gray-700"
              onClick={() => {
                const headers = ['Real Name', 'Nickname', 'Username', 'Display Name', 'Phone', 'Email', 'Roles', 'Is Favorite', 'Is Veteran'];
                const rows = contacts.map(c => [
                  c.real_name || '', c.nickname || '', c.username || '', c.display_name || '',
                  c.phone || '', c.email || '', (c.role || []).join('; '),
                  c.is_favorite ? 'Yes' : 'No', c.is_veteran ? 'Yes' : 'No'
                ]);
                const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `contacts-backup-${format(new Date(), 'yyyy-MM-dd')}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Backup</span>
            </Button>
            <Button
              onClick={() => setShowModal(true)}
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-xs md:text-sm"
            >
              <Plus className="w-4 h-4 md:mr-2" />
              <span className="hidden sm:inline">Add Contact</span>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 h-auto">
            <TabsTrigger value="all" className="text-xs md:text-sm py-2">All ({contacts.length})</TabsTrigger>
            <TabsTrigger value="engagement" className="text-xs md:text-sm py-2">
              <Sparkles className="w-3 h-3 mr-1" />
              ({contacts.filter(c => c.engagement_enabled).length})
            </TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs md:text-sm py-2">
              <Calendar className="w-3 h-3 mr-1" />
              ({contacts.filter(c => c.calendar_enabled).length})
            </TabsTrigger>
            <TabsTrigger value="gifters" className="text-xs md:text-sm py-2">
              <Gift className="w-3 h-3 mr-1" />
              ({contacts.filter(c => c.is_gifter).length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by name, nickname, or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-lg"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {quickFilterRoles.map(role => {
                const isCustom = role.startsWith('custom:');
                const config = isCustom ? null : roleConfig[role];
                const Icon = config?.icon;
                const label = isCustom ? role.replace('custom:', '') : config?.label;
                const colorClass = isCustom ? 'bg-teal-100 text-teal-700' : config?.color;
                const isActive = filterRoles.includes(role);
                return (
                  <Badge
                    key={role}
                    variant={isActive ? 'default' : 'outline'}
                    className={`cursor-pointer px-3 py-1.5 ${isActive ? 'bg-purple-600' : colorClass}`}
                    onClick={() => toggleFilterRole(role)}
                  >
                    {Icon ? <Icon className="w-3 h-3 mr-1" /> : (isCustom ? <Lightbulb className="w-3 h-3 mr-1" /> : null)}
                    {label}
                  </Badge>
                );
              })}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="w-4 h-4" />
                    More
                    {filterRoles.filter(r => dropdownRoles.includes(r)).length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                        {filterRoles.filter(r => dropdownRoles.includes(r)).length}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Filter by Role</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {dropdownRoles.map(role => {
                    const config = roleConfig[role];
                    const Icon = config.icon;
                    return (
                      <DropdownMenuCheckboxItem
                        key={role}
                        checked={filterRoles.includes(role)}
                        onCheckedChange={() => toggleFilterRole(role)}
                      >
                        {Icon ? <Icon className="w-4 h-4 mr-2" /> : <span className="text-xs font-bold mr-2">{config.text}</span>}
                        {config.label}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              <Badge
                variant={filterVeterans ? 'default' : 'outline'}
                className={`cursor-pointer px-3 py-1.5 ${filterVeterans ? 'bg-red-600' : 'bg-gradient-to-r from-red-50 via-white to-blue-50 text-blue-700 border-red-200'}`}
                onClick={() => setFilterVeterans(!filterVeterans)}
              >
                <span className="mr-1">🇺🇸</span>
                Veterans
              </Badge>

              {(filterRoles.length > 0 || filterVeterans) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setFilterRoles([]); setFilterVeterans(false); }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contacts Grid */}
        <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredContacts.map((contact) => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredContacts.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No contacts found</h3>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Contact
            </Button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={closeModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingContact ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <ContactFormHeader
              formData={formData}
              setFormData={setFormData}
              onSave={handleSubmit}
              isSaving={createMutation.isPending || updateMutation.isPending}
              isEditing={!!editingContact}
            />

            <Tabs value={formTab} onValueChange={setFormTab}>
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="tiktok" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
                  TikTok
                </TabsTrigger>
                <TabsTrigger value="personal" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                  Personal
                </TabsTrigger>
                <TabsTrigger value="business" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700">
                  Business
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tiktok" className="mt-4">
                <TikTokTabContent
                  formData={formData}
                  setFormData={setFormData}
                  contacts={contacts}
                  categories={categories}
                  savedCustomRoles={savedCustomRoles}
                  onSaveCustomRole={(role) => saveCustomRoleMutation.mutate(role)}
                  editingContactId={editingContact?.id}
                />
              </TabsContent>

              <TabsContent value="personal" className="mt-4">
                <PersonalTabContent
                  formData={formData}
                  setFormData={setFormData}
                />
              </TabsContent>

              <TabsContent value="business" className="mt-4">
                <BusinessTabContent
                  formData={formData}
                  setFormData={setFormData}
                />
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}