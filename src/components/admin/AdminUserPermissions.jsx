import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Check, X, Shield, Users } from 'lucide-react';

export default function AdminUserPermissions() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['allUsersForAdmin'],
    queryFn: async () => {
      // Fetch users with their preferences
      // Note: We need UserPreferences to check permissions
      const prefs = await base44.entities.UserPreferences.list('-created_date', 100);
      // Filter out corrupt records without emails
      return prefs.filter(u => u.user_email); 
    },
  });

  const toggleAgencyMutation = useMutation({
    mutationFn: ({ id, can_create_agency }) => 
      base44.entities.UserPreferences.update(id, { can_create_agency }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allUsersForAdmin'] }),
  });

  const filteredUsers = users.filter(u => 
    !searchQuery || 
    (u.user_email && u.user_email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.nickname && u.nickname.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No users found.</p>
        ) : (
          filteredUsers.map(user => (
            <Card key={user.id} className="overflow-hidden">
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    {user.profile_image_url ? (
                      <img src={user.profile_image_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <Users className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{user.nickname || 'Unknown User'}</p>
                    <p className="text-sm text-gray-500 truncate">{user.user_email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <Label className="text-sm font-medium block">Can Create Agency</Label>
                      <p className="text-xs text-gray-500">Allow "Agency" group type</p>
                    </div>
                    <Switch
                      checked={!!user.can_create_agency}
                      onCheckedChange={(checked) => 
                        toggleAgencyMutation.mutate({ id: user.id, can_create_agency: checked })
                      }
                      disabled={toggleAgencyMutation.isPending}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}