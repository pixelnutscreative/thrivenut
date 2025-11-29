import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HelpCircle, Send, Loader2, CheckCircle, Bug, Lightbulb, MessageSquare } from 'lucide-react';

const ticketTypes = [
  { value: 'bug', label: 'Bug Report', icon: Bug },
  { value: 'feature_request', label: 'Feature Request', icon: Lightbulb },
  { value: 'question', label: 'Question', icon: HelpCircle },
  { value: 'feedback', label: 'Feedback', icon: MessageSquare },
];

export default function FloatingHelpButton({ pageName, userEmail }) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    type: 'question',
    priority: 'medium',
  });

  const createTicketMutation = useMutation({
    mutationFn: async (data) => {
      // Create ticket with initial auto-response
      const autoResponse = {
        sender: 'admin',
        sender_type: 'admin',
        message: `Thanks for reaching out! 🎉 We got your message from the ${pageName} page.\n\nIf anything about your request isn't clear, could you tell us:\n• What were you trying to do?\n• What happened instead?\n• Any other details that might help?\n\nWe'll get back to you soon! 💜`,
        timestamp: new Date().toISOString(),
      };

      return base44.entities.SupportTicket.create({
        ...data,
        user_email: userEmail,
        description: `[From: ${pageName} page]\n\n${data.description}`,
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
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
        title="Need help?"
      >
        <HelpCircle className="w-6 h-6" />
      </button>

      {/* Quick Support Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-purple-500" />
              Need Help on {pageName}?
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
              {/* Type */}
              <div className="grid grid-cols-4 gap-2">
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
                      <Icon className={`w-4 h-4 mx-auto mb-1 ${
                        type.value === 'bug' ? 'text-red-500' :
                        type.value === 'feature_request' ? 'text-amber-500' :
                        type.value === 'question' ? 'text-blue-500' : 'text-purple-500'
                      }`} />
                      <span className="text-[10px] font-medium block">{type.label.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>

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
                📍 We'll know this is about the <strong>{pageName}</strong> page
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