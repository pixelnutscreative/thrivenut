import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Circle, Play, ExternalLink, Trash2, FileText, Mic, Video, Link as LinkIcon, Search, SortAsc, SortDesc, Upload, FileAudio } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const VOICEOVER_TOOLS = [
  { name: 'Voice Nut', url: 'https://ai.thenutsandbots.com/apps/ai-voiceover', desc: 'Generate AI voiceovers' },
  { name: 'Eleven Labs', url: 'https://elevenlabs.io', desc: 'High quality AI voices' },
  { name: 'Mini Max', url: 'https://hailuoai.com/audio', desc: 'Audio generation' }
];

export default function GroupTrainingTab({ group, currentUser, isAdmin }) {
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // newest, oldest, a-z
  const [uploading, setUploading] = useState(false);
  
  const [newTraining, setNewTraining] = useState({ 
    title: '', 
    description: '', 
    content: '',
    resource_url: '',
    resource_type: 'video',
    category: ''
  });

  const { data: trainingModules = [] } = useQuery({
    queryKey: ['groupTraining', group.id],
    queryFn: async () => {
      const modules = await base44.entities.GroupTraining.filter({ group_id: group.id, active: true }, 'sort_order');
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
    mutationFn: (data) => base44.entities.GroupTraining.create({ 
        ...data, 
        group_id: group.id, 
        active: true,
        // Legacy support mapping
        video_url: data.resource_type === 'video' ? data.resource_url : ''
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['groupTraining', group.id]);
      setIsAddOpen(false);
      setNewTraining({ title: '', description: '', content: '', resource_url: '', resource_type: 'video', category: '' });
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setNewTraining(prev => ({ ...prev, resource_url: file_url }));
    } catch (error) {
        console.error("Upload failed", error);
        alert("Upload failed: " + error.message);
    } finally {
        setUploading(false);
    }
  };

  const filteredModules = useMemo(() => {
    let result = [...trainingModules];
    
    if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        result = result.filter(m => 
            m.title.toLowerCase().includes(lower) || 
            m.description?.toLowerCase().includes(lower) ||
            m.category?.toLowerCase().includes(lower)
        );
    }
    
    if (sortOrder === 'newest') {
        result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    } else if (sortOrder === 'oldest') {
        result.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    } else if (sortOrder === 'a-z') {
        result.sort((a, b) => a.title.localeCompare(b.title));
    }
    
    return result;
  }, [trainingModules, searchTerm, sortOrder]);

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

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h3 className="text-lg font-semibold">Training Modules</h3>
          <p className="text-sm text-gray-500">Master new skills and track your progress</p>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input 
                placeholder="Search modules..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 bg-white"
            />
          </div>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[130px] bg-white">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="a-z">A-Z</SelectItem>
            </SelectContent>
          </Select>
          
          {isAdmin && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button>Add Training</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Training Module</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input value={newTraining.title} onChange={e => setNewTraining({...newTraining, title: e.target.value})} placeholder="Module Title" />
                      </div>
                      <div className="space-y-2">
                        <Label>Category (Optional)</Label>
                        <Input value={newTraining.category} onChange={e => setNewTraining({...newTraining, category: e.target.value})} placeholder="e.g. Basics, Advanced" />
                      </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Short Description</Label>
                    <Textarea value={newTraining.description} onChange={e => setNewTraining({...newTraining, description: e.target.value})} placeholder="What will they learn?" rows={2} />
                  </div>

                  <div className="space-y-2">
                    <Label>Content Type</Label>
                    <Select 
                        value={newTraining.resource_type} 
                        onValueChange={(val) => setNewTraining({...newTraining, resource_type: val})}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="video">Video Lesson</SelectItem>
                            <SelectItem value="audio">Audio / Voiceover</SelectItem>
                            <SelectItem value="pdf">PDF / Document</SelectItem>
                            <SelectItem value="link">External Link</SelectItem>
                            <SelectItem value="text">Rich Text Article</SelectItem>
                            <SelectItem value="mixed">Mixed Content</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>

                  {newTraining.resource_type !== 'text' && (
                      <div className="space-y-2 bg-slate-50 p-4 rounded-lg border">
                          <Label>
                              {newTraining.resource_type === 'video' ? 'Video URL' : 
                               newTraining.resource_type === 'link' ? 'External Link URL' : 
                               'File URL / Upload'}
                          </Label>
                          <div className="flex gap-2">
                            <Input 
                                value={newTraining.resource_url} 
                                onChange={e => setNewTraining({...newTraining, resource_url: e.target.value})} 
                                placeholder={newTraining.resource_type === 'video' ? 'https://youtube.com/...' : 'https://...'} 
                            />
                            {['pdf', 'audio', 'mixed'].includes(newTraining.resource_type) && (
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="file-upload"
                                        className="hidden"
                                        accept={newTraining.resource_type === 'audio' ? 'audio/*' : newTraining.resource_type === 'pdf' ? '.pdf' : '*/*'}
                                        onChange={handleFileUpload}
                                    />
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => document.getElementById('file-upload').click()}
                                        disabled={uploading}
                                    >
                                        {uploading ? 'Uploading...' : <Upload className="w-4 h-4" />}
                                    </Button>
                                </div>
                            )}
                          </div>
                      </div>
                  )}

                  <div className="space-y-2">
                    <Label>Content / Notes</Label>
                    <ReactQuill 
                        theme="snow" 
                        value={newTraining.content} 
                        onChange={v => setNewTraining({...newTraining, content: v})} 
                        className="h-40 mb-12"
                        placeholder="Add detailed content, notes, or instructions..."
                    />
                  </div>

                  {/* Voiceover Tools Helper */}
                  {(newTraining.resource_type === 'audio' || newTraining.resource_type === 'mixed') && (
                      <div className="mt-4 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                          <p className="text-xs font-semibold text-indigo-800 mb-2 flex items-center gap-1">
                              <Mic className="w-3 h-3" /> Need a Voiceover?
                          </p>
                          <div className="flex flex-wrap gap-2">
                              {VOICEOVER_TOOLS.map(tool => (
                                  <a 
                                    key={tool.name} 
                                    href={tool.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs bg-white px-2 py-1 rounded border border-indigo-200 text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
                                    title={tool.desc}
                                  >
                                      {tool.name} <ExternalLink className="w-3 h-3" />
                                  </a>
                              ))}
                          </div>
                      </div>
                  )}

                </div>
                <DialogFooter>
                  <Button onClick={() => addMutation.mutate(newTraining)} disabled={!newTraining.title || uploading}>
                    {uploading ? 'Uploading...' : 'Add Module'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {filteredModules.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
            {searchTerm ? 'No modules match your search.' : 'No training modules available yet.'}
          </div>
        ) : (
          filteredModules.map(module => {
            const isCompleted = completedIds.includes(module.id);
            const type = module.resource_type || (module.video_url ? 'video' : 'text');
            const url = module.resource_url || module.video_url;

            const TypeIcon = {
                video: Video,
                audio: FileAudio,
                pdf: FileText,
                link: LinkIcon,
                text: FileText,
                mixed: FileText
            }[type] || FileText;

            return (
              <Card key={module.id} className={`transition-all overflow-hidden ${isCompleted ? 'bg-green-50/30 border-green-200' : 'hover:border-purple-300'}`}>
                <CardContent className="p-0">
                  <div className="flex">
                    {/* Completion Status Strip */}
                    <button 
                        onClick={() => toggleCompletionMutation.mutate(module.id)}
                        className={`w-12 flex items-center justify-center border-r transition-colors ${
                            isCompleted ? 'bg-green-100 border-green-200 text-green-600 hover:bg-green-200' : 'bg-gray-50 border-gray-100 text-gray-300 hover:bg-gray-100 hover:text-gray-400'
                        }`}
                        title={isCompleted ? "Mark as Incomplete" : "Mark as Complete"}
                    >
                        {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                    </button>

                    <div className="flex-1 p-5 space-y-3">
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal flex items-center gap-1">
                                        <TypeIcon className="w-3 h-3" /> {type.toUpperCase()}
                                    </Badge>
                                    {module.category && (
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 font-normal text-gray-500 bg-gray-100">
                                            {module.category}
                                        </Badge>
                                    )}
                                </div>
                                <h4 className={`text-lg font-semibold ${isCompleted ? 'text-green-900' : 'text-gray-900'}`}>{module.title}</h4>
                            </div>
                            {isAdmin && (
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500" onClick={() => deleteMutation.mutate(module.id)}>
                                <Trash2 className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                        
                        {module.description && <p className="text-sm text-gray-600">{module.description}</p>}
                        
                        {/* Resource Preview / Actions */}
                        <div className="flex flex-wrap gap-2 pt-1">
                            {url && type === 'video' && (
                                <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors shadow-sm">
                                    <Play className="w-4 h-4 fill-current" /> Watch Video
                                </a>
                            )}
                            
                            {url && type === 'audio' && (
                                <div className="w-full bg-gray-50 p-2 rounded border flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                        <FileAudio className="w-4 h-4" />
                                    </div>
                                    <audio controls src={url} className="h-8 flex-1" />
                                </div>
                            )}

                            {url && type === 'pdf' && (
                                <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors">
                                    <FileText className="w-4 h-4 text-red-500" /> View / Download PDF
                                </a>
                            )}

                            {url && type === 'link' && (
                                <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors">
                                    <LinkIcon className="w-4 h-4" /> Open Link <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>

                        {/* Rich Text Content Expansion */}
                        {module.content && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: module.content }} />
                            </div>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}