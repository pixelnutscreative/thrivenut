import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Circle, Play, ExternalLink, Trash2, FileText, Music, Link as LinkIcon, Download, Mic, Search, SortAsc } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

export default function GroupTrainingTab({ group, currentUser, isAdmin }) {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // newest, oldest, alphabetical
  const [newTraining, setNewTraining] = useState({ 
    title: '', 
    description: '', 
    content_type: 'video',
    video_url: '',
    external_url: '',
    rich_text_content: '',
    file_url: '',
    audio_url: ''
  });

  const { data: trainingModules = [] } = useQuery({
    queryKey: ['groupTraining', group.id],
    queryFn: async () => {
      const modules = await base44.entities.GroupTraining.filter({ group_id: group.id, active: true }, '-created_date');
      return modules;
    }
  });

  const { data: completions = [] } = useQuery({
    queryKey: ['myCompletions', group.id, currentUser.email],
    queryFn: async () => {
      return await base44.entities.GroupTrainingCompletion.filter({ user_email: currentUser.email });
    }
  });

  const completedIds = completions.map(c => c.training_id);

  const addMutation = useMutation({
    mutationFn: (data) => base44.entities.GroupTraining.create({ ...data, group_id: group.id, active: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['groupTraining', group.id]);
      setIsAddOpen(false);
      setNewTraining({ 
        title: '', description: '', content_type: 'video', 
        video_url: '', external_url: '', rich_text_content: '', file_url: '', audio_url: '' 
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GroupTraining.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['groupTraining', group.id])
  });

  const toggleCompletionMutation = useMutation({
    mutationFn: async (moduleId) => {
      const existing = completions.find(c => c.training_id === moduleId);
      if (existing) {
        return await base44.entities.GroupTrainingCompletion.delete(existing.id);
      } else {
        return await base44.entities.GroupTrainingCompletion.create({
          training_id: moduleId,
          user_email: currentUser.email,
          completed_date: new Date().toISOString()
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['myCompletions', group.id])
  });

  const filteredModules = useMemo(() => {
    let result = trainingModules.filter(m => 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortOrder === 'newest') {
      result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    } else if (sortOrder === 'oldest') {
      result.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    } else if (sortOrder === 'alphabetical') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [trainingModules, searchQuery, sortOrder]);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Training Library</h3>
          <p className="text-sm text-gray-500">
            {trainingModules.length} modules • {completions.length} completed
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search training..." 
              className="pl-9" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={sortOrder} onValueChange={setSortOrder}>
             <SelectTrigger className="w-[130px]">
               <SortAsc className="w-4 h-4 mr-2" />
               <SelectValue />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="newest">Newest</SelectItem>
               <SelectItem value="oldest">Oldest</SelectItem>
               <SelectItem value="alphabetical">A-Z</SelectItem>
             </SelectContent>
          </Select>

          {isAdmin && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" /> Add Module</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Training Module</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={newTraining.title} onChange={e => setNewTraining({...newTraining, title: e.target.value})} placeholder="e.g. Module 1: Introduction" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Content Type</Label>
                    <Select value={newTraining.content_type} onValueChange={val => setNewTraining({...newTraining, content_type: val})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="url">Web Page / URL</SelectItem>
                        <SelectItem value="text">Rich Text / Article</SelectItem>
                        <SelectItem value="file">File / PDF</SelectItem>
                        <SelectItem value="audio">Audio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={newTraining.description} onChange={e => setNewTraining({...newTraining, description: e.target.value})} placeholder="Brief overview..." />
                  </div>

                  {/* Dynamic Fields based on Type */}
                  {newTraining.content_type === 'video' && (
                    <div className="space-y-2">
                      <Label>Video URL (YouTube/Vimeo)</Label>
                      <Input value={newTraining.video_url} onChange={e => setNewTraining({...newTraining, video_url: e.target.value})} placeholder="https://youtube.com/..." />
                    </div>
                  )}

                  {newTraining.content_type === 'url' && (
                    <div className="space-y-2">
                      <Label>External Link</Label>
                      <Input value={newTraining.external_url} onChange={e => setNewTraining({...newTraining, external_url: e.target.value})} placeholder="https://..." />
                    </div>
                  )}

                  {newTraining.content_type === 'text' && (
                    <div className="space-y-2">
                      <Label>Content</Label>
                      <ReactQuill theme="snow" value={newTraining.rich_text_content} onChange={v => setNewTraining({...newTraining, rich_text_content: v})} className="h-48 mb-12" />
                    </div>
                  )}

                  {(newTraining.content_type === 'file' || newTraining.content_type === 'audio') && (
                    <div className="space-y-2">
                      <Label>{newTraining.content_type === 'audio' ? 'Audio URL' : 'File URL'}</Label>
                      <Input 
                         value={newTraining.content_type === 'audio' ? newTraining.audio_url : newTraining.file_url} 
                         onChange={e => setNewTraining({
                           ...newTraining, 
                           [newTraining.content_type === 'audio' ? 'audio_url' : 'file_url']: e.target.value
                         })} 
                         placeholder="https://..." 
                      />
                      <p className="text-xs text-gray-500">Paste a direct link to the file/audio.</p>
                    </div>
                  )}

                  {/* Voice Tools Helper for Admins */}
                  <div className="bg-gray-50 p-3 rounded-lg border text-sm space-y-2">
                    <div className="font-semibold flex items-center gap-2"><Mic className="w-4 h-4" /> AI Voice Tools</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                       <a href="https://ai.thenutsandbots.com/apps/ai-voiceover" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Voice Nut</a>
                       <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Eleven Labs</a>
                    </div>
                  </div>

                </div>
                <DialogFooter>
                  <Button onClick={() => addMutation.mutate(newTraining)} disabled={!newTraining.title}>Add Module</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Module Grid */}
      <div className="grid gap-4">
        {filteredModules.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
            {searchQuery ? 'No matching modules found.' : 'No training modules available yet.'}
          </div>
        ) : (
          filteredModules.map(module => {
            const isCompleted = completedIds.includes(module.id);
            return (
              <Card key={module.id} className={`transition-all ${isCompleted ? 'bg-green-50/30 border-green-100' : ''}`}>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="mt-1">
                     <Checkbox 
                       checked={isCompleted} 
                       onCheckedChange={() => toggleCompletionMutation.mutate(module.id)}
                       className="w-6 h-6 border-2 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                     />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-[10px] uppercase">
                         {module.content_type === 'video' && <Play className="w-3 h-3 mr-1" />}
                         {module.content_type === 'url' && <LinkIcon className="w-3 h-3 mr-1" />}
                         {module.content_type === 'text' && <FileText className="w-3 h-3 mr-1" />}
                         {module.content_type === 'file' && <Download className="w-3 h-3 mr-1" />}
                         {module.content_type === 'audio' && <Music className="w-3 h-3 mr-1" />}
                         {module.content_type || 'Module'}
                      </Badge>
                      {isCompleted && <span className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed</span>}
                    </div>
                    
                    <h4 className={`font-semibold text-lg ${isCompleted ? 'text-green-900' : 'text-gray-900'}`}>{module.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                    
                    {/* Content Actions */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {module.video_url && (
                        <a href={module.video_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-md transition-colors">
                          <Play className="w-3 h-3 fill-current" /> Watch Video
                        </a>
                      )}
                      {module.external_url && (
                        <a href={module.external_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors">
                          <ExternalLink className="w-3 h-3" /> Open Link
                        </a>
                      )}
                      {module.file_url && (
                        <a href={module.file_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-md transition-colors">
                          <Download className="w-3 h-3" /> Download File
                        </a>
                      )}
                      {module.audio_url && (
                         <div className="w-full max-w-md bg-gray-100 p-2 rounded-md">
                           <audio controls src={module.audio_url} className="w-full h-8" />
                         </div>
                      )}
                      {module.content_type === 'text' && (
                         <Dialog>
                           <DialogTrigger asChild>
                             <Button variant="outline" size="sm" className="gap-2">
                               <FileText className="w-3 h-3" /> Read Content
                             </Button>
                           </DialogTrigger>
                           <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                             <DialogHeader>
                               <DialogTitle>{module.title}</DialogTitle>
                             </DialogHeader>
                             <div className="prose prose-sm max-w-none py-4" dangerouslySetInnerHTML={{ __html: module.rich_text_content }} />
                           </DialogContent>
                         </Dialog>
                      )}
                    </div>
                  </div>
                  
                  {isAdmin && (
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-red-500" onClick={() => deleteMutation.mutate(module.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}