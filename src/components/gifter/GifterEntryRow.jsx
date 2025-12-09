import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Check, Loader2, Save, X } from 'lucide-react';

/**
 * Auto-saving gifter entry row component
 * Used in both WeeklyGifterGallery and SongGenerator
 * 
 * Props:
 * - entry: existing entry object (for editing) or null (for new)
 * - allContacts: array of all TikTok contacts for username lookup
 * - gifts: array of gift options
 * - week: string date for the week
 * - ownerEmail: email for the owner_email field
 * - onSaved: callback when entry is saved
 * - onRemove: callback to remove this row
 * - showGift: boolean - whether to show gift column (false for watch time songs)
 * - showAmount: boolean - whether to show amount/time column
 * - amountLabel: string - label for amount column (e.g., "Watch Time", "Amount")
 * - timePeriod: string - time period for display
 */
export default function GifterEntryRow({ 
  entry, 
  allContacts = [], 
  gifts = [], 
  week,
  ownerEmail,
  onSaved,
  onRemove,
  showGift = true,
  showAmount = false,
  amountLabel = "Amount"
}) {
  const queryClient = useQueryClient();
  const [usernameOpen, setUsernameOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [usernameSearch, setUsernameSearch] = useState('');
  const [giftSearch, setGiftSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const saveTimeoutRef = useRef(null);
  
  // Local form state
  const [formData, setFormData] = useState({
    username: entry?.gifter_username || '',
    display_name: entry?.gifter_screen_name || '',
    phonetic: entry?.gifter_phonetic || '',
    rank: entry?.rank || '',
    gift_name: entry?.gift_name || '',
    gift_id: entry?.gift_id || '',
    amount: entry?.amount || '',
  });

  // Normalize contact data
  const normalizedContacts = allContacts
    .map(c => ({
      id: c.id,
      username: c.username || c.data?.username || '',
      display_name: c.display_name || c.data?.display_name || '',
      phonetic: c.phonetic || c.data?.phonetic || ''
    }))
    .filter(c => c.username)
    .sort((a, b) => (a.display_name || a.username).toLowerCase().localeCompare((b.display_name || b.username).toLowerCase()));

  // Filter contacts by search
  const filteredContacts = usernameSearch 
    ? normalizedContacts.filter(c => 
        c.username.toLowerCase().includes(usernameSearch.toLowerCase()) ||
        c.display_name.toLowerCase().includes(usernameSearch.toLowerCase())
      )
    : normalizedContacts;

  // Filter gifts by search
  const filteredGifts = giftSearch
    ? gifts.filter(g => g.name?.toLowerCase().includes(giftSearch.toLowerCase()))
    : gifts;

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      // Find or create gifter contact
      let gifterId = entry?.gifter_id;
      
      if (data.username && !gifterId) {
        // Check if contact exists
        const existing = normalizedContacts.find(c => 
          c.username.toLowerCase() === data.username.toLowerCase()
        );
        
        if (existing) {
          gifterId = existing.id;
        } else {
          // Create new contact
          const newContact = await base44.entities.TikTokContact.create({
            username: data.username.replace('@', ''),
            display_name: data.display_name || data.username,
            phonetic: data.phonetic || '',
            is_gifter: true
          });
          gifterId = newContact.id;
          queryClient.invalidateQueries({ queryKey: ['allTiktokContacts'] });
        }
      }
      
      const entryData = {
        gifter_id: gifterId,
        gifter_username: data.username,
        gifter_screen_name: data.display_name,
        gifter_phonetic: data.phonetic,
        gift_id: data.gift_id,
        gift_name: data.gift_name,
        rank: data.rank,
        week: week,
        owner_email: ownerEmail,
        amount: data.amount || null
      };

      if (entry?.id) {
        return base44.entities.GiftingEntry.update(entry.id, entryData);
      } else {
        return base44.entities.GiftingEntry.create(entryData);
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['giftingEntries'] });
      setIsDirty(false);
      setIsSaving(false);
      if (onSaved) onSaved(result);
    },
    onError: () => {
      setIsSaving(false);
    }
  });

  // Auto-save when user stops typing (debounced)
  const scheduleAutoSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setIsDirty(true);
    
    saveTimeoutRef.current = setTimeout(() => {
      // Only auto-save if we have minimum required data
      if (formData.username && formData.rank) {
        handleSave();
      }
    }, 1500); // 1.5 second debounce
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    scheduleAutoSave();
  };

  const handleSelectContact = (contact) => {
    setFormData(prev => ({
      ...prev,
      username: contact.username,
      display_name: contact.display_name || contact.username,
      phonetic: contact.phonetic || contact.display_name || contact.username
    }));
    setUsernameOpen(false);
    setUsernameSearch('');
    scheduleAutoSave();
  };

  const handleAddNewUsername = () => {
    if (usernameSearch.trim()) {
      setFormData(prev => ({
        ...prev,
        username: usernameSearch.replace('@', '')
      }));
      setUsernameOpen(false);
      setUsernameSearch('');
      scheduleAutoSave();
    }
  };

  const handleSelectGift = (gift) => {
    setFormData(prev => ({
      ...prev,
      gift_name: gift.name,
      gift_id: gift.id
    }));
    setGiftOpen(false);
    setGiftSearch('');
    scheduleAutoSave();
  };

  const handleSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setIsSaving(true);
    saveMutation.mutate(formData);
  };

  // Determine column widths based on what's shown
  const getGridCols = () => {
    if (showGift && showAmount) return 'grid-cols-8';
    if (showGift || showAmount) return 'grid-cols-7';
    return 'grid-cols-6';
  };

  return (
    <div className={`grid ${getGridCols()} gap-2 p-3 bg-gray-50 rounded-lg items-center`}>
      {/* Username - Searchable */}
      <div className="col-span-2">
        <Popover open={usernameOpen} onOpenChange={setUsernameOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full h-9 text-xs font-mono justify-start truncate">
              {formData.username ? `@${formData.username}` : 'Select...'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <Command>
              <CommandInput 
                placeholder="Search or type username..." 
                value={usernameSearch}
                onValueChange={setUsernameSearch}
              />
              <CommandList>
                <CommandEmpty>
                  {usernameSearch ? (
                    <button 
                      onClick={handleAddNewUsername}
                      className="w-full p-2 text-sm text-left hover:bg-gray-100 text-purple-600"
                    >
                      + Add "@{usernameSearch.replace('@', '')}"
                    </button>
                  ) : (
                    <span className="text-gray-500">Type to search...</span>
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {filteredContacts.slice(0, 50).map(c => (
                    <CommandItem 
                      key={c.id} 
                      value={c.username}
                      onSelect={() => handleSelectContact(c)}
                      className="cursor-pointer"
                    >
                      <span className="font-mono text-xs">@{c.username}</span>
                      {c.display_name && (
                        <span className="ml-2 text-gray-500 text-xs truncate">- {c.display_name}</span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {/* Display Name */}
      <Input
        placeholder="Display name"
        value={formData.display_name}
        onChange={(e) => updateField('display_name', e.target.value)}
        className="h-9 text-xs"
      />

      {/* Phonetic */}
      <Input
        placeholder="Phonetic 🎵"
        value={formData.phonetic}
        onChange={(e) => updateField('phonetic', e.target.value)}
        className="h-9 text-xs"
      />

      {/* Rank */}
      <Select value={formData.rank} onValueChange={(v) => updateField('rank', v)}>
        <SelectTrigger className="h-9 text-xs">
          <SelectValue placeholder="Rank" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1st">🥇 1st</SelectItem>
          <SelectItem value="2nd">🥈 2nd</SelectItem>
          <SelectItem value="3rd">🥉 3rd</SelectItem>
          <SelectItem value="shoutout">⭐ Shoutout</SelectItem>
        </SelectContent>
      </Select>

      {/* Gift - Searchable (conditional) */}
      {showGift && (
        <Popover open={giftOpen} onOpenChange={setGiftOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full h-9 text-xs justify-start truncate">
              {formData.gift_name || 'Select gift...'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0" align="start">
            <Command>
              <CommandInput 
                placeholder="Search gifts..." 
                value={giftSearch}
                onValueChange={setGiftSearch}
              />
              <CommandList>
                <CommandEmpty>
                  {giftSearch ? (
                    <button 
                      onClick={() => {
                        setFormData(prev => ({ ...prev, gift_name: giftSearch, gift_id: '' }));
                        setGiftOpen(false);
                        setGiftSearch('');
                        scheduleAutoSave();
                      }}
                      className="w-full p-2 text-sm text-left hover:bg-gray-100 text-purple-600"
                    >
                      + Add "{giftSearch}"
                    </button>
                  ) : (
                    <span className="text-gray-500">No gifts found</span>
                  )}
                </CommandEmpty>
                <CommandGroup>
                  {filteredGifts.slice(0, 50).map(g => (
                    <CommandItem 
                      key={g.id} 
                      value={g.name}
                      onSelect={() => handleSelectGift(g)}
                      className="cursor-pointer"
                    >
                      {g.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}

      {/* Amount/Time (conditional) */}
      {showAmount && (
        <Input
          placeholder={amountLabel}
          value={formData.amount}
          onChange={(e) => updateField('amount', e.target.value)}
          className="h-9 text-xs"
        />
      )}

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Save indicator / button */}
        {isDirty && !isSaving && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSave}
            className="h-8 w-8 p-0 text-amber-500 hover:text-amber-600 hover:bg-amber-50"
            title="Save now"
          >
            <Save className="w-4 h-4" />
          </Button>
        )}
        {isSaving && (
          <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
        )}
        {!isDirty && !isSaving && entry?.id && (
          <Check className="w-4 h-4 text-green-500" title="Saved" />
        )}
        
        {/* Remove */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onRemove} 
          className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}