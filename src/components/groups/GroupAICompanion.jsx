import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, Send, Minimize2, Maximize2, X, Loader2, Sparkles, MessageSquare } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { cn } from '@/components/ui/utils';

export default function GroupAICompanion({ groupId, groupName, className }) {
  const [isOpen, setIsOpen] = useState(true);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Hi! I'm your AI companion for ${groupName || 'this group'}. I can answer questions about meetings, resources, and tasks. What do you need help with?` }
  ]);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const askMutation = useMutation({
    mutationFn: async (question) => {
      // Prepare history (last 10 messages to save tokens)
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      
      const res = await base44.functions.invoke('askGroupAI', {
        groupId,
        question,
        history
      });
      return res.data.answer;
    },
    onSuccess: (answer) => {
      setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    },
    onError: (err) => {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error answering that. Please try again." }]);
      console.error(err);
    }
  });

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    askMutation.mutate(input);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className={cn("w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg transition-all", className)}
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Ask AI Assistant
      </Button>
    );
  }

  return (
    <Card className={cn("flex flex-col shadow-xl border-violet-100 overflow-hidden bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 h-[500px] transition-all duration-300", className)}>
      <CardHeader className="py-3 px-4 bg-gradient-to-r from-violet-50 to-indigo-50 border-b border-violet-100 flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-violet-100 rounded-lg">
             <Brain className="w-4 h-4 text-violet-600" />
          </div>
          <CardTitle className="text-sm font-bold text-violet-900">Project AI</CardTitle>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-600" onClick={() => setIsOpen(false)}>
          <Minimize2 className="w-4 h-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 overflow-hidden relative">
        <div className="absolute inset-0 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
            {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                    m.role === 'user' 
                    ? "bg-violet-600 text-white rounded-br-none" 
                    : "bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200"
                )}
                >
                <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
            </div>
            ))}
            {askMutation.isPending && (
            <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-none px-4 py-2 flex items-center gap-2 text-gray-500 text-sm">
                    <Loader2 className="w-3 h-3 animate-spin" /> Thinking...
                </div>
            </div>
            )}
        </div>
      </CardContent>

      <CardFooter className="p-3 border-t bg-white">
        <div className="flex w-full items-center gap-2">
          <Input 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about meetings, tasks..." 
            className="flex-1 border-gray-200 focus-visible:ring-violet-500"
            disabled={askMutation.isPending}
            autoFocus
          />
          <Button 
            size="icon" 
            onClick={handleSend} 
            disabled={!input.trim() || askMutation.isPending}
            className="bg-violet-600 hover:bg-violet-700 text-white shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}