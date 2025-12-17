import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import ColorPicker from '../shared/ColorPicker';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Zap, Droplet, Smile, Utensils, Lightbulb, Cloud, StickyNote, Heart, Home, Music, Link, ExternalLink,
  CheckCircle, Calendar, Mail, Phone, MessageSquare, Send, Inbox, Star, Bookmark, Flag, Bell, Gift,
  ShoppingCart, ShoppingBag, CreditCard, DollarSign, Target, Trophy, Award, TrendingUp, Activity,
  BarChart, PieChart, LineChart, Users, User, UserPlus, UserCheck, Camera, Video, Film, Image, Tv,
  Headphones, Coffee, Pizza, Apple, Sandwich, Cookie, Beer, Book, BookOpen, FileText, File, Folder,
  FolderOpen, Archive, Clipboard, Edit, PenTool, Feather, Palette, Paintbrush, Scissors, Copy, Save,
  Download, Upload, Share, Share2, Globe, MapPin, Map, Navigation, Compass, Plane, Car, Bus, Briefcase,
  Package, Tag, Hash, AtSign, Percent, CloudRain, Sun, Moon, CloudSnow, Umbrella, Wind, Thermometer,
  Droplets, Waves, Mountain, Trees, Leaf, Flower, Sparkles, Flame, Battery, BatteryCharging, Bluetooth,
  Wifi, Radio, Signal, Lock, Unlock, Key, Shield, Eye, EyeOff, Search, Filter, Settings, Sliders, Volume,
  Volume2, VolumeX, Mic, MicOff, Play, Pause, SkipForward, SkipBack, FastForward, Rewind, Repeat, Shuffle,
  Clock, Timer, Hourglass, Watch, AlarmClock, Sunrise, Sunset, Cat, Dog, Fish, Bike, Dumbbell, Footprints,
  Hand, ThumbsUp, ThumbsDown, Laugh, Frown, Brain, Pill, Cross, Plus, Minus, X, Check, Anchor,
  Rocket, Ship, Train, Truck, Building, Store, Factory, Tent, PawPrint, Bone, Gamepad, Monitor, Laptop,
  Smartphone, Tablet, Printer, Keyboard, Mouse, Megaphone, Speaker, Podcast, Instagram, Twitter, Facebook,
  Youtube, Linkedin, Github, Chrome, Command, Code, Terminal, Database, Server, HardDrive, CloudUpload,
  Wallet, Coins, Banknote, Receipt, Calculator, Landmark, PiggyBank, Hammer, Wrench, Brush, Ruler, Sword,
  GripVertical, Trash2, MonitorPlay, Menu
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const iconMap = {
  Zap, Droplet, Smile, Utensils, Lightbulb, Cloud, StickyNote, Heart, Home, Music, Link, ExternalLink,
  CheckCircle, Calendar, Mail, Phone, MessageSquare, Send, Inbox, Star, Bookmark, Flag, Bell, Gift,
  ShoppingCart, ShoppingBag, CreditCard, DollarSign, Target, Trophy, Award, TrendingUp, Activity,
  BarChart, PieChart, LineChart, Users, User, UserPlus, UserCheck, Camera, Video, Film, Image, Tv,
  Headphones, Coffee, Pizza, Apple, Sandwich, Cookie, Beer, Book, BookOpen, FileText, File, Folder,
  FolderOpen, Archive, Clipboard, Edit, PenTool, Feather, Palette, Paintbrush, Scissors, Copy, Save,
  Download, Upload, Share, Share2, Globe, MapPin, Map, Navigation, Compass, Plane, Car, Bus, Briefcase,
  Package, Tag, Hash, AtSign, Percent, CloudRain, Sun, Moon, CloudSnow, Umbrella, Wind, Thermometer,
  Droplets, Waves, Mountain, Trees, Leaf, Flower, Sparkles, Flame, Battery, BatteryCharging, Bluetooth,
  Wifi, Radio, Signal, Lock, Unlock, Key, Shield, Eye, EyeOff, Search, Filter, Settings, Sliders, Volume,
  Volume2, VolumeX, Mic, MicOff, Play, Pause, SkipForward, SkipBack, FastForward, Rewind, Repeat, Shuffle,
  Clock, Timer, Hourglass, Watch, AlarmClock, Sunrise, Sunset, Cat, Dog, Fish, Bike, Dumbbell, Footprints,
  Hand, ThumbsUp, ThumbsDown, Laugh, Frown, Brain, Pill, Cross, Plus, Minus, Check, Anchor,
  Rocket, Ship, Train, Truck, Building, Store, Factory, Tent, PawPrint, Bone, Gamepad, Monitor, Laptop,
  Smartphone, Tablet, Printer, Keyboard, Mouse, Megaphone, Speaker, Podcast, Instagram, Twitter, Facebook,
  Youtube, Linkedin, Github, Chrome, Command, Code, Terminal, Database, Server, HardDrive, CloudUpload,
  Wallet, Coins, Banknote, Receipt, Calculator, Landmark, PiggyBank, Hammer, Wrench, Brush, Ruler, Sword
};

