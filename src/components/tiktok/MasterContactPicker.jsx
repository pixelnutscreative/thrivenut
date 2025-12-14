import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Check, UserCheck, User } from 'lucide-react';

export default function MasterContactPicker({ 
  masterContacts = [],
  onSelect,
  onCreateNew,
  placeholder = "Search or add new..."
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  // Consolidate master contacts by username (unique entries only)
  const consolidatedContacts = React.useMemo(() => {
    const byUsername = {};
    masterContacts.forEach(contact => {
      const username = (contact.data?.username || contact.username || '').toLowerCase().replace('@', '').trim();
      if (!username) return;
      
      const displayName = contact.data?.display_name || contact.display_name || '';
      const phonetic = contact.data?.phonetic || contact.phonetic || '';
      
      if (!byUsername[username]) {
        byUsername[username] = {
          username,
          display_name: displayName,
          phonetic: phonetic,
        };
      } else {
        // Prefer non-empty values
        if (!byUsername[username].display_name && displayName) {
          byUsername[username].display_name = displayName;
        }
        if (!byUsername[username].phonetic && phonetic) {
          byUsername[username].phonetic = phonetic;
        }
      }
    });
    return Object.values(byUsername).sort((a, b) => a.username.localeCompare(b.username));
  }, [masterContacts]);

  // Filter by search term
  const filteredContacts = consolidatedContacts.filter(c => 
    c.username.toLowerCase().includes(searchTerm.toLowerCase().replace('@', '')) ||
    c.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div ref={containerRef} className="relative">
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
                Type a username to search or add new
              </p>
            ) : (
              filteredContacts.slice(0, 20).map(contact => (
                <button
                  key={contact.username}
                  onClick={() => handleSelect(contact)}
                  className="w-full p-3 text-left hover:bg-purple-50 flex items-center gap-3 border-b last:border-0"
                >
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <UserCheck className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium font-mono text-purple-700 truncate">
                      @{contact.username}
                    </p>
                    {contact.display_name && (
                      <p className="text-sm text-gray-600 truncate">{contact.display_name}</p>
                    )}
                  </div>
                  {contact.phonetic && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      🎵 Set
                    </Badge>
                  )}
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