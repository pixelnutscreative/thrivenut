import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Save, Link as LinkIcon, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

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
      <GroupNameSettings group={group} />
      <GroupShortcutsSettings group={group} />
      <DeleteGroupSettings group={group} />
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

function GroupNameSettings({ group }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || '');

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.CreatorGroup.update(group.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['myGroupsDetails']);
      alert('Group settings updated!');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Group Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Group Name</Label>
          <Input value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Input value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div className="flex justify-end">
          <Button onClick={() => updateMutation.mutate({ name, description })} disabled={!name}>Update Details</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DeleteGroupSettings({ group }) {
  const queryClient = useQueryClient();
  const [confirmName, setConfirmName] = useState('');
  
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.CreatorGroup.delete(group.id);
      // Also delete members? Ideally backend handles cascade, but let's be safe
      const members = await base44.entities.CreatorGroupMember.filter({ group_id: group.id });
      await Promise.all(members.map(m => base44.entities.CreatorGroupMember.delete(m.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myGroupMemberships']);
      queryClient.invalidateQueries(['myGroupsDetails']);
      // Force redirect by reloading or navigate
      // Since we are in a tab inside the page, we need to go back to main list
      window.location.href = '/creator-groups'; 
    }
  });

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="text-red-600">Danger Zone</CardTitle>
        <CardDescription>Delete this group permanently.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Type group name to confirm</Label>
          <Input 
            value={confirmName} 
            onChange={e => setConfirmName(e.target.value)} 
            placeholder={group.name}
          />
        </div>
        <Button 
          variant="destructive" 
          disabled={confirmName !== group.name || deleteMutation.isPending}
          onClick={() => deleteMutation.mutate()}
        >
          {deleteMutation.isPending ? 'Deleting...' : 'Delete Group'}
        </Button>
      </CardContent>
    </Card>
  );
}

function GroupShortcutsSettings({ group }) {
  const queryClient = useQueryClient();
  const [newShortcut, setNewShortcut] = useState({ title: '', url: '' });

  const { data: shortcuts = [] } = useQuery({
    queryKey: ['groupShortcuts', group.id],
    queryFn: () => base44.entities.GroupShortcut.filter({ group_id: group.id }, 'sort_order')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.GroupShortcut.create({ ...data, group_id: group.id }),
    onSuccess: () => {
      queryClient.invalidateQueries(['groupShortcuts', group.id]);
      setNewShortcut({ title: '', url: '' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GroupShortcut.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['groupShortcuts', group.id])
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shortcut Links</CardTitle>
        <CardDescription>Add quick access links for your members (e.g. Login portals, Tools)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <Label>Title</Label>
            <Input value={newShortcut.title} onChange={e => setNewShortcut({...newShortcut, title: e.target.value})} placeholder="e.g. Canva Login" />
          </div>
          <div className="flex-[2] space-y-1">
            <Label>URL</Label>
            <Input value={newShortcut.url} onChange={e => setNewShortcut({...newShortcut, url: e.target.value})} placeholder="https://..." />
          </div>
          <Button onClick={() => createMutation.mutate(newShortcut)} disabled={!newShortcut.title || !newShortcut.url}>Add</Button>
        </div>

        <div className="space-y-2 mt-4">
          {shortcuts.map(shortcut => (
            <div key={shortcut.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-3">
                <LinkIcon className="w-4 h-4 text-gray-400" />
                <div>
                  <div className="font-medium text-sm">{shortcut.title}</div>
                  <div className="text-xs text-gray-500">{shortcut.url}</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(shortcut.id)} className="text-red-500 hover:bg-red-50">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {shortcuts.length === 0 && <div className="text-center py-4 text-gray-400 text-sm">No shortcuts added.</div>}
        </div>
      </CardContent>
    </Card>
  );
}