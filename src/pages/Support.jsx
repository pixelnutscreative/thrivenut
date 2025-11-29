import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  MessageSquare, Bug, Lightbulb, HelpCircle, Send, 
  Loader2, CheckCircle, Clock, AlertCircle, Sparkles,
  Upload, X, Rocket, Gift, Star, User, Shield
} from 'lucide-react';

const ticketTypes = [
  { value: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-500' },
  { value: 'feature_request', label: 'Feature Request', icon: Lightbulb, color: 'text-amber-500' },
  { value: 'question', label: 'Question', icon: HelpCircle, color: 'text-blue-500' },
  { value: 'feedback', label: 'General Feedback', icon: MessageSquare, color: 'text-purple-500' },
];

const statusColors = {
  open: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  waiting_on_user: 'bg-orange-100 text-orange-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
};

const statusLabels = {
  open: 'Open',
  in_progress: 'In Progress',
  waiting_on_user: 'Waiting on You',
  resolved: 'Resolved',
  closed: 'Closed',
};

export default function Support() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('new');
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    type: 'question',
    priority: 'medium',
  });
  const [submitted, setSubmitted] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: myTickets = [] } = useQuery({
    queryKey: ['myTickets', user?.email],
    queryFn: () => base44.entities.SupportTicket.filter({ user_email: user.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const { data: betaTester } = useQuery({
    queryKey: ['betaTester', user?.email],
    queryFn: async () => {
      const testers = await base44.entities.BetaTester.filter({ user_email: user.email });
      return testers[0] || null;
    },
    enabled: !!user?.email,
  });

  const createTicketMutation = useMutation({
    mutationFn: (data) => base44.entities.SupportTicket.create({
      ...data,
      user_email: user.email,
      screenshot_url: screenshotUrl,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTickets'] });
      setFormData({ subject: '', description: '', type: 'question', priority: 'medium' });
      setScreenshotUrl('');
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
    },
  });

  const joinBetaMutation = useMutation({
    mutationFn: () => base44.entities.BetaTester.create({
      user_email: user.email,
      trial_start: new Date().toISOString().split('T')[0],
      trial_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      feedback_count: 0,
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['betaTester'] }),
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setScreenshotUrl(file_url);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.subject.trim()) return;
    createTicketMutation.mutate(formData);
  };

  const sendReplyMutation = useMutation({
    mutationFn: async ({ ticketId, message }) => {
      const ticket = myTickets.find(t => t.id === ticketId);
      const newMessage = {
        sender: user.email,
        sender_type: 'user',
        message,
        timestamp: new Date().toISOString(),
      };
      const updatedMessages = [...(ticket.messages || []), newMessage];
      return base44.entities.SupportTicket.update(ticketId, { 
        messages: updatedMessages,
        status: 'open' // Reopen ticket when user replies
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTickets'] });
      setReplyMessage('');
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Beta Notice */}
        <Alert className="bg-gradient-to-r from-purple-100 to-pink-100 border-purple-300">
          <Rocket className="w-5 h-5 text-purple-600" />
          <AlertDescription className="text-purple-800">
            <strong>Hey there, early bird! 🐣</strong> Thrive Nut is still in active development (think of it as a caterpillar becoming a butterfly... with better features). 
            I'm a one-woman show over here, so responses might take a hot minute, but I WILL get to your tickets! 
            Thanks for being part of this nutty journey! 💜
          </AlertDescription>
        </Alert>

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            Support & Feedback
          </h1>
          <p className="text-gray-600">Got ideas? Found a bug? Just wanna say hi? I'm all ears! 👂</p>
        </div>

        {/* Beta Tester Program Card */}
        {!betaTester && (
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-bold text-gray-800 flex items-center justify-center md:justify-start gap-2">
                    <Gift className="w-5 h-5 text-amber-500" />
                    Join the Beta Testers Club!
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Help shape Thrive Nut and earn rewards! Get 30 days of full access, 
                    and active feedback providers get exclusive discounts when we launch. 
                    Plus, bragging rights. Mostly bragging rights. 😎
                  </p>
                </div>
                <Button 
                  onClick={() => joinBetaMutation.mutate()}
                  disabled={joinBetaMutation.isPending}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  {joinBetaMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Count Me In!'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {betaTester && (
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-300">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-green-800">You're a Beta Tester! 🎉</h3>
                <p className="text-sm text-green-600">
                  Trial ends: {new Date(betaTester.trial_end).toLocaleDateString()} • 
                  Feedback submitted: {betaTester.feedback_count || 0}
                </p>
              </div>
              {betaTester.discount_code && (
                <Badge className="bg-green-600 text-white">{betaTester.discount_code}</Badge>
              )}
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new">Submit Ticket</TabsTrigger>
            <TabsTrigger value="history">My Tickets ({myTickets.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-purple-500" />
                  What's on your mind?
                </CardTitle>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="text-center py-8 space-y-3">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Got it! 🎯</h3>
                    <p className="text-gray-600">
                      Your ticket is in my queue. I'll get back to you faster than you can say "Pixel Nuts!" 
                      <br/><span className="text-sm">(Okay, maybe not THAT fast, but soon!)</span>
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Type Selection */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {ticketTypes.map(type => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, type: type.value })}
                            className={`p-3 rounded-lg border-2 transition-all text-center ${
                              formData.type === type.value
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-purple-300'
                            }`}
                          >
                            <Icon className={`w-5 h-5 mx-auto mb-1 ${type.color}`} />
                            <span className="text-xs font-medium">{type.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="space-y-2">
                      <Label>Subject</Label>
                      <Input
                        placeholder="Brief summary (e.g., 'Button not working' or 'Please add dark mode for vampires')"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Details</Label>
                      <Textarea
                        placeholder="Tell me everything! The more details, the better. Include steps to reproduce if it's a bug."
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={5}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low - Whenever you get to it</SelectItem>
                            <SelectItem value="medium">Medium - Somewhat urgent</SelectItem>
                            <SelectItem value="high">High - Pretty important</SelectItem>
                            <SelectItem value="urgent">Urgent - App is on fire 🔥</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Screenshot (optional)</Label>
                        {screenshotUrl ? (
                          <div className="relative w-20 h-20">
                            <img src={screenshotUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                            <button
                              type="button"
                              onClick={() => setScreenshotUrl('')}
                              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            <span className="text-sm text-gray-600">Upload image</span>
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                          </label>
                        )}
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      disabled={createTicketMutation.isPending || !formData.subject.trim()}
                    >
                      {createTicketMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Send It!
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-4 space-y-4">
            {myTickets.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No tickets yet! Either everything's perfect or you're just really patient. 😇</p>
                </CardContent>
              </Card>
            ) : (
              myTickets.map(ticket => (
                <Card 
                  key={ticket.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className={`h-1 ${
                    ticket.status === 'resolved' ? 'bg-green-500' : 
                    ticket.status === 'in_progress' ? 'bg-amber-500' : 'bg-blue-500'
                  }`} />
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={statusColors[ticket.status]}>
                            {statusLabels[ticket.status]}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {ticketTypes.find(t => t.value === ticket.type)?.label || ticket.type}
                          </Badge>
                          {(ticket.messages?.length > 0) && (
                            <Badge className="bg-purple-100 text-purple-700 text-xs">
                              {ticket.messages.length} message{ticket.messages.length > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-gray-800">{ticket.subject}</h3>
                        {ticket.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{ticket.description}</p>
                        )}
                        {ticket.resolution && (
                          <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
                            <p className="text-sm text-green-700"><strong>Resolution:</strong> {ticket.resolution}</p>
                          </div>
                        )}
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        {new Date(ticket.created_date).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Ticket Detail Modal */}
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-500" />
                {selectedTicket?.subject}
              </DialogTitle>
            </DialogHeader>

            {selectedTicket && (
              <div className="space-y-4">
                {/* Status and meta */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={statusColors[selectedTicket.status]}>
                    {statusLabels[selectedTicket.status]}
                  </Badge>
                  <Badge variant="outline">
                    {ticketTypes.find(t => t.value === selectedTicket.type)?.label}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {new Date(selectedTicket.created_date).toLocaleString()}
                  </span>
                </div>

                {/* Original description */}
                {selectedTicket.description && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedTicket.description}</p>
                  </div>
                )}

                {selectedTicket.screenshot_url && (
                  <img 
                    src={selectedTicket.screenshot_url} 
                    alt="Screenshot" 
                    className="max-w-full rounded-lg border cursor-pointer"
                    onClick={() => window.open(selectedTicket.screenshot_url, '_blank')}
                  />
                )}

                {/* Conversation Thread */}
                {(selectedTicket.messages?.length > 0 || selectedTicket.resolution) && (
                  <div className="space-y-3 border-t pt-4">
                    <h4 className="font-semibold text-gray-700">Conversation</h4>
                    
                    {/* Show resolution as first admin message if exists but no messages array */}
                    {selectedTicket.resolution && !selectedTicket.messages?.some(m => m.message === selectedTicket.resolution) && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Shield className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="flex-1 p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-purple-700">Pixel (Admin)</span>
                          </div>
                          <p className="text-sm text-gray-700">{selectedTicket.resolution}</p>
                        </div>
                      </div>
                    )}

                    {selectedTicket.messages?.map((msg, idx) => (
                      <div key={idx} className={`flex gap-3 ${msg.sender_type === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          msg.sender_type === 'admin' ? 'bg-purple-100' : 'bg-blue-100'
                        }`}>
                          {msg.sender_type === 'admin' 
                            ? <Shield className="w-4 h-4 text-purple-600" />
                            : <User className="w-4 h-4 text-blue-600" />
                          }
                        </div>
                        <div className={`flex-1 max-w-[80%] p-3 rounded-lg border ${
                          msg.sender_type === 'admin' 
                            ? 'bg-purple-50 border-purple-200' 
                            : 'bg-blue-50 border-blue-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-medium ${
                              msg.sender_type === 'admin' ? 'text-purple-700' : 'text-blue-700'
                            }`}>
                              {msg.sender_type === 'admin' ? 'Pixel (Admin)' : 'You'}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(msg.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply input */}
                {selectedTicket.status !== 'closed' && (
                  <div className="border-t pt-4 space-y-2">
                    <Label>Reply</Label>
                    <Textarea
                      placeholder="Type your reply..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={() => {
                          if (replyMessage.trim()) {
                            sendReplyMutation.mutate({ 
                              ticketId: selectedTicket.id, 
                              message: replyMessage 
                            });
                            // Update local state to show new message immediately
                            setSelectedTicket(prev => ({
                              ...prev,
                              messages: [...(prev.messages || []), {
                                sender: user.email,
                                sender_type: 'user',
                                message: replyMessage,
                                timestamp: new Date().toISOString(),
                              }]
                            }));
                            setReplyMessage('');
                          }
                        }}
                        disabled={sendReplyMutation.isPending || !replyMessage.trim()}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {sendReplyMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Send className="w-4 h-4 mr-2" />
                        )}
                        Send Reply
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Quick Suggestion Box */}
        <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-cyan-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-gray-800">Quick Idea? 💡</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Don't want to fill out a whole form? Just shoot me a quick suggestion!
                </p>
                <div className="flex gap-2">
                  <Input 
                    placeholder="What if the app could..."
                    id="quickSuggestion"
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      const input = document.getElementById('quickSuggestion');
                      if (input.value.trim()) {
                        createTicketMutation.mutate({
                          subject: input.value,
                          description: 'Quick suggestion from support page',
                          type: 'feature_request',
                          priority: 'low',
                        });
                        input.value = '';
                      }
                    }}
                    className="bg-cyan-600 hover:bg-cyan-700"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}