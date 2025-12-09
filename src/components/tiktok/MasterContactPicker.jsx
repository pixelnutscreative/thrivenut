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
      const rawUsername = contact.data?.username || contact.username || '';
      const username = (rawUsername && typeof rawUsername === 'string') 
        ? rawUsername.trim().toLowerCase().replace('@', '').trim() 
        : '';
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
  const searchLower = (searchTerm && typeof searchTerm === 'string') 
    ? searchTerm.trim().toLowerCase().replace('@', '').trim() 
    : '';
  const filteredContacts = consolidatedContacts.filter(c => 
    (c.username && typeof c.username === 'string' && c.username.trim() && c.username.toLowerCase().includes(searchLower)) ||
    (c.display_name && typeof c.display_name === 'string' && c.display_name.trim() && c.display_name.toLowerCase().includes(searchLower))
  );

  // Check if search term is a new username not in the list
  const cleanSearchTerm = (searchTerm && typeof searchTerm === 'string') 
    ? searchTerm.trim().replace('@', '').trim().toLowerCase() 
    : '';
  const isNewUsername = cleanSearchTerm && !consolidatedContacts.some(
    c => c.username && typeof c.username === 'string' && c.username.trim() && c.username.toLowerCase() === cleanSearchTerm
  );

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

  const handleCreateNew = () => {
    onCreateNew(cleanSearchTerm);
    setSearchTerm('');
    setIsOpen(false);
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
          {/* Add New Option - shown when typing a new username */}
          {isNewUsername && (
            <button
              onClick={handleCreateNew}
              className="w-full p-3 text-left hover:bg-green-50 border-b flex items-center gap-3 text-green-700"
            >
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium">Add "@{cleanSearchTerm}" as new contact</p>
                <p className="text-xs text-gray-500">Will be added to master database</p>
              </div>
            </button>
          )}

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