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

export default function AdminAIToolsContent() {
  const queryClient = useQueryClient();
  const [showAddTool, setShowAddTool] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingTool, setEditingTool] = useState(null);
  const [newTool, setNewTool] = useState({
    tool_name: '',
    pixels_toolbox_url: '',
    lets_go_nuts_url: '',
    icon_emoji: '',
    icon_url: '',
    is_general_tool: false,
    sort_order: 100
  });
  const [newUser, setNewUser] = useState({ user_email: '', platform: 'lets_go_nuts' });

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

  const createToolMutation = useMutation({
    mutationFn: (data) => base44.entities.AIToolLink.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiToolLinks'] });
      setShowAddTool(false);
      setNewTool({ tool_name: '', pixels_toolbox_url: '', lets_go_nuts_url: '', icon_emoji: '', icon_url: '', is_general_tool: false, sort_order: 100 });
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

  const createUserMutation = useMutation({
    mutationFn: (data) => base44.entities.AIPlatformUser.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platformUsers'] });
      setShowAddUser(false);
      setNewUser({ user_email: '', platform: 'lets_go_nuts' });
    },
  });

  const deleteUserMutation = useMutation({
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
                <Button onClick={() => setShowAddUser(true)} size="sm">
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
                        <p className="font-medium">{user.user_email}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {user.platform === 'pixels_toolbox' ? "Pixel's AI Toolbox" : "Let's Go Nuts"}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteUserMutation.mutate(user.id)}
                        className="text-red-400 hover:text-red-600"
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
                <p className="text-xs text-purple-600">Same URL for both platforms - only fill Pixel's URL field</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{(editingTool?.is_general_tool || newTool.is_general_tool) ? 'Tool URL' : "Pixel's AI Toolbox URL"}</Label>
              <Input
                value={editingTool?.pixels_toolbox_url || newTool.pixels_toolbox_url}
                onChange={(e) => editingTool 
                  ? setEditingTool({ ...editingTool, pixels_toolbox_url: e.target.value })
                  : setNewTool({ ...newTool, pixels_toolbox_url: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
            {!(editingTool?.is_general_tool || newTool.is_general_tool) && (
              <div className="space-y-2">
                <Label>Let's Go Nuts URL</Label>
                <Input
                  value={editingTool?.lets_go_nuts_url || newTool.lets_go_nuts_url}
                  onChange={(e) => editingTool 
                    ? setEditingTool({ ...editingTool, lets_go_nuts_url: e.target.value })
                    : setNewTool({ ...newTool, lets_go_nuts_url: e.target.value })
                  }
                  placeholder="https://create.letsgonuts.ai/..."
                />
              </div>
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

      {/* Add User Dialog */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign User to Platform</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>User Email</Label>
              <Input
                type="email"
                value={newUser.user_email}
                onChange={(e) => setNewUser({ ...newUser, user_email: e.target.value })}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>AI Platform</Label>
              <Select value={newUser.platform} onValueChange={(v) => setNewUser({ ...newUser, platform: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pixels_toolbox">Pixel's AI Toolbox</SelectItem>
                  <SelectItem value="lets_go_nuts">Let's Go Nuts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddUser(false)}>Cancel</Button>
            <Button 
              onClick={() => createUserMutation.mutate(newUser)}
              disabled={!newUser.user_email || createUserMutation.isPending}
            >
              Add User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}