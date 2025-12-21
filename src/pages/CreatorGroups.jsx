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
import { Users, Plus, Settings, Video, AlertCircle, ArrowLeft, Loader2, Building, Home, Heart, Sparkles, Brain, Briefcase, Calendar, MessageSquare, FileText, Bell, Eye, EyeOff, Link as LinkIcon, ExternalLink, Clock, Trash2, Filter, LayoutGrid, List } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';
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
import CryptoTickerWidget from '../components/widgets/CryptoTickerWidget';
import GroupCalendarWidget from '../components/groups/GroupCalendarWidget';

export default function CreatorGroups() {
  const { user, preferences } = useTheme();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeGroupId = searchParams.get('id');
  const browseMode = searchParams.get('mode') === 'browse';
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupType, setNewGroupType] = useState('community');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [showHidden, setShowHidden] = useState(false);

  // Admin Check
  const realUserEmail = user?.email ? user?.email.toLowerCase() : '';
  const adminEmails = ['pixelnutscreative@gmail.com', 'pixel@thrivenut.app'];
  const isSuperAdmin = realUserEmail && adminEmails.includes(realUserEmail);
  const canCreateAgency = isSuperAdmin || preferences?.can_create_agency;

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
  const { data: groups = [] } = useQuery({
    queryKey: ['myGroupsDetails', myMemberships],
    queryFn: async () => {
      if (myMemberships.length === 0) return [];
      const groupPromises = myMemberships.map(async (m) => {
        const results = await base44.entities.CreatorGroup.filter({ id: m.group_id });
        return results[0];
      });
      const results = await Promise.all(groupPromises);
      return results.filter(Boolean);
    },
    enabled: myMemberships.length > 0 && !activeGroupId && !browseMode
  });

  // Fetch specific active group (even if not a member, for preview/join)
  const { data: fetchedActiveGroup } = useQuery({
    queryKey: ['activeGroup', activeGroupId],
    queryFn: async () => {
      const res = await base44.entities.CreatorGroup.filter({ id: activeGroupId });
      return res[0];
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
      // First verify ownership/admin
      const group = groups.find(g => g.id === groupId);
      if (!group || group.owner_email !== user?.email) {
        throw new Error("Unauthorized");
      }
      // Delete group
      await base44.entities.CreatorGroup.delete(groupId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myGroupsDetails']);
      queryClient.invalidateQueries(['myGroupMemberships']);
      // If we were on that group page, go back to list
      if (activeGroupId) {
        setSearchParams({});
      }
    }
  });

  const createGroupMutation = useMutation({
    mutationFn: async ({ name, type }) => {
      // 1. Create Group
      const group = await base44.entities.CreatorGroup.create({
        name,
        owner_email: user?.email,
        invite_code: Math.random().toString(36).substring(7).toUpperCase(),
        status: 'active',
        type
      });
      // 2. Add Owner as Member
      await base44.entities.CreatorGroupMember.create({
        group_id: group.id,
        user_email: user?.email,
        role: 'owner',
        status: 'active',
        joined_date: new Date().toISOString()
      });
      // Wait a moment to ensure database consistency before refetching
      await new Promise(resolve => setTimeout(resolve, 800));
      return group;
    },
    onSuccess: (newGroup) => {
      queryClient.invalidateQueries(['myGroupMemberships']);
      queryClient.invalidateQueries(['myGroupsDetails']);
      setIsCreateOpen(false);
      setNewGroupName('');
      setNewGroupType('community');
      setSearchParams({ id: newGroup.id });
    }
  });

  // Handle Invite Link
  const inviteCode = searchParams.get('invite');
  const joinMutation = useMutation({
    mutationFn: async (code) => {
      const groups = await base44.entities.CreatorGroup.filter({ invite_code: code });
      if (groups.length === 0) throw new Error('Invalid invite code');
      const group = groups[0];
      
      const existing = await base44.entities.CreatorGroupMember.filter({ group_id: group.id, user_email: user?.email });
      if (existing.length > 0) return { group, existing: true };

      await base44.entities.CreatorGroupMember.create({
        group_id: group.id,
        user_email: user?.email,
        role: 'member',
        status: 'active',
        level: 'Invited',
        joined_date: new Date().toISOString()
      });
      return { group, existing: false };
    },
    onSuccess: ({ group, existing }) => {
      if (existing) alert('You are already a member of this group!');
      else alert('Request to join sent! An admin will approve you shortly.');
      
      queryClient.invalidateQueries(['myGroupMemberships']);
      setSearchParams({ id: group.id }); // Go to dashboard (might be restricted view if pending)
    },
    onError: () => alert('Invalid invite code or error joining.')
  });

  useEffect(() => {
    if (inviteCode && user?.email) {
      if (window.confirm('Do you want to join this group?')) {
        joinMutation.mutate(inviteCode);
      } else {
        // Remove invite param if they cancel
        setSearchParams({});
      }
    }
  }, [inviteCode, user]);

  const activeGroup = fetchedActiveGroup || groups.find(g => g.id === activeGroupId);
  const activeMembership = myMemberships.find(m => m.group_id === activeGroupId);
  const isAdmin = activeMembership && ['owner', 'admin', 'manager'].includes(activeMembership.role);
  const isPending = activeMembership?.status === 'pending';
  const isMember = !!activeMembership && activeMembership.status === 'active';

  // Handle Referrals when joining
  const referralCode = searchParams.get('ref');
  useEffect(() => {
    if (inviteCode && referralCode && user?.email) {
      // Track referral
      base44.functions.invoke('trackReferral', { 
        code: referralCode, 
        event: 'group_join',
        details: { group_id: activeGroupId || 'pending_invite' }
      }).catch(err => console.error('Referral track error:', err));
    }
  }, [inviteCode, referralCode, user]);

  // Update Group Crypto
  const updateGroupMutation = useMutation({
    mutationFn: (data) => base44.entities.CreatorGroup.update(activeGroupId, data),
    onSuccess: () => queryClient.invalidateQueries(['myGroupsDetails'])
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

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>;
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
    switch (type) {
      case 'agency': return 'AGENCY';
      case 'family': return 'FAMILY';
      case 'collective': return 'COLLECTIVE';
      case 'mastermind': return 'MASTERMIND';
      case 'project': return 'PROJECT';
      default: return 'COMMUNITY';
    }
  };

  const availableTabs = [
    { id: 'feed', label: 'Feed', icon: Bell, color: 'purple' },
    { id: 'events', label: 'Events', icon: Calendar, color: 'pink' },
    { id: 'qna', label: 'Q&A', icon: MessageSquare, color: 'teal' },
    { id: 'resources', label: 'Resources', icon: FileText, color: 'amber' },
    { id: 'training', label: 'Training', icon: Video, color: 'blue' },
    { id: 'members', label: 'Members', icon: Users, color: 'orange' },
    { id: 'requests', label: 'Requests', icon: AlertCircle, color: 'gray' },
  ];

  const toggleTabVisibility = (tabId) => {
    const hidden = groupPrefs?.hidden_tabs || [];
    const newHidden = hidden.includes(tabId) 
      ? hidden.filter(id => id !== tabId)
      : [...hidden, tabId];
    updatePrefsMutation.mutate({ hidden_tabs: newHidden });
  };

  const visibleTabs = availableTabs.filter(t => {
    if (t.id === 'members' && !isAdmin) return false;
    return !(groupPrefs?.hidden_tabs || []).includes(t.id);
  });

  // LIST OR BROWSE VIEW
  if (!activeGroup) {
    const displayedGroups = browseMode ? browseGroups : groups.filter(g => {
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
                      <SelectContent>
                        <SelectItem value="community">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" /> Community / Friends
                          </div>
                        </SelectItem>
                        <SelectItem value="family">
                          <div className="flex items-center gap-2">
                            <Home className="w-4 h-4" /> Family
                          </div>
                        </SelectItem>
                        <SelectItem value="collective">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4" /> Creative Collective
                          </div>
                        </SelectItem>
                        <SelectItem value="mastermind">
                          <div className="flex items-center gap-2">
                            <Brain className="w-4 h-4" /> Mastermind Group
                          </div>
                        </SelectItem>
                        <SelectItem value="project">
                          <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4" /> Project Team
                          </div>
                        </SelectItem>
                        {canCreateAgency && (
                          <SelectItem value="agency">
                            <div className="flex items-center gap-2">
                              <Building className="w-4 h-4" /> Creative Agency / Business
                            </div>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      {newGroupType === 'agency' 
                        ? 'Official business groups for agencies, coaching, or brands. This creates your Agency entity.' 
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
                  <Button onClick={() => createGroupMutation.mutate({ name: newGroupName, type: newGroupType })} disabled={!newGroupName}>
                    Create Group
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
              const pref = allGroupPrefs.find(p => p.group_id === group.id);
              const isHidden = pref?.is_hidden_from_list;
              const membership = myMemberships.find(m => m.group_id === group.id);
              const isMember = !!membership;
              
              return (
                <Card key={group.id} className={`hover:shadow-lg transition-all cursor-pointer group ${isHidden ? 'opacity-60 bg-gray-50' : ''}`} onClick={() => setSearchParams({ id: group.id })}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${colorClass}`}>
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

                  return (
                    <TableRow key={group.id} className={isHidden ? 'opacity-60 bg-gray-50' : ''}>
                      <TableCell className="font-medium cursor-pointer" onClick={() => setSearchParams({ id: group.id })}>
                        <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${getGroupColorClass(group.type)}`}>
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

  return (
    <div className="min-h-screen bg-gray-50/50">
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
                  {availableTabs.map(tab => {
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
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Shortcuts & Crypto Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Calendar Widget */}
          <GroupCalendarWidget group={activeGroup} myMembership={activeMembership} isAdmin={isAdmin} />

          {/* Crypto Ticker for Group */}
          <CryptoTickerWidget 
            portfolio={activeGroup.crypto_tickers || []}
            onUpdatePortfolio={(tickers) => updateGroupMutation.mutate({ crypto_tickers: tickers })}
            title="Group Tickers"
          />

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
                      <div className="text-xs text-gray-400 truncate">{new URL(shortcut.url).hostname}</div>
                    </div>
                  </a>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-3">
          <Tabs defaultValue="feed" className="space-y-6">
            <TabsList className="bg-white border p-1 rounded-xl h-auto flex-wrap gap-1 w-full justify-start">
              {visibleTabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id} 
                    className={`px-4 py-2 rounded-lg data-[state=active]:bg-${tab.color}-100 data-[state=active]:text-${tab.color}-700`}
                  >
                    <Icon className="w-4 h-4 mr-2" /> {tab.label}
                  </TabsTrigger>
                );
              })}
              {/* Show hidden count or generic "See All" if many hidden? For now customizable via modal */}
              
              {isAdmin && (
                <TabsTrigger value="settings" className="px-4 py-2 rounded-lg data-[state=active]:bg-gray-800 data-[state=active]:text-white ml-auto">
                  <Settings className="w-4 h-4 mr-2" /> Settings
                </TabsTrigger>
              )}
            </TabsList>

          <TabsContent value="feed" className="focus-visible:outline-none">
            <GroupFeedTab group={activeGroup} currentUser={user} myMembership={activeMembership} isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="events" className="focus-visible:outline-none">
            <GroupEventsTab group={activeGroup} currentUser={user} myMembership={activeMembership} isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="qna" className="focus-visible:outline-none">
            <GroupQnATab group={activeGroup} currentUser={user} myMembership={activeMembership} isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="resources" className="focus-visible:outline-none">
            <GroupResourcesTab group={activeGroup} currentUser={user} myMembership={activeMembership} isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="training" className="focus-visible:outline-none">
            <GroupTrainingTab group={activeGroup} currentUser={user} isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="requests" className="focus-visible:outline-none">
            <GroupRequestsTab group={activeGroup} currentUser={user} isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="members" className="focus-visible:outline-none">
            <GroupMembersTab group={activeGroup} currentUser={user} isAdmin={isAdmin} />
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