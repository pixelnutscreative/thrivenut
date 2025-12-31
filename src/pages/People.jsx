import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Trash2, Edit, Star, Phone, Search, 
  Cake, Heart, Briefcase, Users, Building2, ChevronDown, ChevronRight, UserPlus, Users2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, differenceInDays } from 'date-fns';
import { getEffectiveUserEmail } from '../components/admin/ImpersonationBanner';
import ContactFormHeader from '../components/contacts/ContactFormHeader';
import TikTokTabContent from '../components/contacts/TikTokTabContent';
import PersonalTabContent from '../components/contacts/PersonalTabContent';
import BusinessTabContent from '../components/contacts/BusinessTabContent';
import ProfileFavoritesTab from '../components/contacts/ProfileFavoritesTab';
import MomentsTabContent from '../components/contacts/MomentsTabContent';
import { useTheme } from '../components/shared/useTheme';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Import Family Member logic/components if needed, or just redirect for now
// For this merge, we'll fetch FamilyMembers here

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
  tiktok_notes_text: '',
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

export default function People() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formTab, setFormTab] = useState('personal');
  const defaultFormTab = 'personal'; // My People opens to Personal tab
  const [formData, setFormData] = useState(defaultFormData);
  const [user, setUser] = useState(null);
  
  // Family/Contact Type State
  const [contactType, setContactType] = useState('contact'); // 'contact' or 'family'
  const [viewMode, setViewMode] = useState('mine'); // 'mine' or 'theirs'
  const [linkedProfile, setLinkedProfile] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const effectiveEmail = user ? getEffectiveUserEmail(user.email) : null;

  const { data: contacts = [] } = useQuery({
    queryKey: ['tiktokContacts', effectiveEmail],
    queryFn: () => base44.entities.TikTokContact.filter({ created_by: effectiveEmail }, '-created_date'),
    enabled: !!effectiveEmail,
  });

  const { data: familyMembers = [] } = useQuery({
    queryKey: ['familyMembers', effectiveEmail],
    queryFn: () => base44.entities.FamilyMember.filter({ is_active: true, created_by: effectiveEmail }, 'name'),
    enabled: !!effectiveEmail,
  });

  // Family Member Mutations
  const createFamilyMutation = useMutation({
    mutationFn: (data) => base44.entities.FamilyMember.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyMembers'] });
      closeModal();
    }
  });

  const updateFamilyMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FamilyMember.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyMembers'] });
      closeModal();
    }
  });

  const deleteFamilyMutation = useMutation({
    mutationFn: (id) => base44.entities.FamilyMember.update(id, { is_active: false }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['familyMembers'] }),
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
      const existing = sharedClubs.find(c => c.name.toLowerCase() === clubName.toLowerCase());
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

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TikTokContact.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] }); closeModal(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TikTokContact.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] }); closeModal(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TikTokContact.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] }),
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }) => base44.entities.TikTokContact.update(id, { is_favorite: !isFavorite }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] }),
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingContact(null);
    setFormData(defaultFormData);
    setFormTab(defaultFormTab);
    setContactType('contact');
    setViewMode('mine');
    setLinkedProfile(null);
  };

  const handleEdit = async (contact, type = 'contact') => {
    setEditingContact(contact);
    setContactType(type);
    
    // Check if it's a family member to set up linked profile data
    if (type === 'family' && contact.linked_user_email) {
      try {
        const res = await base44.functions.invoke('profile', { action: 'get_profile', email: contact.linked_user_email });
        if (res.data.found && res.data.profile) {
          setLinkedProfile(res.data.profile);
        }
      } catch (e) {
        console.error("Failed to fetch linked profile", e);
      }
    }

    setFormData({
      ...defaultFormData,
      ...contact,
      // Ensure nested objects exist for family members
      clothing_sizes: contact.clothing_sizes || {},
      beauty_profile: contact.beauty_profile || {},
      style_profile: contact.style_profile || {},
      food_profile: contact.food_profile || {},
      wish_list: contact.wish_list || [],
      memorable_moments: contact.memorable_moments || []
    });
    
    // Default tab logic
    if (type === 'family') {
      setFormTab('family_basic');
    } else {
      setFormTab(defaultFormTab);
    }
    
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (contactType === 'family') {
      // Family Member Submission
      const familyData = {
        ...formData,
        age: formData.age ? parseInt(formData.age) : null,
        // Ensure standard fields map correctly
        name: formData.name || formData.real_name || formData.nickname,
        created_by: effectiveEmail
      };
      
      if (editingContact) {
        updateFamilyMutation.mutate({ id: editingContact.id, data: familyData });
      } else {
        createFamilyMutation.mutate(familyData);
      }
    } else {
      // Standard Contact Submission
      const cleanData = {
        ...formData,
        username: (formData.username || '').replace('@', '').trim(),
        is_irl_contact: true, // Always mark as IRL when created from My People
        created_by: effectiveEmail
      };
      
      if (editingContact) {
        updateMutation.mutate({ id: editingContact.id, data: cleanData });
      } else {
        createMutation.mutate(cleanData);
      }
    }
  };

  const handleQuickAddContact = async (username) => {
    try {
      const newContact = await base44.entities.TikTokContact.create({
        username: username,
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

  // Get upcoming birthdays (within 30 days)
  const getUpcomingBirthdays = () => {
    const today = new Date();
    return contacts.filter(c => {
      if (!c.birthday) return false;
      const bday = parseISO(c.birthday);
      const thisYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
      if (thisYearBday < today) thisYearBday.setFullYear(today.getFullYear() + 1);
      const diff = differenceInDays(thisYearBday, today);
      return diff >= 0 && diff <= 30;
    }).sort((a, b) => {
      const today = new Date();
      const bdayA = parseISO(a.birthday);
      const bdayB = parseISO(b.birthday);
      const thisYearA = new Date(today.getFullYear(), bdayA.getMonth(), bdayA.getDate());
      const thisYearB = new Date(today.getFullYear(), bdayB.getMonth(), bdayB.getDate());
      if (thisYearA < today) thisYearA.setFullYear(today.getFullYear() + 1);
      if (thisYearB < today) thisYearB.setFullYear(today.getFullYear() + 1);
      return thisYearA - thisYearB;
    });
  };

  const upcomingBirthdays = getUpcomingBirthdays();

  const { isDark, bgClass, textClass, cardBgClass, subtextClass } = useTheme();

  // Deduplication Logic:
  // If a TikTokContact (Friend/Lead) has the same name as a FamilyMember, 
  // we consider the FamilyMember the primary record and hide the TikTokContact from the "Friend" list
  // to avoid duplication in the UI.
  const familyNames = familyMembers.map(f => f.name.toLowerCase());
  
  // Categorize Contacts
  const familyContacts = familyMembers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.linked_user_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const friendsContacts = contacts.filter(c => {
    // Only show if not in family list (by name match)
    const isDuplicate = familyNames.includes(c.display_name?.toLowerCase()) || familyNames.includes(c.real_name?.toLowerCase());
    if (isDuplicate) return false;

    // Filter logic
    const matchesSearch = 
      c.real_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Default to "Friends" if IRL and not business
    const isBusiness = c.role?.includes('client') || c.role?.includes('lead') || c.businesses?.length > 0;
    return matchesSearch && c.is_irl_contact && !isBusiness;
  });

  const businessContacts = contacts.filter(c => {
    // Only show if not in family list
    const isDuplicate = familyNames.includes(c.display_name?.toLowerCase()) || familyNames.includes(c.real_name?.toLowerCase());
    if (isDuplicate) return false;

    const matchesSearch = 
      c.real_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Business logic
    const isBusiness = c.role?.includes('client') || c.role?.includes('lead') || c.businesses?.length > 0;
    return matchesSearch && (c.is_irl_contact || c.is_service_professional) && isBusiness;
  });

  // State for collapsible sections
  const [openSections, setOpenSections] = useState(['Family', 'Friends', 'Business']);

  const toggleSection = (section) => {
    setOpenSections(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const PeopleGrid = ({ items, type }) => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AnimatePresence>
        {items.map((contact, index) => {
          if (type === 'family') {
            // Render Family Card
            return (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`relative overflow-hidden ${cardBgClass} hover:shadow-md transition-shadow`}>
                  <div className="h-2" style={{ backgroundColor: contact.favorite_color || '#FF69B4' }} />
                  <div className="absolute top-4 right-3 flex items-center gap-1">
                    <button onClick={() => handleEdit(contact, 'family')} className={`p-1 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded`}>
                      <Edit className={`w-4 h-4 ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`} />
                    </button>
                    <button onClick={() => { if (confirm('Delete this family member?')) deleteFamilyMutation.mutate(contact.id); }} className={`p-1 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded`}>
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {contact.profile_image_url ? (
                        <img src={contact.profile_image_url} alt={contact.name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl bg-purple-100 text-purple-600">
                          {contact.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className={`font-bold ${textClass}`}>{contact.name}</h3>
                        <p className={`text-sm ${subtextClass} capitalize`}>{contact.relationship}</p>
                      </div>
                    </div>
                    {/* Tiny badges for quick info */}
                    <div className="flex gap-2 mt-3">
                        {contact.clothing_sizes?.top && <span className="text-[10px] px-2 py-1 bg-blue-50 text-blue-700 rounded-full">Sizes 👕</span>}
                        {contact.food_profile?.likes && <span className="text-[10px] px-2 py-1 bg-green-50 text-green-700 rounded-full">Food 🥗</span>}
                        {contact.wish_list?.length > 0 && <span className="text-[10px] px-2 py-1 bg-pink-50 text-pink-700 rounded-full">{contact.wish_list.length} Wishes 🎁</span>}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          } else {
            // Render Friend/Business Card (Existing Logic)
            const displayName = contact.real_name || contact.nickname || contact.display_name || `@${contact.username}`;
            return (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`relative overflow-hidden ${contact.is_favorite ? 'ring-2 ring-amber-400' : ''} ${cardBgClass}`}>
                  <div className="h-2" style={{ backgroundColor: contact.color || '#8B5CF6' }} />
                  
                  <div className="absolute top-4 right-3 flex items-center gap-1">
                    <button onClick={() => handleEdit(contact)} className={`p-1 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded`}>
                      <Edit className={`w-4 h-4 ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`} />
                    </button>
                    <button onClick={() => { if (confirm('Delete this contact?')) deleteMutation.mutate(contact.id); }} className={`p-1 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded`}>
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {contact.image_url ? (
                        <img src={contact.image_url} alt={displayName} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-lg font-bold">
                          {displayName?.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold text-base truncate ${textClass}`}>{displayName}</h3>
                        {contact.username && (
                          <p className="text-xs text-purple-600">@{contact.username}</p>
                        )}
                        {contact.phone && (
                          <p className={`text-xs ${subtextClass} flex items-center gap-1 mt-1`}>
                            <Phone className="w-3 h-3" /> {contact.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          }
        })}
      </AnimatePresence>
    </div>
  );

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${textClass}`}>My People</h1>
            <p className={`${subtextClass} mt-1`}>All your connections in one place</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
                <Plus className="w-4 h-4 mr-2" /> Add Person
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                setContactType('family');
                setFormData({ ...defaultFormData, relationship: 'child', is_child_account: true }); // Default to child for ease
                setFormTab('family_basic');
                setShowModal(true);
              }}>
                <Users2 className="w-4 h-4 mr-2" />
                Add Child / Family
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setContactType('contact');
                setFormData(defaultFormData);
                setFormTab('personal');
                setShowModal(true);
              }}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Friend / Contact
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search */}
        <Card className={cardBgClass}>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search everyone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 ${isDark ? 'bg-gray-700 border-gray-600' : ''}`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Collapsible Sections */}
        <div className="space-y-4">
          {/* Family Section */}
          <Collapsible open={openSections.includes('Family')} onOpenChange={() => toggleSection('Family')}>
            <div className="flex items-center justify-between mb-2">
              <CollapsibleTrigger className="flex items-center gap-2 font-semibold text-lg text-gray-700 hover:text-purple-600 transition-colors">
                {openSections.includes('Family') ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                Family ({familyContacts.length})
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              {familyContacts.length > 0 ? (
                <PeopleGrid items={familyContacts} type="family" />
              ) : (
                <div className="p-8 text-center text-gray-400 bg-white/50 rounded-lg border border-dashed">
                  No family members found.
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          <div className="h-px bg-gray-200" />

          {/* Friends Section */}
          <Collapsible open={openSections.includes('Friends')} onOpenChange={() => toggleSection('Friends')}>
            <div className="flex items-center justify-between mb-2">
              <CollapsibleTrigger className="flex items-center gap-2 font-semibold text-lg text-gray-700 hover:text-purple-600 transition-colors">
                {openSections.includes('Friends') ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                Friends & IRL ({friendsContacts.length})
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              {friendsContacts.length > 0 ? (
                <PeopleGrid items={friendsContacts} type="friend" />
              ) : (
                <div className="p-8 text-center text-gray-400 bg-white/50 rounded-lg border border-dashed">
                  No friends found.
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          <div className="h-px bg-gray-200" />

          {/* Business Section */}
          <Collapsible open={openSections.includes('Business')} onOpenChange={() => toggleSection('Business')}>
            <div className="flex items-center justify-between mb-2">
              <CollapsibleTrigger className="flex items-center gap-2 font-semibold text-lg text-gray-700 hover:text-purple-600 transition-colors">
                {openSections.includes('Business') ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                Business & Clients ({businessContacts.length})
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent>
              {businessContacts.length > 0 ? (
                <PeopleGrid items={businessContacts} type="friend" />
              ) : (
                <div className="p-8 text-center text-gray-400 bg-white/50 rounded-lg border border-dashed">
                  No business contacts found.
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Add/Edit Modal - Same as TikTok Contacts but opens to Personal tab */}
      <Dialog open={showModal} onOpenChange={(open) => { if (!open) closeModal(); }} >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingContact ? 'Edit Contact' : 'Add Contact'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* View Toggle for Linked Profiles */}
            {linkedProfile && (
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200 mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${viewMode === 'theirs' ? 'bg-purple-600' : 'bg-gray-400'}`} />
                  <span className="text-sm font-medium text-purple-900">
                    {viewMode === 'theirs' ? `Viewing ${linkedProfile.nickname || 'Linked User'}'s Profile` : 'Editing My Notes'}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg p-1 border">
                  <button
                    onClick={() => setViewMode('mine')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      viewMode === 'mine' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    My View
                  </button>
                  <button
                    onClick={() => setViewMode('theirs')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      viewMode === 'theirs' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Their View
                  </button>
                </div>
              </div>
            )}

            {contactType === 'contact' ? (
              <>
                <ContactFormHeader
                  formData={formData}
                  setFormData={setFormData}
                  onSave={handleSubmit}
                  isSaving={createMutation.isPending || updateMutation.isPending}
                  isEditing={!!editingContact}
                  sharedClubs={sharedClubs}
                  onAddSharedClub={(name) => addSharedClubMutation.mutate(name)}
                />

                <Tabs value={formTab} onValueChange={setFormTab}>
                  <TabsList className="w-full grid grid-cols-5">
                    <TabsTrigger value="personal" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 text-xs px-1">Personal</TabsTrigger>
                    <TabsTrigger value="favorites" className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-700 text-xs px-1">Favorites</TabsTrigger>
                    <TabsTrigger value="moments" className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700 text-xs px-1">Moments</TabsTrigger>
                    <TabsTrigger value="business" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700 text-xs px-1">Business</TabsTrigger>
                    <TabsTrigger value="tiktok" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 text-xs px-1">TikTok</TabsTrigger>
                  </TabsList>

                  <TabsContent value="personal" className="mt-4">
                    <PersonalTabContent formData={formData} setFormData={setFormData} />
                  </TabsContent>
                  <TabsContent value="favorites" className="mt-4">
                    <ProfileFavoritesTab formData={formData} setFormData={setFormData} linkedEmail={formData.linked_user_email || formData.claimed_by_email} />
                  </TabsContent>
                  <TabsContent value="moments" className="mt-4">
                    <MomentsTabContent formData={formData} setFormData={setFormData} />
                  </TabsContent>
                  <TabsContent value="business" className="mt-4">
                    <BusinessTabContent formData={formData} setFormData={setFormData} />
                  </TabsContent>
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
                </Tabs>
              </>
            ) : (
              // FAMILY MEMBER FORM
              <>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg text-purple-800">
                    {editingContact ? `Edit ${formData.name || 'Family Member'}` : 'Add Family Member'}
                  </h3>
                  <Button onClick={handleSubmit} disabled={createFamilyMutation.isPending || updateFamilyMutation.isPending} className="bg-purple-600 text-white">
                    {(createFamilyMutation.isPending || updateFamilyMutation.isPending) ? 'Saving...' : 'Save Profile'}
                  </Button>
                </div>

                <Tabs value={formTab} onValueChange={setFormTab}>
                  <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="family_basic" className="text-xs">Basic Info</TabsTrigger>
                    <TabsTrigger value="family_favorites" className="text-xs">Favorites & Style</TabsTrigger>
                    <TabsTrigger value="family_moments" className="text-xs">Moments</TabsTrigger>
                  </TabsList>

                  <TabsContent value="family_basic" className="mt-4 space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Name</Label>
                            <Input value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Full Name" />
                          </div>
                          <div className="space-y-2">
                            <Label>Nickname</Label>
                            <Input value={formData.nickname || ''} onChange={(e) => setFormData({...formData, nickname: e.target.value})} placeholder="Nickname" />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Relationship</Label>
                            <Select value={formData.relationship} onValueChange={(v) => setFormData({ ...formData, relationship: v })}>
                              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="child">Child</SelectItem>
                                <SelectItem value="spouse">Spouse</SelectItem>
                                <SelectItem value="parent">Parent</SelectItem>
                                <SelectItem value="sibling">Sibling</SelectItem>
                                <SelectItem value="close_friend">Close Friend</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Age</Label>
                            <Input type="number" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                            <Label>Birthday</Label>
                            <Input type="date" value={formData.birthday || ''} onChange={(e) => setFormData({...formData, birthday: e.target.value})} />
                          </div>
                           <div className="space-y-2">
                            <Label>Sobriety Date</Label>
                            <Input type="date" value={formData.sobriety_date || ''} onChange={(e) => setFormData({...formData, sobriety_date: e.target.value})} />
                          </div>
                        </div>

                        {formData.relationship === 'child' && (
                          <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div>
                              <Label className="font-bold text-yellow-800">Enable Kid Mode?</Label>
                              <p className="text-xs text-yellow-700">Creates a simplified dashboard for them.</p>
                            </div>
                            <Switch 
                              checked={formData.is_child_account} 
                              onCheckedChange={(c) => setFormData({ ...formData, is_child_account: c })} 
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label>Linked Thrive Account (Email)</Label>
                          <Input 
                            value={formData.linked_user_email} 
                            onChange={(e) => setFormData({...formData, linked_user_email: e.target.value})} 
                            placeholder="user@example.com" 
                          />
                          <p className="text-xs text-gray-500">Links their wishlist and preferences if they have an account.</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="family_favorites" className="mt-4">
                    <ProfileFavoritesTab 
                      formData={formData} 
                      setFormData={setFormData}
                      isProfile={false}
                      linkedProfileData={viewMode === 'theirs' ? linkedProfile : null}
                      linkedEmail={formData.linked_user_email}
                    />
                  </TabsContent>

                  <TabsContent value="family_moments" className="mt-4">
                    <MomentsTabContent formData={formData} setFormData={setFormData} />
                  </TabsContent>
                </Tabs>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}