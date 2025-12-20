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
import { HelpCircle, CheckCircle, Clock, XCircle, ChevronRight, MessageCircle, Pencil, Trash2 } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import VisibilityControl from './VisibilityControl';

export default function GroupQnATab({ group, currentUser, myMembership, isAdmin }) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ 
    question: '', 
    details: '', 
    visible_to_levels: [], 
    visible_to_specific_emails: [] 
  });

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
      visible_to_levels: qna.visible_to_levels || [],
      visible_to_specific_emails: qna.visible_to_specific_emails || []
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData({ question: '', details: '', visible_to_levels: [], visible_to_specific_emails: [] });
  };

  const handleSubmit = () => {
    // If not admin, force empty visibility (public to group) or default?
    // Actually users usually just ask. Admins set visibility.
    // If user is editing, they shouldn't change visibility if they are not admin.
    const data = { ...formData };
    if (!isAdmin && !editingId) {
       delete data.visible_to_levels;
       delete data.visible_to_specific_emails;
    }

    if (editingId) {
      updateMutation.mutate(data);
    } else {
      askMutation.mutate(data);
    }
  };

  const answerMutation = useMutation({
    mutationFn: ({ id, answer, status, visible_to_levels, visible_to_specific_emails }) => 
      base44.entities.GroupQnA.update(id, { 
        answer, 
        status, 
        answered_by: currentUser.email,
        answered_date: new Date().toISOString(),
        visible_to_levels,
        visible_to_specific_emails
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(['groupQnA', group.id]);
      // Notify user
      // Note: We'd need the question asker's email to notify efficiently
    }
  });

  // Filter visibility
  const isVisible = (q) => {
    if (isAdmin) return true;
    if (q.asked_by === currentUser.email) return true;
    
    const hasLevels = q.visible_to_levels && q.visible_to_levels.length > 0;
    const hasEmails = q.visible_to_specific_emails && q.visible_to_specific_emails.length > 0;
    
    if (!hasLevels && !hasEmails) return true; // Public to group if no restrictions
    
    if (hasLevels && q.visible_to_levels.includes(myMembership?.level)) return true;
    if (hasEmails && q.visible_to_specific_emails.includes(currentUser.email)) return true;
    
    return false;
  };

  const publishedQnA = qnas.filter(q => q.status === 'published' && isVisible(q));
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
              <div className="h-48 mb-12">
                <ReactQuill 
                  theme="snow" 
                  value={formData.details} 
                  onChange={v => setFormData({...formData, details: v})} 
                  className="h-36"
                  placeholder="Add more details..."
                />
              </div>
              
              {isAdmin && (
                <VisibilityControl 
                  group={group}
                  selectedLevels={formData.visible_to_levels}
                  selectedEmails={formData.visible_to_specific_emails}
                  onLevelsChange={l => setFormData({...formData, visible_to_levels: l})}
                  onEmailsChange={e => setFormData({...formData, visible_to_specific_emails: e})}
                />
              )}

              <Button onClick={handleSubmit} disabled={!formData.question} className="w-full">
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
                {q.answer && (
                  <div className="bg-green-50 p-3 rounded-lg ml-6 border border-green-100">
                    <div className="font-medium text-green-800 flex gap-2 mb-1">
                      <span className="text-green-600">A:</span> Answer
                    </div>
                    <div className="text-sm text-gray-800 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: q.answer }} />
                  </div>
                )}
                
                {isAdmin && (q.visible_to_levels?.length > 0 || q.visible_to_specific_emails?.length > 0) && (
                  <div className="mt-2 text-[10px] text-gray-400 ml-6 flex gap-2">
                    <span className="font-bold">Visible to:</span>
                    {q.visible_to_levels?.length > 0 && <span>Levels: {q.visible_to_levels.join(', ')}</span>}
                    {q.visible_to_specific_emails?.length > 0 && <span>Users: {q.visible_to_specific_emails.length}</span>}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {publishedQnA.length === 0 && <div className="text-center py-8 text-gray-500">No published Q&A yet.</div>}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="pending" className="space-y-4 mt-4">
            {adminPendingQnA.map(q => (
              <AdminAnswerCard key={q.id} qna={q} group={group} onAnswer={answerMutation.mutate} />
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

function AdminAnswerCard({ qna, group, onAnswer }) {
  const [answer, setAnswer] = useState('');
  const [visibleToLevels, setVisibleToLevels] = useState(qna.visible_to_levels || []);
  const [visibleToEmails, setVisibleToEmails] = useState(qna.visible_to_specific_emails || []);
  
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
        
        <VisibilityControl 
          group={group}
          selectedLevels={visibleToLevels}
          selectedEmails={visibleToEmails}
          onLevelsChange={setVisibleToLevels}
          onEmailsChange={setVisibleToEmails}
          className="mb-4"
        />

        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={() => onAnswer({ id: qna.id, status: 'rejected' })} className="text-red-500">
            Reject
          </Button>
          <Button 
            size="sm" 
            onClick={() => onAnswer({ 
              id: qna.id, 
              answer, 
              status: 'published',
              visible_to_levels: visibleToLevels,
              visible_to_specific_emails: visibleToEmails
            })} 
            disabled={!answer}
          >
            Publish Answer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}