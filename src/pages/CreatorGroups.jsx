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
import { Users, Plus, Settings, Video, AlertCircle, ArrowLeft, Loader2, Building, Home, Heart } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import GroupTrainingTab from '../components/groups/GroupTrainingTab';
import GroupRequestsTab from '../components/groups/GroupRequestsTab';
import GroupMembersTab from '../components/groups/GroupMembersTab';

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
      const groupPromises = myMemberships.map(m => base44.entities.CreatorGroup.findById(m.group_id));
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
                      {canCreateAgency && (
                        <SelectItem value="agency">
                          <div className="flex items-center gap-2">
                            <Building className="w-4 h-4" /> Agency / Official
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    {newGroupType === 'agency' 
                      ? 'Official Creator Groups for agencies, coaching, or brands.' 
                      : 'Casual groups for friends, family, or shared interests.'}
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
          {groups.map(group => (
            <Card key={group.id} className="hover:shadow-lg transition-all cursor-pointer group" onClick={() => setSearchParams({ id: group.id })}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl ${
                    group.type === 'agency' ? 'bg-purple-100 text-purple-600' :
                    group.type === 'family' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {group.name[0]}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {group.type === 'agency' && <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">AGENCY</span>}
                    {group.type === 'family' && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">FAMILY</span>}
                    {group.owner_email === user?.email && (
                      <span className="text-[10px] border px-2 py-0.5 rounded-full text-gray-500">Owner</span>
                    )}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-purple-600 transition-colors">{group.name}</h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{group.description || 'No description yet.'}</p>
                <div className="text-xs text-gray-400">
                  Click to enter dashboard
                </div>
              </CardContent>
            </Card>
          ))}
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
                {activeGroup.type === 'agency' && <Building className="w-4 h-4 text-purple-500" />}
                {activeGroup.type === 'family' && <Home className="w-4 h-4 text-green-500" />}
              </h1>
              <p className="text-xs text-gray-500">Dashboard</p>
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
        <Tabs defaultValue="training" className="space-y-6">
          <TabsList className="bg-white border p-1 rounded-xl h-auto flex-wrap">
            <TabsTrigger value="training" className="px-6 py-2 rounded-lg data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
              <Video className="w-4 h-4 mr-2" /> Training
            </TabsTrigger>
            <TabsTrigger value="requests" className="px-6 py-2 rounded-lg data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
              <AlertCircle className="w-4 h-4 mr-2" /> Requests
            </TabsTrigger>
            <TabsTrigger value="members" className="px-6 py-2 rounded-lg data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700">
              <Users className="w-4 h-4 mr-2" /> Members
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="settings" className="px-6 py-2 rounded-lg data-[state=active]:bg-gray-100 data-[state=active]:text-gray-900">
                <Settings className="w-4 h-4 mr-2" /> Settings
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="training" className="focus-visible:outline-none">
            <GroupTrainingTab group={activeGroup} currentUser={user} isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="requests" className="focus-visible:outline-none">
            <GroupRequestsTab group={activeGroup} currentUser={user} isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="members" className="focus-visible:outline-none">
            <GroupMembersTab group={activeGroup} currentUser={user} isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="settings" className="focus-visible:outline-none">
            <Card>
              <CardHeader>
                <CardTitle>Group Settings</CardTitle>
                <CardDescription>Manage your group details.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 text-sm">Settings coming soon. Use the 'Members' tab to manage invites.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}