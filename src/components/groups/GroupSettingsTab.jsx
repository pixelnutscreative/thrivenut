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
import { X, Plus, Save, Link as LinkIcon, Trash2, ArrowUp, ArrowDown, ChevronDown, ChevronRight, AlertTriangle, Settings, Users, FileText, Lock, Shield, GripVertical, Megaphone, Video } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useTheme } from '@/components/shared/useTheme';
import ColorPicker from '../shared/ColorPicker';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import GroupAnnouncementsSettings from './GroupAnnouncementsSettings';
import AgencyLiveCalendar from '@/pages/AgencyLiveCalendar';
import GroupLogoUploader from './GroupLogoUploader';
import ProspectManagementSettings from './ProspectManagementSettings';

export default function GroupSettingsTab({ group }) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-gray-100 p-1 rounded-lg w-full justify-start h-auto flex-wrap">
          <TabsTrigger value="general" className="px-4 py-2"><Settings className="w-4 h-4 mr-2" /> General</TabsTrigger>
          <TabsTrigger value="announcements" className="px-4 py-2"><Megaphone className="w-4 h-4 mr-2" /> Announcements</TabsTrigger>
          {group.type === 'agency' && (
             <TabsTrigger value="lives" className="px-4 py-2"><Video className="w-4 h-4 mr-2" /> Live Calendar</TabsTrigger>
          )}
          <TabsTrigger value="membership" className="px-4 py-2"><Users className="w-4 h-4 mr-2" /> Membership</TabsTrigger>
          {group.type !== 'client-portal' && (
            <TabsTrigger value="content" className="px-4 py-2"><FileText className="w-4 h-4 mr-2" /> Content</TabsTrigger>
          )}
          <TabsTrigger value="permissions" className="px-4 py-2"><Shield className="w-4 h-4 mr-2" /> Permissions</TabsTrigger>
          <TabsTrigger value="danger" className="px-4 py-2 text-red-600 data-[state=active]:text-red-700 data-[state=active]:bg-red-50"><Trash2 className="w-4 h-4 mr-2" /> Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6 mt-6">
          <GroupTabsManager group={group} />
          <GroupLogoUploader group={group} />
          <RetainerSettings group={group} />
          <GroupNameSettings group={group} />
          <ProspectManagementSettings group={group} />
          <GroupTypeSettings group={group} />
          <GroupShortcutsSettings group={group} />
          <GroupColorSettings group={group} />
          <CryptoTickerSettings group={group} />
        </TabsContent>

        <TabsContent value="announcements" className="space-y-6 mt-6">
          <GroupAnnouncementsSettings group={group} />
        </TabsContent>

        <TabsContent value="lives" className="space-y-6 mt-6">
           <AgencyLiveCalendar group={group} />
        </TabsContent>

        <TabsContent value="membership" className="space-y-6 mt-6">
          <MemberInviteSettings group={group} />
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
          <GroupMenuSettings group={group} />
          <GroupExperienceSettings group={group} />
          <TransferOwnershipSettings group={group} />
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

