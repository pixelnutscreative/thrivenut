import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Settings, Video, AlertCircle, ArrowLeft, Loader2, Building, Home, Heart, Sparkles, Brain, Briefcase, Calendar, MessageSquare, FileText, Bell } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import GroupTrainingTab from '../components/groups/GroupTrainingTab';
import GroupRequestsTab from '../components/groups/GroupRequestsTab';
import GroupMembersTab from '../components/groups/GroupMembersTab';
import GroupFeedTab from '../components/groups/GroupFeedTab';
import GroupQnATab from '../components/groups/GroupQnATab';
import GroupEventsTab from '../components/groups/GroupEventsTab';
import GroupResourcesTab from '../components/groups/GroupResourcesTab';
import GroupSettingsTab from '../components/groups/GroupSettingsTab';

export default function CreatorGroups() {
  const { user, preferences } = useTheme();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeGroupId = searchParams.get('id');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupType, setNewGroupType] = useState('community');

  // Admin Check
  const realUserEmail = user?.email ? user.email.toLowerCase() : '';
  const adminEmails = ['pixelnutscreative@gmail.com', 'pixel@thrivenut.app'];
  const isSuperAdmin = realUserEmail && adminEmails.includes(realUserEmail);
  const canCreateAgency = isSuperAdmin || preferences?.can_create_agency;

  // Fetch my groups
  const { data: myMemberships = [], isLoading } = useQuery({
    queryKey: ['myGroupMemberships', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.CreatorGroupMember.filter({ user_email: user.email });
    },
    enabled: !!user?.email
  });

  // Fetch group details for my memberships
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
    enabled: myMemberships.length > 0
  });

  const createGroupMutation = useMutation({
    mutationFn: async ({ name, type }) => {
      // 1. Create Group
      const group = await base44.entities.CreatorGroup.create({
        name,
        owner_email: user.email,
        invite_code: Math.random().toString(36).substring(7).toUpperCase(),
        status: 'active',
        type
      });
      // 2. Add Owner as Member
      await base44.entities.CreatorGroupMember.create({
        group_id: group.id,
        user_email: user.email,
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

  const activeGroup = groups.find(g => g.id === activeGroupId);
  const activeMembership = myMemberships.find(m => m.group_id === activeGroupId);
  const isAdmin = activeMembership && ['owner', 'admin', 'manager'].includes(activeMembership.role);

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

  // LIST VIEW
  if (!activeGroup) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="w-7 h-7 text-purple-600" /> My Groups
            </h1>
            <p className="text-gray-600 mt-1">Connect, learn, and grow with your squads.</p>
          </div>
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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map(group => {
            const GroupIcon = getGroupIcon(group.type);
            const colorClass = getGroupColorClass(group.type);
            
            return (
              <Card key={group.id} className="hover:shadow-lg transition-all cursor-pointer group" onClick={() => setSearchParams({ id: group.id })}>
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
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-purple-600 transition-colors">{group.name}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">{group.description || 'No description yet.'}</p>
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <GroupIcon className="w-3 h-3" /> Click to enter dashboard
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {groups.length === 0 && (
            <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed">
              <Users className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No Groups Yet</h3>
              <p className="text-gray-500 mb-4">Join a group or create your own to get started.</p>
              <Button variant="outline" onClick={() => setIsCreateOpen(true)}>Create Your First Group</Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // DASHBOARD VIEW
  const GroupHeaderIcon = getGroupIcon(activeGroup.type);
  const groupColorClass = getGroupColorClass(activeGroup.type);

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSearchParams({})}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                {activeGroup.name}
                <GroupHeaderIcon className={`w-5 h-5 ${groupColorClass.split(' ')[1]}`} />
              </h1>
              <p className="text-xs text-gray-500">Dashboard • {getGroupLabel(activeGroup.type)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-medium text-gray-900">Invite Code</p>
              <code className="text-xs bg-gray-100 px-2 py-1 rounded">{activeGroup.invite_code}</code>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <Tabs defaultValue="feed" className="space-y-6">
          <TabsList className="bg-white border p-1 rounded-xl h-auto flex-wrap gap-1">
            <TabsTrigger value="feed" className="px-4 py-2 rounded-lg data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
              <Bell className="w-4 h-4 mr-2" /> Feed
            </TabsTrigger>
            <TabsTrigger value="events" className="px-4 py-2 rounded-lg data-[state=active]:bg-pink-100 data-[state=active]:text-pink-700">
              <Calendar className="w-4 h-4 mr-2" /> Events
            </TabsTrigger>
            <TabsTrigger value="qna" className="px-4 py-2 rounded-lg data-[state=active]:bg-teal-100 data-[state=active]:text-teal-700">
              <MessageSquare className="w-4 h-4 mr-2" /> Q&A
            </TabsTrigger>
            <TabsTrigger value="resources" className="px-4 py-2 rounded-lg data-[state=active]:bg-amber-100 data-[state=active]:text-amber-700">
              <FileText className="w-4 h-4 mr-2" /> Resources
            </TabsTrigger>
            <TabsTrigger value="training" className="px-4 py-2 rounded-lg data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
              <Video className="w-4 h-4 mr-2" /> Training
            </TabsTrigger>
            <TabsTrigger value="members" className="px-4 py-2 rounded-lg data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
              <Users className="w-4 h-4 mr-2" /> Members
            </TabsTrigger>
            <TabsTrigger value="requests" className="px-4 py-2 rounded-lg data-[state=active]:bg-gray-100 data-[state=active]:text-gray-700">
              <AlertCircle className="w-4 h-4 mr-2" /> Requests
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="settings" className="px-4 py-2 rounded-lg data-[state=active]:bg-gray-800 data-[state=active]:text-white">
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
  );
}