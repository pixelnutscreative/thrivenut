import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Plus, Save, Link as LinkIcon, Trash2, ArrowUp, ArrowDown, ChevronDown, ChevronRight, AlertTriangle, Settings, Users, FileText, Lock, Shield } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useTheme } from '@/components/shared/useTheme';
import ColorPicker from '../shared/ColorPicker';

export default function GroupSettingsTab({ group }) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-gray-100 p-1 rounded-lg w-full justify-start h-auto flex-wrap">
          <TabsTrigger value="general" className="px-4 py-2"><Settings className="w-4 h-4 mr-2" /> General</TabsTrigger>
          <TabsTrigger value="membership" className="px-4 py-2"><Users className="w-4 h-4 mr-2" /> Membership</TabsTrigger>
          {group.type !== 'client-portal' && (
            <TabsTrigger value="content" className="px-4 py-2"><FileText className="w-4 h-4 mr-2" /> Content</TabsTrigger>
          )}
          <TabsTrigger value="permissions" className="px-4 py-2"><Shield className="w-4 h-4 mr-2" /> Permissions</TabsTrigger>
          <TabsTrigger value="danger" className="px-4 py-2 text-red-600 data-[state=active]:text-red-700 data-[state=active]:bg-red-50"><AlertTriangle className="w-4 h-4 mr-2" /> Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 mt-6">
          <GroupFeaturesSettings group={group} />
          <RetainerSettings group={group} />
          <GroupNameSettings group={group} />
          <GroupTypeSettings group={group} />
          <GroupShortcutsSettings group={group} />
          <GroupColorSettings group={group} />
          <CryptoTickerSettings group={group} />
        </TabsContent>

        <TabsContent value="membership" className="space-y-6 mt-6">
          <MemberLevelsSettings group={group} />
          <GroupAccessSettings group={group} />
        </TabsContent>

        {group.type !== 'client-portal' && (
          <TabsContent value="content" className="space-y-6 mt-6">
            <FunnelContentSettings group={group} />
          </TabsContent>
        )}

        <TabsContent value="permissions" className="space-y-6 mt-6">
          <TabPermissionsSettings group={group} />
        </TabsContent>

        <TabsContent value="danger" className="space-y-6 mt-6">
          <DeleteGroupSettings group={group} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GroupColorSettings({ group }) {
  const queryClient = useQueryClient();
  const updateMutation = useMutation({
    mutationFn: (color) => base44.entities.CreatorGroup.update(group.id, { settings: { ...group.settings, group_color: color } }),
    onSuccess: () => queryClient.invalidateQueries(['myGroupsDetails'])
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Group Theme Color</CardTitle>
        <CardDescription>Customize the primary color for this group.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <ColorPicker 
            color={group.settings?.group_color || '#8b5cf6'} 
            onChange={(c) => updateMutation.mutate(c)} 
            label="Pick a color"
          />
          <div className="text-sm text-gray-500">
            Selected: <span className="font-mono font-medium text-gray-700">{group.settings?.group_color || '#8b5cf6'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CryptoTickerSettings({ group }) {
  const queryClient = useQueryClient();
  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.CreatorGroup.update(group.id, data),
    onSuccess: () => queryClient.invalidateQueries(['myGroupsDetails'])
  });

  return (
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
  );
}

function RetainerSettings({ group }) {
  const queryClient = useQueryClient();
  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.CreatorGroup.update(group.id, data),
    onSuccess: () => queryClient.invalidateQueries(['myGroupsDetails'])
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hourly Tracking & Retainers</CardTitle>
        <CardDescription>Configure time tracking and retainer packages for this group.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="font-medium">Enable Hourly Tracking</div>
          <div className="text-sm text-gray-500">Turn this off for flat-rate clients (hides hours balance).</div>
        </div>
        <Switch
          checked={group.enable_retainer_management === true}
          onCheckedChange={(checked) => updateMutation.mutate({ enable_retainer_management: checked })}
        />
      </CardContent>
      {group.enable_retainer_management && (
        <CardContent className="flex items-center justify-between border-t pt-4">
          <div className="space-y-1">
            <div className="font-medium">Show Balance to Client</div>
            <div className="text-sm text-gray-500">If disabled, only admins can see the hours balance.</div>
          </div>
          <Switch
            checked={!(group.settings?.hide_retainer_balance === true)}
            onCheckedChange={(checked) => updateMutation.mutate({ settings: { ...group.settings, hide_retainer_balance: !checked } })}
          />
        </CardContent>
      )}
    </Card>
  );
}

function MemberLevelsSettings({ group }) {
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
  const [permissions, setPermissions] = useState(group.role_tab_permissions || {});
  const [showSaved, setShowSaved] = useState(false);

  // Fetch Group Types to determine defaults
  const { data: groupTypes = [] } = useQuery({
    queryKey: ['groupTypes'],
    queryFn: () => base44.entities.GroupType.filter({ is_active: true }, 'sort_order')
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.CreatorGroup.update(group.id, { role_tab_permissions: data }),
    onSuccess: () => {
      queryClient.invalidateQueries(['myGroupsDetails']);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    }
  });

  const availableTabs = [
    { id: 'feed', label: 'Feed' },
    { id: 'events', label: 'Events' },
    { id: 'qna', label: 'Q&A' },
    { id: 'resources', label: 'Resources' },
    { id: 'training', label: 'Training' },
    { id: 'projects', label: 'Projects' },
    { id: 'meetings', label: 'Meetings' },
    { id: 'marketing', label: 'Marketing Orders' },
    { id: 'assets', label: 'Brand & Assets' },
    { id: 'discussion', label: 'Discussion' },
    { id: 'members', label: 'Members' },
    { id: 'requests', label: 'Requests' }
  ];

  const levels = ['Invited', 'Interested', 'Subscriber', ...(group.member_levels || [])];
  const systemRoles = ['member', 'client', 'manager', 'admin', 'virtual-assistant']; 
  
  // Filter out levels that conflict with system roles (case-insensitive)
  const filteredLevels = levels.filter(l => !systemRoles.includes(l.toLowerCase()));
  const allRoles = [...new Set([...filteredLevels, ...systemRoles])]; 

  // Helper to determine if a tab is enabled by default for a role
  // This mirrors logic in CreatorGroups.js `isTabEnabled` fallback
  const isDefaultEnabled = (tabId, role) => {
    // Admin/Owner always enabled by default
    if (role === 'admin' || role === 'owner') return true;

    const isClientGroup = ['client-portal', 'agency'].includes(group.type);
    const typeConfig = (groupTypes || []).find(gt => gt.key === group.type);
    const allowed = typeConfig?.enabled_tabs && typeConfig.enabled_tabs.length > 0 ? new Set(typeConfig.enabled_tabs) : null;

    // Client Role Default
    if (role === 'client' && ['feed', 'projects', 'meetings', 'resources', 'requests'].includes(tabId)) {
        return true;
    }

    // Client Portal overrides
    if (isClientGroup && ['feed', 'projects', 'meetings', 'resources', 'requests', 'members'].includes(tabId)) {
        if (tabId === 'members') return false; // Members tab hidden by default for non-admins
        return true;
    } 
    
    // Group Type Config overrides
    if (allowed && !allowed.has(tabId)) {
        return false;
    }
    
    // Global Members tab restriction
    if (tabId === 'members') return false;

    // Default to visible if not restricted
    return true;
  };

  const togglePermission = (tabId, role) => {
    // If we are toggling, we must initialize the permission array if it's undefined
    // If undefined, it means "use defaults". So we need to calculate what the current state is,
    // and then toggle from THERE.
    
    let current = permissions[tabId];
    
    // If not set yet, initialize it with all roles that are currently enabled by default
    if (current === undefined) {
       current = allRoles.filter(r => isDefaultEnabled(tabId, r));
    }

    let newPerms;
    if (current.includes(role)) {
      newPerms = current.filter(r => r !== role);
    } else {
      newPerms = [...current, role];
    }
    setPermissions({ ...permissions, [tabId]: newPerms });
  };

  const toggleAll = (tabId, enable) => {
      setPermissions({ ...permissions, [tabId]: enable ? allRoles : [] });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tab Visibility</CardTitle>
        <CardDescription>
          Control which roles/levels can see specific tabs. 
          <br/>
          <span className="text-xs text-gray-500 font-normal">
            (Gray = System Default. Click to override.)
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3 font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10 w-32 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Tab</th>
                <th className="text-center p-3 font-semibold text-gray-700 w-24">Actions</th>
                {allRoles.map(r => (
                  <th key={r} className="text-center p-3 capitalize font-semibold text-gray-700 min-w-[100px] whitespace-nowrap">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {availableTabs.map(tab => (
                <tr key={tab.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3 font-medium text-gray-900 sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                    {tab.label}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center gap-1">
                        <Button variant="ghost" size="xs" className="h-6 w-6 p-0 text-gray-400 hover:text-green-600" onClick={() => toggleAll(tab.id, true)} title="Enable All">
                          <ArrowUp className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="xs" className="h-6 w-6 p-0 text-gray-400 hover:text-red-600" onClick={() => toggleAll(tab.id, false)} title="Disable All">
                          <ArrowDown className="w-3 h-3" />
                        </Button>
                    </div>
                  </td>
                  {allRoles.map(role => {
                    const hasExplicitPermission = permissions[tab.id] !== undefined;
                    const isChecked = hasExplicitPermission 
                        ? permissions[tab.id].includes(role) 
                        : isDefaultEnabled(tab.id, role);

                    return (
                      <td key={role} className="text-center p-3">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => togglePermission(tab.id, role)}
                          className={`w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer ${!hasExplicitPermission ? 'opacity-40 grayscale' : ''}`}
                          title={!hasExplicitPermission ? "Using Default (Click to override)" : "Custom Setting"}
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
          <Button 
            onClick={() => updateMutation.mutate(permissions)}
            disabled={updateMutation.isPending}
            className={showSaved ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {updateMutation.isPending ? 'Saving...' : showSaved ? 'Saved!' : 'Save Permissions'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function GroupFeaturesSettings({ group }) {
  const queryClient = useQueryClient();
  const updateGroupMutation = useMutation({
    mutationFn: (data) => base44.entities.CreatorGroup.update(group.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['activeGroup', group.id]);
      queryClient.invalidateQueries(['myGroupsDetails']);
    }
  });

  const allTabs = [
    { id: 'feed', label: 'Feed' },
    { id: 'events', label: 'Events' },
    { id: 'qna', label: 'Q&A' },
    { id: 'resources', label: 'Resources' },
    { id: 'training', label: 'Training' },
    { id: 'projects', label: 'Projects' },
    { id: 'meetings', label: 'Meetings' },
    { id: 'marketing', label: 'Marketing Orders' },
    { id: 'assets', label: 'Brand & Assets' },
    { id: 'discussion', label: 'Discussion' },
    { id: 'members', label: 'Members' },
    { id: 'requests', label: 'Requests' },
  ];

  const disabledFeatures = group.settings?.disabled_features || [];

  const toggleFeature = (featureId) => {
      const isCurrentlyDisabled = disabledFeatures.includes(featureId);
      const newDisabled = isCurrentlyDisabled 
        ? disabledFeatures.filter(f => f !== featureId)
        : [...disabledFeatures, featureId];
      
      updateGroupMutation.mutate({ 
          settings: { 
              ...group.settings, 
              disabled_features: newDisabled 
          } 
      });
  };

  return (
    <Card>
      <CardHeader>
          <CardTitle>Feature Management</CardTitle>
          <CardDescription>Turn specific features on or off for this group.</CardDescription>
      </CardHeader>
      <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allTabs.map(tab => {
                  const isEnabled = !disabledFeatures.includes(tab.id);
                  return (
                      <div key={tab.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                          <span className="font-medium text-gray-700">{tab.label}</span>
                          <Switch checked={isEnabled} onCheckedChange={() => toggleFeature(tab.id)} />
                      </div>
                  );
              })}
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

function GroupTypeSettings({ group }) {
  const queryClient = useQueryClient();
  const { user, preferences } = useTheme();
  
  // Admin/Pro Logic (mirrors CreatorGroups.js)
  const realUserEmail = user?.email ? user?.email.toLowerCase() : '';
  const adminEmails = ['pixelnutscreative@gmail.com', 'pixel@thrivenut.app'];
  const isSuperAdmin = realUserEmail && adminEmails.includes(realUserEmail);
  const isProTier = isSuperAdmin || preferences?.subscription_status === 'active' || preferences?.is_superfan;

  const { data: groupTypes = [] } = useQuery({
    queryKey: ['groupTypes'],
    queryFn: () => base44.entities.GroupType.filter({ is_active: true }, 'sort_order')
  });

  const updateMutation = useMutation({
    mutationFn: (newType) => base44.entities.CreatorGroup.update(group.id, { type: newType }),
    onSuccess: () => {
      queryClient.invalidateQueries(['myGroupsDetails']);
      // Reload to refresh tabs logic
      window.location.reload(); 
    }
  });

  // Filter types based on user role (prevent regular users from switching to Agency/Client Portal if they aren't Pro)
  const availableTypes = groupTypes.filter(t => t.key !== 'client-portal' || isProTier);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Group Type</CardTitle>
        <CardDescription>
          Changing the group type will affect available tabs and features.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <div className="flex-1">
          <Select 
            value={group.type} 
            onValueChange={(val) => {
              if (window.confirm('Changing group type may hide/show certain tabs. Continue?')) {
                updateMutation.mutate(val);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableTypes.map(type => (
                <SelectItem key={type.key} value={type.key}>
                  <span className="font-medium">{type.name}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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