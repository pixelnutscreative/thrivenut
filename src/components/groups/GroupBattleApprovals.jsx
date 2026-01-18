import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function GroupBattleApprovals({ groupId, isAdmin }) {
  const queryClient = useQueryClient();

  // Fetch pending battles
  const { data: pendingBattles = [] } = useQuery({
    queryKey: ['pendingGroupBattles', groupId],
    queryFn: async () => {
      if (!groupId || !isAdmin) return [];
      return await base44.entities.BattlePlan.filter({ 
        group_id: groupId, 
        approval_status: 'pending' 
      }, '-created_date');
    },
    enabled: !!groupId && isAdmin,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (battleId) => base44.entities.BattlePlan.update(battleId, { approval_status: 'approved' }),
    onSuccess: () => queryClient.invalidateQueries(['pendingGroupBattles']),
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: (battleId) => base44.entities.BattlePlan.update(battleId, { approval_status: 'rejected' }),
    onSuccess: () => queryClient.invalidateQueries(['pendingGroupBattles']),
  });

  if (pendingBattles.length === 0) return null;

  return (
    <div className="mb-6">
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="bg-amber-100/50 border-b border-amber-200">
          <CardTitle className="flex items-center gap-2 text-amber-900">
            <AlertCircle className="w-5 h-5" />
            Pending Battle Approvals ({pendingBattles.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          {pendingBattles.map((battle) => (
            <div key={battle.id} className="flex items-center justify-between bg-white p-4 rounded-lg border border-amber-100">
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {battle.creator_name || 'Unknown'} wants to post
                </p>
                <p className="text-sm text-gray-600">
                  Battle: <strong>VS {battle.opponent}</strong>
                </p>
                {battle.battle_date && (
                  <p className="text-xs text-gray-500">
                    {format(parseISO(battle.battle_date), 'MMM d, h:mm a')}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => rejectMutation.mutate(battle.id)}
                  disabled={rejectMutation.isPending}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-1" /> Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => approveMutation.mutate(battle.id)}
                  disabled={approveMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-1" /> Approve
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}