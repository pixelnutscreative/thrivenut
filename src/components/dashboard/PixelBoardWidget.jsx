import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { MessageSquare, ChevronDown, ChevronRight, CheckCircle2, Eye, Plus, Send, Paperclip, Loader2, Pin, Search, X, Clock, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';

const priorityConfig = {
  'Urgent': { emoji: '🔥', color: 'bg-red-100 text-red-700 border-red-200' },
  'Normal': { emoji: '🔵', color: 'bg-[#24C4D6]/20 text-[#0D626C] border-[#24C4D6]/30' },
  'When You Get To It': { emoji: '⚪', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  // Fallbacks
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
const statuses = ['Unanswered', 'Answered', 'Reviewed', 'Done'];

export default function PixelBoardWidget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('answer_me');
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  
  const [newQuestion, setNewQuestion] = useState({
    title: '',
    details: '',
    question_type: 'Question',
    answer_type: 'Text',
    choices: [''],
    priority: 'Normal'
  });

  const { data: items = [], isLoading } = useQuery({
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
      setNewQuestion({ title: '', details: '', question_type: 'Question', answer_type: 'Text', choices: [''], priority: 'Normal' });
      toast({ title: "Draft saved. Ready to batch send." });
    }
  });

  const uploadFile = async (file) => {
    try {
      const response = await base44.integrations.Core.UploadFile({ file });
      return response.file_url;
    } catch (e) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
      return null;
    }
  };

  const questionsForYou = items.filter(i => i.asked_by === 'Pixel Poster' && i.status === 'Unanswered').sort((a, b) => {
      const priorityOrder = { 'Urgent': 4, 'Critical': 4, 'High': 3, 'Medium': 2, 'Normal': 2, 'Low': 1, 'When You Get To It': 0 };
      return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
  });
  
  const answersReady = items.filter(i => i.asked_by === 'Nikole' && i.status === 'Answered').sort((a, b) => {
      return new Date(b.updated_date) - new Date(a.updated_date);
  });
  
  const unreadQuestions = items.filter(i => i.asked_by === 'Pixel Poster' && !i.nikole_read).length;
  const unreadAnswers = items.filter(i => i.asked_by === 'Nikole' && i.status === 'Answered' && !i.nikole_read).length;
  const waitingToSend = items.filter(i => i.asked_by === 'Nikole' && i.status === 'Unanswered' && !i.batch_ready);
  
  // Header badge calculation for unread urgent items
  const hasUnreadUrgent = items.some(i => 
    !i.nikole_read && 
    (i.priority === 'Urgent' || i.priority === 'Critical' || i.priority === 'High') && 
    i.status !== 'Reviewed' && i.status !== 'Done'
  );

  const handleAskSubmit = () => {
    if (!newQuestion.title) return;
    const data = { ...newQuestion };
    if (data.answer_type !== 'Multiple Choice') {
      data.choices = [];
    }
    createMutation.mutate(data);
  };

  const handleSendBatch = () => {
    if (waitingToSend.length === 0) return;
    const mostRecent = waitingToSend[0];
    updateMutation.mutate({ id: mostRecent.id, data: { batch_ready: true } });
    
    toast({
      title: "Sent! Pixel Poster is on it 🩵",
      description: `${waitingToSend.length} questions sent successfully.`,
      duration: 3000,
    });
  };

  const filters = ['All', '🔥 Urgent', 'Bug', 'Task', 'Question', 'Idea', 'Decision Needed'];

  const filterList = (list) => {
    return list.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (item.details || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      
      if (activeFilter === 'All') return true;
      if (activeFilter === '🔥 Urgent') return item.priority === 'Urgent' || item.priority === 'Critical' || item.priority === 'High';
      return item.question_type === activeFilter;
    });
  };

  const CardHeaderInfo = ({ item }) => {
    const pConf = priorityConfig[item.priority] || priorityConfig['Normal'];
    const tColor = typeColors[item.question_type] || defaultTypeColor;
    const daysOld = moment().diff(moment(item.created_date), 'days');
    const isOldUrgent = (item.priority === 'Urgent' || item.priority === 'Critical') && item.status === 'Unanswered' && daysOld > 0;
    
    const currentIndex = statuses.indexOf(item.status);
    
    return (
      <>
        <div className="flex items-center justify-between mb-2">
           <div className="flex flex-wrap items-center gap-1.5">
             <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${pConf.color}`}>
               {pConf.emoji} {item.priority}
             </Badge>
             <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${tColor}`}>
               {item.question_type}
             </Badge>
             {isOldUrgent && (
               <Badge className="bg-orange-50 text-orange-600 border-orange-200 text-[9px] px-1 shadow-sm h-4">
                 <Clock className="w-2.5 h-2.5 mr-0.5" /> Waiting {daysOld}d
               </Badge>
             )}
             {item.pinned && <Pin className="w-3 h-3 text-[#6B3FA0]" />}
           </div>
           <span className="text-[10px] text-white/40">{moment(item.created_date).fromNow()}</span>
        </div>
        <div className="flex items-center gap-1 mb-2 opacity-60 scale-75 origin-left">
          {statuses.map((s, idx) => (
            <React.Fragment key={s}>
              <div className={`text-[9px] uppercase font-bold ${idx <= currentIndex ? 'text-[#24C4D6]' : 'text-white/40'}`}>
                {s}
              </div>
              {idx < statuses.length - 1 && <ChevronRight className="w-2 h-2 text-white/30" />}
            </React.Fragment>
          ))}
        </div>
      </>
    );
  };

  const QuestionCard = ({ item }) => {
    const [responseText, setResponseText] = useState(item.nikole_response || '');
    const [uploading, setUploading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const fileInputRef = useRef(null);

    const handleDone = async () => {
      if (!responseText.trim() && !item.nikole_attachment_url) return;
      setShowSuccess(true);
      await updateMutation.mutateAsync({ 
        id: item.id, 
        data: { nikole_response: responseText, status: 'Answered', nikole_read: true, pixel_read: false } 
      });
      setTimeout(() => setShowSuccess(false), 2000);
    };

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

    return (
      <div className="bg-white/5 border border-white/10 p-4 rounded-xl mb-3 relative overflow-hidden" onMouseEnter={() => {
        if (!item.nikole_read) updateMutation.mutate({ id: item.id, data: { nikole_read: true }});
      }}>
        <CardHeaderInfo item={item} />
        <h4 className="font-bold text-white text-base mb-1">{item.title}</h4>
        
        {item.details && (
          <div className="mb-3">
            <div className={`text-xs text-white/60 whitespace-pre-wrap ${!expanded ? 'line-clamp-2' : ''}`}>
              {item.details}
            </div>
            {item.details.length > 80 && (
              <button onClick={() => setExpanded(!expanded)} className="text-[#24C4D6] text-[10px] font-semibold mt-0.5 hover:underline">
                {expanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        )}
        
        {item.choices && item.choices.length > 0 && item.choices[0] !== '' && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {item.choices.map((choice, i) => (
              <button
                key={i}
                onClick={() => setResponseText(prev => prev ? `${prev}\n${choice}` : choice)}
                className="px-2.5 py-1 bg-white/10 hover:bg-[#24C4D6]/30 hover:text-[#24C4D6] border border-white/10 text-white/80 text-[10px] rounded-full transition-colors font-medium"
              >
                {choice}
              </button>
            ))}
          </div>
        )}
        
        <div className="relative">
          <Textarea 
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Type your answer..."
            className="min-h-[80px] bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-[#24C4D6] text-sm resize-y mb-2"
          />
          
          <div className="flex items-center justify-between">
             <div className="flex gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileUpload} 
                  accept="image/*,.pdf,.doc,.docx"
                />
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-7 w-7 text-white/60 hover:text-white bg-white/5 border border-white/10"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
                </Button>
                {item.nikole_attachment_url && (
                  <a href={item.nikole_attachment_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-[10px] text-[#24C4D6] hover:underline">
                    <Paperclip className="w-3 h-3 mr-1" /> Attached
                  </a>
                )}
             </div>
             <Button 
               size="sm" 
               onClick={handleDone}
               disabled={!responseText.trim() && !item.nikole_attachment_url}
               className="bg-[#24C4D6] hover:bg-[#1EABC0] text-white shrink-0 h-8"
             >
               <CheckCircle2 className="w-4 h-4 mr-1.5" /> Done
             </Button>
          </div>
          
          <AnimatePresence>
            {showSuccess && (
              <motion.div 
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-[#2D1B69]/80 backdrop-blur-sm rounded-md z-10"
              >
                <div className="bg-[#24C4D6]/20 text-[#24C4D6] p-2 rounded-full shadow-lg flex items-center gap-2 border border-[#24C4D6]/40">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-bold text-sm">Saved!</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  const AnswerCard = ({ item }) => {
    return (
      <div className="bg-white/5 border border-white/10 p-4 rounded-xl mb-3" onMouseEnter={() => {
        if (!item.nikole_read) updateMutation.mutate({ id: item.id, data: { nikole_read: true }});
      }}>
        <CardHeaderInfo item={item} />
        <h4 className="font-bold text-white text-base mb-1">{item.title}</h4>
        
        <div className="mt-3 relative">
          <div className="absolute -top-2 left-4 text-[#24C4D6]">
            <svg width="12" height="9" viewBox="0 0 20 15" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 15L10 0L20 15H0Z" />
            </svg>
          </div>
          <div className="p-3 bg-[#24C4D6]/10 border border-[#24C4D6]/30 rounded-xl rounded-tl-sm text-[#24C4D6] text-xs whitespace-pre-wrap">
            {item.pixel_response}
          </div>
        </div>
        
        <div className="mt-3 flex justify-end">
          <Button 
            size="sm" 
            variant="ghost"
            onClick={() => updateMutation.mutate({ id: item.id, data: { status: 'Reviewed', nikole_read: true } })}
            className="text-white/70 hover:text-white hover:bg-white/10 h-8"
          >
            <Eye className="w-4 h-4 mr-1.5" /> Got it
          </Button>
        </div>
      </div>
    );
  };

  const SearchAndFilter = () => (
    <div className="mb-4">
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-white/40 w-4 h-4" />
        <Input 
          placeholder="Search..." 
          className="pl-8 bg-black/20 border-white/10 text-white placeholder:text-white/40 h-9 rounded-full focus-visible:ring-[#24C4D6] text-xs"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="flex overflow-x-auto pb-1 gap-1.5 custom-scrollbar hide-scrollbar">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-colors flex-shrink-0 ${
              activeFilter === f 
                ? 'bg-[#24C4D6] text-white' 
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <Card className="bg-gradient-to-br from-[#2D1B69] to-[#6B3FA0] border-0 shadow-lg overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <CollapsibleTrigger className="w-full focus:outline-none">
          <div className="p-5 flex items-center justify-between hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-[#24C4D6]" />
              <h3 className="text-xl font-bold text-white text-left flex items-center gap-2">
                Pixel Board
                {hasUnreadUrgent && <span className="animate-bounce" title="Unread Urgent Items!">🔥</span>}
              </h3>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex gap-2 hidden sm:flex">
                <Badge className="bg-white/10 text-white hover:bg-white/20 border-0 flex items-center gap-1.5">
                  <span className="text-base">🙋</span>
                  <span>{unreadQuestions} Questions for You</span>
                </Badge>
                <Badge className="bg-[#24C4D6]/20 text-[#24C4D6] hover:bg-[#24C4D6]/30 border-0 flex items-center gap-1.5">
                  <span className="text-base">✅</span>
                  <span>{unreadAnswers} Answers Ready</span>
                </Badge>
              </div>
              <div className="text-white/70">
                {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </div>
            </div>
          </div>
          <div className="px-5 pb-3 sm:hidden flex flex-wrap gap-2">
            <Badge className="bg-white/10 text-white border-0 flex items-center gap-1 text-xs">
              <span>🙋</span> {unreadQuestions} Questions
            </Badge>
            <Badge className="bg-[#24C4D6]/20 text-[#24C4D6] border-0 flex items-center gap-1 text-xs">
              <span>✅</span> {unreadAnswers} Answers
            </Badge>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="p-4 pt-0 border-t border-white/10">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
              <TabsList className="grid w-full grid-cols-2 bg-black/20 p-1 mb-4">
                <TabsTrigger value="answer_me" className="data-[state=active]:bg-[#24C4D6] data-[state=active]:text-white text-white/70 text-xs">
                  🙋 Answer Me ({questionsForYou.length})
                </TabsTrigger>
                <TabsTrigger value="from_pixel" className="data-[state=active]:bg-[#24C4D6] data-[state=active]:text-white text-white/70 relative text-xs">
                  📬 From Pixel Poster
                  {unreadAnswers > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <SearchAndFilter />
              
              <div className="max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
                <TabsContent value="answer_me" className="mt-0">
                  {isLoading ? (
                    <div className="py-8 text-center text-white/50"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
                  ) : filterList(questionsForYou).length === 0 ? (
                    <div className="text-center p-6 text-white/50 text-sm">
                      {searchQuery || activeFilter !== 'All' ? 'No matching questions.' : "You're all caught up!"}
                    </div>
                  ) : (
                    filterList(questionsForYou).map(item => <QuestionCard key={item.id} item={item} />)
                  )}
                </TabsContent>
                
                <TabsContent value="from_pixel" className="mt-0">
                  {isLoading ? (
                    <div className="py-8 text-center text-white/50"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
                  ) : filterList(answersReady).length === 0 ? (
                    <div className="text-center p-6 text-white/50 text-sm">
                      {searchQuery || activeFilter !== 'All' ? 'No matching answers.' : "No new answers from Pixel Poster."}
                    </div>
                  ) : (
                    filterList(answersReady).map(item => <AnswerCard key={item.id} item={item} />)
                  )}
                </TabsContent>
              </div>
            </Tabs>
            
            <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
              <Dialog open={isAskModalOpen} onOpenChange={setIsAskModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full bg-transparent border-[#24C4D6] text-[#24C4D6] hover:bg-[#24C4D6]/10 hover:text-[#24C4D6] h-10">
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
                      <Input 
                        placeholder="What do you need?" 
                        value={newQuestion.title}
                        onChange={e => setNewQuestion({...newQuestion, title: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Details</Label>
                      <Textarea 
                        placeholder="More context..."
                        value={newQuestion.details}
                        onChange={e => setNewQuestion({...newQuestion, details: e.target.value})}
                        className="resize-y"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={newQuestion.question_type} onValueChange={v => setNewQuestion({...newQuestion, question_type: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Bug">Bug</SelectItem>
                            <SelectItem value="Task">Task</SelectItem>
                            <SelectItem value="Question">Question</SelectItem>
                            <SelectItem value="Idea">Idea</SelectItem>
                            <SelectItem value="Decision Needed">Decision Needed</SelectItem>
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
                            <Input 
                              value={choice} 
                              placeholder={`Option ${i+1}`}
                              onChange={e => {
                                const newChoices = [...newQuestion.choices];
                                newChoices[i] = e.target.value;
                                setNewQuestion({...newQuestion, choices: newChoices});
                              }}
                            />
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => {
                                const newChoices = newQuestion.choices.filter((_, idx) => idx !== i);
                                setNewQuestion({...newQuestion, choices: newChoices.length ? newChoices : ['']});
                              }}
                            >
                              <X className="w-4 h-4 text-red-400" />
                            </Button>
                          </div>
                        ))}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setNewQuestion({...newQuestion, choices: [...newQuestion.choices, '']})}
                          className="w-full text-xs"
                        >
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

              {waitingToSend.length > 0 && (
                <div className="pt-2">
                  <p className="text-center text-xs text-white/60 mb-2">
                    {waitingToSend.length} {waitingToSend.length === 1 ? 'item' : 'items'} waiting to send
                  </p>
                  <Button 
                    onClick={handleSendBatch}
                    className="w-full bg-[#24C4D6] hover:bg-[#1EABC0] text-white font-bold h-12 shadow-[0_0_15px_rgba(36,196,214,0.3)] hover:shadow-[0_0_25px_rgba(36,196,214,0.5)] transition-all"
                  >
                    📤 Send Batch to Pixel Poster
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}