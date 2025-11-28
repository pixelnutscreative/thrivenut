import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

export default function NotesWithHistory({ notes = [], onAddNote, label = "Notes" }) {
  const [newNote, setNewNote] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const handleAdd = () => {
    if (!newNote.trim()) return;
    onAddNote({
      date: new Date().toISOString(),
      note: newNote.trim()
    });
    setNewNote('');
  };

  const sortedNotes = [...notes].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-2">
        <Textarea
          placeholder="Add a note..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          rows={2}
          className="flex-1"
        />
        <Button
          type="button"
          size="sm"
          onClick={handleAdd}
          disabled={!newNote.trim()}
          className="self-end"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {sortedNotes.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            {showHistory ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <Clock className="w-3 h-3" />
            {sortedNotes.length} note{sortedNotes.length !== 1 ? 's' : ''}
          </button>

          {showHistory && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sortedNotes.map((note, idx) => (
                <div key={idx} className="p-2 bg-gray-50 rounded-lg text-sm">
                  <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(note.date), 'MMM d, yyyy h:mm a')}
                  </div>
                  <p className="text-gray-700">{note.note}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}