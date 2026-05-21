import React, { useState, useMemo } from 'react';
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
import { toast } from 'sonner';
import { Plus, Search, Loader2, LayoutGrid, List as ListIcon, ChevronRight, ChevronDown, CheckCircle2, PauseCircle, Clock, Brain } from 'lucide-react';
import moment from 'moment';

const KANBAN_COLUMNS = [
  { id: 'New', label: '💬 New' },
  { id: 'Thinking', label: '🤔 Thinking' },
  { id: 'Needs GO', label: '⏳ Needs GO' },
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
  if (['New', 'Thinking', 'Needs GO', 'In Progress', 'Hold', 'Done'].includes(s)) return s;
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
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [myTurnFilter, setMyTurnFilter] = useState(false);
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDoneCollapsed, setIsDoneCollapsed] = useState(true);
  const [newResponse, setNewResponse] = useState('');
  
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

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) && !(item.details || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (categoryFilter !== 'All' && item.category !== categoryFilter) return false;
      if (myTurnFilter && !isNikolesTurn(item)) return false;
      return true;
    }).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [items, searchQuery, categoryFilter, myTurnFilter]);

  const handleAskSubmit = () => {
    if (!newQuestion.title) return;
    createMutation.mutate(newQuestion);
  };

  const handleSendResponse = () => {
    if (!newResponse.trim() || !selectedItem) return;
    
    const currentResponses = selectedItem.nikole_response || '';
    const separator = currentResponses ? '\n\n' : '';
    
    updateMutation.mutate({ 
      id: selectedItem.id, 
      data: { 
        nikole_response: currentResponses + separator + newResponse,
        status: 'Thinking',
        nikole_read: true,
        pixel_read: false
      } 
    });
    setNewResponse('');
    toast.success("Response sent!");
  };

  const updateStatus = (id, newStatus) => {
    updateMutation.mutate({ id, data: { status: newStatus } });
  };

  const TicketCard = ({ item }) => {
    const s = mapStatus(item.status);
    const isDone = s === 'Done';
    const turn = getTurnIndicator(item);
    const pConf = priorityConfig[item.priority] || priorityConfig['Normal'];

    return (
      <Card 
        onClick={() => {
          setSelectedItem(item);
          if (item.nikole_read === false) {
            updateMutation.mutate({ id: item.id, data: { nikole_read: true } });
          }
        }}
        className={`cursor-pointer transition-all duration-200 border-2 ${isDone ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-white border-slate-100 hover:border-[#24C4D6]/50 hover:shadow-md'} overflow-hidden relative`}
        style={{ borderLeftColor: !isDone && item.card_color ? item.card_color : undefined, borderLeftWidth: !isDone && item.card_color ? '6px' : undefined }}
      >
        <CardContent className="p-4 flex flex-col gap-3">
          <div className="flex justify-between items-start gap-2">
            <h4 className={`font-bold text-sm ${isDone ? 'line-through text-slate-500' : 'text-slate-800'} leading-tight`}>{item.title}</h4>
          </div>
          
          <div className="flex flex-wrap gap-1.5 items-center">
            <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-200">{item.category}</Badge>
            <Badge variant="outline" className={`text-[10px] ${pConf.color} border-0`}>{pConf.emoji} {item.priority}</Badge>
          </div>

          {turn && !isDone && (
            <div className={`text-[10px] font-medium px-2 py-1 rounded-md inline-flex items-center w-fit ${turn.includes('Nikole') ? 'bg-[#24C4D6]/10 text-[#0D626C]' : 'bg-[#C8A4F2]/20 text-[#6B3FA0]'}`}>
              {turn}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
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
            <Button 
              variant="outline"
              className={`border-2 ${myTurnFilter ? 'border-[#24C4D6] bg-[#24C4D6]/10 text-[#0D626C]' : 'border-slate-200 text-slate-600'}`}
              onClick={() => setMyTurnFilter(!myTurnFilter)}
            >
              🙋‍♀️ My Turn
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
                <div key={col.id} className="min-w-[280px] max-w-[280px] w-[280px] flex flex-col gap-3 snap-start">
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

        {/* Thread Panel */}
        <Sheet open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
          <SheetContent className="w-full sm:max-w-2xl md:max-w-3xl overflow-y-auto bg-slate-50 p-0 border-l-2 border-slate-200">
            {selectedItem && (
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-6 bg-white border-b-2 border-slate-200 sticky top-0 z-10">
                  <div className="flex items-start justify-between gap-4 mb-4 pr-8">
                    <h2 className="text-2xl font-bold text-slate-800 leading-tight">{selectedItem.title}</h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Select value={mapStatus(selectedItem.status)} onValueChange={(v) => updateStatus(selectedItem.id, v)}>
                      <SelectTrigger className="w-[160px] border-2 border-slate-200 bg-white font-bold h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {KANBAN_COLUMNS.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-0">{selectedItem.category}</Badge>
                    <span className="text-sm text-slate-500 ml-auto">Opened {moment(selectedItem.created_date).fromNow()}</span>
                  </div>
                </div>

                {/* Thread Body */}
                <div className="flex-1 p-6 space-y-6">
                  {/* Details Bubble */}
                  {selectedItem.details && (
                    <div className="flex flex-col items-center mb-8">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Original Context</span>
                      <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm text-slate-700 whitespace-pre-wrap text-sm w-full">
                        {selectedItem.details}
                      </div>
                    </div>
                  )}

                  {/* Interleaved Chat (Approximate since we only have single text fields, we will show Nikole then Daisy, or just split by paragraphs if we wanted, but sticking to fields) */}
                  {selectedItem.nikole_response && (
                    <div className="flex flex-col items-end">
                      <span className="text-xs font-bold text-[#0D626C] mb-1 px-1">👤 NIKOLE</span>
                      <div className="bg-[#24C4D6] text-white p-4 rounded-2xl rounded-tr-sm shadow-sm max-w-[85%] whitespace-pre-wrap text-sm">
                        {selectedItem.nikole_response}
                      </div>
                    </div>
                  )}

                  {selectedItem.pixel_response && (
                    <div className="flex flex-col items-start mt-4">
                      <span className="text-xs font-bold text-[#6B3FA0] mb-1 px-1">🤖 DAISY</span>
                      <div className="bg-[#C8A4F2] text-slate-900 p-4 rounded-2xl rounded-tl-sm shadow-sm max-w-[85%] whitespace-pre-wrap text-sm">
                        {selectedItem.pixel_response}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div className="p-6 bg-white border-t-2 border-slate-200 sticky bottom-0">
                  <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Add your response</Label>
                  <Textarea 
                    placeholder="Type your message to Daisy..." 
                    className="min-h-[100px] border-2 border-slate-200 focus-visible:ring-[#24C4D6] mb-3 resize-none"
                    value={newResponse}
                    onChange={e => setNewResponse(e.target.value)}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => updateStatus(selectedItem.id, 'Done')} className="border-slate-200 hover:bg-slate-100 text-slate-600"><CheckCircle2 className="w-4 h-4 mr-1" /> Done</Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(selectedItem.id, 'Needs GO')} className="border-slate-200 hover:bg-orange-50 text-orange-600"><Clock className="w-4 h-4 mr-1" /> Needs GO</Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(selectedItem.id, 'Hold')} className="border-slate-200 hover:bg-red-50 text-red-600"><PauseCircle className="w-4 h-4 mr-1" /> Hold</Button>
                      <Button size="sm" variant="outline" onClick={() => updateStatus(selectedItem.id, 'Thinking')} className="border-slate-200 hover:bg-purple-50 text-purple-600"><Brain className="w-4 h-4 mr-1" /> Thinking</Button>
                    </div>
                    <Button onClick={handleSendResponse} className="bg-[#24C4D6] hover:bg-[#1db0c0] text-white font-bold px-6">
                      SEND
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}