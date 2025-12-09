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
import MasterUsernameSearch from '../components/contacts/MasterUsernameSearch';
import ContactFormHeader from '../components/contacts/ContactFormHeader';
import TikTokTabContent from '../components/contacts/TikTokTabContent';
import PersonalTabContent from '../components/contacts/PersonalTabContent';
import BusinessTabContent from '../components/contacts/BusinessTabContent';
import { useTheme } from '../components/shared/useTheme';

// Icon-based roles for contact cards
const iconRoles = {
  battle_sniper: { label: 'Battle Sniper', icon: Swords, color: 'bg-red-100 text-red-700', borderColor: 'border-red-300' },
  gifter: { label: 'Gifter', icon: Gift, color: 'bg-amber-100 text-amber-700', borderColor: 'border-amber-300' },
  tapper: { label: 'Tapper', icon: Heart, color: 'bg-pink-100 text-pink-700', borderColor: 'border-pink-300' },
  live_commenter: { label: 'Comments (LIVE)', icon: MessageCircle, color: 'bg-teal-100 text-teal-700', borderColor: 'border-teal-300' },
  fan_stickers: { label: 'Fan Stickers', icon: Gift, color: 'bg-fuchsia-100 text-fuchsia-700', borderColor: 'border-fuchsia-300' },
  sharer: { label: 'Shares to Story', icon: BookOpen, color: 'bg-blue-100 text-blue-700', borderColor: 'border-blue-300' },
  hype_person: { label: 'Hype Person', icon: Sparkles, color: 'bg-yellow-100 text-yellow-700', borderColor: 'border-yellow-300' },
  tiktok_shop_affiliate: { label: 'TT Shop Affiliate', icon: ShoppingBag, color: 'bg-lime-100 text-lime-700', borderColor: 'border-lime-300' },
};

// Text-based roles
const textRoles = {
  subscriber: { label: 'Subscriber', text: 'Sub', color: 'bg-cyan-100 text-cyan-700', borderColor: 'border-cyan-300' },
  superfan: { label: 'Superfan', text: 'Superfan', color: 'bg-rose-100 text-rose-700', borderColor: 'border-rose-300' },
  irl_friend: { label: 'Friend IRL', text: 'IRL', color: 'bg-green-100 text-green-700', borderColor: 'border-green-300' },
  discord: { label: 'Discord', text: 'Discord', color: 'bg-violet-100 text-violet-700', borderColor: 'border-violet-300' }
};

const roleConfig = { ...iconRoles, ...textRoles };

// Live stream type categories for filtering
const liveTypeCategories = [
  { label: 'Collaboration', types: ['Co-Host', 'Multi-Guest', 'Battle'] },
  { label: 'Interactive', types: ['Engagement', 'Q&A', 'Talk Show', 'Storytime'] },
  { label: 'Educational', types: ['Teaching', 'Cooking', 'DIY/Crafts', 'Fitness'] },
  { label: 'Entertainment', types: ['Gaming', 'Music', 'ASMR', 'Unboxing'] },
  { label: 'Lifestyle', types: ['Religious', 'Sleep', 'Chat'] },
];
const allLiveTypes = liveTypeCategories.flatMap(cat => cat.types);

