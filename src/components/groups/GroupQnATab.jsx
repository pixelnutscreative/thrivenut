import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpCircle, CheckCircle, Clock, XCircle, ChevronRight, MessageCircle } from 'lucide-react';

export default function GroupQnATab({ group, currentUser, myMembership, isAdmin }) {
  const queryClient = useQueryClient();
  const [askOpen, setAskOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [details, setDetails] = useState('');

  const { data: qnas = [] } = useQuery({
    queryKey: ['groupQnA', group.id],
    queryFn: () => base44.entities.GroupQnA.filter({ group_id: group.id }, '-created_date'),
  });

  const askMutation = useMutation({
    mutationFn: (data) => base44.entities.GroupQnA.create({ 
      ...data, 
      group_id: group.id, 
      asked_by: currentUser.email,
      status: 'pending'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['groupQnA', group.id]);
      setAskOpen(false);
      setQuestion('');
      setDetails('');
    }
  });

  const answerMutation = useMutation({
    mutationFn: ({ id, answer, status }) => base44.entities.GroupQnA.update(id, { 
      answer, 
      status, 
      answered_by: currentUser.email,
      answered_date: new Date().toISOString()
    }),
    onSuccess: () => queryClient.invalidateQueries(['groupQnA', group.id])
  });

  // Filter visibility
  const publishedQnA = qnas.filter(q => q.status === 'published');
  const myPendingQnA = qnas.filter(q => q.status === 'pending' && q.asked_by === currentUser.email);
  const adminPendingQnA = isAdmin ? qnas.filter(q => q.status === 'pending') : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Community Q&A</h3>
        <Dialog open={askOpen} onOpenChange={setAskOpen}>
          <DialogTrigger asChild>
            <Button><HelpCircle className="w-4 h-4 mr-2" /> Ask a Question</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ask the Community</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input 
                placeholder="What's your question?" 
                value={question} 
                onChange={e => setQuestion(e.target.value)} 
              />
              <Textarea 
                placeholder="Add more details..." 
                value={details} 
                onChange={e => setDetails(e.target.value)} 
              />
              <p className="text-xs text-gray-500">
                Questions are reviewed by admins before being published to the group.
              </p>
              <Button onClick={() => askMutation.mutate({ question, details })} disabled={!question} className="w-full">
                Submit Question
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="published" className="w-full">
        <TabsList>
          <TabsTrigger value="published">Published ({publishedQnA.length})</TabsTrigger>
          {isAdmin && <TabsTrigger value="pending">Needs Answer ({adminPendingQnA.length})</TabsTrigger>}
          {!isAdmin && myPendingQnA.length > 0 && <TabsTrigger value="my_pending">My Pending</TabsTrigger>}
        </TabsList>

        <TabsContent value="published" className="space-y-4 mt-4">
          {publishedQnA.map(q => (
            <Card key={q.id}>
              <CardContent className="p-4 space-y-3">
                <div className="font-semibold text-lg flex gap-2">
                  <span className="text-purple-600">Q:</span> {q.question}
                </div>
                {q.details && <p className="text-sm text-gray-600 ml-6">{q.details}</p>}
                <div className="bg-green-50 p-3 rounded-lg ml-6 border border-green-100">
                  <div className="font-medium text-green-800 flex gap-2 mb-1">
                    <span className="text-green-600">A:</span> Answer
                  </div>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap">{q.answer}</div>
                </div>
              </CardContent>
            </Card>
          ))}
          {publishedQnA.length === 0 && <div className="text-center py-8 text-gray-500">No published Q&A yet.</div>}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="pending" className="space-y-4 mt-4">
            {adminPendingQnA.map(q => (
              <AdminAnswerCard key={q.id} qna={q} onAnswer={answerMutation.mutate} />
            ))}
            {adminPendingQnA.length === 0 && <div className="text-center py-8 text-gray-500">No pending questions.</div>}
          </TabsContent>
        )}

        <TabsContent value="my_pending" className="space-y-4 mt-4">
          {myPendingQnA.map(q => (
            <Card key={q.id} className="bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-2">
                  <Clock className="w-4 h-4" /> Pending Review
                </div>
                <div className="font-medium">{q.question}</div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AdminAnswerCard({ qna, onAnswer }) {
  const [answer, setAnswer] = useState('');
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{qna.question}</CardTitle>
        <p className="text-xs text-gray-500">Asked by {qna.asked_by}</p>
        {qna.details && <p className="text-sm mt-2">{qna.details}</p>}
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea 
          placeholder="Write your answer..." 
          value={answer} 
          onChange={e => setAnswer(e.target.value)} 
        />
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => onAnswer({ id: qna.id, status: 'rejected' })} className="text-red-500">
            Reject
          </Button>
          <Button size="sm" onClick={() => onAnswer({ id: qna.id, answer, status: 'published' })} disabled={!answer}>
            Publish Answer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}