const iconLibrary = Object.keys(iconMap);

const builtInActions = [
  { id: 'mood', label: 'Mood', icon: 'Smile', color: '#EC4899' },
  { id: 'water', label: 'Water', icon: 'Droplet', color: '#06B6D4' },
  { id: 'food', label: 'Food', icon: 'Utensils', color: '#F97316' },
  { id: 'note', label: 'Note', icon: 'StickyNote', color: '#EAB308' },
  { id: 'idea', label: 'Idea', icon: 'Lightbulb', color: '#A855F7' },
  { id: 'gratitude', label: 'Gratitude', icon: 'Heart', color: '#EF4444' },
  { id: 'negative_thought', label: 'Reframe', icon: 'Cloud', color: '#10B981' },
  { id: 'task', label: 'Task', icon: 'Check', color: '#3B82F6' },
  { id: 'event', label: 'Add Event', icon: 'Calendar', color: '#F59E0B' },
];

const defaultMoodOptions = [
  { emoji: '😄', label: 'Great', value: 'great' },
  { emoji: '🙂', label: 'Good', value: 'good' },
  { emoji: '😐', label: 'Okay', value: 'okay' },
  { emoji: '😔', label: 'Low', value: 'low' },
  { emoji: '😰', label: 'Anxious', value: 'anxious' },
  { emoji: '😡', label: 'Angry', value: 'angry' },
  { emoji: '😢', label: 'Sad', value: 'sad' },
  { emoji: '🥰', label: 'Loved', value: 'loved' },
  { emoji: '💪', label: 'Motivated', value: 'motivated' },
  { emoji: '😴', label: 'Tired', value: 'tired' },
];