// Default clubs/groups (alphabetical)
const defaultClubs = [
  { id: 'authentically_me', label: 'AuthenticallyMe' },
  { id: 'boss_metri', label: 'Boss Metri' },
  { id: 'gen_x', label: 'Gen ❌' },
  { id: 'group_7', label: 'Group 7' },
  { id: 'group_god', label: 'Group God' },
  { id: 'mathy_mob', label: 'Mathy Mob' },
  { id: 'pixel_nuts', label: 'Pixel Nuts' },
  { id: 'team_foley', label: 'Team Foley' },
  { id: 'washed_up_moms', label: "Washed Up Mom's Club" },
  { id: 'we_do_not_care', label: 'We Do Not Care Club' },
  { id: 'we_do_not_have', label: 'We Do Not Have Club' },
];

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
  const { isDark, bgClass, textClass, cardBgClass } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [editingContact, setEditingContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRoles, setFilterRoles] = useState([]);
  const [formTab, setFormTab] = useState('tiktok');
  const [filterGifters, setFilterGifters] = useState(false);
  const defaultFormTab = 'tiktok'; // TikTok Contacts opens to TikTok tab
  
  // Quick add contact function for dropdowns - now accepts master data for auto-fill
        const handleQuickAddContact = async (username, masterData = null) => {
          try {
            const newContact = await base44.entities.TikTokContact.create({
              username: username,
              display_name: masterData?.display_name || '',
              phonetic: masterData?.phonetic || '',
              role: [],
              is_favorite: false
            });
            queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
            return newContact.id;
          } catch (error) {
            console.error('Failed to quick add contact:', error);
            return null;
          }
        };
  const [formData, setFormData] = useState(defaultFormData);
  const [filterVeterans, setFilterVeterans] = useState(false);
  const [filterLiveType, setFilterLiveType] = useState('');
  const [filterClub, setFilterClub] = useState('');
  const [hiddenClubs, setHiddenClubs] = useState([]);
  const [showCustomRolesModal, setShowCustomRolesModal] = useState(false);
  
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

  const effectiveEmail = (user?.email && typeof user.email === 'string') ? getEffectiveUserEmail(user.email) : null;

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

  // Fetch shared clubs
  const { data: sharedClubs = [] } = useQuery({
    queryKey: ['sharedClubs'],
    queryFn: () => base44.entities.SharedClub.list('name'),
  });

  const addSharedClubMutation = useMutation({
    mutationFn: async (clubName) => {
      if (!clubName || typeof clubName !== 'string') return;
      // Check if it already exists
      const existing = sharedClubs.find(c => c.name && typeof c.name === 'string' && c.name.toLowerCase() === clubName.toLowerCase());
      if (!existing) {
        await base44.entities.SharedClub.create({
          name: clubName,
          is_approved: false,
          submitted_by: effectiveEmail
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sharedClubs'] }),
  });

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

  const [shouldCloseAfterSave, setShouldCloseAfterSave] = useState(true);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TikTokContact.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
      if (shouldCloseAfterSave) {
        closeModal();
      } else {
        setFormData(defaultFormData);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TikTokContact.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
      if (shouldCloseAfterSave) {
        closeModal();
      }
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



  const closeModal = () => {
    setShowModal(false);
    setShowUsernamePrompt(false);
    setUsernameInput('');
    setEditingContact(null);
    setFormData(defaultFormData);
    setFormTab(defaultFormTab);
  };

  const handleStartAddContact = () => {
    setShowModal(true);
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      ...defaultFormData,
      ...contact
    });
    setFormTab(defaultFormTab);
    setShowModal(true);
  };

  const handleSubmit = (shouldClose = true) => {
    setShouldCloseAfterSave(shouldClose);
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

  // Helper to check if contact has any social presence
  const hasSocialPresence = (c) => {
    if (c.username) return true; // TikTok username
    const links = c.social_links || {};
    return Object.values(links).some(v => v && v.trim());
  };

  // Filter to only show contacts with social presence in Creator Contacts
  const socialContacts = contacts.filter(c => hasSocialPresence(c));

  const filteredContacts = socialContacts
    .filter(c => {
      const searchLower = (searchTerm && typeof searchTerm === 'string') ? searchTerm.toLowerCase() : '';
      const matchesSearch = !searchLower || 
        (c.username && typeof c.username === 'string' && c.username.toLowerCase().includes(searchLower)) ||
        (c.display_name && typeof c.display_name === 'string' && c.display_name.toLowerCase().includes(searchLower)) ||
        (c.real_name && typeof c.real_name === 'string' && c.real_name.toLowerCase().includes(searchLower)) ||
        (c.nickname && typeof c.nickname === 'string' && c.nickname.toLowerCase().includes(searchLower));
      const matchesRole = filterRoles.length === 0 || filterRoles.some(role => c.role?.includes(role));
      const matchesVeteran = !filterVeterans || c.is_veteran;
      const matchesLiveType = !filterLiveType || c.live_stream_types?.includes(filterLiveType);
      const matchesClub = !filterClub || c.clubs?.includes(filterClub) || c.custom_clubs?.includes(filterClub);
      const matchesGifter = !filterGifters || c.is_gifter;

      return matchesSearch && matchesRole && matchesVeteran && matchesLiveType && matchesClub && matchesGifter;
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
            {/* Names - no image */}
            <div className="flex-1 min-w-0 pr-16">
              <h3 className="font-bold text-lg truncate">
                {contact.nickname || contact.display_name || `@${contact.username}`}
              </h3>
              {contact.nickname && contact.display_name && (
                <p className="text-sm text-gray-500">{contact.display_name}</p>
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
                title="Top 3 Gift Gallery"
              >
                <Gift className={`w-3 h-3 ${contact.is_gifter ? 'fill-amber-500' : ''}`} />
                <span className="font-medium">Top 3</span>
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
    <div className={`min-h-screen ${bgClass} ${isDark ? 'text-gray-100' : ''} p-4 md:p-8`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Creator Contacts</h1>
            <p className="text-gray-600 mt-1">{socialContacts.length} creators with social presence</p>
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
              onClick={handleStartAddContact}
              size="sm"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-xs md:text-sm"
            >
              <Plus className="w-4 h-4 md:mr-2" />
              <span className="hidden sm:inline">Add Contact</span>
            </Button>
          </div>
        </div>



        {/* Search and Filter */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by name, nickname, or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-11"
              />
            </div>
            
            {/* Filter row - organized into groups */}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Relationship badges */}
              {quickFilterRoles.map(role => {
                const isCustom = role.startsWith('custom:');
                const config = isCustom ? null : roleConfig[role];
                const label = isCustom ? role.replace('custom:', '') : config?.label;
                const isActive = filterRoles.includes(role);
                return (
                  <Badge
                    key={role}
                    variant={isActive ? 'default' : 'outline'}
                    className={`cursor-pointer text-xs h-7 ${isActive ? 'bg-purple-600' : 'hover:bg-gray-100'}`}
                    onClick={() => toggleFilterRole(role)}
                  >
                    {label}
                  </Badge>
                );
              })}
              
              <div className="w-px h-5 bg-gray-300 mx-1" />
              
              {/* Special filters */}
              <Badge
                variant={filterGifters ? 'default' : 'outline'}
                className={`cursor-pointer text-xs h-7 ${filterGifters ? 'bg-amber-500' : 'hover:bg-amber-50'}`}
                onClick={() => setFilterGifters(!filterGifters)}
              >
                <Gift className="w-3 h-3 mr-1" />
                Top 3
              </Badge>

              <Badge
                variant={filterVeterans ? 'default' : 'outline'}
                className={`cursor-pointer text-xs h-7 ${filterVeterans ? 'bg-blue-600' : 'hover:bg-blue-50'}`}
                onClick={() => setFilterVeterans(!filterVeterans)}
              >
                🇺🇸
              </Badge>

              <div className="w-px h-5 bg-gray-300 mx-1" />

              {/* Dropdown filters */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1 px-2">
                    <Filter className="w-3 h-3" />
                    Roles
                    {filterRoles.filter(r => dropdownRoles.includes(r)).length > 0 && (
                      <span className="ml-1 bg-purple-100 text-purple-700 rounded-full px-1.5 text-[10px]">
                        {filterRoles.filter(r => dropdownRoles.includes(r)).length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {dropdownRoles.map(role => {
                    const config = roleConfig[role];
                    return (
                      <DropdownMenuCheckboxItem
                        key={role}
                        checked={filterRoles.includes(role)}
                        onCheckedChange={() => toggleFilterRole(role)}
                        className="text-xs"
                      >
                        {config.label}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className={`h-7 text-xs gap-1 px-2 ${filterLiveType ? 'bg-pink-50 border-pink-300' : ''}`}>
                    <Video className="w-3 h-3" />
                    {filterLiveType || 'LIVE'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 max-h-64 overflow-y-auto">
                  {liveTypeCategories.map(category => (
                    <React.Fragment key={category.label}>
                      <DropdownMenuLabel className="text-[10px] text-gray-400 py-1">{category.label}</DropdownMenuLabel>
                      {category.types.map(type => (
                        <DropdownMenuCheckboxItem
                          key={type}
                          checked={filterLiveType === type}
                          onCheckedChange={() => setFilterLiveType(filterLiveType === type ? '' : type)}
                          className="text-xs"
                        >
                          {type}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </React.Fragment>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className={`h-7 text-xs gap-1 px-2 ${filterClub ? 'bg-purple-50 border-purple-300' : ''}`}>
                    <Users className="w-3 h-3" />
                    {filterClub ? (defaultClubs.find(c => c.id === filterClub)?.label || 'Club') : 'Club'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 max-h-64 overflow-y-auto">
                  {defaultClubs.filter(club => !hiddenClubs.includes(club.id)).map(club => (
                    <DropdownMenuCheckboxItem
                      key={club.id}
                      checked={filterClub === club.id}
                      onCheckedChange={() => setFilterClub(filterClub === club.id ? '' : club.id)}
                      className="text-xs"
                    >
                      {club.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {sharedClubs.filter(c => c.is_approved).length > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel className="text-[10px] text-green-600">Community</DropdownMenuLabel>
                      {sharedClubs.filter(c => c.is_approved).map(club => (
                        <DropdownMenuCheckboxItem
                          key={club.id}
                          checked={filterClub === `shared:${club.id}`}
                          onCheckedChange={() => setFilterClub(filterClub === `shared:${club.id}` ? '' : `shared:${club.id}`)}
                          className="text-xs"
                        >
                          {club.name}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Clear button */}
              {(filterRoles.length > 0 || filterVeterans || filterLiveType || filterClub || filterGifters) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setFilterRoles([]); setFilterVeterans(false); setFilterLiveType(''); setFilterClub(''); setFilterGifters(false); }}
                  className="h-7 text-xs text-gray-400 hover:text-red-500 px-2"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>

            {/* Active filter count */}
            {filteredContacts.length !== contacts.length && (
              <p className="text-xs text-gray-500">
                Showing {filteredContacts.length} of {contacts.length} contacts
              </p>
            )}
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
            <Button onClick={handleStartAddContact}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Contact
            </Button>
          </div>
        )}
      </div>

      {/* Custom Roles Modal */}
      <Dialog open={showCustomRolesModal} onOpenChange={setShowCustomRolesModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Manage Custom Fields</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-gray-500">These custom fields are saved across all your contacts.</p>
            {savedCustomRoles.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No custom fields yet. Add one when editing a contact.</p>
            ) : (
              <div className="space-y-1">
                {savedCustomRoles.map((role, idx) => (
                  <div key={role} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg border border-purple-200">
                    <span className="text-sm text-purple-700">{role}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                      onClick={async () => {
                        const newRoles = savedCustomRoles.filter((_, i) => i !== idx);
                        if (preferences?.id) {
                          await base44.entities.UserPreferences.update(preferences.id, {
                            custom_tiktok_roles: newRoles
                          });
                          queryClient.invalidateQueries({ queryKey: ['preferences'] });
                        }
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button
            className="w-full"
            style={{ backgroundColor: preferences?.primary_color || '#8B5CF6' }}
            onClick={() => setShowCustomRolesModal(false)}
          >
            Done
          </Button>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={closeModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingContact ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Username Required Section - dim the rest until filled */}
            {!editingContact && !formData.username && (
              <div className="p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border-2 border-purple-400 shadow-lg">
                <p className="text-sm font-semibold text-purple-800 mb-3">
                  ⭐ TikTok Username Required
                </p>
                <p className="text-xs text-purple-700 mb-3">Search existing or enter new username:</p>
                <MasterUsernameSearch
                  onSelect={(data) => {
                    setFormData(prev => ({
                      ...prev,
                      username: data.username,
                      display_name: data.display_name || prev.display_name,
                      phonetic: data.phonetic || prev.phonetic,
                      real_name: data.real_name || prev.real_name,
                      nickname: data.nickname || prev.nickname,
                      image_url: data.image_url || prev.image_url,
                    }));
                  }}
                  onCreateNew={(username) => {
                    setFormData(prev => ({
                      ...prev,
                      username: username
                    }));
                  }}
                  placeholder="Search by @username or type new one..."
                  excludeUsernames={contacts.map(c => c.username)}
                />
              </div>
            )}

            {/* Dim/disable rest of form until username is entered */}
            <div className={!editingContact && !formData.username ? 'opacity-30 pointer-events-none' : ''}>
            <ContactFormHeader
              formData={formData}
              setFormData={setFormData}
              onSave={handleSubmit}
              isSaving={createMutation.isPending || updateMutation.isPending}
              isEditing={!!editingContact}
              sharedClubs={sharedClubs}
              onAddSharedClub={(name) => addSharedClubMutation.mutate(name)}
              hiddenClubs={hiddenClubs}
              onToggleClubVisibility={(clubId) => setHiddenClubs(prev => 
                prev.includes(clubId) ? prev.filter(id => id !== clubId) : [...prev, clubId]
              )}
              primaryColor={preferences?.primary_color}
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
                      onQuickAddContact={handleQuickAddContact}
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}