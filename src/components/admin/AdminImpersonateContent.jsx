import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, UserCog, Play, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminImpersonateContent() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: users = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list('-created_date'),
  });

  const { data: preferences = [] } = useQuery({
    queryKey: ['allUserPreferences'],
    queryFn: () => base44.entities.UserPreferences.list(),
  });

  const { data: managedAccounts = [] } = useQuery({
    queryKey: ['managedAccounts'],
    queryFn: () => base44.entities.ManagedAccount.filter({ status: 'active' }),
  });

  const filteredUsers = users.filter(u => 
    !searchTerm || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startImpersonation = (identifier) => {
    sessionStorage.setItem('impersonating', identifier);
    sessionStorage.setItem('impersonatingStarted', new Date().toISOString());
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search users by email or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {managedAccounts.length > 0 && (
        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Users className="w-5 h-5 text-purple-600" />Managed Accounts</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {managedAccounts.map(account => (
              <div key={account.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div>
                  <p className="font-medium">@{account.tiktok_username}</p>
                  {account.display_name && <p className="text-sm text-gray-600">{account.display_name}</p>}
                </div>
                <Button size="sm" onClick={() => startImpersonation(`managed_${account.tiktok_username}@thrivenut.app`)} className="bg-purple-600 hover:bg-purple-700">
                  <Play className="w-4 h-4 mr-1" /> Act As
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><UserCog className="w-5 h-5" />All Users ({filteredUsers.length})</CardTitle></CardHeader>
        <CardContent className="space-y-2 max-h-96 overflow-y-auto">
          {filteredUsers.map(u => {
            const pref = preferences.find(p => p.user_email === u.email);
            return (
              <div key={u.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{u.full_name || u.email}</p>
                  <p className="text-sm text-gray-600">{u.email}</p>
                  <p className="text-xs text-gray-400">Joined {format(new Date(u.created_date), 'MMM d, yyyy')}</p>
                </div>
                <div className="flex items-center gap-2">
                  {pref?.tiktok_access_approved && <Badge className="bg-purple-100 text-purple-700">TikTok</Badge>}
                  <Button size="sm" variant="outline" onClick={() => startImpersonation(u.email)}>
                    <Play className="w-4 h-4 mr-1" /> Act As
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}