import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

const relationships = {
  mentor: 'Mentor',
  mentee: 'Mentee',
  family: 'Family',
  friend: 'Friend',
  coworker: 'Coworker',
  tiktok_creator: 'TikTok Creator',
  other: 'Other'
};

export default function GoalShareSelector({ connections, selectedEmails = [], onChange }) {
  const toggleEmail = (email) => {
    if (selectedEmails.includes(email)) {
      onChange(selectedEmails.filter(e => e !== email));
    } else {
      onChange([...selectedEmails, email]);
    }
  };

  const selectAll = () => {
    onChange(connections.map(c => c.viewer_email));
  };

  const selectNone = () => {
    onChange([]);
  };

  if (connections.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-center">
        <Users className="w-8 h-8 mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">No sharing connections yet</p>
        <p className="text-xs text-gray-400">Invite people from Goal Sharing to share goals with them</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 text-xs">
        <button type="button" onClick={selectAll} className="text-purple-600 hover:underline">
          Select all
        </button>
        <span className="text-gray-300">|</span>
        <button type="button" onClick={selectNone} className="text-gray-500 hover:underline">
          Clear
        </button>
      </div>
      
      <div className="space-y-2 max-h-40 overflow-y-auto">
        {connections.map(connection => (
          <div
            key={connection.id}
            onClick={() => toggleEmail(connection.viewer_email)}
            className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all ${
              selectedEmails.includes(connection.viewer_email)
                ? 'border-purple-400 bg-purple-50'
                : 'border-gray-200 hover:border-purple-300'
            }`}
          >
            <Checkbox checked={selectedEmails.includes(connection.viewer_email)} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {connection.viewer_name || connection.viewer_email}
              </p>
              <Badge variant="outline" className="text-xs">
                {relationships[connection.relationship] || connection.relationship}
              </Badge>
            </div>
          </div>
        ))}
      </div>
      
      {selectedEmails.length > 0 && (
        <p className="text-xs text-purple-600">
          Sharing with {selectedEmails.length} {selectedEmails.length === 1 ? 'person' : 'people'}
        </p>
      )}
    </div>
  );
}