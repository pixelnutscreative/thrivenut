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
import { HelpCircle, CheckCircle, Clock, XCircle, ChevronRight, MessageCircle, Pencil, Trash2, Lock, Globe } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import LevelSelector from './LevelSelector';
import MemberSelector from './MemberSelector';

export default function GroupQnATab({ group, currentUser, myMembership, isAdmin }) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ question: '', details: '', answer: '', target_levels: [], target_users: [] });

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
      handleCloseDialog();
      // Notify admins
      base44.functions.invoke('notifyGroupMembers', {
        group_id: group.id,
        title: `New Q&A Question`,
        message: `${currentUser.email} asked: ${formData.question}`,
        type: 'qna_question',
        link: `/CreatorGroups?id=${group.id}&tab=qna`
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.GroupQnA.update(editingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['groupQnA', group.id]);
      handleCloseDialog();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GroupQnA.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['groupQnA', group.id])
  });

  const handleEdit = (qna) => {
    setEditingId(qna.id);
    setFormData({
      question: qna.question,
      details: qna.details || '',
      answer: qna.answer || '',
      target_levels: qna.target_levels || [],
      target_users: qna.target_users || []
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData({ question: '', details: '', answer: '', target_levels: [], target_users: [] });
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate(formData);
    } else {
      askMutation.mutate(formData);
    }
  };

  const answerMutation = useMutation({
    mutationFn: async ({ id, answer, status, originalQna }) => {
        await base44.entities.GroupQnA.update(id, { 
            answer, 
            status, 
            answered_by: currentUser.email,
            answered_date: new Date().toISOString()
        });

        if (status === 'published' && originalQna) {
            // Notify the asker
            await base44.functions.invoke('notifyGroupMembers', {
                group_id: group.id,
                target_email: originalQna.asked_by,
                title: `Your Question was Answered!`,
                message: `Answer to: ${originalQna.question}`,
                type: 'qna_answer',
                link: `/CreatorGroups?id=${group.id}&tab=qna`
            });
        }
    },
    onSuccess: () => queryClient.invalidateQueries(['groupQnA', group.id])
  });

  // Filter visibility
  const visibleQnA = qnas.filter(q => {
    if (isAdmin) return true;
    if (q.asked_by === currentUser.email) return true;
    
    const levelMatch = !q.target_levels || q.target_levels.length === 0 || q.target_levels.includes(myMembership?.level);
    const userMatch = !q.target_users || q.target_users.length === 0 || q.target_users.includes(myMembership?.user_email);
    
    return levelMatch && userMatch;
  });

  const publishedQnA = visibleQnA.filter(q => q.status === 'published');
  const myPendingQnA = qnas.filter(q => q.status === 'pending' && q.asked_by === currentUser.email);
  const adminPendingQnA = isAdmin ? qnas.filter(q => q.status === 'pending') : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Community Q&A</h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}><HelpCircle className="w-4 h-4 mr-2" /> Ask a Question</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Question' : 'Ask the Community'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input 
                placeholder="What's your question?" 
                value={formData.question} 
                onChange={e => setFormData({...formData, question: e.target.value})} 
              />
              <div className="h-32 mb-12">
                <ReactQuill 
                  theme="snow" 
                  value={formData.details} 
                  onChange={v => setFormData({...formData, details: v})} 
                  className="h-24"
                  placeholder="Add more details (optional)..."
                />
              </div>

              {isAdmin && (
                <div className="h-32 mb-12">
                  <ReactQuill 
                    theme="snow" 
                    value={formData.answer} 
                    onChange={v => setFormData({...formData, answer: v})} 
                    className="h-24"
                    placeholder="Write or edit answer..."
                  />
                </div>
              )}
              
              {isAdmin && (
                <div className="space-y-4 border-t pt-4">
                    <h4 className="text-sm font-semibold">Visibility Control</h4>
                    <LevelSelector 
                      group={group} 
                      selectedLevels={formData.target_levels} 
                      onChange={(levels) => setFormData({...formData, target_levels: levels})} 
                    />
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Specific Users (Optional)</label>
                        <MemberSelector
                            group={group}
                            selectedUsers={formData.target_users}
                            onChange={(users) => setFormData({...formData, target_users: users})}
                        />
                    </div>
                </div>
              )}

              <Button onClick={handleSubmit} disabled={!formData.question} className="w-full mt-4">
                {editingId ? 'Update Question' : 'Submit Question'}
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
                <div className="flex justify-between items-start">
                  <div className="font-semibold text-lg flex gap-2">
                    <span className="text-purple-600">Q:</span> {q.question}
                  </div>
                  {(isAdmin || q.asked_by === currentUser.email) && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(q)} className="text-gray-500 h-6 w-6 p-0 hover:text-purple-600">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(q.id)} className="text-red-500 h-6 w-6 p-0">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                {q.details && (
                  <div className="text-sm text-gray-600 ml-6 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: q.details }} />
                )}
                <div className="bg-green-50 p-3 rounded-lg ml-6 border border-green-100">
                  <div className="font-medium text-green-800 flex gap-2 mb-1">
                    <span className="text-green-600">A:</span> Answer
                  </div>
                  <div className="text-sm text-gray-800 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: q.answer }} />
                </div>
              </CardContent>
            </Card>
          ))}
          {publishedQnA.length === 0 && <div className="text-center py-8 text-gray-500">No published Q&A yet.</div>}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="pending" className="space-y-4 mt-4">
            {adminPendingQnA.map(q => (
              <AdminAnswerCard key={q.id} qna={q} onAnswer={(data) => answerMutation.mutate({...data, originalQna: q})} />
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
        {qna.details && <div className="text-sm mt-2 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: qna.details }} />}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-48 mb-12">
          <ReactQuill 
            theme="snow" 
            value={answer} 
            onChange={setAnswer} 
            className="h-36"
            placeholder="Write your answer..."
          />
        </div>
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