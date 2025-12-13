import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Trash2, Shield, RefreshCcw, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';

export default function AccountDeletionTab({ userEmail }) {
  const queryClient = useQueryClient();
  const [confirmText, setConfirmText] = useState('');
  const [reason, setReason] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { data: deletionRequest } = useQuery({
    queryKey: ['deletionRequest', userEmail],
    queryFn: async () => {
      const requests = await base44.entities.DeletionRequest.filter({ 
        user_email: userEmail,
        status: 'pending'
      });
      return requests[0] || null;
    },
    enabled: !!userEmail,
  });

  const requestDeletionMutation = useMutation({
    mutationFn: async () => {
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 30);
      
      return await base44.entities.DeletionRequest.create({
        user_email: userEmail,
        requested_date: new Date().toISOString(),
        scheduled_deletion_date: deletionDate.toISOString(),
        reason: reason || 'No reason provided',
        status: 'pending'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deletionRequest'] });
      setConfirmText('');
      setReason('');
      setShowConfirmation(false);
    }
  });

  const cancelDeletionMutation = useMutation({
    mutationFn: async () => {
      return await base44.entities.DeletionRequest.update(deletionRequest.id, {
        status: 'cancelled',
        cancelled_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deletionRequest'] });
    }
  });

  const handleRequestDeletion = () => {
    if (confirmText.toLowerCase() !== 'delete my account') {
      return;
    }
    requestDeletionMutation.mutate();
  };

  const daysRemaining = deletionRequest 
    ? differenceInDays(new Date(deletionRequest.scheduled_deletion_date), new Date())
    : 0;

  if (deletionRequest) {
    return (
      <Card className="border-amber-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-600">
            <AlertTriangle className="w-5 h-5" />
            Account Deletion Scheduled
          </CardTitle>
          <CardDescription>Your account is scheduled for deletion</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
            <p className="font-semibold text-amber-800 mb-2">⏳ {daysRemaining} days remaining</p>
            <p className="text-sm text-amber-700">
              Your account and all data will be permanently deleted on{' '}
              <strong>{format(new Date(deletionRequest.scheduled_deletion_date), 'MMMM d, yyyy')}</strong>
            </p>
            <p className="text-xs text-amber-600 mt-2">
              After this date, your data cannot be recovered.
            </p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Changed your mind? You can cancel the deletion anytime before the scheduled date!
            </p>
          </div>

          <Button
            onClick={() => cancelDeletionMutation.mutate()}
            disabled={cancelDeletionMutation.isPending}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {cancelDeletionMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Cancelling...</>
            ) : (
              <><RefreshCcw className="w-4 h-4 mr-2" /> Cancel Deletion & Keep My Account</>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-red-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <Trash2 className="w-5 h-5" />
          Delete Account
        </CardTitle>
        <CardDescription>Permanently delete your account and all data</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg space-y-2">
          <p className="font-semibold text-red-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            This action cannot be undone after 30 days
          </p>
          <p className="text-sm text-red-700">
            When you delete your account:
          </p>
          <ul className="list-disc list-inside text-sm text-red-700 space-y-1 ml-2">
            <li>All your data will be scheduled for deletion</li>
            <li>You'll have <strong>30 days</strong> to cancel and reactivate</li>
            <li>After 30 days, everything is permanently deleted</li>
            <li>Your referral links will be deactivated immediately</li>
            <li>Active subscriptions will be cancelled</li>
          </ul>
        </div>

        {!showConfirmation ? (
          <Button
            variant="outline"
            className="w-full border-red-300 text-red-600 hover:bg-red-50"
            onClick={() => setShowConfirmation(true)}
          >
            I want to delete my account
          </Button>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-4 pt-4 border-t"
          >
            <div>
              <Label>Why are you leaving? (Optional)</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Help us improve..."
                className="mt-2"
              />
            </div>

            <div>
              <Label>Type "delete my account" to confirm</Label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="delete my account"
                className="mt-2"
              />
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                30-Day Safety Net: You can cancel anytime within 30 days
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmation(false);
                  setConfirmText('');
                  setReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRequestDeletion}
                disabled={confirmText.toLowerCase() !== 'delete my account' || requestDeletionMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {requestDeletionMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                ) : (
                  <><Trash2 className="w-4 h-4 mr-2" /> Schedule Account Deletion</>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}