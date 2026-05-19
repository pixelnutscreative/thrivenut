import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, MessageSquare, Inbox, CheckCircle2, Send, X, ArrowLeft, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useToast } from '@/components/ui/use-toast';

const priorityEmojis = {
  Low: '🟢',
  Medium: '🟡',
  High: '🟠',
  Critical: '🔴'
};

const statusColors = {
  Unanswered: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Answered: 'bg-blue-100 text-blue-800 border-blue-200',
  Reviewed: 'bg-green-100 text-green-800 border-green-200'
};

export default function PixelBoard() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('from_pixel');
  
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
  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PixelBoard.create({ ...data, asked_by: 'Nikole', status: 'Unanswered', batch_ready: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pixelBoard'] });
      setIsAskModalOpen(false);
      setNewQuestion({ title: '', details: '', question_type: 'General', answer_type: 'Text', choices: [''], priority: 'Medium' });
      setActiveTab('my_questions');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PixelBoard.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pixelBoard'] })
  });

  // Derived state
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

  const markAsRead = (id) => {
    updateMutation.mutate({ id, data: { nikole_read: true } });
  };

  const submitNikoleResponse = (id, responseText) => {
    updateMutation.mutate({ 
      id, 
      data: { nikole_response: responseText, status: 'Answered', pixel_read: false, nikole_read: true } 
    });
  };

  const markAsReviewed = (id) => {
    updateMutation.mutate({ id, data: { status: 'Reviewed', nikole_read: true } });
  };

  // Render Card Component
  const BoardCard = ({ item, isFromPixel }) => {
    const [responseText, setResponseText] = useState(item.nikole_response || '');
    const isUnread = !item.nikole_read && (isFromPixel || item.status !== 'Unanswered');
    const showPixelBadge = item.pixel_read === true && item.nikole_read === false;

    return (
      <Card 
        className={`border-0 overflow-hidden transition-all duration-300 bg-white ${
          isUnread ? 'ring-2 ring-[#24C4D6] shadow-[0_0_15px_rgba(36,196,214,0.3)]' : 'shadow-md hover:shadow-lg'
        }`}
        onMouseEnter={() => { if (isUnread) markAsRead(item.id); }}
      >
        <div className="p-1.5 bg-gray-50 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span title={`Priority: ${item.priority}`}>{priorityEmojis[item.priority]}</span>
            <Badge variant="outline" className="text-xs text-gray-500 bg-white">{item.question_type}</Badge>
            {showPixelBadge && (
              <Badge className="bg-red-50 text-red-600 border-red-200 text-[10px] px-1.5 flex items-center gap-1 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                📬 From Pixel Poster
              </Badge>
            )}
          </div>
          <Badge className={`text-[10px] uppercase font-bold border ${statusColors[item.status]}`}>
            {item.status}
          </Badge>
        </div>
        
        <CardContent className="p-5">
          <h3 className="font-bold text-gray-800 text-lg mb-2 leading-tight">{item.title}</h3>
          {item.details && (
            <p className="text-sm text-gray-500 mb-4 whitespace-pre-wrap">{item.details}</p>
          )}

          {isFromPixel ? (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Label className="text-xs text-[#6B3FA0] font-bold uppercase mb-2 block">Your Response</Label>
              {item.status === 'Unanswered' ? (
                <div className="space-y-3">
                  <Textarea 
                    placeholder="Type your answer for Pixel Poster..." 
                    className="min-h-[80px] bg-gray-50 border-gray-200 focus-visible:ring-[#24C4D6]"
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                  />
                  <Button 
                    className="w-full bg-[#24C4D6] hover:bg-[#1EABC0] text-white font-semibold"
                    onClick={() => submitNikoleResponse(item.id, responseText)}
                    disabled={!responseText.trim()}
                  >
                    <Send className="w-4 h-4 mr-2" /> Mark as Answered
                  </Button>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap">
                  {item.nikole_response}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4">
              {item.pixel_response ? (
                <div className="relative">
                  <div className="absolute -top-3 left-4 text-[#24C4D6]">
                    <svg width="20" height="15" viewBox="0 0 20 15" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0 15L10 0L20 15H0Z" />
                    </svg>
                  </div>
                  <div className="p-4 bg-[#24C4D6] bg-opacity-10 border border-[#24C4D6]/30 rounded-xl rounded-tl-sm text-[#0D626C] text-sm whitespace-pre-wrap">
                    <strong>Pixel Poster says:</strong><br/>
                    {item.pixel_response}
                  </div>
                  {item.status === 'Answered' && (
                    <Button 
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full border-[#24C4D6] text-[#24C4D6] hover:bg-[#24C4D6] hover:text-white"
                      onClick={() => markAsReviewed(item.id)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as Reviewed
                    </Button>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-400 italic text-center border border-dashed border-gray-200">
                  Waiting for Pixel Poster's response...
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2D1B69] to-[#6B3FA0] p-4 md:p-8">
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
              <Button className="bg-[#24C4D6] hover:bg-[#1EABC0] text-white font-bold px-6 py-6 rounded-full shadow-lg hover:shadow-xl transition-all">
                <Plus className="w-5 h-5 mr-2" /> Ask Pixel Poster
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
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
                <div className="space-y-2">
                  <Label>Answer Format</Label>
                  <Select value={newQuestion.answer_type} onValueChange={v => setNewQuestion({...newQuestion, answer_type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Text">Text Response</SelectItem>
                      <SelectItem value="Yes/No">Yes / No</SelectItem>
                      <SelectItem value="Multiple Choice">Multiple Choice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {newQuestion.answer_type === 'Multiple Choice' && (
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/10 p-1 rounded-xl h-14">
            <TabsTrigger 
              value="from_pixel" 
              className="rounded-lg text-white data-[state=active]:bg-white data-[state=active]:text-[#2D1B69] font-bold text-sm md:text-base h-full relative"
            >
              <Inbox className="w-5 h-5 mr-2 opacity-70" />
              📥 From Pixel Poster
              {unreadFromPixel > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-[#24C4D6] text-white border-white shadow-sm hover:bg-[#24C4D6]">
                  {unreadFromPixel}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="my_questions" 
              className="rounded-lg text-white data-[state=active]:bg-white data-[state=active]:text-[#2D1B69] font-bold text-sm md:text-base h-full relative"
            >
              <MessageSquare className="w-5 h-5 mr-2 opacity-70" />
              💬 My Questions
              {unreadMyQuestions > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-[#24C4D6] text-white border-white shadow-sm hover:bg-[#24C4D6]">
                  {unreadMyQuestions}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="mt-8">
            <TabsContent value="from_pixel">
              {isLoading ? (
                <div className="text-center p-12 text-white/50">Loading board...</div>
              ) : fromPixel.length === 0 ? (
                <div className="text-center p-12 bg-white/5 rounded-2xl border border-white/10 text-white/70">
                  <Inbox className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No messages from Pixel Poster yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {fromPixel.map(item => <BoardCard key={item.id} item={item} isFromPixel={true} />)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="my_questions">
              {waitingToSend.length > 0 && (
                <div className="mb-8 flex flex-col items-center justify-center p-6 bg-white/10 border border-white/20 rounded-2xl">
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
                <div className="text-center p-12 text-white/50">Loading board...</div>
              ) : myQuestions.length === 0 ? (
                <div className="text-center p-12 bg-white/5 rounded-2xl border border-white/10 text-white/70">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>You haven't asked any questions yet.</p>
                  <Button variant="link" className="text-[#24C4D6] mt-2" onClick={() => setIsAskModalOpen(true)}>
                    Ask one now
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myQuestions.map(item => <BoardCard key={item.id} item={item} isFromPixel={false} />)}
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

      </div>
    </div>
  );
}