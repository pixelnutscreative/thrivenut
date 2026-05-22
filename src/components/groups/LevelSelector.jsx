import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function LevelSelector({ group, selectedLevels = [], onChange }) {
  const queryClient = useQueryClient();
  const allLevels = group.member_levels || [];
  const [newRole, setNewRole] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const addRoleMutation = useMutation({
    mutationFn: async (role) => {
      const current = await base44.entities.CreatorGroup.get(group.id);
      const updatedLevels = [...new Set([...(current.member_levels || []), role])];
      return base44.entities.CreatorGroup.update(group.id, { member_levels: updatedLevels });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['myGroupsDetails']);
      queryClient.invalidateQueries(['activeGroup', group.id]);
      setNewRole('');
      setIsAdding(false);
      // Auto-select the newly added role if there were specific levels selected
      if (selectedLevels.length > 0) {
         onChange([...selectedLevels, data.member_levels[data.member_levels.length - 1]]);
      }
    }
  });

  const handleAddRole = () => {
    if (newRole.trim() && !allLevels.includes(newRole.trim())) {
      addRoleMutation.mutate(newRole.trim());
    }
  };

  const handleToggle = (level) => {
    if (selectedLevels.includes(level)) {
      onChange(selectedLevels.filter(l => l !== level));
    } else {
      onChange([...selectedLevels, level]);
    }
  };

  const isAllSelected = selectedLevels.length === 0;
  
  const handleEveryone = (checked) => {
    if (checked) {
      onChange([]); // Clear specific levels -> Everyone
    }
  };

  return (
    <div className="space-y-3 border p-3 rounded-lg bg-white">
      <Label className="font-semibold mb-2 block">Who can see this?</Label>
      
      <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-gray-100">
        <Checkbox 
          id="lvl-everyone" 
          checked={isAllSelected}
          onCheckedChange={handleEveryone}
        />
        <Label htmlFor="lvl-everyone" className="cursor-pointer font-bold">Everyone (Public to Group)</Label>
      </div>

      <div className="grid grid-cols-2 gap-y-3 gap-x-2">
        {allLevels.map(level => (
          <div key={level} className="flex items-center space-x-2">
            <Checkbox 
              id={`lvl-${level}`} 
              checked={selectedLevels.includes(level)}
              onCheckedChange={() => handleToggle(level)}
            />
            <Label htmlFor={`lvl-${level}`} className="cursor-pointer text-sm truncate" title={level}>{level}</Label>
          </div>
        ))}
        {allLevels.length === 0 && (
          <p className="text-xs text-gray-400 col-span-2 italic">
            No custom roles defined yet.
          </p>
        )}
      </div>

      <div className="pt-3 mt-1 border-t border-gray-100">
        {!isAdding ? (
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-purple-600 hover:bg-purple-50" onClick={() => setIsAdding(true)}>
            <Plus className="w-3 h-3 mr-1" /> Add role
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Input 
              value={newRole} 
              onChange={e => setNewRole(e.target.value)} 
              placeholder="e.g. VIP Member" 
              className="h-8 text-xs"
              onKeyDown={e => e.key === 'Enter' && handleAddRole()}
              autoFocus
            />
            <Button size="sm" className="h-8 bg-purple-600 hover:bg-purple-700 text-white" onClick={handleAddRole} disabled={!newRole.trim() || addRoleMutation.isPending}>
              {addRoleMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-gray-500" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}