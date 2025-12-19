import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Edit2, X, Save } from 'lucide-react';
import { format } from 'date-fns';

export default function LoveAwayEntriesList({ giveawayId }) {
  const queryClient = useQueryClient();
  const [newEntryUsername, setNewEntryUsername] = useState('');
  const [editingEntry, setEditingEntry] = useState(null);
  const [editMultiplier, setEditMultiplier] = useState(1);
  const [editColor, setEditColor] = useState('#000000');

  // Helper for nice colors
  const getRandomHex = () => {
    const letters = '456789ABC'; // Muted/Pastel-ish range
    // Actually, simple random hex is easier and "good enough" for now, or use HSL-to-Hex logic if strict.
    // Let's use a simpler "random bright color" logic:
    return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
  };

  const { data: entries = [] } = useQuery({
    queryKey: ['loveawayEntries', giveawayId],
    queryFn: () => base44.entities.LoveAwayEntry.filter({ loveaway_id: giveawayId }, '-created_date'),
  });

  const addEntryMutation = useMutation({
    mutationFn: async (username) => {
      // Try to find contact for color
      const contacts = await base44.entities.TikTokContact.filter({ username: username });
      const contact = contacts[0];
      
      // Generate random color if none found
      const randomColor = getRandomHex();

      return base44.entities.LoveAwayEntry.create({
        loveaway_id: giveawayId,
        username: username,
        contact_id: contact?.id,
        favorite_color: contact?.color || randomColor,
        entry_date: new Date().toISOString(),
        base_entries: 1,
        final_entry_count: 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loveawayEntries'] });
      queryClient.invalidateQueries({ queryKey: ['loveAways'] }); // Update total count
      setNewEntryUsername('');
    }
  });

  const updateMultiplierMutation = useMutation({
    mutationFn: async ({ id, multiplier, color }) => {
      return base44.entities.LoveAwayEntry.update(id, {
        multiplier: multiplier,
        final_entry_count: multiplier,
        favorite_color: color
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loveawayEntries'] });
      queryClient.invalidateQueries({ queryKey: ['loveAways'] });
      setEditingEntry(null);
    }
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (id) => base44.entities.LoveAwayEntry.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loveawayEntries'] });
      queryClient.invalidateQueries({ queryKey: ['loveAways'] });
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input 
          placeholder="Enter username to add..." 
          value={newEntryUsername}
          onChange={(e) => setNewEntryUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && newEntryUsername && addEntryMutation.mutate(newEntryUsername)}
        />
        <Button 
          onClick={() => addEntryMutation.mutate(newEntryUsername)}
          disabled={!newEntryUsername || addEntryMutation.isPending}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Entry
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Entries (Multiplier)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-gray-500 h-24">
                  No entries yet. Add someone above!
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {entry.favorite_color && (
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: entry.favorite_color }}
                        />
                      )}
                      @{entry.username}
                    </div>
                  </TableCell>
                  <TableCell>
                    {editingEntry === entry.id ? (
                      <div className="flex items-center gap-2">
                        <input
                           type="color"
                           value={editColor}
                           onChange={(e) => setEditColor(e.target.value)}
                           className="w-8 h-8 rounded cursor-pointer border-none p-0 bg-transparent"
                        />
                        <Input 
                          type="number" 
                          value={editMultiplier} 
                          onChange={(e) => setEditMultiplier(parseFloat(e.target.value))}
                          className="w-20 h-8"
                          min="1"
                        />
                        <Button size="sm" size="icon" onClick={() => updateMultiplierMutation.mutate({ id: entry.id, multiplier: editMultiplier, color: editColor })}>
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" size="icon" onClick={() => setEditingEntry(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {entry.final_entry_count} entries
                        </Badge>
                        {entry.multiplier > 1 && (
                          <span className="text-xs text-green-600 font-bold">({entry.multiplier}x)</span>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setEditingEntry(entry.id);
                        setEditMultiplier(entry.multiplier || entry.final_entry_count || 1);
                        setEditColor(entry.favorite_color || '#000000');
                      }}
                    >
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                            // Quick color shuffle if missing
                            const randomColor = getRandomHex();
                            updateMultiplierMutation.mutate({ 
                                id: entry.id, 
                                multiplier: entry.multiplier || entry.final_entry_count || 1,
                                color: randomColor
                            });
                        }}
                        title="Randomize Color"
                    >
                        <span className="w-4 h-4 rounded-full border border-gray-300 block" style={{ backgroundColor: entry.favorite_color || 'transparent' }}></span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => deleteEntryMutation.mutate(entry.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}