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
  BookOpen, DollarSign, Moon, Sparkles, Lightbulb, Download
} from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { getEffectiveUserEmail } from '../components/admin/ImpersonationBanner';
import SearchableContactSelect from '../components/tiktok/SearchableContactSelect';
import MasterContactPicker from '../components/tiktok/MasterContactPicker';

// Icon-based roles (top row) - ordered in rainbow: red, orange, yellow/amber, green, teal, blue, indigo, purple, pink, gray
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

// Text-based roles (second row)
const textRoles = {
  subscriber: { label: 'Subscriber', text: 'Sub', color: 'bg-cyan-100 text-cyan-700', borderColor: 'border-cyan-300' },
  superfan: { label: 'Superfan', text: 'Superfan', color: 'bg-rose-100 text-rose-700', borderColor: 'border-rose-300' },
  irl_friend: { label: 'Friend IRL', text: 'IRL', color: 'bg-green-100 text-green-700', borderColor: 'border-green-300' },
  discord: { label: 'Discord', text: 'Discord', color: 'bg-violet-100 text-violet-700', borderColor: 'border-violet-300' }
};

// Combined for form usage
const roleConfig = { ...iconRoles, ...textRoles };

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const veteranBranches = [
  { value: 'ARMY', label: 'Army' },
  { value: 'NAVY', label: 'Navy' },
  { value: 'AF', label: 'Air Force' },
  { value: 'USMC', label: 'Marines' },
  { value: 'USCG', label: 'Coast Guard' },
  { value: 'NG', label: 'National Guard' },
  { value: 'Other', label: 'Other/Unknown' }
];

const serviceTypes = [
  { value: 'first_responder', label: 'First Responder (Police, Fire, EMS)' },
  { value: 'healthcare', label: 'Healthcare (Nurse, Doctor, etc.)' },
  { value: 'nonprofit', label: 'Nonprofit' },
  { value: 'ministry', label: 'Ministry/Faith-Based' },
  { value: 'military_family', label: 'Military Family' },
  { value: 'education', label: 'Education (Teacher, etc.)' },
  { value: 'other', label: 'Other Service' }
];

const generations = ['Gen Z', 'Millennial', 'Gen X', 'Boomer', 'Silent', 'Other'];
const genders = ['Female', 'Male', 'Non-binary', 'Other'];

const defaultFamilyRoles = [
  'Mom', 'Dad', 'Single Mom', 'Single Dad', 'SAHM', 'SAHD', 
  'Grandma', 'Grandpa', 'Widow', 'Widower', 'Empty Nester', 
  'Foster Parent', 'Step-Parent', 'Caregiver'
];

