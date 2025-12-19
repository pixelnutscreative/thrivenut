import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Save } from 'lucide-react';

export default function GroupSettingsTab({ group }) {
  const queryClient = useQueryClient();
  const [levels, setLevels] = useState(group.member_levels || []);
  const [newLevel, setNewLevel] = useState('');

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.CreatorGroup.update(group.id, data),
    onSuccess: () => queryClient.invalidateQueries(['myGroupsDetails'])
  });

  const addLevel = () => {
    if (newLevel && !levels.includes(newLevel)) {
      setLevels([...levels, newLevel]);
      setNewLevel('');
    }
  };

  const removeLevel = (level) => {
    setLevels(levels.filter(l => l !== level));
  };

  const handleSave = () => {
    updateMutation.mutate({ member_levels: levels });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Member Levels & Roles</CardTitle>
          <CardDescription>
            Define custom levels for your members (e.g., Winners, Leaders, Champions). 
            You can use these to control visibility of posts, events, and resources.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input 
              placeholder="Level Name (e.g. Diamond Leader)" 
              value={newLevel} 
              onChange={e => setNewLevel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addLevel()}
            />
            <Button onClick={addLevel} variant="outline"><Plus className="w-4 h-4" /></Button>
          </div>

          <div className="flex flex-wrap gap-2 min-h-[50px] p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
            {levels.map(level => (
              <Badge key={level} className="px-3 py-1 bg-white border-purple-200 text-purple-700 flex items-center gap-2">
                {level}
                <button onClick={() => removeLevel(level)} className="text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
              </Badge>
            ))}
            {levels.length === 0 && <span className="text-sm text-gray-400">No levels defined yet.</span>}
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Levels'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}