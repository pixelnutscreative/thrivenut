import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Bot, Sparkles, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';

export default function ContentQAModal({ transcript, contentTitle, trigger }) {
    const [isOpen, setIsOpen] = useState(false);
    const [question, setQuestion] = useState('');
    const [messages, setMessages] = useState([]); // Array of {role: 'user'|'ai', content: string}
    const [loading, setLoading] = useState(false);

    const handleAsk = async (e) => {
        e.preventDefault();
        if (!question.trim()) return;

        const currentQ = question;
        setMessages(prev => [...prev, { role: 'user', content: currentQ }]);
        setQuestion('');
        setLoading(true);

        try {
            const res = await base44.functions.invoke('askContentAI', {
                question: currentQ,
                transcript: transcript,
                content_title: contentTitle
            });
            
            setMessages(prev => [...prev, { role: 'ai', content: res.data.answer }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I encountered an error answering that." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-2">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        Ask AI
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-lg h-[80vh] flex flex-col p-0 gap-0">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-purple-600" />
                        Ask about "{contentTitle}"
                    </DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {messages.length === 0 && (
                            <div className="text-center text-gray-500 py-10">
                                <Sparkles className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>Ask me anything about this content!</p>
                                <p className="text-sm mt-2">Example: "What are the key takeaways?"</p>
                            </div>
                        )}
                        
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-lg p-3 ${
                                    msg.role === 'user' 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-100 text-gray-800'
                                }`}>
                                    <ReactMarkdown className="prose prose-sm dark:prose-invert">
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-gray-100 rounded-lg p-3">
                                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                <div className="p-4 border-t bg-gray-50">
                    <form onSubmit={handleAsk} className="flex gap-2">
                        <Input 
                            value={question} 
                            onChange={e => setQuestion(e.target.value)} 
                            placeholder="Type your question..."
                            disabled={loading}
                        />
                        <Button type="submit" disabled={loading || !question.trim()}>
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}