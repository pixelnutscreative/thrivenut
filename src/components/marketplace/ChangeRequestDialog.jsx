import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';

export default function ChangeRequestDialog({
  isOpen,
  onClose,
  request,
  submission
}) {
  const queryClient = useQueryClient();
  const [changeNotes, setChangeNotes] = useState('');
  const [isErrorFix, setIsErrorFix] = useState(true);
  const [waiveFee, setWaiveFee] = useState(false);

  const revisionCount = request?.revision_count || 0;
  const freeRevisionUsed = request?.free_revision_used || false;
  const isFreeRevision = isErrorFix && !freeRevisionUsed;
  const revisionFee = isFreeRevision ? 0 : 7;

  const requestChangeMutation = useMutation({
    mutationFn: async (data) => {
      const revisionEntry = {
        requested_date: new Date().toISOString(),
        notes: changeNotes,
        is_error_fix: isErrorFix,
        fee: waiveFee ? 0 : revisionFee,
        waived_by_requester: waiveFee
      };

      await base44.entities.ContentRequest.update(request.id, {
        revision_count: revisionCount + 1,
        free_revision_used: freeRevisionUsed || isErrorFix,
        revision_notes: [...(request.revision_notes || []), revisionEntry],
        fulfillment_status: 'in_progress'
      });

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contentRequests'] });
      setChangeNotes('');
      setIsErrorFix(true);
      setWaiveFee(false);
      onClose();
    }
  });

  const handleSubmit = () => {
    if (!changeNotes.trim()) {
      alert('Please describe what changes you want');
      return;
    }
    requestChangeMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Request Changes
          </DialogTitle>
          <DialogDescription>
            Tell the creator what needs to be adjusted
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Revision Type */}
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-900">Type of Change:</p>
            
            <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <Checkbox
                checked={isErrorFix}
                onCheckedChange={setIsErrorFix}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Error/Typo Fix</p>
                <p className="text-xs text-gray-500">Spelling mistakes, broken text, quality issues</p>
                {!freeRevisionUsed && isErrorFix && (
                  <Badge variant="secondary" className="mt-1 bg-green-100 text-green-800">
                    FREE
                  </Badge>
                )}
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <Checkbox
                checked={!isErrorFix}
                onCheckedChange={() => setIsErrorFix(false)}
                className="mt-1"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Design Change</p>
                <p className="text-xs text-gray-500">Different look, battle date change, new elements</p>
                <Badge variant="secondary" className="mt-1 bg-amber-100 text-amber-800">
                  $7 FEE
                </Badge>
              </div>
            </label>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-900">What needs to change?</label>
            <Textarea
              placeholder="Describe the changes you want..."
              value={changeNotes}
              onChange={(e) => setChangeNotes(e.target.value)}
              rows={4}
              className="text-sm"
            />
          </div>

          {/* Fee Info */}
          {!isErrorFix && (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Revision Fee:</span>
                    <span className="text-lg font-bold text-amber-700">$7.00</span>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={waiveFee}
                      onCheckedChange={setWaiveFee}
                    />
                    <span className="text-sm text-gray-700">
                      Waive the fee (optional - creator's choice to accept)
                    </span>
                  </label>

                  {waiveFee && (
                    <p className="text-xs text-amber-700 bg-white p-2 rounded">
                      ✓ You're offering to cover this change at no cost
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {isErrorFix && !freeRevisionUsed && (
            <div className="bg-green-50 border border-green-200 p-3 rounded text-sm text-green-800">
              <p className="font-medium mb-1">✓ This revision is FREE</p>
              <p className="text-xs">You have one free revision for errors or quality issues.</p>
            </div>
          )}

          {isErrorFix && freeRevisionUsed && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded text-sm text-amber-800">
              <p className="font-medium mb-1">⚠️ Free revision already used</p>
              <p className="text-xs">Additional changes will be $7 each.</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={requestChangeMutation.isPending || !changeNotes.trim()}
            className="w-full"
          >
            {requestChangeMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending Request...
              </>
            ) : (
              'Send Change Request'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}