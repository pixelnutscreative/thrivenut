import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Plus, Loader2, Trophy, Medal, Award, Sparkles, Star, 
  Check, Music, X, ChevronLeft, ChevronRight, Save, Trash2,
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { getEffectiveUserEmail } from '../components/admin/ImpersonationBanner';
import { useTheme } from '../components/shared/useTheme';

export default function WeeklyGifterGallery() {
  const queryClient = useQueryClient();
  const { isDark, bgClass, primaryColor, accentColor } = useTheme();
  
  // Get most recent Sunday
  const getMostRecentSunday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 0 : dayOfWeek;
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - daysToSubtract);
    return format(sunday, 'yyyy-MM-dd');
  };
  
  const [selectedWeek, setSelectedWeek] = useState(getMostRecentSunday());
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const effectiveEmail = user ? getEffectiveUserEmail(user.email) : null;

  // Fetch all contacts for username search
  const { data: allContacts = [] } = useQuery({
    queryKey: ['allTiktokContacts'],
    queryFn: () => base44.entities.TikTokContact.list('display_name', 2000),
  });

  // Fetch gifts
  const { data: gifts = [] } = useQuery({
    queryKey: ['gifts'],
    queryFn: () => base44.entities.Gift.list('name'),
  });

  // Fetch entries for this week
  const { data: rawEntries = [], isLoading } = useQuery({
    queryKey: ['giftingEntries', selectedWeek, effectiveEmail],
    queryFn: () => base44.entities.GiftingEntry.filter({ week: selectedWeek, owner_email: effectiveEmail }, 'created_date', 100),
    enabled: !!effectiveEmail,
  });

  // Normalize entries
  const entries = rawEntries.map(e => ({
    id: e.id,
    gifter_id: e.gifter_id,
    gifter_username: e.gifter_username,
    gifter_screen_name: e.gifter_screen_name,
    gifter_phonetic: e.gifter_phonetic,
    gift_id: e.gift_id,
    gift_name: e.gift_name,
    rank: e.rank,
    week: e.week,
  }));

  // Week navigation
  const goToPreviousWeek = () => {
    const current = new Date(selectedWeek + 'T12:00:00');
    current.setDate(current.getDate() - 7);
    setSelectedWeek(format(current, 'yyyy-MM-dd'));
  };

  const goToNextWeek = () => {
    const current = new Date(selectedWeek + 'T12:00:00');
    current.setDate(current.getDate() + 7);
    setSelectedWeek(format(current, 'yyyy-MM-dd'));
  };

  // Sort entries by rank
  const sortedEntries = [...entries].sort((a, b) => {
    const rankOrder = { '1st': 1, '2nd': 2, '3rd': 3, 'shoutout': 4 };
    return (rankOrder[a.rank] || 5) - (rankOrder[b.rank] || 5);
  });

  // Group entries by gift
  const entriesByGift = {};
  sortedEntries.forEach(entry => {
    const giftName = entry.gift_name || 'Unknown Gift';
    if (!entriesByGift[giftName]) entriesByGift[giftName] = [];
    entriesByGift[giftName].push(entry);
  });

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2" style={{ color: isDark ? '#fff' : '#1f2937' }}>
              <Music className="w-8 h-8" style={{ color: primaryColor }} />
              Gift Gallery Gratitude
            </h1>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Add your weekly gifters, then generate a thank-you song!</p>
          </div>
          <Link to={createPageUrl('SongGenerator')}>
            <Button style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }} className="text-white">
              <Sparkles className="w-4 h-4 mr-2" /> Generate Song
            </Button>
          </Link>
        </div>

        {/* Week Navigator */}
        <Card className={isDark ? 'bg-gray-800 border-gray-700' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <div className="text-center">
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Week Ending</p>
                <p className="font-bold text-lg" style={{ color: primaryColor }}>
                  {format(new Date(selectedWeek + 'T12:00:00'), 'MMMM d, yyyy')}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={goToNextWeek}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Add New Entry Section */}
        <AddGifterEntry 
          allContacts={allContacts}
          gifts={gifts}
          week={selectedWeek}
          ownerEmail={effectiveEmail}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ['giftingEntries'] })}
          isDark={isDark}
          primaryColor={primaryColor}
          accentColor={accentColor}
        />

        {/* Saved Entries */}
        <Card className={isDark ? 'bg-gray-800 border-gray-700' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" style={{ color: primaryColor }} />
              This Week's Gifters ({sortedEntries.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
              </div>
            ) : sortedEntries.length === 0 ? (
              <div className="text-center py-8">
                <Music className="w-12 h-12 mx-auto mb-4" style={{ color: isDark ? '#4b5563' : '#d1d5db' }} />
                <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>No gifters added yet for this week</p>
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Use the form above to add your first gifter!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(entriesByGift).map(([giftName, giftEntries]) => (
                  <div key={giftName} className={`p-4 rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Badge variant="secondary">{giftName}</Badge>
                    </h3>
                    <div className="space-y-2">
                      {giftEntries.map((entry, idx) => (
                        <GifterEntryCard 
                          key={entry.id} 
                          entry={entry} 
                          allContacts={allContacts}
                          gifts={gifts}
                          isDark={isDark}
                          primaryColor={primaryColor}
                          onDeleted={() => queryClient.invalidateQueries({ queryKey: ['giftingEntries'] })}
                          onUpdated={() => queryClient.invalidateQueries({ queryKey: ['giftingEntries'] })}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {/* Generate Song CTA */}
                <div className="pt-4 border-t" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
                  <Link to={createPageUrl('SongGenerator')} className="block">
                    <Button 
                      className="w-full text-white" 
                      style={{ background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})` }}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Ready! Generate Thank-You Song →
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Add New Gifter Entry Component
function AddGifterEntry({ allContacts, gifts, week, ownerEmail, onSaved, isDark, primaryColor, accentColor }) {
  const [usernameSearch, setUsernameSearch] = useState('');
  const [usernameOpen, setUsernameOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [giftSearch, setGiftSearch] = useState('');
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    phonetic: '',
    rank: '',
    gift_name: '',
    gift_id: '',
  });

  // Normalize contacts
  const normalizedContacts = allContacts
    .map(c => ({
      id: c.id,
      username: c.username || c.data?.username || '',
      display_name: c.display_name || c.data?.display_name || '',
      phonetic: c.phonetic || c.data?.phonetic || ''
    }))
    .filter(c => c.username || c.display_name)
    .sort((a, b) => (a.display_name || a.username).toLowerCase().localeCompare((b.display_name || b.username).toLowerCase()));

  // Filter contacts
  const filteredContacts = usernameSearch.trim()
    ? normalizedContacts.filter(c => 
        c.username?.toLowerCase().includes(usernameSearch.toLowerCase()) ||
        c.display_name?.toLowerCase().includes(usernameSearch.toLowerCase())
      )
    : normalizedContacts.slice(0, 20);

  // Filter gifts
  const filteredGifts = giftSearch.trim()
    ? gifts.filter(g => g.name?.toLowerCase().includes(giftSearch.toLowerCase()))
    : gifts;

  const handleSelectContact = (contact) => {
    setFormData({
      ...formData,
      username: contact.username,
      display_name: contact.display_name || contact.username,
      phonetic: contact.phonetic || ''
    });
    setUsernameOpen(false);
    setUsernameSearch('');
  };

  const handleSelectGift = (gift) => {
    setFormData({
      ...formData,
      gift_name: gift.name,
      gift_id: gift.id
    });
    setGiftOpen(false);
    setGiftSearch('');
  };

  const handleSave = async () => {
    if (!formData.username || !formData.rank || !formData.gift_name) return;
    
    setSaving(true);
    try {
      // Check if contact exists, if not create it
      let gifterId = null;
      const existing = normalizedContacts.find(c => 
        c.username?.toLowerCase() === formData.username.toLowerCase()
      );
      
      if (existing) {
        gifterId = existing.id;
        // Update phonetic if changed
        if (formData.phonetic && formData.phonetic !== existing.phonetic) {
          await base44.entities.TikTokContact.update(existing.id, {
            phonetic: formData.phonetic,
            display_name: formData.display_name
          });
        }
      } else {
        // Create new contact
        const newContact = await base44.entities.TikTokContact.create({
          username: formData.username.replace('@', ''),
          display_name: formData.display_name || formData.username,
          phonetic: formData.phonetic || '',
          is_gifter: true
        });
        gifterId = newContact.id;
      }

      // Create entry
      await base44.entities.GiftingEntry.create({
        gifter_id: gifterId,
        gifter_username: formData.username,
        gifter_screen_name: formData.display_name,
        gifter_phonetic: formData.phonetic,
        gift_id: formData.gift_id,
        gift_name: formData.gift_name,
        rank: formData.rank,
        week: week,
        owner_email: ownerEmail
      });

      // Reset form
      setFormData({ username: '', display_name: '', phonetic: '', rank: '', gift_name: '', gift_id: '' });
      onSaved();
    } catch (err) {
      console.error('Error saving:', err);
    } finally {
      setSaving(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case '1st': return <Trophy className="w-4 h-4 text-yellow-500" />;
      case '2nd': return <Medal className="w-4 h-4 text-gray-400" />;
      case '3rd': return <Award className="w-4 h-4 text-amber-600" />;
      case 'shoutout': return <Star className="w-4 h-4 text-purple-500" />;
      default: return null;
    }
  };

  const canSave = formData.username && formData.rank && formData.gift_name;

  return (
    <Card className={`border-2 ${isDark ? 'bg-gray-800 border-purple-500/50' : 'border-purple-200 bg-purple-50/50'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Plus className="w-5 h-5" style={{ color: primaryColor }} />
          Add Gifter
        </CardTitle>
        <CardDescription>Search by username, pick their rank and gift, then save</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step 1: Search Username */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center" style={{ background: primaryColor }}>1</span>
            Search Gifter
          </Label>
          <Popover open={usernameOpen} onOpenChange={setUsernameOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className={`w-full justify-start text-left h-12 ${isDark ? 'bg-gray-700 border-gray-600' : ''}`}
              >
                <Search className="w-4 h-4 mr-2 text-gray-400" />
                {formData.username ? (
                  <span className="font-mono">@{formData.username}</span>
                ) : (
                  <span className="text-gray-400">Start typing username...</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder="Type username to search..." 
                  value={usernameSearch}
                  onValueChange={setUsernameSearch}
                />
                <CommandList className="max-h-64">
                  {usernameSearch.trim() && !filteredContacts.find(c => c.username?.toLowerCase() === usernameSearch.toLowerCase()) && (
                    <CommandItem
                      onSelect={() => {
                        setFormData({
                          ...formData,
                          username: usernameSearch.replace('@', ''),
                          display_name: '',
                          phonetic: ''
                        });
                        setUsernameOpen(false);
                        setUsernameSearch('');
                      }}
                      className="text-purple-600 cursor-pointer"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add new: @{usernameSearch.replace('@', '')}
                    </CommandItem>
                  )}
                  <CommandGroup heading="Contacts">
                    {filteredContacts.map(c => (
                      <CommandItem 
                        key={c.id} 
                        onSelect={() => handleSelectContact(c)}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col">
                          <span className="font-mono text-sm">@{c.username}</span>
                          {c.display_name && c.display_name !== c.username && (
                            <span className="text-xs text-gray-500">{c.display_name}</span>
                          )}
                        </div>
                        {c.phonetic && (
                          <span className="ml-auto text-xs text-purple-500">🎵 {c.phonetic}</span>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                  {filteredContacts.length === 0 && !usernameSearch.trim() && (
                    <CommandEmpty>Start typing to search...</CommandEmpty>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Auto-filled fields after selection */}
        {formData.username && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="grid grid-cols-2 gap-3"
          >
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Display Name</Label>
              <Input
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="How they appear on screen"
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Phonetic (for song) 🎵</Label>
              <Input
                value={formData.phonetic}
                onChange={(e) => setFormData({ ...formData, phonetic: e.target.value })}
                placeholder="How to pronounce it"
                className={isDark ? 'bg-gray-700 border-gray-600' : ''}
              />
            </div>
          </motion.div>
        )}

        {/* Step 2: Select Rank */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center" style={{ background: primaryColor }}>2</span>
            Select Rank
          </Label>
          <div className="flex gap-2 flex-wrap">
            {['1st', '2nd', '3rd', 'shoutout'].map(rank => (
              <button
                key={rank}
                onClick={() => setFormData({ ...formData, rank })}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                  formData.rank === rank
                    ? 'border-purple-500 bg-purple-100 dark:bg-purple-900/50'
                    : isDark
                      ? 'border-gray-600 bg-gray-700 hover:border-purple-400'
                      : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                {getRankIcon(rank)}
                <span className="font-medium">{rank === 'shoutout' ? 'Shoutout' : rank}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Select Gift */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full text-white text-xs flex items-center justify-center" style={{ background: primaryColor }}>3</span>
            Select Gift
          </Label>
          <Popover open={giftOpen} onOpenChange={setGiftOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className={`w-full justify-start text-left h-12 ${isDark ? 'bg-gray-700 border-gray-600' : ''}`}
              >
                {formData.gift_name ? (
                  <span>{formData.gift_name}</span>
                ) : (
                  <span className="text-gray-400">Select gift...</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder="Search gifts..." 
                  value={giftSearch}
                  onValueChange={setGiftSearch}
                />
                <CommandList className="max-h-64">
                  <CommandGroup>
                    {filteredGifts.map(g => (
                      <CommandItem 
                        key={g.id} 
                        onSelect={() => handleSelectGift(g)}
                        className="cursor-pointer"
                      >
                        {g.name}
                        {g.league_range && <span className="ml-auto text-xs text-gray-400">{g.league_range}</span>}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Link to={createPageUrl('GiftLibrary')} className="text-xs hover:underline" style={{ color: primaryColor }}>
            Manage gift library →
          </Link>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="w-full text-white h-12 text-lg"
          style={{ background: canSave ? `linear-gradient(135deg, ${primaryColor}, ${accentColor})` : undefined }}
        >
          {saving ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-5 h-5 mr-2" /> Save Gifter</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// Saved Entry Card Component
function GifterEntryCard({ entry, allContacts, gifts, isDark, primaryColor, onDeleted, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    display_name: entry.gifter_screen_name || '',
    phonetic: entry.gifter_phonetic || '',
    rank: entry.rank || '',
  });

  const getRankIcon = (rank) => {
    switch (rank) {
      case '1st': return <Trophy className="w-5 h-5 text-yellow-500" />;
      case '2nd': return <Medal className="w-5 h-5 text-gray-400" />;
      case '3rd': return <Award className="w-5 h-5 text-amber-600" />;
      case 'shoutout': return <Star className="w-5 h-5 text-purple-500" />;
      default: return null;
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await base44.entities.GiftingEntry.delete(entry.id);
      onDeleted();
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    try {
      await base44.entities.GiftingEntry.update(entry.id, {
        gifter_screen_name: formData.display_name,
        gifter_phonetic: formData.phonetic,
        rank: formData.rank
      });
      setEditing(false);
      onUpdated();
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  if (editing) {
    return (
      <div className={`p-3 rounded-lg border ${isDark ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-200'}`}>
        <div className="grid grid-cols-4 gap-2 mb-2">
          <Input
            value={formData.display_name}
            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
            placeholder="Display name"
            className="col-span-1"
          />
          <Input
            value={formData.phonetic}
            onChange={(e) => setFormData({ ...formData, phonetic: e.target.value })}
            placeholder="Phonetic 🎵"
            className="col-span-1"
          />
          <Select value={formData.rank} onValueChange={(v) => setFormData({ ...formData, rank: v })}>
            <SelectTrigger className="col-span-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1st">🥇 1st</SelectItem>
              <SelectItem value="2nd">🥈 2nd</SelectItem>
              <SelectItem value="3rd">🥉 3rd</SelectItem>
              <SelectItem value="shoutout">⭐ Shoutout</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-1">
            <Button size="sm" onClick={handleSave} className="flex-1">
              <Check className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-3 p-3 rounded-lg ${isDark ? 'bg-gray-600/50' : 'bg-white'}`}
    >
      {getRankIcon(entry.rank)}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{entry.gifter_screen_name || entry.gifter_username}</span>
          <span className="text-xs font-mono" style={{ color: primaryColor }}>@{entry.gifter_username}</span>
        </div>
        {entry.gifter_phonetic && (
          <p className="text-xs text-purple-500">🎵 {entry.gifter_phonetic}</p>
        )}
      </div>
      <Badge variant="outline" className="shrink-0">{entry.rank}</Badge>
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="h-8 w-8 p-0">
          <Sparkles className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleDelete} 
          disabled={deleting}
          className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
        >
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </Button>
      </div>
    </motion.div>
  );
}