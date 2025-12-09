import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, ChevronDown } from 'lucide-react';

export default function SearchableContactSelect({ 
  contacts, 
  value, 
  onChange, 
  placeholder = "Search contacts...",
  excludeId = null 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  // Sort contacts alphabetically by username
  const sortedContacts = [...contacts]
    .filter(c => c.id !== excludeId)
    .sort((a, b) => (a.username || '').localeCompare(b.username || ''));

  // Filter by search term
  const filteredContacts = sortedContacts.filter(c => 
    c.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected contact
  const selectedContact = contacts.find(c => c.id === value);

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

  const handleSelect = (contactId) => {
    onChange(contactId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 border rounded-md cursor-pointer bg-white hover:bg-gray-50"
      >
        <span className={selectedContact ? 'text-gray-900' : 'text-gray-500'}>
          {selectedContact ? `@${selectedContact.username}` : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {selectedContact && (
            <button
              onClick={handleClear}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-64 overflow-hidden">
          <div className="p-2 border-b sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Type to search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-8"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <div className="overflow-y-auto max-h-48">
            <button
              onClick={() => handleSelect('')}
              className="w-full px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-100"
            >
              None
            </button>
            {filteredContacts.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-500">No contacts found</p>
            ) : (
              filteredContacts.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => handleSelect(contact.id)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-purple-50 flex items-center justify-between ${
                    value === contact.id ? 'bg-purple-100 text-purple-700' : ''
                  }`}
                >
                  <span className="font-mono">@{contact.username}</span>
                  {contact.display_name && (
                    <span className="text-gray-500 text-xs truncate ml-2">{contact.display_name}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}