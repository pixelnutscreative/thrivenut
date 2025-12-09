import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, GripVertical, ExternalLink, ChevronRight, Loader2, Save, RotateCcw } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const availableIcons = [
  'LayoutDashboard', 'Target', 'Heart', 'BookOpen', 'Settings', 'TrendingUp', 
  'Users', 'Video', 'Pill', 'Gift', 'Brain', 'Home', 'Bell', 'Share2', 
  'Music', 'Star', 'Lock', 'UserCog', 'Sparkles', 'Palette', 'Calendar',
  'MessageSquare', 'Zap', 'Award', 'Coffee', 'Smile', 'Sun', 'Moon',
  'Eye', 'Bookmark', 'HandMetal', 'PawPrint', 'Search', 'MousePointerClick',
  'Cross', 'FileText', 'StickyNote', 'Tablet', 'HelpCircle', 'MessageCircle'
];

const defaultMenuItems = [
  // Core (no header)
  { name: 'Dashboard', icon: 'LayoutDashboard', path: 'Dashboard', always_show: true, sort_order: 10 },
  { name: "Pixel's Place", icon: 'Sparkles', path: 'PixelsParadise', always_show: true, sort_order: 20 },
  
  // INDIGO: Life & Organization
  { name: '── Life & Organization ──', is_group_header: true, header_color: 'text-indigo-400', header_bg_color: 'bg-indigo-500/10', sort_order: 100 },
  { name: 'Tasks', icon: 'FileText', path: 'Tasks', module_id: 'tasks', sort_order: 110 },
  { name: 'Family Members', icon: 'Users', path: 'FamilyMembers', module_id: 'people', sort_order: 120 },
  { name: 'Work Schedules', icon: 'Briefcase', path: 'WorkSchedules', always_show: true, sort_order: 130 },
  { name: 'Cleaning Tasks', icon: 'Sparkles', path: 'CleaningTasks', always_show: true, sort_order: 140 },
  { name: 'Care Reminders', icon: 'Bell', path: 'CareReminders', module_id: 'care_reminders', sort_order: 150 },
  
  // TEAL: Goals & Growth
  { name: '── Goals & Growth ──', is_group_header: true, header_color: 'text-teal-400', header_bg_color: 'bg-teal-500/10', sort_order: 200 },
  { name: 'Goals', icon: 'Target', path: 'Goals', module_id: 'goals', sort_order: 210 },
  { name: 'Vision Board', icon: 'Eye', path: 'VisionBoard', module_id: 'goals', sort_order: 220 },
  { name: 'Saved Motivations', icon: 'Bookmark', path: 'SavedMotivations', always_show: true, sort_order: 230 },
  
  // PURPLE: Faith & Spiritual
  { name: '── Faith & Spiritual ──', is_group_header: true, header_color: 'text-purple-400', header_bg_color: 'bg-purple-500/10', sort_order: 300 },
  { name: 'Prayer Requests', icon: 'Heart', path: 'PrayerRequests', requires_bible_believer: true, sort_order: 310 },
  
  // PINK: Creator Suite
  { name: '── Creator Suite ──', is_group_header: true, header_color: 'text-pink-400', header_bg_color: 'bg-pink-500/10', sort_order: 400 },
  { name: 'Social Media Suite', icon: 'Share2', is_section: true, module_id: 'tiktok', requires_tiktok_access: true, sort_order: 410 },
  { name: 'Discover Creators', icon: 'Search', path: 'DiscoverCreators', parent_section: 'Social Media Suite', highlight: true, sort_order: 411 },
  { name: 'Creator Contacts', icon: 'Users', path: 'TikTokContacts', parent_section: 'Social Media Suite', sort_order: 412 },
  { name: 'Social Engagement', icon: 'MousePointerClick', path: 'TikTokEngagement', parent_section: 'Social Media Suite', sort_order: 413 },
  { name: 'Content Calendar', icon: 'Calendar', path: 'LiveSchedule', parent_section: 'Social Media Suite', sort_order: 414 },
  { name: 'Sunny Songbird', icon: 'Sun', path: 'SongGenerator', parent_section: 'Social Media Suite', sort_order: 415 },
  { name: 'Gift Gallery Gratitude', icon: 'Gift', path: 'WeeklyGifterGallery', parent_section: 'Social Media Suite', sort_order: 416 },
  { name: 'Love Away Giveaways', icon: 'Gift', path: 'LoveAway', parent_section: 'Social Media Suite', requires_tiktok_access: true, sort_order: 417 },
  { name: 'Pictionary Helper', icon: 'Palette', path: 'PictionaryHelper', parent_section: 'Social Media Suite', always_show: true, sort_order: 418 },
  { name: 'Music & Songs', icon: 'Music', is_section: true, sort_order: 420 },
  { name: 'Holy Hitmakers', icon: 'Cross', path: 'HolyHitmakers', parent_section: 'Music & Songs', sort_order: 421 },
  { name: "Ping & Pong's Silly Songs", icon: 'Smile', external_url: 'https://sillysongs.pixelnutscreative.com', parent_section: 'Music & Songs', sort_order: 422 },
  
  // GREEN: Wellness & Health
  { name: '── Wellness & Health ──', is_group_header: true, header_color: 'text-green-400', header_bg_color: 'bg-green-500/10', sort_order: 500 },
  { name: 'Daily Wellness', icon: 'Heart', path: 'Wellness', module_id: 'wellness', sort_order: 510 },
  { name: 'Mental Health', icon: 'Brain', is_section: true, module_id: 'mental_health', sort_order: 520 },
  { name: 'Mental Health Hub', icon: 'Brain', path: 'NeurodivergentSettings', parent_section: 'Mental Health', sort_order: 521 },
  { name: 'Journal', icon: 'FileText', path: 'Journal', parent_section: 'Mental Health', module_id: 'journal', sort_order: 522 },
  { name: 'Quick Notes', icon: 'StickyNote', path: 'QuickNotes', parent_section: 'Mental Health', sort_order: 523 },
  { name: 'Supplements', icon: 'Tablet', path: 'Supplements', module_id: 'supplements', sort_order: 530 },
  { name: 'Medications', icon: 'Pill', path: 'Medications', module_id: 'medications', sort_order: 540 },
  { name: 'Pet Care', icon: 'PawPrint', path: 'PetCare', module_id: 'pets', sort_order: 550 },
  
  // Special items
  { name: 'SuperFan Access', icon: 'Star', path: 'SuperFanAccess', show_when_no_tiktok_access: true, sort_order: 800 },
  { name: 'Support', icon: 'HelpCircle', path: 'Support', always_show: true, sort_order: 900 },
  { name: 'Admin Panel', icon: 'UserCog', path: 'Admin', admin_only: true, sort_order: 999 },
];

