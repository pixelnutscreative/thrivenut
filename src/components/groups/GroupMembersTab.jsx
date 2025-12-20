import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Trash2, UserPlus, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function GroupMembersTab({ group, currentUser, isAdmin }) {
  const queryClient = useQueryClient();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

  // Copy link functionality
  const inviteLink = `${window.location.origin}/creator-groups?invite=${group.invite_code}`;
  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    alert('Invite link copied to clipboard!');
  };

  const { data: members = [] } = useQuery({
    queryKey: ['groupMembers', group.id],
    queryFn: async () => {
      return await base44.entities.CreatorGroupMember.filter({ group_id: group.id });
    }
  });

  const inviteMutation = useMutation({
    mutationFn: (data) => base44.entities.CreatorGroupMember.create({
      group_id: group.id,
      user_email: data.email,
      role: data.role,
      status: 'pending', // Invite via email -> pending until they accept/login? Or just active if manual add. Let's say manual add is active.
      joined_date: new Date().toISOString()
    }),
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

  const pendingMembers = members.filter(m => m.status === 'pending');
  const activeMembers = members.filter(m => m.status !== 'pending');

  if (!isAdmin && myMembership?.role !== 'owner') {
    return (
      <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold">Members</h3>
        <p>Member list is only visible to admins.</p>
        <p className="mt-2 text-sm">{activeMembers.length} Active Members</p>
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
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
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

      {pendingMembers.length > 0 && isAdmin && (
        <div className="bg-amber-50 rounded-lg border border-amber-200 overflow-hidden mb-6">
          <div className="p-3 bg-amber-100 border-b border-amber-200 font-semibold text-amber-800 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Pending Approval ({pendingMembers.length})
          </div>
          <div className="divide-y divide-amber-200">
            {pendingMembers.map(member => (
              <div key={member.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-amber-900">{member.user_email}</div>
                  <div className="text-xs text-amber-700">Requested to join</div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => removeMutation.mutate(member.id)} className="bg-white border-amber-300 text-amber-700 hover:bg-amber-50">Reject</Button>
                  <Button size="sm" onClick={() => approveMutation.mutate(member.id)} className="bg-amber-600 hover:bg-amber-700 border-transparent">Approve</Button>
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
                </div>
              </div>
              <div className="col-span-2">
                <Badge variant="outline" className="capitalize">{member.role}</Badge>
              </div>
              <div className="col-span-3">
                {isAdmin && group.member_levels?.length > 0 ? (
                  <Select 
                    value={member.level || 'none'} 
                    onValueChange={v => updateLevelMutation.mutate({ id: member.id, level: v === 'none' ? null : v })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Assign Level" />
                    </SelectTrigger>
                    <SelectContent>
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
                  {member.status}
                </span>
              </div>
              <div className="col-span-1 text-right">
                {isAdmin && member.role !== 'owner' && (
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500 h-8 w-8" onClick={() => removeMutation.mutate(member.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}