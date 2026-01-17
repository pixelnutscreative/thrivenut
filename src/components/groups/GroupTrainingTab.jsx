import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useTheme } from '../shared/useTheme';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Circle, Play, ExternalLink, Trash2, Pencil, FileText, Mic, Video, Link as LinkIcon, Search, Upload, FileAudio, FolderPlus, GripVertical, ChevronDown, ChevronRight, BarChart } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import ContentQAModal from './ContentQAModal';

const VOICEOVER_TOOLS = [
  { name: 'Voice Nut', url: 'https://ai.thenutsandbots.com/apps/ai-voiceover', desc: 'Generate AI voiceovers' },
  { name: 'Eleven Labs', url: 'https://elevenlabs.io', desc: 'High quality AI voices' },
  { name: 'Mini Max', url: 'https://hailuoai.com/audio', desc: 'Audio generation' }
];

export default function GroupTrainingTab({ group, currentUser, isAdmin }) {
  const { preferences } = useTheme();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [view, setView] = useState('modules'); // modules, progress

  // Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['groupTrainingCategories', group.id],
    queryFn: () => base44.entities.GroupTrainingCategory.filter({ group_id: group.id }, 'sort_order')
  });

  // Fetch Modules
  const { data: trainingModules = [] } = useQuery({
    queryKey: ['groupTraining', group.id],
    queryFn: () => base44.entities.GroupTraining.filter({ group_id: group.id, active: true }, 'sort_order')
  });

  // Fetch My Completions
  const { data: myCompletions = [] } = useQuery({
    queryKey: ['myCompletions', group.id, currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.GroupTrainingCompletion.filter({ user_email: currentUser?.email });
    },
    enabled: !!currentUser?.email
  });

  // Derived State
  const completedIds = useMemo(() => myCompletions.map(c => c.training_id), [myCompletions]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h3 className="text-lg font-semibold">Training Center</h3>
            <p className="text-sm text-gray-500">
                {group.type === 'agency' ? 'Agency Training & Progress' : 'Master new skills and track your progress'}
            </p>
        </div>
        
        {isAdmin && (
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                    onClick={() => setView('modules')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${view === 'modules' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Modules
                </button>
                <button
                    onClick={() => setView('progress')}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${view === 'progress' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <BarChart className="w-4 h-4" /> Member Progress
                </button>
            </div>
        )}
      </div>

      {view === 'modules' && (
        <ModulesView 
            group={group} 
            categories={categories} 
            modules={trainingModules} 
            completedIds={completedIds} 
            isAdmin={isAdmin}
            currentUser={currentUser}
            searchParams={searchParams}
            setSearchParams={setSearchParams}
            preferences={preferences}
        />
      )}

      {view === 'progress' && isAdmin && (
        <ProgressView group={group} modules={trainingModules} />
      )}
    </div>
  );
}

function ModulesView({ group, categories, modules, completedIds, isAdmin, currentUser, searchParams, setSearchParams, preferences }) {
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({ 
        title: '', description: '', content: '', resource_url: '', resource_type: 'video', category_id: 'uncategorized', transcript: '' 
    });

    // Handle Edit from URL
    useEffect(() => {
        const editId = searchParams.get('editId');
        if (editId && modules.length > 0 && !isDialogOpen && !editingId) {
            const module = modules.find(m => m.id === editId);
            if (module) {
                handleEdit(module);
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('editId');
                setSearchParams(newParams);
            }
        }
    }, [searchParams, modules]);

    const handleEdit = (module) => {
        setEditingId(module.id);
        setFormData({
            title: module.title,
            description: module.description || '',
            content: module.content || '',
            resource_url: module.resource_url || module.video_url || '',
            resource_type: module.resource_type || 'video',
            category_id: module.category_id || 'uncategorized',
            transcript: module.transcript || ''
        });
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingId(null);
        setFormData({ title: '', description: '', content: '', resource_url: '', resource_type: 'video', category_id: 'uncategorized', transcript: '' });
    };

    const saveMutation = useMutation({
        mutationFn: (data) => {
            const payload = {
                ...data,
                video_url: data.resource_type === 'video' ? data.resource_url : '',
                category_id: data.category_id === 'uncategorized' ? null : data.category_id,
                category: undefined // clear legacy field if any
            };

            if (editingId) {
                return base44.entities.GroupTraining.update(editingId, {
                    ...payload,
                    edited_by: currentUser?.email,
                    edited_at: new Date().toISOString()
                });
            } else {
                return base44.entities.GroupTraining.create({ 
                    ...payload, 
                    group_id: group.id, 
                    active: true
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['groupTraining', group.id]);
            handleCloseDialog();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.GroupTraining.delete(id),
        onSuccess: () => queryClient.invalidateQueries(['groupTraining', group.id])
    });

    const toggleCompletionMutation = useMutation({
        mutationFn: async (moduleId) => {
            console.log("Toggling completion for module:", moduleId, "User:", currentUser?.email);
            try {
                const existing = await base44.entities.GroupTrainingCompletion.filter({ 
                    user_email: currentUser?.email,
                    training_id: moduleId 
                });
                
                console.log("Existing completion records found:", existing.length);

                if (existing.length > 0) {
                    console.log("Deleting completion record:", existing[0].id);
                    const res = await base44.entities.GroupTrainingCompletion.delete(existing[0].id);
                    console.log("Delete result:", res);
                    return res;
                } else {
                    console.log("Creating new completion record");
                    const res = await base44.entities.GroupTrainingCompletion.create({
                        training_id: moduleId,
                        group_id: group.id,
                        user_email: currentUser?.email,
                        completed_date: new Date().toISOString()
                    });
                    console.log("Create result:", res);
                    return res;
                }
            } catch (error) {
                console.error("Error toggling completion:", error);
                throw error;
            }
        },
        onSuccess: () => {
            console.log("Toggle success, invalidating queries");
            queryClient.invalidateQueries(['myCompletions', group.id]);
        },
        onError: (error) => {
            console.error("Toggle mutation failed:", error);
            alert("Failed to update status: " + error.message);
        }
    });

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            setFormData(prev => ({ ...prev, resource_url: file_url }));
        } catch (error) {
            alert("Upload failed: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    // Grouping Logic
    const groupedModules = useMemo(() => {
        const groups = {};
        
        // Initialize with existing categories
        categories.forEach(cat => {
            groups[cat.id] = { ...cat, items: [] };
        });
        
        // Add uncategorized bucket
        groups['uncategorized'] = { id: 'uncategorized', title: 'General Training', items: [] };

        // Distribute modules
        modules.forEach(m => {
            if (searchTerm && !m.title.toLowerCase().includes(searchTerm.toLowerCase())) return;
            
            const catId = m.category_id && groups[m.category_id] ? m.category_id : 'uncategorized';
            groups[catId].items.push(m);
        });

        // Filter out empty groups if searching, but keep all if not
        return Object.values(groups).sort((a, b) => {
            if (a.id === 'uncategorized') return 1;
            if (b.id === 'uncategorized') return -1;
            return (a.sort_order || 0) - (b.sort_order || 0);
        });
    }, [categories, modules, searchTerm]);

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input 
                        placeholder="Search training..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 bg-white"
                    />
                </div>
                {isAdmin && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsCategoryDialogOpen(true)}>
                            <FolderPlus className="w-4 h-4 mr-2" /> Categories
                        </Button>
                        <Button 
                            onClick={() => setIsDialogOpen(true)}
                            className="text-white"
                            style={{ backgroundColor: preferences?.primary_color }}
                        >
                            Add Training
                        </Button>
                    </div>
                )}
            </div>

            {/* Categories & Modules List */}
            <div className="space-y-8">
                {groupedModules.map(category => {
                    if (category.items.length === 0 && !isAdmin && category.id !== 'uncategorized') return null;
                    if (category.items.length === 0 && category.id === 'uncategorized') return null;

                    return (
                        <div key={category.id} className="space-y-4">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <h4 className="font-bold text-gray-700 text-lg">{category.title}</h4>
                                {category.description && <span className="text-sm text-gray-400">- {category.description}</span>}
                                <span className="ml-auto text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                                    {category.items.filter(i => completedIds.includes(i.id)).length} / {category.items.length} Completed
                                </span>
                            </div>
                            
                            <div className="grid gap-4">
                                {category.items.map(module => (
                                    <TrainingCard 
                                        key={module.id} 
                                        module={module} 
                                        isCompleted={completedIds.includes(module.id)}
                                        isAdmin={isAdmin}
                                        onToggle={() => toggleCompletionMutation.mutate(module.id)}
                                        onEdit={() => handleEdit(module)}
                                        onDelete={() => deleteMutation.mutate(module.id)}
                                        currentUser={currentUser}
                                    />
                                ))}
                                {category.items.length === 0 && (
                                    <div className="text-center py-4 text-sm text-gray-400 italic bg-gray-50 rounded border border-dashed">
                                        No training in this category yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                {groupedModules.length === 0 && <div className="text-center py-12 text-gray-500">No training modules found.</div>}
            </div>

            {/* Edit/Create Module Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => !open && handleCloseDialog()}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Edit Training' : 'Add New Training'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Module Title" />
                            </div>
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={formData.category_id} onValueChange={v => setFormData({...formData, category_id: v})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="uncategorized">General (Uncategorized)</SelectItem>
                                        {categories.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Short summary..." />
                        </div>

                        <div className="space-y-2">
                            <Label>Resource Type</Label>
                            <Select value={formData.resource_type} onValueChange={v => setFormData({...formData, resource_type: v})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="video">Video</SelectItem>
                                    <SelectItem value="audio">Audio</SelectItem>
                                    <SelectItem value="pdf">PDF</SelectItem>
                                    <SelectItem value="link">Link</SelectItem>
                                    <SelectItem value="text">Text Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.resource_type !== 'text' && (
                            <div className="space-y-2 bg-slate-50 p-4 rounded-lg border">
                                <Label>Resource URL</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        value={formData.resource_url} 
                                        onChange={e => setFormData({...formData, resource_url: e.target.value})} 
                                        placeholder="https://..." 
                                    />
                                    {['pdf', 'audio'].includes(formData.resource_type) && (
                                        <Button variant="outline" onClick={() => document.getElementById('upload-resource').click()} disabled={uploading}>
                                            <Upload className="w-4 h-4" />
                                        </Button>
                                    )}
                                    <input type="file" id="upload-resource" className="hidden" onChange={handleFileUpload} />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Content / Notes</Label>
                            <ReactQuill theme="snow" value={formData.content} onChange={v => setFormData({...formData, content: v})} className="h-40 mb-12" />
                        </div>

                        {formData.resource_type === 'video' && (
                            <div className="space-y-2">
                                <Label>Video Transcript (for AI)</Label>
                                <Textarea value={formData.transcript} onChange={e => setFormData({...formData, transcript: e.target.value})} rows={3} placeholder="Paste transcript..." />
                            </div>
                        )}

                        {/* Voiceover Tools */}
                        {(formData.resource_type === 'audio' || formData.resource_type === 'mixed') && (
                            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 flex flex-wrap gap-2 items-center">
                                <span className="text-xs font-semibold text-indigo-800 flex items-center gap-1"><Mic className="w-3 h-3" /> Voice Tools:</span>
                                {VOICEOVER_TOOLS.map(tool => (
                                    <a key={tool.name} href={tool.url} target="_blank" rel="noopener noreferrer" className="text-xs bg-white px-2 py-1 rounded border text-indigo-700 flex items-center gap-1">
                                        {tool.name} <ExternalLink className="w-3 h-3" />
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button onClick={() => saveMutation.mutate(formData)} disabled={!formData.title || uploading}>
                            {uploading ? 'Uploading...' : 'Save Training'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Category Manager Dialog */}
            <CategoryManager 
                group={group} 
                categories={categories} 
                isOpen={isCategoryDialogOpen} 
                onClose={() => setIsCategoryDialogOpen(false)} 
            />
        </div>
    );
}

function TrainingCard({ module, isCompleted, isAdmin, onToggle, onEdit, onDelete, currentUser }) {
    const TypeIcon = { video: Video, audio: FileAudio, pdf: FileText, link: LinkIcon, text: FileText }[module.resource_type] || FileText;
    const url = module.resource_url || module.video_url;

    return (
        <Card className={`transition-all overflow-hidden ${isCompleted ? 'bg-green-50/30 border-green-200' : 'hover:border-purple-300'}`}>
            <CardContent className="p-0 flex">
                <button 
                    onClick={onToggle}
                    className={`w-12 flex items-center justify-center border-r transition-colors ${isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-50 text-gray-300 hover:bg-gray-100'}`}
                >
                    {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                </button>
                <div className="flex-1 p-4 space-y-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-[10px] h-5 flex gap-1"><TypeIcon className="w-3 h-3" /> {module.resource_type?.toUpperCase()}</Badge>
                            </div>
                            <h4 className={`text-lg font-semibold ${isCompleted ? 'text-green-900' : 'text-gray-900'}`}>{module.title}</h4>
                        </div>
                        {isAdmin && (
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-purple-600" onClick={onEdit}><Pencil className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500" onClick={onDelete}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                        )}
                    </div>
                    {module.description && <p className="text-sm text-gray-600">{module.description}</p>}
                    
                    <div className="flex flex-wrap gap-2 pt-2">
                        {url && module.resource_type === 'video' && (
                            <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-md shadow-sm">
                                <Play className="w-3 h-3 fill-current" /> Watch Video
                            </a>
                        )}
                        {url && module.resource_type === 'link' && (
                            <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-md">
                                <LinkIcon className="w-3 h-3" /> Open Link
                            </a>
                        )}
                        {url && module.resource_type === 'pdf' && (
                            <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-md">
                                <FileText className="w-3 h-3" /> View PDF
                            </a>
                        )}
                        {module.transcript && <ContentQAModal transcript={module.transcript} contentTitle={module.title} />}
                    </div>

                    {module.content && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                            <div className="prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: module.content }} />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function CategoryManager({ group, categories, isOpen, onClose }) {
    const queryClient = useQueryClient();
    const [newTitle, setNewTitle] = useState('');
    const [items, setItems] = useState(categories);

    useEffect(() => setItems(categories), [categories]);

    const createMutation = useMutation({
        mutationFn: () => base44.entities.GroupTrainingCategory.create({
            group_id: group.id,
            title: newTitle,
            sort_order: categories.length
        }),
        onSuccess: () => {
            queryClient.invalidateQueries(['groupTrainingCategories']);
            setNewTitle('');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => base44.entities.GroupTrainingCategory.delete(id),
        onSuccess: () => queryClient.invalidateQueries(['groupTrainingCategories'])
    });

    const reorderMutation = useMutation({
        mutationFn: async (newItems) => {
            // Update sort_order for all items
            const updates = newItems.map((item, index) => 
                base44.entities.GroupTrainingCategory.update(item.id, { sort_order: index })
            );
            await Promise.all(updates);
        },
        onSuccess: () => queryClient.invalidateQueries(['groupTrainingCategories'])
    });

    const onDragEnd = (result) => {
        if (!result.destination) return;
        const newItems = Array.from(items);
        const [reordered] = newItems.splice(result.source.index, 1);
        newItems.splice(result.destination.index, 0, reordered);
        setItems(newItems);
        reorderMutation.mutate(newItems);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Training Categories</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex gap-2">
                        <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="New Category (e.g. Onboarding)" />
                        <Button onClick={() => createMutation.mutate()} disabled={!newTitle}>Add</Button>
                    </div>
                    
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId="categories">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 max-h-[300px] overflow-y-auto">
                                    {items.map((cat, index) => (
                                        <Draggable key={cat.id} draggableId={cat.id} index={index}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className="flex items-center gap-2 p-3 bg-gray-50 rounded border"
                                                >
                                                    <div {...provided.dragHandleProps} className="cursor-move text-gray-400"><GripVertical className="w-4 h-4" /></div>
                                                    <span className="flex-1 font-medium">{cat.title}</span>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" onClick={() => deleteMutation.mutate(cat.id)}>
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function ProgressView({ group, modules }) {
    const { data: members = [] } = useQuery({
        queryKey: ['groupMembers', group.id],
        queryFn: () => base44.entities.CreatorGroupMember.filter({ group_id: group.id, status: 'active' })
    });

    const { data: allCompletions = [] } = useQuery({
        queryKey: ['allGroupCompletions', group.id],
        queryFn: () => base44.entities.GroupTrainingCompletion.filter({ group_id: group.id })
    });

    const progressData = useMemo(() => {
        return members.map(member => {
            const userCompletions = allCompletions.filter(c => c.user_email === member.user_email);
            const completedCount = userCompletions.filter(c => modules.some(m => m.id === c.training_id)).length;
            const totalModules = modules.length;
            const percentage = totalModules > 0 ? Math.round((completedCount / totalModules) * 100) : 0;
            
            return {
                ...member,
                completedCount,
                totalModules,
                percentage,
                lastCompleted: userCompletions.sort((a,b) => new Date(b.completed_date) - new Date(a.completed_date))[0]?.completed_date
            };
        }).sort((a,b) => b.percentage - a.percentage);
    }, [members, allCompletions, modules]);

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Member Progress</CardTitle>
                    <CardDescription>Track training completion across all active members.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-gray-500 bg-gray-50 uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3">Member</th>
                                    <th className="px-4 py-3">Progress</th>
                                    <th className="px-4 py-3 text-right">Completed</th>
                                    <th className="px-4 py-3 text-right">Last Active</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {progressData.map(member => (
                                    <tr key={member.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            {member.user_email}
                                            <span className="block text-xs text-gray-400 capitalize">{member.role}</span>
                                        </td>
                                        <td className="px-4 py-3 w-1/3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full ${member.percentage === 100 ? 'bg-green-500' : 'bg-purple-500'}`} 
                                                        style={{ width: `${member.percentage}%` }} 
                                                    />
                                                </div>
                                                <span className="text-xs font-bold w-8">{member.percentage}%</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Badge variant="secondary">{member.completedCount} / {member.totalModules}</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-500">
                                            {member.lastCompleted ? new Date(member.lastCompleted).toLocaleDateString() : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}