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
  ChevronDown, ChevronRight
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const roleConfig = {
  battle_sniper: { label: 'Battle Sniper', icon: Swords, color: 'bg-red-100 text-red-700' },
  tapper: { label: 'Tapper', icon: Heart, color: 'bg-pink-100 text-pink-700' },
  sharer: { label: 'Shares to Story', icon: Share2, color: 'bg-blue-100 text-blue-700' },
  gifter: { label: 'Gifter', icon: Gift, color: 'bg-amber-100 text-amber-700' },
  engaging_bestie: { label: 'Engaging Bestie', icon: Heart, color: 'bg-purple-100 text-purple-700' },
  commenter: { label: 'Comments What They Saw', icon: Users, color: 'bg-teal-100 text-teal-700' },
  irl_friend: { label: 'Friend IRL (Before TikTok)', icon: Users, color: 'bg-green-100 text-green-700' },
  tiktok_seller: { label: 'TikTok Seller', icon: ShoppingBag, color: 'bg-orange-100 text-orange-700' },
  creator_to_watch: { label: 'Creator to Watch', icon: Video, color: 'bg-indigo-100 text-indigo-700' },
  subscriber: { label: 'Subscriber', icon: Heart, color: 'bg-cyan-100 text-cyan-700' },
  superfan: { label: 'Superfan', icon: Star, color: 'bg-rose-100 text-rose-700' },
  discord: { label: 'Discord', icon: Users, color: 'bg-violet-100 text-violet-700' },
  other: { label: 'Other', icon: Users, color: 'bg-gray-100 text-gray-700' }
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
  const [filterRole, setFilterRole] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    screen_name: '',
    phonetic: '',
    phone: '',
    email: '',
    role: [],
    notes: '',
    is_favorite: false,
    engagement_enabled: false,
    engagement_frequency: 'weekly',
    engagement_days: [],
    engagement_category_id: '',
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
    shop_agency: ''
  });
  const [newMetThroughName, setNewMetThroughName] = useState('');

  const { data: contacts = [] } = useQuery({
    queryKey: ['tiktokContacts'],
    queryFn: () => base44.entities.TikTokContact.list('-created_date'),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['engagementCategories'],
    queryFn: () => base44.entities.EngagementCategory.list('name'),
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

  const closeModal = () => {
    setShowModal(false);
    setEditingContact(null);
    setFormData({
      username: '',
      display_name: '',
      screen_name: '',
      phonetic: '',
      phone: '',
      email: '',
      role: [],
      notes: '',
      is_favorite: false,
      engagement_enabled: false,
      engagement_frequency: 'weekly',
      engagement_days: [],
      engagement_category_id: '',
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
      shop_agency: ''
    });
    setNewMetThroughName('');
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      username: contact.username || '',
      display_name: contact.display_name || '',
      screen_name: contact.screen_name || '',
      phonetic: contact.phonetic || '',
      phone: contact.phone || '',
      email: contact.email || '',
      role: contact.role || [],
      notes: contact.notes || '',
      is_favorite: contact.is_favorite || false,
      engagement_enabled: contact.engagement_enabled || false,
      engagement_frequency: contact.engagement_frequency || 'weekly',
      engagement_days: contact.engagement_days || [],
      engagement_category_id: contact.engagement_category_id || '',
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
      shop_agency: contact.shop_agency || ''
    });
    setNewMetThroughName('');
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

  const filteredContacts = contacts
    .filter(c => {
      const matchesSearch = 
        c.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.screen_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || c.role?.includes(filterRole);
      
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

            {/* Feature badges only */}
            <div className="flex flex-wrap gap-1">
              {contact.engagement_enabled && (
                <Badge variant="outline" className="text-xs bg-purple-50">
                  <Heart className="w-3 h-3 mr-1" /> Engagement
                </Badge>
              )}
              {contact.calendar_enabled && (
                <Badge variant="outline" className="text-xs bg-blue-50">
                  <Calendar className="w-3 h-3 mr-1" /> Calendar
                </Badge>
              )}
              {contact.is_gifter && (
                <Badge variant="outline" className="text-xs bg-amber-50">
                  <Music className="w-3 h-3 mr-1" /> Gifter
                </Badge>
              )}
            </div>

            {/* Contact Info */}
            {(contact.phone || contact.email) && (
              <div className="space-y-1 text-sm">
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-gray-600 hover:text-purple-600">
                    <Phone className="w-4 h-4" />
                    {contact.phone}
                  </a>
                )}
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-gray-600 hover:text-purple-600">
                    <Mail className="w-4 h-4" />
                    {contact.email}
                  </a>
                )}
              </div>
            )}

            {contact.notes && (
              <p className="text-sm text-gray-500 italic line-clamp-2">{contact.notes}</p>
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
          <Button
            onClick={() => setShowModal(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All ({contacts.length})</TabsTrigger>
            <TabsTrigger value="engagement">Engagement ({contacts.filter(c => c.engagement_enabled).length})</TabsTrigger>
            <TabsTrigger value="calendar">Calendar ({contacts.filter(c => c.calendar_enabled).length})</TabsTrigger>
            <TabsTrigger value="gifters">Gifters ({contacts.filter(c => c.is_gifter).length})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={filterRole === 'all' ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setFilterRole('all')}
                >
                  All
                </Badge>
                {Object.entries(roleConfig).map(([key, config]) => (
                  <Badge
                    key={key}
                    variant={filterRole === key ? 'default' : 'outline'}
                    className={`cursor-pointer ${filterRole === key ? '' : config.color}`}
                    onClick={() => setFilterRole(key)}
                  >
                    {config.label}
                  </Badge>
                ))}
              </div>
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
                  disabled={!formData.username.trim() || (formData.is_gifter && !formData.screen_name.trim())}
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

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={formData.engagement_category_id} onValueChange={(v) => setFormData({ ...formData, engagement_category_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>None</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Gifter Settings */}
            {formData.is_gifter && (
              <div className="space-y-4 p-4 border-l-4 border-amber-400 bg-amber-50 rounded-lg">
                <h4 className="font-semibold text-sm text-amber-800">Gifter Settings (for Songs)</h4>
                
                <div className="space-y-2">
                  <Label>Screen Name *</Label>
                  <Input
                    placeholder="e.g., Sheri D"
                    value={formData.screen_name}
                    onChange={(e) => setFormData({ ...formData, screen_name: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">What you see on screen during lives</p>
                </div>

                <div className="space-y-2">
                  <Label>Phonetic Pronunciation</Label>
                  <Input
                    placeholder="e.g., Sheri Dee Seven Seven Seven"
                    value={formData.phonetic}
                    onChange={(e) => setFormData({ ...formData, phonetic: e.target.value })}
                  />
                  <p className="text-xs text-gray-500">How to pronounce for songs</p>
                </div>
              </div>
            )}

            {/* Tabs for Mods, Connected Through, Details */}
            <Tabs defaultValue="mods" className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="mods" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">Mods</TabsTrigger>
                <TabsTrigger value="connections" className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">Connected Through</TabsTrigger>
                <TabsTrigger value="details" className="data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700">Details</TabsTrigger>
              </TabsList>
              
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
                          onClick={() => {
                            createMutation.mutate({ username: newMetThroughName.replace('@', '').trim() });
                            setNewMetThroughName('');
                          }}
                        >
                          <Plus className="w-4 h-4" /> Add
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
    </div>
  );
}