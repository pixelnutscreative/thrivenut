import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Settings, Video, AlertCircle, ArrowLeft, Loader2, Building, Home, Heart, Sparkles, Brain, Briefcase, Calendar, MessageSquare, FileText, Bell, Eye, EyeOff, Link as LinkIcon, ExternalLink, Clock, Trash2, Filter, LayoutGrid, List, Lock, Printer, UserPlus } from 'lucide-react';
import { useTheme } from '@/components/shared/useTheme';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import GroupTrainingTab from '../components/groups/GroupTrainingTab';
import GroupRequestsTab from '../components/groups/GroupRequestsTab';
import GroupMembersTab from '../components/groups/GroupMembersTab';
import GroupFeedTab from '../components/groups/GroupFeedTab';
import GroupQnATab from '../components/groups/GroupQnATab';
import GroupEventsTab from '../components/groups/GroupEventsTab';
import GroupResourcesTab from '../components/groups/GroupResourcesTab';
import GroupSettingsTab from '../components/groups/GroupSettingsTab';
import GroupProjectsTab from '../components/groups/GroupProjectsTab';
import GroupMeetingsTab from '../components/groups/GroupMeetingsTab';
import CryptoTickerWidget from '../components/widgets/CryptoTickerWidget';
import GroupCalendarWidget from '../components/groups/GroupCalendarWidget';
import TimeReportDialog from '../components/groups/TimeReportDialog';
import GroupAICompanion from '../components/groups/GroupAICompanion';
import MarketingOrdersTab from '../components/groups/marketing/MarketingOrdersTab';
import GroupDiscussionTab from '../components/groups/GroupDiscussionTab';
import GroupAssetsTab from '../components/groups/GroupAssetsTab';

