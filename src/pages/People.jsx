import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Trash2, Edit, Star, Phone, Search, 
  Cake, Heart, Briefcase, Users, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, differenceInDays } from 'date-fns';
import { getEffectiveUserEmail } from '../components/admin/ImpersonationBanner';
import ContactFormHeader from '../components/contacts/ContactFormHeader';
import TikTokTabContent from '../components/contacts/TikTokTabContent';
import PersonalTabContent from '../components/contacts/PersonalTabContent';
import BusinessTabContent from '../components/contacts/BusinessTabContent';
import { useTheme } from '../components/shared/useTheme';

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

  useEffect(() => {
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

  // Fetch shared clubs
  const { data: sharedClubs = [] } = useQuery({
    queryKey: ['sharedClubs'],
    queryFn: () => base44.entities.SharedClub.list('name'),
  });

  const addSharedClubMutation = useMutation({
    mutationFn: async (clubName) => {
      const clubLower = (clubName && typeof clubName === 'string' && clubName.trim()) 
        ? clubName.trim().toLowerCase() 
        : '';
      const existing = sharedClubs.find(c => 
        c.name && typeof c.name === 'string' && c.name.trim() && c.name.toLowerCase() === clubLower
      );
      if (!existing && clubLower) {
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

  const handleSubmit = () => {
    const cleanData = {
      ...formData,
      username: (formData.username || '').replace('@', '').trim(),
      is_irl_contact: true // Always mark as IRL when created from My People
    };
    
    if (editingContact) {
      updateMutation.mutate({ id: editingContact.id, data: cleanData });
    } else {
      createMutation.mutate(cleanData);
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

  // Filter to only show IRL contacts in My People
  const irlContacts = contacts.filter(c => c.is_irl_contact);

  const searchLower = (searchTerm && typeof searchTerm === 'string' && searchTerm.trim()) 
    ? searchTerm.trim().toLowerCase() 
    : '';
  const filteredContacts = irlContacts
    .filter(c => {
      if (!searchLower) return true;
      const matchesSearch = 
        (c.real_name && typeof c.real_name === 'string' && c.real_name.trim() && c.real_name.toLowerCase().includes(searchLower)) ||
        (c.nickname && typeof c.nickname === 'string' && c.nickname.trim() && c.nickname.toLowerCase().includes(searchLower)) ||
        (c.username && typeof c.username === 'string' && c.username.trim() && c.username.toLowerCase().includes(searchLower)) ||
        (c.display_name && typeof c.display_name === 'string' && c.display_name.trim() && c.display_name.toLowerCase().includes(searchLower));
      return matchesSearch;
    })
    .sort((a, b) => (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0));

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${textClass}`}>My People (IRL)</h1>
            <p className={`${subtextClass} mt-1`}>Real-life friends, family & the people you actually know</p>
          </div>
          <Button onClick={() => setShowModal(true)} className="bg-gradient-to-r from-purple-600 to-pink-600">
            <Plus className="w-4 h-4 mr-2" /> Add Person
          </Button>
        </div>

        {/* Upcoming Birthdays Banner */}
        {upcomingBirthdays.length > 0 && (
          <Card className="bg-gradient-to-r from-pink-500 to-purple-500 text-white">
            <CardContent className="p-4">
              <h3 className="font-bold flex items-center gap-2 mb-3"><Cake className="w-5 h-5" /> Upcoming Birthdays</h3>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {upcomingBirthdays.slice(0, 5).map(c => {
                  const bday = parseISO(c.birthday);
                  const today = new Date();
                  const thisYearBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
                  if (thisYearBday < today) thisYearBday.setFullYear(today.getFullYear() + 1);
                  const daysUntil = differenceInDays(thisYearBday, today);
                  const displayName = c.real_name || c.nickname || c.display_name || c.username;
                  return (
                    <div key={c.id} className="flex-shrink-0 bg-white/20 rounded-lg p-3 text-center min-w-[100px]">
                      {c.image_url ? (
                        <img src={c.image_url} alt={displayName} className="w-12 h-12 rounded-full mx-auto mb-2 object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-white/30 mx-auto mb-2 flex items-center justify-center text-xl">
                          {displayName?.charAt(0)}
                        </div>
                      )}
                      <p className="font-semibold text-sm">{displayName}</p>
                      <p className="text-xs opacity-80">
                        {daysUntil === 0 ? '🎉 Today!' : `${daysUntil} days`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <Card className={cardBgClass}>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, nickname, or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 ${isDark ? 'bg-gray-700 border-gray-600' : ''}`}
              />
            </div>
          </CardContent>
        </Card>

        {/* People Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredContacts.map((contact, index) => {
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
                      <button onClick={() => toggleFavoriteMutation.mutate({ id: contact.id, isFavorite: contact.is_favorite })} className={`p-1 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded`}>
                        <Star className={`w-4 h-4 ${contact.is_favorite ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                      </button>
                    </div>

                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {contact.image_url ? (
                          <img src={contact.image_url} alt={displayName} className="w-14 h-14 rounded-full object-cover" />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xl font-bold">
                            {displayName?.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-bold text-lg truncate ${textClass}`}>{displayName}</h3>
                          {contact.nickname && contact.real_name && (
                            <p className={`text-sm ${subtextClass}`}>"{contact.nickname}"</p>
                          )}
                          {contact.username && (
                            <p className="text-sm text-purple-600">@{contact.username}</p>
                          )}
                          {contact.is_veteran && <span className="text-sm" title="Veteran">🇺🇸</span>}
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 text-sm">
                        {contact.birthday && (
                          <p className={`flex items-center gap-2 ${subtextClass}`}>
                            <Cake className="w-4 h-4 text-pink-500" />
                            {format(parseISO(contact.birthday), 'MMMM d')}
                          </p>
                        )}
                        {contact.occupation && (
                          <p className={`flex items-center gap-2 ${subtextClass}`}>
                            <Briefcase className="w-4 h-4" /> {contact.occupation}
                          </p>
                        )}
                        {contact.phone && (
                          <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-purple-600 hover:underline">
                            <Phone className="w-4 h-4" /> {contact.phone}
                          </a>
                        )}
                        {contact.businesses?.length > 0 && (
                          <p className={`flex items-center gap-2 ${subtextClass}`}>
                            <Building2 className="w-4 h-4" />
                            {contact.businesses.length} business{contact.businesses.length > 1 ? 'es' : ''}
                          </p>
                        )}
                      </div>

                      {contact.family_roles?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {contact.family_roles.slice(0, 3).map((role, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{role}</Badge>
                          ))}
                          {contact.family_roles.length > 3 && (
                            <Badge variant="secondary" className="text-xs">+{contact.family_roles.length - 3}</Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {irlContacts.length === 0 && (
          <div className="text-center py-12">
            <Users className={`w-12 h-12 ${isDark ? 'text-gray-600' : 'text-gray-300'} mx-auto mb-4`} />
            <h3 className={`text-lg font-semibold ${subtextClass}`}>No people added yet</h3>
            <p className={`${subtextClass} mb-4`}>Add friends, family, and connections!</p>
            <Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4 mr-2" /> Add Person</Button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal - Same as TikTok Contacts but opens to Personal tab */}
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
              sharedClubs={sharedClubs}
              onAddSharedClub={(name) => addSharedClubMutation.mutate(name)}
            />

            <Tabs value={formTab} onValueChange={setFormTab}>
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="personal" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                  Personal
                </TabsTrigger>
                <TabsTrigger value="business" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700">
                  Business
                </TabsTrigger>
                <TabsTrigger value="tiktok" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
                  TikTok
                </TabsTrigger>
              </TabsList>

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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}