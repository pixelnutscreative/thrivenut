import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, Send } from 'lucide-react';

export default function ChangeRequestModal({ contentCardId, isOpen, onClose, userEmail }) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState('');

  const submitMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.ChangeRequest.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changeRequests'] });
      setReason('');
      onClose();
    },
  });

  const handleSubmit = () => {
    if (!reason.trim()) return;

    submitMutation.mutate({
      item_type: 'ContentCard',
      item_id: contentCardId,
      reason: reason,
      requested_by: userEmail,
      status: 'pending'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Content Change</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              This content is locked for editing. Submit a change request and the owner will review it.
            </p>
          </div>

          <div>
            <Label>Describe the changes you need</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={6}
              placeholder="Please explain what needs to be changed and why..."
              className="mt-2"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1"
              disabled={!reason.trim() || submitMutation.isPending}
            >
              <Send className="w-4 h-4 mr-2" />
              {submitMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}