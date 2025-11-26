import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Search, Trash2, Edit, Star, Phone, Mail, 
  ExternalLink, Users, Swords, Gift, Share2, Heart, UserPlus, Video, Calendar, Music, ShoppingBag,
  ChevronDown, ChevronRight, FolderPlus, Loader2, Upload, Check, X, FileSpreadsheet, Filter, MessageCircle,
  BookOpen, DollarSign, Moon, Drama, Sparkles
} from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { getEffectiveUserEmail } from '../components/admin/ImpersonationBanner';

const roleConfig = {
  battle_sniper: { label: 'Battle Sniper', icon: Swords, color: 'bg-red-100 text-red-700', activeColor: 'text-red-600' },
  tapper: { label: 'Tapper', icon: Heart, color: 'bg-pink-100 text-pink-700', activeColor: 'text-pink-600' },
  sharer: { label: 'Shares to Story', icon: BookOpen, color: 'bg-blue-100 text-blue-700', activeColor: 'text-blue-600' },
  gifter: { label: 'Gifter', icon: Gift, color: 'bg-amber-100 text-amber-700', activeColor: 'text-amber-600' },
  engaging_bestie: { label: 'Engaging Bestie', icon: Users, color: 'bg-purple-100 text-purple-700', activeColor: 'text-purple-600' },
  authentic_commenter: { label: 'Authentic Commenter', icon: MessageCircle, color: 'bg-teal-100 text-teal-700', activeColor: 'text-teal-600' },
  irl_friend: { label: 'Friend IRL', icon: null, text: 'IRL', color: 'bg-green-100 text-green-700', activeColor: 'text-green-600' },
  tiktok_seller: { label: 'TikTok Seller', icon: DollarSign, color: 'bg-orange-100 text-orange-700', activeColor: 'text-orange-600' },
  tiktok_shop_affiliate: { label: 'TikTok Shop Affiliate', icon: ShoppingBag, color: 'bg-lime-100 text-lime-700', activeColor: 'text-lime-600' },
  creator_to_watch: { label: 'Creator to Watch', icon: Video, color: 'bg-indigo-100 text-indigo-700', activeColor: 'text-indigo-600' },
  subscriber: { label: 'Subscriber', icon: null, text: 'SUB', color: 'bg-cyan-100 text-cyan-700', activeColor: 'text-cyan-600' },
  superfan: { label: 'Superfan', icon: null, text: 'FAN', color: 'bg-rose-100 text-rose-700', activeColor: 'text-rose-600' },
  discord: { label: 'Discord', icon: Drama, color: 'bg-violet-100 text-violet-700', activeColor: 'text-violet-600' },
  sleep_lives: { label: 'Sleep Lives', icon: Moon, color: 'bg-slate-100 text-slate-700', activeColor: 'text-slate-600' }
};

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const colorOptions = [
  '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', '#10B981', 
  '#3B82F6', '#6366F1', '#84CC16', '#14B8A6', '#F97316'
];

