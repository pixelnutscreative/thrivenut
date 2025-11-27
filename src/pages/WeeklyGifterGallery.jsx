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
  ChevronLeft, ChevronRight, ImageIcon, UserCheck, HelpCircle, Users
} from 'lucide-react';
import { format, startOfWeek, subWeeks, addWeeks, addDays } from 'date-fns';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { getEffectiveUserEmail } from '../components/admin/ImpersonationBanner';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function WeeklyGifterGallery() {
  const queryClient = useQueryClient();
  
  // Default to most recent Sunday (week ending date)
  const getMostRecentSunday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday
    const daysToSubtract = dayOfWeek === 0 ? 0 : dayOfWeek; // If today is Sunday, use today
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - daysToSubtract);
    return format(sunday, 'yyyy-MM-dd');
  };
  const [selectedWeek, setSelectedWeek] = useState(getMostRecentSunday());
  const [activeTab, setActiveTab] = useState('summary');
  const [user, setUser] = useState(null);
  
  // Manual entry form
  const [formData, setFormData] = useState({ gifter_id: '', gift_id: '', rank: '', shoutout_reason: '' });
  const [showAddGifter, setShowAddGifter] = useState(false);
  const [newGifterData, setNewGifterData] = useState({ username: '', display_name: '', phonetic: '' });
  const [gifterSearch, setGifterSearch] = useState('');
  
  // Edit form
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState({ gifter_screen_name: '', gifter_phonetic: '' });
  
  // Share state
  const [copied, setCopied] = useState(false);
  const [allGood, setAllGood] = useState(false);
  
  // AI Import state
  const [uploading, setUploading] = useState(false);
  
  // Copy to account state
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [selectedEntryIds, setSelectedEntryIds] = useState([]);
  const [copyTargetUsername, setCopyTargetUsername] = useState('');
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
    queryFn: () => base44.entities.TikTokContact.filter({ created_by: effectiveEmail }, 'display_name', 500),
    enabled: !!effectiveEmail,
  });

  // Master contact database - ALL contacts from ALL users for matching usernames/phonetics
  const { data: allContacts = [] } = useQuery({
    queryKey: ['allTiktokContacts'],
    queryFn: () => base44.entities.TikTokContact.list('username', 1000),
  });

  const { data: managedAccounts = [] } = useQuery({
    queryKey: ['managedAccounts'],
    queryFn: () => base44.entities.ManagedAccount.list('tiktok_username'),
  });

  const isAdmin = user?.email?.toLowerCase() === 'pixelnutscreative@gmail.com';

  // Get all gifters from master list for dropdown
  const allGifters = allContacts
    .filter(c => c.is_gifter || c.data?.is_gifter)
    .map(c => ({
      id: c.id,
      username: c.data?.username || c.username || '',
      display_name: c.data?.display_name || c.display_name || '',
      phonetic: c.data?.phonetic || c.phonetic || '',
    }))
    .sort((a, b) => {
      const aName = (a.display_name || a.username || '').toLowerCase();
      const bName = (b.display_name || b.username || '').toLowerCase();
      return aName.localeCompare(bName);
    });

  // Get gifters from current user's contacts only (not the master list)
  const gifters = contacts
    .filter(c => c.is_gifter)
    .sort((a, b) => {
      const aName = (a.display_name || a.username || '').toLowerCase();
      const bName = (b.display_name || b.username || '').toLowerCase();
      return aName.localeCompare(bName);
    });

  const { data: gifts = [] } = useQuery({
    queryKey: ['gifts'],
    queryFn: () => base44.entities.Gift.list('name'),
  });

  const { data: rawEntries = [], isLoading } = useQuery({
    queryKey: ['giftingEntries', selectedWeek, effectiveEmail],
    queryFn: () => base44.entities.GiftingEntry.filter({ week: selectedWeek, owner_email: effectiveEmail }, '-created_date', 500),
    enabled: !!effectiveEmail,
  });

  // Normalize entries to flat structure (SDK returns nested data object)
  const entries = rawEntries.map(e => ({
    id: e.id,
    created_date: e.created_date,
    created_by: e.created_by,
    // Flatten data fields
    gifter_id: e.data?.gifter_id || e.gifter_id,
    gifter_username: e.data?.gifter_username || e.gifter_username,
    gifter_screen_name: e.data?.gifter_screen_name || e.gifter_screen_name,
    gifter_phonetic: e.data?.gifter_phonetic || e.gifter_phonetic,
    gift_id: e.data?.gift_id || e.gift_id,
    gift_name: e.data?.gift_name || e.gift_name,
    rank: e.data?.rank || e.rank,
    week: e.data?.week || e.week,
    shoutout_reason: e.data?.shoutout_reason || e.shoutout_reason,
  }));

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data) => {
      let gifter;
      
      // Check if selecting from master list (prefixed with master_)
      if (data.gifter_id.startsWith('master_')) {
        const masterId = data.gifter_id.replace('master_', '');
        const masterContact = allContacts.find(c => c.id === masterId);
        if (masterContact) {
          // Create a copy of the master contact for this user
          gifter = await base44.entities.TikTokContact.create({
            username: masterContact.username,
            display_name: masterContact.display_name,
            phonetic: masterContact.phonetic,
            is_gifter: true
          });
          queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
        }
      } else {
        gifter = gifters.find(g => g.id === data.gifter_id);
      }
      
      const gift = gifts.find(g => g.id === data.gift_id);
      
      return base44.entities.GiftingEntry.create({
        gifter_id: gifter?.id || data.gifter_id,
        gift_id: data.gift_id,
        rank: data.rank,
        week: selectedWeek,
        gifter_username: gifter?.username,
        gifter_screen_name: gifter?.display_name || gifter?.username,
        gifter_phonetic: gifter?.phonetic,
        gift_name: gift?.name,
        shoutout_reason: data.rank === 'shoutout' ? data.shoutout_reason : ''
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['giftingEntries'] });
      setFormData({ gifter_id: '', gift_id: '', rank: '', shoutout_reason: '' });
      setGifterSearch('');
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

  // Create a new gifter contact directly
  const createGifterMutation = useMutation({
    mutationFn: async (data) => {
      // Check if already exists in master list
      const existing = allContacts.find(c => 
        c.username?.toLowerCase() === data.username?.toLowerCase()
      );
      
      if (existing) {
        // If exists but not in user's contacts, create a copy for this user
        const userHas = contacts.find(c => c.username?.toLowerCase() === data.username?.toLowerCase());
        if (!userHas) {
          return base44.entities.TikTokContact.create({
            username: existing.username,
            display_name: data.display_name || existing.display_name,
            phonetic: data.phonetic || existing.phonetic,
            is_gifter: true
          });
        }
        // Already in user's contacts, just mark as gifter
        await base44.entities.TikTokContact.update(userHas.id, { is_gifter: true });
        return userHas;
      }
      
      // Create new
      return base44.entities.TikTokContact.create({
        username: data.username.replace('@', '').trim(),
        display_name: data.display_name || data.username,
        phonetic: data.phonetic || '',
        is_gifter: true
      });
    },
    onSuccess: (newGifter) => {
      queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
      queryClient.invalidateQueries({ queryKey: ['allTiktokContacts'] });
      setFormData(prev => ({ ...prev, gifter_id: newGifter.id }));
      setShowAddGifter(false);
      setNewGifterData({ username: '', display_name: '', phonetic: '' });
    },
  });

  // Copy entries to another account
  const copyEntriesMutation = useMutation({
    mutationFn: async ({ entryIds, targetUsername }) => {
      const targetEmail = `managed_${targetUsername.toLowerCase().replace('@', '')}@thrivenut.app`;
      
      console.log('Copying to targetEmail:', targetEmail);
      
      // Get selected entries
      const entriesToCopy = entries.filter(e => entryIds.includes(e.id));
      console.log('Entries to copy:', entriesToCopy.length);
      
      // Use backend function to create with correct created_by
      const results = [];
      for (const entry of entriesToCopy) {
        const result = await base44.functions.invoke('createAsUser', {
          entityName: 'GiftingEntry',
          data: {
            gifter_id: entry.gifter_id,
            gifter_username: entry.gifter_username,
            gifter_screen_name: entry.gifter_screen_name,
            gifter_phonetic: entry.gifter_phonetic,
            gift_id: entry.gift_id,
            gift_name: entry.gift_name,
            rank: entry.rank,
            week: entry.week
          },
          targetEmail
        });
        console.log('Created entry result:', result);
        results.push(result);
      }
      
      // Also copy the contacts
      const contactIds = [...new Set(entriesToCopy.map(e => e.gifter_id).filter(Boolean))];
      const contactsToCopy = allContacts.filter(c => contactIds.includes(c.id));
      
      for (const contact of contactsToCopy) {
        const result = await base44.functions.invoke('createAsUser', {
          entityName: 'TikTokContact',
          data: {
            username: contact.username || contact.data?.username,
            display_name: contact.display_name || contact.data?.display_name,
            phonetic: contact.phonetic || contact.data?.phonetic,
            is_gifter: true
          },
          targetEmail
        });
        console.log('Created contact result:', result);
        results.push(result);
      }
      
      return results;
    },
    onSuccess: (results) => {
      console.log('Copy complete, results:', results);
      queryClient.invalidateQueries({ queryKey: ['giftingEntries'] });
      queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
      setShowCopyModal(false);
      setSelectedEntryIds([]);
      setCopyTargetUsername('');
      alert(`Successfully copied ${results.length} items to the target account!`);
    },
    onError: (error) => {
      console.error('Copy failed:', error);
      alert('Copy failed: ' + error.message);
    },
  });

  // Check if we're impersonating (effectiveEmail differs from real user email)
  const isImpersonating = effectiveEmail && user?.email && effectiveEmail !== user.email;

  // Helper to create entities with owner_email set correctly
  const createAsTargetUser = async (entityName, data) => {
    // Always add owner_email for GiftingEntry
    if (entityName === 'GiftingEntry') {
      data.owner_email = effectiveEmail;
    }
    return base44.entities[entityName].create(data);
  };

  const createEntriesMutation = useMutation({
    mutationFn: async (entriesToCreate) => {
      const promises = entriesToCreate.map(async (entry) => {
        let gifter = gifters.find(g => 
          g.username?.toLowerCase() === entry.username?.toLowerCase()
        );

        if (!gifter && entry.username) {
          // Create contact using helper
          const contactData = {
            username: entry.username,
            display_name: entry.screen_name || entry.username,
            phonetic: entry.phonetic || '',
            is_gifter: true,
            gifted_for: preferences?.tiktok_username ? [preferences.tiktok_username] : []
          };
          gifter = await createAsTargetUser('TikTokContact', contactData);
        } else if (gifter && preferences?.tiktok_username) {
          // Update existing gifter to add this receiver if not already there
          const currentGiftedFor = gifter.gifted_for || gifter.data?.gifted_for || [];
          if (!currentGiftedFor.includes(preferences.tiktok_username)) {
            await base44.entities.TikTokContact.update(gifter.id, {
              gifted_for: [...currentGiftedFor, preferences.tiktok_username]
            });
          }
        }

        if (!gifter) return null;

        let gift = entry.gift_name 
          ? gifts.find(g => g.name?.toLowerCase().includes(entry.gift_name?.toLowerCase()))
          : null;

        // Create entry using helper
        const entryData = {
          gifter_id: gifter.id,
          gifter_username: gifter.username || entry.username,
          gifter_screen_name: entry.screen_name || gifter.display_name,
          gifter_phonetic: entry.phonetic || gifter.phonetic,
          gift_id: gift?.id || '',
          gift_name: gift?.name || entry.gift_name || 'Unknown',
          rank: entry.rank,
          week: selectedWeek,
          owner_email: effectiveEmail
        };
        return createAsTargetUser('GiftingEntry', entryData);
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

  // Sorting entries by rank
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
            prompt: `Analyze this TikTok gifting leaderboard screenshot and extract the TOP 3 gifters for EACH gift visible.

          Look for:
          - The gift name/type shown
          - 1st, 2nd, 3rd place gifters for that gift
          - Usernames (usually start with @)
          - Display names / screen names

          CRITICAL RULES:
          - For EACH gift visible, extract exactly 3 entries (1st, 2nd, 3rd place)
          - If a gifter name just says "Gifter" or is generic, use "N/A" for both username and screen_name
          - If you can only see 1 or 2 gifters for a gift, still create 3 entries with "N/A" for missing ones
          - For each real username, generate a "suggested_phonetic" field with how it would be pronounced naturally in English for a song
          - Make sure to identify the gift name for each set of gifters`,
            file_urls: [file_url],
            response_json_schema: {
              type: "object",
              properties: {
                gifters: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                       rank: { type: "string", description: "1st, 2nd, or 3rd" },
                       username: { type: "string", description: "TikTok username without @, or N/A if not visible/generic" },
                       screen_name: { type: "string", description: "Display name shown, or N/A if just says Gifter or not visible" },
                       suggested_phonetic: { type: "string", description: "How the username/name would be pronounced for a song" },
                       gift_name: { type: "string", description: "Name of gift this gifter sent" }
                     }
                  }
                },
                gifts_found: {
                  type: "number",
                  description: "Total number of different gifts found in image"
                }
              }
            }
          });
          
          // Process and add new gifters immediately
          // NOTE: We do NOT deduplicate - same person can be 1st place for multiple gifts!
          if (result.gifters) {
            const newGifters = result.gifters
              .filter(g => {
                // Allow entries even without username - we match by screen_name (display name)
                const screenName = (g.screen_name || g.username || '')?.toLowerCase()?.trim();
                if (!screenName) return false;
                // Create a unique key including rank and gift to allow same person multiple times
                const uniqueKey = `${screenName}-${g.rank}-${g.gift_name || 'unknown'}`;
                if (seenUsernames.has(uniqueKey)) return false;
                seenUsernames.add(uniqueKey);
                return true;
              })
              .map(gifter => {
                const screenName = (gifter.screen_name || '')?.toLowerCase()?.trim();
                const extractedUsername = gifter.username?.toLowerCase()?.replace('@', '')?.replace(/\s+/g, '');

                // Search ALL contacts app-wide using fuzzy matching
                let masterMatch = null;
                
                // 1. Exact username match
                if (extractedUsername) {
                  masterMatch = allContacts.find(c => {
                    const cUsername = (c.data?.username || c.username || '')?.toLowerCase()?.replace('@', '')?.replace(/\s+/g, '');
                    return cUsername === extractedUsername;
                  });
                }
                
                // 2. Exact display_name match
                if (!masterMatch && screenName) {
                  masterMatch = allContacts.find(c => {
                    const cDisplayName = (c.data?.display_name || c.display_name || '')?.toLowerCase()?.trim();
                    return cDisplayName && cDisplayName === screenName;
                  });
                }
                
                // 3. Partial username match (username contains or is contained by extracted)
                if (!masterMatch && extractedUsername && extractedUsername.length >= 4) {
                  masterMatch = allContacts.find(c => {
                    const cUsername = (c.data?.username || c.username || '')?.toLowerCase()?.replace('@', '')?.replace(/\s+/g, '');
                    if (!cUsername || cUsername.length < 4) return false;
                    return cUsername.includes(extractedUsername) || extractedUsername.includes(cUsername);
                  });
                }
                
                // 4. Partial display name match (for cases like "Sunny Puffs" matching "sunnypuffs43")
                if (!masterMatch && screenName && screenName.length >= 4) {
                  // Try matching display name to username (removing spaces)
                  const screenNameNoSpaces = screenName.replace(/\s+/g, '').toLowerCase();
                  masterMatch = allContacts.find(c => {
                    const cUsername = (c.data?.username || c.username || '')?.toLowerCase()?.replace('@', '')?.replace(/\s+/g, '');
                    const cDisplayName = (c.data?.display_name || c.display_name || '')?.toLowerCase()?.replace(/\s+/g, '');
                    if (!cUsername && !cDisplayName) return false;
                    // Check if screen name is contained in username or vice versa
                    return (cUsername && (cUsername.includes(screenNameNoSpaces) || screenNameNoSpaces.includes(cUsername.replace(/\d+$/, '')))) ||
                           (cDisplayName && (cDisplayName.includes(screenNameNoSpaces) || screenNameNoSpaces.includes(cDisplayName)));
                  });
                }

                // Use master match data if available
                const matchedDisplayName = masterMatch?.data?.display_name || masterMatch?.display_name;
                const matchedPhonetic = masterMatch?.data?.phonetic || masterMatch?.phonetic;
                const matchedUsername = masterMatch?.data?.username || masterMatch?.username;

                return {
                  ...gifter,
                  matched_contact: masterMatch || null,
                  screen_name: matchedDisplayName || gifter.screen_name || '',
                  phonetic: matchedPhonetic || gifter.suggested_phonetic || '',
                  // Only use username if we found a match in master DB, otherwise leave blank so user knows to input it
                  username: matchedUsername || '',
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
          <div className="flex gap-2">
            {isAdmin && !isImpersonating && (
              <Link to={createPageUrl('MasterContactDatabase')}>
                <Button variant="outline" className="text-indigo-600 border-indigo-300 hover:bg-indigo-50">
                  <Users className="w-4 h-4 mr-2" /> Master DB
                </Button>
              </Link>
            )}
            <Link to={createPageUrl('SongGenerator')}>
              <Button className="bg-gradient-to-r from-amber-500 via-purple-500 to-pink-500 hover:from-amber-600 hover:via-purple-600 hover:to-pink-600">
                <Sparkles className="w-4 h-4 mr-2" /> Generate Song
              </Button>
            </Link>
          </div>
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
                <input
                  type="date"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="font-bold text-lg text-center bg-transparent border-none cursor-pointer hover:text-purple-600"
                />
                <p className="text-xs text-purple-600">{format(new Date(selectedWeek + 'T12:00:00'), 'MMMM d, yyyy')}</p>
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
            {/* Selection Controls */}
            {sortedEntries.length > 0 && (
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedEntryIds.length === sortedEntries.length}
                        onCheckedChange={(checked) => {
                          setSelectedEntryIds(checked ? sortedEntries.map(e => e.id) : []);
                        }}
                      />
                      <span className="text-sm font-medium">
                        {selectedEntryIds.length} of {sortedEntries.length} selected
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={async () => {
                          if (confirm(`Delete ${selectedEntryIds.length} selected entries?`)) {
                            for (const id of selectedEntryIds) {
                              await deleteMutation.mutateAsync(id);
                            }
                            setSelectedEntryIds([]);
                          }
                        }}
                        disabled={selectedEntryIds.length === 0}
                      >
                        Delete Selected
                      </Button>
                      {isAdmin && (
                        <Button
                          size="sm"
                          onClick={() => setShowCopyModal(true)}
                          disabled={selectedEntryIds.length === 0}
                          className="bg-amber-600 hover:bg-amber-700"
                        >
                          Copy to Account
                        </Button>
                      )}
                    </div>
                  </div>
                  {/* Import batch selection */}
                  {(() => {
                    // Group entries by import batch (within 2 minutes of each other)
                    const batches = [];
                    const sorted = [...sortedEntries].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
                    sorted.forEach(entry => {
                      const entryTime = new Date(entry.created_date).getTime();
                      const existingBatch = batches.find(b => Math.abs(b.time - entryTime) < 2 * 60 * 1000);
                      if (existingBatch) {
                        existingBatch.ids.push(entry.id);
                      } else {
                        batches.push({ time: entryTime, ids: [entry.id], date: entry.created_date });
                      }
                    });
                    
                    if (batches.length <= 1) return null;
                    
                    return (
                      <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-amber-200">
                        <span className="text-xs text-amber-700">Select batch:</span>
                        {batches.slice(0, 5).map((batch, idx) => (
                          <Button
                            key={idx}
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-amber-300"
                            onClick={() => setSelectedEntryIds(batch.ids)}
                          >
                            {idx === 0 ? 'Latest' : format(new Date(batch.date), 'MMM d h:mm a')} ({batch.ids.length})
                          </Button>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

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
                        {isAdmin && (
                          <div className="float-left mr-3">
                            <Checkbox
                              checked={selectedEntryIds.includes(entry.id)}
                              onCheckedChange={(checked) => {
                                setSelectedEntryIds(prev => 
                                  checked ? [...prev, entry.id] : prev.filter(id => id !== entry.id)
                                );
                              }}
                            />
                          </div>
                        )}
                        {(() => {
                                  // Use flat fields directly
                                  const rank = entry.rank;
                                  const gifterScreenName = entry.gifter_screen_name;
                                  const gifterUsername = entry.gifter_username;
                                  const giftName = entry.gift_name;
                                  const gifterPhonetic = entry.gifter_phonetic;

                                  return (
                                  <div className="space-y-2">
                                    {/* Header row with checkbox, rank, and delete */}
                                    <div className="flex items-center gap-3">
                                      {getRankIcon(rank)}
                                      <span className="font-bold text-sm">{rank || 'Gifter'}</span>
                                      <Badge variant="secondary" className="text-xs">{giftName}</Badge>
                                      <div className="flex-1" />
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteMutation.mutate(entry.id)}
                                        className="text-red-400 hover:text-red-600 h-7 w-7 p-0"
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </div>

                                    {/* Always-editable inline fields */}
                                    <div className="grid grid-cols-5 gap-2">
                                      <Select 
                                        value={rank} 
                                        onValueChange={(v) => updateEntryMutation.mutate({ entryId: entry.id, data: { rank: v } })}
                                      >
                                        <SelectTrigger className="h-9 text-sm">
                                          <SelectValue placeholder="Rank" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="1st">🥇 1st</SelectItem>
                                          <SelectItem value="2nd">🥈 2nd</SelectItem>
                                          <SelectItem value="3rd">🥉 3rd</SelectItem>
                                          <SelectItem value="shoutout">⭐ Shoutout</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <Select 
                                        value={giftName || ''} 
                                        onValueChange={(v) => {
                                          const gift = gifts.find(g => g.name === v);
                                          updateEntryMutation.mutate({ entryId: entry.id, data: { gift_name: v, gift_id: gift?.id || '' } });
                                        }}
                                      >
                                        <SelectTrigger className="h-9 text-sm">
                                          <SelectValue placeholder="Gift" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {gifts.map(gift => (
                                            <SelectItem key={gift.id} value={gift.name}>{gift.name}</SelectItem>
                                          ))}
                                          {giftName && !gifts.find(g => g.name === giftName) && (
                                            <SelectItem value={giftName}>{giftName} (custom)</SelectItem>
                                          )}
                                        </SelectContent>
                                      </Select>
                                      <Input 
                                        value={gifterUsername || ''} 
                                        onChange={(e) => updateEntryMutation.mutate({ entryId: entry.id, data: { gifter_username: e.target.value } })}
                                        placeholder="@username" 
                                        className="h-9"
                                      />
                                      <Input 
                                        value={gifterScreenName || ''} 
                                        onChange={(e) => updateEntryMutation.mutate({ entryId: entry.id, data: { gifter_screen_name: e.target.value } })}
                                        placeholder="Display name" 
                                        className="h-9"
                                      />
                                      <Input 
                                        value={gifterPhonetic || ''} 
                                        onChange={(e) => updateEntryMutation.mutate({ entryId: entry.id, data: { gifter_phonetic: e.target.value } })}
                                        placeholder="Phonetic 🎵" 
                                        className="h-9"
                                      />
                                    </div>
                                  </div>
                                );
                                })()}
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
                <CardDescription>Select from your saved gifters, search the master list, or add new</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Gifter *</Label>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowAddGifter(!showAddGifter)}
                        className="h-6 text-xs text-purple-600"
                      >
                        <Plus className="w-3 h-3 mr-1" /> {showAddGifter ? 'Search Existing' : 'Add New'}
                      </Button>
                    </div>
                    
                    {showAddGifter ? (
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 space-y-3">
                        <div className="grid grid-cols-3 gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">
                          <span>@Username</span>
                          <span>Display Name</span>
                          <span>Phonetic Name</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            placeholder="@username"
                            value={newGifterData.username}
                            onChange={(e) => setNewGifterData(prev => ({ ...prev, username: e.target.value }))}
                          />
                          <Input
                            placeholder="Display name"
                            value={newGifterData.display_name}
                            onChange={(e) => setNewGifterData(prev => ({ ...prev, display_name: e.target.value }))}
                          />
                          <Input
                            placeholder="Phonetic 🎵"
                            value={newGifterData.phonetic}
                            onChange={(e) => setNewGifterData(prev => ({ ...prev, phonetic: e.target.value }))}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => createGifterMutation.mutate(newGifterData)}
                            disabled={!newGifterData.username.trim() || createGifterMutation.isPending}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            {createGifterMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                            Add Gifter
                          </Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => setShowAddGifter(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Search input for filtering */}
                        <Input
                          placeholder="Search by username, display name, or phonetic..."
                          value={gifterSearch}
                          onChange={(e) => setGifterSearch(e.target.value)}
                        />
                        
                        {/* Column headers */}
                        <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 border-b pb-1">
                          <div className="col-span-3">@Username</div>
                          <div className="col-span-4">Display Name</div>
                          <div className="col-span-4">Phonetic Name</div>
                          <div className="col-span-1"></div>
                        </div>
                        
                        {/* Scrollable list of gifters */}
                        <div className="max-h-48 overflow-y-auto border rounded-lg bg-white">
                          {allGifters
                            .filter(g => 
                              !gifterSearch || 
                              g.display_name?.toLowerCase().includes(gifterSearch.toLowerCase()) ||
                              g.username?.toLowerCase().includes(gifterSearch.toLowerCase()) ||
                              g.phonetic?.toLowerCase().includes(gifterSearch.toLowerCase())
                            )
                            .map(gifter => (
                              <div 
                                key={gifter.id}
                                onClick={() => setFormData({ ...formData, gifter_id: `master_${gifter.id}` })}
                                className={`grid grid-cols-12 gap-2 p-2 cursor-pointer hover:bg-purple-50 transition-colors border-b last:border-b-0 ${
                                  formData.gifter_id === `master_${gifter.id}` ? 'bg-purple-100 border-purple-300' : ''
                                }`}
                              >
                                <div className="col-span-3 text-sm font-mono text-purple-700 truncate">@{gifter.username}</div>
                                <div className="col-span-4 text-sm truncate">{gifter.display_name || <span className="text-gray-400 italic">-</span>}</div>
                                <div className="col-span-4 text-sm text-gray-600 truncate">{gifter.phonetic || <span className="text-gray-400 italic">-</span>}</div>
                                <div className="col-span-1 flex justify-end">
                                  {formData.gifter_id === `master_${gifter.id}` && <Check className="w-4 h-4 text-purple-600" />}
                                </div>
                              </div>
                            ))
                          }
                          {allGifters.filter(g => 
                            !gifterSearch || 
                            g.display_name?.toLowerCase().includes(gifterSearch.toLowerCase()) ||
                            g.username?.toLowerCase().includes(gifterSearch.toLowerCase()) ||
                            g.phonetic?.toLowerCase().includes(gifterSearch.toLowerCase())
                          ).length === 0 && (
                            <div className="p-4 text-sm text-gray-500 text-center">
                              {gifterSearch ? 'No matching gifters found' : 'No gifters in database yet'}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Show selected gifter info */}
                    {formData.gifter_id && !showAddGifter && (() => {
                      const masterId = formData.gifter_id.replace('master_', '');
                      const selected = allGifters.find(g => g.id === masterId);
                      if (!selected) return null;
                      return (
                        <div className="p-2 bg-purple-50 rounded-lg border border-purple-200 text-sm">
                          <span className="font-medium text-purple-700">Selected:</span> {selected.display_name || selected.username}
                          {selected.phonetic && <span className="text-purple-600 ml-2">🎵 "{selected.phonetic}"</span>}
                        </div>
                      );
                    })()}
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

                {formData.rank === 'shoutout' && (
                  <div className="space-y-2 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <Label>Shoutout Reason</Label>
                    <Input
                      placeholder="e.g., Always supports the stream, Amazing community member..."
                      value={formData.shoutout_reason}
                      onChange={(e) => setFormData({ ...formData, shoutout_reason: e.target.value })}
                    />
                    <p className="text-xs text-purple-600">Describe why this person deserves a special shoutout</p>
                  </div>
                )}

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

            {analyzing && !extractedData?.gifters?.length && (
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

            {extractedData && (extractedData.gifters?.length > 0 || analyzing) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {analyzing && <Loader2 className="w-5 h-5 animate-spin text-purple-500" />}
                    <Sparkles className="w-5 h-5 text-purple-500" /> 
                    {analyzing ? 'Extracting Gifters...' : 'Review Extracted Data'}
                    {extractedData.gifters?.length > 0 && (
                      <Badge variant="secondary">{extractedData.gifters.length} found</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>{extractedData.notes}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {extractedData.gifters?.length === 0 && !analyzing ? (
                    <p className="text-gray-500 text-center py-4">No gifters detected in the screenshot</p>
                  ) : (
                    <>
                      {extractedData.gifters?.map((gifter, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            gifter.selected ? 'bg-teal-50 border-teal-400' : 'bg-white border-gray-200'
                          }`}
                        >
                          {/* Header row */}
                          <div className="flex items-center gap-3 mb-3">
                            <button
                              onClick={() => updateExtractedGifter(index, 'selected', !gifter.selected)}
                              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                                gifter.selected ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white hover:border-green-400'
                              }`}
                            >
                              {gifter.selected && <Check className="w-4 h-4 text-white" />}
                            </button>
                            {getRankIcon(gifter.rank)}
                            <span className="font-bold">{gifter.rank || 'Gifter'}</span>
                            {gifter.matched_contact && (
                              <Badge className="bg-green-100 text-green-700 text-xs">
                                <UserCheck className="w-3 h-3 mr-1" /> From Master DB
                              </Badge>
                            )}
                            <div className="flex-1" />
                            <Button variant="ghost" size="sm" onClick={() => removeExtractedGifter(index)} className="text-red-400 hover:text-red-600 h-7 w-7 p-0">
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          {/* Always-editable fields */}
                          <div className="grid grid-cols-6 gap-2">
                            <Select value={gifter.rank || ''} onValueChange={(v) => updateExtractedGifter(index, 'rank', v)}>
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="Rank" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1st">🥇 1st</SelectItem>
                                <SelectItem value="2nd">🥈 2nd</SelectItem>
                                <SelectItem value="3rd">🥉 3rd</SelectItem>
                                <SelectItem value="4th">4th</SelectItem>
                                <SelectItem value="5th">5th</SelectItem>
                                <SelectItem value="6th">6th</SelectItem>
                                <SelectItem value="7th">7th</SelectItem>
                                <SelectItem value="8th">8th</SelectItem>
                                <SelectItem value="9th">9th</SelectItem>
                                <SelectItem value="10th">10th</SelectItem>
                                <SelectItem value="shoutout">⭐ Shoutout</SelectItem>
                              </SelectContent>
                            </Select>
                            <Select 
                              value={gifter.matched_contact?.id ? `master_${gifter.matched_contact.id}` : ''} 
                              onValueChange={(v) => {
                                const masterId = v.replace('master_', '');
                                const match = allGifters.find(g => g.id === masterId);
                                if (match) {
                                  updateExtractedGifter(index, 'username', match.username);
                                  updateExtractedGifter(index, 'screen_name', match.display_name);
                                  updateExtractedGifter(index, 'phonetic', match.phonetic);
                                  updateExtractedGifter(index, 'matched_contact', { id: masterId });
                                }
                              }}
                            >
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="Pick from DB" />
                              </SelectTrigger>
                              <SelectContent className="max-h-60">
                                {allGifters.map(g => (
                                  <SelectItem key={`master_${g.id}`} value={`master_${g.id}`}>
                                    {g.display_name || g.username}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input 
                              value={gifter.username || ''} 
                              onChange={(e) => updateExtractedGifter(index, 'username', e.target.value)} 
                              placeholder="@username" 
                              className="h-9"
                            />
                            <Input 
                              value={gifter.screen_name || ''} 
                              onChange={(e) => updateExtractedGifter(index, 'screen_name', e.target.value)} 
                              placeholder="Display name" 
                              className="h-9"
                            />
                            <Input 
                              value={gifter.phonetic || ''} 
                              onChange={(e) => updateExtractedGifter(index, 'phonetic', e.target.value)} 
                              placeholder="Phonetic 🎵" 
                              className="h-9"
                            />
                            <Select 
                              value={gifter.gift_name || ''} 
                              onValueChange={(v) => updateExtractedGifter(index, 'gift_name', v)}
                            >
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="Gift" />
                              </SelectTrigger>
                              <SelectContent>
                                {gifts.map(gift => (
                                  <SelectItem key={gift.id} value={gift.name}>{gift.name}</SelectItem>
                                ))}
                                {gifter.gift_name && !gifts.find(g => g.name === gifter.gift_name) && (
                                  <SelectItem value={gifter.gift_name}>{gifter.gift_name} (custom)</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </motion.div>
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

                      {!analyzing && (
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
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Copy to Account Modal */}
      <Dialog open={showCopyModal} onOpenChange={setShowCopyModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copy {selectedEntryIds.length} Entries to Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Target TikTok Username</Label>
              <Input
                placeholder="@foleyfarms"
                value={copyTargetUsername}
                onChange={(e) => setCopyTargetUsername(e.target.value)}
              />
            </div>
            {managedAccounts.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm text-gray-500">Or select managed account:</Label>
                <div className="flex flex-wrap gap-2">
                  {managedAccounts.map(acc => (
                    <Badge
                      key={acc.id}
                      variant={copyTargetUsername.toLowerCase().replace('@','') === acc.tiktok_username?.toLowerCase() ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setCopyTargetUsername(acc.tiktok_username || '')}
                    >
                      @{acc.tiktok_username}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCopyModal(false)}>Cancel</Button>
            <Button
              onClick={() => copyEntriesMutation.mutate({ entryIds: selectedEntryIds, targetUsername: copyTargetUsername })}
              disabled={!copyTargetUsername.trim() || copyEntriesMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {copyEntriesMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Copy Entries
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}