import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { MessageSquare, ChevronDown, ChevronRight, CheckCircle2, Plus, Paperclip, Loader2, Pin, X, ChevronUp, RefreshCw, Bell, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';

const priorityConfig = {
  'Urgent': { emoji: '🔥', color: 'bg-red-100 text-red-700 border-red-200' },
  'Normal': { emoji: '🔵', color: 'bg-[#24C4D6]/20 text-[#0D626C] border-[#24C4D6]/30' },
  'When You Get To It': { emoji: '⚪', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  'Critical': { emoji: '🔴', color: 'bg-red-100 text-red-700 border-red-200' },
  'High': { emoji: '🟠', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  'Medium': { emoji: '🟡', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  'Low': { emoji: '🟢', color: 'bg-green-100 text-green-700 border-green-200' },
};

const typeColors = {
  'Bug': 'bg-orange-100 text-orange-700 border-orange-200',
  'Task': 'bg-blue-100 text-blue-700 border-blue-200',
  'Question': 'bg-purple-100 text-purple-700 border-purple-200',
  'Idea': 'bg-lime-100 text-lime-800 border-lime-200',
  'Decision Needed': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Decision': 'bg-yellow-100 text-yellow-800 border-yellow-200'
};

const defaultTypeColor = 'bg-gray-100 text-gray-700 border-gray-200';

const colors = {
  red: { bg: 'bg-[#EF4444]/5', border: 'border-l-[#EF4444]' },
  turquoise: { bg: 'bg-[#24C4D6]/5', border: 'border-l-[#24C4D6]' },
  lime: { bg: 'bg-[#A7E063]/5', border: 'border-l-[#A7E063]' },
  lavender: { bg: 'bg-[#C8A4F2]/5', border: 'border-l-[#C8A4F2]' },
  orange: { bg: 'bg-[#F97316]/5', border: 'border-l-[#F97316]' },
  yellow: { bg: 'bg-[#EAB308]/5', border: 'border-l-[#EAB308]' },
  grey: { bg: 'bg-[#A8A8A8]/5', border: 'border-l-[#A8A8A8]' }
};

const hexColors = {
  red: '#EF4444', turquoise: '#24C4D6', lime: '#A7E063',
  lavender: '#C8A4F2', orange: '#F97316', yellow: '#EAB308', grey: '#A8A8A8'
};

const categories = [
  "ThriveNut", "Personal", "Pixel Tours", "Websites", "Offers", "AI Tools", "Projects", "Social Media", "Other"
];

function getCardColor(item) {
  if (item.status === 'Done') return 'grey';
  if (item.card_color) return item.card_color;
  if (item.asked_by === 'Pixel Poster' && !item.nikole_read) return 'lime';
  if (item.priority === 'Urgent' || item.priority === 'Critical') return 'red';
  if (item.priority === 'When You Get To It' || item.priority === 'Low') return 'lavender';
  return 'turquoise';
}

function getEisenhowerBadge(item) {
  const isUrgent = item.priority === 'Urgent' || item.priority === 'Critical';
  const isImportant = item.importance;
  if (isUrgent && isImportant) return { label: 'DO NOW', color: 'bg-red-500 text-white border-red-600' };
  if (isUrgent && !isImportant) return { label: 'DELEGATE', color: 'bg-orange-500 text-white border-orange-600' };
  if (!isUrgent && isImportant) return { label: 'SCHEDULE', color: 'bg-[#24C4D6] text-white border-[#1EABC0]' };
  return { label: 'DROP IT', color: 'bg-gray-500 text-white border-gray-600' };
}

const HighlightText = ({ text, highlight }) => {
  if (!text) return null;
  if (!highlight) return <>{text}</>;
  const parts = text.toString().split(new RegExp(`(${highlight})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? 
          <span key={i} className="bg-yellow-400/40 text-yellow-100 px-0.5 rounded">{part}</span> : 
          part
      )}
    </>
  );
};

function getStatusInfo(item) {
  if (item.status === 'Done') return { label: 'DONE', icon: '✅', color: 'text-green-400 bg-green-400/10 border-green-400/20' };
  if (item.status === 'Answered' || item.status === 'Reviewed') return { label: 'ANSWERED', icon: '💬', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' };
  if (item.status === 'Unanswered' && item.pixel_read === true) return { label: 'SENT', icon: '📨', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' };
  if (item.batch_ready) return { label: 'READY', icon: '🟡', color: 'text-[#24C4D6] bg-[#24C4D6]/10 border-[#24C4D6]/30' };
  return { label: 'HOLD', icon: '🔵', color: 'text-white/60 bg-white/5 border-white/10' };
}

const playDing = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {}
};

const uploadFile = async (file) => {
  try {
    const response = await base44.integrations.Core.UploadFile({ file });
    return response.file_url;
  } catch (e) {
    return null;
  }
};

const CardExpandable = ({ item, updateMutation }) => {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const savedKey = `pixelboard_draft_${item.id}`;
  
  useEffect(() => {
    const saved = localStorage.getItem(savedKey);
    if (saved !== null) setText(saved);
    else setText(item.nikole_response || '');
  }, [item.id, item.nikole_response]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (text !== (item.nikole_response || '')) {
        localStorage.setItem(savedKey, text);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [text, item.id, item.nikole_response]);

  const fileInputRef = useRef(null);
  
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Str = event.target.result;
      setUploading(true);
      const url = await uploadFile(base64Str);
      setUploading(false);
      if (url) {
        updateMutation.mutate({ id: item.id, data: { nikole_attachment_url: url } });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleHold = () => {
    updateMutation.mutate({ id: item.id, data: { batch_ready: false } });
    setExpanded(false);
  };

  const handleReady = () => {
    updateMutation.mutate({ id: item.id, data: { batch_ready: true, nikole_response: text } });
    localStorage.removeItem(savedKey);
    setExpanded(false);
  };
  
  const handleDone = () => {
    updateMutation.mutate({ id: item.id, data: { status: 'Done', nikole_read: true } });
  };
  
  const showDoneBtn = item.status === 'Answered' || item.status === 'Reviewed' || item.pixel_response;

  return (
    <div className="mt-3" onClick={(e) => e.stopPropagation()}>
      {!expanded ? (
        <Button variant="ghost" className="w-full text-xs text-white/50 h-6" onClick={() => setExpanded(true)}>
          <ChevronDown className="w-4 h-4 mr-1" /> Expand to Answer / Modify
        </Button>
      ) : (
        <div className="space-y-3 pt-2 border-t border-white/10">
          <Textarea 
            value={text} 
            onChange={e => setText(e.target.value)} 
            placeholder="Type your response or add intel..."
            className="min-h-[100px] bg-black/20 border-white/10 text-white resize-y text-sm focus-visible:ring-[#24C4D6]"
          />
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex gap-2 items-center">
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,.pdf,.doc,.docx" />
              <Button size="icon" variant="ghost" className="h-8 w-8 text-white/60 hover:text-white bg-white/5 border border-white/10 shrink-0" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
              </Button>
              {item.nikole_attachment_url && (
                <a href={item.nikole_attachment_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#24C4D6] hover:underline flex items-center break-all">
                  <Paperclip className="w-3 h-3 mr-1 shrink-0" /> Attached
                </a>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2 w-full sm:w-auto">
              <Select value={item.card_color || ''} onValueChange={v => updateMutation.mutate({ id: item.id, data: { card_color: v === 'auto' ? '' : v } })}>
                <SelectTrigger className="h-8 text-xs bg-black/20 border-white/10 text-white w-[110px]"><SelectValue placeholder="Color" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto</SelectItem>
                  {Object.keys(hexColors).map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={item.category || 'Other'} onValueChange={v => updateMutation.mutate({ id: item.id, data: { category: v } })}>
                <SelectTrigger className="h-8 text-xs bg-black/20 border-white/10 text-white w-[110px]"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2 shrink-0 flex-wrap w-full sm:w-auto justify-end">
              <Button size="sm" variant="secondary" className="bg-white/10 text-white hover:bg-white/20 h-8" onClick={handleHold}>
                HOLD
              </Button>
              <Button size="sm" className="bg-[#24C4D6] hover:bg-[#1EABC0] text-white h-8" onClick={handleReady}>
                ✅ READY
              </Button>
              {showDoneBtn && (
                <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white h-8" onClick={handleDone}>
                  👀 Got it / Done
                </Button>
              )}
            </div>
          </div>
          <Button variant="ghost" className="w-full text-xs text-white/50 h-6 mt-1" onClick={() => setExpanded(false)}>
            <ChevronUp className="w-4 h-4 mr-1" /> Collapse
          </Button>
        </div>
      )}
    </div>
  );
};

const BoardCard = ({ item, updateMutation, searchQuery }) => {
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const statusInfo = getStatusInfo(item);
  const tColor = typeColors[item.question_type] || defaultTypeColor;
  
  const handleMarkRead = () => {
    if (!item.nikole_read) {
      updateMutation.mutate({ id: item.id, data: { nikole_read: true } });
    }
  };

  const colorKey = getCardColor(item);
  const colorClasses = colors[colorKey] || colors.turquoise;
  const eBadge = getEisenhowerBadge(item);
  const glowClass = item.asked_by === 'Pixel Poster' && !item.nikole_read ? 'shadow-[0_0_15px_rgba(167,224,99,0.3)]' : '';

  return (
    <div 
      className={`border border-y-white/10 border-r-white/10 border-l-4 ${colorClasses.border} ${colorClasses.bg} ${glowClass} p-3 rounded-xl relative flex flex-col h-full transition-all group`}
      onMouseEnter={handleMarkRead}
      onClick={handleMarkRead}
    >
      {!item.nikole_read && (
        <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#24C4D6] animate-pulse shadow-[0_0_8px_#24C4D6]" />
      )}
      
      <div className="flex items-center gap-1.5 mb-2 flex-wrap pr-4">
        <div className="w-2 h-2 rounded-full shrink-0" style={{backgroundColor: hexColors[colorKey]}} />
        <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-black/20 text-white/80 border-white/10 uppercase tracking-wider">{item.category || 'Other'}</Badge>
        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 uppercase tracking-wider ${tColor}`}>{item.question_type}</Badge>
      </div>

      <h4 className="font-bold text-white text-sm mb-1 line-clamp-2 leading-tight">
        <HighlightText text={item.title} highlight={searchQuery} />
      </h4>
      
      {item.details && (
        <div className="text-[11px] text-white/50 mb-2 whitespace-pre-wrap line-clamp-1">
          <HighlightText text={item.details} highlight={searchQuery} />
        </div>
      )}

      <div className="absolute top-3 right-8 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-md p-1 rounded-full">
         {Object.keys(hexColors).map(c => (
           <button key={c} onClick={(e) => { e.stopPropagation(); updateMutation.mutate({ id: item.id, data: { card_color: c } }); }} className="w-3 h-3 rounded-full hover:scale-125 transition-transform" style={{ backgroundColor: hexColors[c] }} title={c} />
         ))}
      </div>

      {item.pixel_response && (
         <div className="mt-2 mb-2 p-2 bg-[#24C4D6]/10 border border-[#24C4D6]/30 rounded-lg text-[#24C4D6] text-[11px] line-clamp-2">
           <span className="font-bold">Pixel:</span> <HighlightText text={item.pixel_response} highlight={searchQuery} />
         </div>
      )}

      {item.nikole_response && (
         <div className="mt-1 mb-2 text-[11px] text-white/50 italic border-l-2 border-white/20 pl-2 line-clamp-1">
           You: <HighlightText text={item.nikole_response} highlight={searchQuery} />
         </div>
      )}

      <div className="mt-auto pt-2 flex items-center justify-between">
        <div className="flex gap-1.5 items-center">
          <span className="text-[10px] text-white/50 bg-white/5 px-1.5 py-0.5 rounded">{item.asked_by === 'Nikole' ? 'From You' : 'From Pixel'}</span>
          <Badge className={`text-[9px] px-1.5 py-0 uppercase tracking-wider ${eBadge.color}`}>{eBadge.label}</Badge>
        </div>
      </div>

      <div className="mt-2">
        {item.status !== 'Done' && (
          <CardExpandable item={item} updateMutation={updateMutation} />
        )}
      </div>
    </div>
  );
};

export default function PixelBoardWidget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const [newQuestion, setNewQuestion] = useState({
    title: '',
    details: '',
    question_type: 'Question',
    answer_type: 'Text',
    choices: [''],
    priority: 'Normal',
    importance: false,
    category: 'Other',
    card_color: ''
  });

  const { data: items = [], isLoading, isFetching } = useQuery({
    queryKey: ['pixelBoard'],
    queryFn: () => base44.entities.PixelBoard.list('-created_date')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PixelBoard.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pixelBoard'] })
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PixelBoard.create({ ...data, asked_by: 'Nikole', status: 'Unanswered', batch_ready: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pixelBoard'] });
      setIsAskModalOpen(false);
      setNewQuestion({ title: '', details: '', question_type: 'Question', answer_type: 'Text', choices: [''], priority: 'Normal', importance: false, category: 'Other', card_color: '' });
      toast({ title: "Draft saved. Ready to batch send." });
    }
  });

  const previousUnreadCount = useRef(0);
  const unreadCount = items.filter(i => !i.nikole_read).length;

  useEffect(() => {
    if (unreadCount > previousUnreadCount.current) {
      playDing();
    }
    previousUnreadCount.current = unreadCount;
  }, [unreadCount]);

  const handleAskSubmit = () => {
    if (!newQuestion.title) return;
    const data = { ...newQuestion };
    if (data.answer_type !== 'Multiple Choice') {
      data.choices = [];
    }
    createMutation.mutate(data);
  };

  const handleMarkAllRead = (e) => {
    e.stopPropagation();
    const unread = items.filter(i => !i.nikole_read);
    if (unread.length === 0) return;
    unread.forEach(item => {
      updateMutation.mutate({ id: item.id, data: { nikole_read: true } });
    });
  };

  const handleRefresh = (e) => {
    e.stopPropagation();
    queryClient.invalidateQueries({ queryKey: ['pixelBoard'] });
  };

  const activeItems = items.filter(i => i.status !== 'Done');
  const closedItems = items.filter(i => i.status === 'Done');

  const readyCount = activeItems.filter(i => i.batch_ready && i.status === 'Unanswered').length;
  const holdCount = activeItems.filter(i => !i.batch_ready && i.status === 'Unanswered' && !i.pixel_read).length;
  const answeredCount = activeItems.filter(i => i.status === 'Answered' || i.status === 'Reviewed').length;

  const handleSendBatch = async () => {
    const itemsToSend = activeItems.filter(i => i.batch_ready || (i.nikole_response && i.nikole_response.trim() !== ''));
    if (itemsToSend.length === 0) return;
    
    toast({ title: `Sending ${itemsToSend.length} items to Pixel Poster...` });
    
    await Promise.all(itemsToSend.map(item => 
      updateMutation.mutateAsync({ id: item.id, data: { batch_ready: true } })
    ));
    
    toast({ title: "Sent! Pixel Poster is on it 🩵", duration: 3000 });
  };

  const sortedActiveItems = [...activeItems].sort((a, b) => {
    if (!a.nikole_read && b.nikole_read) return -1;
    if (a.nikole_read && !b.nikole_read) return 1;
    
    const aReady = a.batch_ready && a.status === 'Unanswered' ? 1 : 0;
    const bReady = b.batch_ready && b.status === 'Unanswered' ? 1 : 0;
    if (aReady > bReady) return -1;
    if (aReady < bReady) return 1;
    
    const pScore = { 'Urgent': 4, 'Critical': 4, 'High': 3, 'Medium': 2, 'Normal': 1, 'When You Get To It': 0, 'Low': 0 };
    const pA = pScore[a.priority] || 0;
    const pB = pScore[b.priority] || 0;
    if (pA > pB) return -1;
    if (pA < pB) return 1;
    
    return new Date(b.created_date) - new Date(a.created_date);
  });

  const filteredActiveItems = sortedActiveItems.filter(item => {
    if (activeCategory !== 'All' && item.category !== activeCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchDetails = item.details?.toLowerCase().includes(q);
      const matchResponse = item.nikole_response?.toLowerCase().includes(q) || item.pixel_response?.toLowerCase().includes(q);
      const matchChoices = item.choices?.some(c => c.toLowerCase().includes(q));
      if (!matchTitle && !matchDetails && !matchResponse && !matchChoices) return false;
    }
    return true;
  });

  return (
    <Card className="bg-gradient-to-br from-[#2D1B69] to-[#6B3FA0] border-0 shadow-lg overflow-hidden flex flex-col max-h-[800px]">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full flex-shrink-0">
        <CollapsibleTrigger className="w-full focus:outline-none">
          <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-[#24C4D6]" />
              <div className="flex flex-col items-start">
                <h3 className="text-xl font-bold text-white text-left flex items-center gap-2">
                  Pixel Board
                </h3>
                <div className="text-xs text-white/70 font-medium">
                  {readyCount} ready · {holdCount} hold · {answeredCount} answered
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative cursor-pointer" onClick={handleMarkAllRead}>
                <Bell className="w-5 h-5 text-white/80 hover:text-white transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button 
                onClick={handleRefresh}
                className="p-1.5 hover:bg-white/10 rounded-full text-white/70 hover:text-white transition-colors ml-1"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-[#24C4D6]' : ''}`} />
              </button>
              <div className="text-white/70 ml-1">
                {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
      </Collapsible>
      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 pt-0 border-t border-white/10">
              
              <div className="py-3 border-b border-white/5 mb-4">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-3">
                  <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
                    <Input 
                      placeholder="Search titles, details, answers..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-black/20 border-white/10 text-white h-9 rounded-full focus-visible:ring-[#24C4D6]"
                    />
                  </div>
                  {searchQuery && (
                    <div className="text-xs text-white/50 font-bold">{filteredActiveItems.length} results</div>
                  )}
                </div>
                
                {/* Horizontal Scrollable Categories */}
                <div className="flex overflow-x-auto custom-scrollbar gap-2 pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                  <button 
                    onClick={() => setActiveCategory('All')}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${activeCategory === 'All' ? 'bg-[#24C4D6]/20 text-[#24C4D6] border-[#24C4D6]/30' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}
                  >
                    All
                  </button>
                  {categories.map(c => (
                    <button 
                      key={c}
                      onClick={() => setActiveCategory(c)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${activeCategory === c ? 'bg-[#24C4D6]/20 text-[#24C4D6] border-[#24C4D6]/30' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {isLoading ? (
                <div className="py-8 text-center text-white/50"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
              ) : filteredActiveItems.length === 0 ? (
                <div className="text-center p-6 text-white/50 text-sm">
                  {sortedActiveItems.length === 0 ? "The board is completely clear!" : "No items match your search."}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr gap-3">
                  {filteredActiveItems.map(item => <BoardCard key={item.id} item={item} updateMutation={updateMutation} searchQuery={searchQuery} />)}
                </div>
              )}

              {/* Closed Items */}
              {closedItems.length > 0 && (
                <div className="mt-6 pt-4 border-t border-white/10">
                  <Button variant="ghost" className="w-full justify-start text-white/50 text-xs px-2 h-8" onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}>
                    {isHistoryExpanded ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
                    📁 Closed Items ({closedItems.length})
                  </Button>
                  {isHistoryExpanded && (
                    <div className="space-y-2 mt-2 pl-2 border-l border-white/10 ml-3">
                      {closedItems.map(item => (
                        <div key={item.id} className="text-xs text-white/40 flex items-center justify-between bg-white/5 p-2 rounded-md">
                          <span className="truncate pr-2">{item.title}</span>
                          <span className="shrink-0">{moment(item.updated_date).fromNow()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-black/20 border-t border-white/10 space-y-3 shrink-0">
              <Dialog open={isAskModalOpen} onOpenChange={setIsAskModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full bg-transparent border-[#24C4D6]/50 text-[#24C4D6] hover:bg-[#24C4D6]/10 hover:border-[#24C4D6] h-10">
                    <Plus className="w-4 h-4 mr-2" /> ✏️ Ask Pixel Poster
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[400px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Ask Pixel Poster</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Title (Required)</Label>
                      <Input placeholder="What do you need?" value={newQuestion.title} onChange={e => setNewQuestion({...newQuestion, title: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Details</Label>
                      <Textarea placeholder="More context..." value={newQuestion.details} onChange={e => setNewQuestion({...newQuestion, details: e.target.value})} className="resize-y" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={newQuestion.question_type} onValueChange={v => {
                          const autoImportant = v === 'Bug' || v === 'Decision Needed';
                          setNewQuestion({...newQuestion, question_type: v, importance: autoImportant});
                        }}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.keys(typeColors).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            <SelectItem value="General">General</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select value={newQuestion.priority} onValueChange={v => setNewQuestion({...newQuestion, priority: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="When You Get To It">⚪ When You Get To It</SelectItem>
                            <SelectItem value="Normal">🔵 Normal</SelectItem>
                            <SelectItem value="Urgent">🔥 Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Importance</Label>
                        <Select value={newQuestion.importance ? "true" : "false"} onValueChange={v => setNewQuestion({...newQuestion, importance: v === "true"})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">⭐ Important</SelectItem>
                            <SelectItem value="false">Not Important</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select value={newQuestion.category} onValueChange={v => setNewQuestion({...newQuestion, category: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Card Color</Label>
                        <Select value={newQuestion.card_color || 'auto'} onValueChange={v => setNewQuestion({...newQuestion, card_color: v === 'auto' ? '' : v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto Mode</SelectItem>
                            {Object.keys(hexColors).map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Answer Format</Label>
                      <Select value={newQuestion.answer_type} onValueChange={v => setNewQuestion({...newQuestion, answer_type: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Text">Text Response</SelectItem>
                          <SelectItem value="Yes/No">Yes / No</SelectItem>
                          <SelectItem value="Multiple Choice">Multiple Choice</SelectItem>
                          <SelectItem value="Both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {(newQuestion.answer_type === 'Multiple Choice' || newQuestion.answer_type === 'Both') && (
                      <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <Label>Choices</Label>
                        {newQuestion.choices.map((choice, i) => (
                          <div key={i} className="flex gap-2 mb-2">
                            <Input value={choice} placeholder={`Option ${i+1}`} onChange={e => {
                              const newChoices = [...newQuestion.choices];
                              newChoices[i] = e.target.value;
                              setNewQuestion({...newQuestion, choices: newChoices});
                            }} />
                            <Button variant="ghost" size="icon" onClick={() => {
                              const newChoices = newQuestion.choices.filter((_, idx) => idx !== i);
                              setNewQuestion({...newQuestion, choices: newChoices.length ? newChoices : ['']});
                            }}>
                              <X className="w-4 h-4 text-red-400" />
                            </Button>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => setNewQuestion({...newQuestion, choices: [...newQuestion.choices, '']})} className="w-full text-xs">
                          <Plus className="w-3 h-3 mr-1" /> Add Choice
                        </Button>
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsAskModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleAskSubmit} disabled={!newQuestion.title || createMutation.isPending} className="bg-[#24C4D6] hover:bg-[#1EABC0] text-white">
                      Draft Question
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button 
                onClick={handleSendBatch}
                disabled={readyCount === 0 && activeItems.filter(i => i.nikole_response && i.nikole_response.trim() !== '').length === 0}
                className="w-full bg-[#24C4D6] hover:bg-[#1EABC0] disabled:bg-white/10 disabled:text-white/30 disabled:border-0 text-white font-bold h-12 shadow-[0_0_15px_rgba(36,196,214,0.3)] hover:shadow-[0_0_25px_rgba(36,196,214,0.5)] disabled:shadow-none transition-all"
              >
                📤 Send Batch to Pixel Poster
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}