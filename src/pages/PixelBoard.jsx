import React, { useState, useRef, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Plus, MessageSquare, Inbox, CheckCircle2, Send, X, ArrowLeft, Search, Paperclip, Loader2, Pin, Clock, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';

const priorityConfig = {
  'Urgent': { emoji: '🔥', color: 'bg-red-100 text-red-700 border-red-200' },
  'Normal': { emoji: '🔵', color: 'bg-[#24C4D6]/20 text-[#0D626C] border-[#24C4D6]/30' },
  'When You Get To It': { emoji: '⚪', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  // Fallbacks for old data
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

export default function PixelBoard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('from_pixel');
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

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PixelBoard.create({ ...data, asked_by: 'Nikole', status: 'Unanswered', batch_ready: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pixelBoard'] });
      setIsAskModalOpen(false);
      setNewQuestion({ title: '', details: '', question_type: 'Question', answer_type: 'Text', choices: [''], priority: 'Normal' });
      setActiveTab('my_questions');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PixelBoard.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pixelBoard'] })
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

  const fromPixel = items.filter(i => i.asked_by === 'Pixel Poster');
  const myQuestions = items.filter(i => i.asked_by === 'Nikole');
  
  const waitingToSend = myQuestions.filter(i => i.status === 'Unanswered' && !i.batch_ready);
  
  const unreadFromPixel = fromPixel.filter(i => !i.nikole_read).length;
  const unreadMyQuestions = myQuestions.filter(i => !i.nikole_read && i.status !== 'Unanswered').length;

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

  const handleAskSubmit = () => {
    if (!newQuestion.title) return;
    const data = { ...newQuestion };
    if (data.answer_type !== 'Multiple Choice') {
      data.choices = [];
    }
    createMutation.mutate(data);
  };

  const filters = ['All', '🔥 Urgent', 'Bug', 'Task', 'Question', 'Idea', 'Decision Needed'];

  const filterAndSort = (list) => {
    return list.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (item.details || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      
      if (activeFilter === 'All') return true;
      if (activeFilter === '🔥 Urgent') return item.priority === 'Urgent' || item.priority === 'Critical' || item.priority === 'High';
      return item.question_type === activeFilter;
    }).sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.created_date) - new Date(a.created_date);
    });
  };

  const BoardCard = ({ item, isFromPixel }) => {
    const [responseText, setResponseText] = useState(item.nikole_response || '');
    const [uploading, setUploading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const fileInputRef = useRef(null);

    const isUnread = !item.nikole_read && (isFromPixel || item.status !== 'Unanswered');
    const showPixelBadge = item.pixel_read === true && item.nikole_read === false;
    
    const pConf = priorityConfig[item.priority] || priorityConfig['Normal'];
    const tColor = typeColors[item.question_type] || defaultTypeColor;

    const daysOld = moment().diff(moment(item.created_date), 'days');
    const isOldUrgent = (item.priority === 'Urgent' || item.priority === 'Critical') && item.status === 'Unanswered' && daysOld > 0;

    const markAsRead = () => {
      if (isUnread) updateMutation.mutate({ id: item.id, data: { nikole_read: true } });
    };

    const submitResponse = async () => {
      if (!responseText.trim() && !item.nikole_attachment_url) return;
      
      setShowSuccess(true);
      await updateMutation.mutateAsync({ 
        id: item.id, 
        data: { nikole_response: responseText, status: 'Answered', pixel_read: false, nikole_read: true } 
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

    const advanceStatus = () => {
      const idx = statuses.indexOf(item.status);
      if (idx >= 0 && idx < statuses.length - 1) {
        updateMutation.mutate({ id: item.id, data: { status: statuses[idx + 1], nikole_read: true } });
      }
    };

    const StatusTrail = () => {
      const currentIndex = statuses.indexOf(item.status);
      return (
        <div className="flex items-center gap-1 mt-3 mb-4 opacity-70 scale-90 origin-left">
          {statuses.map((s, idx) => (
            <React.Fragment key={s}>
              <div className={`text-[10px] uppercase font-bold tracking-wider ${idx <= currentIndex ? 'text-[#24C4D6]' : 'text-gray-400'}`}>
                {s}
              </div>
              {idx < statuses.length - 1 && <ChevronRight className="w-3 h-3 text-gray-300 mx-0.5" />}
            </React.Fragment>
          ))}
        </div>
      );
    };

    return (
      <Card 
        className={`border-0 overflow-hidden transition-all duration-300 bg-white ${
          isUnread ? 'ring-2 ring-[#24C4D6] shadow-[0_0_15px_rgba(36,196,214,0.3)]' : 'shadow-md hover:shadow-lg'
        }`}
        onMouseEnter={markAsRead}
      >
        <div className="p-2.5 bg-gray-50 flex flex-wrap items-center justify-between border-b border-gray-100 gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`text-xs ${pConf.color}`}>
              {pConf.emoji} {item.priority}
            </Badge>
            <Badge variant="outline" className={`text-xs ${tColor}`}>
              {item.question_type}
            </Badge>
            {showPixelBadge && (
              <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px] px-1.5 flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                📬 From Pixel Poster
              </Badge>
            )}
            {isOldUrgent && (
              <Badge className="bg-orange-50 text-orange-600 border-orange-200 text-[10px] px-1.5 flex items-center gap-1 shadow-sm">
                <Clock className="w-3 h-3" /> Waiting {daysOld} {daysOld === 1 ? 'day' : 'days'}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">{moment(item.created_date).fromNow()}</span>
            <button 
              onClick={() => updateMutation.mutate({ id: item.id, data: { pinned: !item.pinned } })}
              className={`p-1.5 rounded-md hover:bg-gray-200 transition-colors ${item.pinned ? 'text-[#6B3FA0] bg-purple-100' : 'text-gray-400'}`}
            >
              <Pin className="w-3 h-3" />
            </button>
          </div>
        </div>
        
        <CardContent className="p-5">
          <StatusTrail />

          <h3 className="font-bold text-gray-900 text-xl mb-2 leading-tight">{item.title}</h3>
          
          {item.details && (
            <div className="mb-4">
              <div className={`text-sm text-gray-500 whitespace-pre-wrap ${!expanded ? 'line-clamp-2' : ''}`}>
                {item.details}
              </div>
              {item.details.length > 100 && (
                <button 
                  onClick={() => setExpanded(!expanded)} 
                  className="text-[#24C4D6] text-xs font-semibold mt-1 flex items-center hover:underline"
                >
                  {expanded ? 'Show less' : 'Read more'} {expanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                </button>
              )}
            </div>
          )}

          {!isFromPixel && item.pixel_response && (
            <div className="mb-5 relative">
              <div className="absolute -top-3 left-4 text-[#24C4D6]">
                <svg width="20" height="15" viewBox="0 0 20 15" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 15L10 0L20 15H0Z" />
                </svg>
              </div>
              <div className="p-4 bg-[#24C4D6] bg-opacity-10 border border-[#24C4D6]/30 rounded-xl rounded-tl-sm text-[#0D626C] text-sm whitespace-pre-wrap">
                <strong>Pixel Poster says:</strong><br/>
                {item.pixel_response}
              </div>
            </div>
          )}

          {item.choices && item.choices.length > 0 && item.choices[0] !== '' && (
            <div className="flex flex-wrap gap-2 mb-4">
              {item.choices.map((choice, i) => (
                <button
                  key={i}
                  onClick={() => setResponseText(prev => prev ? `${prev}\n${choice}` : choice)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 text-xs rounded-full transition-colors font-medium"
                >
                  {choice}
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-100">
            <Label className="text-xs text-[#6B3FA0] font-bold uppercase mb-2 block">Your Response</Label>
            
            <div className="relative mb-3">
              <Textarea 
                placeholder={item.status === 'Done' ? 'Completed.' : 'Type your answer or notes here...'} 
                className="min-h-[100px] bg-gray-50 border-gray-200 focus-visible:ring-[#24C4D6] text-sm resize-y"
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
              />
              
              <div className="absolute bottom-2 left-2 flex gap-2">
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
                  className="h-8 w-8 text-gray-400 hover:text-[#6B3FA0] bg-white border border-gray-200 shadow-sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  title="Attach file"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                </Button>
              </div>

              <AnimatePresence>
                {showSuccess && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-md z-10"
                  >
                    <div className="bg-green-100 text-green-600 p-3 rounded-full shadow-lg flex items-center gap-2">
                      <CheckCircle2 className="w-6 h-6" />
                      <span className="font-bold">Sent!</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {item.nikole_attachment_url && (
              <div className="mb-3">
                <a href={item.nikole_attachment_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs text-[#24C4D6] bg-[#24C4D6]/10 px-3 py-1.5 rounded-lg border border-[#24C4D6]/20 hover:bg-[#24C4D6]/20 transition-colors">
                  <Paperclip className="w-3 h-3" /> View Attachment
                </a>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                className="flex-1 bg-[#24C4D6] hover:bg-[#1EABC0] text-white font-semibold"
                onClick={submitResponse}
              >
                <Send className="w-4 h-4 mr-2" /> Save & Answer
              </Button>
              {item.status === 'Answered' && !isFromPixel && (
                <Button 
                  variant="outline"
                  className="border-[#24C4D6] text-[#24C4D6] hover:bg-[#24C4D6] hover:text-white"
                  onClick={advanceStatus}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Reviewed
                </Button>
              )}
              {item.status === 'Reviewed' && (
                <Button 
                  variant="outline"
                  className="border-green-500 text-green-600 hover:bg-green-500 hover:text-white"
                  onClick={advanceStatus}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Mark Done
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const FilterSection = () => (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input 
          placeholder="Search questions or details..." 
          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12 rounded-full focus-visible:ring-[#24C4D6]"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              activeFilter === f 
                ? 'bg-[#24C4D6] text-white shadow-[0_0_10px_rgba(36,196,214,0.4)]' 
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2D1B69] to-[#6B3FA0] p-4 md:p-8 pb-32">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link to={createPageUrl('Admin')}>
                <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10 p-0 h-auto">
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back to Admin
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-[#24C4D6]" />
              Pixel Board
            </h1>
            <p className="text-purple-200 mt-1">Direct communication hub with Pixel Poster</p>
          </div>

          <Dialog open={isAskModalOpen} onOpenChange={setIsAskModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#24C4D6] hover:bg-[#1EABC0] text-white font-bold px-6 py-6 rounded-full shadow-[0_0_15px_rgba(36,196,214,0.3)] hover:shadow-[0_0_25px_rgba(36,196,214,0.5)] transition-all">
                <Plus className="w-5 h-5 mr-2" /> Ask Pixel Poster
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold text-[#6B3FA0]">Ask Pixel Poster</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title / Summary (Required)</Label>
                  <Input 
                    placeholder="What do you need?" 
                    value={newQuestion.title}
                    onChange={e => setNewQuestion({...newQuestion, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Details</Label>
                  <Textarea 
                    placeholder="Provide more context..."
                    className="min-h-[100px]"
                    value={newQuestion.details}
                    onChange={e => setNewQuestion({...newQuestion, details: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Question Type</Label>
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
                <Button onClick={handleAskSubmit} disabled={!newQuestion.title || createMutation.isPending} className="bg-[#6B3FA0] hover:bg-[#522f7a]">
                  Submit Question
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <FilterSection />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/10 p-1 rounded-xl h-14 shadow-md">
            <TabsTrigger 
              value="from_pixel" 
              className="rounded-lg text-white data-[state=active]:bg-white data-[state=active]:text-[#2D1B69] font-bold text-sm md:text-base h-full relative transition-all"
            >
              <Inbox className="w-5 h-5 mr-2 opacity-70" />
              📥 From Pixel Poster
              {unreadFromPixel > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-[#24C4D6] text-white border-white shadow-sm">
                  {unreadFromPixel}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="my_questions" 
              className="rounded-lg text-white data-[state=active]:bg-white data-[state=active]:text-[#2D1B69] font-bold text-sm md:text-base h-full relative transition-all"
            >
              <MessageSquare className="w-5 h-5 mr-2 opacity-70" />
              💬 My Questions
              {unreadMyQuestions > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-[#24C4D6] text-white border-white shadow-sm">
                  {unreadMyQuestions}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="mt-8">
            <TabsContent value="from_pixel" className="focus:outline-none">
              {isLoading ? (
                <div className="text-center p-12 text-white/50 flex flex-col items-center"><Loader2 className="w-8 h-8 animate-spin mb-2" />Loading board...</div>
              ) : filterAndSort(fromPixel).length === 0 ? (
                <div className="text-center p-12 bg-white/5 rounded-2xl border border-white/10 text-white/70">
                  <Inbox className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No messages matching your filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filterAndSort(fromPixel).map(item => <BoardCard key={item.id} item={item} isFromPixel={true} />)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="my_questions" className="focus:outline-none">
              {waitingToSend.length > 0 && activeFilter === 'All' && !searchQuery && (
                <div className="mb-8 flex flex-col items-center justify-center p-6 bg-white/10 border border-white/20 rounded-2xl shadow-lg">
                  <p className="text-white/80 font-medium mb-3 text-sm">
                    {waitingToSend.length} {waitingToSend.length === 1 ? 'question' : 'questions'} waiting to send
                  </p>
                  <Button 
                    onClick={handleSendBatch}
                    className="bg-[#24C4D6] hover:bg-[#1EABC0] text-white font-bold px-8 py-6 rounded-full shadow-[0_0_20px_rgba(36,196,214,0.4)] hover:shadow-[0_0_30px_rgba(36,196,214,0.6)] hover:scale-105 transition-all text-lg"
                  >
                    <CheckCircle2 className="w-6 h-6 mr-2" /> 
                    I'm Done — Send to Pixel Poster
                  </Button>
                </div>
              )}

              {isLoading ? (
                <div className="text-center p-12 text-white/50 flex flex-col items-center"><Loader2 className="w-8 h-8 animate-spin mb-2" />Loading board...</div>
              ) : filterAndSort(myQuestions).length === 0 ? (
                <div className="text-center p-12 bg-white/5 rounded-2xl border border-white/10 text-white/70">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No questions matching your filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filterAndSort(myQuestions).map(item => <BoardCard key={item.id} item={item} isFromPixel={false} />)}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}