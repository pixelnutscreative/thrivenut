import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shareGifterData } from '../components/gifter/useGifterSharing';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, Loader2, Trophy, Medal, Award, Sparkles, Upload, Star, 
  Copy, Download, Send, Check, CheckCircle, Music, Edit, X, 
  ChevronLeft, ChevronRight, ImageIcon, UserCheck, HelpCircle
} from 'lucide-react';
import { format, startOfWeek, subWeeks, addWeeks, addDays } from 'date-fns';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { getEffectiveUserEmail } from '../components/admin/ImpersonationBanner';
import { Checkbox } from '@/components/ui/checkbox';

export default function WeeklyGifterGallery() {
  const queryClient = useQueryClient();
  
  // Fixed to November 23, 2025 - the week ending date
  const [selectedWeek, setSelectedWeek] = useState('2025-11-23');
  const [activeTab, setActiveTab] = useState('summary');
  const [user, setUser] = useState(null);
  
  // Manual entry form
  const [formData, setFormData] = useState({ gifter_id: '', gift_id: '', rank: '' });
  
  // Edit form
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState({ gifter_screen_name: '', gifter_phonetic: '' });
  
  // Share state
  const [copied, setCopied] = useState(false);
  const [allGood, setAllGood] = useState(false);
  
  // AI Import state
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [importError, setImportError] = useState(null);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalToProcess, setTotalToProcess] = useState(0);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const effectiveEmail = user ? getEffectiveUserEmail(user.email) : null;

  const { data: preferences } = useQuery({
    queryKey: ['preferences', effectiveEmail],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: effectiveEmail });
      return prefs[0] || null;
    },
    enabled: !!effectiveEmail,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['tiktokContacts', effectiveEmail],
    queryFn: async () => {
      // For impersonation: check data.created_by field which stores the actual owner
      const allContacts = await base44.entities.TikTokContact.list('display_name');
      return allContacts.filter(c => {
        const dataOwner = c.data?.created_by || c.created_by;
        return dataOwner === effectiveEmail;
      });
    },
    enabled: !!effectiveEmail,
  });

  const { data: allContacts = [] } = useQuery({
    queryKey: ['allTiktokContacts'],
    queryFn: () => base44.entities.TikTokContact.list('username'),
  });

  const gifters = contacts.filter(c => c.is_gifter || c.data?.is_gifter);

  const { data: gifts = [] } = useQuery({
    queryKey: ['gifts'],
    queryFn: () => base44.entities.Gift.list('name'),
  });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['giftingEntries', selectedWeek, effectiveEmail],
    queryFn: async () => {
      // For impersonation: the actual owner is stored in the nested data object
      // The API returns flat fields AND a data object - check both patterns
      const allEntries = await base44.entities.GiftingEntry.filter({ week: selectedWeek });
      return allEntries.filter(e => {
        // Check nested data.created_by first (for moved records), then top-level
        const owner = e.data?.created_by || e.created_by;
        return owner === effectiveEmail;
      });
    },
    enabled: !!effectiveEmail,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const gifter = gifters.find(g => g.id === data.gifter_id);
      const gift = gifts.find(g => g.id === data.gift_id);
      
      return base44.entities.GiftingEntry.create({
        ...data,
        week: selectedWeek,
        gifter_username: gifter?.username,
        gifter_screen_name: gifter?.display_name || gifter?.username,
        gifter_phonetic: gifter?.phonetic,
        gift_name: gift?.name
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['giftingEntries'] });
      setFormData({ gifter_id: '', gift_id: '', rank: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GiftingEntry.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['giftingEntries'] });
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: async ({ entryId, data }) => {
      await base44.entities.GiftingEntry.update(entryId, data);
      const entry = entries.find(e => e.id === entryId);
      if (entry?.gifter_id) {
        const contact = contacts.find(c => c.id === entry.gifter_id);
        if (contact) {
          await base44.entities.TikTokContact.update(contact.id, {
            display_name: data.gifter_screen_name,
            phonetic: data.gifter_phonetic
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['giftingEntries'] });
      queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
      setEditingEntry(null);
    },
  });

  const createEntriesMutation = useMutation({
    mutationFn: async (entriesToCreate) => {
      const promises = entriesToCreate.map(async (entry) => {
        let gifter = gifters.find(g => 
          g.username?.toLowerCase() === entry.username?.toLowerCase()
        );

        if (!gifter && entry.username) {
          gifter = await base44.entities.TikTokContact.create({
            username: entry.username,
            display_name: entry.screen_name || entry.username,
            phonetic: entry.phonetic || '',
            is_gifter: true
          });
        }

        if (!gifter) return null;

        let gift = entry.gift_name 
          ? gifts.find(g => g.name?.toLowerCase().includes(entry.gift_name?.toLowerCase()))
          : null;

        return base44.entities.GiftingEntry.create({
          gifter_id: gifter.id,
          gifter_username: gifter.username,
          gifter_screen_name: entry.screen_name || gifter.display_name,
          gifter_phonetic: entry.phonetic || gifter.phonetic,
          gift_id: gift?.id || '',
          gift_name: gift?.name || entry.gift_name || 'Unknown',
          rank: entry.rank,
          week: selectedWeek
        });
      });

      return Promise.all(promises.filter(Boolean));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['giftingEntries'] });
      queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
      setExtractedData(null);
      setPreviewUrls([]);
      setCurrentImageIndex(0);
      setActiveTab('summary');
    },
  });

  // Week navigation - 7 days at a time
  const goToPreviousWeek = () => {
    const current = new Date(selectedWeek + 'T12:00:00');
    current.setDate(current.getDate() - 7);
    setSelectedWeek(format(current, 'yyyy-MM-dd'));
    setAllGood(false);
  };

  const goToNextWeek = () => {
    const current = new Date(selectedWeek + 'T12:00:00');
    current.setDate(current.getDate() + 7);
    setSelectedWeek(format(current, 'yyyy-MM-dd'));
    setAllGood(false);
  };

  // Sorting
  const sortedEntries = [...entries].sort((a, b) => {
    const rankOrder = { '1st': 1, '2nd': 2, '3rd': 3, 'shoutout': 4 };
    return (rankOrder[a.rank] || 5) - (rankOrder[b.rank] || 5);
  });

  // Generate summary text
  const generateFormattedText = () => {
    if (sortedEntries.length === 0) return '';
    let text = `Thank-you shoutout to our top gifters for the week ending ${format(new Date(selectedWeek), 'MMMM d, yyyy')}!\n\n`;
    sortedEntries.forEach(entry => {
      const rankLabel = entry.rank === '1st' ? '🥇 1st Place' : entry.rank === '2nd' ? '🥈 2nd Place' : entry.rank === '3rd' ? '🥉 3rd Place' : '⭐ Special Shoutout';
      text += `${entry.gift_name} - ${rankLabel}\n`;
      text += `${entry.gifter_screen_name} (@${entry.gifter_username})\n`;
      if (entry.gifter_phonetic) {
        text += `Pronunciation: ${entry.gifter_phonetic}\n`;
      }
      text += '\n';
    });
    return text.trim();
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generateFormattedText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generateFormattedText()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gifter-gallery-${selectedWeek}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // AI Import handlers - processes images ONE AT A TIME so results appear progressively
  // Each image costs ~1-2 AI credits depending on size
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setImportError(null);
    setUploading(true);
    setTotalToProcess(files.length);
    setProcessedCount(0);
    
    // Keep existing extracted data if any, just add to it
    if (!extractedData) {
      setExtractedData({ gifters: [], confidence: 'high', notes: 'Processing...' });
    }

    try {
      // First, generate all previews quickly and add to existing previews
      const newPreviews = [];
      for (const file of files) {
        const preview = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
        newPreviews.push(preview);
      }
      setPreviewUrls(prev => [...prev, ...newPreviews]);
      setUploading(false);
      setAnalyzing(true);

      // Build set of already-seen usernames from existing extracted data
      const seenUsernames = new Set();
      if (extractedData?.gifters) {
        extractedData.gifters.forEach(g => {
          const key = g.username?.toLowerCase()?.replace('@', '');
          if (key) seenUsernames.add(key);
        });
      }
      
      for (let i = 0; i < files.length; i++) {
        try {
          // Update status message
          setExtractedData(prev => ({
            ...prev,
            notes: `Processing image ${i + 1} of ${files.length}... (~1 credit per image)`
          }));

          // Upload this single image
          const { file_url } = await base44.integrations.Core.UploadFile({ file: files[i] });
          
          // Analyze this single image
          const result = await base44.integrations.Core.InvokeLLM({
            prompt: `Analyze this TikTok gifting leaderboard screenshot and extract ALL gifters visible.
            
Look for:
- Usernames (usually start with @)
- Display names / screen names  
- Their placement (1st, 2nd, 3rd place, or any ranking number visible)
- Any gift names visible

IMPORTANT: Extract EVERY gifter you can see, not just top 3. Include 4th, 5th, etc if visible.
For each username, generate a "suggested_phonetic" field with how it would be pronounced naturally in English for a song.`,
            file_urls: [file_url],
            response_json_schema: {
              type: "object",
              properties: {
                gifters: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                       rank: { type: "string", description: "1st, 2nd, 3rd, 4th, etc" },
                       username: { type: "string", description: "TikTok username without @" },
                       screen_name: { type: "string", description: "Display name shown" },
                       suggested_phonetic: { type: "string", description: "How the username/name would be pronounced for a song" },
                       gift_name: { type: "string", description: "Name of gift if visible" }
                     }
                  }
                }
              }
            }
          });
          
          // Process and add new gifters immediately
          if (result.gifters) {
            const newGifters = result.gifters
              .filter(g => {
                const key = g.username?.toLowerCase()?.replace('@', '');
                if (!key || seenUsernames.has(key)) return false;
                seenUsernames.add(key);
                return true;
              })
              .map(gifter => {
                const username = gifter.username?.toLowerCase()?.replace('@', '');
                const exactMatch = allContacts.find(c => c.username?.toLowerCase() === username);
                
                return {
                  ...gifter,
                  matched_contact: exactMatch || null,
                  screen_name: exactMatch?.display_name || gifter.screen_name,
                  phonetic: exactMatch?.phonetic || gifter.suggested_phonetic || '',
                  username: exactMatch?.username || gifter.username,
                  selected: true
                };
              });

            // Update state immediately with new gifters
            setExtractedData(prev => ({
              ...prev,
              gifters: [...(prev?.gifters || []), ...newGifters],
              notes: i === files.length - 1 
                ? `✓ Done! ${(prev?.gifters?.length || 0) + newGifters.length} unique gifters from ${files.length} images` 
                : `Processing image ${i + 2} of ${files.length}... (${(prev?.gifters?.length || 0) + newGifters.length} gifters found)`
            }));
          }
          
          setProcessedCount(i + 1);
        } catch (imgErr) {
          console.error(`Error processing image ${i + 1}:`, imgErr);
          // Continue with next image, don't stop the whole process
          setExtractedData(prev => ({
            ...prev,
            notes: `⚠️ Error on image ${i + 1}, continuing... (${prev?.gifters?.length || 0} gifters found)`
          }));
        }
      }
      
      setAnalyzing(false);
      setExtractedData(prev => ({
        ...prev,
        notes: `✓ Done! ${prev?.gifters?.length || 0} unique gifters extracted. You can add more images if needed.`
      }));
    } catch (err) {
      console.error('Error processing screenshots:', err);
      setImportError('Error occurred but your data is saved. You can add more images.');
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const updateExtractedGifter = (index, field, value) => {
    setExtractedData(prev => ({
      ...prev,
      gifters: prev.gifters.map((g, i) => i === index ? { ...g, [field]: value } : g)
    }));
  };

  const removeExtractedGifter = (index) => {
    setExtractedData(prev => ({
      ...prev,
      gifters: prev.gifters.filter((_, i) => i !== index)
    }));
  };

  const handleConfirmImport = () => {
    const selectedGifters = extractedData?.gifters?.filter(g => g.selected);
    if (!selectedGifters?.length) return;
    createEntriesMutation.mutate(selectedGifters);
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case '1st': return <Trophy className="w-5 h-5 text-yellow-500" />;
      case '2nd': return <Medal className="w-5 h-5 text-gray-400" />;
      case '3rd': return <Award className="w-5 h-5 text-amber-600" />;
      case 'shoutout': return <Star className="w-5 h-5 text-purple-500" />;
      default: return null;
    }
  };

  const selectedGifter = gifters.find(g => g.id === formData.gifter_id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Music className="w-8 h-8 text-purple-600" />
              Weekly Gifter Gallery
            </h1>
            <p className="text-gray-600 mt-1">Manage your weekly gift entries and generate songs</p>
          </div>
          <Link to={createPageUrl('SongGenerator')}>
            <Button className="bg-gradient-to-r from-amber-500 via-purple-500 to-pink-500 hover:from-amber-600 hover:via-purple-600 hover:to-pink-600">
              <Sparkles className="w-4 h-4 mr-2" /> Generate Song
            </Button>
          </Link>
        </div>

        {/* Week Navigator */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous Week
              </Button>
              <div className="text-center">
                <p className="text-sm text-gray-500">Week Ending</p>
                <p className="font-bold text-lg">{format(new Date(selectedWeek + 'T12:00:00'), 'MMMM d, yyyy')}</p>
              </div>
              <Button variant="outline" size="sm" onClick={goToNextWeek}>
                Next Week <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">
              📋 Summary ({sortedEntries.length})
            </TabsTrigger>
            <TabsTrigger value="add">
              ➕ Add Entry
            </TabsTrigger>
            <TabsTrigger value="import">
              ✨ AI Import
            </TabsTrigger>
          </TabsList>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              </div>
            ) : sortedEntries.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Music className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">No gifter entries for this week yet</p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => setActiveTab('add')} variant="outline">
                      <Plus className="w-4 h-4 mr-2" /> Add Manually
                    </Button>
                    <Button onClick={() => setActiveTab('import')} className="bg-purple-600 hover:bg-purple-700">
                      <Upload className="w-4 h-4 mr-2" /> AI Import
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Entries List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">This Week's Gifters</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {sortedEntries.map((entry, index) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 bg-gray-50 rounded-lg"
                      >
                        {editingEntry === entry.id ? (
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs">Screen Name</Label>
                                <Input
                                  value={editForm.gifter_screen_name}
                                  onChange={(e) => setEditForm({ ...editForm, gifter_screen_name: e.target.value })}
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Phonetic 🎵</Label>
                                <Input
                                  value={editForm.gifter_phonetic}
                                  onChange={(e) => setEditForm({ ...editForm, gifter_phonetic: e.target.value })}
                                  placeholder="How to pronounce"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => updateEntryMutation.mutate({ entryId: entry.id, data: editForm })} disabled={updateEntryMutation.isPending}>
                                Save
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingEntry(null)}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getRankIcon(entry.rank)}
                              <div>
                                <p className="font-semibold">{entry.gifter_screen_name}</p>
                                <p className="text-sm text-purple-600">@{entry.gifter_username}</p>
                                <div className="flex gap-2 mt-1">
                                  <Badge variant="secondary" className="text-xs">{entry.gift_name}</Badge>
                                  {entry.gifter_phonetic && (
                                    <Badge variant="outline" className="text-xs">🎵 {entry.gifter_phonetic}</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingEntry(entry.id);
                                  setEditForm({ gifter_screen_name: entry.gifter_screen_name || '', gifter_phonetic: entry.gifter_phonetic || '' });
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteMutation.mutate(entry.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </CardContent>
                </Card>

                {/* Ready to Share */}
                {!allGood ? (
                  <Card className="border-2 border-dashed border-purple-300">
                    <CardContent className="p-6 text-center">
                      <p className="text-gray-600 mb-4">Review entries above and make any edits needed.</p>
                      <Button
                        onClick={() => setAllGood(true)}
                        className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" /> All Good - Ready to Share!
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="border-2 border-green-300 bg-green-50">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                          <CheckCircle className="w-5 h-5" /> Ready to Share
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="bg-white p-4 rounded-lg border font-mono text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                          {generateFormattedText()}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <Button onClick={handleCopy} className="bg-purple-600 hover:bg-purple-700">
                            <Copy className="w-4 h-4 mr-2" /> {copied ? 'Copied!' : 'Copy'}
                          </Button>
                          <Button onClick={handleDownload} variant="outline">
                            <Download className="w-4 h-4 mr-2" /> Download
                          </Button>
                          <Link to={createPageUrl('SongGenerator')} className="col-span-2 md:col-span-1">
                            <Button className="w-full bg-gradient-to-r from-amber-500 to-pink-500">
                              <Sparkles className="w-4 h-4 mr-2" /> Create Song
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </>
            )}
          </TabsContent>

          {/* Add Entry Tab */}
          <TabsContent value="add">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Gift Entry Manually</CardTitle>
                <CardDescription>Select from your saved gifters or add entries one by one</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Gifter *</Label>
                    <Select value={formData.gifter_id} onValueChange={(value) => setFormData({ ...formData, gifter_id: value })}>
                      <SelectTrigger><SelectValue placeholder="Select gifter" /></SelectTrigger>
                      <SelectContent>
                        {gifters.map(gifter => (
                          <SelectItem key={gifter.id} value={gifter.id}>
                            {gifter.display_name || gifter.username} (@{gifter.username})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedGifter?.phonetic && (
                      <p className="text-xs text-purple-600 italic">🎵 Phonetic: "{selectedGifter.phonetic}"</p>
                    )}
                    {gifters.length === 0 && (
                      <p className="text-xs text-amber-600">
                        No gifters yet. <Link to={createPageUrl('TikTokContacts')} className="underline">Add contacts</Link> and mark them as gifters.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Gift *</Label>
                    <Select value={formData.gift_id} onValueChange={(value) => setFormData({ ...formData, gift_id: value })}>
                      <SelectTrigger><SelectValue placeholder="Select gift" /></SelectTrigger>
                      <SelectContent>
                        {gifts.map(gift => (
                          <SelectItem key={gift.id} value={gift.id}>
                            {gift.name} {gift.league_range ? `(${gift.league_range})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Rank *</Label>
                  <div className="flex gap-4 flex-wrap">
                    {['1st', '2nd', '3rd', 'shoutout'].map(rank => (
                      <label
                        key={rank}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          formData.rank === rank ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="rank"
                          value={rank}
                          checked={formData.rank === rank}
                          onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                          className="sr-only"
                        />
                        {getRankIcon(rank)}
                        <span className="font-medium">{rank === 'shoutout' ? 'Shoutout' : rank}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => createMutation.mutate(formData)}
                  disabled={createMutation.isPending || !formData.gifter_id || !formData.gift_id || !formData.rank}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Plus className="w-4 h-4 mr-2" /> Add Entry
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Import Tab */}
          <TabsContent value="import" className="space-y-4">
            <Card className="border-2 border-dashed border-purple-300 bg-purple-50/50">
              <CardContent className="p-8">
                <div className="text-center">
                  {previewUrls.length > 0 ? (
                    <div className="space-y-4">
                      <img 
                        src={previewUrls[currentImageIndex]} 
                        alt={`Screenshot ${currentImageIndex + 1}`} 
                        className="max-h-64 mx-auto rounded-lg shadow-lg"
                      />
                      {previewUrls.length > 1 && (
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setCurrentImageIndex(i => Math.max(0, i - 1))} disabled={currentImageIndex === 0}>←</Button>
                          <span className="text-sm text-gray-600">{currentImageIndex + 1} of {previewUrls.length}</span>
                          <Button variant="outline" size="sm" onClick={() => setCurrentImageIndex(i => Math.min(previewUrls.length - 1, i + 1))} disabled={currentImageIndex === previewUrls.length - 1}>→</Button>
                        </div>
                      )}
                      <div className="flex gap-2 justify-center">
                        <label className="cursor-pointer">
                          <Input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" disabled={analyzing} />
                          <Button asChild variant="outline" disabled={analyzing}>
                            <span><Plus className="w-4 h-4 mr-1" /> Add More Images</span>
                          </Button>
                        </label>
                        <Button variant="outline" onClick={() => { setPreviewUrls([]); setExtractedData(null); setProcessedCount(0); }} className="text-red-600 hover:text-red-700">
                          Start Over
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <ImageIcon className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">Upload Leaderboard Screenshots</h3>
                      <p className="text-gray-500 mb-4 text-sm">Upload one or more screenshots of your TikTok gifting leaderboard</p>
                      <label className="cursor-pointer">
                        <Input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                        <Button asChild disabled={uploading || analyzing}>
                          <span className="bg-purple-600 hover:bg-purple-700">
                            {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</> : <><Upload className="w-4 h-4 mr-2" /> Choose Screenshots</>}
                          </span>
                        </Button>
                      </label>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {analyzing && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700">Analyzing Screenshots...</h3>
                  <p className="text-gray-500 text-sm">AI is extracting gifter information</p>
                </CardContent>
              </Card>
            )}

            {importError && (
              <Alert className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-800">{importError}</AlertDescription>
              </Alert>
            )}

            {extractedData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" /> Review Extracted Data
                  </CardTitle>
                  <CardDescription>{extractedData.notes}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {extractedData.gifters?.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No gifters detected in the screenshot</p>
                  ) : (
                    <>
                      {extractedData.gifters?.map((gifter, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg space-y-3 border-2 transition-all cursor-pointer ${
                            gifter.selected ? 'bg-teal-50 border-teal-400' : 'bg-white border-gray-200'
                          }`}
                          onClick={() => updateExtractedGifter(index, 'selected', !gifter.selected)}
                        >
                          <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-3 cursor-pointer" onClick={() => updateExtractedGifter(index, 'selected', !gifter.selected)}>
                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                gifter.selected ? 'bg-teal-500 border-teal-500' : 'border-gray-300 bg-white'
                              }`}>
                                {gifter.selected && <Check className="w-4 h-4 text-white" />}
                              </div>
                              {getRankIcon(gifter.rank)}
                              <span className="font-semibold">{gifter.rank || 'Gifter'}</span>
                              {gifter.matched_contact && (
                                <Badge className="bg-green-100 text-green-700 text-xs">
                                  <UserCheck className="w-3 h-3 mr-1" /> Matched
                                </Badge>
                              )}
                            </div>
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); removeExtractedGifter(index); }} className="text-red-500">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="grid md:grid-cols-4 gap-3" onClick={(e) => e.stopPropagation()}>
                            <Input value={gifter.username || ''} onChange={(e) => updateExtractedGifter(index, 'username', e.target.value)} placeholder="@username" />
                            <Input value={gifter.screen_name || ''} onChange={(e) => updateExtractedGifter(index, 'screen_name', e.target.value)} placeholder="Screen name" />
                            <Input value={gifter.phonetic || ''} onChange={(e) => updateExtractedGifter(index, 'phonetic', e.target.value)} placeholder="Phonetic 🎵" />
                            <Input value={gifter.gift_name || ''} onChange={(e) => updateExtractedGifter(index, 'gift_name', e.target.value)} placeholder="Gift name" />
                          </div>
                        </div>
                      ))}

                      {/* Add Special Shoutout */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setExtractedData(prev => ({
                            ...prev,
                            gifters: [...prev.gifters, { rank: 'shoutout', username: '', screen_name: '', phonetic: '', gift_name: '', selected: true }]
                          }));
                        }}
                        className="border-amber-300 text-amber-700 hover:bg-amber-50"
                      >
                        <Star className="w-4 h-4 mr-2" /> Add Special Shoutout
                      </Button>

                      <div className="flex gap-3 pt-4">
                        <Button variant="outline" onClick={() => { setExtractedData(null); setPreviewUrls([]); }} className="flex-1">
                          Cancel
                        </Button>
                        <Button
                          onClick={handleConfirmImport}
                          disabled={createEntriesMutation.isPending || !extractedData.gifters?.filter(g => g.selected).length}
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                        >
                          {createEntriesMutation.isPending ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...</>
                          ) : (
                            <><Check className="w-4 h-4 mr-2" /> Import {extractedData.gifters?.filter(g => g.selected).length} Selected</>
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}