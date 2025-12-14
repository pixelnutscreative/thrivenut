import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, UserCheck, User, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

/**
 * MasterUsernameSearch - A reusable component that searches the master TikTok contacts database
 * and auto-fills display_name and phonetic when a username is selected.
 * 
 * Uses username as the unique identifier across all accounts.
 */
export default function MasterUsernameSearch({ 
  onSelect,
  onCreateNew,
  placeholder = "Search by @username...",
  disabled = false,
  excludeUsernames = [], // Usernames to exclude from results
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  // Fetch ALL TikTok contacts from all users (master database)
  const { data: allContacts = [] } = useQuery({
    queryKey: ['masterTikTokContacts'],
    queryFn: () => base44.entities.TikTokContact.list('username', 5000),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Consolidate by username - keep best data for each unique username
  const consolidatedContacts = React.useMemo(() => {
    const byUsername = {};
    
    allContacts.forEach(contact => {
      const username = (contact.username || '').toLowerCase().replace('@', '').trim();
      if (!username) return;
      
      // Skip excluded usernames
      if (excludeUsernames.some(u => u?.toLowerCase().replace('@', '').trim() === username)) return;
      
      const displayName = contact.display_name || '';
      const phonetic = contact.phonetic || '';
      const realName = contact.real_name || '';
      const nickname = contact.nickname || '';
      const imageUrl = contact.image_url || '';
      
      if (!byUsername[username]) {
        byUsername[username] = {
          username,
          display_name: displayName,
          phonetic: phonetic,
          real_name: realName,
          nickname: nickname,
          image_url: imageUrl,
        };
      } else {
        // Prefer non-empty values (merge best data)
        if (!byUsername[username].display_name && displayName) {
          byUsername[username].display_name = displayName;
        }
        if (!byUsername[username].phonetic && phonetic) {
          byUsername[username].phonetic = phonetic;
        }
        if (!byUsername[username].real_name && realName) {
          byUsername[username].real_name = realName;
        }
        if (!byUsername[username].nickname && nickname) {
          byUsername[username].nickname = nickname;
        }
        if (!byUsername[username].image_url && imageUrl) {
          byUsername[username].image_url = imageUrl;
        }
      }
    });
    
    return Object.values(byUsername).sort((a, b) => a.username.localeCompare(b.username));
  }, [allContacts, excludeUsernames]);

  // Filter by search term
  const filteredContacts = React.useMemo(() => {
    const term = searchTerm.toLowerCase().replace('@', '').trim();
    if (!term) return consolidatedContacts.slice(0, 20);
    
    return consolidatedContacts.filter(c => 
      c.username.toLowerCase().includes(term) ||
      c.display_name?.toLowerCase().includes(term) ||
      c.real_name?.toLowerCase().includes(term) ||
      c.nickname?.toLowerCase().includes(term)
    );
  }, [consolidatedContacts, searchTerm]);

  // DISABLED: Auto-creation removed for launch safety
  // Users can only select from existing TikTokContact records
  const cleanSearchTerm = searchTerm.replace('@', '').trim().toLowerCase();
  const isNewUsername = false; // Always false - no new contact creation

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (contact) => {
    onSelect({
      username: contact.username,
      display_name: contact.display_name || '',
      phonetic: contact.phonetic || '',
      real_name: contact.real_name || '',
      nickname: contact.nickname || '',
      image_url: contact.image_url || '',
      fromMasterDb: true
    });
    setSearchTerm('');
    setIsOpen(false);
  };

  // DISABLED: Contact creation restricted to admin-only manual flow
  const handleCreateNew = () => {
    // This function is disabled for launch safety
    // TikTokContact can only be created via Admin panel
    console.warn('TikTokContact auto-creation disabled - admin-only');
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
          className="pl-10"
        />
      </div>

      {isOpen && (searchTerm || filteredContacts.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-72 overflow-hidden">
          {/* REMOVED: "Add New" option disabled for launch safety */}
          {/* TikTokContact creation is now admin-only via Admin panel */}

          {/* Existing Contacts */}
          <div className="overflow-y-auto max-h-56">
            {filteredContacts.length === 0 && !isNewUsername ? (
              <p className="p-4 text-sm text-gray-500 text-center">
                Type a username to search
              </p>
            ) : (
              filteredContacts.slice(0, 20).map(contact => (
                <button
                  key={contact.username}
                  onClick={() => handleSelect(contact)}
                  className="w-full p-3 text-left hover:bg-purple-50 flex items-center gap-3 border-b last:border-0"
                >
                  {contact.image_url ? (
                    <img src={contact.image_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <UserCheck className="w-4 h-4 text-purple-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium font-mono text-purple-700 truncate">
                      @{contact.username}
                    </p>
                    {contact.display_name && (
                      <p className="text-sm text-gray-600 truncate">
                        {contact.display_name}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {contact.phonetic && (
                      <Badge variant="outline" className="text-xs shrink-0">
                        🎵
                      </Badge>
                    )}
                    {contact.display_name && (
                      <Badge variant="outline" className="text-xs shrink-0 bg-blue-50">
                        <Check className="w-3 h-3" />
                      </Badge>
                    )}
                  </div>
                </button>
              ))
            )}
            {filteredContacts.length > 20 && (
              <p className="p-2 text-xs text-center text-gray-500">
                +{filteredContacts.length - 20} more... keep typing to narrow down
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hook to look up contact info from master database by username
 */
export function useMasterContactLookup() {
  const { data: allContacts = [] } = useQuery({
    queryKey: ['masterTikTokContacts'],
    queryFn: () => base44.entities.TikTokContact.list('username', 5000),
    staleTime: 5 * 60 * 1000,
  });

  const lookupByUsername = React.useCallback((username) => {
    const cleanUsername = (username || '').toLowerCase().replace('@', '').trim();
    if (!cleanUsername) return null;

    // Find best match (prefer entries with more data)
    let bestMatch = null;
    
    for (const contact of allContacts) {
      const contactUsername = (contact.username || '').toLowerCase().replace('@', '').trim();
      if (contactUsername === cleanUsername) {
        if (!bestMatch) {
          bestMatch = contact;
        } else {
          // Prefer contact with more fields filled
          const currentScore = [contact.display_name, contact.phonetic, contact.real_name].filter(Boolean).length;
          const bestScore = [bestMatch.display_name, bestMatch.phonetic, bestMatch.real_name].filter(Boolean).length;
          if (currentScore > bestScore) {
            bestMatch = contact;
          }
        }
      }
    }

    return bestMatch;
  }, [allContacts]);

  return { lookupByUsername, allContacts };
}