import React, { useState, useEffect } from 'react';
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
import { CheckCircle, XCircle, Clock, Loader2, ExternalLink, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const ADMIN_EMAIL = 'pixelnutscreative@gmail.com';

export default function AdminSuperFanReview() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['allSuperFanRequests'],
    queryFn: () => base44.entities.SuperFanRequest.list('-created_date'),
    enabled: isAdmin,
  });

  const { data: allPreferences = [] } = useQuery({
    queryKey: ['allUserPreferences'],
    queryFn: () => base44.entities.UserPreferences.list(),
    enabled: isAdmin,
  });

  const approveMutation = useMutation({
    mutationFn: async ({ requestId, userEmail }) => {
      // Update request status
      await base44.entities.SuperFanRequest.update(requestId, {
        status: 'approved',
        admin_notes: adminNotes,
        reviewed_date: new Date().toISOString()
      });

      // Find user's preferences and update
      const userPrefs = allPreferences.find(p => p.user_email === userEmail);
      if (userPrefs) {
        await base44.entities.UserPreferences.update(userPrefs.id, {
          tiktok_access_approved: true
        });
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

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-4 md:p-8 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-800">Admin Access Only</h1>
            <p className="text-gray-600 mt-2">This page is restricted to administrators.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const deniedRequests = requests.filter(r => r.status === 'denied');

  const RequestCard = ({ request }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <img
              src={request.screenshot_url}
              alt="SuperFan proof"
              className="w-24 h-24 object-cover rounded-lg cursor-pointer hover:opacity-80"
              onClick={() => window.open(request.screenshot_url, '_blank')}
            />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">@{request.tiktok_username}</p>
                  <p className="text-sm text-gray-600">{request.user_email}</p>
                </div>
                <Badge className={
                  request.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  request.status === 'approved' ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                }>
                  {request.status}
                </Badge>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Submitted: {format(new Date(request.created_date), 'MMM d, yyyy h:mm a')}
              </p>
              {request.admin_notes && (
                <p className="text-sm text-gray-600 mt-2 italic">Note: {request.admin_notes}</p>
              )}
              
              {request.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={() => setSelectedRequest(request)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setSelectedRequest(request);
                      setAdminNotes('Please submit a valid SuperFan screenshot showing active subscription.');
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Deny
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">SuperFan Access Requests</h1>
          <p className="text-gray-600 mt-1">Review and approve TikTok feature access</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending ({pendingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Approved ({approvedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="denied" className="flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Denied ({deniedRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4 mt-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
              </div>
            ) : pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No pending requests</p>
                </CardContent>
              </Card>
            ) : (
              pendingRequests.map(request => (
                <RequestCard key={request.id} request={request} />
              ))
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4 mt-4">
            {approvedRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No approved requests yet</p>
                </CardContent>
              </Card>
            ) : (
              approvedRequests.map(request => (
                <RequestCard key={request.id} request={request} />
              ))
            )}
          </TabsContent>

          <TabsContent value="denied" className="space-y-4 mt-4">
            {deniedRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No denied requests</p>
                </CardContent>
              </Card>
            ) : (
              deniedRequests.map(request => (
                <RequestCard key={request.id} request={request} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Review Modal */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Request</DialogTitle>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <img
                  src={selectedRequest.screenshot_url}
                  alt="SuperFan proof"
                  className="w-32 h-32 object-cover rounded-lg cursor-pointer"
                  onClick={() => window.open(selectedRequest.screenshot_url, '_blank')}
                />
                <div>
                  <p className="font-bold text-lg">@{selectedRequest.tiktok_username}</p>
                  <p className="text-gray-600">{selectedRequest.user_email}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => window.open(`https://tiktok.com/@${selectedRequest.tiktok_username}`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View TikTok
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Admin Notes (Optional)</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about this decision..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => denyMutation.mutate({ requestId: selectedRequest.id })}
              disabled={denyMutation.isPending}
            >
              {denyMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <XCircle className="w-4 h-4 mr-2" />
              Deny
            </Button>
            <Button
              onClick={() => approveMutation.mutate({ 
                requestId: selectedRequest.id, 
                userEmail: selectedRequest.user_email 
              })}
              disabled={approveMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {approveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}