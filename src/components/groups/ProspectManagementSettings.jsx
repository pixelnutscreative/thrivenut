import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Zap } from 'lucide-react';

export default function ProspectManagementSettings({ group }) {
  const queryClient = useQueryClient();

  // Fetch Group Types to determine if this group's type allows prospect management
  const { data: groupTypes = [] } = useQuery({
    queryKey: ['groupTypes'],
    queryFn: () => base44.entities.GroupType.filter({ is_active: true }, 'sort_order')
  });

  const groupTypeConfig = groupTypes.find(gt => gt.key === group.type);
  const canEnableProspectManagement = groupTypeConfig?.allow_prospect_management;

  const updateMutation = useMutation({
    mutationFn: (checked) => base44.entities.CreatorGroup.update(group.id, { enable_prospect_management: checked }),
    onSuccess: () => {
      queryClient.invalidateQueries(['activeGroup', group.id]);
      queryClient.invalidateQueries(['myGroupsDetails']);
      alert('Prospect management settings updated!');
    }
  });

  if (!canEnableProspectManagement) {
    return (
      <Card className="border-dashed border-gray-200 bg-gray-50">
        <CardHeader>
          <CardTitle className="text-gray-500">Prospect Management</CardTitle>
          <CardDescription>This group type does not support prospect management. An admin can enable it in Group Types.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-green-500" /> Prospect Management</CardTitle>
        <CardDescription>Enable sales pipeline and lead tracking features for this group.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="font-medium">Enable Prospect Management</div>
          <div className="text-sm text-gray-500">Turn this on to use sales stages, next follow-up dates, and engagement logging.</div>
        </div>
        <Switch
          checked={group.enable_prospect_management === true}
          onCheckedChange={(checked) => updateMutation.mutate(checked)}
          disabled={!canEnableProspectManagement}
        />
      </CardContent>
    </Card>
  );
}