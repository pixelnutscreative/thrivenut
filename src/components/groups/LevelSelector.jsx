import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function LevelSelector({ group, selectedLevels = [], onChange }) {
  const allLevels = group.member_levels || [];

  const handleToggle = (level) => {
    if (selectedLevels.includes(level)) {
      onChange(selectedLevels.filter(l => l !== level));
    } else {
      onChange([...selectedLevels, level]);
    }
  };

  const isAllSelected = selectedLevels.length === 0; // Empty means "Everyone" in our logic usually, or we can make it explicit.
  // Actually, standard pattern often is: empty = everyone, OR specific list. 
  // The user said "check all the different levels individually".
  // Let's treat "Everyone" as a special toggle that clears the specific list or sets a special flag?
  // Easier: If list is empty => Everyone. If not empty => Specific levels.
  
  const handleEveryone = (checked) => {
    if (checked) {
      onChange([]); // Clear specific levels -> Everyone
    }
  };

  return (
    <div className="space-y-3 border p-3 rounded-lg">
      <Label className="font-semibold mb-2 block">Who can see this?</Label>
      
      <div className="flex items-center space-x-2 mb-2 pb-2 border-b">
        <Checkbox 
          id="lvl-everyone" 
          checked={isAllSelected}
          onCheckedChange={handleEveryone}
        />
        <Label htmlFor="lvl-everyone" className="cursor-pointer font-bold">Everyone (Public to Group)</Label>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {allLevels.map(level => (
          <div key={level} className="flex items-center space-x-2">
            <Checkbox 
              id={`lvl-${level}`} 
              checked={selectedLevels.includes(level)}
              onCheckedChange={() => handleToggle(level)}
            />
            <Label htmlFor={`lvl-${level}`} className="cursor-pointer text-sm">{level}</Label>
          </div>
        ))}
        {allLevels.length === 0 && (
          <p className="text-xs text-gray-400 col-span-2 italic">
            No custom levels defined for this group. Go to Settings to add levels (e.g. VIP, Inner Circle).
          </p>
        )}
      </div>
    </div>
  );
}