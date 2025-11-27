import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Clock, Loader2, ExternalLink, UserPlus, Users, Search, ToggleLeft, ToggleRight, Star } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

export default function AdminSuperFanContent() {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserTikTok, setNewUserTikTok] = useState('');

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['allSuperFanRequests'],
    queryFn: () => base44.entities.SuperFanRequest.list('-created_date'),
  });

  const { data: allPreferences = [] } = useQuery({
    queryKey: ['allUserPreferences'],
    queryFn: () => base44.entities.UserPreferences.list(),
  });

  const { data: preApprovedList = [] } = useQuery({
    queryKey: ['preApprovedSuperFans'],
    queryFn: () => base44.entities.PreApprovedSuperFan.list('tiktok_username'),
  });

  const approveMutation = useMutation({
    mutationFn: async ({ requestId, userEmail }) => {
      await base44.entities.SuperFanRequest.update(requestId, {
        status: 'approved',
        admin_notes: adminNotes,
        reviewed_date: new Date().toISOString()
      });
      const userPrefs = allPreferences.find(p => p.user_email === userEmail);
      if (userPrefs) {
        await base44.entities.UserPreferences.update(userPrefs.id, { tiktok_access_approved: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allSuperFanRequests'] });
      queryClient.invalidateQueries({ queryKey: ['allUserPreferences'] });
      setSelectedRequest(null);
      setAdminNotes('');
    },
  });

  const denyMutation = useMutation({
    mutationFn: async ({ requestId }) => {
      await base44.entities.SuperFanRequest.update(requestId, {
        status: 'denied',
        admin_notes: adminNotes,
        reviewed_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allSuperFanRequests'] });
      setSelectedRequest(null);
      setAdminNotes('');
    },
  });

  const toggleAccessMutation = useMutation({
    mutationFn: async ({ prefId, currentAccess }) => {
      await base44.entities.UserPreferences.update(prefId, { tiktok_access_approved: !currentAccess });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allUserPreferences'] }),
  });

  const grantAccessMutation = useMutation({
    mutationFn: async ({ email, tiktokUsername }) => {
      let userPref = allPreferences.find(p => p.user_email?.toLowerCase() === email.toLowerCase());
      if (userPref) {
        await base44.entities.UserPreferences.update(userPref.id, {
          tiktok_access_approved: true,
          tiktok_username: tiktokUsername || userPref.tiktok_username
        });
      } else {
        await base44.entities.UserPreferences.create({
          user_email: email,
          tiktok_access_approved: true,
          tiktok_username: tiktokUsername,
          onboarding_completed: false
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUserPreferences'] });
      setNewUserEmail('');
      setNewUserTikTok('');
    },
  });

  const addPreApprovedMutation = useMutation({
    mutationFn: async (tiktokUsername) => {
      const cleaned = tiktokUsername.replace('@', '').trim().toLowerCase();
      const existing = preApprovedList.find(p => p.tiktok_username?.toLowerCase() === cleaned);
      if (existing) throw new Error('Already in list');
      return await base44.entities.PreApprovedSuperFan.create({
        tiktok_username: cleaned,
        added_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preApprovedSuperFans'] });
      setNewUserTikTok('');
    },
  });

  const removePreApprovedMutation = useMutation({
    mutationFn: (id) => base44.entities.PreApprovedSuperFan.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['preApprovedSuperFans'] }),
  });

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const deniedRequests = requests.filter(r => r.status === 'denied');
  const usersWithAccess = allPreferences.filter(p => p.tiktok_access_approved);
  const filteredPreferences = allPreferences.filter(p => 
    !searchTerm || 
    p.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.tiktok_username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const RequestCard = ({ request }) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <img src={request.screenshot_url} alt="SuperFan proof" className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80" onClick={() => window.open(request.screenshot_url, '_blank')} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">@{request.tiktok_username}</p>
                  <p className="text-sm text-gray-600">{request.user_email}</p>
                </div>
                <Badge className={request.status === 'pending' ? 'bg-amber-100 text-amber-700' : request.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>{request.status}</Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">Submitted: {format(new Date(request.created_date), 'MMM d, yyyy h:mm a')}</p>
              {request.admin_notes && <p className="text-sm text-gray-600 mt-2 italic">Note: {request.admin_notes}</p>}
              {request.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <Button size="sm" onClick={() => setSelectedRequest(request)} className="bg-green-600 hover:bg-green-700"><CheckCircle className="w-4 h-4 mr-1" />Approve</Button>
                  <Button size="sm" variant="destructive" onClick={() => { setSelectedRequest(request); setAdminNotes('Please submit a valid SuperFan screenshot.'); }}><XCircle className="w-4 h-4 mr-1" />Deny</Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending"><Clock className="w-4 h-4 mr-1" />Pending ({pendingRequests.length})</TabsTrigger>
          <TabsTrigger value="approved"><CheckCircle className="w-4 h-4 mr-1" />Approved ({approvedRequests.length})</TabsTrigger>
          <TabsTrigger value="denied"><XCircle className="w-4 h-4 mr-1" />Denied ({deniedRequests.length})</TabsTrigger>
          <TabsTrigger value="manage"><Users className="w-4 h-4 mr-1" />Manage</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-4">
          {isLoading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-purple-600" /></div> : pendingRequests.length === 0 ? <Card><CardContent className="py-12 text-center"><Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No pending requests</p></CardContent></Card> : pendingRequests.map(r => <RequestCard key={r.id} request={r} />)}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4 mt-4">
          {approvedRequests.length === 0 ? <Card><CardContent className="py-12 text-center"><p className="text-gray-500">No approved requests</p></CardContent></Card> : approvedRequests.map(r => <RequestCard key={r.id} request={r} />)}
        </TabsContent>

        <TabsContent value="denied" className="space-y-4 mt-4">
          {deniedRequests.length === 0 ? <Card><CardContent className="py-12 text-center"><p className="text-gray-500">No denied requests</p></CardContent></Card> : deniedRequests.map(r => <RequestCard key={r.id} request={r} />)}
        </TabsContent>

        <TabsContent value="manage" className="space-y-4 mt-4">
          <Card className="border-2 border-dashed border-purple-300 bg-purple-50/50">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Star className="w-5 h-5 text-purple-600" />Pre-Approved Usernames</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input placeholder="@tiktokusername" value={newUserTikTok} onChange={(e) => setNewUserTikTok(e.target.value)} className="flex-1" />
                <Button onClick={() => addPreApprovedMutation.mutate(newUserTikTok)} disabled={!newUserTikTok || addPreApprovedMutation.isPending} className="bg-purple-600 hover:bg-purple-700">{addPreApprovedMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}Add</Button>
              </div>
              {preApprovedList.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  {preApprovedList.map(item => (
                    <Badge key={item.id} className="bg-purple-100 text-purple-700 flex items-center gap-1 px-3 py-1">@{item.tiktok_username}<button onClick={() => removePreApprovedMutation.mutate(item.id)} className="ml-1 hover:text-red-600"><XCircle className="w-3 h-3" /></button></Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-dashed border-green-300 bg-green-50/50">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><UserPlus className="w-5 h-5 text-green-600" />Grant by Email</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Input placeholder="User email" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} className="flex-1" />
                <Button onClick={() => grantAccessMutation.mutate({ email: newUserEmail, tiktokUsername: '' })} disabled={!newUserEmail || grantAccessMutation.isPending} className="bg-green-600 hover:bg-green-700">{grantAccessMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}Grant</Button>
              </div>
            </CardContent>
          </Card>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search users..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>

          <Card>
            <CardHeader><CardTitle className="text-lg">Users with Access ({usersWithAccess.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {filteredPreferences.length === 0 ? <p className="text-gray-500 text-center py-4">No users found</p> : filteredPreferences.map(pref => (
                <div key={pref.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{pref.user_email}</p>
                    {pref.tiktok_username && <p className="text-sm text-purple-600">@{pref.tiktok_username}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={pref.tiktok_access_approved ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>{pref.tiktok_access_approved ? 'Active' : 'No Access'}</Badge>
                    <Button size="sm" variant={pref.tiktok_access_approved ? 'destructive' : 'default'} onClick={() => toggleAccessMutation.mutate({ prefId: pref.id, currentAccess: pref.tiktok_access_approved })} disabled={toggleAccessMutation.isPending}>{pref.tiktok_access_approved ? <><ToggleRight className="w-4 h-4 mr-1" />Suspend</> : <><ToggleLeft className="w-4 h-4 mr-1" />Grant</>}</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Review Request</DialogTitle></DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <img src={selectedRequest.screenshot_url} alt="SuperFan proof" className="w-32 h-32 object-cover rounded-lg cursor-pointer" onClick={() => window.open(selectedRequest.screenshot_url, '_blank')} />
                <div>
                  <p className="font-bold text-lg">@{selectedRequest.tiktok_username}</p>
                  <p className="text-gray-600">{selectedRequest.user_email}</p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => window.open(`https://tiktok.com/@${selectedRequest.tiktok_username}`, '_blank')}><ExternalLink className="w-4 h-4 mr-1" />View TikTok</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Admin Notes</Label>
                <Textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Add notes..." rows={3} />
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => denyMutation.mutate({ requestId: selectedRequest.id })} disabled={denyMutation.isPending}><XCircle className="w-4 h-4 mr-2" />Deny</Button>
            <Button onClick={() => approveMutation.mutate({ requestId: selectedRequest.id, userEmail: selectedRequest.user_email })} disabled={approveMutation.isPending} className="bg-green-600 hover:bg-green-700"><CheckCircle className="w-4 h-4 mr-2" />Approve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}