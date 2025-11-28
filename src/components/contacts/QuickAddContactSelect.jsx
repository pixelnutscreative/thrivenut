import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, User } from 'lucide-react';

export default function QuickAddContactSelect({ 
  contacts, 
  value, 
  onChange, 
  onQuickAdd,
  placeholder = "Search...",
  disabled = false
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const wrapperRef = useRef(null);

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

  const filteredContacts = contacts.filter(c => 
    c.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.real_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 10);

  const handleSelect = (contactId) => {
    onChange(contactId);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleQuickAdd = async () => {
    if (!searchTerm.trim()) return;
    
    // Create a minimal contact with just the username
    const username = searchTerm.replace('@', '').trim();
    
    if (onQuickAdd) {
      const newContactId = await onQuickAdd(username);
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

          {noResults && (
            <div className="p-3 space-y-2">
              <p className="text-xs text-gray-500 text-center">No contacts found</p>
              {onQuickAdd && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full h-8 text-xs gap-1"
                  onClick={handleQuickAdd}
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