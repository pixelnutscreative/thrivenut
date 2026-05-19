import React, { useState } from 'react';
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
import { MessageSquare, ChevronDown, ChevronRight, CheckCircle2, Eye, Plus, Send } from 'lucide-react';

const priorityEmojis = {
  Low: '🟢',
  Medium: '🟡',
  High: '🟠',
  Critical: '🔴'
};

export default function PixelBoardWidget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('answer_me');
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  
  // New Question Form State
  const [newQuestion, setNewQuestion] = useState({
    title: '',
    details: '',
    question_type: 'General',
    answer_type: 'Text',
    choices: [''],
    priority: 'Medium'
  });

  // Fetch Board Items
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['pixelBoard'],
    queryFn: () => base44.entities.PixelBoard.list('-created_date')
  });

  // Mutations
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PixelBoard.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pixelBoard'] })
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PixelBoard.create({ ...data, asked_by: 'Nikole', status: 'Unanswered', batch_ready: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pixelBoard'] });
      setIsAskModalOpen(false);
      setNewQuestion({ title: '', details: '', question_type: 'General', answer_type: 'Text', choices: [''], priority: 'Medium' });
      setActiveTab('from_pixel');
    }
  });

  // Derived state
  const questionsForYou = items.filter(i => i.asked_by === 'Pixel Poster' && i.status === 'Unanswered').sort((a, b) => {
      const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
      return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
  });
  const answersReady = items.filter(i => i.asked_by === 'Nikole' && i.status === 'Answered');
  
  const unreadQuestions = items.filter(i => i.asked_by === 'Pixel Poster' && !i.nikole_read).length;
  const unreadAnswers = items.filter(i => i.asked_by === 'Nikole' && i.status === 'Answered' && !i.nikole_read).length;
  const waitingToSend = items.filter(i => i.asked_by === 'Nikole' && i.status === 'Unanswered' && !i.batch_ready);

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

  const markAsReviewed = (id) => {
    updateMutation.mutate({ id, data: { status: 'Reviewed', nikole_read: true } });
  };

  // Card for "Answer Me" tab
  const QuestionCard = ({ item }) => {
    const [responseText, setResponseText] = useState(item.nikole_response || '');

    const handleDone = () => {
      if (!responseText.trim()) return;
      updateMutation.mutate({ 
        id: item.id, 
        data: { nikole_response: responseText, status: 'Answered', nikole_read: true, pixel_read: false } 
      });
    };

    return (
      <div className="bg-white/5 border border-white/10 p-4 rounded-xl mb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span title={item.priority}>{priorityEmojis[item.priority]}</span>
              <h4 className="font-bold text-white text-sm">{item.title}</h4>
            </div>
            {item.details && <p className="text-xs text-white/60 mb-3">{item.details}</p>}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Input 
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder="Type your answer..."
            className="h-9 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-[#24C4D6]"
            onKeyDown={(e) => {
                if (e.key === 'Enter') handleDone();
            }}
          />
          <Button 
            size="sm" 
            onClick={handleDone}
            disabled={!responseText.trim()}
            className="bg-[#24C4D6] hover:bg-[#1EABC0] text-white shrink-0"
          >
            <CheckCircle2 className="w-4 h-4 mr-1" /> Done
          </Button>
        </div>
      </div>
    );
  };

  // Card for "From Pixel Poster" tab
  const AnswerCard = ({ item }) => {
    return (
      <div className="bg-white/5 border border-white/10 p-4 rounded-xl mb-3">
        <h4 className="font-bold text-white text-sm mb-1">{item.title}</h4>
        
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
            onClick={() => markAsReviewed(item.id)}
            className="text-white/70 hover:text-white hover:bg-white/10 h-8"
          >
            <Eye className="w-4 h-4 mr-1.5" /> Got it
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-gradient-to-br from-[#2D1B69] to-[#6B3FA0] border-0 shadow-lg overflow-hidden">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <CollapsibleTrigger className="w-full">
          <div className="p-5 flex items-center justify-between hover:bg-white/5 transition-colors">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-[#24C4D6]" />
              <h3 className="text-xl font-bold text-white text-left">Pixel Board</h3>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Badges always visible */}
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
          
          {/* Mobile badges (shown below title on small screens) */}
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
          <div className="p-5 pt-0 border-t border-white/10">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
              <TabsList className="grid w-full grid-cols-2 bg-black/20 p-1 mb-4">
                <TabsTrigger value="answer_me" className="data-[state=active]:bg-[#24C4D6] data-[state=active]:text-white text-white/70">
                  🙋 Answer Me ({questionsForYou.length})
                </TabsTrigger>
                <TabsTrigger value="from_pixel" className="data-[state=active]:bg-[#24C4D6] data-[state=active]:text-white text-white/70 relative">
                  📬 From Pixel Poster
                  {unreadAnswers > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <div className="max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                <TabsContent value="answer_me" className="mt-0">
                  {questionsForYou.length === 0 ? (
                    <div className="text-center p-6 text-white/50 text-sm">
                      You're all caught up!
                    </div>
                  ) : (
                    questionsForYou.map(item => <QuestionCard key={item.id} item={item} />)
                  )}
                </TabsContent>
                
                <TabsContent value="from_pixel" className="mt-0">
                  {answersReady.length === 0 ? (
                    <div className="text-center p-6 text-white/50 text-sm">
                      No new answers from Pixel Poster.
                    </div>
                  ) : (
                    answersReady.map(item => <AnswerCard key={item.id} item={item} />)
                  )}
                </TabsContent>
              </div>
            </Tabs>
            
            {/* Bottom Actions */}
            <div className="mt-6 pt-4 border-t border-white/10 space-y-3">
              <Dialog open={isAskModalOpen} onOpenChange={setIsAskModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full bg-transparent border-[#24C4D6] text-[#24C4D6] hover:bg-[#24C4D6]/10 hover:text-[#24C4D6]">
                    <Plus className="w-4 h-4 mr-2" /> ✏️ Ask Pixel Poster
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[400px]">
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
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={newQuestion.question_type} onValueChange={v => setNewQuestion({...newQuestion, question_type: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="General">General</SelectItem>
                            <SelectItem value="Technical">Technical</SelectItem>
                            <SelectItem value="Design">Design</SelectItem>
                            <SelectItem value="Urgent">Urgent</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select value={newQuestion.priority} onValueChange={v => setNewQuestion({...newQuestion, priority: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Low">🟢 Low</SelectItem>
                            <SelectItem value="Medium">🟡 Medium</SelectItem>
                            <SelectItem value="High">🟠 High</SelectItem>
                            <SelectItem value="Critical">🔴 Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsAskModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleAskSubmit} disabled={!newQuestion.title} className="bg-[#24C4D6] hover:bg-[#1EABC0] text-white">
                      Add to Batch
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