export default function CreatorGroups() {
  const { user, preferences } = useTheme();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeGroupId = searchParams.get('id');
  const activeTab = searchParams.get('tab');
  const browseMode = searchParams.get('mode') === 'browse';
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupType, setNewGroupType] = useState('community');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [showHidden, setShowHidden] = useState(false);
  const [showTimeReport, setShowTimeReport] = useState(false);
  const [isAIMobileOpen, setIsAIMobileOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

  // Admin Check
  const realUserEmail = user?.email ? user?.email.toLowerCase() : '';
  const adminEmails = ['pixelnutscreative@gmail.com', 'pixel@thrivenut.app'];
  const isSuperAdmin = realUserEmail && adminEmails.includes(realUserEmail);
  const canCreateAgency = isSuperAdmin || preferences?.can_create_agency;
  const isProTier = isSuperAdmin || preferences?.subscription_status === 'active' || preferences?.is_superfan;

  // Fetch my groups
  const { data: myMemberships = [], isLoading } = useQuery({
    queryKey: ['myGroupMemberships', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.CreatorGroupMember.filter({ user_email: user?.email });
    },
    enabled: !!user?.email
  });

  // Fetch group details for my memberships (for list view)
  const { data: groups = [], isLoading: isLoadingGroups } = useQuery({
    queryKey: ['myGroupsDetails', myMemberships],
    queryFn: async () => {
      if (myMemberships.length === 0) return [];
      const groupPromises = myMemberships.map(async (m) => {
        const results = await base44.entities.CreatorGroup.filter({ id: m.group_id });
        return results[0];
      });
      const results = await Promise.all(groupPromises);
      const validGroups = results.filter(Boolean);
      // Deduplicate groups by ID
      const uniqueGroups = Array.from(new Map(validGroups.map(g => [g.id, g])).values());
      return uniqueGroups.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: myMemberships.length > 0 && !activeGroupId && !browseMode
  });

  // Fetch specific active group (even if not a member, for preview/join)
  const { data: fetchedActiveGroup, isLoading: isActiveGroupLoading } = useQuery({
    queryKey: ['activeGroup', activeGroupId],
    queryFn: async () => {
      // First try standard fetch (fastest)
      try {
        const res = await base44.entities.CreatorGroup.filter({ id: activeGroupId });
        if (res && res.length > 0) return res[0];
      } catch (e) {
        console.log("Standard fetch failed, trying secure fetch");
      }

      // Fallback: Fetch via backend function (bypasses RLS for "Private Group" screen visibility)
      try {
        const { data } = await base44.functions.invoke('getGroupDetails', { groupId: activeGroupId });
        return data.group;
      } catch (e) {
        console.error("Secure fetch failed", e);
        return null;
      }
    },
    enabled: !!activeGroupId
  });

  // Fetch all groups for browse mode
  const { data: browseGroups = [] } = useQuery({
    queryKey: ['browseGroups'],
    queryFn: async () => {
      return await base44.entities.CreatorGroup.filter({ status: 'active' });
    },
    enabled: browseMode && !activeGroupId
  });

  // Group Types (admin-configurable)
  const { data: groupTypes = [] } = useQuery({
    queryKey: ['groupTypes'],
    queryFn: () => base44.entities.GroupType.filter({ is_active: true }, 'sort_order')
  });

  // Ensure default selection when custom types exist
  useEffect(() => {
    if (groupTypes.length > 0 && !groupTypes.some(t => t.key === newGroupType)) {
      setNewGroupType(groupTypes[0].key);
    }
  }, [groupTypes]);

  // Fetch all group preferences for visibility
  const { data: allGroupPrefs = [], refetch: refetchAllPrefs } = useQuery({
    queryKey: ['allGroupPrefs', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.UserGroupPreference.filter({ user_email: user?.email });
    },
    enabled: !!user?.email
  });

  const toggleGroupVisibilityMutation = useMutation({
    mutationFn: async ({ groupId, isHidden }) => {
      const existing = allGroupPrefs.find(p => p.group_id === groupId);
      if (existing) {
        return base44.entities.UserGroupPreference.update(existing.id, { is_hidden_from_list: isHidden });
      } else {
        return base44.entities.UserGroupPreference.create({
          user_email: user?.email,
          group_id: groupId,
          is_hidden_from_list: isHidden
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allGroupPrefs']);
    }
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId) => {
      await base44.functions.invoke('deleteCreatorGroup', { groupId });
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myGroupsDetails']);
      queryClient.invalidateQueries(['myGroupMemberships']);
      queryClient.invalidateQueries(['activeGroup']);
      if (activeGroupId) {
        setSearchParams({});
      }
    },
    onError: (err) => {
       alert('Failed to delete group: ' + (err.message || 'Unknown error'));
    }
  });

  const createGroupMutation = useMutation({
    mutationFn: async ({ name, type }) => {
      const funnel_content = {
        welcome_mat_title: `Welcome to ${name}! 👋`,
        welcome_mat_description: "This is a private community for our members. Here you'll find exclusive resources, training, and support. Take a look around, and if you're ready to join us, click the button below!",
        welcome_mat_button_text: "I'm Interested!",
        interested_dashboard_header: "🎉 You're one step away! Here's everything you need to know to become a member.",
        interested_signup_info: "1. Click the Sign Up button above\n2. Complete the registration\n3. Upload your proof of payment\n4. We'll approve you within 24 hours!",
        interested_attribution_prompt: "Who shared this opportunity with you? (optional)"
      };

      const response = await base44.functions.invoke('createCreatorGroup', { name, type, funnel_content });
      await new Promise(resolve => setTimeout(resolve, 500));
      return response.data;
    },
    onSuccess: (newGroup) => {
      queryClient.invalidateQueries(['myGroupMemberships']);
      queryClient.invalidateQueries(['myGroupsDetails']);
      // Force close dialog immediately
      setIsCreateOpen(false);
      // Reset form
      setNewGroupName('');
      setNewGroupType('community');
      // Navigate
      setTimeout(() => setSearchParams({ id: newGroup.id }), 100);
    }
  });

  // Handle Invite Link
  const inviteCode = searchParams.get('invite');
  const processedInviteRef = React.useRef(null);

  const joinMutation = useMutation({
    mutationFn: async (code) => {
      const groups = await base44.entities.CreatorGroup.filter({ invite_code: code });
      if (groups.length === 0) throw new Error('Invalid invite code');
      const group = groups[0];
      
      const existing = await base44.entities.CreatorGroupMember.filter({ group_id: group.id, user_email: user?.email });
      if (existing.length > 0) {
        // If pending, activate them since they have the invite code
        if (existing[0].status === 'pending') {
          await base44.entities.CreatorGroupMember.update(existing[0].id, { status: 'active', role: 'member', joined_date: new Date().toISOString() });
          return { group, existing: false, wasPending: true };
        }
        return { group, existing: true };
      }

      await base44.entities.CreatorGroupMember.create({
        group_id: group.id,
        user_email: user?.email,
        role: 'member',
        status: 'active', // Auto-activate if using valid invite code
        level: 'Member',
        joined_date: new Date().toISOString()
      });
      return { group, existing: false };
    },
    onSuccess: ({ group, existing, wasPending }) => {
      if (wasPending) alert('Membership activated! Welcome to the group.');
      else if (existing) alert('You are already a member of this group!');
      else alert('Welcome! You have joined the group.');
      
      queryClient.invalidateQueries(['myGroupMemberships']);
      setSearchParams({ id: group.id }); // Go to dashboard (might be restricted view if pending)
    },
    onError: () => alert('Invalid invite code or error joining.')
  });

  useEffect(() => {
    const sessionKey = `invite_prompt_shown_${inviteCode}`;
    if (inviteCode && user?.email && !sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, 'true');
      
      // Use setTimeout to allow render to complete before blocking with confirm
      setTimeout(() => {
        if (window.confirm('Do you want to join this group?')) {
          joinMutation.mutate(inviteCode);
        } else {
          // Remove invite param if they cancel
          setSearchParams({});
        }
      }, 100);
    }
  }, [inviteCode, user]);

  const activeGroup = fetchedActiveGroup || groups.find(g => g.id === activeGroupId);
  const activeMembership = myMemberships.find(m => m.group_id === activeGroupId);
  
  // DIAGNOSTIC LOGGING
  if (activeGroupId && activeMembership) {
    console.log('UI DIAGNOSIS:', {
      group: activeGroup?.name,
      email: user?.email,
      membership: activeMembership,
      role: activeMembership.role,
      level: activeMembership.level,
      status: activeMembership.status
    });
  }

  const isAdmin = activeMembership && ['owner', 'admin', 'manager'].includes(activeMembership.role);
  const isPending = activeMembership?.status === 'pending';
  const isInterested = activeMembership?.status === 'interested' || activeMembership?.pending_approval; // Treat pending approval as interested mode
  const isMember = !!activeMembership && (activeMembership.status === 'active' || activeMembership.status === 'trial');
  const canInvite = isAdmin || (activeGroup?.settings?.allowed_invite_roles || []).includes(activeMembership?.role);

  // Invite Mutation
  const inviteMutation = useMutation({
    mutationFn: async (data) => {
      const email = (data.email || '').trim().toLowerCase();
      if (!email) throw new Error('Email required');
      
      // Determine Role and Level
      // If admin, use selected role. If member, use defaults from settings.
      const roleToUse = isAdmin ? data.role : (activeGroup.settings?.default_invite_role || 'member');
      const levelToUse = isAdmin ? 'Member' : (activeGroup.settings?.default_invite_level || 'Member'); // Admin UI doesn't have level selector yet, default to Member. Member invite uses settings.

      const existing = await base44.entities.CreatorGroupMember.filter({ group_id: activeGroup.id, user_email: email });
      if (existing.length > 0) {
        // Upsert: promote to active and update role
        return base44.entities.CreatorGroupMember.update(existing[0].id, {
          role: roleToUse,
          status: 'active',
          level: levelToUse,
          joined_date: existing[0].joined_date || new Date().toISOString()
        });
      }
      return base44.entities.CreatorGroupMember.create({
        group_id: activeGroup.id,
        user_email: email,
        role: roleToUse,
        status: 'active',
        level: levelToUse,
        joined_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['groupMembers', activeGroup.id]); // Invalidate members list
      setIsInviteOpen(false);
      setInviteEmail('');
      alert('Member invited successfully!');
    }
  });

  // Redirect Interested users to the Interested Dashboard
  const navigate = useNavigate();
  useEffect(() => {
      if (isInterested && activeGroupId) {
          navigate(createPageUrl('GroupInterested') + `?groupId=${activeGroupId}`);
      }
  }, [isInterested, activeGroupId, navigate]);

  // Handle Referrals when joining
  const referralCode = searchParams.get('ref');
  useEffect(() => {
    if (inviteCode && referralCode && user?.email) {
      const sessionTrackedKey = `referral_tracked_group_${referralCode}_${inviteCode}`;
      const isAlreadyTracked = sessionStorage.getItem(sessionTrackedKey);

      if (!isAlreadyTracked) {
        sessionStorage.setItem(sessionTrackedKey, 'true');
        // Track referral
        base44.functions.invoke('trackReferral', { 
          referralCode: referralCode, 
          activityType: 'click',
          email: user.email,
          sourceType: 'group_invite',
          sourceDetail: activeGroupId || 'pending_invite'
        }).catch(err => console.error('Referral track error:', err));
      }
    }
  }, [inviteCode, referralCode, user]);

  // Update Group Crypto
  const updateGroupMutation = useMutation({
    mutationFn: (data) => base44.entities.CreatorGroup.update(activeGroupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['myGroupsDetails']);
      queryClient.invalidateQueries(['activeGroup', activeGroupId]);
    }
  });

  // Preferences Query
  const { data: groupPrefs } = useQuery({
    queryKey: ['groupPrefs', user?.email, activeGroupId],
    queryFn: async () => {
      if (!user?.email || !activeGroupId) return null;
      const res = await base44.entities.UserGroupPreference.filter({ user_email: user?.email, group_id: activeGroupId });
      return res[0] || { hidden_tabs: [], tab_order: [] };
    },
    enabled: !!activeGroupId
  });

  const updatePrefsMutation = useMutation({
    mutationFn: async (newPrefs) => {
      if (groupPrefs?.id) {
        return base44.entities.UserGroupPreference.update(groupPrefs.id, newPrefs);
      } else {
        return base44.entities.UserGroupPreference.create({ 
          user_email: user?.email, 
          group_id: activeGroupId, 
          ...newPrefs 
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['groupPrefs', user?.email, activeGroupId])
  });

  // Shortcuts Query
  const { data: shortcuts = [] } = useQuery({
    queryKey: ['groupShortcuts', activeGroupId],
    queryFn: () => base44.entities.GroupShortcut.filter({ group_id: activeGroupId }, 'sort_order'),
    enabled: !!activeGroupId
  });

  // --- Retainer Balance Calculation ---
  // Only fetch for Client Portal groups
  const isClientPortal = ['client-portal', 'agency'].includes(activeGroup?.type);
  
  const { data: retainerBalance } = useQuery({
    queryKey: ['retainerBalance', activeGroupId],
    queryFn: async () => {
      if (!activeGroupId) return null;
      
      // 1. Get total purchased hours (GroupMemberRetainerPackage)
      // Note: Assuming we want sum of ALL packages in the group (typically 1 client)
      const packages = await base44.entities.GroupMemberRetainerPackage.filter({ group_id: activeGroupId });
      const purchased = packages.reduce((sum, p) => sum + (p.hours_purchased || 0), 0);

      // 2. Get total project logged hours (TimeEntry)
      // We need to fetch projects first to get project IDs? 
      // TimeEntry has project_id but not group_id directly (unless we added it? Schema says project_id).
      // But we can filter TimeEntry by... wait, TimeEntry schema doesn't have group_id. 
      // We must fetch projects first.
      const projects = await base44.entities.GroupProject.filter({ group_id: activeGroupId });
      const projectIds = projects.map(p => p.id);
      
      let logged = 0;
      if (projectIds.length > 0) {
         // This is a bit inefficient if many projects, but fine for now. 
         // Ideally TimeEntry should have group_id.
         const timePromises = projectIds.map(pid => base44.entities.TimeEntry.filter({ project_id: pid }));
         const allTime = await Promise.all(timePromises);
         logged = allTime.flat().reduce((sum, t) => sum + (t.hours || 0), 0);
      }

      // 3. Get total meeting hours (MeetingRecording)
      const meetings = await base44.entities.MeetingRecording.filter({ group_id: activeGroupId });
      const meetingHours = meetings.reduce((sum, m) => sum + (m.hours || 0), 0);

      return {
        purchased,
        used: logged + meetingHours,
        remaining: purchased - (logged + meetingHours)
      };
    },
    enabled: !!activeGroupId && isClientPortal
  });

  const showLoading = isLoading || (activeGroupId && isActiveGroupLoading) || (isLoadingGroups && myMemberships.length > 0 && !activeGroupId && !browseMode);

  if (showLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>;
  }

  // Handle case where group ID is in URL but group not found
  if (activeGroupId && !activeGroup && !isActiveGroupLoading) {
    return (
        <div className="flex flex-col items-center justify-center h-screen p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-900">Group Not Found</h2>
            <p className="text-gray-500 mt-2">This group may have been deleted or you don't have permission to view it.</p>
            <Button className="mt-4" onClick={() => setSearchParams({})}>Back to My Groups</Button>
        </div>
    );
  }

  const getGroupIcon = (type) => {
    switch (type) {
      case 'agency': return Building;
      case 'family': return Home;
      case 'collective': return Sparkles;
      case 'mastermind': return Brain;
      case 'project': return Briefcase;
      default: return Users;
    }
  };

  const getGroupColorClass = (type) => {
    const t = (groupTypes || []).find(gt => gt.key === type);
    if (t?.badge_class) return t.badge_class;
    switch (type) {
      case 'agency': return 'bg-purple-100 text-purple-600';
      case 'family': return 'bg-green-100 text-green-600';
      case 'collective': return 'bg-pink-100 text-pink-600';
      case 'mastermind': return 'bg-amber-100 text-amber-600';
      case 'project': return 'bg-blue-100 text-blue-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getGroupLabel = (type) => {
    const t = (groupTypes || []).find(gt => gt.key === type);
    if (t?.name) return t.name.toUpperCase();
    switch (type) {
      case 'agency': return 'AGENCY';
      case 'family': return 'FAMILY';
      case 'collective': return 'COLLECTIVE';
      case 'mastermind': return 'MASTERMIND';
      case 'project': return 'PROJECT';
      default: return 'COMMUNITY';
    }
  };

  const allTabs = [
    { id: 'feed', label: 'Feed', icon: Bell, color: 'purple' },
    { id: 'discussion', label: 'Discussion', icon: MessageSquare, color: 'teal' },
    { id: 'events', label: 'Events', icon: Calendar, color: 'pink' },
    { id: 'meetings', label: 'Meetings', icon: Video, color: 'rose' },
    { id: 'projects', label: 'Projects', icon: Briefcase, color: 'indigo' },
    { id: 'marketing', label: 'Marketing', icon: Printer, color: 'indigo' },
    { id: 'assets', label: 'Brand & Assets', icon: Sparkles, color: 'pink' },
    { id: 'resources', label: 'Resources', icon: FileText, color: 'amber' },
    { id: 'training', label: 'Training', icon: Video, color: 'blue' },
    { id: 'qna', label: 'Q&A', icon: MessageSquare, color: 'teal' },
    { id: 'members', label: 'Members', icon: Users, color: 'orange' },
    { id: 'requests', label: 'Requests', icon: AlertCircle, color: 'gray' },
  ];

  // Determine if this group is a "Client Group" (agency or client-portal)
  const isClientGroup = ['client-portal', 'agency'].includes(activeGroup?.type);
  
  // Projects and Meetings are only for Client Groups
  const clientOnlyTabs = ['projects', 'meetings', 'marketing', 'assets'];

  const availableTabs = allTabs.filter(tab => {
    if (clientOnlyTabs.includes(tab.id)) {
      return isClientGroup;
    }
    return true;
  });

  // Sort tabs based on group settings
  const tabOrder = activeGroup?.settings?.tab_order || allTabs.map(t => t.id);
  availableTabs.sort((a, b) => {
    const indexA = tabOrder.indexOf(a.id);
    const indexB = tabOrder.indexOf(b.id);
    // If both exist in order array, sort by index
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    // If one doesn't exist (new tab?), put it at the end
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return 0;
  });

  const toggleTabVisibility = (tabId) => {
    const hidden = groupPrefs?.hidden_tabs || [];
    const newHidden = hidden.includes(tabId) 
      ? hidden.filter(id => id !== tabId)
      : [...hidden, tabId];
    updatePrefsMutation.mutate({ hidden_tabs: newHidden });
  };

  const typeConfig = (groupTypes || []).find(gt => gt.key === activeGroup?.type);
  const allowed = typeConfig?.enabled_tabs && typeConfig.enabled_tabs.length > 0 ? new Set(typeConfig.enabled_tabs) : null;
  const defaultTab = allowed && !allowed.has('feed') ? (Array.from(allowed)[0] || 'feed') : 'feed';
  
  const currentTab = activeTab || defaultTab;

  const handleTabChange = (val) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tab', val);
      return newParams;
    });
  };

  // Check if group has custom navigation configured
  const hasCustomNavigation = !!activeGroup?.settings?.tab_order;
  const disabledFeatures = activeGroup?.settings?.disabled_features || [];

  const isTabEnabled = (id) => {
    const userRole = activeMembership?.role || 'member';
    const userLevel = activeMembership?.level || 'Member';
    const userStatus = activeMembership?.status;
    
    // Check disabled features first (Global Admin Toggle) - If it's disabled here, it's disabled for everyone
    if (disabledFeatures.includes(id)) return false;

    // Check for explicit permissions from Group Settings next
    const permissions = activeGroup?.role_tab_permissions;
    if (permissions && permissions[id] !== undefined) {
       // If the tab is configured in permissions, use that configuration STRICTLY
       const attributes = [userRole, userLevel, userStatus].filter(Boolean);
       const allowedList = permissions[id];
       const hasPermission = attributes.some(attr => allowedList.includes(attr));
       
       if (isAdmin) return true;
       return hasPermission;
    }

    // If Custom Navigation is enabled, and the tab is NOT disabled (checked above), 
    // it should be enabled for everyone (unless it's 'members' or explicitly restricted)
    if (hasCustomNavigation) {
       if (id === 'members' && !isAdmin) return false;
       return true; 
    }

    // Legacy/Default logic (if no custom navigation set)
    // Client Role Default: Clients usually see core tabs
    if (userRole === 'client' && ['feed', 'projects', 'meetings', 'marketing', 'assets', 'resources', 'requests', 'discussion'].includes(id)) {
        return true;
    }

    // Client Portal overrides
    if (isClientGroup && ['feed', 'projects', 'meetings', 'marketing', 'assets', 'resources', 'requests', 'members', 'discussion'].includes(id)) {
        if (id === 'members' && !isAdmin) return false;
        // Proceed to return true at end
    } else if (allowed && !allowed.has(id)) {
        // If not allowed by Group Type, hide it (unless admin)
        if (!isAdmin) return false;
    }
    
    if (id === 'members' && !isAdmin) return false;
    
    // Admin Override
    if (isAdmin) return true;

    return !(groupPrefs?.hidden_tabs || []).includes(id);
  };

  // Helper to check if a tab is visible to a regular member (for admin indication)
  const isVisibleToRegularMember = (id) => {
    // If disabled globally, it's not visible
    if (disabledFeatures.includes(id)) return false;

    const permissions = activeGroup?.role_tab_permissions;
    if (permissions && permissions[id] !== undefined) {
       return permissions[id].includes('member') || permissions[id].includes('Member');
    }
    
    // If Custom Navigation is enabled, and not disabled, it IS visible to members
    if (hasCustomNavigation) {
       if (id === 'members') return false;
       return true;
    }
    
    // Fallback defaults for member role (Legacy/Default)
    if (isClientGroup) {
        return ['feed', 'events', 'qna', 'resources', 'training', 'discussion'].includes(id);
    }

    if (allowed && !allowed.has(id)) return false;
    if (id === 'members') return false;
    return true;
  };

  // LIST OR BROWSE VIEW
  if (!activeGroup) {
    const displayedGroups = browseMode 
      ? browseGroups.filter(g => g.allow_public_discovery === true || isSuperAdmin || g.owner_email === user?.email)
      : groups.filter(g => {
          const pref = allGroupPrefs.find(p => p.group_id === g.id);
          return showHidden || !pref?.is_hidden_from_list;
        });

    return (
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-7 h-7 text-purple-600" /> {browseMode ? 'Browse Groups' : 'My Groups'}
            </h1>
            <p className="text-gray-600 mt-1">
              {browseMode ? 'Discover new communities to join.' : 'Connect, learn, and grow with your squads.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
             <div className="flex bg-gray-100 p-1 rounded-lg">
              <Button 
                size="sm" 
                variant={viewMode === 'grid' ? 'white' : 'ghost'} 
                className={`h-8 px-2 ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button 
                size="sm" 
                variant={viewMode === 'table' ? 'white' : 'ghost'}
                className={`h-8 px-2 ${viewMode === 'table' ? 'bg-white shadow-sm' : ''}`}
                onClick={() => setViewMode('table')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
            
            <Button 
              size="sm" 
              variant={showHidden ? "secondary" : "outline"} 
              onClick={() => setShowHidden(!showHidden)}
              title={showHidden ? "Hide Hidden Groups" : "Show All Groups"}
            >
              {showHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" /> Create Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Group</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <Label>Group Type</Label>
                    <Select value={newGroupType} onValueChange={setNewGroupType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[60]" position="popper">
                        {groupTypes?.filter(t => t.key !== 'client-portal' || isProTier).map(type => (
                          <SelectItem key={type.key} value={type.key}>
                            <div className="flex flex-col text-left py-1">
                              <span className="font-semibold">{type.name}</span>
                              <span className="text-xs text-gray-500">{type.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      {newGroupType === 'agency' 
                        ? 'Official business groups for agencies, coaching, or brands. This creates your Agency entity.' 
                        : newGroupType === 'client-portal'
                        ? 'Private workspace for client projects, time tracking, and meeting records.'
                        : 'Create a space for collaboration, sharing, and growth.'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Group Name</Label>
                    <Input 
                      value={newGroupName} 
                      onChange={(e) => setNewGroupName(e.target.value)} 
                      placeholder="e.g. The Treehouse" 
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                     onClick={() => createGroupMutation.mutate({ name: newGroupName, type: newGroupType })} 
                     disabled={!newGroupName || createGroupMutation.isPending}
                  >
                    {createGroupMutation.isPending ? (
                       <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                    ) : 'Create Group'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedGroups.map(group => {
              const GroupIcon = getGroupIcon(group.type);
              const colorClass = getGroupColorClass(group.type);
              
              const customColor = group.settings?.group_color;
              const iconStyle = customColor ? { backgroundColor: customColor + '20', color: customColor } : {};
              const iconClass = customColor ? '' : colorClass;

              const pref = allGroupPrefs.find(p => p.group_id === group.id);
              const isHidden = pref?.is_hidden_from_list;
              const membership = myMemberships.find(m => m.group_id === group.id);
              const isMember = !!membership;

              return (
                <Card key={group.id} className={`hover:shadow-lg transition-all cursor-pointer group ${isHidden ? 'opacity-60 bg-gray-50' : ''}`} onClick={() => setSearchParams({ id: group.id })}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div 
                        className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${iconClass}`}
                        style={iconStyle}
                      >
                        {group.logo_url ? <img src={group.logo_url} alt="" className="w-full h-full object-cover rounded-xl" /> : group.name[0]}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${colorClass.replace('text-', 'text-opacity-80 text-').replace('bg-', 'bg-opacity-50 bg-')}`}>
                          {getGroupLabel(group.type)}
                        </span>
                        {group.owner_email === user?.email && (
                          <span className="text-[10px] border px-2 py-0.5 rounded-full text-gray-500">Owner</span>
                        )}
                        {!isMember && browseMode && (
                           <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">New</span>
                        )}
                        {isHidden && (
                          <span className="text-[10px] bg-gray-200 px-2 py-0.5 rounded-full text-gray-500 flex items-center gap-1">
                            <EyeOff className="w-3 h-3" /> Hidden
                          </span>
                        )}
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-purple-600 transition-colors">{group.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4">{group.description || 'No description yet.'}</p>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      {isMember ? (
                        <><GroupIcon className="w-3 h-3" /> Enter Dashboard</>
                      ) : (
                        <><Eye className="w-3 h-3" /> View Details</>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedGroups.map(group => {
                  const pref = allGroupPrefs.find(p => p.group_id === group.id);
                  const isHidden = pref?.is_hidden_from_list;
                  const isOwner = group.owner_email === user?.email;
                  const membership = myMemberships.find(m => m.group_id === group.id);
                  const isMember = !!membership;

                  const customColor = group.settings?.group_color;
                  const iconStyle = customColor ? { backgroundColor: customColor + '20', color: customColor } : {};
                  const iconClass = customColor ? '' : getGroupColorClass(group.type);

                  return (
                    <TableRow key={group.id} className={isHidden ? 'opacity-60 bg-gray-50' : ''}>
                      <TableCell className="font-medium cursor-pointer" onClick={() => setSearchParams({ id: group.id })}>
                        <div className="flex items-center gap-3">
                           <div 
                             className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${iconClass}`}
                             style={iconStyle}
                           >
                              {group.name[0]}
                           </div>
                           {group.name}
                        </div>
                      </TableCell>
                      <TableCell>{getGroupLabel(group.type)}</TableCell>
                      <TableCell>
                        {isOwner ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Owner
                          </span>
                        ) : isMember ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Member
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Discover
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                           {isMember && (
                             <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleGroupVisibilityMutation.mutate({ groupId: group.id, isHidden: !isHidden });
                                }}
                                title={isHidden ? "Show Group" : "Hide Group"}
                             >
                                {isHidden ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                             </Button>
                           )}
                           {isOwner && (
                             <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (window.confirm(`Are you sure you want to delete ${group.name}? This cannot be undone.`)) {
                                    deleteGroupMutation.mutate(group.id);
                                  }
                                }}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                             >
                                <Trash2 className="w-4 h-4" />
                             </Button>
                           )}
                           <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setSearchParams({ id: group.id })}
                           >
                              {isMember ? 'Open' : 'View'}
                           </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}

        {displayedGroups.length === 0 && (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed">
            <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No Groups Found</h3>
            <p className="text-gray-500 mb-4">{showHidden ? "No groups match your filters." : "You haven't joined any groups yet."}</p>
            <Button variant="outline" onClick={() => setIsCreateOpen(true)}>Create Your First Group</Button>
          </div>
        )}
      </div>
    );
  }

  // DASHBOARD VIEW
  const GroupHeaderIcon = getGroupIcon(activeGroup.type);
  const groupColorClass = getGroupColorClass(activeGroup.type);

  if (isPending) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold">Membership Pending</h2>
        <p className="text-gray-500 max-w-md">
          You have requested to join <strong>{activeGroup.name}</strong>. An admin needs to approve your request before you can access the dashboard.
        </p>
        <Button variant="outline" onClick={() => setSearchParams({})}>Back to My Groups</Button>
      </div>
    );
  }

  // Private group guard (no preview unless discoverable or admin/owner)
  if (!isMember && !isAdmin && !isSuperAdmin && activeGroup.owner_email !== user?.email && activeGroup.allow_public_discovery !== true) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold">This group is private</h2>
        <p className="text-gray-500 max-w-md">You must be invited to view this group. Enter an invite code or go back.</p>
        <div className="flex gap-2">
          <Button onClick={() => {
            const code = prompt('Enter invite code to join:');
            if (code) joinMutation.mutate(code);
          }}>Enter Invite Code</Button>
          <Button variant="outline" onClick={() => setSearchParams({})}>Back</Button>
        </div>
      </div>
    );
  }

  // Override theme colors if group has a custom color
  const themeStyles = activeGroup.settings?.group_color ? {
    '--primary-color': activeGroup.settings.group_color,
    '--accent-color': activeGroup.settings.group_color,
  } : {};

  return (
    <div className="min-h-screen bg-gray-50/50" style={themeStyles}>
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSearchParams(browseMode ? { mode: 'browse' } : {})}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {activeGroup.name}
                <GroupHeaderIcon className={`w-5 h-5 ${groupColorClass.split(' ')[1]}`} />
              </h1>
              <p className="text-xs text-gray-500">
                 {isMember ? 'Dashboard' : 'Preview'} • {getGroupLabel(activeGroup.type)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             {!isMember && (
                <div className="flex items-center gap-2">
                   <Button onClick={() => {
                     const code = prompt("Enter invite code to join:");
                     if (code) joinMutation.mutate(code);
                   }}>
                     Enter Invite Code
                   </Button>
                </div>
             )}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="hidden sm:flex">
                  <Eye className="w-4 h-4 mr-2" /> Customize View
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Customize Dashboard</DialogTitle>
                </DialogHeader>
                <div className="py-4 space-y-3">
                  <p className="text-sm text-gray-500 mb-2">Toggle visibility of sections on your dashboard.</p>
                  {(typeConfig?.enabled_tabs?.length ? availableTabs.filter(t => typeConfig.enabled_tabs.includes(t.id)) : availableTabs).map(tab => {
                    const isHidden = (groupPrefs?.hidden_tabs || []).includes(tab.id);
                    const Icon = tab.icon;
                    return (
                      <div key={tab.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-md bg-${tab.color}-100 text-${tab.color}-700`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="font-medium">{tab.label}</span>
                        </div>
                        <Switch checked={!isHidden} onCheckedChange={() => toggleTabVisibility(tab.id)} />
                      </div>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>
            
            {isAdmin && (
              <div className="text-right hidden sm:block">
                <code className="text-xs bg-gray-100 px-2 py-1 rounded block text-center mb-1">Code: {activeGroup.invite_code}</code>
              </div>
            )}

            {/* Invite Button */}
            {canInvite && (
              <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="hidden sm:flex bg-purple-600 hover:bg-purple-700 text-white shadow-sm border-0">
                    <UserPlus className="w-4 h-4 mr-2" /> Invite
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Member</DialogTitle>
                    <CardDescription>
                      {isAdmin 
                        ? "Add a new member and assign their role." 
                        : `Invite a new member to join as ${activeGroup.settings?.default_invite_role || 'member'}.`}
                    </CardDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="user@example.com" />
                    </div>
                    
                    {isAdmin && (
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select value={inviteRole} onValueChange={setInviteRole}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent className="z-[60]">
                            <SelectItem value="member">Member</SelectItem>
                            <SelectItem value="client">Client</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="virtual-assistant">Virtual Assistant</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button onClick={() => inviteMutation.mutate({ email: inviteEmail, role: inviteRole })} disabled={!inviteEmail || inviteMutation.isPending}>
                      {inviteMutation.isPending ? 'Inviting...' : 'Send Invite'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {/* Mobile AI Button */}
            {(activeGroup.type === 'client-portal' || activeGroup.type === 'agency') && (
              <Button 
                size="sm" 
                className="lg:hidden bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0 shadow-sm"
                onClick={() => setIsAIMobileOpen(true)}
              >
                <Sparkles className="w-4 h-4" />
              </Button>
            )}
            
            {/* Mobile Invite Button (Icon Only) */}
            {canInvite && (
               <Button 
                 size="sm" 
                 className="sm:hidden bg-purple-600 hover:bg-purple-700 text-white border-0 shadow-sm"
                 onClick={() => setIsInviteOpen(true)}
               >
                 <UserPlus className="w-4 h-4" />
               </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile AI Dialog */}
      <Dialog open={isAIMobileOpen} onOpenChange={setIsAIMobileOpen}>
        <DialogContent className="p-0 border-0 h-[80vh] max-h-[600px] flex flex-col bg-transparent shadow-none">
           <div className="bg-white rounded-xl overflow-hidden flex-1 shadow-2xl">
              <GroupAICompanion 
                  groupId={activeGroup.id} 
                  groupName={activeGroup.name}
                  className="w-full h-full border-0 shadow-none"
                  defaultOpen={true}
              />
           </div>
        </DialogContent>
      </Dialog>

      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Shortcuts & Crypto Sidebar */}
        <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">

          {/* AI Companion for Client Portals (Desktop) */}
          {(activeGroup.type === 'client-portal' || activeGroup.type === 'agency') && (
              <div className="hidden lg:block">
                  <GroupAICompanion 
                      groupId={activeGroup.id} 
                      groupName={activeGroup.name}
                      className="w-full"
                      defaultOpen={false}
                  />
              </div>
          )}

          {/* Calendar Widget */}
          <GroupCalendarWidget group={activeGroup} myMembership={activeMembership} isAdmin={isAdmin} />

          {/* Crypto Ticker for Group */}
          {activeGroup.settings?.hide_ticker !== true && (
            <CryptoTickerWidget 
              portfolio={activeGroup.crypto_tickers || []}
              onUpdatePortfolio={(tickers) => updateGroupMutation.mutate({ crypto_tickers: tickers })}
              title="Group Tickers"
            />
          )}

          {shortcuts.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm uppercase text-gray-500 font-bold flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" /> Quick Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {shortcuts.map(shortcut => (
                  <a 
                    key={shortcut.id} 
                    href={shortcut.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{shortcut.title}</div>
                      <div className="text-xs text-gray-400 truncate">{(shortcut.url || '').replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]}</div>
                    </div>
                  </a>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-3 order-1 lg:order-2">

          {/* Retainer Balance Header */}
          {retainerBalance && activeGroup.enable_retainer_management && (retainerBalance.purchased > 0 || isAdmin) && activeGroup.settings?.hide_retainer_balance !== true && (
            <div className="bg-white rounded-xl p-4 border shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gradient-to-r from-white to-purple-50/50">
               <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
                     <Clock className="w-6 h-6" />
                  </div>
                  <div>
                     <h3 className="font-bold text-gray-900">Hours Balance</h3>
                     <p className="text-sm text-gray-500">
                        {retainerBalance.purchased.toFixed(2)}h Purchased • {retainerBalance.used.toFixed(2)}h Used
                     </p>
                  </div>
               </div>
               <div className="flex items-center gap-6">
                 <Button 
                   variant="outline" 
                   size="sm" 
                   className="hidden sm:flex bg-white/50 hover:bg-white"
                   onClick={() => setShowTimeReport(true)}
                 >
                   <FileText className="w-4 h-4 mr-2" /> View Report
                 </Button>
                 <div className="text-right">
                    <div className={`text-2xl font-bold ${retainerBalance.remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
                       {retainerBalance.remaining.toFixed(2)}h
                    </div>
                    <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Remaining</div>
                 </div>
               </div>
            </div>
          )}

          {showTimeReport && (
            <TimeReportDialog 
              isOpen={showTimeReport} 
              onClose={() => setShowTimeReport(false)} 
              groupId={activeGroupId} 
            />
          )}

          <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
            <TabsList className="bg-white border p-1 rounded-xl h-auto flex-wrap gap-1 w-full justify-start">
              {availableTabs.map(tab => {
                const enabled = isTabEnabled(tab.id);
                if (!enabled) return null; 
                
                // Check visibility for regular members
                const isMemberVisible = isVisibleToRegularMember(tab.id);
                const isAdminOnly = isAdmin && !isMemberVisible;
                const isActive = currentTab === tab.id;

                const Icon = tab.icon;
                return (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id} 
                    title={tab.label + (isAdminOnly ? " (Admin Only)" : "")}
                    className={`
                      relative flex items-center transition-all duration-200 rounded-lg
                      ${isActive ? `px-4 py-2 bg-${tab.color}-100 text-${tab.color}-700 shadow-sm` : 'px-3 py-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900'}
                      ${isAdminOnly && !isActive ? 'opacity-40 grayscale' : ''}
                    `}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'mr-2' : ''}`} />
                    {isActive && <span className="font-medium text-sm">{tab.label}</span>}
                    
                    {/* Admin indicator dot if minimized */}
                    {isAdminOnly && !isActive && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-gray-400 rounded-full" title="Admin Only" />
                    )}
                  </TabsTrigger>
                );
              })}
              
              {isAdmin && (
                <TabsTrigger 
                  value="settings" 
                  className={`
                    ml-auto rounded-lg transition-all duration-200
                    ${currentTab === 'settings' ? 'px-4 py-2 bg-gray-800 text-white' : 'px-3 py-2 text-gray-500 hover:bg-gray-100'}
                  `}
                >
                  <Settings className={`w-4 h-4 ${currentTab === 'settings' ? 'mr-2' : ''}`} />
                  {currentTab === 'settings' && <span>Settings</span>}
                </TabsTrigger>
              )}
            </TabsList>

          <TabsContent value="feed" className="focus-visible:outline-none">
            {isTabEnabled('feed') && (
              <GroupFeedTab group={activeGroup} currentUser={user} myMembership={activeMembership} isAdmin={isAdmin} />
            )}
          </TabsContent>

          <TabsContent value="events" className="focus-visible:outline-none">
            {isTabEnabled('events') && (
              <GroupEventsTab group={activeGroup} currentUser={user} myMembership={activeMembership} isAdmin={isAdmin} />
            )}
          </TabsContent>

          <TabsContent value="qna" className="focus-visible:outline-none">
            {isTabEnabled('qna') && (
              <GroupQnATab group={activeGroup} currentUser={user} myMembership={activeMembership} isAdmin={isAdmin} />
            )}
          </TabsContent>

          <TabsContent value="resources" className="focus-visible:outline-none">
            {isTabEnabled('resources') && (
              <GroupResourcesTab group={activeGroup} currentUser={user} myMembership={activeMembership} isAdmin={isAdmin} />
            )}
          </TabsContent>

          <TabsContent value="training" className="focus-visible:outline-none">
            {isTabEnabled('training') && (
              <GroupTrainingTab group={activeGroup} currentUser={user} isAdmin={isAdmin} />
            )}
          </TabsContent>

          <TabsContent value="projects" className="focus-visible:outline-none">
            {isTabEnabled('projects') && (
              <GroupProjectsTab group={activeGroup} currentUser={user} myMembership={activeMembership} />
            )}
          </TabsContent>

          <TabsContent value="meetings" className="focus-visible:outline-none">
            {isTabEnabled('meetings') && (
              <GroupMeetingsTab group={activeGroup} currentUser={user} isAdmin={isAdmin} />
            )}
          </TabsContent>

          <TabsContent value="marketing" className="focus-visible:outline-none">
            {isTabEnabled('marketing') && (
              <MarketingOrdersTab group={activeGroup} isAdmin={isAdmin} />
            )}
          </TabsContent>

          <TabsContent value="assets" className="focus-visible:outline-none">
            {isTabEnabled('assets') && (
              <GroupAssetsTab group={activeGroup} isAdmin={isAdmin} />
            )}
          </TabsContent>

          <TabsContent value="discussion" className="focus-visible:outline-none">
            {isTabEnabled('discussion') && (
              <GroupDiscussionTab group={activeGroup} currentUser={user} isAdmin={isAdmin} />
            )}
          </TabsContent>

          <TabsContent value="requests" className="focus-visible:outline-none">
            {isTabEnabled('requests') && (
              <GroupRequestsTab group={activeGroup} currentUser={user} isAdmin={isAdmin} />
            )}
          </TabsContent>

          <TabsContent value="members" className="focus-visible:outline-none">
            {isTabEnabled('members') && (
              <GroupMembersTab group={activeGroup} currentUser={user} isAdmin={isAdmin} />
            )}
          </TabsContent>

          {isAdmin && (
            <TabsContent value="settings" className="focus-visible:outline-none">
              <GroupSettingsTab group={activeGroup} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  </div>
  );
}