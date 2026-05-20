import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { LayoutGrid, List as ListIcon, Plus, Link as LinkIcon, Star, Search, ExternalLink, MoreVertical, Edit2, Trash2, Folder, Tag, Download } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const RESOURCE_TYPES = ["Website", "Spreadsheet", "App", "Tool", "Client", "Project", "Doc", "Other"];

export default function MyLinks() {
  const queryClient = useQueryClient();
  const [view, setView] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterTag, setFilterTag] = useState('');
  const [groupBy, setGroupBy] = useState('category');
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkUrls, setBulkUrls] = useState('');
  
  const [editingResource, setEditingResource] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['user_resources'],
    queryFn: () => base44.entities.UserResource.filter({ created_by: user?.email }, '-updated_date'),
    enabled: !!user
  });

  const categories = useMemo(() => Array.from(new Set(resources.map(r => r.category).filter(Boolean))), [resources]);
  const tags = useMemo(() => {
    const t = new Set();
    resources.forEach(r => (r.tags || []).forEach(tag => t.add(tag)));
    return Array.from(t);
  }, [resources]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.UserResource.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_resources'] });
      setIsAddOpen(false);
      setEditingResource(null);
      toast.success("Resource saved!");
    }
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (items) => base44.entities.UserResource.bulkCreate(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_resources'] });
      setIsBulkOpen(false);
      setBulkUrls('');
      toast.success("Resources imported!");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserResource.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_resources'] });
      setIsAddOpen(false);
      setEditingResource(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.UserResource.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_resources'] });
      toast.success("Deleted");
    }
  });

  const handleOpen = (resource) => {
    updateMutation.mutate({ id: resource.id, data: { last_opened: new Date().toISOString() } });
    window.open(resource.url, '_blank');
  };

  const handleToggleFavorite = (resource, e) => {
    e.stopPropagation();
    updateMutation.mutate({ id: resource.id, data: { is_favorite: !resource.is_favorite } });
  };

  const handleBulkImport = () => {
    const lines = bulkUrls.split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length === 0) return;
    
    const newItems = lines.map(line => {
      let url = line;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      let name = url.replace('https://', '').replace('http://', '').split('/')[0];
      return {
        name,
        url,
        resource_type: 'Other',
        category: 'Imported',
        tags: []
      };
    });

    bulkCreateMutation.mutate(newItems);
  };

  const filtered = useMemo(() => {
    return resources.filter(r => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const n = r.name?.toLowerCase() || '';
        const c = r.category?.toLowerCase() || '';
        const t = (r.tags || []).join(' ').toLowerCase();
        if (!n.includes(q) && !c.includes(q) && !t.includes(q)) return false;
      }
      if (filterType !== 'All' && r.resource_type !== filterType) return false;
      if (filterCategory !== 'All' && r.category !== filterCategory) return false;
      if (filterTag && !(r.tags || []).includes(filterTag)) return false;
      return true;
    });
  }, [resources, searchQuery, filterType, filterCategory, filterTag]);

  const favorites = filtered.filter(r => r.is_favorite);
  const regular = filtered.filter(r => !r.is_favorite);

  const grouped = useMemo(() => {
    const groups = {};
    regular.forEach(r => {
      const key = groupBy === 'category' ? (r.category || 'Uncategorized') : (r.resource_type || 'Other');
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    });
    return groups;
  }, [regular, groupBy]);

  const saveResource = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      url: formData.get('url'),
      description: formData.get('description'),
      resource_type: formData.get('resource_type'),
      category: formData.get('category'),
      color: formData.get('color'),
      notes: formData.get('notes'),
      tags: formData.get('tags').split(',').map(t => t.trim()).filter(t => t)
    };
    if (!data.url.startsWith('http://') && !data.url.startsWith('https://')) {
      data.url = 'https://' + data.url;
    }
    
    if (editingResource) {
      updateMutation.mutate({ id: editingResource.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const ResourceCard = ({ resource }) => (
    <Card 
      className="bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
      onClick={() => handleOpen(resource)}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: resource.color || '#cbd5e1' }} />
      <CardContent className="p-4 pl-5">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-slate-800 text-sm truncate flex items-center gap-2">
              {resource.name}
              <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-[#24C4D6]" onClick={e => e.stopPropagation()}>
                <ExternalLink className="w-3 h-3" />
              </a>
            </h4>
            <p className="text-xs text-slate-500 mt-1 line-clamp-1">{resource.description || resource.url}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button 
              className={`p-1.5 rounded-md hover:bg-slate-100 ${resource.is_favorite ? 'text-amber-400' : 'text-slate-300 opacity-0 group-hover:opacity-100'}`}
              onClick={(e) => handleToggleFavorite(resource, e)}
            >
              <Star className="w-4 h-4" fill={resource.is_favorite ? 'currentColor' : 'none'} />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                <button className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 opacity-0 group-hover:opacity-100">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingResource(resource); setIsAddOpen(true); }}>
                  <Edit2 className="w-4 h-4 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-500" onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("Delete this resource?")) deleteMutation.mutate(resource.id);
                }}>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3 items-center">
          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
            {resource.resource_type}
          </span>
          {resource.category && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider" style={{ backgroundColor: `${resource.color || '#cbd5e1'}20`, color: resource.color || '#64748b' }}>
              {resource.category}
            </span>
          )}
          {(resource.tags || []).slice(0, 2).map(tag => (
            <span key={tag} className="text-slate-400 text-[10px] flex items-center">
              <Tag className="w-3 h-3 mr-0.5" /> {tag}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">My Links & Resources</h1>
            <p className="text-slate-500 mt-1">Your personal command center for tools, sites, and apps.</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={() => setIsBulkOpen(true)} className="text-slate-600">
              <Download className="w-4 h-4 mr-2" /> Bulk Add
            </Button>
            <Button onClick={() => { setEditingResource(null); setIsAddOpen(true); }} className="bg-[#24C4D6] hover:bg-[#1db0c0] text-white">
              <Plus className="w-4 h-4 mr-2" /> Add Resource
            </Button>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex-1 max-w-md w-full relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, category, or tag..." 
              className="pl-9 bg-slate-50 border-slate-200"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px] bg-slate-50 border-none h-9">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                {RESOURCE_TYPES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[140px] bg-slate-50 border-none h-9">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            {tags.length > 0 && (
              <Select value={filterTag} onValueChange={setFilterTag}>
                <SelectTrigger className="w-[140px] bg-slate-50 border-none h-9">
                  <SelectValue placeholder="Tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All Tags</SelectItem>
                  {tags.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            <div className="h-6 w-px bg-slate-200 hidden xl:block mx-1" />

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Group By:</span>
              <Select value={groupBy} onValueChange={setGroupBy}>
                <SelectTrigger className="w-[120px] bg-slate-50 border-none h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="category">Category</SelectItem>
                  <SelectItem value="resource_type">Type</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-lg shrink-0 ml-auto xl:ml-2">
              <button onClick={() => setView('grid')} className={`px-2.5 py-1.5 rounded-md transition-colors ${view === 'grid' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setView('list')} className={`px-2.5 py-1.5 rounded-md transition-colors ${view === 'list' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {favorites.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" fill="currentColor" /> Favorites
            </h3>
            {view === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {favorites.map(r => <ResourceCard key={r.id} resource={r} />)}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {favorites.map(r => <ResourceCard key={r.id} resource={r} />)}
              </div>
            )}
          </div>
        )}

        {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([groupName, items]) => (
          <div key={groupName} className="space-y-4 pt-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              {groupBy === 'category' ? <Folder className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />} 
              {groupName} <span className="text-xs font-medium text-slate-400 normal-case bg-slate-200 px-2 py-0.5 rounded-full">{items.length}</span>
            </h3>
            {view === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map(r => <ResourceCard key={r.id} resource={r} />)}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {items.map(r => <ResourceCard key={r.id} resource={r} />)}
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-slate-100">
            <LinkIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600">No resources found</h3>
            <p className="text-slate-500 mb-4">Add your first link or try adjusting your search filters.</p>
            <Button onClick={() => { setEditingResource(null); setIsAddOpen(true); }} className="bg-[#24C4D6] hover:bg-[#1db0c0]">
              Add Resource
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingResource ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveResource} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Name</label>
              <Input name="name" defaultValue={editingResource?.name} required placeholder="e.g. Content Calendar" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">URL</label>
              <Input name="url" defaultValue={editingResource?.url} required placeholder="https://" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Type</label>
                <Select name="resource_type" defaultValue={editingResource?.resource_type || 'Website'}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Category</label>
                <Input name="category" defaultValue={editingResource?.category || ''} placeholder="e.g. Projects" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Color</label>
                <div className="flex gap-2">
                  <Input name="color" type="color" defaultValue={editingResource?.color || '#cbd5e1'} className="w-12 h-10 p-1 cursor-pointer" />
                  <span className="text-xs text-slate-500 my-auto">Visual badge color</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Tags (comma separated)</label>
                <Input name="tags" defaultValue={(editingResource?.tags || []).join(', ')} placeholder="design, tools, active" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Description</label>
              <Input name="description" defaultValue={editingResource?.description} placeholder="Short description..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Private Notes</label>
              <Textarea name="notes" defaultValue={editingResource?.notes} placeholder="Any extra details..." rows={3} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#24C4D6] hover:bg-[#1db0c0]">Save Resource</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Import Links</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-slate-500">Paste multiple URLs below, one per line. We'll automatically add them.</p>
            <Textarea 
              value={bulkUrls}
              onChange={e => setBulkUrls(e.target.value)}
              placeholder="https://google.com&#10;https://canva.com"
              rows={10}
              className="font-mono text-sm"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBulkOpen(false)}>Cancel</Button>
              <Button onClick={handleBulkImport} className="bg-[#24C4D6] hover:bg-[#1db0c0]" disabled={!bulkUrls.trim()}>
                Import Links
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}