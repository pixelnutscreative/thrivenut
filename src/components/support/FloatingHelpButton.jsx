import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HelpCircle, Send, Loader2, CheckCircle, Bug, Lightbulb, MessageSquare, Code, FlaskConical, Sparkles } from 'lucide-react';

const ticketTypes = [
  { value: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-500' },
  { value: 'feature_request', label: 'Feature Request', icon: Lightbulb, color: 'text-amber-500' },
  { value: 'question', label: 'Question', icon: HelpCircle, color: 'text-blue-500' },
  { value: 'feedback', label: 'Feedback', icon: MessageSquare, color: 'text-purple-500' },
];

const ADMIN_EMAIL = 'pixelnutscreative@gmail.com';

export default function FloatingHelpButton({ pageName, userEmail }) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    type: 'question',
    priority: 'medium',
  });

  const isAdmin = userEmail?.toLowerCase() === ADMIN_EMAIL;

  // Check if user is a beta tester
  const { data: betaTester } = useQuery({
    queryKey: ['betaTester', userEmail],
    queryFn: async () => {
      const testers = await base44.entities.BetaTester.filter({ user_email: userEmail, status: 'active' });
      return testers[0] || null;
    },
    enabled: !!userEmail && !isAdmin,
  });

  const isBetaTester = !!betaTester;

  const createTicketMutation = useMutation({
    mutationFn: async (data) => {
      // For admin, create FeedbackItem instead (developer notes)
      if (isAdmin) {
        return base44.entities.FeedbackItem.create({
          title: data.subject,
          description: `[From: ${pageName} page]\n\n${data.description}`,
          category: data.type === 'bug' ? 'bug' : data.type === 'feature_request' ? 'feature' : 'other',
          priority: data.priority,
          status: 'pending',
          submitted_by: userEmail,
        });
      }

      // For beta testers and regular users, create SupportTicket
      const autoResponse = {
        sender: 'admin',
        sender_type: 'admin',
        message: isBetaTester 
          ? `Thanks for the beta feedback! 🧪 We got your ${data.type.replace('_', ' ')} from the ${pageName} page.\n\nYour input helps make Thrive Nut better for everyone! 💜`
          : `Thanks for reaching out! 🎉 We got your message from the ${pageName} page.\n\nIf anything about your request isn't clear, could you tell us:\n• What were you trying to do?\n• What happened instead?\n• Any other details that might help?\n\nWe'll get back to you soon! 💜`,
        timestamp: new Date().toISOString(),
      };

      return base44.entities.SupportTicket.create({
        ...data,
        user_email: userEmail,
        description: `[From: ${pageName} page]${isBetaTester ? ' [BETA TESTER]' : ''}\n\n${data.description}`,
        messages: [autoResponse],
      });
    },
    onSuccess: () => {
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setOpen(false);
        setFormData({ subject: '', description: '', type: 'question', priority: 'medium' });
      }, 3000);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.subject.trim()) return;
    createTicketMutation.mutate(formData);
  };

  if (!userEmail) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(true)}
        className={`fixed bottom-6 left-6 z-35 w-12 h-12 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110 ${
          isAdmin 
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700' 
            : isBetaTester
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
        }`}
        title={isAdmin ? "Dev Notes" : isBetaTester ? "Beta Feedback" : "Need help?"}
      >
        {isAdmin ? <Code className="w-6 h-6" /> : isBetaTester ? <FlaskConical className="w-6 h-6" /> : <HelpCircle className="w-6 h-6" />}
      </button>

      {/* Quick Support Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isAdmin ? (
                <>
                  <Code className="w-5 h-5 text-indigo-500" />
                  Dev Note: {pageName}
                </>
              ) : isBetaTester ? (
                <>
                  <FlaskConical className="w-5 h-5 text-amber-500" />
                  Beta Feedback: {pageName}
                </>
              ) : (
                <>
                  <HelpCircle className="w-5 h-5 text-purple-500" />
                  Need Help on {pageName}?
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {submitted ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Got It! 🎯</h3>
              <p className="text-gray-600 text-sm">
                Check your ticket history for a response. We may ask clarifying questions!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role badge */}
              {(isAdmin || isBetaTester) && (
                <div className={`p-2 rounded-lg text-center text-sm font-medium ${
                  isAdmin ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800' : 'bg-amber-50 text-amber-800'
                }`}>
                  {isAdmin ? (
                    <span className="flex items-center justify-center gap-2">
                      <Code className="w-4 h-4" /> Developer Mode
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <FlaskConical className="w-4 h-4" /> Beta Tester Mode
                    </span>
                  )}
                </div>
              )}

              {/* Type - show more options for admin/beta */}
              <div className={`grid gap-2 ${isAdmin ? 'grid-cols-3' : 'grid-cols-4'}`}>
                {ticketTypes.map(type => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.value })}
                      className={`p-2 rounded-lg border-2 transition-all text-center ${
                        formData.type === type.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mx-auto mb-1 ${type.color}`} />
                      <span className="text-[10px] font-medium block">{type.label.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>

              {/* Priority for admin/beta testers */}
              {(isAdmin || isBetaTester) && (
                <div className="space-y-2">
                  <Label className="text-xs">Priority</Label>
                  <div className="grid grid-cols-4 gap-1">
                    {['low', 'medium', 'high', 'urgent'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData({ ...formData, priority: p })}
                        className={`py-1 px-2 rounded text-xs font-medium capitalize ${
                          formData.priority === p
                            ? p === 'urgent' ? 'bg-red-500 text-white' :
                              p === 'high' ? 'bg-orange-500 text-white' :
                              p === 'medium' ? 'bg-blue-500 text-white' : 'bg-gray-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>What's up?</Label>
                <Input
                  placeholder="Brief summary..."
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Details (optional)</Label>
                <Textarea
                  placeholder="Tell us more..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <p className="text-xs text-gray-500">
                📍 Page: <strong>{pageName}</strong>
                {isAdmin && ' • Dev notes go to FeedbackItem'}
                {isBetaTester && ' • Thanks for testing! 💜'}
              </p>

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
                Send
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}