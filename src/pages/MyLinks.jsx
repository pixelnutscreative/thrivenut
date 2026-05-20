import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { LayoutGrid, List as ListIcon, Plus, Link as LinkIcon, Star, Search, ExternalLink, MoreVertical, Edit2, Trash2, Folder, Tag, Download, Flame, Settings, GripVertical, FileSpreadsheet, Loader2, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const RESOURCE_TYPES = ["Website", "Spreadsheet", "App", "Tool", "Client", "Project", "Doc", "Other"];

export default function MyLinks() {
  const queryClient = useQueryClient();
  const [view, setView] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterSubcategory, setFilterSubcategory] = useState('All');
  const [filterTag, setFilterTag] = useState('All');
  const [filterHotButton, setFilterHotButton] = useState(false);
  const [groupBy, setGroupBy] = useState('category');
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkUrls, setBulkUrls] = useState('');
  
  const [editingResource, setEditingResource] = useState(null);

  // Hot Button Settings
  const [isHotButtonSettingsOpen, setIsHotButtonSettingsOpen] = useState(false);

  // Sheet Import State
  const [isSheetImportOpen, setIsSheetImportOpen] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetImportStep, setSheetImportStep] = useState(1);
  const [sheetData, setSheetData] = useState([]);
  const [sheetHeaders, setSheetHeaders] = useState([]);
  const [sheetMapping, setSheetMapping] = useState({});
  const [isImporting, setIsImporting] = useState(false);

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
  const subcategories = useMemo(() => Array.from(new Set(resources.map(r => r.subcategory).filter(Boolean))), [resources]);
  const tags = useMemo(() => {
    const t = new Set();
    resources.forEach(r => (r.tags || []).forEach(tag => t.add(tag)));
    return Array.from(t);
  }, [resources]);

  const hotButtons = useMemo(() => {
    return resources.filter(r => r.is_hot_button).sort((a, b) => (a.hot_button_order || 0) - (b.hot_button_order || 0));
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
      setIsSheetImportOpen(false);
      setBulkUrls('');
      setSheetUrl('');
      setSheetImportStep(1);
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

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(hotButtons);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    items.forEach((item, index) => {
      if (item.hot_button_order !== index) {
        updateMutation.mutate({ id: item.id, data: { hot_button_order: index } });
      }
    });
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
      return { name, url, resource_type: 'Other', category: 'Imported', tags: [] };
    });

    bulkCreateMutation.mutate(newItems);
  };

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/);
    return lines.map(line => {
      const row = [];
      let cur = '';
      let inQuote = false;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
          if (i < line.length - 1 && line[i+1] === '"') {
            cur += '"'; i++;
          } else {
            inQuote = !inQuote;
          }
        } else if (line[i] === ',' && !inQuote) {
          row.push(cur); cur = '';
        } else {
          cur += line[i];
        }
      }
      row.push(cur);
      return row;
    }).filter(row => row.some(cell => cell.trim() !== ''));
  };

  const handleSheetFetch = async () => {
    if (!sheetUrl.trim()) return;
    setIsImporting(true);
    try {
      const res = await base44.functions.invoke('fetchPublicSheetCsv', { url: sheetUrl });
      if (res.data.error) throw new Error(res.data.error);
      
      const parsed = parseCSV(res.data.csv);
      if (parsed.length > 0) {
        setSheetHeaders(parsed[0]);
        setSheetData(parsed.slice(1));
        
        const initialMap = {};
        parsed[0].forEach((header, idx) => {
          const h = header.toLowerCase().trim();
          if (h.includes('tab') && !h.includes('sub')) initialMap[idx] = 'resource_type';
          else if (h.includes('sub-tab') || h.includes('subcategory')) initialMap[idx] = 'subcategory';
          else if (h.includes('title') || h.includes('name')) initialMap[idx] = 'name';
          else if (h.includes('category')) initialMap[idx] = 'category';
          else if (h.includes('desc')) initialMap[idx] = 'description';
          else if (h.includes('url') || h.includes('link')) initialMap[idx] = 'url';
          else if (h.includes('date')) initialMap[idx] = 'notes';
          else initialMap[idx] = 'skip';
        });
        setSheetMapping(initialMap);
        setSheetImportStep(2);
      }
    } catch (e) {
      toast.error(e.message || 'Failed to fetch sheet');
    } finally {
      setIsImporting(false);
    }
  };

  const executeSheetImport = () => {
    setIsImporting(true);
    const newItems = sheetData.map(row => {
      const item = {
        name: 'Untitled', url: '', resource_type: 'Other', category: '', subcategory: '',
        description: '', notes: '', tags: []
      };
      
      row.forEach((cell, idx) => {
        const mapping = sheetMapping[idx];
        if (!mapping || mapping === 'skip') return;
        const val = cell.trim();
        if (val) {
          item[mapping] = val;
        }
      });
      
      if (!item.category) item.category = item.resource_type || 'Imported';
      if (item.url && !item.url.startsWith('http')) item.url = 'https://' + item.url;
      
      return item;
    });

    const validItems = newItems.filter(i => i.name !== 'Untitled' && i.url);
    if (validItems.length === 0) {
      toast.error("No valid links found. Check your URL mapping.");
      setIsImporting(false);
      return;
    }
    
    bulkCreateMutation.mutate(validItems, {
      onSettled: () => setIsImporting(false)
    });
  };

  const filtered = useMemo(() => {
    return resources.filter(r => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const n = r.name?.toLowerCase() || '';
        const c = r.category?.toLowerCase() || '';
        const s = r.subcategory?.toLowerCase() || '';
        const d = r.description?.toLowerCase() || '';
        const u = r.url?.toLowerCase() || '';
        const n2 = r.notes?.toLowerCase() || '';
        const t = (r.tags || []).join(' ').toLowerCase();
        if (!n.includes(q) && !c.includes(q) && !s.includes(q) && !t.includes(q) && !d.includes(q) && !u.includes(q) && !n2.includes(q)) return false;
      }
      if (filterType !== 'All' && r.resource_type !== filterType) return false;
      if (filterCategory !== 'All' && r.category !== filterCategory) return false;
      if (filterSubcategory !== 'All' && r.subcategory !== filterSubcategory) return false;
      if (filterTag !== 'All' && !(r.tags || []).includes(filterTag)) return false;
      if (filterHotButton && !r.is_hot_button) return false;
      return true;
    });
  }, [resources, searchQuery, filterType, filterCategory, filterSubcategory, filterTag, filterHotButton]);

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
      subcategory: formData.get('subcategory'),
      color: formData.get('color'),
      notes: formData.get('notes'),
      is_hot_button: formData.get('is_hot_button') === 'on',
      hot_button_label: formData.get('hot_button_label'),
      hot_button_icon: formData.get('hot_button_icon'),
      tags: formData.get('tags').split(',').map(t => t.trim()).filter(t => t)
    };
    if (!data.url.startsWith('http://') && !data.url.startsWith('https://')) {
      data.url = 'https://' + data.url;
    }
    
    if (editingResource) {
      updateMutation.mutate({ id: editingResource.id, data });
    } else {
      data.hot_button_order = hotButtons.length;
      createMutation.mutate(data);
    }
  };

  const removeFilter = (filterName) => {
    if (filterName === 'type') setFilterType('All');
    if (filterName === 'category') setFilterCategory('All');
    if (filterName === 'subcategory') setFilterSubcategory('All');
    if (filterName === 'tag') setFilterTag('All');
    if (filterName === 'hotButton') setFilterHotButton(false);
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
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{resource.description || resource.url}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {resource.is_hot_button && <Flame className="w-4 h-4 text-orange-500" />}
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
          {resource.subcategory && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-slate-100 text-slate-500">
              {resource.subcategory}
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
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">My Hub</h1>
            <p className="text-slate-500 mt-1">Your personal command center for tools, sites, and apps.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <Button variant="outline" onClick={() => setIsSheetImportOpen(true)} className="text-slate-600 border-green-200 hover:bg-green-50 hover:text-green-700">
              <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" /> Import Sheet
            </Button>
            <Button variant="outline" onClick={() => setIsBulkOpen(true)} className="text-slate-600">
              <Download className="w-4 h-4 mr-2" /> Bulk Add
            </Button>
            <Button onClick={() => { setEditingResource(null); setIsAddOpen(true); }} className="bg-[#24C4D6] hover:bg-[#1db0c0] text-white">
              <Plus className="w-4 h-4 mr-2" /> Add Resource
            </Button>
          </div>
        </div>

        {/* Hot Buttons Row */}
        {hotButtons.length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-500" /> Hot Buttons
              <Button variant="ghost" size="sm" className="ml-auto text-slate-400" onClick={() => setIsHotButtonSettingsOpen(true)}>
                <Settings className="w-4 h-4 mr-1" /> Manage
              </Button>
            </h3>
            <div className="flex flex-wrap gap-3">
              {hotButtons.map(btn => (
                <button
                  key={btn.id}
                  onClick={() => handleOpen(btn)}
                  className="bg-[#24C4D6] hover:bg-[#1db0c0] text-white px-5 py-3 rounded-full font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm sm:text-base"
                >
                  <span className="text-lg">{btn.hot_button_icon || '🔥'}</span>
                  {btn.hot_button_label || btn.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex-1 max-w-md w-full relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across everything..." 
              className="pl-9 bg-slate-50 border-slate-200"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[120px] bg-slate-50 border-none h-9 text-xs">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                {RESOURCE_TYPES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[120px] bg-slate-50 border-none h-9 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            {subcategories.length > 0 && (
              <Select value={filterSubcategory} onValueChange={setFilterSubcategory}>
                <SelectTrigger className="w-[120px] bg-slate-50 border-none h-9 text-xs">
                  <SelectValue placeholder="Subcategory" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Subcategories</SelectItem>
                  {subcategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            {tags.length > 0 && (
              <Select value={filterTag} onValueChange={setFilterTag}>
                <SelectTrigger className="w-[120px] bg-slate-50 border-none h-9 text-xs">
                  <SelectValue placeholder="Tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Tags</SelectItem>
                  {tags.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            
            <Button 
              variant={filterHotButton ? 'default' : 'outline'} 
              size="sm" 
              className={`h-9 ${filterHotButton ? 'bg-orange-500 hover:bg-orange-600 border-none text-white' : 'text-slate-500'}`}
              onClick={() => setFilterHotButton(!filterHotButton)}
            >
              <Flame className="w-4 h-4 mr-1" /> Hot Only
            </Button>

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

        {/* Active Filters */}
        {(filterType !== 'All' || filterCategory !== 'All' || filterSubcategory !== 'All' || filterTag !== 'All' || filterHotButton) && (
          <div className="flex flex-wrap gap-2 pt-2">
            {filterType !== 'All' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">Type: {filterType} <button onClick={() => removeFilter('type')}><X className="w-3 h-3 hover:text-slate-900" /></button></span>}
            {filterCategory !== 'All' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700">Category: {filterCategory} <button onClick={() => removeFilter('category')}><X className="w-3 h-3 hover:text-indigo-900" /></button></span>}
            {filterSubcategory !== 'All' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700">Sub: {filterSubcategory} <button onClick={() => removeFilter('subcategory')}><X className="w-3 h-3 hover:text-purple-900" /></button></span>}
            {filterTag !== 'All' && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600">Tag: {filterTag} <button onClick={() => removeFilter('tag')}><X className="w-3 h-3 hover:text-slate-900" /></button></span>}
            {filterHotButton && <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-700">Hot Buttons <button onClick={() => removeFilter('hotButton')}><X className="w-3 h-3 hover:text-orange-900" /></button></span>}
          </div>
        )}

        {/* Resource List */}
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

      {/* Add / Edit Resource */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingResource ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveResource} className="space-y-4 pt-2">
            
            {/* Hot Button Section */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <Switch 
                  id="is_hot_button" 
                  name="is_hot_button" 
                  defaultChecked={editingResource?.is_hot_button} 
                  onCheckedChange={v => {
                    const el = document.getElementById('hot_button_options');
                    if(el) el.style.display = v ? 'block' : 'none';
                  }}
                />
                <label htmlFor="is_hot_button" className="text-sm font-semibold text-slate-700 flex items-center gap-2 cursor-pointer">
                  <Flame className="w-4 h-4 text-orange-500" /> Mark as Hot Button
                </label>
              </div>
              
              <div id="hot_button_options" style={{ display: editingResource?.is_hot_button ? 'block' : 'none' }}>
                <div className="grid grid-cols-[80px_1fr] gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Icon</label>
                    <Input name="hot_button_icon" defaultValue={editingResource?.hot_button_icon || '🔥'} placeholder="Emoji" className="text-center" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Button Label</label>
                    <Input name="hot_button_label" defaultValue={editingResource?.hot_button_label || ''} placeholder="e.g. VIBE Sheet" />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-semibold text-slate-600">Name</label>
                <Input name="name" defaultValue={editingResource?.name} required placeholder="e.g. Content Calendar" />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-sm font-semibold text-slate-600">URL</label>
                <Input name="url" defaultValue={editingResource?.url} required placeholder="https://" />
              </div>
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
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Subcategory</label>
                <Input name="subcategory" defaultValue={editingResource?.subcategory || ''} placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Tags (comma separated)</label>
                <Input name="tags" defaultValue={(editingResource?.tags || []).join(', ')} placeholder="design, tools" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Color Badge</label>
              <div className="flex gap-2">
                <Input name="color" type="color" defaultValue={editingResource?.color || '#cbd5e1'} className="w-12 h-10 p-1 cursor-pointer" />
                <span className="text-xs text-slate-500 my-auto">For visual grouping on the card edge</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Description</label>
              <Input name="description" defaultValue={editingResource?.description} placeholder="Short description..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Private Notes</label>
              <Textarea name="notes" defaultValue={editingResource?.notes} placeholder="Any extra details..." rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#24C4D6] hover:bg-[#1db0c0]">Save Resource</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog for Hot Buttons */}
      <Dialog open={isHotButtonSettingsOpen} onOpenChange={setIsHotButtonSettingsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Hot Buttons</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-500">Drag to reorder your hot buttons, change their labels, or remove them from the bar.</p>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="hot-buttons">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2 pt-2 max-h-[60vh] overflow-y-auto">
                  {hotButtons.map((btn, index) => (
                    <Draggable key={btn.id} draggableId={btn.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200"
                        >
                          <div {...provided.dragHandleProps} className="cursor-grab text-slate-400 p-1">
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <div className="flex-1 flex gap-2">
                            <Input 
                              className="w-12 h-8 text-center px-1 text-sm bg-white" 
                              defaultValue={btn.hot_button_icon} 
                              onBlur={e => updateMutation.mutate({ id: btn.id, data: { hot_button_icon: e.target.value } })}
                            />
                            <Input 
                              className="h-8 flex-1 text-sm bg-white" 
                              defaultValue={btn.hot_button_label || btn.name}
                              onBlur={e => updateMutation.mutate({ id: btn.id, data: { hot_button_label: e.target.value } })}
                            />
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-slate-400 hover:text-red-500 shrink-0 h-8 w-8"
                            onClick={() => updateMutation.mutate({ id: btn.id, data: { is_hot_button: false } })}
                            title="Remove Hot Button"
                          >
                            <Trash2 className="w-4 h-4" />
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
          <DialogFooter>
            <Button className="w-full" onClick={() => setIsHotButtonSettingsOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Links Dialog */}
      <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Add Links</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-slate-500">Paste multiple URLs below, one per line.</p>
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

      {/* Google Sheets Import Dialog */}
      <Dialog open={isSheetImportOpen} onOpenChange={setIsSheetImportOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Import from Google Sheets</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {sheetImportStep === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-600 bg-blue-50 p-4 rounded-xl">
                  Paste the link to your Google Sheet to pull in all your resources. 
                  <strong> Make sure the sheet is public (Anyone with the link can view).</strong>
                </p>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600">Google Sheet URL</label>
                  <Input 
                    value={sheetUrl}
                    onChange={e => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1xxxxxxxxxxxx/edit#gid=0"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsSheetImportOpen(false)}>Cancel</Button>
                  <Button className="bg-[#24C4D6] hover:bg-[#1db0c0]" onClick={handleSheetFetch} disabled={isImporting || !sheetUrl}>
                    {isImporting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Fetching...</> : 'Fetch Sheet'}
                  </Button>
                </div>
              </div>
            )}

            {sheetImportStep === 2 && (
              <div className="space-y-6">
                <p className="text-sm text-slate-600 bg-blue-50 p-3 rounded-lg">
                  Map your Sheet columns to Resource fields. 
                </p>
                <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-3">
                  {sheetHeaders.map((header, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div className="w-1/3 font-medium text-sm text-slate-700 truncate" title={header}>{header}</div>
                      <Select 
                        value={sheetMapping[idx] || 'skip'}
                        onValueChange={(val) => setSheetMapping({...sheetMapping, [idx]: val})}
                      >
                        <SelectTrigger className="flex-1 bg-white">
                          <SelectValue placeholder="Skip Column" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="skip" className="text-slate-400 italic">Skip Column</SelectItem>
                          <SelectItem value="name">Title / Name</SelectItem>
                          <SelectItem value="url">URL / Link</SelectItem>
                          <SelectItem value="resource_type">Resource Type (Tab)</SelectItem>
                          <SelectItem value="category">Category</SelectItem>
                          <SelectItem value="subcategory">Subcategory (Sub-Tab)</SelectItem>
                          <SelectItem value="description">Description</SelectItem>
                          <SelectItem value="notes">Notes / Date</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <Button variant="outline" onClick={() => setSheetImportStep(1)}>Back</Button>
                  <Button className="bg-[#24C4D6] hover:bg-[#1db0c0]" onClick={executeSheetImport} disabled={isImporting}>
                    {isImporting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...</> : 'Start Import'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}