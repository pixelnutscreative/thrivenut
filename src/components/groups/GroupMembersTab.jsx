
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, UserPlus, Shield, Plus, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function AddRetainerPackageDialog({ group, member, currentUser }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const packages = [
    { name: '$444 Package', hours: 5, sessions: 7 },
    { name: '$999 Package', hours: 16, sessions: 22 }
  ];

  const mutation = useMutation({
    mutationFn: async (packageData) => {
      return base44.entities.GroupMemberRetainerPackage.create({
        group_id: group.id,
        member_email: member.user_email,
        hours_purchased: packageData.hours,
        package_name: packageData.name,
        purchase_date: new Date().toISOString().split('T')[0],
        purchased_by: currentUser.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['memberRetainerPackages', group.id, member.user_email]);
      // Also invalidate overall project queries since they depend on this
      queryClient.invalidateQueries(['allGroupProjects', group.id]);
      setIsOpen(false);
      setSelectedPackage(null);
    }
  });

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
          <p className="text-sm text-gray-600">Select a package to add hours to this member's retainer.</p>
          <div className="grid grid-cols-2 gap-4">
            {packages.map((pkg, index) => (
              <Card 
                key={index} 
                className={`cursor-pointer ${selectedPackage?.name === pkg.name ? 'border-purple-500 ring-2 ring-purple-500' : ''}`}
                onClick={() => setSelectedPackage(pkg)}
              >
                <CardContent className="p-4">
                  <h5 className="font-bold text-lg">{pkg.name}</h5>
                  <p className="text-sm text-gray-500">{pkg.hours} hours ({pkg.sessions} sessions)</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => mutation.mutate(selectedPackage)} disabled={!selectedPackage}>Add Package</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function GroupMembersTab({ group, currentUser, isAdmin }) {
  const queryClient = useQueryClient();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

  // Fetch Referral Code
  const { data: referralLink } = useQuery({
    queryKey: ['myReferralLink', currentUser?.email],
    queryFn: async () => {
      const links = await base44.entities.ReferralLink.filter({ user_email: currentUser?.email, is_active: true });
      return links[0];
    },
    enabled: !!currentUser?.email
  });

  // Copy link functionality
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''; // Safely access window
  const referralParam = referralLink ? `&ref=${referralLink.code}` : '';
  // Ensure we use the correct page URL (capitalized as per file name)
  const inviteLink = `${baseUrl}/CreatorGroups?invite=${group.invite_code}${referralParam}`;
  
  const copyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(inviteLink);
      alert('Invite link copied to clipboard! (Referral tracking included)');
    } else {
      // Fallback for environments without navigator.clipboard
      const textArea = document.createElement("textarea");
      textArea.value = inviteLink;
      textArea.style.position = "fixed"; // Avoid scrolling to bottom
      textArea.style.left = "-9999px"; // Move off-screen
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        alert('Invite link copied to clipboard! (Referral tracking included)');
      } catch (err) {
        console.error('Failed to copy', err);
        alert('Failed to copy invite link. Please copy it manually.');
      }
      document.body.removeChild(textArea);
    }
  };

  const { data: members = [] } = useQuery({
    queryKey: ['groupMembers', group.id],
    queryFn: async () => {
      return await base44.entities.CreatorGroupMember.filter({ group_id: group.id });
    }
  });

  const inviteMutation = useMutation({
    mutationFn: async (data) => {
      const email = (data.email || '').trim().toLowerCase();
      if (!email) throw new Error('Email required');
      const existing = await base44.entities.CreatorGroupMember.filter({ group_id: group.id, user_email: email });
      if (existing.length > 0) {
        // Upsert: promote to active and update role
        return base44.entities.CreatorGroupMember.update(existing[0].id, {
          role: data.role,
          status: 'active',
          joined_date: existing[0].joined_date || new Date().toISOString()
        });
      }
      return base44.entities.CreatorGroupMember.create({
        group_id: group.id,
        user_email: email,
        role: data.role,
        status: 'active',
        joined_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['groupMembers', group.id]);
      setIsInviteOpen(false);
      setInviteEmail('');
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

  if (!isAdmin && myMembership?.role !== 'owner') {
    return (
      <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold">Members</h3>
        <p>Member list is only visible to admins.</p>
        <p className="mt-2 text-sm">{activeMembers.length} Active Members</p>
        <p className="text-xs text-gray-300 mt-4">Debug: {members.length} raw records</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-purple-50 p-4 rounded-xl border border-purple-100">
        <div>
          <h4 className="font-semibold text-purple-900">Invite Members</h4>
          <p className="text-sm text-purple-700">Share this link to let people join automatically (as pending).</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Input value={inviteLink} readOnly className="bg-white text-xs font-mono" />
          <Button onClick={copyLink} variant="outline" className="whitespace-nowrap">Copy Link</Button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Group Members</h3>
          <p className="text-sm text-gray-500">Manage who has access to this group</p>
        </div>
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" /> Manually Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manually Add Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="user@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="z-[60]">
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="virtual-assistant">Virtual Assistant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => inviteMutation.mutate({ email: inviteEmail, role: inviteRole })} disabled={!inviteEmail}>Add Active Member</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="grid grid-cols-12 gap-4 p-4 border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
          <div className="col-span-4">Member</div>
          <div className="col-span-2">Role</div>
          <div className="col-span-3">Level</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right"></div>
        </div>
        {activeMembers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No active members found</div>
        ) : (
          activeMembers.map(member => (
            <div key={member.id} className="grid grid-cols-12 gap-4 p-4 border-b last:border-0 items-center text-sm">
              <div className="col-span-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs">
                  {member.user_email[0].toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="font-medium truncate">{member.user_email}</p>
                  {isAdmin && (
                    <AddRetainerPackageDialog group={group} member={member} currentUser={currentUser} />
                  )}
                </div>
              </div>
              <div className="col-span-2">
                {member.role === 'owner' ? (
                   <Badge className="bg-purple-100 text-purple-800 border-purple-200">Owner</Badge>
                ) : isAdmin && group.owner_email === currentUser?.email ? (
                  <Select 
                    value={member.role || 'member'} 
                    onValueChange={v => updateRoleMutation.mutate({ id: member.id, role: v })}
                  >
                    <SelectTrigger className="h-8 text-xs capitalize">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent className="z-[60]">
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="virtual-assistant">Virtual Assistant</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className="capitalize">{member.role}</Badge>
                )}
              </div>
              <div className="col-span-3">
                {member.role === 'owner' ? (
                   <Badge className="bg-purple-100 text-purple-800 border-purple-200">Owner</Badge>
                ) : isAdmin && group.member_levels?.length > 0 ? (
                  <Select 
                    value={member.level || 'none'} 
                    onValueChange={v => updateLevelMutation.mutate({ id: member.id, level: v === 'none' ? null : v })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Assign Level" />
                    </SelectTrigger>
                    <SelectContent className="z-[60]">
                      <SelectItem value="none">No Level</SelectItem>
                      {group.member_levels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  member.level && <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">{member.level}</Badge>
                )}
              </div>
              <div className="col-span-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {member.status === 'invited' ? 'pending' : member.status}
                </span>
              </div>
              <div className="col-span-1 text-right">
                {isAdmin && member.role !== 'owner' && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500 h-8 w-8">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Remove member?</DialogTitle>
                      </DialogHeader>
                      <div className="py-2 text-sm">Are you sure you want to remove {member.user_email} from this group?</div>
                      <DialogFooter>
                        <Button variant="outline">Cancel</Button>
                        <Button variant="destructive" onClick={() => removeMutation.mutate(member.id)}>Remove</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