export default function AdminMenuContent() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: 'Star',
    path: '',
    external_url: '',
    parent_section: '',
    is_section: false,
    is_group_header: false,
    header_color: 'text-purple-400',
    header_bg_color: 'bg-purple-500/10',
    module_id: '',
    requires_tiktok_access: false,
    requires_bible_believer: false,
    admin_only: false,
    always_show: false,
    show_when_no_tiktok_access: false,
    highlight: false,
    sort_order: 100,
    is_active: true
  });

  const { data: menuItems = [], isLoading } = useQuery({
    queryKey: ['menuConfig'],
    queryFn: () => base44.entities.MenuConfig.list('sort_order'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MenuConfig.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuConfig'] });
      setShowModal(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MenuConfig.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuConfig'] });
      setShowModal(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MenuConfig.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menuConfig'] })
  });

  const initializeDefaultsMutation = useMutation({
    mutationFn: async () => {
      // Delete all existing
      for (const item of menuItems) {
        await base44.entities.MenuConfig.delete(item.id);
      }
      // Create defaults
      for (const item of defaultMenuItems) {
        await base44.entities.MenuConfig.create({ ...item, is_active: true });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['menuConfig'] })
  });

  const resetForm = () => {
    setFormData({
      name: '',
      icon: 'Star',
      path: '',
      external_url: '',
      parent_section: '',
      is_section: false,
      is_group_header: false,
      header_color: 'text-purple-400',
      header_bg_color: 'bg-purple-500/10',
      module_id: '',
      requires_tiktok_access: false,
      requires_bible_believer: false,
      admin_only: false,
      always_show: false,
      show_when_no_tiktok_access: false,
      highlight: false,
      sort_order: 100,
      is_active: true
    });
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      icon: item.icon || 'Star',
      path: item.path || '',
      external_url: item.external_url || '',
      parent_section: item.parent_section || '',
      is_section: item.is_section || false,
      is_group_header: item.is_group_header || false,
      header_color: item.header_color || 'text-purple-400',
      header_bg_color: item.header_bg_color || 'bg-purple-500/10',
      module_id: item.module_id || '',
      requires_tiktok_access: item.requires_tiktok_access || false,
      requires_bible_believer: item.requires_bible_believer || false,
      admin_only: item.admin_only || false,
      always_show: item.always_show || false,
      show_when_no_tiktok_access: item.show_when_no_tiktok_access || false,
      highlight: item.highlight || false,
      sort_order: item.sort_order || 100,
      is_active: item.is_active !== false
    });
    setShowModal(true);
  };

  const handleSubmit = () => {
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const [pendingChanges, setPendingChanges] = useState([]);
  const [localItems, setLocalItems] = useState([]);

  // Sync local items when menuItems changes
  React.useEffect(() => {
    if (menuItems.length > 0 && localItems.length === 0) {
      setLocalItems(menuItems);
    }
  }, [menuItems]);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(localItems.length > 0 ? localItems : menuItems);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update local state and track changes
    const updatedItems = items.map((item, index) => ({
      ...item,
      sort_order: (index + 1) * 10
    }));
    setLocalItems(updatedItems);
    setPendingChanges(updatedItems);
  };

  const saveAllChangesMutation = useMutation({
    mutationFn: async () => {
      for (const item of pendingChanges) {
        await base44.entities.MenuConfig.update(item.id, { sort_order: item.sort_order });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuConfig'] });
      setPendingChanges([]);
    }
  });

  const sections = menuItems.filter(i => i.is_section);

  if (isLoading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Menu Configuration</CardTitle>
              <CardDescription>Add, edit, and reorder menu items</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  if (confirm('This will delete all current menu items and load the default structure. Continue?')) {
                    initializeDefaultsMutation.mutate();
                  }
                }}
                disabled={initializeDefaultsMutation.isPending}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {menuItems.length === 0 ? 'Load Defaults' : 'Reset to Defaults'}
              </Button>
              {pendingChanges.length > 0 && (
                <Button 
                  onClick={() => saveAllChangesMutation.mutate()}
                  disabled={saveAllChangesMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saveAllChangesMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Order ({pendingChanges.length} changes)
                </Button>
              )}
              <Button onClick={() => { resetForm(); setShowModal(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {menuItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No menu items configured. Click "Load Defaults" to initialize with default menu structure.
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="menu-items">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                    {(localItems.length > 0 ? localItems : menuItems).map((item, index) => (
                      <Draggable key={item.id} draggableId={item.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center gap-3 p-3 rounded-lg border ${
                              snapshot.isDragging ? 'bg-blue-50 border-blue-300' : 'bg-white'
                            } ${!item.is_active ? 'opacity-50' : ''} ${
                              item.parent_section ? 'ml-8' : ''
                            }`}
                          >
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{item.name}</span>
                                {item.is_section && <Badge variant="outline">Section</Badge>}
                                {item.external_url && <ExternalLink className="w-3 h-3 text-gray-400" />}
                                {item.admin_only && <Badge className="bg-red-100 text-red-700">Admin</Badge>}
                                {item.always_show && <Badge className="bg-green-100 text-green-700">Always</Badge>}
                                {item.requires_tiktok_access && <Badge className="bg-purple-100 text-purple-700">TikTok</Badge>}
                              </div>
                              <div className="text-xs text-gray-500">
                                {item.path && `Page: ${item.path}`}
                                {item.external_url && `URL: ${item.external_url}`}
                                {item.parent_section && ` • Parent: ${item.parent_section}`}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => handleEdit(item)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="text-red-500"
                                onClick={() => deleteMutation.mutate(item.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Menu item name"
                />
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select value={formData.icon} onValueChange={(v) => setFormData({ ...formData, icon: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {availableIcons.map(icon => (
                      <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Internal Page Path</Label>
                <Input
                  value={formData.path}
                  onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                  placeholder="e.g., Dashboard"
                />
              </div>
              <div className="space-y-2">
                <Label>External URL</Label>
                <Input
                  value={formData.external_url}
                  onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Parent Section</Label>
                <Select 
                  value={formData.parent_section || 'none'} 
                  onValueChange={(v) => setFormData({ ...formData, parent_section: v === 'none' ? '' : v })}
                >
                  <SelectTrigger><SelectValue placeholder="None (top level)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (top level)</SelectItem>
                    {sections.map(s => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 100 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Module ID (for feature toggle)</Label>
              <Input
                value={formData.module_id}
                onChange={(e) => setFormData({ ...formData, module_id: e.target.value })}
                placeholder="e.g., tiktok, goals, wellness"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label>Is Section (collapsible)</Label>
                <Switch checked={formData.is_section} onCheckedChange={(v) => setFormData({ ...formData, is_section: v })} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Is Group Header</Label>
                <Switch checked={formData.is_group_header} onCheckedChange={(v) => setFormData({ ...formData, is_group_header: v })} />
              </div>
            </div>

            {formData.is_group_header && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Header Text Color</Label>
                  <Select value={formData.header_color} onValueChange={(v) => setFormData({ ...formData, header_color: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text-purple-400">Purple</SelectItem>
                      <SelectItem value="text-pink-400">Pink</SelectItem>
                      <SelectItem value="text-amber-400">Amber</SelectItem>
                      <SelectItem value="text-green-400">Green</SelectItem>
                      <SelectItem value="text-blue-400">Blue</SelectItem>
                      <SelectItem value="text-indigo-400">Indigo</SelectItem>
                      <SelectItem value="text-teal-400">Teal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Header Background</Label>
                  <Select value={formData.header_bg_color} onValueChange={(v) => setFormData({ ...formData, header_bg_color: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bg-purple-500/10">Purple</SelectItem>
                      <SelectItem value="bg-pink-500/10">Pink</SelectItem>
                      <SelectItem value="bg-amber-500/10">Amber</SelectItem>
                      <SelectItem value="bg-green-500/10">Green</SelectItem>
                      <SelectItem value="bg-blue-500/10">Blue</SelectItem>
                      <SelectItem value="bg-indigo-500/10">Indigo</SelectItem>
                      <SelectItem value="bg-teal-500/10">Teal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label>Always Show</Label>
                <Switch checked={formData.always_show} onCheckedChange={(v) => setFormData({ ...formData, always_show: v })} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Highlight</Label>
                <Switch checked={formData.highlight} onCheckedChange={(v) => setFormData({ ...formData, highlight: v })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label>Admin Only</Label>
                <Switch checked={formData.admin_only} onCheckedChange={(v) => setFormData({ ...formData, admin_only: v })} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Requires TikTok Access</Label>
                <Switch checked={formData.requires_tiktok_access} onCheckedChange={(v) => setFormData({ ...formData, requires_tiktok_access: v })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch checked={formData.is_active} onCheckedChange={(v) => setFormData({ ...formData, is_active: v })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!formData.name || createMutation.isPending || updateMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {editingItem ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}