function MemberInviteSettings({ group }) {
  const queryClient = useQueryClient();
  // Allowed invite roles defaults to empty if not set (only admin/owner can invite by default logic elsewhere)
  // We'll store an array of roles that CAN invite.
  const [allowedRoles, setAllowedRoles] = useState(group.settings?.allowed_invite_roles || []);
  const [defaultRole, setDefaultRole] = useState(group.settings?.default_invite_role || 'member');
  const [defaultLevel, setDefaultLevel] = useState(group.settings?.default_invite_level || 'Member');
  
  // Membership Questions
  const [questions, setQuestions] = useState(group.settings?.membership_questions || []);
  const [newQuestion, setNewQuestion] = useState('');

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.CreatorGroup.update(group.id, { settings: { ...group.settings, ...data } }),
    onSuccess: () => {
      queryClient.invalidateQueries(['activeGroup', group.id]);
      alert('Invite settings updated!');
    }
  });

  const handleSave = () => {
    updateMutation.mutate({
      allowed_invite_roles: allowedRoles,
      default_invite_role: defaultRole,
      default_invite_level: defaultLevel,
      membership_questions: questions
    });
  };

  const toggleAllowedRole = (role) => {
    setAllowedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const addQuestion = () => {
    if (newQuestion.trim()) {
      setQuestions([...questions, newQuestion.trim()]);
      setNewQuestion('');
    }
  };

  const removeQuestion = (idx) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const roles = ['member', 'client', 'virtual-assistant', 'manager'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Member Invitations</CardTitle>
        <CardDescription>Control who can invite members and how new members join.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        
        {/* Who Can Invite Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border p-4 rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-semibold">Allow Members to Invite</Label>
              <p className="text-sm text-gray-500">If enabled, all active members can invite others using their referral link.</p>
            </div>
            <Switch 
              checked={group.settings?.allow_member_invites === true}
              onCheckedChange={(checked) => updateMutation.mutate({ allow_member_invites: checked })}
            />
          </div>

          <div className="flex items-center justify-between border p-4 rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-semibold">Require Approval</Label>
              <p className="text-sm text-gray-500">If enabled, new members (even with an invite link) must be approved by an admin.</p>
            </div>
            <Switch 
              checked={group.settings?.require_approval === true}
              onCheckedChange={(checked) => updateMutation.mutate({ require_approval: checked })}
            />
          </div>
        </div>

        {/* New Member Defaults Section */}
        <div className="space-y-4 pt-4 border-t">
          <Label className="text-base font-semibold">New Member Defaults</Label>
          <p className="text-sm text-gray-500">When someone is invited by a non-admin, they will join with these settings.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={defaultRole} onValueChange={setDefaultRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="virtual-assistant">Virtual Assistant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Level</Label>
              <Select value={defaultLevel} onValueChange={setDefaultLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Member">Member (Default)</SelectItem>
                  {group.member_levels?.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Membership Questions Section */}
        <div className="space-y-4 pt-4 border-t">
          <Label className="text-base font-semibold">Membership Questions</Label>
          <p className="text-sm text-gray-500">Questions users must answer when requesting to join.</p>
          
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input 
                value={newQuestion} 
                onChange={e => setNewQuestion(e.target.value)} 
                placeholder="e.g. Why do you want to join this group?"
                onKeyDown={e => e.key === 'Enter' && addQuestion()}
              />
              <Button onClick={addQuestion} variant="outline" type="button">Add</Button>
            </div>
            
            <div className="space-y-2 mt-2">
              {questions.map((q, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <span className="text-sm">{q}</span>
                  <Button variant="ghost" size="sm" onClick={() => removeQuestion(idx)} className="text-gray-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {questions.length === 0 && <p className="text-sm text-gray-400 italic">No questions set.</p>}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={updateMutation.isPending}>Save All Changes</Button>
        </div>
      </CardContent>
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
  const [showColumnSelector, setShowColumnSelector] = useState(false);

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
    { id: 'discussion', label: 'Discussion' },
    { id: 'events', label: 'Events' },
    { id: 'meetings', label: 'Meetings' },
    { id: 'projects', label: 'Projects' },
    { id: 'marketing', label: 'Marketing Orders' },
    { id: 'assets', label: 'Brand & Assets' },
    { id: 'resources', label: 'Resources' },
    { id: 'training', label: 'Training' },
    { id: 'qna', label: 'Q&A' },
    { id: 'members', label: 'Members' },
    { id: 'requests', label: 'Requests' },
  ];

  // Only show enabled features in permission table
  const disabledFeatures = group.settings?.disabled_features || [];
  const activeTabs = availableTabs.filter(tab => !disabledFeatures.includes(tab.id));

  const levels = ['Invited', 'Interested', 'Subscriber', ...(group.member_levels || [])];
  const systemRoles = ['member', 'client', 'manager', 'admin', 'virtual-assistant']; 
  
  // Filter out levels that conflict with system roles (case-insensitive)
  const filteredLevels = levels.filter(l => !systemRoles.includes(l.toLowerCase()));
  const allRoles = [...new Set([...filteredLevels, ...systemRoles])];
  
  // Initial visible columns: all system roles + active levels
  const [visibleColumns, setVisibleColumns] = useState(allRoles);

  // Helper to determine if a tab is enabled by default for a role
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
    let current = permissions[tabId];
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

  const toggleColumnVisibility = (role) => {
    if (visibleColumns.includes(role)) {
      setVisibleColumns(visibleColumns.filter(c => c !== role));
    } else {
      setVisibleColumns([...visibleColumns, role]);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
            <CardTitle>Tab Visibility</CardTitle>
            <CardDescription>
              Control which roles/levels can see specific tabs.
            </CardDescription>
        </div>
        <div className="relative">
            <Button variant="outline" size="sm" onClick={() => setShowColumnSelector(!showColumnSelector)}>
                <Settings className="w-3 h-3 mr-2" /> Columns
            </Button>
            {showColumnSelector && (
                <div className="absolute right-0 top-10 bg-white border shadow-lg rounded-lg p-3 z-50 w-48 max-h-64 overflow-y-auto">
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase">Show Roles/Levels</p>
                    {allRoles.map(role => (
                        <div key={role} className="flex items-center gap-2 py-1">
                            <input 
                                type="checkbox" 
                                checked={visibleColumns.includes(role)} 
                                onChange={() => toggleColumnVisibility(role)}
                                className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                            />
                            <span className="text-sm capitalize truncate">{role}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeTabs.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                No active features to configure. Enable features in the General tab first.
            </div>
        ) : (
            <>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="w-full text-sm divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left p-3 font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10 w-32 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Tab</th>
                        <th className="text-center p-3 font-semibold text-gray-700 w-24">Actions</th>
                        {allRoles.filter(r => visibleColumns.includes(r)).map(r => (
                          <th key={r} className="text-center p-3 capitalize font-semibold text-gray-700 min-w-[100px] whitespace-nowrap">
                            {r}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {activeTabs.map(tab => (
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
                          {allRoles.filter(r => visibleColumns.includes(r)).map(role => {
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
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                         <span className="w-3 h-3 rounded bg-white border border-gray-300 inline-block"></span>
                         <span className="text-xs text-gray-500">Custom</span>
                         <span className="w-3 h-3 rounded bg-white border border-gray-300 opacity-40 grayscale inline-block ml-2"></span>
                         <span className="text-xs text-gray-500">Default (System)</span>
                    </div>
                    <Button 
                        onClick={() => updateMutation.mutate(permissions)}
                        disabled={updateMutation.isPending}
                        className={showSaved ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                        {updateMutation.isPending ? 'Saving...' : showSaved ? 'Saved!' : 'Save Permissions'}
                    </Button>
                </div>
            </>
        )}
      </CardContent>
    </Card>
  );
}

function GroupTabsManager({ group }) {
  const queryClient = useQueryClient();
  
  const defaultOrder = [
    'feed', 'discussion', 'events', 'meetings', 'projects', 
    'marketing', 'assets', 'resources', 'training', 'qna', 
    'members', 'requests'
  ];

  // Merge saved order with any missing default tabs
  const savedOrder = group.settings?.tab_order || defaultOrder;
  const missingTabs = defaultOrder.filter(id => !savedOrder.includes(id));
  const fullOrder = [...savedOrder, ...missingTabs];

  const [items, setItems] = useState(fullOrder);
  const [disabledFeatures, setDisabledFeatures] = useState(group.settings?.disabled_features || []);
  const [hasChanges, setHasChanges] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.CreatorGroup.update(group.id, { 
      settings: { ...group.settings, ...data } 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['activeGroup', group.id]);
      queryClient.invalidateQueries(['myGroupsDetails']);
      setHasChanges(false);
    }
  });

  const onDragEnd = (result) => {
    if (!result.destination) return;
    
    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);
    
    setItems(newItems);
    setHasChanges(true);
  };

  const toggleFeature = (featureId) => {
    setDisabledFeatures(prev => {
      const isDisabled = prev.includes(featureId);
      const newDisabled = isDisabled 
        ? prev.filter(f => f !== featureId)
        : [...prev, featureId];
      return newDisabled;
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    updateMutation.mutate({
      tab_order: items,
      disabled_features: disabledFeatures
    });
  };

  const labels = {
    feed: 'Feed',
    discussion: 'Discussion',
    events: 'Events',
    meetings: 'Meetings',
    projects: 'Projects',
    marketing: 'Marketing Orders',
    assets: 'Brand & Assets',
    resources: 'Resources',
    training: 'Training',
    qna: 'Q&A',
    members: 'Members',
    requests: 'Requests'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Group Navigation & Features</CardTitle>
        <CardDescription>
          Enable/disable features and drag to reorder tabs in your group navigation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="tabs">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 max-w-2xl">
                {items.map((id, index) => {
                  const isEnabled = !disabledFeatures.includes(id);
                  return (
                    <Draggable key={id} draggableId={id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`flex items-center gap-3 p-3 border rounded-lg shadow-sm transition-all ${isEnabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-75'}`}
                        >
                          <div {...provided.dragHandleProps} className="cursor-move p-1 text-gray-400 hover:text-gray-600">
                             <GripVertical className="w-5 h-5" />
                          </div>
                          <div className="flex-1 flex items-center justify-between">
                             <div className="flex flex-col">
                               <span className={`font-medium ${isEnabled ? 'text-gray-900' : 'text-gray-500'}`}>{labels[id] || id}</span>
                               {!isEnabled && <span className="text-xs text-gray-400">Hidden from group</span>}
                             </div>
                             <Switch 
                                checked={isEnabled} 
                                onCheckedChange={() => toggleFeature(id)} 
                             />
                          </div>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        
        {hasChanges && (
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GroupNameSettings({ group }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || '');
  const [slug, setSlug] = useState(group.slug || '');

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      // Check slug uniqueness if changed
      if (data.slug && data.slug !== group.slug) {
        const existing = await base44.entities.CreatorGroup.filter({ slug: data.slug });
        if (existing.length > 0 && existing[0].id !== group.id) {
          throw new Error('This URL name is already taken.');
        }
      }
      return base44.entities.CreatorGroup.update(group.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myGroupsDetails']);
      alert('Group settings updated!');
    },
    onError: (err) => {
      alert(err.message);
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
          <Label>Group URL Name (Slug)</Label>
          <div className="flex items-center gap-2">
            <span className="text-gray-500 text-sm whitespace-nowrap">.../CreatorGroups?slug=</span>
            <Input 
              value={slug} 
              onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} 
              placeholder="my-group-name"
            />
          </div>
          <p className="text-xs text-gray-500">Only lowercase letters, numbers, and dashes.</p>
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Input value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div className="flex justify-end">
          <Button onClick={() => updateMutation.mutate({ name, description, slug })} disabled={!name}>Update Details</Button>
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

function TransferOwnershipSettings({ group }) {
  const queryClient = useQueryClient();
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useTheme();

  const isOwner = user?.email?.toLowerCase() === group.owner_email?.toLowerCase();

  const transferMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('transferGroupOwnership', {
        group_id: group.id,
        new_owner_email: newOwnerEmail
      });
      if (response.data.error) throw new Error(response.data.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myGroupsDetails']);
      queryClient.invalidateQueries(['myGroupMemberships']);
      setIsOpen(false);
      setNewOwnerEmail('');
      setConfirmEmail('');
      alert('Ownership transferred successfully!');
      window.location.reload();
    },
    onError: (err) => {
      alert(err.message || 'Failed to transfer ownership');
    }
  });

  if (!isOwner) return null;

  return (
    <Card className="border-amber-200 shadow-sm bg-amber-50/30">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="w-full">
                <CardHeader className="flex flex-row items-center justify-between p-6 cursor-pointer hover:bg-amber-50/50 transition-colors">
                    <div className="text-left">
                        <CardTitle className="text-amber-700 flex items-center gap-2">
                            <Users className="w-5 h-5" /> Transfer Ownership
                        </CardTitle>
                        <CardDescription>Transfer this group to another user. You will remain an admin.</CardDescription>
                    </div>
                    {isOpen ? <ChevronDown className="w-5 h-5 text-amber-500" /> : <ChevronRight className="w-5 h-5 text-amber-500" />}
                </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
                <CardContent className="space-y-4 pt-0">
                    <div className="p-4 bg-amber-100/50 rounded-lg border border-amber-200 text-amber-800 text-sm">
                        <strong>Warning:</strong> You are about to transfer ownership of <strong>{group.name}</strong>. 
                        The new owner will have full control over the group settings, including the ability to remove you.
                    </div>
                    
                    <div className="space-y-2">
                        <Label>New Owner's Email</Label>
                        <Input 
                            value={newOwnerEmail} 
                            onChange={e => setNewOwnerEmail(e.target.value)} 
                            placeholder="new.owner@example.com"
                            className="bg-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Confirm New Owner's Email</Label>
                        <Input 
                            value={confirmEmail} 
                            onChange={e => setConfirmEmail(e.target.value)} 
                            placeholder="Type email again to confirm"
                            className="bg-white"
                        />
                    </div>

                    <Button 
                        variant="outline" 
                        disabled={!newOwnerEmail || newOwnerEmail !== confirmEmail || transferMutation.isPending}
                        onClick={() => {
                            if (window.confirm(`Are you sure you want to transfer ownership of ${group.name} to ${newOwnerEmail}?`)) {
                                transferMutation.mutate();
                            }
                        }}
                        className="w-full border-amber-300 text-amber-800 hover:bg-amber-100 hover:text-amber-900"
                    >
                        {transferMutation.isPending ? 'Transferring...' : 'Transfer Ownership'}
                    </Button>
                </CardContent>
            </CollapsibleContent>
        </Collapsible>
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

// GroupTabOrderSettings removed, logic moved to GroupTabsManager