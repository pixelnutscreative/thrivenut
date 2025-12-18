import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'; // Assuming you might have these or use divs
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Optional
import { Badge } from '@/components/ui/badge';
import { Trash2, UserPlus, Mail } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function GroupMembersTab({ group, currentUser, isAdmin }) {
  const queryClient = useQueryClient();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');

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
      status: 'invited', // Or active directly if we trust email
      joined_date: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['groupMembers', group.id]);
      setIsInviteOpen(false);
      setInviteEmail('');
    }
  });

  const removeMutation = useMutation({
    mutationFn: (id) => base44.entities.CreatorGroupMember.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['groupMembers', group.id])
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Group Members</h3>
          <p className="text-sm text-gray-500">Manage who has access to this group</p>
        </div>
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" /> Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="user@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="creator">Creator</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => inviteMutation.mutate({ email: inviteEmail, role: inviteRole })} disabled={!inviteEmail}>Send Invite</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="grid grid-cols-12 gap-4 p-4 border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
          <div className="col-span-5">Member</div>
          <div className="col-span-3">Role</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>
        {members.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No members found</div>
        ) : (
          members.map(member => (
            <div key={member.id} className="grid grid-cols-12 gap-4 p-4 border-b last:border-0 items-center text-sm">
              <div className="col-span-5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs">
                  {member.user_email[0].toUpperCase()}
                </div>
                <div className="overflow-hidden">
                  <p className="font-medium truncate">{member.user_email}</p>
                </div>
              </div>
              <div className="col-span-3">
                <Badge variant="outline" className="capitalize">{member.role}</Badge>
              </div>
              <div className="col-span-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {member.status}
                </span>
              </div>
              <div className="col-span-2 text-right">
                {member.role !== 'owner' && (
                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500" onClick={() => removeMutation.mutate(member.id)}>
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