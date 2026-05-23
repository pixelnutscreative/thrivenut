import React, { useState, useEffect } from 'react';
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
import { X, Plus, Save, Link as LinkIcon, Trash2, ArrowUp, ArrowDown, ChevronDown, ChevronRight, AlertTriangle, Settings, Users, FileText, Lock, Shield, GripVertical, Megaphone, Video, Brain } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useTheme } from '@/components/shared/useTheme';
import ColorPicker from '../shared/ColorPicker';
import { toast } from 'sonner';
import { useGlobalDialog } from '@/components/shared/GlobalDialogProvider';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import GroupAnnouncementsSettings from './GroupAnnouncementsSettings';
import AgencyLiveCalendar from '@/pages/AgencyLiveCalendar';
import GroupLogoUploader from './GroupLogoUploader';
import ProspectManagementSettings from './ProspectManagementSettings';
import LevelSelector from './LevelSelector';
import GroupMembersTab from './GroupMembersTab';

function GroupAISettings({ group }) {
  const queryClient = useQueryClient();
  const [contextTypes, setContextTypes] = React.useState(group.settings?.ai_training_context || ['events', 'resources', 'qna', 'training']);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const current = await base44.entities.CreatorGroup.get(group.id);
      return base44.entities.CreatorGroup.update(group.id, { settings: { ...current.settings, ...data } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myGroupsDetails']);
      toast.success("AI Settings saved!");
    }
  });

  const toggleType = (type) => {
    setContextTypes(prev => {
      const next = prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type];
      updateMutation.mutate({ ai_training_context: next });
      return next;
    });
  };

  const types = [
    { id: 'events', label: 'Events' },
    { id: 'resources', label: 'Resources' },
    { id: 'qna', label: 'Q&A' },
    { id: 'training', label: 'Training' },
    { id: 'posts', label: 'Discussions / Feed' },
    { id: 'projects', label: 'Projects & Tasks' },
    { id: 'meetings', label: 'Meetings' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Assistant Training Data</CardTitle>
        <CardDescription>Select which sections the AI should read to answer member questions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {types.map(t => (
          <div key={t.id} className="flex items-center justify-between">
            <Label>{t.label}</Label>
            <Switch checked={contextTypes.includes(t.id)} onCheckedChange={() => toggleType(t.id)} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SettingsSection({ title, icon: Icon, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6 overflow-hidden">
      <CollapsibleTrigger className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
        {isOpen ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-6 border-t border-gray-100 space-y-6 bg-gray-50/50">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default function GroupSettingsTab({ group, currentUser, isAdmin }) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Group Settings</h1>
        <p className="text-gray-500">Manage your group's appearance, features, and members.</p>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="mb-6 bg-white border shadow-sm">
          <TabsTrigger value="settings" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">Settings</TabsTrigger>
          <TabsTrigger value="members" className="data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">Members</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6 mt-0 focus-visible:outline-none">
          <GroupMembersTab group={group} currentUser={currentUser} isAdmin={isAdmin} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6 mt-0 focus-visible:outline-none">
          <SettingsSection title="General" icon={Settings} defaultOpen={true}>
        <GroupNameSettings group={group} />
        <GroupAppearanceSettings group={group} />
        <GroupTypeSettings group={group} />
        <GroupLogoUploader group={group} />
      </SettingsSection>

      <SettingsSection title="Navigation & Tabs" icon={GripVertical}>
        <GroupTabsManager group={group} />
        {group.type === 'agency' && <AgencyFeaturesSettings group={group} />}
      </SettingsSection>

      <SettingsSection title="Membership" icon={Users}>
        <GroupExperienceSettings group={group} />
        <MemberInviteSettings group={group} />
        {group.type !== 'agency' && <MemberLevelsSettings group={group} />}
      </SettingsSection>

      <SettingsSection title="Permissions" icon={Shield}>
        <TabPermissionsSettings group={group} />
        {group.type !== 'client-portal' && <ResourceAccessSettings group={group} />}
      </SettingsSection>

      <SettingsSection title="Integrations & Links" icon={LinkIcon}>
        <GroupShortcutsSettings group={group} />
        <GroupAccessSettings group={group} />
        {group.type !== 'client-portal' && <FunnelContentSettings group={group} />}
        {group.type === 'agency' && <AgencyLiveCalendar group={group} />}
        <GroupAnnouncementsSettings group={group} />
        {group.type !== 'agency' && <CryptoTickerSettings group={group} />}
        {group.type !== 'agency' && <ProspectManagementSettings group={group} />}
        <GroupAISettings group={group} />
      </SettingsSection>

      <SettingsSection title="Danger Zone" icon={AlertTriangle}>
        <TransferOwnershipSettings group={group} />
        <DeleteGroupSettings group={group} />
      </SettingsSection>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GroupAppearanceSettings({ group }) {
  const queryClient = useQueryClient();
  const [menuPinned, setMenuPinned] = React.useState(group.menu_pinned || false);
  const [menuColor, setMenuColor] = React.useState(group.menu_color || group.settings?.group_color || '#8b5cf6');
  const [groupColor, setGroupColor] = React.useState(group.settings?.group_color || '#8b5cf6');

  React.useEffect(() => {
    setMenuPinned(group.menu_pinned || false);
    setMenuColor(group.menu_color || group.settings?.group_color || '#8b5cf6');
    setGroupColor(group.settings?.group_color || '#8b5cf6');
  }, [group.menu_pinned, group.menu_color, group.settings?.group_color]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const current = await base44.entities.CreatorGroup.get(group.id);
      const payload = { ...data };
      if (data.settings) {
         payload.settings = { ...current.settings, ...data.settings };
      }
      return base44.entities.CreatorGroup.update(group.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myGroupsDetails']);
      queryClient.invalidateQueries(['activeGroup', group.id]);
      toast.success("Appearance settings saved");
    }
  });

  const handleSave = () => {
    updateMutation.mutate({ 
      menu_pinned: menuPinned, 
      menu_color: menuColor,
      settings: { group_color: groupColor } 
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance & Display</CardTitle>
        <CardDescription>Customize colors and how this group appears in the app navigation.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Group Theme Color (Header & Buttons)</Label>
          <div className="flex items-center gap-4">
            <Input
              type="color"
              value={groupColor}
              onChange={(e) => setGroupColor(e.target.value)}
              className="w-12 h-10 p-1 cursor-pointer rounded-md border-0"
            />
            <div className="text-sm text-gray-500 font-mono">{groupColor}</div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="space-y-0.5">
            <Label>Pin to Main Menu</Label>
            <p className="text-sm text-gray-500">Show this group in the main sidebar above the categorized sections.</p>
          </div>
          <Switch
            checked={menuPinned}
            onCheckedChange={setMenuPinned}
          />
        </div>

        {menuPinned && (
          <div className="space-y-2">
            <Label>Sidebar Menu Color</Label>
            <div className="flex gap-2 items-center">
              <Input
                type="color"
                value={menuColor}
                onChange={(e) => setMenuColor(e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer rounded-md border-0"
              />
              <div className="text-sm text-gray-500 font-mono">{menuColor}</div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Appearance'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CryptoTickerSettings({ group }) {
  const queryClient = useQueryClient();
  const [showTicker, setShowTicker] = React.useState(!(group.settings?.hide_ticker === true));
  
  React.useEffect(() => {
    setShowTicker(!(group.settings?.hide_ticker === true));
  }, [group.settings?.hide_ticker]);

  const updateMutation = useMutation({
    mutationFn: async (hide_ticker) => {
      const current = await base44.entities.CreatorGroup.get(group.id);
      return base44.entities.CreatorGroup.update(group.id, { settings: { ...current.settings, hide_ticker } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myGroupsDetails']);
      toast.success("Crypto Ticker settings saved!");
    }
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
          checked={showTicker}
          onCheckedChange={(checked) => {
            setShowTicker(checked);
            updateMutation.mutate(!checked);
          }}
        />
      </CardContent>
    </Card>
  );
}



function MemberInviteSettings({ group }) {
  const queryClient = useQueryClient();
  // Allowed invite roles defaults to empty if not set (only admin/owner can invite by default logic elsewhere)
  // We'll store an array of roles that CAN invite.
  const [allowedRoles, setAllowedRoles] = useState(group.settings?.allowed_invite_roles || []);
  const [defaultRole, setDefaultRole] = useState(group.settings?.default_invite_role || (group.type === 'agency' ? 'member' : 'member'));
  const [defaultLevel, setDefaultLevel] = useState(group.settings?.default_invite_level || 'Member');
  
  // Membership Questions
  const [questions, setQuestions] = useState(group.settings?.membership_questions || []);
  const [newQuestion, setNewQuestion] = useState('');

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const current = await base44.entities.CreatorGroup.get(group.id);
      return base44.entities.CreatorGroup.update(group.id, { settings: { ...current.settings, ...data } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['activeGroup', group.id]);
      toast.success('Invite settings updated!');
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
                  {group.type === 'agency' ? (
                    <>
                      <SelectItem value="member">Creator</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="virtual-assistant">Virtual Assistant</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {group.type !== 'agency' && (
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
            )}
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

function ResourceAccessSettings({ group }) {
  const queryClient = useQueryClient();
  const [allowedLevels, setAllowedLevels] = useState(group.settings?.allowed_resource_levels || []);
  const [categories, setCategories] = useState(group.settings?.resource_categories || ['General', 'Important Links', 'Downloads']);
  const [newCategory, setNewCategory] = useState('');

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const current = await base44.entities.CreatorGroup.get(group.id);
      return base44.entities.CreatorGroup.update(group.id, { settings: { ...current.settings, ...data } });
    },
    onSuccess: () => queryClient.invalidateQueries(['myGroupsDetails'])
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resource Uploads</CardTitle>
        <CardDescription>Control which levels can upload resources (Admins always can).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-base font-semibold">Upload Permissions</Label>
          <LevelSelector 
            group={group} 
            selectedLevels={allowedLevels} 
            onChange={setAllowedLevels} 
          />
        </div>

        <div className="space-y-4 pt-4 border-t">
          <Label className="text-base font-semibold">Custom Resource Categories</Label>
          <p className="text-sm text-gray-500">Organize your resources with custom categories.</p>
          
          <div className="space-y-2">
            <div className="flex gap-2">
              <Input 
                value={newCategory} 
                onChange={e => setNewCategory(e.target.value)} 
                placeholder="e.g. Important Links"
                onKeyDown={e => {
                  if (e.key === 'Enter' && newCategory.trim() && !categories.includes(newCategory.trim())) {
                    setCategories([...categories, newCategory.trim()]);
                    setNewCategory('');
                  }
                }}
              />
              <Button onClick={() => {
                if (newCategory.trim() && !categories.includes(newCategory.trim())) {
                  setCategories([...categories, newCategory.trim()]);
                  setNewCategory('');
                }
              }} variant="outline" type="button">Add</Button>
            </div>
            
            <div className="space-y-2 mt-2">
              {categories.map((c, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <span className="text-sm">{c}</span>
                  <Button variant="ghost" size="sm" onClick={() => setCategories(categories.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              {categories.length === 0 && <p className="text-sm text-gray-400 italic">No custom categories set.</p>}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => updateMutation.mutate({ allowed_resource_levels: allowedLevels, resource_categories: categories })}>Save Settings</Button>
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
      toast.success('Funnel content updated!');
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
      toast.success('Access settings updated!');
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
        {group.type !== 'agency' && (
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
        )}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => updateMutation.mutate(formData)} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TabPermissionsSettings({ group }) {
  const queryClient = useQueryClient();
  const [permissions, setPermissions] = useState(group.role_tab_permissions || {});
  const [showSaved, setShowSaved] = useState(false);
  const [expandedTab, setExpandedTab] = useState(null);

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

  const systemRoles = group.type === 'agency' 
    ? ['Admin', 'Manager', 'Creator', 'Agency Owner', 'Invited', 'Interested'] 
    : ['Admin', 'Manager', 'Member', 'Client', 'Virtual Assistant', 'Invited', 'Interested', 'Subscriber'];

  const customLevels = group.member_levels || [];
  const filteredCustomLevels = customLevels.filter(l => !systemRoles.map(s => s.toLowerCase()).includes(l.toLowerCase()));
  const allRoles = [...systemRoles, ...filteredCustomLevels];

  // Helper to determine if a tab is enabled by default for a role
  const isDefaultEnabled = (tabId, roleStr) => {
    const role = roleStr.toLowerCase();
    // Admin/Owner always enabled by default
    if (role === 'admin' || role === 'owner' || role === 'agency owner') return true;

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

  const [newRole, setNewRole] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const addRoleMutation = useMutation({
    mutationFn: async (role) => {
      const current = await base44.entities.CreatorGroup.get(group.id);
      const updatedLevels = [...new Set([...(current.member_levels || []), role])];
      return base44.entities.CreatorGroup.update(group.id, { member_levels: updatedLevels });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myGroupsDetails']);
      queryClient.invalidateQueries(['activeGroup', group.id]);
      setNewRole('');
      setErrorMsg('');
      toast.success('Custom role added successfully');
    }
  });

  const handleAddRole = () => {
    if (!newRole.trim()) return;
    const roleLower = newRole.trim().toLowerCase();
    if (allRoles.map(l => l.toLowerCase()).includes(roleLower)) {
      setErrorMsg('This role already exists');
      return;
    }
    setErrorMsg('');
    addRoleMutation.mutate(newRole.trim());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tab Visibility</CardTitle>
        <CardDescription>
          Control which roles/levels can see specific tabs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeTabs.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                No active features to configure. Enable features in the Navigation & Tabs section first.
            </div>
        ) : (
            <div className="space-y-3">
              {activeTabs.map(tab => {
                const isExpanded = expandedTab === tab.id;
                return (
                  <div key={tab.id} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedTab(isExpanded ? null : tab.id)}
                    >
                      <div className="font-semibold text-gray-900">{tab.label}</div>
                      <div className="flex items-center gap-3">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="hidden sm:flex h-8 text-xs text-green-600 hover:text-green-700 hover:bg-green-50" 
                          onClick={(e) => { e.stopPropagation(); toggleAll(tab.id, true); }}
                        >
                          Enable All
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="hidden sm:flex h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50" 
                          onClick={(e) => { e.stopPropagation(); toggleAll(tab.id, false); }}
                        >
                          Disable All
                        </Button>
                        {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="p-4 border-t border-gray-100 bg-gray-50/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="col-span-full flex gap-2 mb-2 sm:hidden">
                            <Button size="sm" variant="outline" className="flex-1 text-green-600" onClick={() => toggleAll(tab.id, true)}>Enable All</Button>
                            <Button size="sm" variant="outline" className="flex-1 text-red-600" onClick={() => toggleAll(tab.id, false)}>Disable All</Button>
                        </div>
                        {allRoles.map(role => {
                          const hasExplicitPermission = permissions[tab.id] !== undefined;
                          const isChecked = hasExplicitPermission 
                              ? permissions[tab.id].includes(role) 
                              : isDefaultEnabled(tab.id, role);
                          
                          return (
                            <div key={role} className="flex flex-col gap-1.5 p-3 rounded-lg bg-white border border-gray-100 shadow-sm">
                              <div className="flex justify-between items-center">
                                <Label className="text-sm font-medium capitalize truncate cursor-pointer pr-2" title={role} onClick={() => togglePermission(tab.id, role)}>{role}</Label>
                                <Switch 
                                  checked={isChecked}
                                  onCheckedChange={() => togglePermission(tab.id, role)}
                                />
                              </div>
                              {!hasExplicitPermission && (
                                <span className="text-[10px] text-gray-400">Using default setting</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
        )}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t border-gray-100 gap-4">
            <div className="flex flex-col gap-1 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <Input 
                  value={newRole} 
                  onChange={e => { setNewRole(e.target.value); setErrorMsg(''); }} 
                  placeholder="e.g. VIP Member" 
                  className="h-9 text-sm max-w-[200px]"
                  onKeyDown={e => e.key === 'Enter' && handleAddRole()}
                />
                <Button size="sm" variant="outline" className="h-9" onClick={handleAddRole} disabled={!newRole.trim() || addRoleMutation.isPending}>
                  <Plus className="w-4 h-4 mr-1" /> Add Custom Role
                </Button>
              </div>
              {errorMsg && <p className="text-xs text-red-500 font-medium">{errorMsg}</p>}
            </div>
            
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <span className="text-xs text-gray-500 hidden sm:inline-block">Click save after changes</span>
              <Button 
                  onClick={() => updateMutation.mutate(permissions)}
                  disabled={updateMutation.isPending}
                  className={showSaved ? 'bg-green-600 hover:bg-green-700 w-full sm:w-auto' : 'w-full sm:w-auto'}
              >
                  {updateMutation.isPending ? 'Saving...' : showSaved ? 'Saved!' : 'Save Permissions'}
              </Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GroupTabsManager({ group }) {
  const queryClient = useQueryClient();
  
  const defaultOrder = group.type === 'agency'
    ? ['events', 'resources', 'training', 'qna', 'requests', 'feed', 'meetings', 'projects', 'marketing', 'assets', 'members', 'discussion']
    : [
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
  const [customNames, setCustomNames] = useState(group.settings?.display_names || {});
  const [hasChanges, setHasChanges] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const current = await base44.entities.CreatorGroup.get(group.id);
      return base44.entities.CreatorGroup.update(group.id, { 
        settings: { ...current.settings, ...data } 
      });
    },
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
      disabled_features: disabledFeatures,
      display_names: customNames
    });
  };

  const handleNameChange = (id, newName) => {
    setCustomNames(prev => ({
      ...prev,
      [id]: newName
    }));
    setHasChanges(true);
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
                          <div className="flex-1 flex items-center justify-between gap-4">
                             <div className="flex flex-col flex-1">
                               <div className="flex items-center gap-2">
                                  <span className={`font-medium min-w-[120px] ${isEnabled ? 'text-gray-900' : 'text-gray-500'}`}>{labels[id] || id}</span>
                                  {isEnabled && (
                                    <Input 
                                      className="h-7 w-48 text-sm" 
                                      placeholder={`Rename ${labels[id]}...`}
                                      value={customNames[id] || ''}
                                      onChange={(e) => handleNameChange(id, e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  )}
                               </div>
                               {!isEnabled && <span className="text-xs text-gray-400 mt-1">Hidden from group</span>}
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
      toast.success('Group settings updated!');
    },
    onError: (err) => {
      toast.error(err.message);
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
  const { confirm } = useGlobalDialog();
  
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

  const [selectedType, setSelectedType] = useState(group.type);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Group Type</CardTitle>
        <CardDescription>
          Changing the group type will affect available tabs and features.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select 
          value={selectedType} 
          onValueChange={setSelectedType}
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
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => updateMutation.mutate(selectedType)} disabled={selectedType === group.type || updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Group Type'}
          </Button>
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
  const { confirm } = useGlobalDialog();

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
      toast.success('Ownership transferred successfully!');
      window.location.reload();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to transfer ownership');
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
                            transferMutation.mutate();
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



function GroupExperienceSettings({ group }) {
  const queryClient = useQueryClient();
  const [toggles, setToggles] = React.useState({
    restrict_new_members: group.restrict_new_members || false,
    force_landing_page: group.force_landing_page || false,
    enable_retainer_management: group.enable_retainer_management || false
  });

  React.useEffect(() => {
    setToggles({
      restrict_new_members: group.restrict_new_members || false,
      force_landing_page: group.force_landing_page || false,
      enable_retainer_management: group.enable_retainer_management || false
    });
  }, [group.restrict_new_members, group.force_landing_page, group.enable_retainer_management]);

  const handleToggle = (field, checked) => {
    setToggles(prev => ({ ...prev, [field]: checked }));
    updateGroupMutation.mutate({ [field]: checked });
  };

  const updateGroupMutation = useMutation({
    mutationFn: (data) => base44.entities.CreatorGroup.update(group.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['myGroupsDetails']);
      queryClient.invalidateQueries(['activeGroup', group.id]);
      toast.success("Settings saved!");
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Member Experience</CardTitle>
        <CardDescription>Control the onboarding and app experience for new members.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Restricted Feature Mode (Social House)</Label>
            <p className="text-sm text-gray-500">
              If enabled, <strong>NEW</strong> members joining this group will have all other app modules disabled by default (except My Groups).
              Existing user preferences will not be changed.
            </p>
          </div>
          <Switch
            checked={toggles.restrict_new_members}
            onCheckedChange={(checked) => handleToggle('restrict_new_members', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Default Landing Page</Label>
            <p className="text-sm text-gray-500">
              If enabled, new members will be set to land on this group page when they log in.
            </p>
          </div>
          <Switch
            checked={toggles.force_landing_page}
            onCheckedChange={(checked) => handleToggle('force_landing_page', checked)}
          />
        </div>

        {group.type === 'client-portal' && (
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Hourly Tracking & Retainers</Label>
              <p className="text-sm text-gray-500">
                Show the Retainer Packages and Hourly Tracking sections on the Members tab.
              </p>
            </div>
            <Switch 
              checked={toggles.enable_retainer_management}
              onCheckedChange={(checked) => handleToggle('enable_retainer_management', checked)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// GroupTabOrderSettings removed, logic moved to GroupTabsManager

function AgencyFeaturesSettings({ group }) {
  const queryClient = useQueryClient();
  const [features, setFeatures] = useState(group.settings?.agency_features || {
    my_day: true,
    creator_studio: true,
    goals_habits: true,
    brain_dump: true,
    health_wellness: true,
    quick_actions: true
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const current = await base44.entities.CreatorGroup.get(group.id);
      return base44.entities.CreatorGroup.update(group.id, { 
        settings: { ...current.settings, agency_features: data } 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myGroupsDetails']);
      toast.success("App module access updated!");
    }
  });

  const handleToggle = (key, checked) => {
    const newFeatures = { ...features, [key]: checked };
    setFeatures(newFeatures);
    updateMutation.mutate(newFeatures);
  };

  const featureList = [
    { key: 'my_day', label: 'My Day (Dashboard)', desc: 'Allow access to the main dashboard' },
    { key: 'creator_studio', label: 'Creator Studio', desc: 'Allow access to Tasks, The Closet, Prompt Library, Content Marketplace, etc.' },
    { key: 'goals_habits', label: 'Goals & Habits', desc: 'Allow access to Goals and Habits modules' },
    { key: 'brain_dump', label: 'Brain Dump', desc: 'Allow access to Brain Dump' },
    { key: 'health_wellness', label: 'Health & Wellness', desc: 'Allow access to Mental Health, Wellness, Supplements, etc.' },
    { key: 'quick_actions', label: 'Quick Actions Bar', desc: 'Show the floating Quick Actions menu at the bottom' }
  ];

  return (
    <Card className="mt-6 border-purple-200 shadow-sm">
      <CardHeader className="bg-purple-50/50 rounded-t-xl">
        <CardTitle className="text-purple-900">App Module Access</CardTitle>
        <CardDescription>
          Control which main app modules are visible to members in the Restricted Experience (Agency Creators).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {featureList.map(f => (
          <div key={f.key} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
            <div className="space-y-0.5 pr-4">
              <Label className="text-base font-semibold text-gray-800">{f.label}</Label>
              <p className="text-xs text-gray-500">{f.desc}</p>
            </div>
            <Switch 
              checked={features[f.key] !== false} 
              onCheckedChange={(checked) => handleToggle(f.key, checked)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}