import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Trash2, Edit, Star, Phone, Mail, Search, Camera, 
  Cake, Heart, MapPin, Briefcase, Users, Gift, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isThisMonth, parseISO, differenceInDays } from 'date-fns';

const relationshipTypes = [
  { value: 'family', label: 'Family', icon: Users },
  { value: 'friend', label: 'Friend', icon: Heart },
  { value: 'coworker', label: 'Coworker', icon: Briefcase },
  { value: 'tiktok', label: 'TikTok', icon: Users },
  { value: 'instagram', label: 'Instagram', icon: Users },
  { value: 'youtube', label: 'YouTube', icon: Users },
  { value: 'twitter', label: 'Twitter/X', icon: Users },
  { value: 'online_friend', label: 'Online Friend', icon: Users },
  { value: 'neighbor', label: 'Neighbor', icon: MapPin },
  { value: 'pet', label: 'Pet', icon: Heart },
  { value: 'other', label: 'Other', icon: Users }
];

export default function People() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRelationship, setFilterRelationship] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState({
    name: '', nickname: '', photo_url: '', relationship: 'friend', specific_relation: '',
    birthday: '', anniversary: '', anniversary_label: '', phone: '', email: '',
    social_handles: { tiktok: '', instagram: '', youtube: '', twitter: '', facebook: '' },
    occupation: '', employer: '', religion: '', interests: [], favorite_things: '',
    address: '', notes: '', custom_fields: [], is_favorite: false
  });
  const [newInterest, setNewInterest] = useState('');
  const [newCustomField, setNewCustomField] = useState({ label: '', value: '' });

  const { data: contacts = [] } = useQuery({
    queryKey: ['personalContacts'],
    queryFn: () => base44.entities.PersonalContact.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PersonalContact.create(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['personalContacts'] }); closeModal(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PersonalContact.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['personalContacts'] }); closeModal(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PersonalContact.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['personalContacts'] }),
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }) => base44.entities.PersonalContact.update(id, { is_favorite: !isFavorite }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['personalContacts'] }),
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingContact(null);
    setFormData({
      name: '', nickname: '', photo_url: '', relationship: 'friend', specific_relation: '',
      birthday: '', anniversary: '', anniversary_label: '', phone: '', email: '',
      social_handles: { tiktok: '', instagram: '', youtube: '', twitter: '', facebook: '' },
      occupation: '', employer: '', religion: '', interests: [], favorite_things: '',
      address: '', notes: '', custom_fields: [], is_favorite: false
    });
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name || '', nickname: contact.nickname || '', photo_url: contact.photo_url || '',
      relationship: contact.relationship || 'friend', specific_relation: contact.specific_relation || '',
      birthday: contact.birthday || '', anniversary: contact.anniversary || '',
      anniversary_label: contact.anniversary_label || '', phone: contact.phone || '', email: contact.email || '',
      social_handles: contact.social_handles || { tiktok: '', instagram: '', youtube: '', twitter: '', facebook: '' },
      occupation: contact.occupation || '', employer: contact.employer || '', religion: contact.religion || '',
      interests: contact.interests || [], favorite_things: contact.favorite_things || '',
      address: contact.address || '', notes: contact.notes || '', custom_fields: contact.custom_fields || [],
      is_favorite: contact.is_favorite || false
    });
    setShowModal(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData({ ...formData, photo_url: file_url });
    setUploading(false);
  };

  const addInterest = () => {
    if (newInterest.trim()) {
      setFormData({ ...formData, interests: [...formData.interests, newInterest.trim()] });
      setNewInterest('');
    }
  };

  const removeInterest = (index) => {
    setFormData({ ...formData, interests: formData.interests.filter((_, i) => i !== index) });
  };

  const addCustomField = () => {
    if (newCustomField.label && newCustomField.value) {
      setFormData({ ...formData, custom_fields: [...formData.custom_fields, { ...newCustomField }] });
      setNewCustomField({ label: '', value: '' });
    }
  };

  const removeCustomField = (index) => {
    setFormData({ ...formData, custom_fields: formData.custom_fields.filter((_, i) => i !== index) });
  };

  const handleSubmit = () => {
    if (editingContact) {
      updateMutation.mutate({ id: editingContact.id, data: formData });
    } else {
      createMutation.mutate(formData);
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

  const filteredContacts = contacts
    .filter(c => {
      const matchesSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.nickname?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRelationship = filterRelationship === 'all' || c.relationship === filterRelationship;
      return matchesSearch && matchesRelationship;
    })
    .sort((a, b) => (b.is_favorite ? 1 : 0) - (a.is_favorite ? 1 : 0));

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My People</h1>
            <p className="text-gray-600 mt-1">Birthdays, anniversaries & everything about the people you care about</p>
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
                  return (
                    <div key={c.id} className="flex-shrink-0 bg-white/20 rounded-lg p-3 text-center min-w-[100px]">
                      {c.photo_url ? (
                        <img src={c.photo_url} alt={c.name} className="w-12 h-12 rounded-full mx-auto mb-2 object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-white/30 mx-auto mb-2 flex items-center justify-center text-xl">
                          {c.name?.charAt(0)}
                        </div>
                      )}
                      <p className="font-semibold text-sm">{c.name}</p>
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

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search people..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterRelationship} onValueChange={setFilterRelationship}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Filter" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {relationshipTypes.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* People Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredContacts.map((contact, index) => (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`relative overflow-hidden ${contact.is_favorite ? 'ring-2 ring-amber-400' : ''}`}>
                  <button
                    onClick={() => toggleFavoriteMutation.mutate({ id: contact.id, isFavorite: contact.is_favorite })}
                    className="absolute top-3 right-3 z-10"
                  >
                    <Star className={`w-5 h-5 ${contact.is_favorite ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                  </button>

                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {contact.photo_url ? (
                        <img src={contact.photo_url} alt={contact.name} className="w-16 h-16 rounded-full object-cover" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-2xl font-bold">
                          {contact.name?.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg truncate">{contact.name}</h3>
                        {contact.nickname && <p className="text-sm text-gray-500">"{contact.nickname}"</p>}
                        {contact.specific_relation && (
                          <Badge variant="outline" className="mt-1">{contact.specific_relation}</Badge>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      {contact.birthday && (
                        <p className="flex items-center gap-2 text-gray-600">
                          <Cake className="w-4 h-4 text-pink-500" />
                          {format(parseISO(contact.birthday), 'MMMM d')}
                        </p>
                      )}
                      {contact.anniversary && (
                        <p className="flex items-center gap-2 text-gray-600">
                          <Heart className="w-4 h-4 text-red-500" />
                          {contact.anniversary_label || 'Anniversary'}: {format(parseISO(contact.anniversary), 'MMM d')}
                        </p>
                      )}
                      {contact.occupation && (
                        <p className="flex items-center gap-2 text-gray-600">
                          <Briefcase className="w-4 h-4" /> {contact.occupation}
                          {contact.employer && ` at ${contact.employer}`}
                        </p>
                      )}
                      {contact.phone && (
                        <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-purple-600 hover:underline">
                          <Phone className="w-4 h-4" /> {contact.phone}
                        </a>
                      )}
                    </div>

                    {contact.interests?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {contact.interests.slice(0, 3).map((interest, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{interest}</Badge>
                        ))}
                        {contact.interests.length > 3 && (
                          <Badge variant="secondary" className="text-xs">+{contact.interests.length - 3}</Badge>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 mt-4 pt-3 border-t">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(contact)}>
                        <Edit className="w-4 h-4 mr-1" /> View/Edit
                      </Button>
                      <Button
                        variant="ghost" size="sm" className="text-red-500"
                        onClick={() => confirm('Delete this person?') && deleteMutation.mutate(contact.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {contacts.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600">No people added yet</h3>
            <p className="text-gray-500 mb-4">Add friends, family, and connections!</p>
            <Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4 mr-2" /> Add Person</Button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={closeModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingContact ? 'Edit Person' : 'Add Person'}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="dates">Dates</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="flex items-center gap-4">
                {formData.photo_url ? (
                  <img src={formData.photo_url} alt="Photo" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                    <Camera className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                  <p className="text-xs text-gray-500 mt-1">Upload a photo</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Nickname</Label>
                  <Input value={formData.nickname} onChange={(e) => setFormData({ ...formData, nickname: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Relationship Type</Label>
                  <Select value={formData.relationship} onValueChange={(v) => setFormData({ ...formData, relationship: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {relationshipTypes.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Specific Relation</Label>
                  <Input 
                    placeholder="e.g., Mom, Best Friend, Battle Buddy"
                    value={formData.specific_relation} 
                    onChange={(e) => setFormData({ ...formData, specific_relation: e.target.value })} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
              </div>

              <div
                className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                onClick={() => setFormData({ ...formData, is_favorite: !formData.is_favorite })}
              >
                <Checkbox checked={formData.is_favorite} />
                <Star className={`w-4 h-4 ${formData.is_favorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                <span>Mark as Favorite</span>
              </div>
            </TabsContent>

            <TabsContent value="dates" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Birthday</Label>
                <Input type="date" value={formData.birthday} onChange={(e) => setFormData({ ...formData, birthday: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Anniversary / Special Date</Label>
                  <Input type="date" value={formData.anniversary} onChange={(e) => setFormData({ ...formData, anniversary: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>What's it for?</Label>
                  <Input 
                    placeholder="e.g., Wedding, Friendship" 
                    value={formData.anniversary_label} 
                    onChange={(e) => setFormData({ ...formData, anniversary_label: e.target.value })} 
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Occupation</Label>
                  <Input value={formData.occupation} onChange={(e) => setFormData({ ...formData, occupation: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Employer</Label>
                  <Input value={formData.employer} onChange={(e) => setFormData({ ...formData, employer: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Religion</Label>
                <Input value={formData.religion} onChange={(e) => setFormData({ ...formData, religion: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>Social Media Handles</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="TikTok" value={formData.social_handles.tiktok} 
                    onChange={(e) => setFormData({ ...formData, social_handles: { ...formData.social_handles, tiktok: e.target.value }})} />
                  <Input placeholder="Instagram" value={formData.social_handles.instagram}
                    onChange={(e) => setFormData({ ...formData, social_handles: { ...formData.social_handles, instagram: e.target.value }})} />
                  <Input placeholder="YouTube" value={formData.social_handles.youtube}
                    onChange={(e) => setFormData({ ...formData, social_handles: { ...formData.social_handles, youtube: e.target.value }})} />
                  <Input placeholder="Twitter/X" value={formData.social_handles.twitter}
                    onChange={(e) => setFormData({ ...formData, social_handles: { ...formData.social_handles, twitter: e.target.value }})} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Interests / Hobbies</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Add an interest" 
                    value={newInterest} 
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                  />
                  <Button type="button" onClick={addInterest}><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {formData.interests.map((interest, i) => (
                    <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => removeInterest(i)}>
                      {interest} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Favorite Things</Label>
                <Textarea 
                  placeholder="Colors, foods, music, etc." 
                  value={formData.favorite_things} 
                  onChange={(e) => setFormData({ ...formData, favorite_things: e.target.value })} 
                />
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} />
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4 mt-4">
              <p className="text-sm text-gray-600">Add any custom fields you want to track for this person.</p>
              
              <div className="flex gap-2">
                <Input 
                  placeholder="Field name" 
                  value={newCustomField.label} 
                  onChange={(e) => setNewCustomField({ ...newCustomField, label: e.target.value })} 
                />
                <Input 
                  placeholder="Value" 
                  value={newCustomField.value} 
                  onChange={(e) => setNewCustomField({ ...newCustomField, value: e.target.value })} 
                />
                <Button type="button" onClick={addCustomField}><Plus className="w-4 h-4" /></Button>
              </div>

              {formData.custom_fields.length > 0 && (
                <div className="space-y-2 mt-4">
                  {formData.custom_fields.map((field, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium">{field.label}:</span> {field.value}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeCustomField(i)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!formData.name} className="bg-purple-600 hover:bg-purple-700">
              {editingContact ? 'Update' : 'Add Person'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}