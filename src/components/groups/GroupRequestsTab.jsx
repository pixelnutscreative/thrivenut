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
import { AlertCircle, MessageSquare, Check, X, Send, Eye } from 'lucide-react';
import { format } from 'date-fns';
import VisibilityControl from './VisibilityControl';

export default function GroupRequestsTab({ group, currentUser, isAdmin, myMembership }) {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null); // For detail view
  const [newRequest, setNewRequest] = useState({ title: '', description: '', type: 'help_needed' });
  const [messageInput, setMessageInput] = useState('');

  const { data: requests = [] } = useQuery({
    queryKey: ['groupRequests', group.id],
    queryFn: async () => {
      const allRequests = await base44.entities.GroupRequest.filter({ group_id: group.id }, '-created_date');
      return allRequests;
    }
  });

  const addMutation = useMutation({
    mutationFn: (data) => base44.entities.GroupRequest.create({ 
      ...data, 
      group_id: group.id, 
      user_email: currentUser.email,
      status: 'open',
      messages: [],
      visible_to_levels: [],
      visible_to_emails: []
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['groupRequests', group.id]);
      setIsAddOpen(false);
      setNewRequest({ title: '', description: '', type: 'help_needed' });
      // Notify Admin? (Optional, skipping for now to keep simple)
    }
  });

  const updateRequestMutation = useMutation({
    mutationFn: (data) => base44.entities.GroupRequest.update(data.id, data),
    onSuccess: () => queryClient.invalidateQueries(['groupRequests', group.id])
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ id, content, currentMessages }) => {
      const newMessage = {
        sender_email: currentUser.email,
        content,
        timestamp: new Date().toISOString()
      };
      const updatedMessages = [...(currentMessages || []), newMessage];
      await base44.entities.GroupRequest.update(id, { messages: updatedMessages });
      
      // Notify
      const request = requests.find(r => r.id === id);
      const recipient = request.user_email === currentUser.email ? 'admin' : request.user_email; 
      // If admin replying, notify user. If user replying, notify admin (owner).
      
      if (recipient !== 'admin') {
         await base44.entities.Notification.create({
            user_email: recipient,
            title: `Update on Request: ${request.title}`,
            message: `New message from ${currentUser.email}`,
            type: 'request_update',
            link: `/creator-groups?id=${group.id}&tab=requests`,
            is_read: false,
            created_at: new Date().toISOString()
         });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['groupRequests', group.id]);
      setMessageInput('');
    }
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

  const isVisible = (req) => {
    if (isAdmin) return true;
    if (req.user_email === currentUser.email) return true;
    
    // Check custom visibility
    const hasLevels = req.visible_to_levels && req.visible_to_levels.length > 0;
    const hasEmails = req.visible_to_emails && req.visible_to_emails.length > 0;
    
    if (hasLevels && req.visible_to_levels.includes(myMembership?.level)) return true;
    if (hasEmails && req.visible_to_emails.includes(currentUser.email)) return true;
    
    return false;
  };

  const filteredRequests = requests.filter(isVisible);

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
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
            No requests found.
          </div>
        ) : (
          filteredRequests.map(request => (
            <Card key={request.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveRequest(request)}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-2 items-center">
                    <Badge variant="outline" className="font-normal">{getTypeLabel(request.type)}</Badge>
                    <Badge className={getStatusColor(request.status)} variant="secondary">
                      {request.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    {request.messages?.length > 0 && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                        <MessageSquare className="w-3 h-3 mr-1" /> {request.messages.length}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {request.created_date ? format(new Date(request.created_date), 'MMM d') : 'Just now'}
                  </span>
                </div>
                
                <h4 className="font-semibold text-gray-900">{request.title}</h4>
                <div className="flex justify-between items-end mt-2">
                   <p className="text-sm text-gray-600 line-clamp-2 flex-1 mr-4">{request.description}</p>
                   <div className="text-xs text-gray-400">{request.user_email}</div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Detail Modal */}
      {activeRequest && (
        <Dialog open={!!activeRequest} onOpenChange={(open) => !open && setActiveRequest(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
            <div className="p-6 border-b">
              <div className="flex justify-between items-start mb-2">
                <DialogTitle className="text-xl">{activeRequest.title}</DialogTitle>
                <Badge className={getStatusColor(activeRequest.status)}>{activeRequest.status.replace('_', ' ').toUpperCase()}</Badge>
              </div>
              <div className="text-sm text-gray-500 flex gap-4">
                <span>Type: {getTypeLabel(activeRequest.type)}</span>
                <span>Submitted by: {activeRequest.user_email}</span>
                <span>Date: {activeRequest.created_date ? format(new Date(activeRequest.created_date), 'PPP p') : ''}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h5 className="text-sm font-bold text-gray-700 mb-2">Description</h5>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{activeRequest.description}</p>
              </div>

              {/* Messages Area */}
              <div className="space-y-4">
                <h5 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Discussion
                </h5>
                {(activeRequest.messages || []).map((msg, idx) => (
                  <div key={idx} className={`flex flex-col ${msg.sender_email === currentUser.email ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 text-sm ${
                      msg.sender_email === currentUser.email 
                        ? 'bg-purple-100 text-purple-900 rounded-tr-none' 
                        : 'bg-white border border-gray-200 rounded-tl-none'
                    }`}>
                      <p>{msg.content}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1">
                      {msg.sender_email === currentUser.email ? 'You' : msg.sender_email} • {format(new Date(msg.timestamp), 'p')}
                    </span>
                  </div>
                ))}
                {(activeRequest.messages || []).length === 0 && (
                  <p className="text-sm text-gray-400 italic text-center py-4">No messages yet.</p>
                )}
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex flex-col gap-4">
              <div className="flex gap-2">
                <Input 
                  placeholder="Type a message..." 
                  value={messageInput}
                  onChange={e => setMessageInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && messageInput && sendMessageMutation.mutate({ 
                    id: activeRequest.id, 
                    content: messageInput, 
                    currentMessages: activeRequest.messages 
                  })}
                />
                <Button 
                  size="icon" 
                  onClick={() => sendMessageMutation.mutate({ 
                    id: activeRequest.id, 
                    content: messageInput, 
                    currentMessages: activeRequest.messages 
                  })}
                  disabled={!messageInput}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {isAdmin && (
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 mt-2">
                  <div className="flex-1 mr-4">
                     {/* Admin Visibility Control inside modal */}
                     <VisibilityControl 
                       group={group}
                       className="border-0 p-0 bg-transparent"
                       selectedLevels={activeRequest.visible_to_levels || []}
                       selectedEmails={activeRequest.visible_to_emails || []}
                       onLevelsChange={(l) => updateRequestMutation.mutate({ id: activeRequest.id, visible_to_levels: l })}
                       onEmailsChange={(e) => updateRequestMutation.mutate({ id: activeRequest.id, visible_to_emails: e })}
                     />
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Select 
                      value={activeRequest.status} 
                      onValueChange={(v) => updateRequestMutation.mutate({ id: activeRequest.id, status: v })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}