export default function WidgetSettingsV2({ formData, setFormData }) {
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [newAction, setNewAction] = useState({ label: '', icon: 'Home', page: '', external_url: '', color: 'bg-teal-500' });
  const [editingAction, setEditingAction] = useState(null);
  const [iconSearch, setIconSearch] = useState('');
  const [newEmoji, setNewEmoji] = useState('');
  const [newLabel, setNewLabel] = useState('');

  const quickActions = formData.quick_actions || ['mood', 'water', 'food', 'note'];
  const customActions = formData.custom_quick_actions || [];
  const barColor = formData.quick_actions_bar_color || 'rgba(255, 255, 255, 0.9)';
  const iconSize = formData.quick_actions_icon_size || 'medium';
  const barHeight = formData.quick_actions_bar_height || 'standard';

  const filteredIcons = iconLibrary.filter(icon => icon.toLowerCase().includes(iconSearch.toLowerCase()));

  const handleToggleAction = (actionId) => {
    const newActions = quickActions.includes(actionId) ? quickActions.filter(a => a !== actionId) : [...quickActions, actionId];
    setFormData({ ...formData, quick_actions: newActions });
  };

  const handleAddCustomAction = () => {
    if (!newAction.label) return;
    const id = `custom_${Date.now()}`;
    setFormData({ 
      ...formData, 
      custom_quick_actions: [...customActions, { ...newAction, id }],
      quick_actions: [...quickActions, id]
    });
    setNewAction({ label: '', icon: 'Home', page: '', external_url: '', color: 'bg-teal-500' });
    setShowAddCustom(false);
    setIconSearch('');
  };

  const handleRemoveCustomAction = (actionId) => {
    setFormData({
      ...formData,
      custom_quick_actions: customActions.filter(a => a.id !== actionId),
      quick_actions: quickActions.filter(a => a !== actionId)
    });
  };

  const handleSaveEdit = () => {
    if (!editingAction) return;
    const isBuiltIn = builtInActions.find(a => a.id === editingAction.id);
    if (isBuiltIn) {
      const overrides = formData.action_overrides || {};
      overrides[editingAction.id] = { label: editingAction.label, color: editingAction.color };
      setFormData({ ...formData, action_overrides: overrides });
    } else {
      setFormData({ ...formData, custom_quick_actions: customActions.map(a => a.id === editingAction.id ? editingAction : a) });
    }
    setEditingAction(null);
    setIconSearch('');
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(quickActions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setFormData({ ...formData, quick_actions: items });
  };

  const getIconComponent = (iconName) => iconMap[iconName] || Zap;

  const getActionDisplay = (actionId) => {
    const builtIn = builtInActions.find(a => a.id === actionId);
    const custom = customActions.find(a => a.id === actionId);
    const action = builtIn || custom;
    if (!action) return null;
    const overrides = formData.action_overrides?.[actionId] || {};
    return { ...action, label: overrides.label || action.label, color: overrides.color || action.color, isBuiltIn: !!builtIn };
  };

  const customMoods = formData.custom_mood_options || [];
  const allMoods = [...defaultMoodOptions, ...customMoods];
  const topMoods = formData.top_mood_emojis || allMoods.slice(0, 7).map(m => m.value);

  const toggleTopMood = (value) => {
    const current = [...topMoods];
    if (current.includes(value)) {
      if (current.length > 1) setFormData({ ...formData, top_mood_emojis: current.filter(v => v !== value) });
    } else {
      if (current.length < 7) setFormData({ ...formData, top_mood_emojis: [...current, value] });
    }
  };

  const addCustomMood = () => {
    if (!newEmoji.trim() || !newLabel.trim()) return;
    const value = newLabel.toLowerCase().replace(/\s+/g, '_');
    setFormData({
      ...formData,
      custom_mood_options: [...customMoods, { emoji: newEmoji, label: newLabel, value, isCustom: true }],
      top_mood_emojis: topMoods.length < 7 ? [...topMoods, value] : topMoods
    });
    setNewEmoji('');
    setNewLabel('');
  };

  const activeService = formData.active_music_service || 'soundcloud';
  const position = formData.soundcloud_player_position || 'hidden';

  return (
    <div className="space-y-6">
      {/* Consolidated Quick Actions Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Quick Actions Bar</CardTitle>
            <CardDescription>Configure appearance, layout, and shortcuts</CardDescription>
          </div>
          <Dialog open={showAddCustom} onOpenChange={setShowAddCustom}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1">
                <Plus className="w-4 h-4" /> Add Custom
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Custom Shortcut</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Label *</Label>
                  <Input value={newAction.label} onChange={(e) => setNewAction({ ...newAction, label: e.target.value })} placeholder="Gmail, ChatGPT, My Calendar, Notion..." />
                </div>
                <div>
                  <Label>Icon *</Label>
                  <Input placeholder="Search icons..." value={iconSearch} onChange={(e) => setIconSearch(e.target.value)} className="mb-2" />
                  <div className="grid grid-cols-8 gap-1 max-h-60 overflow-y-auto p-2 border rounded-lg">
                    {filteredIcons.slice(0, 200).map(iconName => {
                      const Icon = iconMap[iconName];
                      return (
                        <button key={iconName} type="button" onClick={() => setNewAction({ ...newAction, icon: iconName })} className={`p-2 rounded border-2 hover:border-purple-400 ${newAction.icon === iconName ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`} title={iconName}>
                          <Icon className="w-5 h-5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <Label>Color</Label>
                  <div className="mt-2">
                    <ColorPicker color={newAction.color} onChange={(c) => setNewAction({ ...newAction, color: c })} label="Select Icon Color" />
                  </div>
                </div>
                <div>
                  <Label>Link to Page</Label>
                  <Select value={newAction.page || ''} onValueChange={(v) => setNewAction({ ...newAction, page: v, external_url: '' })}>
                    <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>None</SelectItem>
                      <SelectItem value="Dashboard">Dashboard</SelectItem>
                      <SelectItem value="Goals">Goals</SelectItem>
                      <SelectItem value="Tasks">Tasks</SelectItem>
                      <SelectItem value="Journal">Journal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Or External URL</Label>
                  <Input value={newAction.external_url} onChange={(e) => setNewAction({ ...newAction, external_url: e.target.value, page: '' })} placeholder="https://..." />
                </div>
                <Button onClick={handleAddCustomAction} className="w-full" disabled={!newAction.label}>Add Shortcut</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Configuration Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg border">
            <div>
              <Label className="text-xs mb-1.5 block">Bar Color</Label>
              <ColorPicker 
                color={barColor.startsWith('rgba') || barColor.startsWith('rgb') ? '#ffffff' : barColor} 
                onChange={(c) => setFormData({ ...formData, quick_actions_bar_color: c })} 
                label="Pick Color"
                className="w-full justify-start"
              />
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Icon Size</Label>
              <Select value={iconSize} onValueChange={(v) => setFormData({ ...formData, quick_actions_icon_size: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="xl">XL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1.5 block">Bar Height</Label>
              <Select value={barHeight} onValueChange={(v) => setFormData({ ...formData, quick_actions_bar_height: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="compact">Compact</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="tall">Tall</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end pb-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="hideLabels" 
                  checked={formData.hide_quick_action_labels}
                  onCheckedChange={(checked) => setFormData({ ...formData, hide_quick_action_labels: checked })}
                />
                <Label htmlFor="hideLabels" className="cursor-pointer text-sm">Hide Labels</Label>
              </div>
            </div>
          </div>

          {/* Active Items List (Draggable) */}
          <div>
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Active Actions (Drag to reorder)</Label>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="quick-actions" direction="horizontal">
                {(provided) => (
                  <div 
                    {...provided.droppableProps} 
                    ref={provided.innerRef} 
                    className="flex flex-wrap gap-2 p-3 bg-white rounded-xl border border-gray-200 min-h-[80px] items-center"
                    style={{ backgroundColor: barColor }}
                  >
                    {quickActions.map((actionId, index) => {
                      const action = getActionDisplay(actionId);
                      if (!action) return null;
                      const Icon = getIconComponent(action.icon);
                      const isTailwind = action.color?.startsWith('bg-');
                      const style = isTailwind ? {} : { backgroundColor: action.color };
                      const colorClass = isTailwind ? action.color : '';

                      return (
                        <Draggable key={actionId} draggableId={actionId} index={index}>
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef} 
                              {...provided.draggableProps} 
                              {...provided.dragHandleProps} 
                              className={`group relative flex flex-col items-center justify-center p-2 rounded-lg transition-all ${snapshot.isDragging ? 'shadow-lg scale-110 z-50 bg-white ring-2 ring-purple-400' : 'hover:bg-white/50'}`}
                            >
                              <div className="absolute -top-2 -right-2 hidden group-hover:flex gap-1 z-10 bg-white rounded-full shadow-sm p-0.5">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setEditingAction({ ...action }); }} 
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-gray-500 hover:text-purple-600 hover:bg-purple-50"
                                  title="Edit"
                                >
                                  <Settings className="w-3 h-3" />
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleToggleAction(actionId); }} 
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-50"
                                  title="Remove"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>

                              <div 
                                className={`w-10 h-10 rounded-lg shadow-sm flex items-center justify-center mb-1 text-white ${colorClass}`}
                                style={style}
                              >
                                <Icon className="w-5 h-5" />
                              </div>
                              {!formData.hide_quick_action_labels && (
                                <span className="text-[10px] font-medium text-gray-600 max-w-[60px] truncate">{action.label}</span>
                              )}
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                    {quickActions.length === 0 && (
                      <div className="w-full text-center text-sm text-gray-400 py-4">
                        No active actions. Click icons below to add.
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          {/* Available Items */}
          <div>
            <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Available to Add</Label>
            <div className="flex flex-wrap gap-2">
              {builtInActions.filter(a => !quickActions.includes(a.id)).map(action => {
                const Icon = getIconComponent(action.icon);
                return (
                  <button 
                    key={action.id} 
                    onClick={() => handleToggleAction(action.id)} 
                    className="flex items-center gap-2 p-2 pr-3 rounded-lg border border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm transition-all group"
                  >
                    <div className={`w-6 h-6 rounded ${action.color} flex items-center justify-center`}>
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs font-medium text-gray-700">{action.label}</span>
                    <Plus className="w-3 h-3 text-gray-300 group-hover:text-purple-500 ml-1" />
                  </button>
                );
              })}
              {customActions.filter(a => !quickActions.includes(a.id)).map(action => {
                const Icon = getIconComponent(action.icon);
                const isTailwind = action.color?.startsWith('bg-');
                const style = isTailwind ? {} : { backgroundColor: action.color };
                const colorClass = isTailwind ? action.color : '';

                return (
                  <div key={action.id} className="relative group">
                     <button 
                      onClick={() => handleToggleAction(action.id)} 
                      className="flex items-center gap-2 p-2 pr-3 rounded-lg border border-gray-200 bg-white hover:border-purple-300 hover:shadow-sm transition-all"
                    >
                      <div 
                        className={`w-6 h-6 rounded flex items-center justify-center text-white ${colorClass}`}
                        style={style}
                      >
                        <Icon className="w-3 h-3" />
                      </div>
                      <span className="text-xs font-medium text-gray-700">{action.label}</span>
                      <Plus className="w-3 h-3 text-gray-300 group-hover:text-purple-500 ml-1" />
                    </button>
                    <div className="absolute -top-2 -right-2 hidden group-hover:flex gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingAction({ ...action }); }} 
                        className="w-5 h-5 bg-white rounded-full shadow border flex items-center justify-center text-gray-500 hover:text-purple-600"
                      >
                        <Settings className="w-2.5 h-2.5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleRemoveCustomAction(action.id); }} 
                        className="w-5 h-5 bg-white rounded-full shadow border flex items-center justify-center text-gray-500 hover:text-red-500"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingAction} onOpenChange={() => { setEditingAction(null); setIconSearch(''); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Action</DialogTitle></DialogHeader>
          {editingAction && (
            <div className="space-y-4 py-4">
              <div><Label>Label</Label><Input value={editingAction.label} onChange={(e) => setEditingAction({ ...editingAction, label: e.target.value })} /></div>
              <div><Label>Color</Label>
                <div className="mt-2">
                  <ColorPicker color={editingAction.color} onChange={(c) => setEditingAction({ ...editingAction, color: c })} label="Select Icon Color" />
                </div>
              </div>
              {!editingAction.isBuiltIn && (
                <>
                  <div><Label>Icon</Label>
                    <Input placeholder="Search..." value={iconSearch} onChange={(e) => setIconSearch(e.target.value)} className="mb-2" />
                    <div className="grid grid-cols-8 gap-1 max-h-60 overflow-y-auto p-2 border rounded-lg">
                      {filteredIcons.slice(0, 200).map(iconName => {
                        const Icon = iconMap[iconName];
                        return <button key={iconName} type="button" onClick={() => setEditingAction({ ...editingAction, icon: iconName })} className={`p-2 rounded border-2 ${editingAction.icon === iconName ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}><Icon className="w-5 h-5" /></button>;
                      })}
                    </div>
                  </div>
                  <div><Label>Page</Label>
                    <Select value={editingAction.page || ''} onValueChange={(v) => setEditingAction({ ...editingAction, page: v, external_url: '' })}>
                      <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={null}>None</SelectItem>
                        <SelectItem value="Dashboard">Dashboard</SelectItem>
                        <SelectItem value="Goals">Goals</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Or URL</Label><Input value={editingAction.external_url || ''} onChange={(e) => setEditingAction({ ...editingAction, external_url: e.target.value, page: '' })} placeholder="https://..." /></div>
                </>
              )}
              <Button onClick={handleSaveEdit} className="w-full">Save</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Mood Emojis */}
      <Card>
        <CardHeader>
          <CardTitle>Mood Emojis</CardTitle>
          <CardDescription>Pick your top 7 ({topMoods.length}/7)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-7 md:grid-cols-10 gap-1.5">
            {allMoods.map((mood) => {
              const isTop = topMoods.includes(mood.value);
              return (
                <button key={mood.value} onClick={() => toggleTopMood(mood.value)} disabled={!isTop && topMoods.length >= 7} className={`p-2 rounded-lg border ${isTop ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-300' : 'border-gray-200 opacity-50'}`} title={mood.label}>
                  <div className="text-xl">{mood.emoji}</div>
                  <div className="text-[10px] text-gray-600 truncate">{mood.label}</div>
                </button>
              );
            })}
          </div>
          <div className="pt-3 border-t flex gap-2">
            <Input placeholder="😊" value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} className="w-14 text-center text-xl" maxLength={2} />
            <Input placeholder="Name" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} className="flex-1 h-9" onKeyDown={(e) => e.key === 'Enter' && addCustomMood()} />
            <Button size="sm" onClick={addCustomMood} disabled={!newEmoji.trim() || !newLabel.trim()} className="h-9"><Plus className="w-4 h-4" /></Button>
          </div>
          {customMoods.length > 0 && (
            <div className="pt-2 flex flex-wrap gap-1">
              {customMoods.map((mood) => (
                <div key={mood.value} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 rounded-full border text-xs">
                  <span>{mood.emoji} {mood.label}</span>
                  <button onClick={() => setFormData({ ...formData, custom_mood_options: customMoods.filter(m => m.value !== mood.value), top_mood_emojis: topMoods.filter(v => v !== mood.value) })} className="text-red-400">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Music */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Music className="w-5 h-5" />Music Player</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <button onClick={() => setFormData({ ...formData, active_music_service: 'soundcloud' })} className={`flex-1 p-4 rounded-xl border-2 ${activeService === 'soundcloud' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
              SoundCloud
            </button>
            <button onClick={() => setFormData({ ...formData, active_music_service: 'spotify' })} className={`flex-1 p-4 rounded-xl border-2 ${activeService === 'spotify' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
              Spotify
            </button>
          </div>
          <div>
            <Label>{activeService === 'soundcloud' ? 'SoundCloud URL' : 'Spotify URL'}</Label>
            <Input value={activeService === 'soundcloud' ? formData.soundcloud_playlist_url || '' : formData.spotify_playlist_url || ''} onChange={(e) => setFormData({ ...formData, [activeService === 'soundcloud' ? 'soundcloud_playlist_url' : 'spotify_playlist_url']: e.target.value })} placeholder="Paste URL..." />
          </div>
          <div>
            <Label>Position</Label>
            <div className="grid grid-cols-3 gap-3">
              {[{ value: 'menu', label: 'In Menu', icon: Menu }, { value: 'floating', label: 'Floating', icon: MonitorPlay }, { value: 'hidden', label: 'Hidden', icon: EyeOff }].map(opt => {
                const Icon = opt.icon;
                return (
                  <div key={opt.value} onClick={() => setFormData({ ...formData, soundcloud_player_position: opt.value })} className={`p-4 rounded-xl border-2 cursor-pointer text-center ${position === opt.value ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
                    <Icon className="w-6 h-6 mx-auto mb-2" />
                    <h4 className="text-sm font-medium">{opt.label}</h4>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}