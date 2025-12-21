import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Edit, Image, Users, Loader2, Upload, Check, Link as LinkIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import ImageUploader from '../settings/ImageUploader';
import { Switch } from '@/components/ui/switch';

export default function AdminAIToolsContent() {
  const queryClient = useQueryClient();
  const [showAddTool, setShowAddTool] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingTool, setEditingTool] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showContactPicker, setShowContactPicker] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    platform: 'all',
    has_digital_twin: 'all',
    has_nuts_and_bots: 'all',
    has_thrive: 'all',
    is_overdue: 'all',
    includes_social_access: 'all'
  });
  const [sortBy, setSortBy] = useState('name');
  const [contactSearch, setContactSearch] = useState('');
  const [showCreateContact, setShowCreateContact] = useState(false);
  const [newContactUsername, setNewContactUsername] = useState('');
  const [newTool, setNewTool] = useState({
    tool_name: '',
    app_id: '',
    pixels_toolbox_url: '',
    lets_go_nuts_url: '',
    icon_emoji: '',
    icon_url: '',
    is_general_tool: false,
    sort_order: 100
  });
  const [newUser, setNewUser] = useState({ 
    user_name: '', 
    user_email: '', 
    platform: 'lets_go_nuts', 
    subscription_tier: '',
    has_nuts_and_bots: false,
    has_digital_twin: false,
    includes_social_access: false,
    is_trusted_creator: false,
    tiktok_contact_id: ''
  });

  // Fetch current user
  React.useEffect(() => {
    base44.auth.me().then(user => setCurrentUser(user)).catch(() => {});
  }, []);

  // Fetch AI tool links
  const { data: aiTools = [], isLoading: toolsLoading } = useQuery({
    queryKey: ['aiToolLinks'],
    queryFn: () => base44.entities.AIToolLink.list('sort_order'),
  });

  // Fetch platform users
  const { data: platformUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['platformUsers'],
    queryFn: () => base44.entities.AIPlatformUser.list('-created_date'),
  });

  // Fetch all Thrive user preferences to check who has signed up
  const { data: thriveUsers = [] } = useQuery({
    queryKey: ['thriveUsers'],
    queryFn: () => base44.entities.UserPreferences.list(),
  });

  // Fetch TikTok contacts for linking - fetch ALL without limits
  const { data: tiktokContacts = [], refetch: refetchContacts, isRefetching } = useQuery({
    queryKey: ['tiktokContacts'],
    queryFn: async () => {
      // Fetch all contacts without any filters
      const contacts = await base44.entities.TikTokContact.list('username', 5000);
      console.log(`Fetched ${contacts.length} TikTok contacts`);
      // Sort alphabetically by username
      return contacts.sort((a, b) => {
        const nameA = (a.tiktok_username || a.username || '').toLowerCase();
        const nameB = (b.tiktok_username || b.username || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    },
  });

  // Check if current user already has a platform assignment
  const currentUserAssignment = React.useMemo(() => {
    if (!currentUser?.email || !platformUsers) return null;
    return platformUsers.find(u => u.user_email?.toLowerCase() === currentUser.email.toLowerCase());
  }, [currentUser, platformUsers]);

  const createToolMutation = useMutation({
    mutationFn: (data) => base44.entities.AIToolLink.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiToolLinks'] });
      setShowAddTool(false);
      setNewTool({ tool_name: '', app_id: '', pixels_toolbox_url: '', lets_go_nuts_url: '', icon_emoji: '', icon_url: '', is_general_tool: false, sort_order: 100 });
    },
  });

  const updateToolMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AIToolLink.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiToolLinks'] });
      setEditingTool(null);
    },
  });

  const deleteToolMutation = useMutation({
    mutationFn: (id) => base44.entities.AIToolLink.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['aiToolLinks'] }),
  });

  const createPlatformUserMutation = useMutation({
    mutationFn: (data) => base44.entities.AIPlatformUser.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformUsers'] });
      setShowAddUser(false);
      setNewUser({ user_name: '', user_email: '', platform: 'lets_go_nuts', subscription_tier: '', has_nuts_and_bots: false, includes_social_access: false, tiktok_contact_id: '' });
    },
  });

  const updatePlatformUserMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AIPlatformUser.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformUsers'] });
      setEditingUser(null);
    },
  });

  const deletePlatformUserMutation = useMutation({
    mutationFn: (id) => base44.entities.AIPlatformUser.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platformUsers'] }),
  });

  const bulkEnableSocialMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('bulkEnableSocial', {});
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformUsers'] });
    }
  });

  const getLinkedContact = (platformUser) => {
    if (!platformUser.tiktok_contact_id) return null;
    return tiktokContacts.find(c => c.id === platformUser.tiktok_contact_id);
  };

  const hasThriveAccount = (userEmail) => {
    return thriveUsers.some(u => u.user_email?.toLowerCase() === userEmail?.toLowerCase());
  };

  const isOverdue = (user) => {
    if (!user.renewal_date) return false;
    const renewalDate = new Date(user.renewal_date);
    const today = new Date();
    return renewalDate < today;
  };

  // Filter platform users
  const filteredUsers = React.useMemo(() => {
    let filtered = [...platformUsers];

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.user_name?.toLowerCase().includes(query) ||
        user.user_email?.toLowerCase().includes(query) ||
        getLinkedContact(user)?.tiktok_username?.toLowerCase().includes(query) ||
        getLinkedContact(user)?.username?.toLowerCase().includes(query)
      );
    }

    // Platform filter
    if (filters.platform !== 'all') {
      filtered = filtered.filter(u => u.platform === filters.platform);
    }

    // Digital twin filter
    if (filters.has_digital_twin !== 'all') {
      const shouldHave = filters.has_digital_twin === 'yes';
      filtered = filtered.filter(u => !!u.has_digital_twin === shouldHave);
    }

    // Nuts & Bots filter
    if (filters.has_nuts_and_bots !== 'all') {
      const shouldHave = filters.has_nuts_and_bots === 'yes';
      filtered = filtered.filter(u => !!u.has_nuts_and_bots === shouldHave);
    }

    // Social access filter
    if (filters.includes_social_access !== 'all') {
      const shouldHave = filters.includes_social_access === 'yes';
      filtered = filtered.filter(u => !!u.includes_social_access === shouldHave);
    }

    // Thrive account filter
    if (filters.has_thrive !== 'all') {
      const shouldHave = filters.has_thrive === 'yes';
      filtered = filtered.filter(u => hasThriveAccount(u.user_email) === shouldHave);
    }

    // Overdue filter
    if (filters.is_overdue !== 'all') {
      const shouldBeOverdue = filters.is_overdue === 'yes';
      filtered = filtered.filter(u => isOverdue(u) === shouldBeOverdue);
    }

    // Sort
    if (sortBy === 'name') {
      filtered.sort((a, b) => {
        const nameA = (a.user_name || a.user_email || '').toLowerCase();
        const nameB = (b.user_name || b.user_email || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else if (sortBy === 'email') {
      filtered.sort((a, b) => {
        const emailA = (a.user_email || '').toLowerCase();
        const emailB = (b.user_email || '').toLowerCase();
        return emailA.localeCompare(emailB);
      });
    }

    return filtered;
  }, [platformUsers, searchQuery, filters, thriveUsers, tiktokContacts, sortBy]);

  // Filter contacts for search - search all name fields thoroughly
  const filteredContacts = React.useMemo(() => {
    // Show ALL contacts if no search query
    if (!contactSearch || contactSearch.trim() === '') {
      return tiktokContacts;
    }
    
    // Strip @ from search to allow searching by @username
    const query = contactSearch.toLowerCase().replace(/@/g, '').trim();
    const queryWords = query.split(/\s+/); // Split by spaces for multi-word search
    
    return tiktokContacts.filter(c => {
      const searchFields = [
        c.tiktok_username?.toLowerCase() || '',
        c.username?.toLowerCase() || '',
        c.display_name?.toLowerCase() || '',
        c.real_name?.toLowerCase() || '',
        c.nickname?.toLowerCase() || '',
        c.email?.toLowerCase() || ''
      ].join(' ');
      
      // Match if ANY query word is found OR if the full query is found
      return queryWords.every(word => searchFields.includes(word)) || 
             searchFields.includes(query);
    });
  }, [tiktokContacts, contactSearch]);

  const createContactMutation = useMutation({
    mutationFn: (data) => base44.entities.TikTokContact.create(data),
    onSuccess: (newContact) => {
      queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
      // Auto-select the newly created contact
      if (editingUser) {
        setEditingUser({ ...editingUser, tiktok_contact_id: newContact.id });
      } else {
        setNewUser({ ...newUser, tiktok_contact_id: newContact.id });
      }
      setShowCreateContact(false);
      setNewContactUsername('');
      setContactSearch('');
    }
  });

  return (
    <div className="space-y-6">
      <Tabs defaultValue="tools" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tools">AI Image Tools</TabsTrigger>
          <TabsTrigger value="users">Platform Users</TabsTrigger>
        </TabsList>

        {/* AI Tools Tab */}
        <TabsContent value="tools">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  AI Image Generator Links
                </CardTitle>
                <Button onClick={() => setShowAddTool(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Tool
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {toolsLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600" />
                </div>
              ) : aiTools.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No AI tools configured yet</p>
              ) : (
                <div className="space-y-3">
                  {aiTools.map(tool => (
                    <div key={tool.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                      {tool.icon_url ? (
                        <img src={tool.icon_url} alt={tool.tool_name} className="w-8 h-8 rounded object-cover" />
                      ) : tool.icon_emoji ? (
                        <span className="text-2xl">{tool.icon_emoji}</span>
                      ) : (
                        <Image className="w-6 h-6 text-gray-400" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{tool.tool_name}</p>
                        {tool.is_general_tool && (
                          <Badge variant="outline" className="text-xs mt-1">General Tool</Badge>
                        )}
                        <div className="text-xs text-gray-500 mt-1 space-y-1">
                          {tool.is_general_tool ? (
                            <p>URL: {tool.pixels_toolbox_url || tool.lets_go_nuts_url}</p>
                          ) : tool.app_id ? (
                            <p>App ID: {tool.app_id}</p>
                          ) : (
                            <>
                              {tool.pixels_toolbox_url && (
                                <p>Pixel's: {tool.pixels_toolbox_url}</p>
                              )}
                              {tool.lets_go_nuts_url && (
                                <p>Let's Go: {tool.lets_go_nuts_url}</p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTool(tool)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-4 h-4 text-gray-400" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteToolMutation.mutate(tool.id)}
                        className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Platform Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Platform Assignments ({filteredUsers.length} of {platformUsers.length})
                </CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => bulkEnableSocialMutation.mutate()}
                    disabled={bulkEnableSocialMutation.isPending}
                  >
                    {bulkEnableSocialMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Enable Social for All
                  </Button>
                  <Button onClick={() => {
                    if (currentUser?.email && !currentUserAssignment) {
                      setNewUser({ 
                        user_name: currentUser.full_name || '', 
                        user_email: currentUser.email, 
                        platform: 'lets_go_nuts', 
                        subscription_tier: '',
                        has_nuts_and_bots: false,
                        includes_social_access: false,
                        tiktok_contact_id: ''
                      });
                    } else {
                      setNewUser({ user_name: '', user_email: '', platform: 'lets_go_nuts', subscription_tier: '', has_nuts_and_bots: false, includes_social_access: false, tiktok_contact_id: '' });
                    }
                    setShowAddUser(true);
                  }} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg border">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by name, email, or @username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Sort by Name</SelectItem>
                      <SelectItem value="email">Sort by Email</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                  <Select value={filters.platform} onValueChange={(v) => setFilters({ ...filters, platform: v })}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Platforms</SelectItem>
                      <SelectItem value="pixels_toolbox">Pixel's Toolbox</SelectItem>
                      <SelectItem value="lets_go_nuts">Let's Go Nuts</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.has_digital_twin} onValueChange={(v) => setFilters({ ...filters, has_digital_twin: v })}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Digital Twin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All (Twin)</SelectItem>
                      <SelectItem value="yes">Has Twin ✓</SelectItem>
                      <SelectItem value="no">No Twin</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.has_nuts_and_bots} onValueChange={(v) => setFilters({ ...filters, has_nuts_and_bots: v })}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Nuts & Bots" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All (N&B)</SelectItem>
                      <SelectItem value="yes">Has N&B ✓</SelectItem>
                      <SelectItem value="no">No N&B</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.includes_social_access} onValueChange={(v) => setFilters({ ...filters, includes_social_access: v })}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Social" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All (Social)</SelectItem>
                      <SelectItem value="yes">Has Social ✓</SelectItem>
                      <SelectItem value="no">No Social</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.has_thrive} onValueChange={(v) => setFilters({ ...filters, has_thrive: v })}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Thrive" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All (Thrive)</SelectItem>
                      <SelectItem value="yes">On Thrive ✓</SelectItem>
                      <SelectItem value="no">Not on Thrive</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.is_overdue} onValueChange={(v) => setFilters({ ...filters, is_overdue: v })}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="yes">Overdue ⚠️</SelectItem>
                      <SelectItem value="no">Current</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(searchQuery || Object.values(filters).some(f => f !== 'all')) && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setSearchQuery('');
                      setFilters({
                        platform: 'all',
                        has_digital_twin: 'all',
                        has_nuts_and_bots: 'all',
                        has_thrive: 'all',
                        is_overdue: 'all',
                        includes_social_access: 'all'
                      });
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>

              {usersLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  {platformUsers.length === 0 ? 'No platform assignments yet' : 'No users match your filters'}
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map(user => {
                    const linkedContact = getLinkedContact(user);
                    return (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{user.user_name || user.user_email}</p>
                            {linkedContact && (
                              <Badge variant="outline" className="text-xs">
                                <LinkIcon className="w-3 h-3 mr-1" />
                                @{linkedContact.tiktok_username || linkedContact.username}
                              </Badge>
                            )}
                            {hasThriveAccount(user.user_email) && (
                              <Badge className="text-xs bg-green-100 text-green-800">
                                Thrive ✓
                              </Badge>
                            )}
                            {isOverdue(user) && (
                              <Badge className="text-xs bg-orange-100 text-orange-800">
                                Overdue ⚠️
                              </Badge>
                            )}
                          </div>
                          {user.user_name && (
                            <p className="text-xs text-gray-500">{user.user_email}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {user.platform === 'pixels_toolbox' ? "Pixel's AI Toolbox" : "Let's Go Nuts"}
                            </Badge>
                            {user.subscription_tier && (
                              <Badge variant="secondary" className="text-xs">
                                {user.subscription_tier}
                              </Badge>
                            )}
                            {user.has_nuts_and_bots && (
                              <Badge className="text-xs bg-purple-100 text-purple-800">
                                Nuts & Bots ✓
                              </Badge>
                            )}
                            {user.has_digital_twin && (
                              <Badge className="text-xs bg-blue-100 text-blue-800">
                                Digital Twin ✓
                              </Badge>
                            )}
                            {user.includes_social_access && (
                              <Badge className="text-xs bg-teal-100 text-teal-800">
                                Social Suite ✓
                              </Badge>
                            )}
                            {user.renewal_date && (
                              <Badge variant="outline" className="text-xs">
                                Renews: {new Date(user.renewal_date).toLocaleDateString()}
                              </Badge>
                            )}
                            {user.subscription_status === 'past_due' && (
                              <Badge className="text-xs bg-red-100 text-red-800">
                                Past Due 💰
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingUser(user)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4 text-gray-400" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePlatformUserMutation.mutate(user.id)}
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Tool Dialog */}
      <Dialog open={showAddTool || !!editingTool} onOpenChange={() => { setShowAddTool(false); setEditingTool(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTool ? 'Edit' : 'Add'} AI Tool</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tool Name</Label>
                <Input
                  value={editingTool?.tool_name || newTool.tool_name}
                  onChange={(e) => editingTool 
                    ? setEditingTool({ ...editingTool, tool_name: e.target.value })
                    : setNewTool({ ...newTool, tool_name: e.target.value })
                  }
                  placeholder="Dreaming Nut"
                />
              </div>
              <div className="space-y-2">
                <Label>Emoji Icon (optional)</Label>
                <Input
                  value={editingTool?.icon_emoji || newTool.icon_emoji}
                  onChange={(e) => editingTool 
                    ? setEditingTool({ ...editingTool, icon_emoji: e.target.value })
                    : setNewTool({ ...newTool, icon_emoji: e.target.value })
                  }
                  placeholder="🎨"
                  maxLength={2}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Or Upload Custom Icon</Label>
              <ImageUploader
                label=""
                currentImage={editingTool?.icon_url || newTool.icon_url}
                onImageChange={(url) => editingTool
                  ? setEditingTool({ ...editingTool, icon_url: url })
                  : setNewTool({ ...newTool, icon_url: url })
                }
                size="small"
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <input
                type="checkbox"
                checked={editingTool?.is_general_tool || newTool.is_general_tool}
                onChange={(e) => editingTool
                  ? setEditingTool({ ...editingTool, is_general_tool: e.target.checked })
                  : setNewTool({ ...newTool, is_general_tool: e.target.checked })
                }
                className="w-4 h-4"
              />
              <div>
                <p className="font-medium text-purple-800 text-sm">General AI Tool (ChatGPT, Nano Banana)</p>
                <p className="text-xs text-purple-600">Uses custom URL instead of App ID</p>
              </div>
            </div>

            {!(editingTool?.is_general_tool || newTool.is_general_tool) && (
              <div className="space-y-2">
                <Label>App ID (Easy Mode! 🎉)</Label>
                <Input
                  value={editingTool?.app_id || newTool.app_id}
                  onChange={(e) => editingTool 
                    ? setEditingTool({ ...editingTool, app_id: e.target.value })
                    : setNewTool({ ...newTool, app_id: e.target.value })
                  }
                  placeholder="67cd0dd73abc87a85c9cbfea"
                />
                <p className="text-xs text-gray-500">
                  ✨ Just paste the App ID from the URL and we'll auto-generate both platform URLs!
                </p>
              </div>
            )}
            {(editingTool?.is_general_tool || newTool.is_general_tool) && (
              <div className="space-y-2">
                <Label>Tool URL</Label>
                <Input
                  value={editingTool?.pixels_toolbox_url || newTool.pixels_toolbox_url}
                  onChange={(e) => editingTool 
                    ? setEditingTool({ ...editingTool, pixels_toolbox_url: e.target.value })
                    : setNewTool({ ...newTool, pixels_toolbox_url: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
            )}

            {!(editingTool?.is_general_tool || newTool.is_general_tool) && (
              <details className="mt-4">
                <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                  Advanced: Override URLs manually
                </summary>
                <div className="space-y-2 mt-3 pl-4 border-l-2 border-gray-200">
                  <div className="space-y-2">
                    <Label>Custom Pixel's AI Toolbox URL (optional)</Label>
                    <Input
                      value={editingTool?.pixels_toolbox_url || newTool.pixels_toolbox_url}
                      onChange={(e) => editingTool 
                        ? setEditingTool({ ...editingTool, pixels_toolbox_url: e.target.value })
                        : setNewTool({ ...newTool, pixels_toolbox_url: e.target.value })
                      }
                      placeholder="Leave empty to use App ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Custom Let's Go Nuts URL (optional)</Label>
                    <Input
                      value={editingTool?.lets_go_nuts_url || newTool.lets_go_nuts_url}
                      onChange={(e) => editingTool 
                        ? setEditingTool({ ...editingTool, lets_go_nuts_url: e.target.value })
                        : setNewTool({ ...newTool, lets_go_nuts_url: e.target.value })
                      }
                      placeholder="Leave empty to use App ID"
                    />
                  </div>
                </div>
              </details>
            )}
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={editingTool?.sort_order || newTool.sort_order}
                onChange={(e) => editingTool 
                  ? setEditingTool({ ...editingTool, sort_order: parseInt(e.target.value) })
                  : setNewTool({ ...newTool, sort_order: parseInt(e.target.value) })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddTool(false); setEditingTool(null); }}>
              Cancel
            </Button>
            <Button 
              onClick={() => editingTool 
                ? updateToolMutation.mutate({ id: editingTool.id, data: editingTool })
                : createToolMutation.mutate(newTool)
              }
              disabled={!(editingTool?.tool_name || newTool.tool_name)}
            >
              {editingTool ? 'Save Changes' : 'Add Tool'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Platform User Dialog */}
      <Dialog open={showAddUser || !!editingUser} onOpenChange={() => { setShowAddUser(false); setEditingUser(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
          <div className="p-6 pb-2">
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit' : 'Add'} Platform User</DialogTitle>
            </DialogHeader>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 py-2">
            <div className="space-y-4">
            <div className="space-y-2">
              <Label>User Name</Label>
              <Input
                value={editingUser?.user_name || newUser.user_name}
                onChange={(e) => editingUser 
                  ? setEditingUser({ ...editingUser, user_name: e.target.value })
                  : setNewUser({ ...newUser, user_name: e.target.value })
                }
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label>User Email</Label>
              <Input
                type="email"
                value={editingUser?.user_email || newUser.user_email}
                onChange={(e) => editingUser 
                  ? setEditingUser({ ...editingUser, user_email: e.target.value })
                  : setNewUser({ ...newUser, user_email: e.target.value })
                }
                placeholder="user@example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>AI Platform</Label>
                <Select 
                  value={editingUser?.platform || newUser.platform}
                  onValueChange={(v) => editingUser 
                    ? setEditingUser({ ...editingUser, platform: v })
                    : setNewUser({ ...newUser, platform: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pixels_toolbox">Pixel's AI Toolbox</SelectItem>
                    <SelectItem value="lets_go_nuts">Let's Go Nuts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subscription Tier</Label>
                <Input
                  value={editingUser?.subscription_tier || newUser.subscription_tier}
                  onChange={(e) => editingUser 
                    ? setEditingUser({ ...editingUser, subscription_tier: e.target.value })
                    : setNewUser({ ...newUser, subscription_tier: e.target.value })
                  }
                  placeholder="Founding Member"
                />
              </div>
              <div className="space-y-2">
                <Label>Renewal Date</Label>
                <Input
                  type="date"
                  value={editingUser?.renewal_date || newUser.renewal_date || ''}
                  onChange={(e) => editingUser 
                    ? setEditingUser({ ...editingUser, renewal_date: e.target.value })
                    : setNewUser({ ...newUser, renewal_date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium text-purple-800">Has Nuts & Bots</Label>
                  <p className="text-xs text-purple-600 mt-1">Don't upsell Nuts & Bots to this user</p>
                </div>
                <Switch
                  checked={editingUser?.has_nuts_and_bots || newUser.has_nuts_and_bots}
                  onCheckedChange={(checked) => editingUser 
                    ? setEditingUser({ ...editingUser, has_nuts_and_bots: checked })
                    : setNewUser({ ...newUser, has_nuts_and_bots: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium text-blue-800">Has Digital Twin</Label>
                  <p className="text-xs text-blue-600 mt-1">User created a digital twin in AI tools</p>
                </div>
                <Switch
                  checked={editingUser?.has_digital_twin || newUser.has_digital_twin}
                  onCheckedChange={(checked) => editingUser 
                    ? setEditingUser({ ...editingUser, has_digital_twin: checked })
                    : setNewUser({ ...newUser, has_digital_twin: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium text-teal-800">Includes Social Media Suite</Label>
                  <p className="text-xs text-teal-600 mt-1">Grant access to TikTok features & creator tools</p>
                </div>
                <Switch
                  checked={editingUser?.includes_social_access || newUser.includes_social_access}
                  onCheckedChange={(checked) => editingUser 
                    ? setEditingUser({ ...editingUser, includes_social_access: checked })
                    : setNewUser({ ...newUser, includes_social_access: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="font-medium text-green-800">Trusted Creator</Label>
                  <p className="text-xs text-green-600 mt-1">Bypass approval for Pixel's Place submissions</p>
                </div>
                <Switch
                  checked={editingUser?.is_trusted_creator || newUser.is_trusted_creator}
                  onCheckedChange={(checked) => editingUser 
                    ? setEditingUser({ ...editingUser, is_trusted_creator: checked })
                    : setNewUser({ ...newUser, is_trusted_creator: checked })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center justify-between">
                <span>Link to Creator Contact (Optional)</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => refetchContacts()}
                  disabled={isRefetching}
                  className="h-7 text-xs font-semibold"
                >
                  {isRefetching ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      🔄 Refresh List ({tiktokContacts.length} total)
                    </>
                  )}
                </Button>
              </Label>
              <div className="space-y-2">
                <Input
                  placeholder="Search by @username, real name, display name, email..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  {!contactSearch ? (
                    <>Showing all {filteredContacts.length} contacts - type to search</>
                  ) : (
                    <>Found {filteredContacts.length} contact{filteredContacts.length !== 1 ? 's' : ''} matching "{contactSearch}"</>
                  )}
                </p>
                <Select
                  value={editingUser?.tiktok_contact_id || newUser.tiktok_contact_id || 'none'}
                  onValueChange={(v) => {
                    const value = v === 'none' ? '' : v;
                    editingUser 
                      ? setEditingUser({ ...editingUser, tiktok_contact_id: value })
                      : setNewUser({ ...newUser, tiktok_contact_id: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a contact..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    <SelectItem value="none">
                      <span className="text-gray-400">No contact linked</span>
                    </SelectItem>
                    {filteredContacts.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500">
                        {contactSearch ? (
                          <>
                            No contacts found matching "{contactSearch}"
                            <br />
                            <span className="text-xs">Try clicking Refresh ↑ or search differently</span>
                          </>
                        ) : (
                          <>No contacts in database. Click Refresh ↑</>
                        )}
                      </div>
                    ) : (
                      filteredContacts.slice(0, 500).map(contact => {
                        const username = contact.tiktok_username || contact.username || 'no-username';
                        const displayInfo = [
                          contact.real_name,
                          contact.display_name,
                          contact.nickname,
                          contact.email
                        ].filter(Boolean).join(' • ');
                        
                        return (
                          <SelectItem key={contact.id} value={contact.id}>
                            <div className="flex flex-col py-1">
                              <span className="font-medium">@{username}</span>
                              {displayInfo && <span className="text-xs text-gray-500">{displayInfo}</span>}
                            </div>
                          </SelectItem>
                        );
                      })
                    )}
                    {filteredContacts.length > 500 && (
                      <div className="p-2 text-xs text-orange-600 border-t bg-orange-50">
                        ⚠️ Showing first 500 of {filteredContacts.length} contacts. Use search to narrow down.
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {contactSearch && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <Button
                      size="sm"
                      onClick={() => {
                        setNewContactUsername(contactSearch.replace('@', ''));
                        setShowCreateContact(true);
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create new contact: @{contactSearch.replace('@', '')}
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Link this platform user to their creator contact card
              </p>
            </div>
            </div>
          </div>
          
          <div className="p-6 pt-2 border-t mt-auto">
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowAddUser(false); setEditingUser(null); }}>
                Cancel
              </Button>
              <Button 
                onClick={() => editingUser 
                  ? updatePlatformUserMutation.mutate({ id: editingUser.id, data: editingUser })
                  : createPlatformUserMutation.mutate(newUser)
                }
                disabled={!(editingUser?.user_email || newUser.user_email) || createPlatformUserMutation.isPending || updatePlatformUserMutation.isPending}
              >
                {editingUser ? 'Save Changes' : 'Add User'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create New Contact Dialog */}
      <Dialog open={showCreateContact} onOpenChange={setShowCreateContact}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Creator Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>TikTok Username</Label>
              <Input
                value={newContactUsername}
                onChange={(e) => setNewContactUsername(e.target.value.replace('@', ''))}
                placeholder="username (without @)"
              />
            </div>
            <p className="text-sm text-gray-600">
              This will create a basic contact card that you can fill out later in Creator Contacts.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateContact(false);
              setNewContactUsername('');
            }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (newContactUsername.trim()) {
                  createContactMutation.mutate({
                    tiktok_username: newContactUsername.trim(),
                    created_by: currentUser?.email
                  });
                }
              }}
              disabled={!newContactUsername.trim() || createContactMutation.isPending}
            >
              {createContactMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Contact'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}