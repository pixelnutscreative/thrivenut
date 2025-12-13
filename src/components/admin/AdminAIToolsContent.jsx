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
import { Plus, Trash2, Edit, Image, Users, Loader2, Upload } from 'lucide-react';
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
    includes_social_access: false
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
      setNewUser({ user_name: '', user_email: '', platform: 'lets_go_nuts', subscription_tier: '', includes_social_access: false });
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
                  Platform Assignments
                </CardTitle>
                <Button onClick={() => {
                  // Pre-populate with current user's email if not already assigned
                  if (currentUser?.email && !currentUserAssignment) {
                    setNewUser({ 
                      user_name: currentUser.full_name || '', 
                      user_email: currentUser.email, 
                      platform: 'lets_go_nuts', 
                      subscription_tier: '',
                      includes_social_access: false
                    });
                  } else {
                    setNewUser({ user_name: '', user_email: '', platform: 'lets_go_nuts', subscription_tier: '', includes_social_access: false });
                  }
                  setShowAddUser(true);
                }} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-purple-600" />
                </div>
              ) : platformUsers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No platform assignments yet</p>
              ) : (
                <div className="space-y-2">
                  {platformUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div>
                        <p className="font-medium">{user.user_name || user.user_email}</p>
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
                          {user.includes_social_access && (
                            <Badge className="text-xs bg-teal-100 text-teal-800">
                              Social Suite ✓
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
                  ))}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit' : 'Add'} Platform User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
              {currentUser?.email && (editingUser?.user_email === currentUser.email || newUser.user_email === currentUser.email) && !currentUserAssignment && (
                <p className="text-xs text-purple-600">
                  ℹ️ Pre-populated with your email. You can change it if needed.
                </p>
              )}
            </div>
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
                placeholder="e.g., Founding Member, PLUS AI"
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-teal-50 border border-teal-200 rounded-lg">
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
          </div>
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
        </DialogContent>
      </Dialog>
    </div>
  );
}