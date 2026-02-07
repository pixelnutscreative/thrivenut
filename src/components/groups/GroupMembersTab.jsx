import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, UserPlus, Shield, Plus, Package, History, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function ViewRetainerHistoryDialog({ group, member }) {
  const { data: packages = [] } = useQuery({
    queryKey: ['memberRetainerPackages', group.id, member.user_email],
    queryFn: () => base44.entities.GroupMemberRetainerPackage.filter({ group_id: group.id, member_email: member.user_email }, '-purchase_date')
  });

  const totalHours = packages.reduce((sum, pkg) => sum + (pkg.hours_purchased || 0), 0);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 mt-0.5">
          <History className="w-3 h-3" /> History
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Retainer History: {member.user_email}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="bg-purple-50 p-4 rounded-lg mb-4 flex justify-between items-center">
            <span className="font-medium text-purple-900">Total Purchased</span>
            <span className="text-2xl font-bold text-purple-700">{totalHours} hrs</span>
          </div>
          
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {packages.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-4">No packages added yet.</p>
            ) : (
              packages.map(pkg => (
                <div key={pkg.id} className="border p-3 rounded-lg flex justify-between items-center text-sm">
                  <div>
                    <div className="font-medium">{pkg.package_name || 'Custom Package'}</div>
                    <div className="text-xs text-gray-500">{new Date(pkg.purchase_date).toLocaleDateString()}</div>
                  </div>
                  <Badge variant="secondary" className="bg-green-50 text-green-700">+{pkg.hours_purchased} hrs</Badge>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddRetainerPackageDialog({ group, member, currentUser }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', hours: '' });

  // Only show specific presets for Pixel Nuts admins
  const isPixelAdmin = ['pixelnutscreative@gmail.com', 'pixel@thrivenut.app'].includes(currentUser?.email);
  
  const presets = [
    { name: '5 Hour Package', hours: 5 },
    { name: '16 Hour Package', hours: 16 }
  ];

  const mutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.GroupMemberRetainerPackage.create({
        group_id: group.id,
        member_email: member.user_email,
        hours_purchased: parseFloat(data.hours),
        package_name: data.name,
        purchase_date: new Date().toISOString().split('T')[0],
        purchased_by: currentUser.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['memberRetainerPackages', group.id, member.user_email]);
      queryClient.invalidateQueries(['allGroupProjects', group.id]);
      setIsOpen(false);
      setFormData({ name: '', hours: '' });
    }
  });

  const applyPreset = (preset) => {
    setFormData({ name: preset.name, hours: preset.hours });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1 mt-0.5">
          <Plus className="w-3 h-3" /> Add Hours Package
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add Retainer Package for {member.user_email}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-600">Manually enter package details or select a preset.</p>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Package Name</Label>
              <Input 
                placeholder="e.g. Consulting Block" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <Label>Hours</Label>
              <Input 
                type="number" 
                placeholder="e.g. 10" 
                value={formData.hours} 
                onChange={(e) => setFormData({...formData, hours: e.target.value})}
              />
            </div>
          </div>

          {isPixelAdmin && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs font-semibold text-gray-500 mb-2">Your Presets</p>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => applyPreset(preset)}
                    className="text-left p-3 rounded-lg border hover:bg-purple-50 hover:border-purple-200 transition-colors text-sm"
                  >
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-gray-500">{preset.hours} hours</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => mutation.mutate(formData)} disabled={!formData.name || !formData.hours}>Add Package</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MemberRowItem({ member, group, isAdmin, currentUser, queryClient }) {
  const { data: profile } = useQuery({
     queryKey: ['memberProfile', member.user_email],
     queryFn: async () => {
        const email = member.user_email;
        // Parallel fetch for efficiency: Try UserPreferences first, and User entity if admin
        const [prefsList, usersList] = await Promise.all([
            base44.entities.UserPreferences.filter({ user_email: email }),
            isAdmin ? base44.entities.User.filter({ email: email }) : Promise.resolve([]) 
        ]);
        
        const prefs = prefsList[0] || {};
        const userRec = usersList[0] || {};
        
        return {
            nickname: prefs.nickname,
            full_name: userRec.full_name,
            profile_image_url: prefs.profile_image_url,
            email: email
        };
     },
     staleTime: 1000 * 60 * 5 // 5 minutes
  });
  
  // Prefer nickname, then full name, then cached name, then email
  const displayName = profile?.nickname || profile?.full_name || member.name || member.user_email;
  const avatarUrl = profile?.profile_image_url;
  const initial = (displayName || member.user_email)[0].toUpperCase();

  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover border border-purple-200" />
        ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-purple-700 font-bold text-sm border border-purple-200">
              {initial}
            </div>
        )}
        <div>
          <div className="font-medium text-gray-900 flex items-center gap-2">
            {displayName}
            {member.role === 'owner' && <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px] h-5 px-1.5">Owner</Badge>}
            {member.role === 'admin' && <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] h-5 px-1.5">Admin</Badge>}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
            <span>Joined {new Date(member.joined_date || member.created_date).toLocaleDateString()}</span>
            {member.level && member.level !== 'none' && (
                <>
                    <span>•</span>
                    <span className="font-medium text-indigo-600">{member.level}</span>
                </>
            )}
          </div>
          {isAdmin && group.enable_retainer_management && (
            <div className="flex gap-3 mt-1">
              <AddRetainerPackageDialog group={group} member={member} currentUser={currentUser} />
              <ViewRetainerHistoryDialog group={group} member={member} />
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
         {(isAdmin || group.owner_email === currentUser?.email) && (
            <EditMemberDialog 
                member={member} 
                group={group} 
                isAdmin={isAdmin} 
                currentUser={currentUser} 
                onUpdate={() => queryClient.invalidateQueries(['groupMembers', group.id])}
            />
         )}
      </div>
    </div>
  );
}

function EditMemberDialog({ member, group, isAdmin, currentUser, onUpdate }) {
  const [role, setRole] = useState(member.role || 'member');
  const [level, setLevel] = useState(member.level || 'Member');
  const [isOpen, setIsOpen] = useState(false);

  // Sync state when member changes or dialog opens
  React.useEffect(() => {
    setRole(member.role || 'member');
    setLevel(member.level || 'Member');
  }, [member, isOpen]);

  const updateRoleMutation = useMutation({
    mutationFn: async () => {
        // Parallel updates if both changed, but separate calls
        const promises = [];
        if (role !== member.role) promises.push(base44.entities.CreatorGroupMember.update(member.id, { role }));
        if (level !== member.level) promises.push(base44.entities.CreatorGroupMember.update(member.id, { level: level === 'none' ? null : level }));
        await Promise.all(promises);
    },
    onSuccess: () => {
      onUpdate();
      setIsOpen(false);
    }
  });

  const removeMutation = useMutation({
    mutationFn: () => base44.entities.CreatorGroupMember.delete(member.id),
    onSuccess: () => {
        onUpdate();
        setIsOpen(false);
    }
  });

  const canEdit = isAdmin && member.role !== 'owner';
  const isOwner = member.role === 'owner';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <Trash2 className="w-4 h-4 sr-only" /> {/* Hidden trigger, actual trigger is row click */}
            <span className="text-xs font-medium text-indigo-600 hover:underline">Manage</span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Member: {member.user_email}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="flex flex-col gap-1 bg-gray-50 p-3 rounded-lg text-sm">
                <div className="flex justify-between">
                    <span className="text-gray-500">Joined</span>
                    <span className="font-medium">{new Date(member.joined_date || member.created_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <Badge variant={member.status === 'active' ? 'default' : 'secondary'} className={member.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}>
                        {member.status}
                    </Badge>
                </div>
            </div>

            {canEdit ? (
                <>
                    <div className="space-y-2">
                        <Label>Role</Label>
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[60]">
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="client">Client</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="virtual-assistant">Virtual Assistant</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Level</Label>
                        <Select value={level} onValueChange={setLevel}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="z-[60]">
                                <SelectItem value="none">No Level</SelectItem>
                                <SelectItem value="Member">Member (Default)</SelectItem>
                                {group.member_levels?.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </>
            ) : (
                <p className="text-sm text-gray-500 italic">
                    {isOwner ? "This member is the Owner and cannot be edited." : "You do not have permission to edit this member."}
                </p>
            )}
        </div>
        <DialogFooter className="flex justify-between sm:justify-between">
            {canEdit ? (
                <Button variant="destructive" size="sm" onClick={() => { if(window.confirm('Remove this member?')) removeMutation.mutate(); }}>
                    Remove Member
                </Button>
            ) : <div />}
            
            {canEdit && (
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={() => updateRoleMutation.mutate()} disabled={updateRoleMutation.isPending}>Save Changes</Button>
                </div>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function GroupMembersTab({ group, currentUser, isAdmin }) {
  const queryClient = useQueryClient();

  const { data: members = [] } = useQuery({
    queryKey: ['groupMembers', group.id],
    queryFn: async () => {
      return await base44.entities.CreatorGroupMember.filter({ group_id: group.id });
    }
  });

  const approveMutation = useMutation({
    mutationFn: (id) => base44.entities.CreatorGroupMember.update(id, { status: 'active' }),
    onSuccess: () => queryClient.invalidateQueries(['groupMembers', group.id])
  });

  const removeMutation = useMutation({
    mutationFn: (id) => base44.entities.CreatorGroupMember.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['groupMembers', group.id])
  });

  const updateLevelMutation = useMutation({
    mutationFn: ({ id, level }) => base44.entities.CreatorGroupMember.update(id, { level }),
    onSuccess: () => queryClient.invalidateQueries(['groupMembers', group.id])
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => base44.entities.CreatorGroupMember.update(id, { role }),
    onSuccess: () => queryClient.invalidateQueries(['groupMembers', group.id])
  });

  const dedupedMembers = React.useMemo(() => {
    const map = {};
    members.forEach((m) => {
      const key = (m.user_email || '').toLowerCase();
      const prev = map[key];
      if (!prev) map[key] = m;
      else if (prev.status !== 'active' && m.status === 'active') map[key] = m;
      else if (prev.status === 'pending' && m.pending_approval) map[key] = m; // Prioritize explicit pending approval status
    });
    return Object.values(map);
  }, [members]);

  const myMembership = React.useMemo(() => dedupedMembers.find(m => (m.user_email || '').toLowerCase() === (currentUser?.email || '').toLowerCase()) || null, [dedupedMembers, currentUser]);
  const pendingMembers = dedupedMembers.filter(m => m.status === 'pending' || m.pending_approval);
  const activeMembers = dedupedMembers.filter(m => m.status !== 'pending' && !m.pending_approval);

  // Member list visibility check removed to allow members to see each other


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Group Members</h3>
          <p className="text-sm text-gray-500">Manage who has access to this group</p>
        </div>
      </div>

      {/* Pending Applications (Interested -> Member) */}
      {isAdmin && pendingMembers.length > 0 && (
        <div className="bg-amber-50 rounded-lg border border-amber-200 overflow-hidden mb-6">
          <div className="p-3 bg-amber-100 border-b border-amber-200 font-semibold text-amber-800 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Applications & Requests
          </div>
          <div className="divide-y divide-amber-200">
            {pendingMembers.map(member => (
              <div key={member.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="font-medium text-amber-900">{member.user_email}</div>
                  <div className="text-xs text-amber-700">
                    {member.pending_approval ? 'Application Submitted' : 'Requested to join'}
                    {member.referred_by_name && <span> • Ref: {member.referred_by_name}</span>}
                  </div>
                  {member.proof_of_payment_url && (
                    <a href={member.proof_of_payment_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline mt-1 block">
                      View Proof of Payment
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                        if (member.pending_approval) {
                            base44.functions.invoke('updateMemberStatus', { action: 'reject_member', group_id: group.id, user_email: member.user_email })
                                .then(() => queryClient.invalidateQueries(['groupMembers', group.id]));
                        } else {
                            removeMutation.mutate(member.id);
                        }
                    }} 
                    className="bg-white border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    Reject
                  </Button>
                  
                  {member.pending_approval ? (
                      <Dialog>
                          <DialogTrigger asChild>
                              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 border-transparent">Approve</Button>
                          </DialogTrigger>
                          <DialogContent>
                              <DialogHeader><DialogTitle>Approve Member</DialogTitle></DialogHeader>
                              <div className="space-y-4 py-4">
                                  <p className="text-sm">Assign a level to this user upon approval:</p>
                                  <Select onValueChange={(val) => {
                                       base44.functions.invoke('updateMemberStatus', { 
                                           action: 'approve_member', 
                                           group_id: group.id, 
                                           user_email: member.user_email,
                                           level_name: val
                                       }).then(() => {
                                           queryClient.invalidateQueries(['groupMembers', group.id]);
                                           // Close dialog? simpler to just reload
                                           window.location.reload(); 
                                       });
                                  }}>
                                      <SelectTrigger><SelectValue placeholder="Select Level" /></SelectTrigger>
                                      <SelectContent className="z-[60]">
                                          {group.member_levels?.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                          <SelectItem value="Member">Member (Default)</SelectItem>
                                      </SelectContent>
                                  </Select>
                              </div>
                          </DialogContent>
                      </Dialog>
                  ) : (
                      <Button size="sm" onClick={() => approveMutation.mutate(member.id)} className="bg-amber-600 hover:bg-amber-700 border-transparent">Approve</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {activeMembers.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-lg border">No active members found</div>
        ) : (
          activeMembers.map(member => (
            <MemberRowItem 
                key={member.id} 
                member={member} 
                group={group} 
                isAdmin={isAdmin} 
                currentUser={currentUser}
                queryClient={queryClient}
            />
          ))
        )}
      </div>
    </div>
  );
}