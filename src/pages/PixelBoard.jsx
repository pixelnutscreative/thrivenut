import React, { useState, useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { toast, Toaster as SonnerToaster } from 'sonner';
import { Plus, Search, Loader2, LayoutGrid, List as ListIcon, ChevronRight, ChevronDown, CheckCircle2, PauseCircle, Clock, Brain, Paperclip, X } from 'lucide-react';
import moment from 'moment';

const KANBAN_COLUMNS = [
  { id: 'New', label: '💬 New' },
  { id: 'Thinking', label: '🤔 Thinking' },
  { id: 'Needs GO', label: '📥 My Inbox' },
  { id: 'Waiting on Daisy', label: '⏳ Waiting on Daisy' },
  { id: 'In Progress', label: '🔄 In Progress' },
  { id: 'Hold', label: '⏸️ Hold' },
  { id: 'Done', label: '✅ Done' }
];

const priorityConfig = {
  'Urgent': { emoji: '🔥', color: 'bg-red-100 text-red-700' },
  'Normal': { emoji: '🔵', color: 'bg-[#24C4D6]/20 text-[#0D626C]' },
  'When You Get To It': { emoji: '⚪', color: 'bg-slate-100 text-slate-700' },
  'Critical': { emoji: '🔴', color: 'bg-red-100 text-red-700' },
  'High': { emoji: '🟠', color: 'bg-orange-100 text-orange-700' },
  'Medium': { emoji: '🟡', color: 'bg-yellow-100 text-yellow-700' },
  'Low': { emoji: '🟢', color: 'bg-green-100 text-green-700' }
};

const CATEGORIES = ["ThriveNut", "Personal", "Projects", "Pixel Tours", "Websites", "Offers", "AI Tools", "Social Media", "Other"];

const mapStatus = (s) => {
  if (['New', 'Thinking', 'Needs GO', 'Waiting on Daisy', 'In Progress', 'Hold', 'Done'].includes(s)) return s;
  if (s === 'Unanswered') return 'New';
  if (s === 'Answered') return 'Needs GO';
  if (s === 'Reviewed') return 'Done';
  return 'New';
};

const getTurnIndicator = (item) => {
  const s = mapStatus(item.status);
  if (s === 'Done') return null;
  if (s === 'Needs GO') return "👤 Nikole's turn";
  if (!item.pixel_response) return "🤖 Daisy's turn";
  if (item.nikole_read === false) return "👤 Nikole's turn";
  return "🤖 Daisy's turn";
};

const isNikolesTurn = (item) => getTurnIndicator(item) === "👤 Nikole's turn";

export default function PixelBoard() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setLoadingUser(false);
    }).catch(() => setLoadingUser(false));
  }, []);

  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [needsMeFilter, setNeedsMeFilter] = useState(true);
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDoneCollapsed, setIsDoneCollapsed] = useState(true);
  const [newResponse, setNewResponse] = useState('');
  const [newImage, setNewImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef(null);
  
  const [newQuestion, setNewQuestion] = useState({
    title: '',
    details: '',
    category: 'Other',
    priority: 'Normal',
    card_color: '#24C4D6'
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['pixelBoard'],
    queryFn: () => base44.entities.PixelBoard.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PixelBoard.create({ ...data, status: 'New', asked_by: 'Nikole' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pixelBoard'] });
      setIsAskModalOpen(false);
      setNewQuestion({ title: '', details: '', category: 'Other', priority: 'Normal', card_color: '#24C4D6' });
      toast.success("Ticket created!");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PixelBoard.update(id, data),
    onSuccess: (updatedItem) => {
      queryClient.invalidateQueries({ queryKey: ['pixelBoard'] });
      if (selectedItem && selectedItem.id === updatedItem.id) {
        setSelectedItem(updatedItem);
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PixelBoard.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pixelBoard'] });
      setSelectedItem(null);
      toast.success("Ticket deleted!");
    }
  });

  const handleSendBatch = async () => {
    const batchedItems = items.filter(i => i.in_batch);
    if (batchedItems.length === 0) return;
    
    const loadingToastId = toast.loading("Sending batch...");
    try {
      const res = await fetch('https://pixel-poster-9e462e4f.base44.app/functions/sendItBatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      if (!res.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await res.json();
      queryClient.invalidateQueries({ queryKey: ['pixelBoard'] });
      toast.dismiss(loadingToastId);
      toast.success(result.message || `✅ ${batchedItems.length} cards sent to Daisy!`);
    } catch (err) {
      console.error(err);
      toast.dismiss(loadingToastId);
      toast.error("❌ Something went wrong — try again");
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) && !(item.details || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (categoryFilter !== 'All' && item.category !== categoryFilter) return false;
      if (priorityFilter !== 'All' && item.priority !== priorityFilter) return false;
      if (statusFilter !== 'All' && mapStatus(item.status) !== statusFilter) return false;
      if (needsMeFilter && !isNikolesTurn(item)) return false;
      return true;
    }).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [items, searchQuery, categoryFilter, priorityFilter, statusFilter, needsMeFilter]);

  const handleAskSubmit = () => {
    if (!newQuestion.title) return;
    createMutation.mutate(newQuestion);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setNewImage(file_url);
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendResponse = () => {
    if ((!newResponse.trim() && !newImage) || !selectedItem) return;
    
    const messageText = newResponse.trim();
    let currentThread = selectedItem.thread || [];
    
    // Migration of old responses if thread is empty
    if (currentThread.length === 0 && (selectedItem.nikole_response || selectedItem.pixel_response)) {
      if (selectedItem.nikole_response) {
        currentThread.push({ sender: 'nikole', message: selectedItem.nikole_response, timestamp: selectedItem.created_date });
      }
      if (selectedItem.pixel_response) {
        currentThread.push({ sender: 'daisy', message: selectedItem.pixel_response, timestamp: selectedItem.updated_date || selectedItem.created_date });
      }
      currentThread.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }
    
    const newMessage = {
      sender: 'nikole',
      message: messageText,
      image_url: newImage,
      timestamp: new Date().toISOString()
    };
    
    let newThread = [...currentThread, newMessage];
    let updates = { nikole_read: true, pixel_read: false };
    
    // Auto-update status
    if (mapStatus(selectedItem.status) === 'Needs GO') {
      updates.status = 'In Progress';
    }
    
    // Squirrel Catcher
    const squirrelRegex = /\b(oh also|and another thing|speaking of|by the way|btw|oh wait|squirrel)\b/i;
    const squirrelMatch = messageText.match(squirrelRegex);
    
    if (squirrelMatch) {
      const tangentText = messageText.substring(squirrelMatch.index);
      const title = tangentText.substring(0, 60) + (tangentText.length > 60 ? '...' : '');
      
      createMutation.mutate({
        title,
        details: tangentText,
        category: selectedItem.category,
        priority: 'Normal',
        card_color: '#24C4D6'
      });
      
      newThread.push({
        sender: 'system',
        message: `→ New card created: ${title}`,
        timestamp: new Date().toISOString()
      });
    }
    
    updates.thread = newThread;
    
    updateMutation.mutate({ 
      id: selectedItem.id, 
      data: updates 
    });
    setNewResponse('');
    setNewImage(null);
  };

  const updateStatus = (id, newStatus) => {
    updateMutation.mutate({ id, data: { status: newStatus } });
  };

  const TicketCard = ({ item }) => {
    const s = mapStatus(item.status);
    const isDone = s === 'Done';
    const turn = getTurnIndicator(item);
    const pConf = priorityConfig[item.priority] || priorityConfig['Normal'];
    const isUrgent = item.priority === 'Urgent';
    const borderColor = item.card_color || '#e2e8f0'; // fallback to light grey if no color
    
    const hasMention = useMemo(() => {
      const th = item.thread || [];
      const text = th.filter(m => m.sender === 'nikole').map(m => m.message).join(' ') + ' ' + (item.nikole_response || '');
      return /@\w+/.test(text) || /\b(Naomi|Suzy|Carlos|Gwen)\b/i.test(text);
    }, [item.thread, item.nikole_response]);

    return (
      <Card 
        onClick={() => {
          setSelectedItem(item);
          if (item.nikole_read === false) {
            updateMutation.mutate({ id: item.id, data: { nikole_read: true } });
          }
        }}
        className={`cursor-pointer transition-all duration-200 border-2 min-h-[120px] w-full ${isDone ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-white border-slate-200 hover:border-[#24C4D6]/50 hover:shadow-md'} overflow-hidden relative ${isUrgent && !isDone ? 'ring-2 ring-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : ''}`}
        style={{ borderLeftColor: !isDone ? (isUrgent ? '#EF4444' : borderColor) : undefined, borderLeftWidth: !isDone ? '8px' : undefined }}
      >
        <CardContent className="p-4 flex flex-col gap-3 w-full">
          <div className="flex justify-between items-start gap-2">
            <h4 className={`font-bold text-[15px] ${isDone ? 'line-through text-slate-500' : 'text-slate-800'} leading-tight break-words whitespace-normal min-w-0 flex-1 block`}>{item.title || 'Untitled Ticket'}</h4>
            {hasMention && <div className="text-lg" title="Involves external person">👤</div>}
          </div>
          
          <div className="flex flex-wrap gap-1.5 items-center">
            <Badge variant="secondary" className="text-[11px] bg-slate-100 text-slate-600 hover:bg-slate-200">{item.category}</Badge>
            <Badge variant="outline" className={`text-[11px] ${pConf.color} border-0`}>{pConf.emoji} {item.priority}</Badge>
            {s !== 'New' && <Badge variant="outline" className="text-[11px] bg-white border-slate-200 text-slate-500">{s}</Badge>}
          </div>

          <div className="flex items-center justify-between mt-1">
            {turn && !isDone ? (
              <div className={`text-[11px] font-medium px-2 py-1 rounded-md inline-flex items-center w-fit ${turn.includes('Nikole') ? 'bg-[#24C4D6]/10 text-[#0D626C]' : 'bg-[#C8A4F2]/20 text-[#6B3FA0]'}`}>
                {turn}
              </div>
            ) : <div />}
            
            {!isDone && (
              <Button 
                size="sm" 
                variant={item.in_batch ? 'default' : 'outline'}
                className={`h-7 px-2 text-[10px] font-bold z-10 ${item.in_batch ? 'bg-[#24C4D6] hover:bg-[#1db0c0] text-white border-0' : 'border-[#24C4D6] text-[#0D626C] hover:bg-[#24C4D6]/10'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  updateMutation.mutate({ id: item.id, data: { in_batch: !item.in_batch } });
                }}
              >
                {item.in_batch ? '✓ In Batch' : '+ Add to Batch'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loadingUser) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#24C4D6]" /></div>;
  if (user?.role !== 'admin') return <div className="p-12 text-center"><h2 className="text-2xl font-bold text-red-500">Access Denied</h2><p>This is an admin-only page.</p></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <SonnerToaster position="top-center" richColors />
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <span className="text-[#24C4D6]">#</span> PixelBoard
            </h1>
            <p className="text-slate-500 mt-1 font-medium">Ticket system & chat with Daisy</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {items.filter(i => i.in_batch).length > 0 && (
              <div className="flex items-center gap-3 bg-[#24C4D6]/10 px-4 py-2 rounded-lg border-2 border-[#24C4D6]/20 mr-2">
                <span className="font-bold text-[#0D626C]">📦 {items.filter(i => i.in_batch).length} cards in batch</span>
                <Button 
                  onClick={async () => {
                    const batchedItems = items.filter(i => i.in_batch);
                    if (batchedItems.length === 0) return;
                    
                    const loadingId = toast.loading("Sending to Daisy...");
                    try {
                      const res = await fetch('https://pixel-poster-9e462e4f.base44.app/functions/sendItBatch', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({})
                      });
                      const data = await res.json();
                      
                      // Actually clear the batch and update status!
                      for (const item of batchedItems) {
                        updateMutation.mutate({ id: item.id, data: { in_batch: false, status: 'Waiting on Daisy' } });
                      }
                      
                      toast.dismiss(loadingId);
                      toast.success(data.message || 'Sent to Daisy!');
                    } catch(e) {
                      toast.dismiss(loadingId);
                      toast.error('Error: ' + e.message);
                    }
                  }} 
                  className="bg-[#24C4D6] hover:bg-[#1db0c0] text-white font-bold shadow-md hover:shadow-lg transition-all"
                >
                  🚀 SEND IT
                </Button>
              </div>
            )}

            <Button 
              variant="outline"
              className={`border-2 ${needsMeFilter ? 'border-[#24C4D6] bg-[#24C4D6]/10 text-[#0D626C] font-bold' : 'border-slate-200 text-slate-600'}`}
              onClick={() => setNeedsMeFilter(!needsMeFilter)}
            >
              {needsMeFilter ? '📥 My Inbox' : '📋 All Cards'}
            </Button>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px] border-2 border-slate-200 font-medium">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] border-2 border-slate-200 font-medium">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Statuses</SelectItem>
                {KANBAN_COLUMNS.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px] border-2 border-slate-200 font-medium">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Priorities</SelectItem>
                <SelectItem value="Urgent">🔥 Urgent</SelectItem>
                <SelectItem value="Critical">🔴 Critical</SelectItem>
                <SelectItem value="High">🟠 High</SelectItem>
                <SelectItem value="Normal">🔵 Normal</SelectItem>
                <SelectItem value="Medium">🟡 Medium</SelectItem>
                <SelectItem value="Low">🟢 Low</SelectItem>
                <SelectItem value="When You Get To It">⚪ When You Get To It</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex bg-slate-100 rounded-lg p-1 border-2 border-slate-200">
              <Button size="sm" variant={viewMode === 'kanban' ? 'default' : 'ghost'} onClick={() => setViewMode('kanban')} className={viewMode === 'kanban' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}>
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button size="sm" variant={viewMode === 'list' ? 'default' : 'ghost'} onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}>
                <ListIcon className="w-4 h-4" />
              </Button>
            </div>

            <Dialog open={isAskModalOpen} onOpenChange={setIsAskModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#24C4D6] hover:bg-[#1db0c0] text-white font-bold shadow-md hover:shadow-lg transition-all border-2 border-[#24C4D6]">
                  <Plus className="w-4 h-4 mr-2" /> New Ticket
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-slate-800">Create Ticket</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Title</Label>
                    <Input placeholder="What needs doing?" value={newQuestion.title} onChange={e => setNewQuestion({...newQuestion, title: e.target.value})} className="border-2 border-slate-200 focus-visible:ring-[#24C4D6]" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Details</Label>
                    <Textarea placeholder="Provide context..." value={newQuestion.details} onChange={e => setNewQuestion({...newQuestion, details: e.target.value})} className="min-h-[100px] border-2 border-slate-200 focus-visible:ring-[#24C4D6]" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Category</Label>
                      <Select value={newQuestion.category} onValueChange={v => setNewQuestion({...newQuestion, category: v})}>
                        <SelectTrigger className="border-2 border-slate-200"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Priority</Label>
                      <Select value={newQuestion.priority} onValueChange={v => setNewQuestion({...newQuestion, priority: v})}>
                        <SelectTrigger className="border-2 border-slate-200"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="When You Get To It">⚪ When You Get To It</SelectItem>
                          <SelectItem value="Normal">🔵 Normal</SelectItem>
                          <SelectItem value="Urgent">🔥 Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Card Color Accent</Label>
                    <div className="flex gap-2">
                      {['#24C4D6', '#C8A4F2', '#F472B6', '#FBBF24', '#34D399', '#94A3B8'].map(color => (
                        <button key={color} onClick={() => setNewQuestion({...newQuestion, card_color: color})} className={`w-8 h-8 rounded-full border-2 ${newQuestion.card_color === color ? 'border-slate-800 scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsAskModalOpen(false)}>Cancel</Button>
                  <Button onClick={handleAskSubmit} disabled={!newQuestion.title || createMutation.isPending} className="bg-[#24C4D6] hover:bg-[#1db0c0] text-white">Create Ticket</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Board / List View */}
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#24C4D6]" /></div>
        ) : viewMode === 'kanban' ? (
          <div className="flex gap-6 overflow-x-auto pb-4 snap-x">
            {KANBAN_COLUMNS.map(col => {
              const colItems = filteredItems.filter(item => mapStatus(item.status) === col.id);
              if (col.id === 'Done' && isDoneCollapsed) {
                return (
                  <div key={col.id} className="min-w-[60px] max-w-[60px] bg-slate-100/50 rounded-2xl border-2 border-slate-200 border-dashed flex flex-col items-center py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setIsDoneCollapsed(false)}>
                    <div className="rotate-90 whitespace-nowrap font-bold text-slate-500 mt-10 tracking-widest uppercase">{col.label} ({colItems.length})</div>
                  </div>
                );
              }

              return (
                <div key={col.id} className="min-w-[300px] max-w-[300px] w-[300px] flex flex-col gap-3 snap-start">
                  <div className="flex items-center justify-between pb-2 border-b-2 border-slate-200">
                    <h3 className="font-bold text-slate-700">{col.label}</h3>
                    <Badge variant="secondary" className="bg-slate-200 text-slate-600 border-0">{colItems.length}</Badge>
                  </div>
                  {col.id === 'Done' && (
                    <Button variant="ghost" size="sm" className="w-full text-xs text-slate-500 -mt-2" onClick={() => setIsDoneCollapsed(true)}>Minimize</Button>
                  )}
                  <div className="flex flex-col gap-3 overflow-y-auto max-h-[70vh] custom-scrollbar pr-1 pb-4">
                    {colItems.map(item => <TicketCard key={item.id} item={item} />)}
                    {colItems.length === 0 && <div className="text-sm text-slate-400 text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">Empty</div>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 font-bold text-slate-500 border-b-2 border-slate-100 text-sm">
              <div className="col-span-5">Title</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Priority</div>
              <div className="col-span-1">Turn</div>
            </div>
            <div className="flex flex-col">
              {filteredItems.map(item => {
                const s = mapStatus(item.status);
                const turn = getTurnIndicator(item);
                const pConf = priorityConfig[item.priority] || priorityConfig['Normal'];
                return (
                  <div key={item.id} onClick={() => setSelectedItem(item)} className="grid grid-cols-12 gap-4 p-4 items-center border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                    <div className="col-span-5 font-bold text-slate-800 truncate pr-4">{item.title}</div>
                    <div className="col-span-2"><Badge variant="outline" className="border-slate-200 bg-white text-slate-600">{s}</Badge></div>
                    <div className="col-span-2"><Badge variant="secondary" className="bg-slate-100 text-slate-600">{item.category}</Badge></div>
                    <div className="col-span-2"><span className="text-sm">{pConf.emoji} {item.priority}</span></div>
                    <div className="col-span-1 text-sm font-medium text-slate-500">{turn ? turn.split(' ')[0] : '-'}</div>
                  </div>
                );
              })}
              {filteredItems.length === 0 && <div className="p-8 text-center text-slate-500">No tickets found.</div>}
            </div>
          </div>
        )}

        {/* Thread Panel Modal */}
        <Dialog open={!!selectedItem} onOpenChange={(open) => {
          if (!open) {
            setSelectedItem(null);
          }
        }}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col p-0 bg-slate-50">
            {selectedItem && (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="p-6 bg-white border-b-2 border-slate-200 flex-shrink-0">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <Input 
                      className="text-2xl font-bold text-slate-800 leading-tight border-transparent hover:border-slate-300 focus:border-[#24C4D6] px-2 -ml-2 bg-transparent h-auto py-1 w-full"
                      defaultValue={selectedItem.title}
                      onBlur={(e) => {
                        if (e.target.value !== selectedItem.title && e.target.value.trim()) {
                          updateMutation.mutate({ id: selectedItem.id, data: { title: e.target.value.trim() } });
                        }
                      }}
                    />
                    <Button 
                      variant={selectedItem.in_batch ? 'default' : 'outline'}
                      className={`font-bold flex-shrink-0 ${selectedItem.in_batch ? 'bg-[#24C4D6] hover:bg-[#1db0c0] text-white border-0' : 'border-[#24C4D6] text-[#0D626C] hover:bg-[#24C4D6]/10'}`}
                      onClick={() => {
                        updateMutation.mutate({ id: selectedItem.id, data: { in_batch: !selectedItem.in_batch } });
                        setSelectedItem(prev => ({ ...prev, in_batch: !prev.in_batch }));
                      }}
                    >
                      {selectedItem.in_batch ? '✓ In Batch' : '+ Add to Batch'}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-500">Status</Label>
                      <Select value={mapStatus(selectedItem.status)} onValueChange={(v) => updateStatus(selectedItem.id, v)}>
                        <SelectTrigger className="w-full border-2 border-slate-200 bg-white font-bold h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {KANBAN_COLUMNS.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-500">Priority</Label>
                      <Select value={selectedItem.priority || 'Normal'} onValueChange={(v) => updateMutation.mutate({ id: selectedItem.id, data: { priority: v } })}>
                        <SelectTrigger className="w-full border-2 border-slate-200 bg-white font-bold h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="When You Get To It">⚪ When You Get To It</SelectItem>
                          <SelectItem value="Normal">🔵 Normal</SelectItem>
                          <SelectItem value="Medium">🟡 Medium</SelectItem>
                          <SelectItem value="High">🟠 High</SelectItem>
                          <SelectItem value="Critical">🔴 Critical</SelectItem>
                          <SelectItem value="Urgent">🔥 Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-500">Category</Label>
                      <Select value={selectedItem.category || 'Other'} onValueChange={(v) => updateMutation.mutate({ id: selectedItem.id, data: { category: v } })}>
                        <SelectTrigger className="w-full border-2 border-slate-200 bg-white font-bold h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-500">Card Color</Label>
                      <div className="flex gap-1 h-9 items-center">
                        {['#ffffff', '#24C4D6', '#C8A4F2', '#F472B6', '#FBBF24', '#34D399'].map(color => (
                          <button 
                            key={color} 
                            onClick={() => updateMutation.mutate({ id: selectedItem.id, data: { card_color: color } })} 
                            className={`w-6 h-6 rounded-full border-2 ${selectedItem.card_color === color ? 'border-slate-800 scale-110' : 'border-slate-300'}`} 
                            style={{ backgroundColor: color }} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Body (Scrollable) */}
                <div className="flex-1 p-6 space-y-6 overflow-y-auto">
                  {/* Custom Fields Section */}
                  <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Custom Fields</h3>
                      <Button variant="outline" size="sm" onClick={() => {
                        const key = window.prompt("Enter new field name (e.g., Email Draft, GHL Tag):");
                        if (key && key.trim()) {
                          const val = window.prompt(`Enter value for ${key}:`);
                          if (val !== null) {
                            const newFields = { ...(selectedItem.custom_fields || {}), [key.trim()]: val };
                            updateMutation.mutate({ id: selectedItem.id, data: { custom_fields: newFields } });
                          }
                        }
                      }}>
                        <Plus className="w-4 h-4 mr-1" /> Add Field
                      </Button>
                    </div>
                    {selectedItem.custom_fields && Object.keys(selectedItem.custom_fields).length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(selectedItem.custom_fields).map(([k, v]) => (
                          <div key={k} className="flex flex-col gap-1 p-3 bg-slate-50 rounded-xl border border-slate-200 relative group">
                            <span className="text-xs font-bold text-slate-500 uppercase">{k}</span>
                            <div className="flex items-center gap-2">
                              <Input 
                                defaultValue={v}
                                className="h-8 text-sm border-transparent bg-transparent hover:border-slate-300 focus:bg-white transition-all px-1"
                                onBlur={(e) => {
                                  if (e.target.value !== v) {
                                    const newFields = { ...selectedItem.custom_fields, [k]: e.target.value };
                                    updateMutation.mutate({ id: selectedItem.id, data: { custom_fields: newFields } });
                                  }
                                }}
                              />
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 px-2 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => {
                                  const newFields = { ...selectedItem.custom_fields };
                                  delete newFields[k];
                                  updateMutation.mutate({ id: selectedItem.id, data: { custom_fields: newFields } });
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-400 text-center py-4 border-2 border-dashed border-slate-100 rounded-xl">No custom fields added yet.</div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm">
                    <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Original Context / Details</Label>
                    <Textarea 
                      defaultValue={selectedItem.details || ''}
                      className="min-h-[100px] border-transparent bg-slate-50 hover:border-slate-300 focus:bg-white transition-all text-sm text-slate-700 w-full resize-y"
                      placeholder="Add details or context here..."
                      onBlur={(e) => {
                        if (e.target.value !== selectedItem.details) {
                          updateMutation.mutate({ id: selectedItem.id, data: { details: e.target.value } });
                        }
                      }}
                    />
                  </div>

                  {/* Attachments */}
                  <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Attachment</Label>
                      <div>
                        <input 
                          type="file" 
                          id={`attachment-upload-${selectedItem.id}`}
                          className="hidden" 
                          accept="image/png, image/jpeg, image/gif, image/webp"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const loadingToastId = toast.loading("Uploading attachment...");
                            try {
                              const { file_url } = await base44.integrations.Core.UploadFile({ file });
                              updateMutation.mutate({ id: selectedItem.id, data: { attachment_url: file_url } });
                              setSelectedItem(prev => ({ ...prev, attachment_url: file_url }));
                              toast.dismiss(loadingToastId);
                              toast.success("Attachment saved!");
                            } catch (error) {
                              toast.dismiss(loadingToastId);
                              toast.error("Upload failed");
                            }
                          }}
                        />
                        <Button variant="outline" size="sm" onClick={() => document.getElementById(`attachment-upload-${selectedItem.id}`).click()}>
                          <Paperclip className="w-4 h-4 mr-1" /> Upload Image
                        </Button>
                      </div>
                    </div>
                    {selectedItem.attachment_url && (
                      <div className="mt-2">
                        <a href={selectedItem.attachment_url} target="_blank" rel="noopener noreferrer">
                          <img src={selectedItem.attachment_url} alt="Attachment" className="max-w-full max-h-64 rounded-md border border-slate-200 object-contain" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Thread Area */}
                  <div className="flex flex-col bg-white border-2 border-slate-200 rounded-2xl shadow-sm overflow-hidden h-[400px]">
                    <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar bg-slate-50">
                      {(() => {
                        let th = selectedItem.thread || [];
                        if (th.length === 0 && (selectedItem.nikole_response || selectedItem.pixel_response)) {
                          th = [];
                          if (selectedItem.nikole_response) th.push({ sender: 'nikole', message: selectedItem.nikole_response, timestamp: selectedItem.created_date });
                          if (selectedItem.pixel_response) th.push({ sender: 'daisy', message: selectedItem.pixel_response, timestamp: selectedItem.updated_date || selectedItem.created_date });
                          th.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                        }
                        
                        if (th.length === 0) {
                          return <div className="text-center text-slate-400 text-sm mt-10">No messages yet. Start the conversation!</div>;
                        }

                        return th.map((msg, i) => {
                          if (msg.sender === 'system') {
                            return (
                              <div key={i} className="flex justify-center my-2">
                                <span className="bg-slate-200 text-slate-500 text-xs px-3 py-1 rounded-full font-medium">
                                  {msg.message}
                                </span>
                              </div>
                            );
                          }

                          const isNikole = msg.sender === 'nikole';
                          return (
                            <div key={i} className={`flex flex-col ${isNikole ? 'items-start' : 'items-end'}`}>
                              <span className="text-[10px] font-bold text-slate-400 mb-1 px-1">
                                {isNikole ? '👤 NIKOLE' : '🤖 DAISY'} • {moment(msg.timestamp).format('MMM D, h:mm A')}
                              </span>
                              <div className={`p-3 rounded-2xl max-w-[85%] whitespace-pre-wrap text-sm shadow-sm ${
                                isNikole 
                                  ? 'bg-[#e8fffe] text-[#0D626C] rounded-tl-sm border border-[#24C4D6]/20' 
                                  : 'bg-[#f0f0f0] text-slate-800 rounded-tr-sm border border-slate-200'
                              }`}>
                                {msg.message}
                                {msg.image_url && (
                                  <div className={msg.message ? 'mt-2' : ''}>
                                    <img src={msg.image_url} alt="Attached" className="max-w-full rounded-md border border-black/10 max-h-64 object-contain" />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                    
                    {newImage && (
                      <div className="px-4 py-2 bg-white border-t border-slate-200">
                        <div className="relative inline-block">
                          <img src={newImage} alt="Upload preview" className="h-20 rounded-md border border-slate-200 object-cover" />
                          <button 
                            onClick={() => setNewImage(null)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-sm"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="p-3 bg-white border-t border-slate-200 flex gap-2 items-end">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/gif, image/webp"
                        onChange={handleImageUpload}
                      />
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="shrink-0 h-[44px] w-[44px] border-slate-200 hover:bg-slate-100"
                        disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-slate-500" /> : <Paperclip className="w-4 h-4 text-slate-500" />}
                      </Button>
                      <Textarea 
                        value={newResponse}
                        onChange={e => setNewResponse(e.target.value)}
                        placeholder="Message Daisy... (e.g. 'oh wait, also check...')"
                        className="min-h-[44px] max-h-[120px] border-slate-200 focus-visible:ring-[#24C4D6] resize-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendResponse();
                          }
                        }}
                      />
                      <Button onClick={handleSendResponse} className="bg-[#24C4D6] hover:bg-[#1db0c0] text-white shrink-0 h-[44px]">
                        Send 💬
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-white border-t-2 border-slate-200 flex-shrink-0 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-500 hidden sm:inline">Opened {moment(selectedItem.created_date).fromNow()}</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (window.confirm("Are you sure you want to delete this ticket? This cannot be undone.")) {
                          deleteMutation.mutate(selectedItem.id);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    <Button size="sm" variant="default" className="bg-slate-800 hover:bg-slate-900 text-white font-bold" onClick={() => setSelectedItem(null)}>💾 Save for Later</Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(selectedItem.id, 'Done')} className="border-slate-200 hover:bg-slate-100 text-slate-600"><CheckCircle2 className="w-4 h-4 mr-1" /> Done</Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(selectedItem.id, 'Needs GO')} className="border-slate-200 hover:bg-orange-50 text-orange-600"><Clock className="w-4 h-4 mr-1" /> My Inbox</Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(selectedItem.id, 'Hold')} className="border-slate-200 hover:bg-red-50 text-red-600"><PauseCircle className="w-4 h-4 mr-1" /> Hold</Button>
                    <Button size="sm" variant="outline" onClick={() => updateStatus(selectedItem.id, 'Thinking')} className="border-slate-200 hover:bg-purple-50 text-purple-600"><Brain className="w-4 h-4 mr-1" /> Thinking</Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}