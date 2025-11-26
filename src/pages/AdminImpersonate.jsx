import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { 
  Shield, UserPlus, Users, Search, Loader2, Eye, 
  UserCog, Plus, ExternalLink, Gift, Music
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

const ADMIN_EMAIL = 'pixelnutscreative@gmail.com';

export default function AdminImpersonate() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAccountUsername, setNewAccountUsername] = useState('');
  const [newAccountDisplayName, setNewAccountDisplayName] = useState('');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Fetch all managed accounts
  const { data: managedAccounts = [] } = useQuery({
    queryKey: ['managedAccounts'],
    queryFn: () => base44.entities.ManagedAccount.list('-created_date'),
    enabled: isAdmin,
  });

  // Fetch all user preferences (for users who have logged in)
  const { data: allPreferences = [] } = useQuery({
    queryKey: ['allUserPreferences'],
    queryFn: () => base44.entities.UserPreferences.list(),
    enabled: isAdmin,
  });

  // Create managed account mutation
  const createAccountMutation = useMutation({
    mutationFn: async ({ username, displayName }) => {
      const cleaned = username.replace('@', '').trim().toLowerCase();
      
      // Create the managed account record
      const account = await base44.entities.ManagedAccount.create({
        tiktok_username: cleaned,
        display_name: displayName || cleaned
      });

      // Also create UserPreferences for this account so data can be stored
      await base44.entities.UserPreferences.create({
        user_email: `managed_${cleaned}@thrivenut.app`,
        tiktok_username: cleaned,
        tiktok_access_approved: true,
        onboarding_completed: true
      });

      return account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managedAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['allUserPreferences'] });
      setShowCreateModal(false);
      setNewAccountUsername('');
      setNewAccountDisplayName('');
    },
  });

  // Start impersonation
  const startImpersonation = (identifier) => {
    // Store in sessionStorage so it persists across page navigations
    sessionStorage.setItem('impersonating', identifier);
    sessionStorage.setItem('impersonatingStarted', new Date().toISOString());
    window.location.reload();
  };

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

  // Combine managed accounts and real users for display
  const allAccounts = [
    ...managedAccounts.map(acc => {
      // Handle both nested data and flat structure
      const username = acc.data?.tiktok_username || acc.tiktok_username;
      const displayName = acc.data?.display_name || acc.display_name;
      const claimedBy = acc.data?.claimed_by_email || acc.claimed_by_email;
      return {
        type: 'managed',
        id: acc.id,
        identifier: `managed_${username}@thrivenut.app`,
        tiktok_username: username,
        display_name: displayName,
        claimed: !!claimedBy,
        claimed_by: claimedBy,
        created_date: acc.created_date
      };
    }),
    ...allPreferences
      .filter(p => !p.user_email?.startsWith('managed_'))
      .map(pref => ({
        type: 'user',
        id: pref.id,
        identifier: pref.user_email,
        tiktok_username: pref.tiktok_username,
        display_name: pref.tiktok_username || pref.user_email,
        email: pref.user_email,
        created_date: pref.created_date
      }))
  ];

  const filteredAccounts = allAccounts.filter(acc => 
    !searchTerm ||
    acc.tiktok_username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.identifier?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
              <UserCog className="w-8 h-8 text-indigo-600" />
              User Management
            </h1>
            <p className="text-gray-600 mt-1">Impersonate users to help set up their accounts</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Account
          </Button>
        </div>

        {/* Quick Actions */}
        <Card className="border-2 border-indigo-200 bg-indigo-50/50">
          <CardContent className="p-4">
            <h3 className="font-semibold text-indigo-800 mb-3">Quick Create for TikTok User</h3>
            <div className="flex gap-3">
              <Input
                placeholder="@foleyfarms"
                value={newAccountUsername}
                onChange={(e) => setNewAccountUsername(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={() => {
                  if (newAccountUsername) {
                    createAccountMutation.mutate({ 
                      username: newAccountUsername, 
                      displayName: newAccountUsername.replace('@', '') 
                    });
                  }
                }}
                disabled={!newAccountUsername || createAccountMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {createAccountMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create & Manage
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-indigo-600 mt-2">
              Creates a managed account you can work on. When the user signs up, they can claim it.
            </p>
          </CardContent>
        </Card>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by TikTok username or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Accounts List */}
        <div className="space-y-3">
          {filteredAccounts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No accounts found</p>
              </CardContent>
            </Card>
          ) : (
            filteredAccounts.map(account => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div 
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                            account.type === 'managed' ? 'bg-indigo-500' : 'bg-green-500'
                          }`}
                        >
                          {account.tiktok_username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg">
                              {account.tiktok_username ? `@${account.tiktok_username}` : account.display_name}
                            </h3>
                            <Badge className={account.type === 'managed' ? 'bg-indigo-100 text-indigo-700' : 'bg-green-100 text-green-700'}>
                              {account.type === 'managed' ? 'Managed' : 'User'}
                            </Badge>
                            {account.claimed && (
                              <Badge className="bg-amber-100 text-amber-700">Claimed</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {account.email || account.identifier}
                          </p>
                          {account.claimed_by && (
                            <p className="text-xs text-green-600">Claimed by: {account.claimed_by}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {account.tiktok_username && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`https://tiktok.com/@${account.tiktok_username}`, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          onClick={() => startImpersonation(account.identifier)}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Impersonate
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Instructions */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <h3 className="font-semibold text-amber-800 mb-2">📋 How Impersonation Works</h3>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Click "Impersonate" to view and edit the app as that user</li>
              <li>• A banner will show at the top reminding you who you're acting as</li>
              <li>• All data changes will be attributed to that user's account</li>
              <li>• Click "Stop Impersonating" in the banner to return to admin view</li>
              <li>• Managed accounts can be claimed later when the real user signs up</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Create Account Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Managed Account</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>TikTok Username *</Label>
              <Input
                placeholder="@username"
                value={newAccountUsername}
                onChange={(e) => setNewAccountUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Display Name (optional)</Label>
              <Input
                placeholder="Friendly name for easy identification"
                value={newAccountDisplayName}
                onChange={(e) => setNewAccountDisplayName(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createAccountMutation.mutate({ 
                username: newAccountUsername, 
                displayName: newAccountDisplayName 
              })}
              disabled={!newAccountUsername || createAccountMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {createAccountMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}