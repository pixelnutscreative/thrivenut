import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, User, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function QuickAddContactSelect({ 
  contacts, 
  value, 
  onChange, 
  onQuickAdd,
  placeholder = "Search...",
  disabled = false,
  useMasterDb = true // Use master database for lookup
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const wrapperRef = useRef(null);

  // Fetch master database for auto-fill
  const { data: masterContacts = [] } = useQuery({
    queryKey: ['masterTikTokContacts'],
    queryFn: () => base44.entities.TikTokContact.list('username', 5000),
    staleTime: 5 * 60 * 1000,
    enabled: useMasterDb,
  });

  // Consolidate master contacts by username
  const masterByUsername = useMemo(() => {
    const byUsername = {};
    masterContacts.forEach(c => {
      const username = (c.username || '').toLowerCase().replace('@', '').trim();
      if (!username) return;
      if (!byUsername[username]) {
        byUsername[username] = c;
      } else {
        // Prefer entries with more data
        const current = byUsername[username];
        if (!current.display_name && c.display_name) byUsername[username].display_name = c.display_name;
        if (!current.phonetic && c.phonetic) byUsername[username].phonetic = c.phonetic;
      }
    });
    return byUsername;
  }, [masterContacts]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowQuickAdd(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter from user's contacts first
  const filteredContacts = contacts.filter(c => 
    c.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.real_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 10);

  // Also search master database for suggestions
  const masterSuggestions = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    const term = searchTerm.toLowerCase().replace('@', '');
    const existingUsernames = new Set(contacts.map(c => (c.username || '').toLowerCase().replace('@', '')));
    
    return Object.values(masterByUsername)
      .filter(c => {
        const username = (c.username || '').toLowerCase();
        return !existingUsernames.has(username) && (
          username.includes(term) ||
          (c.display_name || '').toLowerCase().includes(term)
        );
      })
      .slice(0, 5);
  }, [searchTerm, masterByUsername, contacts]);

  const handleSelect = (contactId) => {
    onChange(contactId);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleQuickAdd = async (masterData = null) => {
    if (!searchTerm.trim() && !masterData) return;
    
    const username = masterData?.username || searchTerm.replace('@', '').trim();
    
    if (onQuickAdd) {
      // If we have master data, pass it along for auto-fill
      const newContactId = await onQuickAdd(username, masterData);
      if (newContactId) {
        onChange(newContactId);
      }
    }
    
    setSearchTerm('');
    setIsOpen(false);
    setShowQuickAdd(false);
  };

  const noResults = searchTerm.length > 0 && filteredContacts.length === 0;

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            setShowQuickAdd(false);
          }}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
          className="pl-7 h-8 text-xs"
        />
      </div>

      {isOpen && (searchTerm.length > 0 || filteredContacts.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredContacts.map(contact => (
            <div
              key={contact.id}
              onClick={() => handleSelect(contact.id)}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
            >
              {contact.image_url ? (
                <img src={contact.image_url} alt="" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-3 h-3 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">
                  {contact.real_name || contact.nickname || contact.display_name || `@${contact.username}`}
                </p>
                {contact.username && (
                  <p className="text-[10px] text-gray-500">@{contact.username}</p>
                )}
              </div>
            </div>
          ))}

          {/* Master database suggestions */}
          {masterSuggestions.length > 0 && (
            <div className="border-t">
              <p className="px-3 py-1 text-[10px] text-purple-600 bg-purple-50 font-medium">From community database:</p>
              {masterSuggestions.map(contact => (
                <div
                  key={contact.username}
                  onClick={() => handleQuickAdd({
                    username: contact.username,
                    display_name: contact.display_name,
                    phonetic: contact.phonetic
                  })}
                  className="px-3 py-2 hover:bg-purple-50 cursor-pointer flex items-center gap-2"
                >
                  <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                    <User className="w-3 h-3 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate text-purple-700">
                      @{contact.username}
                    </p>
                    {contact.display_name && (
                      <p className="text-[10px] text-gray-500">{contact.display_name}</p>
                    )}
                  </div>
                  {contact.phonetic && <Badge variant="outline" className="text-[10px]">🎵</Badge>}
                  <Plus className="w-3 h-3 text-purple-500" />
                </div>
              ))}
            </div>
          )}

          {noResults && masterSuggestions.length === 0 && (
            <div className="p-3 space-y-2">
              <p className="text-xs text-gray-500 text-center">No contacts found</p>
              {onQuickAdd && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full h-8 text-xs gap-1"
                  onClick={() => handleQuickAdd()}
                >
                  <Plus className="w-3 h-3" />
                  Quick add @{searchTerm.replace('@', '')}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}