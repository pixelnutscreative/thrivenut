import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, Plus, CheckCircle, Clock, XCircle, Send, Bell, Settings, Pencil } from 'lucide-react';
import LevelSelector from './LevelSelector';
import MemberSelector from './MemberSelector';

export default function GroupRequestsTab({ group, currentUser, myMembership, isAdmin }) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null); // For chat/details
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ 
    title: '', description: '', type: 'support', target_levels: [], target_users: [] 
  });
  const [messageInput, setMessageInput] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [requestSettings, setRequestSettings] = useState(group.settings?.request_permissions || { 
    enabled: true, allowed_levels: [], allowed_users: [] 
  });

  // 1. Fetch Requests
  const { data: requests = [] } = useQuery({
    queryKey: ['groupRequests', group.id],
    queryFn: () => base44.entities.GroupRequest.filter({ group_id: group.id }),
  });

  // 2. Fetch Messages for active request
  const { data: messages = [] } = useQuery({
    queryKey: ['requestMessages', activeRequest?.id],
    queryFn: () => activeRequest ? base44.entities.GroupRequestMessage.filter({ request_id: activeRequest.id }, 'created_date') : [],
    enabled: !!activeRequest,
    refetchInterval: 5000 // Poll for new messages
  });

  // Mutations
  const saveRequestMutation = useMutation({
    mutationFn: async (data) => {
        if (editingId) {
            return base44.entities.GroupRequest.update(editingId, {
                ...data,
                edited_by: currentUser?.email,
                edited_at: new Date().toISOString()
            });
        } else {
            const newRequest = await base44.entities.GroupRequest.create({
                ...data,
                group_id: group.id,
                user_email: currentUser?.email,
                status: 'pending'
            });
            // Notify admins
            await base44.functions.invoke('notifyGroupMembers', {
                group_id: group.id,
                title: `New Request: ${newRequest.title}`,
                message: `${currentUser?.email} submitted a new request.`,
                type: 'support_request',
                link: `/CreatorGroups?id=${group.id}&tab=requests`
            });
            return newRequest;
        }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['groupRequests', group.id]);
      setIsDialogOpen(false);
      setEditingId(null);
      setFormData({ title: '', description: '', type: 'support', target_levels: [], target_users: [] });
    }
  });

  const handleEdit = (req) => {
      setEditingId(req.id);
      setFormData({
          title: req.title,
          description: req.description,
          type: req.type,
          target_levels: req.target_levels || [],
          target_users: req.target_users || []
      });
      setIsDialogOpen(true);
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.GroupRequest.update(id, { status }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries(['groupRequests', group.id]);
      // Notify user if admin updated it
      if (isAdmin && updated.user_email !== currentUser?.email) {
          base44.functions.invoke('notifyGroupMembers', {
            group_id: group.id,
            title: `Request Updated: ${updated.title}`,
            message: `Status changed to ${updated.status}`,
            type: 'support_update',
            link: `/CreatorGroups?id=${group.id}&tab=requests`
          });
      }
    }
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!messageInput.trim()) return;
      await base44.entities.GroupRequestMessage.create({
        request_id: activeRequest.id,
        user_email: currentUser?.email,
        content: messageInput,
        is_admin_reply: isAdmin
      });
      
      // Update request updated_date implicitly or explicitly to bump it?
      // Notify
      const targetEmail = isAdmin ? activeRequest.user_email : null; // If admin replies, notify user. If user replies, admins check dashboard.
      if (isAdmin && targetEmail) {
         // Notify specific user logic would go here if we had direct email notification or single-user notification function
         // For now using the group notify but we really need single user. 
         // Let's assume notifyGroupMembers can take a target_email param or we just rely on polling for now as per "Bell icon alerts" prompt requirement which implies in-app.
         // We will trigger a notification record.
         await base44.entities.Notification.create({
             user_email: targetEmail,
             title: `New Reply on Request: ${activeRequest.title}`,
             message: messageInput.substring(0, 50) + '...',
             type: 'support_reply',
             link: `/CreatorGroups?id=${group.id}&tab=requests`,
             is_read: false
         });
      }
    },
    onSuccess: () => {
      setMessageInput('');
      queryClient.invalidateQueries(['requestMessages', activeRequest.id]);
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings) => {
        const updatedGroupSettings = { ...group.settings, request_permissions: newSettings };
        return base44.entities.CreatorGroup.update(group.id, { settings: updatedGroupSettings });
    },
    onSuccess: () => {
        queryClient.invalidateQueries(['creatorGroups']); // Refresh group to get new settings
        setIsSettingsOpen(false);
    }
  });

  // Permission Check
  const canCreate = isAdmin || (
      requestSettings.enabled && (
          (!requestSettings.allowed_levels?.length && !requestSettings.allowed_users?.length) ||
          requestSettings.allowed_levels?.includes(myMembership?.level) ||
          requestSettings.allowed_users?.includes(currentUser?.email)
      )
  );

  // Filtering
  const visibleRequests = requests.filter(req => {
    if (isAdmin) return true; 
    if (req.user_email === currentUser?.email) return true;
    
    const levelMatch = req.target_levels?.includes(myMembership?.level);
    const userMatch = req.target_users?.includes(currentUser?.email);
    
    return levelMatch || userMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold">Support & Requests</h3>
            {isAdmin && (
                <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon"><Settings className="w-5 h-5" /></Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Request Settings</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="flex items-center justify-between">
                                <span className="font-medium">Enable Requests</span>
                                <input 
                                    type="checkbox" 
                                    checked={requestSettings.enabled} 
                                    onChange={e => setRequestSettings({...requestSettings, enabled: e.target.checked})} 
                                    className="h-5 w-5"
                                />
                            </div>
                            
                            {requestSettings.enabled && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Allowed Levels (Empty = All)</label>
                                        <LevelSelector 
                                            group={group} 
                                            selectedLevels={requestSettings.allowed_levels || []} 
                                            onChange={levels => setRequestSettings({...requestSettings, allowed_levels: levels})} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Allowed Members (Empty = All)</label>
                                        <MemberSelector 
                                            group={group} 
                                            selectedUsers={requestSettings.allowed_users || []} 
                                            onChange={users => setRequestSettings({...requestSettings, allowed_users: users})} 
                                        />
                                    </div>
                                </>
                            )}
                            <Button onClick={() => updateSettingsMutation.mutate(requestSettings)} className="w-full">Save Settings</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>

        {canCreate && (
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) {
                    setEditingId(null);
                    setFormData({ title: '', description: '', type: 'support', target_levels: [], target_users: [] });
                }
            }}>
            <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" /> New Request</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Request' : 'Submit Request'}</DialogTitle>
                </DialogHeader>
            <div className="space-y-4 py-4">
              <Input 
                placeholder="Title" 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
              />
              <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="z-[60]">
                  <SelectItem value="support">Support</SelectItem>
                  <SelectItem value="feature">Feature Request</SelectItem>
                  <SelectItem value="access">Access Request</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Textarea 
                placeholder="Description..." 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
              />
              
              {isAdmin && (
                <div className="space-y-4 border-t pt-4">
                  <h4 className="text-sm font-semibold">Visibility (Who else can see this?)</h4>
                  <LevelSelector 
                    group={group} 
                    selectedLevels={formData.target_levels} 
                    onChange={(levels) => setFormData({...formData, target_levels: levels})} 
                  />
                  <MemberSelector
                    group={group}
                    selectedUsers={formData.target_users}
                    onChange={(users) => setFormData({...formData, target_users: users})}
                  />
                </div>
              )}

              <Button onClick={() => saveRequestMutation.mutate(formData)} disabled={!formData.title} className="w-full">
                {editingId ? 'Save Changes' : 'Submit'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visibleRequests.map(req => (
          <Card key={req.id} className="flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <Badge variant={req.status === 'resolved' ? 'default' : req.status === 'closed' ? 'secondary' : 'outline'}>
                  {req.status}
                </Badge>
                <span className="text-xs text-gray-500">{new Date(req.created_date).toLocaleDateString()}</span>
              </div>
              <CardTitle className="text-lg mt-2">{req.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-gray-600 line-clamp-3">{req.description}</p>
              <div className="mt-2 flex flex-col gap-1">
                 <div className="flex gap-2">
                    <Badge variant="outline" className="text-[10px]">{req.type}</Badge>
                    {req.user_email === currentUser?.email && <Badge variant="outline" className="text-[10px] bg-blue-50 text-blue-600">My Request</Badge>}
                 </div>
                 {req.edited_by && (
                    <span className="text-[10px] text-purple-400 italic">
                        Edited by {req.edited_by === currentUser?.email ? 'you' : req.edited_by} on {new Date(req.edited_at).toLocaleDateString()}
                    </span>
                 )}
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 flex flex-wrap gap-2 justify-between">
              <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setActiveRequest(req)}>
                    <MessageSquare className="w-4 h-4 mr-2" /> 
                    {isAdmin ? 'Manage' : 'View'}
                  </Button>
                  {isAdmin && (
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(req)}>
                          <Pencil className="w-4 h-4" />
                      </Button>
                  )}
              </div>
              {isAdmin && req.status !== 'resolved' && (
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'resolved' })}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <CheckCircle className="w-4 h-4 mr-2" /> Resolve
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Detail/Chat Modal */}
      <Dialog open={!!activeRequest} onOpenChange={(open) => !open && setActiveRequest(null)}>
        <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center pr-8">
                <span>{activeRequest?.title}</span>
                <Badge>{activeRequest?.status}</Badge>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2">
            <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{activeRequest?.user_email}</span>
                    <span>{activeRequest && new Date(activeRequest.created_date).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{activeRequest?.description}</p>
            </div>

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs">Conversation</span>
                <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.user_email === currentUser?.email ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                        msg.user_email === currentUser?.email 
                        ? 'bg-blue-600 text-white' 
                        : msg.is_admin_reply 
                            ? 'bg-purple-100 text-purple-900 border border-purple-200' 
                            : 'bg-gray-100 text-gray-800'
                    }`}>
                        <div className="flex justify-between items-center gap-4 mb-1">
                            <span className="text-[10px] opacity-70 font-semibold">
                                {msg.user_email === currentUser?.email ? 'You' : msg.user_email}
                                {msg.is_admin_reply && ' (Admin)'}
                            </span>
                            <span className="text-[10px] opacity-50">{new Date(msg.created_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    </div>
                </div>
            ))}
          </div>

          <div className="border-t pt-4 mt-auto space-y-4">
             <div className="flex gap-2">
                <Textarea 
                    placeholder="Type a reply..." 
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    className="min-h-[60px]"
                />
                <Button 
                    className="h-auto self-end" 
                    onClick={() => sendMessageMutation.mutate()}
                    disabled={sendMessageMutation.isPending || !messageInput.trim()}
                >
                    <Send className="w-4 h-4" />
                </Button>
             </div>
             
             {isAdmin && (
                 <div className="flex justify-between items-center bg-gray-50 p-2 rounded">
                    <span className="text-xs font-medium text-gray-500">Admin Controls:</span>
                    <div className="flex gap-2">
                        <Select 
                            value={activeRequest?.status} 
                            onValueChange={(v) => {
                                updateStatusMutation.mutate({ id: activeRequest.id, status: v });
                                setActiveRequest({...activeRequest, status: v});
                            }}
                        >
                            <SelectTrigger className="w-[140px] h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                        
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <Bell className="w-4 h-4 text-gray-500" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm">Access Control</h4>
                                    <LevelSelector 
                                        group={group} 
                                        selectedLevels={activeRequest?.target_levels || []} 
                                        onChange={(levels) => {
                                            // Need update mutation for this, assuming generic update works
                                            base44.entities.GroupRequest.update(activeRequest.id, { target_levels: levels });
                                            setActiveRequest({...activeRequest, target_levels: levels});
                                            queryClient.invalidateQueries(['groupRequests']);
                                        }} 
                                    />
                                    <MemberSelector
                                        group={group}
                                        selectedUsers={activeRequest?.target_users || []}
                                        onChange={(users) => {
                                            base44.entities.GroupRequest.update(activeRequest.id, { target_users: users });
                                            setActiveRequest({...activeRequest, target_users: users});
                                            queryClient.invalidateQueries(['groupRequests']);
                                        }}
                                    />
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                 </div>
             )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}