import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, Clock, Star, ExternalLink, Loader2, Image } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function AdminSuperFanQueue() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('pending');

  const { data: verifications = [], isLoading } = useQuery({
    queryKey: ['superFanVerifications'],
    queryFn: () => base44.entities.SuperFanVerification.list('-created_date'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SuperFanVerification.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['superFanVerifications'] }),
  });

  const approvePreferencesMutation = useMutation({
    mutationFn: async (email) => {
      const prefs = await base44.entities.UserPreferences.filter({ user_email: email });
      if (prefs[0]) {
        await base44.entities.UserPreferences.update(prefs[0].id, { tiktok_access_approved: true });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['preferences'] }),
  });

  const handleApprove = async (verification) => {
    await updateMutation.mutateAsync({
      id: verification.id,
      data: { status: 'approved', reviewed_at: new Date().toISOString() }
    });
    await approvePreferencesMutation.mutateAsync(verification.user_email);
  };

  const handleDeny = (verification) => {
    updateMutation.mutate({
      id: verification.id,
      data: { status: 'denied', reviewed_at: new Date().toISOString() }
    });
  };

  const filtered = verifications.filter(v => {
    if (filter === 'all') return true;
    return v.status === filter;
  });

  const pendingCount = verifications.filter(v => v.status === 'pending').length;
  const previewExpiring = verifications.filter(v => {
    if (!v.preview_expires_at) return false;
    const daysLeft = differenceInDays(new Date(v.preview_expires_at), new Date());
    return daysLeft <= 2 && daysLeft >= 0 && v.status === 'pending';
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">SuperFan Verification Queue</h2>
          <p className="text-gray-600">{pendingCount} pending reviews</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            Pending ({pendingCount})
          </Button>
          <Button
            variant={filter === 'approved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('approved')}
          >
            Approved
          </Button>
          <Button
            variant={filter === 'denied' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('denied')}
          >
            Denied
          </Button>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
        </div>
      </div>

      {/* Expiring Soon Alert */}
      {previewExpiring.length > 0 && (
        <Card className="bg-amber-50 border-amber-300">
          <CardContent className="p-4">
            <p className="text-amber-800 font-medium">
              ⚠️ {previewExpiring.length} preview{previewExpiring.length > 1 ? 's' : ''} expiring in the next 2 days!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Verification Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(verification => {
          const daysLeft = verification.preview_expires_at 
            ? differenceInDays(new Date(verification.preview_expires_at), new Date())
            : null;
          const isExpiringSoon = daysLeft !== null && daysLeft <= 2 && daysLeft >= 0;

          return (
            <Card 
              key={verification.id} 
              className={`${isExpiringSoon ? 'border-amber-400 bg-amber-50' : ''} ${verification.status === 'approved' ? 'border-green-300 bg-green-50' : ''} ${verification.status === 'denied' ? 'border-red-300 bg-red-50' : ''}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-sm">{verification.user_email}</CardTitle>
                    {verification.tiktok_username && (
                      <a 
                        href={`https://tiktok.com/@${verification.tiktok_username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 text-sm hover:underline flex items-center gap-1"
                      >
                        @{verification.tiktok_username}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <Badge className={
                    verification.status === 'approved' ? 'bg-green-500' :
                    verification.status === 'denied' ? 'bg-red-500' :
                    'bg-amber-500'
                  }>
                    {verification.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Screenshot */}
                {verification.screenshot_url && (
                  <a 
                    href={verification.screenshot_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border hover:border-purple-400 transition-colors">
                      <img 
                        src={verification.screenshot_url} 
                        alt="Proof screenshot" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                        <Image className="w-8 h-8 text-white opacity-0 hover:opacity-100" />
                      </div>
                    </div>
                  </a>
                )}

                {/* Preview Status */}
                {verification.preview_started_at && (
                  <div className="text-xs space-y-1">
                    <p className="text-gray-500">
                      Preview started: {format(new Date(verification.preview_started_at), 'MMM d, yyyy')}
                    </p>
                    {daysLeft !== null && (
                      <p className={`font-medium ${isExpiringSoon ? 'text-amber-600' : 'text-gray-600'}`}>
                        {daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Expires today!' : 'Expired'}
                      </p>
                    )}
                  </div>
                )}

                {/* Submitted Date */}
                <p className="text-xs text-gray-400">
                  Submitted: {format(new Date(verification.created_date), 'MMM d, yyyy h:mm a')}
                </p>

                {/* Actions */}
                {verification.status === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(verification)}
                      disabled={updateMutation.isPending}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                      onClick={() => handleDeny(verification)}
                      disabled={updateMutation.isPending}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Deny
                    </Button>
                  </div>
                )}

                {verification.status !== 'pending' && verification.reviewed_at && (
                  <p className="text-xs text-gray-400">
                    Reviewed: {format(new Date(verification.reviewed_at), 'MMM d, yyyy')}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card className="bg-gray-50">
          <CardContent className="py-12 text-center text-gray-500">
            <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No {filter === 'all' ? '' : filter} verifications found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}