export default function TikTokContacts() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRoles, setFilterRoles] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    phonetic: '',
    phone: '',
    email: '',
    role: [],
    categories: [],
    notes: '',
    is_favorite: false,
    engagement_enabled: false,
    engagement_frequency: 'weekly',
    engagement_days: [],
    color: '#8B5CF6',
    calendar_enabled: false,
    is_gifter: false,
    add_to_my_people: false,
    mods_for: [],
    their_mods: [],
    met_through_id: '',
    met_through_name: '',
    started_going_live: '',
    live_agency: '',
    shop_agency: '',
    other_tiktok_accounts: [],
    social_links: {}
  });
  const [newOtherTikTok, setNewOtherTikTok] = useState('');
  const [newMetThroughName, setNewMetThroughName] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#8B5CF6');
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [newModForName, setNewModForName] = useState('');
  const [newTheirModName, setNewTheirModName] = useState('');
  
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

  // Get effective email (real user or impersonated)
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }) => base44.entities.TikTokContact.update(id, { 
      is_favorite: !isFavorite 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
    },
  });

  const toggleFeatureMutation = useMutation({
    mutationFn: ({ id, field, currentValue }) => base44.entities.TikTokContact.update(id, { 
      [field]: !currentValue 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data) => base44.entities.EngagementCategory.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagementCategories'] });
      setNewCategoryName('');
      setNewCategoryColor('#8B5CF6');
      setShowCategoryModal(false);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id) => base44.entities.EngagementCategory.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['engagementCategories'] });
    },
  });

  // Master contacts for looking up shared display_name/phonetic
  const { data: allMasterContacts = [] } = useQuery({
    queryKey: ['allMasterContacts'],
    queryFn: () => base44.entities.TikTokContact.list('username', 2000),
  });

  // Bulk import mutation
  const bulkImportMutation = useMutation({
    mutationFn: async (contactsToImport) => {
      const results = [];
      for (const contact of contactsToImport) {
        if (!contact.selected) continue;

        // Check if username already exists in MY contacts
        const existing = contacts.find(c => 
          c.username?.toLowerCase() === contact.username?.toLowerCase()
        );

        // Check master database for shared display_name/phonetic
        const masterMatch = allMasterContacts.find(c => {
          const cUsername = (c.data?.username || c.username || '').toLowerCase();
          return cUsername === contact.username?.toLowerCase();
        });
        const masterDisplayName = masterMatch?.data?.display_name || masterMatch?.display_name;
        const masterPhonetic = masterMatch?.data?.phonetic || masterMatch?.phonetic;

        if (existing) {
          // Update existing contact - use master DB display_name/phonetic if available, keep private data
          await base44.entities.TikTokContact.update(existing.id, {
            display_name: masterDisplayName || contact.display_name || existing.display_name,
            phonetic: masterPhonetic || existing.phonetic,
            phone: contact.phone || existing.phone,
            email: contact.email || existing.email,
            lead_received_at: contact.lead_received_at || existing.lead_received_at,
            lead_source: contact.lead_source || existing.lead_source,
          });
          results.push({ ...contact, action: 'updated' });
        } else {
          // Create new contact - use master DB display_name/phonetic if available
          await base44.entities.TikTokContact.create({
            username: contact.username,
            display_name: masterDisplayName || contact.display_name,
            phonetic: masterPhonetic || '',
            phone: contact.phone,
            email: contact.email,
            role: contact.importRoles || [],
            lead_received_at: contact.lead_received_at,
            lead_source: contact.lead_source,
          });
          results.push({ ...contact, action: 'created' });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
      queryClient.invalidateQueries({ queryKey: ['allMasterContacts'] });
      const created = results.filter(r => r.action === 'created').length;
      const updated = results.filter(r => r.action === 'updated').length;
      setImportSuccess(`Imported ${created} new contacts, updated ${updated} existing.`);
      setTimeout(() => {
        setShowImportModal(false);
        setCsvData([]);
        setImportSuccess(null);
      }, 2000);
    },
    onError: (error) => {
      setImportError('Import failed: ' + error.message);
    },
  });

  // Create a new contact and link it (for met_through, mods_for, their_mods)
  const createAndLinkMutation = useMutation({
    mutationFn: async ({ username, linkType }) => {
      const newContact = await base44.entities.TikTokContact.create({ 
        username: username.replace('@', '').trim() 
      });
      return { newContact, linkType };
    },
    onSuccess: ({ newContact, linkType }) => {
      queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
      
      if (linkType === 'met_through') {
        setFormData(prev => ({ ...prev, met_through_id: newContact.id, met_through_name: '' }));
        setNewMetThroughName('');
      } else if (linkType === 'mods_for') {
        setFormData(prev => ({ ...prev, mods_for: [...prev.mods_for, newContact.id] }));
        setNewModForName('');
      } else if (linkType === 'their_mods') {
        setFormData(prev => ({ ...prev, their_mods: [...prev.their_mods, newContact.id] }));
        setNewTheirModName('');
      }
    },
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingContact(null);
    setFormData({
      username: '',
      display_name: '',
      phonetic: '',
      phone: '',
      email: '',
      role: [],
      categories: [],
      notes: '',
      is_favorite: false,
      engagement_enabled: false,
      engagement_frequency: 'weekly',
      engagement_days: [],
      color: '#8B5CF6',
      calendar_enabled: false,
      is_gifter: false,
      add_to_my_people: false,
      mods_for: [],
      their_mods: [],
      met_through_id: '',
      met_through_name: '',
      started_going_live: '',
      live_agency: '',
      shop_agency: '',
      other_tiktok_accounts: [],
      social_links: {}
    });
    setNewMetThroughName('');
    setNewOtherTikTok('');
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      username: contact.username || '',
      display_name: contact.display_name || '',
      phonetic: contact.phonetic || '',
      phone: contact.phone || '',
      email: contact.email || '',
      role: contact.role || [],
      categories: contact.categories || [],
      notes: contact.notes || '',
      is_favorite: contact.is_favorite || false,
      engagement_enabled: contact.engagement_enabled || false,
      engagement_frequency: contact.engagement_frequency || 'weekly',
      engagement_days: contact.engagement_days || [],
      color: contact.color || '#8B5CF6',
      calendar_enabled: contact.calendar_enabled || false,
      is_gifter: contact.is_gifter || false,
      add_to_my_people: contact.add_to_my_people || false,
      mods_for: contact.mods_for || [],
      their_mods: contact.their_mods || [],
      met_through_id: contact.met_through_id || '',
      met_through_name: contact.met_through_name || '',
      started_going_live: contact.started_going_live || '',
      live_agency: contact.live_agency || '',
      shop_agency: contact.shop_agency || '',
      other_tiktok_accounts: contact.other_tiktok_accounts || [],
      social_links: contact.social_links || {}
    });
    setNewMetThroughName('');
    setNewOtherTikTok('');
    setShowModal(true);
  };

  const handleSubmit = () => {
    const cleanData = {
      ...formData,
      username: formData.username.replace('@', '').trim()
    };
    
    if (editingContact) {
      updateMutation.mutate({ id: editingContact.id, data: cleanData });
    } else {
      createMutation.mutate(cleanData);
    }
  };

  const toggleRole = (role) => {
    setFormData(prev => ({
      ...prev,
      role: prev.role.includes(role)
        ? prev.role.filter(r => r !== role)
        : [...prev.role, role]
    }));
  };

  const toggleDay = (day) => {
    setFormData(prev => ({
      ...prev,
      engagement_days: prev.engagement_days.includes(day)
        ? prev.engagement_days.filter(d => d !== day)
        : [...prev.engagement_days, day]
    }));
  };

  // CSV parsing function - handles quoted values with commas inside
  const parseCSVLine = (line) => {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^"|"$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^"|"$/g, ''));
    return values;
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImportError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n');
      if (lines.length < 2) {
        setImportError('CSV file appears to be empty');
        return;
      }

      // Parse header row
      const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());

      // Find column indices - TikTok Leads Manager format
      const usernameIdx = headers.findIndex(h => h === 'user name' || h === 'username' || h.includes('user name'));
      const displayNameIdx = headers.findIndex(h => h === 'display name' || h === 'displayname');
      const nameIdx = headers.findIndex(h => h === 'name' && !h.includes('display') && !h.includes('user'));
      const phoneIdx = headers.findIndex(h => h.includes('phone'));
      const emailIdx = headers.findIndex(h => h === 'email' || h.includes('email'));
      const receivedDateIdx = headers.findIndex(h => h === 'received date' || h.includes('received date'));
      const receivedTimeIdx = headers.findIndex(h => h === 'received time' || h.includes('received time'));
      const sourceIdx = headers.findIndex(h => h === 'source scenario' || h.includes('source scenario') || h === 'source');

      if (usernameIdx === -1) {
        setImportError('Could not find "User Name" column in CSV. Found columns: ' + headers.join(', '));
        return;
      }

      // Parse data rows
      const parsed = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const values = parseCSVLine(lines[i]);

        const username = values[usernameIdx]?.replace('@', '').trim();
        if (!username) continue;

        // Combine date and time if both exist
        let leadReceivedAt = '';
        if (receivedDateIdx >= 0 && values[receivedDateIdx]) {
          const datePart = values[receivedDateIdx];
          const timePart = receivedTimeIdx >= 0 ? values[receivedTimeIdx] : '';
          if (timePart) {
            // Parse MM/DD/YYYY format and combine with time
            const [month, day, year] = datePart.split('/');
            if (month && day && year) {
              leadReceivedAt = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}`;
            }
          } else {
            leadReceivedAt = datePart;
          }
        }

        parsed.push({
          username,
          display_name: displayNameIdx >= 0 ? values[displayNameIdx] : '',
          name: nameIdx >= 0 ? values[nameIdx] : '',
          phone: phoneIdx >= 0 ? values[phoneIdx] : '',
          email: emailIdx >= 0 ? values[emailIdx] : '',
          lead_received_at: leadReceivedAt,
          lead_source: sourceIdx >= 0 ? values[sourceIdx] : '',
          selected: true,
          importRoles: ['custom:TikTok Lead'],
        });
      }

      if (parsed.length === 0) {
        setImportError('No valid contacts found in CSV');
        return;
      }

      setCsvData(parsed);
      setShowImportModal(true);
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const toggleCsvSelection = (index) => {
    setCsvData(prev => prev.map((item, i) => 
      i === index ? { ...item, selected: !item.selected } : item
    ));
  };

  const updateCsvItem = (index, field, value) => {
    setCsvData(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  // Quick filter roles (shown as separate buttons)
  const quickFilterRoles = ['subscriber', 'superfan', 'irl_friend', 'discord', 'custom:TikTok Lead'];
  // All other roles go in the dropdown
  const dropdownRoles = Object.keys(roleConfig).filter(r => !quickFilterRoles.includes(r));

  const toggleFilterRole = (role) => {
    setFilterRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const filteredContacts = contacts
    .filter(c => {
      const matchesSearch = 
        c.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.screen_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRoles.length === 0 || filterRoles.some(role => c.role?.includes(role));
      
      // Tab filtering
      if (activeTab === 'engagement') return matchesSearch && matchesRole && c.engagement_enabled;
      if (activeTab === 'calendar') return matchesSearch && matchesRole && c.calendar_enabled;
      if (activeTab === 'gifters') return matchesSearch && matchesRole && c.is_gifter;
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => {
      if (a.is_favorite && !b.is_favorite) return -1;
      if (!a.is_favorite && b.is_favorite) return 1;
      return 0;
    });

  // Lead source icon mapping
  const leadSourceConfig = {
    'LIVE': { icon: Video, label: 'Live', color: 'text-red-500' },
    'Profile': { icon: Users, label: 'Profile', color: 'text-blue-500' },
    'Post': { icon: Share2, label: 'Post', color: 'text-green-500' },
    'Battle': { icon: Swords, label: 'Battle', color: 'text-orange-500' },
    'Referral': { icon: UserPlus, label: 'Referral', color: 'text-purple-500' },
  };

  const ContactCard = ({ contact, index }) => (
    <motion.div
      key={contact.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card 
        className={`relative overflow-hidden ${contact.is_favorite ? 'ring-2 ring-amber-400' : ''}`}
      >
        {/* Thick colored header bar */}
        <div className="h-2" style={{ backgroundColor: contact.color || '#8B5CF6' }} />
        
        <CardContent className="p-4">
          {/* Top actions row */}
          <div className="absolute top-4 right-3 flex items-center gap-1">
            <button
              onClick={() => handleEdit(contact)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Edit className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
            <button
              onClick={() => {
                if (confirm('Delete this contact?')) {
                  deleteMutation.mutate(contact.id);
                }
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
            </button>
            <button
              onClick={() => toggleFavoriteMutation.mutate({ id: contact.id, isFavorite: contact.is_favorite })}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <Star className={`w-4 h-4 ${contact.is_favorite ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <h3 
                className="font-bold text-lg cursor-pointer hover:text-purple-600"
                onClick={() => window.open(`https://tiktok.com/@${contact.username}`, '_blank')}
              >
                @{contact.username}
              </h3>
              {contact.display_name && (
                <p className="text-gray-600 text-sm">{contact.display_name}</p>
              )}
            </div>

            {/* Lead Source */}
            {contact.lead_source && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                {(() => {
                  const sourceConfig = leadSourceConfig[contact.lead_source] || { icon: Sparkles, label: contact.lead_source, color: 'text-gray-400' };
                  const SourceIcon = sourceConfig.icon;
                  return (
                    <>
                      <SourceIcon className={`w-3 h-3 ${sourceConfig.color}`} />
                      {contact.lead_source === 'Referral' && contact.met_through_name && (
                        <span className="text-purple-600">{contact.met_through_name}</span>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {contact.notes && (
              <p className="text-sm text-gray-500 italic line-clamp-2">{contact.notes}</p>
            )}

            {/* Role Icons - All shown, greyed out if not selected */}
            <div className="flex flex-wrap gap-1">
              {Object.entries(roleConfig).map(([roleKey, config]) => {
                const isActive = contact.role?.includes(roleKey);
                const RoleIcon = config.icon;
                return (
                  <div
                    key={roleKey}
                    className={`p-1.5 rounded-full transition-all ${
                      isActive ? config.color : 'bg-gray-100 text-gray-300'
                    }`}
                    title={config.label}
                  >
                    {RoleIcon ? (
                      <RoleIcon className="w-3 h-3" />
                    ) : (
                      <span className="text-[10px] font-bold leading-none">{config.text}</span>
                    )}
                  </div>
                );
              })}
              {/* Custom roles */}
              {contact.role?.filter(r => r.startsWith('custom:')).map(role => (
                <div
                  key={role}
                  className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 text-xs font-medium"
                  title={role.replace('custom:', '')}
                >
                  {role.replace('custom:', '')}
                </div>
              ))}
            </div>

            {/* Feature Toggles */}
            <div className="flex items-center gap-2 pt-2 border-t">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFeatureMutation.mutate({ id: contact.id, field: 'engagement_enabled', currentValue: contact.engagement_enabled });
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${
                  contact.engagement_enabled 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-gray-100 text-gray-400 hover:bg-purple-50 hover:text-purple-500'
                }`}
                title="Toggle Engagement Tracking"
              >
                <Heart className={`w-3 h-3 ${contact.engagement_enabled ? 'fill-purple-500' : ''}`} />
                <span className="hidden sm:inline">Engage</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFeatureMutation.mutate({ id: contact.id, field: 'calendar_enabled', currentValue: contact.calendar_enabled });
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${
                  contact.calendar_enabled 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-500'
                }`}
                title="Toggle Calendar"
              >
                <Calendar className={`w-3 h-3 ${contact.calendar_enabled ? 'fill-blue-500' : ''}`} />
                <span className="hidden sm:inline">Calendar</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFeatureMutation.mutate({ id: contact.id, field: 'is_gifter', currentValue: contact.is_gifter });
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${
                  contact.is_gifter 
                    ? 'bg-amber-100 text-amber-700' 
                    : 'bg-gray-100 text-gray-400 hover:bg-amber-50 hover:text-amber-500'
                }`}
                title="Toggle Gifter"
              >
                <Gift className={`w-3 h-3 ${contact.is_gifter ? 'fill-amber-500' : ''}`} />
                <span className="hidden sm:inline">Gifter</span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">TikTok Contacts</h1>
            <p className="text-gray-600 mt-1">Your central hub for all TikTok connections</p>
          </div>
          <div className="flex gap-2">
                        <label className="cursor-pointer">
                          <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
                          <Button asChild variant="outline">
                            <span>
                              <Upload className="w-4 h-4 mr-2" />
                              Import CSV
                            </span>
                          </Button>
                        </label>
                        <Button
                          variant="outline"
                          onClick={() => setShowCategoryModal(true)}
                        >
                          <FolderPlus className="w-4 h-4 mr-2" />
                          Categories
                        </Button>
                        <Button
                          onClick={() => setShowModal(true)}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Contact
                        </Button>
                      </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({contacts.length})</TabsTrigger>
            <TabsTrigger value="engagement">Engagement ({contacts.filter(c => c.engagement_enabled).length})</TabsTrigger>
            <TabsTrigger value="calendar">Calendar ({contacts.filter(c => c.calendar_enabled).length})</TabsTrigger>
            <TabsTrigger value="gifters">🎁 Gifters ({contacts.filter(c => c.is_gifter).length})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-4 space-y-3">
            {/* Large Search Box */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by username or display name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-lg"
              />
            </div>
            
            {/* Filter Row */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Quick Filter Buttons */}
              {quickFilterRoles.map(role => {
                const isCustom = role.startsWith('custom:');
                const config = isCustom ? null : roleConfig[role];
                const Icon = config?.icon || UserPlus;
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
                    <Icon className="w-3 h-3 mr-1" />
                    {label}
                  </Badge>
                );
              })}
              
              {/* More Filters Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="w-4 h-4" />
                    More Filters
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
                        <Icon className="w-4 h-4 mr-2" />
                        {config.label}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Clear Filters */}
              {filterRoles.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFilterRoles([])}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear ({filterRoles.length})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contacts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredContacts.map((contact, index) => (
              <ContactCard key={contact.id} contact={contact} index={index} />
            ))}
          </AnimatePresence>
        </div>

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
            <div className="flex items-center justify-between">
              <DialogTitle>{editingContact ? 'Edit Contact' : 'Add TikTok Contact'}</DialogTitle>
              <div className="flex items-center gap-2 mr-6">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_favorite: !formData.is_favorite })}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Star className={`w-5 h-5 ${formData.is_favorite ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                </button>
                <div className="flex items-center gap-1">
                  {colorOptions.slice(0, 5).map(color => (
                    <div
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-5 h-5 rounded-full cursor-pointer ${formData.color === color ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-6 h-6 p-0 cursor-pointer border-0"
                  />
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.username.trim()}
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 ml-2"
                >
                  {editingContact ? 'Update' : 'Add'}
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Feature Toggles - at top */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Enable Features</h4>
              <div className="grid grid-cols-4 gap-2">
                <div
                  onClick={() => setFormData({ ...formData, engagement_enabled: !formData.engagement_enabled })}
                  className="flex items-center gap-1 p-2 border rounded-lg cursor-pointer hover:bg-white text-xs"
                >
                  <Checkbox checked={formData.engagement_enabled} />
                  <Heart className="w-3 h-3 text-purple-500" />
                  <span>Engagement</span>
                </div>
                <div
                  onClick={() => setFormData({ ...formData, calendar_enabled: !formData.calendar_enabled })}
                  className="flex items-center gap-1 p-2 border rounded-lg cursor-pointer hover:bg-white text-xs"
                >
                  <Checkbox checked={formData.calendar_enabled} />
                  <Calendar className="w-3 h-3 text-blue-500" />
                  <span>Calendar</span>
                </div>
                <div
                  onClick={() => setFormData({ ...formData, is_gifter: !formData.is_gifter })}
                  className="flex items-center gap-1 p-2 border rounded-lg cursor-pointer hover:bg-white text-xs"
                >
                  <Checkbox checked={formData.is_gifter} />
                  <Gift className="w-3 h-3 text-amber-500" />
                  <span>Gifter</span>
                </div>
                <div
                  onClick={() => setFormData({ ...formData, add_to_my_people: !formData.add_to_my_people })}
                  className="flex items-center gap-1 p-2 border rounded-lg cursor-pointer hover:bg-white text-xs"
                >
                  <Checkbox checked={formData.add_to_my_people} />
                  <Users className="w-3 h-3 text-green-500" />
                  <span>My People</span>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>TikTok Username *</Label>
                <Input
                  placeholder="@username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Display Name</Label>
                <Input
                  placeholder="e.g., Sarah from Texas"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                />
              </div>
            </div>

            {/* Roles - directly under username */}
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(roleConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <div
                      key={key}
                      onClick={() => toggleRole(key)}
                      className={`p-1.5 rounded-lg border-2 cursor-pointer text-xs ${
                        formData.role.includes(key)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <Checkbox checked={formData.role.includes(key)} className="h-3 w-3" />
                        <Icon className="w-3 h-3" />
                        <span className="truncate">{config.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Custom roles */}
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Add custom role..."
                  value={customRoleInput}
                  onChange={(e) => setCustomRoleInput(e.target.value)}
                  className="flex-1 h-8 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customRoleInput.trim()) {
                      const customRole = `custom:${customRoleInput.trim()}`;
                      if (!formData.role.includes(customRole)) {
                        setFormData({ ...formData, role: [...formData.role, customRole] });
                      }
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
                      if (!formData.role.includes(customRole)) {
                        setFormData({ ...formData, role: [...formData.role, customRole] });
                      }
                      setCustomRoleInput('');
                    }
                  }}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              
              {/* Display custom roles */}
              {formData.role.filter(r => r.startsWith('custom:')).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formData.role.filter(r => r.startsWith('custom:')).map(role => (
                    <Badge
                      key={role}
                      variant="secondary"
                      className="cursor-pointer text-xs"
                      onClick={() => setFormData({ ...formData, role: formData.role.filter(r => r !== role) })}
                    >
                      {role.replace('custom:', '')} ✕
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Any notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {/* Engagement Settings */}
            {formData.engagement_enabled && (
              <div className="space-y-4 p-4 border-l-4 border-purple-400 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-sm text-purple-800">Engagement Settings</h4>
                
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={formData.engagement_frequency} onValueChange={(v) => setFormData({ ...formData, engagement_frequency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="multiple_per_week">Specific Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.engagement_frequency === 'multiple_per_week' && (
                  <div className="space-y-2">
                    <Label>Days</Label>
                    <div className="flex flex-wrap gap-2">
                      {daysOfWeek.map(day => (
                        <Badge
                          key={day}
                          variant={formData.engagement_days.includes(day) ? 'default' : 'outline'}
                          className="cursor-pointer"
                          onClick={() => toggleDay(day)}
                        >
                          {day.slice(0, 3)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Categories - multi-select */}
            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Categories</Label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <Badge
                    key={cat.id}
                    variant={formData.categories.includes(cat.id) ? 'default' : 'outline'}
                    className="cursor-pointer font-medium"
                    style={formData.categories.includes(cat.id) ? { backgroundColor: cat.color, color: '#fff' } : { borderColor: cat.color, color: cat.color, borderWidth: '2px' }}
                    onClick={() => {
                      setFormData({
                        ...formData,
                        categories: formData.categories.includes(cat.id)
                          ? formData.categories.filter(c => c !== cat.id)
                          : [...formData.categories, cat.id]
                      });
                    }}
                  >
                    {cat.name}
                  </Badge>
                ))}
                {categories.length === 0 && (
                  <p className="text-sm text-gray-600">No categories yet. Click "Categories" button to create some.</p>
                )}
              </div>
            </div>

            {/* Gifter Settings */}
            {formData.is_gifter && (
              <div className="space-y-3 p-4 border-l-4 border-amber-400 bg-amber-50 rounded-lg">
                <h4 className="font-semibold text-sm text-amber-800">Gifter Settings (for Songs)</h4>
                <p className="text-xs text-gray-600">Display name will be used as the screen name for songs.</p>
                
                <div className="space-y-2">
                  <Label>Phonetic Pronunciation (Optional)</Label>
                  <Input
                    placeholder="e.g., Sheri Dee Seven Seven Seven"
                    value={formData.phonetic}
                    onChange={(e) => setFormData({ ...formData, phonetic: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">How to pronounce for songs (leave blank to use display name)</p>
                </div>
              </div>
            )}

            {/* Tabs for Mods, Connected Through, Social, Details */}
            <Tabs defaultValue="social" className="w-full">
              <TabsList className="w-full grid grid-cols-4">
                <TabsTrigger value="social" className="data-[state=active]:bg-teal-100 data-[state=active]:text-teal-700">Social Links</TabsTrigger>
                <TabsTrigger value="mods" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">Mods</TabsTrigger>
                <TabsTrigger value="connections" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">Connected</TabsTrigger>
                <TabsTrigger value="details" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700">Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="social" className="p-3 border rounded-b-lg bg-teal-50/50 space-y-4">
                {/* Other TikTok Accounts */}
                <div className="space-y-2">
                  <Label className="font-semibold">Other TikTok Accounts</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="@otheraccount"
                      value={newOtherTikTok}
                      onChange={(e) => setNewOtherTikTok(e.target.value)}
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newOtherTikTok.trim()) {
                          const cleaned = newOtherTikTok.replace('@', '').trim();
                          if (!formData.other_tiktok_accounts.includes(cleaned)) {
                            setFormData({ ...formData, other_tiktok_accounts: [...formData.other_tiktok_accounts, cleaned] });
                          }
                          setNewOtherTikTok('');
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (newOtherTikTok.trim()) {
                          const cleaned = newOtherTikTok.replace('@', '').trim();
                          if (!formData.other_tiktok_accounts.includes(cleaned)) {
                            setFormData({ ...formData, other_tiktok_accounts: [...formData.other_tiktok_accounts, cleaned] });
                          }
                          setNewOtherTikTok('');
                        }
                      }}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {formData.other_tiktok_accounts.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.other_tiktok_accounts.map((acc, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="cursor-pointer bg-pink-100 text-pink-700"
                          onClick={() => setFormData({ ...formData, other_tiktok_accounts: formData.other_tiktok_accounts.filter((_, i) => i !== idx) })}
                        >
                          @{acc} ✕
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Other Social Media Links */}
                <div className="space-y-3">
                  <Label className="font-semibold">Other Social Media</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Instagram</Label>
                      <Input
                        placeholder="@username"
                        value={formData.social_links?.instagram || ''}
                        onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, instagram: e.target.value } })}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Facebook</Label>
                      <Input
                        placeholder="username or URL"
                        value={formData.social_links?.facebook || ''}
                        onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, facebook: e.target.value } })}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">YouTube</Label>
                      <Input
                        placeholder="channel name or URL"
                        value={formData.social_links?.youtube || ''}
                        onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, youtube: e.target.value } })}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">X (Twitter)</Label>
                      <Input
                        placeholder="@handle"
                        value={formData.social_links?.twitter || ''}
                        onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, twitter: e.target.value } })}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">LinkedIn</Label>
                      <Input
                        placeholder="profile URL"
                        value={formData.social_links?.linkedin || ''}
                        onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, linkedin: e.target.value } })}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Threads</Label>
                      <Input
                        placeholder="@username"
                        value={formData.social_links?.threads || ''}
                        onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, threads: e.target.value } })}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Twitch</Label>
                      <Input
                        placeholder="username"
                        value={formData.social_links?.twitch || ''}
                        onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, twitch: e.target.value } })}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Discord</Label>
                      <Input
                        placeholder="username#1234 or server"
                        value={formData.social_links?.discord || ''}
                        onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, discord: e.target.value } })}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Snapchat</Label>
                      <Input
                        placeholder="username"
                        value={formData.social_links?.snapchat || ''}
                        onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, snapchat: e.target.value } })}
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500">Pinterest</Label>
                      <Input
                        placeholder="username"
                        value={formData.social_links?.pinterest || ''}
                        onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, pinterest: e.target.value } })}
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="mods" className="p-3 border rounded-b-lg bg-purple-50/50 space-y-3">
                <div className="space-y-2">
                  <Label>Mods For (who they mod for)</Label>
                  <Select
                    value=""
                    onValueChange={(v) => {
                      if (v && !formData.mods_for.includes(v)) {
                        setFormData({ ...formData, mods_for: [...formData.mods_for, v] });
                      }
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select contact..." /></SelectTrigger>
                    <SelectContent>
                      {contacts.filter(c => c.id !== editingContact?.id && !formData.mods_for.includes(c.id)).map(c => (
                        <SelectItem key={c.id} value={c.id}>@{c.username}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Or add new @username..."
                      value={newModForName}
                      onChange={(e) => setNewModForName(e.target.value)}
                      className="flex-1"
                    />
                    {newModForName && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => createAndLinkMutation.mutate({ username: newModForName, linkType: 'mods_for' })}
                        disabled={createAndLinkMutation.isPending}
                      >
                        {createAndLinkMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.mods_for.map(id => {
                      const contact = contacts.find(c => c.id === id);
                      return contact ? (
                        <Badge key={id} variant="secondary" className="cursor-pointer" onClick={() => setFormData({ ...formData, mods_for: formData.mods_for.filter(m => m !== id) })}>
                          @{contact.username} ✕
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Their Mods (who mods for them)</Label>
                  <Select
                    value=""
                    onValueChange={(v) => {
                      if (v && !formData.their_mods.includes(v)) {
                        setFormData({ ...formData, their_mods: [...formData.their_mods, v] });
                      }
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select contact..." /></SelectTrigger>
                    <SelectContent>
                      {contacts.filter(c => c.id !== editingContact?.id && !formData.their_mods.includes(c.id)).map(c => (
                        <SelectItem key={c.id} value={c.id}>@{c.username}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Or add new @username..."
                      value={newTheirModName}
                      onChange={(e) => setNewTheirModName(e.target.value)}
                      className="flex-1"
                    />
                    {newTheirModName && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => createAndLinkMutation.mutate({ username: newTheirModName, linkType: 'their_mods' })}
                        disabled={createAndLinkMutation.isPending}
                      >
                        {createAndLinkMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
                      </Button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.their_mods.map(id => {
                      const contact = contacts.find(c => c.id === id);
                      return contact ? (
                        <Badge key={id} variant="secondary" className="cursor-pointer" onClick={() => setFormData({ ...formData, their_mods: formData.their_mods.filter(m => m !== id) })}>
                          @{contact.username} ✕
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="connections" className="p-3 border rounded-b-lg bg-blue-50/50 space-y-3">
                <div className="space-y-2">
                  <Label>Met Through</Label>
                  <Select
                    value={formData.met_through_id}
                    onValueChange={(v) => setFormData({ ...formData, met_through_id: v, met_through_name: '' })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select or type below..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>None</SelectItem>
                      {contacts.filter(c => c.id !== editingContact?.id).map(c => (
                        <SelectItem key={c.id} value={c.id}>@{c.username}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!formData.met_through_id && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Or type a name..."
                        value={formData.met_through_name || newMetThroughName}
                        onChange={(e) => {
                          setNewMetThroughName(e.target.value);
                          setFormData({ ...formData, met_through_name: e.target.value });
                        }}
                      />
                      {newMetThroughName && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => createAndLinkMutation.mutate({ username: newMetThroughName, linkType: 'met_through' })}
                          disabled={createAndLinkMutation.isPending}
                        >
                          {createAndLinkMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="details" className="p-3 border rounded-b-lg bg-amber-50/50 space-y-3">
                <div className="space-y-2">
                  <Label>Started Going Live</Label>
                  <Input
                    placeholder="e.g., Summer 2023, Early 2024"
                    value={formData.started_going_live}
                    onChange={(e) => setFormData({ ...formData, started_going_live: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>TikTok Live Agency</Label>
                    <Input
                      placeholder="e.g., Agency Name"
                      value={formData.live_agency}
                      onChange={(e) => setFormData({ ...formData, live_agency: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>TT Shop Agency</Label>
                    <Input
                      placeholder="e.g., Shop Agency Name"
                      value={formData.shop_agency}
                      onChange={(e) => setFormData({ ...formData, shop_agency: e.target.value })}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

        </DialogContent>
      </Dialog>

      {/* CSV Import Modal */}
      <Dialog open={showImportModal} onOpenChange={(open) => { setShowImportModal(open); if (!open) { setCsvData([]); setImportError(null); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-teal-600" />
              Import TikTok Leads
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Review the contacts from your TikTok Leads Manager CSV. Existing usernames will be updated with new info.
            </p>
            
            {importError && (
              <Alert className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-700">{importError}</AlertDescription>
              </Alert>
            )}
            
            {importSuccess && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-700 flex items-center gap-2">
                  <Check className="w-4 h-4" /> {importSuccess}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Import Options - Tag with roles */}
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg space-y-3">
              <p className="text-sm font-medium text-teal-800">Tag imported contacts with:</p>
              <div className="flex flex-wrap gap-2">
                {/* Preset roles */}
                {Object.entries(roleConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  const isSelected = importRoles.includes(key);
                  return (
                    <Badge
                      key={key}
                      variant={isSelected ? 'default' : 'outline'}
                      className={`cursor-pointer ${isSelected ? 'bg-purple-600' : config.color}`}
                      onClick={() => {
                        const newRoles = isSelected 
                          ? importRoles.filter(r => r !== key)
                          : [...importRoles, key];
                        setImportRoles(newRoles);
                        setCsvData(prev => prev.map(c => ({ ...c, importRoles: newRoles })));
                      }}
                    >
                      <Icon className="w-3 h-3 mr-1" />
                      {config.label}
                    </Badge>
                  );
                })}
                {/* TikTok Lead custom tag */}
                <Badge
                  variant={importRoles.includes('custom:TikTok Lead') ? 'default' : 'outline'}
                  className={`cursor-pointer ${importRoles.includes('custom:TikTok Lead') ? 'bg-teal-600' : 'bg-teal-100 text-teal-700'}`}
                  onClick={() => {
                    const key = 'custom:TikTok Lead';
                    const isSelected = importRoles.includes(key);
                    const newRoles = isSelected 
                      ? importRoles.filter(r => r !== key)
                      : [...importRoles, key];
                    setImportRoles(newRoles);
                    setCsvData(prev => prev.map(c => ({ ...c, importRoles: newRoles })));
                  }}
                >
                  <UserPlus className="w-3 h-3 mr-1" />
                  TikTok Lead
                </Badge>
              </div>
              {importRoles.length > 0 && (
                <p className="text-xs text-gray-600">
                  {importRoles.length} tag{importRoles.length !== 1 ? 's' : ''} will be applied to all imported contacts
                </p>
              )}
            </div>
            
            {/* Select All */}
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={csvData.length > 0 && csvData.every(c => c.selected)}
                  onCheckedChange={(checked) => setCsvData(prev => prev.map(c => ({ ...c, selected: checked })))}
                />
                <span className="text-sm font-medium">Select All ({csvData.filter(c => c.selected).length}/{csvData.length})</span>
              </div>
            </div>
            
            {/* Contact List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {csvData.map((contact, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    contact.selected ? 'bg-teal-50 border-teal-300' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleCsvSelection(index)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        contact.selected ? 'bg-teal-500 border-teal-500' : 'border-gray-300 bg-white hover:border-teal-400'
                      }`}
                    >
                      {contact.selected && <Check className="w-4 h-4 text-white" />}
                    </button>
                    
                    <div className="grid grid-cols-4 gap-2 flex-1">
                      <Input
                        value={contact.username}
                        onChange={(e) => updateCsvItem(index, 'username', e.target.value)}
                        placeholder="@username"
                        className="h-8 text-sm font-mono"
                      />
                      <Input
                        value={contact.display_name}
                        onChange={(e) => updateCsvItem(index, 'display_name', e.target.value)}
                        placeholder="Display name"
                        className="h-8 text-sm"
                      />
                      <Input
                        value={contact.phone}
                        onChange={(e) => updateCsvItem(index, 'phone', e.target.value)}
                        placeholder="Phone"
                        className="h-8 text-sm"
                      />
                      <Input
                        value={contact.email}
                        onChange={(e) => updateCsvItem(index, 'email', e.target.value)}
                        placeholder="Email"
                        className="h-8 text-sm"
                      />
                    </div>
                    
                    <button
                      onClick={() => setCsvData(prev => prev.filter((_, i) => i !== index))}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowImportModal(false); setCsvData([]); }}>
              Cancel
            </Button>
            <Button
              onClick={() => bulkImportMutation.mutate(csvData)}
              disabled={bulkImportMutation.isPending || csvData.filter(c => c.selected).length === 0}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {bulkImportMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...</>
              ) : (
                <><Check className="w-4 h-4 mr-2" /> Import {csvData.filter(c => c.selected).length} Contacts</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Management Modal */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Categories</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Add new category */}
            <div className="flex gap-2">
              <Input
                placeholder="New category name..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="flex-1"
              />
              <Input
                type="color"
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value)}
                className="w-12 p-1 cursor-pointer"
              />
              <Button
                onClick={() => createCategoryMutation.mutate({ name: newCategoryName, color: newCategoryColor })}
                disabled={!newCategoryName.trim()}
                size="sm"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Existing categories */}
            <div className="space-y-2">
              {categories.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">No categories yet. Add one above!</p>
              ) : (
                categories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span>{cat.name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Delete "${cat.name}" category?`)) {
                          deleteCategoryMutation.mutate(cat.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}