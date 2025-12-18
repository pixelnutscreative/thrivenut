import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

export default function AdminContentReview() {
  const queryClient = useQueryClient();
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: pendingItems = [], isLoading } = useQuery({
    queryKey: ['pendingPortfolio'],
    queryFn: () => base44.entities.CreatorPortfolio.filter({ approval_status: 'pending' }, 'created_date'),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, reason }) => base44.entities.CreatorPortfolio.update(id, { 
      approval_status: status,
      rejection_reason: reason 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingPortfolio'] });
      setRejectingId(null);
      setRejectReason('');
    },
  });

  const handleApprove = (id) => {
    updateStatusMutation.mutate({ id, status: 'approved' });
  };

  const handleReject = () => {
    if (!rejectingId || !rejectReason) return;
    updateStatusMutation.mutate({ id: rejectingId, status: 'rejected', reason: rejectReason });
  };

  if (isLoading) return <Loader2 className="w-8 h-8 animate-spin mx-auto mt-10 text-purple-600" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Content Review Queue</h2>
        <Badge variant="secondary">{pendingItems.length} Pending</Badge>
      </div>

      {pendingItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500">No pending submissions! Great job! 🎉</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {pendingItems.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              {item.image_urls?.length > 0 && (
                <div className="aspect-video bg-gray-100 relative">
                  <img src={item.image_urls[0]} alt="" className="w-full h-full object-cover" />
                  <Badge className="absolute top-2 right-2 bg-black/50 text-white">
                    {item.content_type}
                  </Badge>
                </div>
              )}
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <p className="text-sm text-gray-500">By {item.creator_name} ({item.creator_email})</p>
                </div>
                
                <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                  {item.description}
                </p>

                {item.text_content && (
                  <div className="max-h-32 overflow-y-auto p-2 bg-yellow-50 text-xs font-serif rounded border border-yellow-100">
                    {item.text_content}
                  </div>
                )}

                {item.external_link && (
                  <a href={item.external_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
                    <ExternalLink className="w-3 h-3" /> External Link
                  </a>
                )}

                <div className="flex gap-2 text-xs">
                  <Badge variant="outline">{item.ai_tool_name}</Badge>
                  {item.is_nutpal && <Badge className="bg-teal-100 text-teal-800">NutPal</Badge>}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleApprove(item.id)}
                    disabled={updateStatusMutation.isPending}
                  >
                    <Check className="w-4 h-4 mr-2" /> Approve
                  </Button>
                  <Button 
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setRejectingId(item.id)}
                    disabled={updateStatusMutation.isPending}
                  >
                    <X className="w-4 h-4 mr-2" /> Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!rejectingId} onOpenChange={(open) => !open && setRejectingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Submission</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Please provide a reason for rejection (this will be shown to the creator eventually).</p>
            <Textarea 
              placeholder="Reason for rejection..." 
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectingId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason}>Confirm Rejection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}