const defaultLiveStreamTypes = [
  'Teaching', 'Engagement', 'Entertainment', 'Gaming', 'Music', 
  'Cooking', 'DIY/Crafts', 'Storytime', 'Co-host', 'Battle', 
  'Q&A', 'Unboxing', 'Fitness', 'ASMR', 'Talk Show', 'Religious'
];

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
    engagement_frequency: 'multiple_per_week',
    engagement_days: [],
    engagement_day_of_month: 1,
    color: '#6B7280',
    is_veteran: false,
    veteran_branch: '',
    is_service_professional: false,
    service_type: '',
    is_mlm: false,
    occupation: '',
    generation: '',
    gender: '',
    family_roles: [],
    live_stream_types: [],
    birthday: '',
    is_in_recovery: false,
    sobriety_date: '',
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] });
    },
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

        const existing = contacts.find(c => 
          c.username?.toLowerCase() === contact.username?.toLowerCase()
        );

        const masterMatch = allMasterContacts.find(c => {
          const cUsername = (c.data?.username || c.username || '').toLowerCase();
          return cUsername === contact.username?.toLowerCase();
        });
        const masterDisplayName = masterMatch?.data?.display_name || masterMatch?.display_name;
        const masterPhonetic = masterMatch?.data?.phonetic || masterMatch?.phonetic;

        if (existing) {
          await base44.entities.TikTokContact.update(existing.id, {
            display_name: masterDisplayName || contact.display_name || existing.display_name,
            real_name: contact.real_name || existing.real_name,
            phonetic: masterPhonetic || existing.phonetic,
            phone: contact.phone || existing.phone,
            email: contact.email || existing.email,
            lead_received_at: contact.lead_received_at || existing.lead_received_at,
            lead_source: contact.lead_source || existing.lead_source,
          });
          results.push({ ...contact, action: 'updated' });
        } else {
          await base44.entities.TikTokContact.create({
            username: contact.username,
            display_name: masterDisplayName || contact.display_name,
            real_name: contact.real_name,
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
      engagement_frequency: 'multiple_per_week',
      engagement_days: [],
      engagement_day_of_month: 1,
      color: '#6B7280',
      is_veteran: false,
      veteran_branch: '',
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
      engagement_frequency: contact.engagement_frequency || 'multiple_per_week',
      engagement_days: contact.engagement_days || [],
      engagement_day_of_month: contact.engagement_day_of_month || 1,
      color: contact.color || '#8B5CF6',
      is_veteran: contact.is_veteran || false,
      veteran_branch: contact.veteran_branch || '',
      is_service_professional: contact.is_service_professional || false,
      service_type: contact.service_type || '',
      is_mlm: contact.is_mlm || false,
      occupation: contact.occupation || '',
      generation: contact.generation || '',
      gender: contact.gender || '',
      family_roles: contact.family_roles || [],
      live_stream_types: contact.live_stream_types || [],
      birthday: contact.birthday || '',
      is_in_recovery: contact.is_in_recovery || false,
      sobriety_date: contact.sobriety_date || '',
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

      const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
      const usernameIdx = headers.findIndex(h => h === 'user name' || h === 'username' || h.includes('user name'));
      const displayNameIdx = headers.findIndex(h => h === 'display name' || h === 'displayname' || h === 'display_name');
      // "Name" column = real name from lead form (not display name, not username)
      const realNameIdx = headers.findIndex(h => h === 'name' && !h.includes('display') && !h.includes('user'));
      const phoneIdx = headers.findIndex(h => h.includes('phone'));
      const emailIdx = headers.findIndex(h => h === 'email' || h.includes('email'));
      const receivedDateIdx = headers.findIndex(h => h === 'received date' || h.includes('received date'));
      const receivedTimeIdx = headers.findIndex(h => h === 'received time' || h.includes('received time'));
      const sourceIdx = headers.findIndex(h => h === 'source scenario' || h.includes('source scenario') || h === 'source');

      if (usernameIdx === -1) {
        setImportError('Could not find "User Name" column in CSV. Found columns: ' + headers.join(', '));
        return;
      }

      const parsed = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const values = parseCSVLine(lines[i]);
        const username = values[usernameIdx]?.replace('@', '').trim();
        if (!username) continue;

        let leadReceivedAt = '';
        if (receivedDateIdx >= 0 && values[receivedDateIdx]) {
          const datePart = values[receivedDateIdx];
          const timePart = receivedTimeIdx >= 0 ? values[receivedTimeIdx] : '';
          if (timePart) {
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
          real_name: realNameIdx >= 0 ? values[realNameIdx] : '',
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
    e.target.value = '';
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

  const quickFilterRoles = ['subscriber', 'superfan', 'irl_friend', 'discord', 'custom:TikTok Lead'];
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

  const leadSourceConfig = {
    'LIVE': { icon: Video, label: 'Live', color: 'text-red-500' },
    'Profile': { icon: Users, label: 'Profile', color: 'text-blue-500' },
    'Post': { icon: Share2, label: 'Post', color: 'text-green-500' },
    'Battle': { icon: Swords, label: 'Battle', color: 'text-orange-500' },
    'Referral': { icon: UserPlus, label: 'Referral', color: 'text-purple-500' },
  };

  const ContactCard = ({ contact }) => (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <Card 
        className={`relative overflow-hidden ${contact.is_favorite ? 'ring-2 ring-amber-400' : ''}`}
      >
        <div className="h-2" style={{ backgroundColor: contact.color || '#8B5CF6' }} />
        
        <CardContent className="p-4">
          <div className="absolute top-4 right-3 flex flex-col items-end gap-1">
            <div className="flex items-center gap-1">
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
            {contact.is_veteran && (
              <span 
                className="text-sm"
                title={contact.veteran_branch ? `Veteran - ${contact.veteran_branch}` : 'Veteran'}
              >
                🇺🇸
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 
                  className="font-bold text-lg cursor-pointer hover:text-purple-600"
                  onClick={() => window.open(`https://tiktok.com/@${contact.username}`, '_blank')}
                >
                  @{contact.username}
                </h3>
                {contact.lead_source && (() => {
                  const sourceConfig = leadSourceConfig[contact.lead_source] || { icon: Sparkles, label: contact.lead_source, color: 'text-gray-400' };
                  const SourceIcon = sourceConfig.icon;
                  return (
                    <div
                      className={`p-1 rounded-full bg-gray-100 ${sourceConfig.color}`}
                      title={`Lead: ${sourceConfig.label}${contact.lead_source === 'Referral' && contact.met_through_name ? ` via ${contact.met_through_name}` : ''}`}
                    >
                      <SourceIcon className="w-3 h-3" />
                    </div>
                  );
                })()}
              </div>
              {contact.display_name && (
                <p className="text-gray-600 text-sm">{contact.display_name}</p>
              )}
            </div>

            {contact.notes && (
              <p className="text-sm text-gray-500 italic line-clamp-2">{contact.notes}</p>
            )}

            {/* Roles container - two rows */}
            <div className="space-y-1 pt-2 border-t">
              {/* Icon roles row */}
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
              {/* Text roles row */}
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
                      title={config.label}
                    >
                      <span>{config.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Row - Feature toggles */}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFeatureMutation.mutate({ id: contact.id, field: 'engagement_enabled', currentValue: contact.engagement_enabled });
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all cursor-pointer hover:scale-105 ${
                  contact.engagement_enabled 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
                title="Engagement Tracking"
              >
                <Heart className={`w-3 h-3 ${contact.engagement_enabled ? 'fill-purple-500' : ''}`} />
                <span>Engage</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFeatureMutation.mutate({ id: contact.id, field: 'calendar_enabled', currentValue: contact.calendar_enabled });
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all cursor-pointer hover:scale-105 ${
                  contact.calendar_enabled 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
                title="Creator Calendar"
              >
                <Calendar className={`w-3 h-3 ${contact.calendar_enabled ? 'fill-blue-500' : ''}`} />
                <span>Calendar</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFeatureMutation.mutate({ id: contact.id, field: 'is_gifter', currentValue: contact.is_gifter });
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all cursor-pointer hover:scale-105 ${
                  contact.is_gifter 
                    ? 'bg-amber-100 text-amber-700' 
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
                title="Gifter for Songs"
              >
                <Gift className={`w-3 h-3 ${contact.is_gifter ? 'fill-amber-500' : ''}`} />
                <span>Gifter</span>
              </button>
            </div>
          </div>

          {/* TT Lead Icon - Bottom Right */}
          {contact.role?.includes('custom:TikTok Lead') && (
            <div className="absolute bottom-3 right-3 p-1.5 rounded-full bg-teal-100 text-teal-700" title="TikTok Lead">
              <Lightbulb className="w-4 h-4" />
            </div>
          )}

          {/* Bottom Left Badges */}
              <div className="absolute bottom-3 left-3 flex items-center gap-1">
                {contact.is_service_professional && (
                  <span 
                    className="text-lg"
                    title={contact.service_type ? serviceTypes.find(s => s.value === contact.service_type)?.label : 'Service Professional'}
                  >
                    ❤️
                  </span>
                )}
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
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs md:text-sm text-gray-700"
              onClick={() => {
                // Generate CSV export
                const headers = [
                  'Username', 'Display Name', 'Phonetic', 'Phone', 'Email', 'Notes',
                  'Roles', 'Is Favorite', 'Is Veteran', 'Veteran Branch',
                  'Is Service Professional', 'Service Type', 'Occupation',
                  'Generation', 'Gender', 'Birthday', 'Is In Recovery', 'Sobriety Date',
                  'Family Roles', 'Live Stream Types', 'Other TikTok Accounts',
                  'Instagram', 'Facebook', 'YouTube', 'Twitter', 'LinkedIn',
                  'Engagement Enabled', 'Engagement Frequency', 'Engagement Days',
                  'Calendar Enabled', 'Is Gifter', 'Live Agency', 'Shop Agency',
                  'Started Going Live', 'Lead Source', 'Lead Received At'
                ];

                const rows = contacts.map(c => [
                  c.username || '',
                  c.display_name || '',
                  c.phonetic || '',
                  c.phone || '',
                  c.email || '',
                  (c.notes || '').replace(/"/g, '""'),
                  (c.role || []).join('; '),
                  c.is_favorite ? 'Yes' : 'No',
                  c.is_veteran ? 'Yes' : 'No',
                  c.veteran_branch || '',
                  c.is_service_professional ? 'Yes' : 'No',
                  c.service_type || '',
                  c.occupation || '',
                  c.generation || '',
                  c.gender || '',
                  c.birthday || '',
                  c.is_in_recovery ? 'Yes' : 'No',
                  c.sobriety_date || '',
                  (c.family_roles || []).join('; '),
                  (c.live_stream_types || []).join('; '),
                  (c.other_tiktok_accounts || []).join('; '),
                  c.social_links?.instagram || '',
                  c.social_links?.facebook || '',
                  c.social_links?.youtube || '',
                  c.social_links?.twitter || '',
                  c.social_links?.linkedin || '',
                  c.engagement_enabled ? 'Yes' : 'No',
                  c.engagement_frequency || '',
                  (c.engagement_days || []).join('; '),
                  c.calendar_enabled ? 'Yes' : 'No',
                  c.is_gifter ? 'Yes' : 'No',
                  c.live_agency || '',
                  c.shop_agency || '',
                  c.started_going_live || '',
                  c.lead_source || '',
                  c.lead_received_at || ''
                ]);

                const csvContent = [
                  headers.join(','),
                  ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
                ].join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `tiktok-contacts-backup-${format(new Date(), 'yyyy-MM-dd')}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Backup CSV</span>
            </Button>
            <label className="cursor-pointer">
              <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
              <Button asChild variant="outline" size="sm" className="text-xs md:text-sm text-gray-700">
                <span>
                  <Upload className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Import CSV</span>
                </span>
              </Button>
            </label>
            <Button
              variant="outline"
              size="sm"
              className="text-xs md:text-sm text-gray-700"
              onClick={() => setShowCategoryModal(true)}
            >
              <FolderPlus className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Categories</span>
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
            <TabsTrigger value="all" className="text-xs md:text-sm py-2 px-1 md:px-3">All ({contacts.length})</TabsTrigger>
            <TabsTrigger value="engagement" className="text-xs md:text-sm py-2 px-1 md:px-3"><span className="hidden sm:inline">Engagement</span><span className="sm:hidden">Engage</span> ({contacts.filter(c => c.engagement_enabled).length})</TabsTrigger>
            <TabsTrigger value="calendar" className="text-xs md:text-sm py-2 px-1 md:px-3"><span className="hidden sm:inline">Calendar</span><span className="sm:hidden">Cal</span> ({contacts.filter(c => c.calendar_enabled).length})</TabsTrigger>
            <TabsTrigger value="gifters" className="text-xs md:text-sm py-2 px-1 md:px-3">🎁 <span className="hidden sm:inline">Gifters</span> ({contacts.filter(c => c.is_gifter).length})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by username or display name..."
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
                        {Icon ? <Icon className="w-4 h-4 mr-2" /> : <span className="text-xs font-bold mr-2">{config.text}</span>}
                        {config.label}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Veteran Filter */}
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
                  Clear Filters
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

            {/* Basic Info - Use Master DB Picker for new contacts */}
            {!editingContact && (
              <div className="space-y-2">
                <Label>Search Master Database or Add New</Label>
                <MasterContactPicker
                  masterContacts={allMasterContacts}
                  onSelect={(contact) => {
                    setFormData({
                      ...formData,
                      username: contact.username,
                      display_name: contact.display_name || '',
                      phonetic: contact.phonetic || ''
                    });
                  }}
                  onCreateNew={(username) => {
                    setFormData({
                      ...formData,
                      username: username,
                      display_name: '',
                      phonetic: ''
                    });
                  }}
                  placeholder="Type to search existing contacts or add new..."
                />
                {formData.username && (
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-700">
                      Selected: <strong>@{formData.username}</strong>
                      {formData.display_name && <span className="text-gray-600"> ({formData.display_name})</span>}
                    </p>
                  </div>
                )}
              </div>
            )}

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

            {/* Roles */}
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
                        {Icon ? <Icon className="w-3 h-3" /> : <span className="text-[10px] font-bold">{config.text}</span>}
                        <span className="truncate">{config.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Saved Custom Roles */}
              {savedCustomRoles.length > 0 && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Your Custom Roles</Label>
                  <div className="flex flex-wrap gap-1">
                    {savedCustomRoles.map(role => {
                      const customRole = `custom:${role}`;
                      const isSelected = formData.role.includes(customRole);
                      return (
                        <Badge
                          key={role}
                          variant={isSelected ? 'default' : 'outline'}
                          className={`cursor-pointer text-xs ${isSelected ? 'bg-teal-600' : 'bg-teal-50 text-teal-700 border-teal-300'}`}
                          onClick={() => {
                            if (isSelected) {
                              setFormData({ ...formData, role: formData.role.filter(r => r !== customRole) });
                            } else {
                              setFormData({ ...formData, role: [...formData.role, customRole] });
                            }
                          }}
                        >
                          {role}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add new custom role */}
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="Add new custom role..."
                  value={customRoleInput}
                  onChange={(e) => setCustomRoleInput(e.target.value)}
                  className="flex-1 h-8 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customRoleInput.trim()) {
                      const customRole = `custom:${customRoleInput.trim()}`;
                      if (!formData.role.includes(customRole)) {
                        setFormData({ ...formData, role: [...formData.role, customRole] });
                      }
                      // Save to preferences for future use
                      saveCustomRoleMutation.mutate(customRoleInput.trim());
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
                      // Save to preferences for future use
                      saveCustomRoleMutation.mutate(customRoleInput.trim());
                      setCustomRoleInput('');
                    }
                  }}
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>

              {formData.role.filter(r => r.startsWith('custom:')).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <Label className="text-xs text-gray-500 w-full">Selected Custom Roles:</Label>
                  {formData.role.filter(r => r.startsWith('custom:')).map(role => (
                    <Badge
                      key={role}
                      variant="secondary"
                      className="cursor-pointer text-xs bg-teal-100 text-teal-700"
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
                      <SelectItem value="multiple_per_week">Specific Days</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
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

                {formData.engagement_frequency === 'monthly' && (
                  <div className="space-y-2">
                    <Label>Day of Month</Label>
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
                  </div>
                )}
              </div>
            )}

            {/* Categories */}
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

                <div className="space-y-3">
                  <Label className="font-semibold">Other Social Media</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {['instagram', 'facebook', 'youtube', 'twitter', 'linkedin', 'threads', 'twitch', 'discord', 'snapchat', 'pinterest'].map(platform => (
                      <div key={platform} className="space-y-1">
                        <Label className="text-xs text-gray-500 capitalize">{platform === 'twitter' ? 'X (Twitter)' : platform}</Label>
                        <Input
                          placeholder={`@username`}
                          value={formData.social_links?.[platform] || ''}
                          onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, [platform]: e.target.value } })}
                          className="h-8"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="mods" className="p-3 border rounded-b-lg bg-purple-50/50 space-y-3">
                <div className="space-y-2">
                  <Label>Mods For (who they mod for)</Label>
                  <SearchableContactSelect
                    contacts={contacts.filter(c => c.id !== editingContact?.id && !formData.mods_for.includes(c.id))}
                    value=""
                    onChange={(v) => {
                      if (v && !formData.mods_for.includes(v)) {
                        setFormData({ ...formData, mods_for: [...formData.mods_for, v] });
                      }
                    }}
                    placeholder="Search contacts..."
                    excludeId={editingContact?.id}
                  />
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
                  <SearchableContactSelect
                    contacts={contacts.filter(c => c.id !== editingContact?.id && !formData.their_mods.includes(c.id))}
                    value=""
                    onChange={(v) => {
                      if (v && !formData.their_mods.includes(v)) {
                        setFormData({ ...formData, their_mods: [...formData.their_mods, v] });
                      }
                    }}
                    placeholder="Search contacts..."
                    excludeId={editingContact?.id}
                  />
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
                  <SearchableContactSelect
                    contacts={contacts}
                    value={formData.met_through_id}
                    onChange={(v) => setFormData({ ...formData, met_through_id: v, met_through_name: '' })}
                    placeholder="Search contacts..."
                    excludeId={editingContact?.id}
                  />
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
                {/* Veteran Section */}
                <div className="p-3 rounded-lg bg-gradient-to-r from-red-50 via-white to-blue-50 border border-red-200 space-y-3">
                  <div
                    onClick={() => setFormData({ ...formData, is_veteran: !formData.is_veteran })}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox checked={formData.is_veteran} />
                    <span className="text-lg">🇺🇸</span>
                    <Label className="cursor-pointer font-semibold text-blue-800">Veteran</Label>
                  </div>

                  {formData.is_veteran && (
                    <div className="space-y-2 pl-6">
                      <Label className="text-sm text-gray-600">Branch of Service</Label>
                      <Select 
                        value={formData.veteran_branch} 
                        onValueChange={(v) => setFormData({ ...formData, veteran_branch: v })}
                      >
                        <SelectTrigger><SelectValue placeholder="Select branch..." /></SelectTrigger>
                        <SelectContent>
                          {veteranBranches.map(branch => (
                            <SelectItem key={branch.value} value={branch.value}>{branch.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Service Professional Section */}
                <div className="p-3 rounded-lg bg-pink-50 border border-pink-200 space-y-3">
                  <div
                    onClick={() => setFormData({ ...formData, is_service_professional: !formData.is_service_professional })}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox checked={formData.is_service_professional} />
                    <span className="text-lg">❤️</span>
                    <Label className="cursor-pointer font-semibold text-pink-800">Service Professional</Label>
                  </div>

                  {formData.is_service_professional && (
                    <div className="space-y-2 pl-6">
                      <Label className="text-sm text-gray-600">Type of Service</Label>
                      <Select 
                        value={formData.service_type} 
                        onValueChange={(v) => setFormData({ ...formData, service_type: v })}
                      >
                        <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                        <SelectContent>
                          {serviceTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Birthday & Recovery */}
                <div className="p-3 rounded-lg bg-green-50 border border-green-200 space-y-3">
                  <h4 className="font-semibold text-green-800 text-sm">🎂 Important Dates</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Birthday</Label>
                      <Input
                        type="date"
                        value={formData.birthday}
                        onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <div
                        onClick={() => setFormData({ ...formData, is_in_recovery: !formData.is_in_recovery })}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox checked={formData.is_in_recovery} />
                        <Label className="cursor-pointer text-sm">In Recovery</Label>
                      </div>
                      {formData.is_in_recovery && (
                        <Input
                          type="date"
                          value={formData.sobriety_date}
                          onChange={(e) => setFormData({ ...formData, sobriety_date: e.target.value })}
                          placeholder="Sobriety date"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Demographics Section */}
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 space-y-3">
                  <h4 className="font-semibold text-blue-800 text-sm">Demographics</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-sm">Generation</Label>
                      <Select 
                        value={formData.generation} 
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
                    <div className="space-y-2">
                      <Label className="text-sm">Gender</Label>
                      <Select 
                        value={formData.gender} 
                        onValueChange={(v) => setFormData({ ...formData, gender: v })}
                      >
                        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                        <SelectContent>
                          {genders.map(g => (
                            <SelectItem key={g} value={g}>{g}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Family Roles */}
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 space-y-3">
                  <h4 className="font-semibold text-rose-800 text-sm">Family Roles</h4>
                  <div className="flex flex-wrap gap-1">
                    {defaultFamilyRoles.map(role => (
                      <Badge
                        key={role}
                        variant={formData.family_roles?.includes(role) ? 'default' : 'outline'}
                        className={`cursor-pointer text-xs ${formData.family_roles?.includes(role) ? 'bg-rose-600' : 'bg-rose-50 text-rose-700 border-rose-300'}`}
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
                  {/* Custom family roles display */}
                  {formData.family_roles?.filter(r => !defaultFamilyRoles.includes(r)).length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1 border-t border-rose-200">
                      {formData.family_roles.filter(r => !defaultFamilyRoles.includes(r)).map(role => (
                        <Badge
                          key={role}
                          className="cursor-pointer text-xs bg-rose-600"
                          onClick={() => setFormData({
                            ...formData,
                            family_roles: formData.family_roles.filter(r => r !== role)
                          })}
                        >
                          {role} ✕
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add custom role..."
                      className="h-8 text-xs flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          const newRole = e.target.value.trim();
                          if (!formData.family_roles?.includes(newRole)) {
                            setFormData({
                              ...formData,
                              family_roles: [...(formData.family_roles || []), newRole]
                            });
                          }
                          e.target.value = '';
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Live Stream Types */}
                <div className="p-3 rounded-lg bg-violet-50 border border-violet-200 space-y-3">
                  <h4 className="font-semibold text-violet-800 text-sm">Live Stream Types</h4>
                  <div className="flex flex-wrap gap-1">
                    {defaultLiveStreamTypes.map(type => (
                      <Badge
                        key={type}
                        variant={formData.live_stream_types?.includes(type) ? 'default' : 'outline'}
                        className={`cursor-pointer text-xs ${formData.live_stream_types?.includes(type) ? 'bg-violet-600' : 'bg-violet-50 text-violet-700 border-violet-300'}`}
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
                  {/* Custom live stream types display */}
                  {formData.live_stream_types?.filter(t => !defaultLiveStreamTypes.includes(t)).length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1 border-t border-violet-200">
                      {formData.live_stream_types.filter(t => !defaultLiveStreamTypes.includes(t)).map(type => (
                        <Badge
                          key={type}
                          className="cursor-pointer text-xs bg-violet-600"
                          onClick={() => setFormData({
                            ...formData,
                            live_stream_types: formData.live_stream_types.filter(t => t !== type)
                          })}
                        >
                          {type} ✕
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add custom type..."
                      className="h-8 text-xs flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value.trim()) {
                          const newType = e.target.value.trim();
                          if (!formData.live_stream_types?.includes(newType)) {
                            setFormData({
                              ...formData,
                              live_stream_types: [...(formData.live_stream_types || []), newType]
                            });
                          }
                          e.target.value = '';
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Occupation & MLM */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Occupation / Job Title</Label>
                    <Input
                      placeholder="e.g., Nurse, Teacher, Engineer"
                      value={formData.occupation}
                      onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 flex items-end">
                    <div
                      onClick={() => setFormData({ ...formData, is_mlm: !formData.is_mlm })}
                      className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-white h-10"
                    >
                      <Checkbox checked={formData.is_mlm} />
                      <Label className="cursor-pointer text-sm">MLM / Network Marketing</Label>
                    </div>
                  </div>
                </div>

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
            
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg space-y-3">
              <p className="text-sm font-medium text-teal-800">Tag imported contacts with:</p>
              <div className="flex flex-wrap gap-2">
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
                      {Icon ? <Icon className="w-3 h-3 mr-1" /> : <span className="text-xs font-bold mr-1">{config.text}</span>}
                      {config.label}
                    </Badge>
                  );
                })}
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
                  <Lightbulb className="w-3 h-3 mr-1" />
                  TikTok Lead
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={csvData.length > 0 && csvData.every(c => c.selected)}
                  onCheckedChange={(checked) => setCsvData(prev => prev.map(c => ({ ...c, selected: checked })))}
                />
                <span className="text-sm font-medium">Select All ({csvData.filter(c => c.selected).length}/{csvData.length})</span>
              </div>
            </div>
            
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
                    
                    <div className="grid grid-cols-6 gap-2 flex-1">
                      <Input
                        value={contact.username}
                        onChange={(e) => updateCsvItem(index, 'username', e.target.value)}
                        placeholder="@username"
                        className="h-8 text-sm font-mono"
                      />
                      <Input
                        value={contact.real_name}
                        onChange={(e) => updateCsvItem(index, 'real_name', e.target.value)}
                        placeholder="Real name"
                        className="h-8 text-sm"
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
                      <Input
                        value={contact.lead_source}
                        onChange={(e) => updateCsvItem(index, 'lead_source', e.target.value)}
                        placeholder="Source"
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