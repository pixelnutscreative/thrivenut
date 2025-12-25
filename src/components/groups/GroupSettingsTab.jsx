import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Save, Link as LinkIcon, Trash2, ArrowUp, ArrowDown, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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

      <Card>
        <CardHeader>
          <CardTitle>Crypto Ticker</CardTitle>
          <CardDescription>Show or hide the group ticker in the sidebar.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Show ticker on dashboard</span>
          <Switch
            checked={!(group.settings?.hide_ticker === true)}
            onCheckedChange={(checked) => updateMutation.mutate({ settings: { ...(group.settings || {}), hide_ticker: !checked } })}
          />
        </CardContent>
      </Card>


      <GroupAccessSettings group={group} />
      <FunnelContentSettings group={group} />
      <TabPermissionsSettings group={group} />
      <DeleteGroupSettings group={group} />
    </div>
  );
}

function FunnelContentSettings({ group }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    welcome_mat_title: group.welcome_mat_title || '',
    welcome_mat_description: group.welcome_mat_description || '',
    welcome_mat_video_url: group.welcome_mat_video_url || '',
    welcome_mat_button_text: group.welcome_mat_button_text || "I'm Interested",
    interested_dashboard_header: group.interested_dashboard_header || '',
    interested_signup_info: group.interested_signup_info || '',
    interested_video_url: group.interested_video_url || '',
    interested_attribution_prompt: group.interested_attribution_prompt || 'Who shared this with you?'
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.CreatorGroup.update(group.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['myGroupsDetails']);
      alert('Funnel content updated!');
    }
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funnel Content (Invited → Interested)</CardTitle>
        <CardDescription>Configure the content for the Welcome Mat and Interested Dashboard.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        
        {/* Welcome Mat Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-purple-700 border-b pb-2">Welcome Mat (Invited Users)</h3>
          
          <div className="space-y-2">
            <Label>Title</Label>
            <Input 
              value={formData.welcome_mat_title} 
              onChange={e => handleChange('welcome_mat_title', e.target.value)} 
              placeholder="Welcome to our community!"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <ReactQuill 
              theme="snow"
              value={formData.welcome_mat_description} 
              onChange={val => handleChange('welcome_mat_description', val)}
              className="h-32 mb-12"
              placeholder="Explain what this group is about..."
            />
          </div>

          <div className="space-y-2">
            <Label>Welcome Video URL (Optional)</Label>
            <Input 
              value={formData.welcome_mat_video_url} 
              onChange={e => handleChange('welcome_mat_video_url', e.target.value)} 
              placeholder="https://youtube.com/..."
            />
            <p className="text-xs text-gray-500">Leave empty to show text only. Must be a valid YouTube link.</p>
          </div>

          <div className="space-y-2">
            <Label>Button Text</Label>
            <Input 
              value={formData.welcome_mat_button_text} 
              onChange={e => handleChange('welcome_mat_button_text', e.target.value)} 
              placeholder="I'm Interested"
            />
          </div>
        </div>

        {/* Interested Dashboard Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-blue-700 border-b pb-2">Interested Dashboard</h3>
          
          <div className="space-y-2">
            <Label>Header Message</Label>
            <ReactQuill 
              theme="snow"
              value={formData.interested_dashboard_header} 
              onChange={val => handleChange('interested_dashboard_header', val)}
              className="h-24 mb-12"
              placeholder="Great! Here's how to join..."
            />
          </div>

          <div className="space-y-2">
            <Label>Signup Instructions</Label>
            <ReactQuill 
              theme="snow"
              value={formData.interested_signup_info} 
              onChange={val => handleChange('interested_signup_info', val)}
              className="h-32 mb-12"
              placeholder="Step 1: Click signup. Step 2: Upload proof..."
            />
          </div>

          <div className="space-y-2">
            <Label>Instruction Video URL (Optional)</Label>
            <Input 
              value={formData.interested_video_url} 
              onChange={e => handleChange('interested_video_url', e.target.value)} 
              placeholder="https://youtube.com/..."
            />
            <p className="text-xs text-gray-500">Optional: Add a video explaining the signup process.</p>
          </div>

          <div className="space-y-2">
            <Label>Attribution Prompt</Label>
            <Input 
              value={formData.interested_attribution_prompt} 
              onChange={e => handleChange('interested_attribution_prompt', e.target.value)} 
              placeholder="Who shared this with you?"
            />
            <p className="text-xs text-gray-500">Question shown to users when they submit their application.</p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={() => updateMutation.mutate(formData)}>Save Funnel Content</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function GroupAccessSettings({ group }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    signup_url: group.signup_url || '',
    welcome_video_url: group.welcome_video_url || '',
    trial_period_days: group.trial_period_days || 0
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.CreatorGroup.update(group.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['myGroupsDetails']);
      alert('Access settings updated!');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Membership & Access</CardTitle>
        <CardDescription>Configure how users join and access your group.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Sign Up / Payment URL</Label>
          <Input 
            value={formData.signup_url} 
            onChange={e => setFormData({...formData, signup_url: e.target.value})} 
            placeholder="https://checkout.stripe.com/..."
          />
          <p className="text-xs text-gray-500">Link to your external payment page. Used on the 'Interested' dashboard.</p>
        </div>
        <div className="space-y-2">
          <Label>Welcome Video URL</Label>
          <Input 
            value={formData.welcome_video_url} 
            onChange={e => setFormData({...formData, welcome_video_url: e.target.value})} 
            placeholder="https://youtube.com/..."
          />
          <p className="text-xs text-gray-500">Video displayed on the public welcome mat.</p>
        </div>
        <div className="space-y-2">
          <Label>Trial Period (Days)</Label>
          <Input 
            type="number"
            value={formData.trial_period_days} 
            onChange={e => setFormData({...formData, trial_period_days: parseInt(e.target.value) || 0})} 
            placeholder="0"
          />
          <p className="text-xs text-gray-500">Set to 0 for no trial.</p>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => updateMutation.mutate(formData)}>Save Settings</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TabPermissionsSettings({ group }) {
  const queryClient = useQueryClient();
  // Map of tabId -> array of allowed roles/levels
  // If undefined/empty, allowed to all (except hardcoded limits)
  const [permissions, setPermissions] = useState(group.role_tab_permissions || {});

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.CreatorGroup.update(group.id, { role_tab_permissions: data }),
    onSuccess: () => {
      queryClient.invalidateQueries(['myGroupsDetails']);
      alert('Permissions updated!');
    }
  });

  const availableTabs = [
    { id: 'feed', label: 'Feed' },
    { id: 'events', label: 'Events' },
    { id: 'qna', label: 'Q&A' },
    { id: 'resources', label: 'Resources' },
    { id: 'training', label: 'Training' },
    { id: 'requests', label: 'Requests' }
  ];

  const levels = ['Invited', 'Interested', 'Subscriber', ...(group.member_levels || [])];
  const systemRoles = ['member', 'manager', 'admin']; 
  const allRoles = [...new Set([...levels, ...systemRoles])]; // Dedupe if overlap

  const togglePermission = (tabId, role) => {
    const current = permissions[tabId] || [];
    let newPerms;
    if (current.includes(role)) {
      newPerms = current.filter(r => r !== role);
    } else {
      newPerms = [...current, role];
    }
    
    // If empty, maybe means everyone? 
    // Let's say if key exists but empty list = no one? 
    // Or we stick to "If undefined, everyone". 
    // To make it restrictive by default for new features, let's say we save the list.
    setPermissions({ ...permissions, [tabId]: newPerms });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tab Visibility</CardTitle>
        <CardDescription>Control which roles/levels can see specific tabs. Unchecked = Hidden.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Tab</th>
                {allRoles.map(r => <th key={r} className="text-center p-2 capitalize min-w-[80px]">{r}</th>)}
              </tr>
            </thead>
            <tbody>
              {availableTabs.map(tab => (
                <tr key={tab.id} className="border-b last:border-0">
                  <td className="p-2 font-medium">{tab.label}</td>
                  {allRoles.map(role => {
                    // Default logic: Admin/Owner always see everything (handled in code), but let's allow config for others.
                    // If permissions[tab.id] is undefined, assume Visible to all? Or visible to Member+?
                    // Let's assume if undefined, visible to all "Member" status.
                    // But for Invited/Interested, usually hidden.
                    // Let's force explicit config. If undefined, we default to showing check.
                    const isChecked = !permissions[tab.id] || permissions[tab.id].includes(role);
                    
                    return (
                      <td key={role} className="text-center p-2">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => togglePermission(tab.id, role)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500">* Admins & Owners always have full access regardless of these settings.</p>
        <div className="flex justify-end">
          <Button onClick={() => updateMutation.mutate(permissions)}>Save Permissions</Button>
        </div>
      </CardContent>
    </Card>
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
  const [isOpen, setIsOpen] = useState(false);
  
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.CreatorGroup.delete(group.id);
      const members = await base44.entities.CreatorGroupMember.filter({ group_id: group.id });
      await Promise.all(members.map(m => base44.entities.CreatorGroupMember.delete(m.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myGroupMemberships']);
      queryClient.invalidateQueries(['myGroupsDetails']);
      window.location.href = '/creator-groups';
    }
  });

  return (
    <Card className="border-red-200 shadow-sm">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="w-full">
                <CardHeader className="flex flex-row items-center justify-between p-6 cursor-pointer hover:bg-red-50/50 transition-colors">
                    <div className="text-left">
                        <CardTitle className="text-red-600 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" /> Danger Zone
                        </CardTitle>
                        <CardDescription>Permanently delete this group and all its data.</CardDescription>
                    </div>
                    {isOpen ? <ChevronDown className="w-5 h-5 text-red-400" /> : <ChevronRight className="w-5 h-5 text-red-400" />}
                </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <CardContent className="space-y-4 pt-0">
                    <div className="p-4 bg-red-50 rounded-lg border border-red-100 text-red-800 text-sm">
                        Warning: This action cannot be undone. All posts, events, resources, and memberships will be lost forever.
                    </div>
                    <div className="space-y-2">
                        <Label>Type group name to confirm</Label>
                        <Input 
                            value={confirmName} 
                            onChange={e => setConfirmName(e.target.value)} 
                            placeholder={group.name}
                            className="border-red-200 focus-visible:ring-red-500"
                        />
                    </div>
                    <Button 
                        variant="destructive" 
                        disabled={confirmName !== group.name || deleteMutation.isPending}
                        onClick={() => deleteMutation.mutate()}
                        className="w-full"
                    >
                        {deleteMutation.isPending ? 'Deleting...' : 'Delete Group'}
                    </Button>
                </CardContent>
            </CollapsibleContent>
        </Collapsible>
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