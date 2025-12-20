import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, MessageSquare, Check, X } from 'lucide-react';
import { format } from 'date-fns';

export default function GroupRequestsTab({ group, currentUser, isAdmin }) {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({ title: '', description: '', type: 'help_needed' });

  const { data: requests = [] } = useQuery({
    queryKey: ['groupRequests', group.id],
    queryFn: async () => {
      // If admin, show all. If member, show own.
      // Base44 filter is simple. Admin needs to see all.
      // For now we fetch all and filter in frontend if needed, or rely on API.
      // Assuming 'open' permissions for group members to see requests? Or private?
      // Usually support tickets are private between user and admin.
      const allRequests = await base44.entities.GroupRequest.filter({ group_id: group.id }, '-created_date');
      if (isAdmin) return allRequests;
      return allRequests.filter(r => r.user_email === currentUser.email);
    }
  });

  const addMutation = useMutation({
    mutationFn: (data) => base44.entities.GroupRequest.create({ 
      ...data, 
      group_id: group.id, 
      user_email: currentUser.email,
      status: 'open'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['groupRequests', group.id]);
      setIsAddOpen(false);
      setNewRequest({ title: '', description: '', type: 'help_needed' });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, resolution_notes }) => 
      base44.entities.GroupRequest.update(id, { status, resolution_notes }),
    onSuccess: () => queryClient.invalidateQueries(['groupRequests', group.id])
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'violation_appeal': return 'Violation Appeal';
      case 'feature_request': return 'Feature Request';
      case 'help_needed': return 'Help Needed';
      default: return 'Other';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Support & Requests</h3>
          <p className="text-sm text-gray-500">Submit tickets for help, appeals, or suggestions</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button>New Request</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit New Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newRequest.type} onValueChange={v => setNewRequest({...newRequest, type: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="help_needed">Help Needed</SelectItem>
                    <SelectItem value="violation_appeal">Violation Appeal</SelectItem>
                    <SelectItem value="feature_request">Feature Request</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={newRequest.title} onChange={e => setNewRequest({...newRequest, title: e.target.value})} placeholder="Brief summary of issue" />
              </div>
              <div className="space-y-2">
                <Label>Details</Label>
                <Textarea 
                  value={newRequest.description} 
                  onChange={e => setNewRequest({...newRequest, description: e.target.value})} 
                  placeholder="Provide as much detail as possible..." 
                  className="h-32"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => addMutation.mutate(newRequest)} disabled={!newRequest.title}>Submit Request</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
            No requests found.
          </div>
        ) : (
          requests.map(request => (
            <Card key={request.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2 items-center">
                    <Badge variant="outline" className="font-normal">{getTypeLabel(request.type)}</Badge>
                    <Badge className={getStatusColor(request.status)} variant="secondary">
                      {request.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-400">
                    {request.created_date ? format(new Date(request.created_date), 'MMM d, yyyy') : 'Just now'}
                  </span>
                </div>
                
                <h4 className="font-semibold text-gray-900">{request.title}</h4>
                <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{request.description}</p>
                
                {isAdmin && (
                  <div className="mt-4 pt-4 border-t flex items-center justify-between bg-gray-50 -mx-4 -mb-4 p-4">
                    <div className="text-xs text-gray-500">
                      Submitted by: <span className="font-medium text-gray-700">{request.user_email}</span>
                    </div>
                    <div className="flex gap-2">
                      {request.status === 'open' && (
                        <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: request.id, status: 'in_progress' })}>
                          Mark In Progress
                        </Button>
                      )}
                      {request.status !== 'resolved' && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => updateStatusMutation.mutate({ id: request.id, status: 'resolved' })}>
                          Resolve
                        </Button>
                      )}
                      {request.status !== 'closed' && (
                        <Button size="sm" variant="ghost" onClick={() => updateStatusMutation.mutate({ id: request.id, status: 'closed' })}>
                          Close
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                
                {request.resolution_notes && (
                  <div className="mt-4 bg-green-50 p-3 rounded-md border border-green-100">
                    <p className="text-xs font-bold text-green-800 mb-1">Resolution Note:</p>
                    <p className="text-sm text-green-700">{request.resolution_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}