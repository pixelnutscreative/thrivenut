import React, { useState } from 'react';
   import { base44 } from '@/api/base44Client';
   import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
   import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
   import { Button } from '@/components/ui/button';
   import { Input } from '@/components/ui/input';
   import { Badge } from '@/components/ui/badge';
   import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
   import { Label } from '@/components/ui/label';
   import { Textarea } from '@/components/ui/textarea';
   import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
   import { Loader2, Plus, Search, ExternalLink, Trash2, Filter, Link as LinkIcon, Edit2, Users, Globe, Lock, Building, Info, Star, BookOpen, Mic, MonitorPlay, Video, Key, Calendar as CalendarIcon, Utensils, ShoppingBag, TriangleAlert, Camera, ScanText, X } from 'lucide-react';
   import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
   import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
   import ImageUploader from '../components/settings/ImageUploader';
   import { Check } from 'lucide-react';
   import { useTheme } from '../components/shared/useTheme';
   import ColorPicker from '../components/shared/ColorPicker';
   import { Switch } from '@/components/ui/switch';
   import { Checkbox } from '@/components/ui/checkbox';
   import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
   import { Link } from 'react-router-dom';
 
   const defaultCategories = [
     'Course', 'Zoom Meeting', 'Login', 'Recipe', 'Movie', 'Book', 'Podcast', 'Audiobook', 'Affiliate Link', 'Affiliate Portal', 
     'Communities', 'Tools', 'Inspiration', 'Other', 'Uncategorized'
   ];
   
   const categoryIcons = {
     'Course': <BookOpen className="w-4 h-4" />,
     'Zoom Meeting': <Video className="w-4 h-4" />,
     'Login': <Key className="w-4 h-4" />,
     'Recipe': <Utensils className="w-4 h-4" />,
     'Movie': <MonitorPlay className="w-4 h-4" />,
     'Book': <BookOpen className="w-4 h-4" />,
     'Podcast': <Mic className="w-4 h-4" />,
     'Audiobook': <Mic className="w-4 h-4" />,
     'Affiliate Link': <LinkIcon className="w-4 h-4" />,
     'Affiliate Portal': <ShoppingBag className="w-4 h-4" />,
     'Communities': <Users className="w-4 h-4" />,
     'Tools': <Building className="w-4 h-4" />,
     'Inspiration': <Info className="w-4 h-4" />,
     'Other': <LinkIcon className="w-4 h-4" />,
     'Uncategorized': <Info className="w-4 h-4" />
   };
 
   export default function MyResources() {
     const queryClient = useQueryClient();
     const { user, preferences } = useTheme();
     const [search, setSearch] = useState('');
     const [selectedCategories, setSelectedCategories] = useState([]); // Empty = All
     const [viewFilter, setViewFilter] = useState('mine'); // 'mine', 'shared', 'all'
     const [isScanning, setIsScanning] = useState(false);
     const [isAddOpen, setIsAddOpen] = useState(false);
     const [editingItem, setEditingItem] = useState(null);
     const [resourceToDelete, setResourceToDelete] = useState(null);

     const [formData, setFormData] = useState({
       title: '',
       description: '',
       url: '',
       categories: [],
       notes: '',
       tags: [], // Deprecated
       color: '#ffffff',
       secondary_color: '',
       visibility: 'private',
       group_ids: [],
       is_favorite: false
     });
 
     const { data: myResources = [], isLoading: myLoading } = useQuery({
       queryKey: ['myResources', user?.email],
       queryFn: () => base44.entities.UserResource.filter({ user_email: user?.email }, '-created_date'),
       enabled: !!user?.email
     });
 
     const { data: sharedResources = [], isLoading: sharedLoading } = useQuery({
       queryKey: ['sharedResources'],
       queryFn: async () => {
         try {
           const response = await base44.functions.invoke('fetchSharedResources');
           return response.data.resources || [];
         } catch (e) { return []; }
       },
       enabled: !!user
     });
 
     // Combine resources based on view filter
     const allResources = React.useMemo(() => {
       if (viewFilter === 'mine') return myResources;
       if (viewFilter === 'shared') return sharedResources;
       // For 'all', merge them but avoid duplicates
       const myIds = new Set(myResources.map(r => r.id));
       return [...myResources, ...sharedResources.filter(r => !myIds.has(r.id))];
     }, [viewFilter, myResources, sharedResources]);

     const isLoading = myLoading || sharedLoading;
 
     // Fetch groups for dropdown
     const { data: myGroups = [] } = useQuery({
       queryKey: ['myGroups', user?.email],
       queryFn: async () => {
           if (!user?.email) return [];
           // Relaxed filter to ensure we get all memberships
           const memberships = await base44.entities.CreatorGroupMember.filter({ user_email: user.email });
           if (!memberships || memberships.length === 0) return [];

           // Fetch all groups in parallel
           const groupPromises = memberships.map(m => base44.entities.CreatorGroup.filter({ id: m.group_id }));
           const groupResults = await Promise.all(groupPromises);

           // Flatten array of arrays and filter out any empty/null results
           // Removed strict status checks to ensure groups appear
           return groupResults.flat().filter(g => g);
       },
       enabled: !!user?.email
     });
 
     const { data: userCategories = [] } = useQuery({
       queryKey: ['resourceCategories'],
       queryFn: async () => {
         // Fetch managed categories
         const cats = await base44.entities.ResourceCategory.list('sort_order');
         return cats.map(c => c.name);
       }
     });
 
     const allCategories = [...new Set([...defaultCategories, ...userCategories])];

     // Category Management
     const [isManageCatsOpen, setIsManageCatsOpen] = useState(false);
     const [newCatName, setNewCatName] = useState('');
     
     const addCategoryMutation = useMutation({
       mutationFn: (name) => base44.entities.ResourceCategory.create({ name }),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['resourceCategories'] });
         setNewCatName('');
       }
     });

     const deleteCategoryMutation = useMutation({
       mutationFn: async (name) => {
         const cats = await base44.entities.ResourceCategory.filter({ name });
         if (cats[0]) await base44.entities.ResourceCategory.delete(cats[0].id);
       },
       onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resourceCategories'] })
     });
 
     const saveMutation = useMutation({
     mutationFn: async (data) => {
       // Auto-assign "Uncategorized" if empty
       const finalCategories = data.categories.length > 0 ? data.categories : ['Uncategorized'];
       
       // Clean URL if it's just protocol
       let cleanUrl = data.url;
       if (cleanUrl === 'https://' || cleanUrl === 'http://') cleanUrl = '';

       const payload = {
         ...data,
         url: cleanUrl,
         categories: finalCategories,
         category: finalCategories[0], // Sync primary category
         user_email: user.email
       };

       let savedResource;
       if (editingItem) {
         savedResource = await base44.entities.UserResource.update(editingItem.id, payload);
       } else {
         savedResource = await base44.entities.UserResource.create(payload);
       }

       // Handle Group Sharing
       if (data.visibility === 'group' && data.group_ids.length > 0) {
         // Create GroupResource copies for each group
         for (const groupId of data.group_ids) {
           // Check if I am owner/admin of this group
           const membership = await base44.entities.CreatorGroupMember.filter({ group_id: groupId, user_email: user.email });
           const role = membership[0]?.role;
           
           if (role === 'owner' || role === 'admin') {
             // Check if already exists to avoid duplicates? 
             // For now, simple create to ensure it appears. 
             // Ideally we'd check url/title dupes but "Copy" is safer.
             await base44.entities.GroupResource.create({
               group_id: groupId,
               title: data.title,
               description: data.description || data.notes, // Map description or notes
               type: data.url ? 'link' : 'text',
               url: data.url,
               submitted_by: user.email,
               status: 'approved', // Auto-approve for admins
               approved_by: user.email
             });
           }
         }
       }

       return savedResource;
     },
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['myResources'] });
         setIsAddOpen(false);
         setEditingItem(null);
         resetForm();
       }
     });
 
     const deleteMutation = useMutation({
       mutationFn: (id) => base44.entities.UserResource.delete(id),
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['myResources'] });
         setResourceToDelete(null);
       }
     });

     const toggleFavoriteMutation = useMutation({
       mutationFn: async (resource) => {
         return await base44.entities.UserResource.update(resource.id, { is_favorite: !resource.is_favorite });
       },
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['myResources'] });
       }
     });
 
     const resetForm = () => {
       setFormData({
         title: '',
         description: '',
         url: '',
         categories: [], // No default
         notes: '',
         tags: [],
         color: '#ffffff',
         secondary_color: '',
         visibility: 'private',
         group_ids: [],
         is_favorite: false
       });
     };

     const handleEdit = (item) => {
       setEditingItem(item);
       // Handle backward compatibility
       let itemGroupIds = item.group_ids || [];
       if (item.group_id && !itemGroupIds.includes(item.group_id)) {
         itemGroupIds.push(item.group_id);
       }

       let itemCategories = item.categories || [];
       if (item.category && !itemCategories.includes(item.category)) {
         itemCategories.push(item.category);
       }

       setFormData({
         title: item.title || '',
         description: item.description || '',
         url: item.url || '', // Fix: Ensure URL is never undefined to prevent crashes
         categories: itemCategories,
         notes: item.notes || '',
         tags: item.tags || [],
         color: item.color || '#ffffff',
         secondary_color: item.secondary_color || '',
         visibility: item.visibility || 'private',
         group_ids: itemGroupIds,
         is_favorite: item.is_favorite || false
       });
       setIsAddOpen(true);
     };
 
     const filteredResources = allResources.filter(res => {
       const searchLower = search.toLowerCase();
       const matchesSearch = !search || 
         res.title.toLowerCase().includes(searchLower) || 
         res.description?.toLowerCase().includes(searchLower) || 
         res.notes?.toLowerCase().includes(searchLower) ||
         (res.categories || []).some(c => c.toLowerCase().includes(searchLower));
       
       // Handle backward compatibility: check 'categories' array OR single 'category' string
       const resCategories = res.categories || (res.category ? [res.category] : []);
       const matchesCategory = selectedCategories.length === 0 || 
         selectedCategories.some(c => resCategories.includes(c));
       
       return matchesSearch && matchesCategory;
     });
 
     return (
       <div className="p-6 max-w-6xl mx-auto space-y-6">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
           <h1 className="text-2xl font-bold flex items-center gap-2">
             <LinkIcon className="w-6 h-6 text-purple-600" />
             {preferences?.my_resources_label || 'My Stuff'}
           </h1>
           <p className="text-gray-600">
             Your personal library of links, courses, inspiration, and shared group resources.
           </p>
         </div>
         <div className="flex flex-wrap gap-2 items-center">
             {/* View Filter Tabs */}
             <div className="flex bg-gray-100 p-1 rounded-lg mr-2">
               <button 
                 onClick={() => setViewFilter('mine')}
                 className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewFilter === 'mine' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}
               >
                 My Stuff
               </button>
               <button 
                 onClick={() => setViewFilter('shared')}
                 className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewFilter === 'shared' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}
               >
                 Shared
               </button>
               <button 
                 onClick={() => setViewFilter('all')}
                 className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${viewFilter === 'all' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}
               >
                 All
               </button>
             </div>

             <Button variant="outline" size="sm" onClick={() => {
               const newName = prompt('Rename "My Stuff" to:', preferences?.my_resources_label || 'My Stuff');
               if (newName && newName.trim()) {
                 base44.entities.UserPreferences.update(preferences.id, { my_resources_label: newName.trim() })
                   .then(() => window.location.reload()); 
               }
             }}>
               <Edit2 className="w-4 h-4 mr-2" /> Rename
             </Button>
             <Button onClick={() => { setEditingItem(null); resetForm(); setIsAddOpen(true); }} className="bg-purple-600 hover:bg-purple-700 text-white">
               <Plus className="w-4 h-4 mr-2" /> Add Item
             </Button>
           </div>
         </div>
 
         <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search resources..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Multi-Select Category Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-between">
                {selectedCategories.length === 0 
                  ? "All Categories" 
                  : `${selectedCategories.length} selected`}
                <Filter className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="end">
              <Command>
                <CommandList>
                  <CommandGroup>
                    {allCategories.map(cat => {
                      const isSelected = selectedCategories.includes(cat);
                      return (
                        <CommandItem
                          key={cat}
                          onSelect={() => {
                            setSelectedCategories(prev => 
                              isSelected 
                                ? prev.filter(c => c !== cat)
                                : [...prev, cat]
                            );
                          }}
                        >
                          <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary ${isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"}`}>
                            <Check className={("h-4 w-4")} />
                          </div>
                          <span className="flex items-center gap-2">
                            {categoryIcons[cat]} {cat}
                          </span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
                {selectedCategories.length > 0 && (
                   <div className="p-2 border-t">
                     <Button 
                       variant="ghost" 
                       size="sm" 
                       className="w-full justify-center h-8 text-xs"
                       onClick={() => setSelectedCategories([])}
                     >
                       Clear Filters
                     </Button>
                   </div>
                )}
              </Command>
            </PopoverContent>
          </Popover>
         </div>
 
         {isLoading ? (
           <div className="flex justify-center py-12">
             <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
           </div>
         ) : (
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
             {filteredResources.map(resource => {
               // Determine if this is a shared resource (not owned by user)
               const isShared = resource.user_email !== user?.email;

               // Use lighter accent/border approach instead of full background
               const accentColor = resource.color && resource.color !== '#ffffff' ? resource.color : '#e5e7eb';
               const primaryCategory = (resource.categories && resource.categories[0]) || resource.category || 'Other';
               const Icon = categoryIcons[primaryCategory] || <LinkIcon className="w-4 h-4" />;

               return (
                 <Card 
                   key={resource.id} 
                   className="hover:shadow-lg transition-all duration-300 group relative border-l-4 overflow-hidden bg-white" 
                   style={{ borderLeftColor: accentColor }}
                 >
                   <CardHeader className="pb-2 pt-4 px-4">
                     <div className="flex justify-between items-start mb-1">
                       <div className="flex flex-wrap items-center gap-1">
                         {(resource.categories || [resource.category]).map((cat, idx) => (
                           <Badge key={idx} variant="outline" className="flex items-center gap-1.5 font-medium px-2 py-0.5 bg-gray-50 text-gray-700 border-gray-200 text-[10px]">
                             {categoryIcons[cat] || <LinkIcon className="w-3 h-3" />}
                             {cat}
                           </Badge>
                         ))}
                         {/* Display Description snippet if available */}
                         {resource.description && (
                           <span className="text-xs text-gray-500 line-clamp-1 w-full mt-1">
                             {resource.description}
                           </span>
                         )}
                         {isShared && (
                           <Badge variant="secondary" className="text-[10px] bg-blue-50 text-blue-700">Shared</Badge>
                         )}
                       </div>

                       <div className="flex items-center gap-1">
                         {/* Favorite Star */}
                         {!isShared && (
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               toggleFavoriteMutation.mutate(resource);
                             }}
                             className={`p-1.5 rounded-full hover:bg-gray-100 transition-colors ${resource.is_favorite ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}
                           >
                             <Star className={`w-5 h-5 ${resource.is_favorite ? 'fill-current' : ''}`} />
                           </button>
                         )}

                         {/* Edit Button (Only for owner) */}
                         {!isShared && (
                           <Button 
                             variant="ghost" 
                             size="sm" 
                             className="h-8 w-8 p-0 text-gray-400 hover:text-purple-600 hover:bg-purple-50" 
                             onClick={() => handleEdit(resource)}
                           >
                             <Edit2 className="w-4 h-4" />
                           </Button>
                         )}
                       </div>
                     </div>

                     <CardTitle className="text-base font-bold leading-tight line-clamp-2">
                       {resource.url ? (
                         <a href={resource.url} target="_blank" rel="noopener noreferrer" className="hover:text-purple-600 transition-colors flex gap-2 items-start">
                           {resource.title}
                           <ExternalLink className="w-3 h-3 mt-1 flex-shrink-0 opacity-40" />
                         </a>
                       ) : (
                         resource.title
                       )}
                     </CardTitle>
                   </CardHeader>

                   <CardContent className="px-4 pb-4">
                     {resource.notes && (
                       <div className="text-xs text-gray-500 mb-3 line-clamp-3 whitespace-pre-wrap bg-gray-50 p-2 rounded-md border border-gray-100">
                         {resource.notes}
                       </div>
                     )}

                     {resource.tags && resource.tags.length > 0 && (
                       <div className="flex flex-wrap gap-1 mt-auto">
                         {resource.tags.map((tag, i) => (
                           <span key={i} className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium">#{tag}</span>
                         ))}
                       </div>
                     )}
                   </CardContent>
                 </Card>
               );
             })}
           </div>
         )}
 
         {filteredResources.length === 0 && !isLoading && (
           <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed">
             <p className="text-gray-500">No resources found. Add your first one!</p>
           </div>
         )}
 
         <Dialog open={!!resourceToDelete} onOpenChange={(open) => !open && setResourceToDelete(null)}>
           <DialogContent>
             <DialogHeader>
               <DialogTitle>Delete Resource?</DialogTitle>
             </DialogHeader>
             <p>Are you sure you want to delete <strong>{resourceToDelete?.title}</strong>? This cannot be undone.</p>
             <DialogFooter>
               <Button variant="ghost" onClick={() => setResourceToDelete(null)}>Cancel</Button>
               <Button 
                 variant="destructive" 
                 onClick={() => deleteMutation.mutate(resourceToDelete.id)}
                 disabled={deleteMutation.isPending}
               >
                 {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
               </Button>
             </DialogFooter>
           </DialogContent>
         </Dialog>

         <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
           <DialogContent className="max-h-[85vh] overflow-y-auto max-w-2xl">
             <DialogHeader>
               <DialogTitle>{editingItem ? 'Edit Resource' : 'Add New Resource'}</DialogTitle>
             </DialogHeader>
             <div className="space-y-4">
               <div>
                 <Label>Title</Label>
                 <Input 
                   value={formData.title} 
                   onChange={(e) => setFormData({...formData, title: e.target.value})}
                   placeholder="e.g., My Favorite Course"
                 />
               </div>
               <div>
                 <Label>Description</Label>
                 <Input 
                   value={formData.description} 
                   onChange={(e) => setFormData({...formData, description: e.target.value})}
                   placeholder="Short description..."
                 />
               </div>
               <div>
                 <Label>URL (Optional)</Label>
                 <div className="flex gap-2">
                   <Select
                     value={(formData.url || '').startsWith('http://') ? 'http://' : 'https://'}
                     onValueChange={(v) => {
                       const currentUrl = formData.url || '';
                       const cleanPath = currentUrl.replace(/^https?:\/\//, '');
                       setFormData({ ...formData, url: v + cleanPath });
                     }}
                   >
                     <SelectTrigger className="w-[100px]">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent position="popper" className="z-[1000]">
                       <SelectItem value="https://">https://</SelectItem>
                       <SelectItem value="http://">http://</SelectItem>
                     </SelectContent>
                   </Select>
                   <Input 
                     value={(formData.url || '').replace(/^https?:\/\//, '')} 
                     onChange={(e) => {
                       const currentUrl = formData.url || '';
                       const protocol = currentUrl.startsWith('http://') ? 'http://' : 'https://';
                       setFormData({ ...formData, url: protocol + e.target.value });
                     }}
                     placeholder="www.example.com"
                     className="flex-1"
                   />
                 </div>
               </div>
               <div>
                 <Label className="mb-2 block">Categories</Label>
                 <div className="flex flex-wrap gap-2 mb-3">
                   {formData.categories.map(cat => (
                     <Badge key={cat} variant="secondary" className="flex items-center gap-1 py-1 px-2">
                       {categoryIcons[cat] || <LinkIcon className="w-3 h-3" />}
                       {cat}
                       <button 
                         onClick={() => setFormData(prev => ({
                           ...prev, 
                           categories: prev.categories.filter(c => c !== cat)
                         }))}
                         className="ml-1 hover:text-red-500"
                       >
                         <X className="w-3 h-3" />
                       </button>
                     </Badge>
                   ))}
                 </div>

                 <div className="flex flex-col gap-2">
                   <div className="flex gap-2">
                     <Select onValueChange={(v) => {
                       if (!formData.categories.includes(v)) {
                         setFormData(prev => ({ ...prev, categories: [...prev.categories, v] }));
                       }
                     }}>
                       <SelectTrigger className="flex-1">
                         <SelectValue placeholder="Select Category..." />
                       </SelectTrigger>
                       <SelectContent position="popper" className="max-h-[200px] z-[1000]">
                         {allCategories.map(cat => (
                           <SelectItem key={cat} value={cat}>
                             <div className="flex items-center gap-2">
                               {categoryIcons[cat] || <LinkIcon className="w-4 h-4" />}
                               {cat}
                             </div>
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                     
                     <Dialog open={isManageCatsOpen} onOpenChange={setIsManageCatsOpen}>
                       <DialogTrigger asChild>
                         <Button variant="outline" size="icon" title="Manage Categories">
                           <Edit2 className="w-4 h-4" />
                         </Button>
                       </DialogTrigger>
                       <DialogContent>
                         <DialogHeader><DialogTitle>Manage Categories</DialogTitle></DialogHeader>
                         <div className="space-y-4">
                           <div className="flex gap-2">
                             <Input 
                               placeholder="New Category Name" 
                               value={newCatName}
                               onChange={(e) => setNewCatName(e.target.value)}
                             />
                             <Button onClick={() => addCategoryMutation.mutate(newCatName)} disabled={!newCatName}>Add</Button>
                           </div>
                           <div className="max-h-60 overflow-y-auto space-y-2">
                             {userCategories.map(cat => (
                               <div key={cat} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                 <span>{cat}</span>
                                 <Button 
                                   variant="ghost" 
                                   size="sm" 
                                   onClick={() => deleteCategoryMutation.mutate(cat)}
                                   className="text-red-500 h-6 w-6 p-0"
                                 >
                                   <X className="w-4 h-4" />
                                 </Button>
                               </div>
                             ))}
                             {userCategories.length === 0 && <p className="text-sm text-gray-500 text-center">No custom categories.</p>}
                           </div>
                         </div>
                       </DialogContent>
                     </Dialog>
                   </div>

                   {/* Custom Category Quick Add */}
                   <div className="flex gap-2">
                     <Input 
                       placeholder="Type new category..." 
                       id="custom-cat-input"
                       onKeyDown={(e) => {
                         if (e.key === 'Enter') {
                           e.preventDefault();
                           const val = e.target.value.trim();
                           if (val) {
                             if (!allCategories.includes(val)) {
                               addCategoryMutation.mutate(val); // Add to permanent list
                             }
                             if (!formData.categories.includes(val)) {
                               setFormData(prev => ({ ...prev, categories: [...prev.categories, val] }));
                             }
                             e.target.value = '';
                           }
                         }
                       }}
                     />
                     <Button 
                       type="button" 
                       variant="secondary"
                       onClick={() => {
                         const input = document.getElementById('custom-cat-input');
                         const val = input.value.trim();
                         if (val) {
                           if (!allCategories.includes(val)) {
                             addCategoryMutation.mutate(val);
                           }
                           if (!formData.categories.includes(val)) {
                             setFormData(prev => ({ ...prev, categories: [...prev.categories, val] }));
                           }
                           input.value = '';
                         }
                       }}
                     >
                       Add
                     </Button>
                   </div>
                 </div>
               </div>

                 {formData.categories.includes('Login') && (
                   <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3 items-start text-sm text-amber-800">
                     <TriangleAlert className="w-5 h-5 flex-shrink-0 text-amber-600" />
                     <p>
                       <strong>Security Warning:</strong> Please do NOT store actual passwords here. 
                       Use your browser's password manager or a secure tool like 1Password/LastPass. 
                       Only store the login URL and username here.
                     </p>
                   </div>
                 )}

                 {formData.categories.includes('Recipe') && (
                 <div className="bg-green-50 border border-green-200 rounded-lg p-3 space-y-3">
                   <div className="flex gap-3 items-start text-sm text-green-800">
                     <Utensils className="w-5 h-5 flex-shrink-0 text-green-600" />
                     <div className="space-y-2 w-full">
                       <p className="font-medium">Scan Recipe from Image</p>
                       <p className="text-xs opacity-90">Upload a photo of a recipe card or book, and AI will type it out for you below!</p>

                       <div className="pt-2">
                         <ImageUploader 
                           label="Take Photo / Upload"
                           onImageChange={async (url) => {
                             if (!url) return;
                             setIsScanning(true);
                             try {
                               const res = await base44.functions.invoke('scanRecipe', { file_url: url });
                               if (res.data?.content) {
                                 setFormData(prev => ({
                                   ...prev,
                                   title: prev.title || res.data.title || '',
                                   notes: (prev.notes ? prev.notes + '\n\n' : '') + res.data.content
                                 }));
                               }
                             } catch (e) {
                               console.error(e);
                               alert("Failed to scan recipe. Please try again.");
                             } finally {
                               setIsScanning(false);
                             }
                           }}
                           size="small"
                           aspectRatio="video"
                         />
                         {isScanning && (
                           <div className="flex items-center gap-2 mt-2 text-xs text-green-700 font-medium animate-pulse">
                             <ScanText className="w-4 h-4" /> Scanning recipe text...
                           </div>
                         )}
                       </div>
                     </div>
                   </div>
                 </div>
               )}
               <div>
                 <Label className="flex items-center gap-2">
                   Notes 
                   <span className="text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                     (Do not store passwords here)
                   </span>
                 </Label>
                 <Textarea 
                   value={formData.notes} 
                   onChange={(e) => setFormData({...formData, notes: e.target.value})}
                   placeholder="Add your notes here..."
                   className="min-h-[100px]"
                 />
               </div>
               {/* Tags field removed as requested */}
               
               <div>
                 <Label className="mb-2 block">Accent Color (Left Border)</Label>
                 <ColorPicker 
                   color={formData.color} 
                   onChange={(c) => setFormData({...formData, color: c})}
                   label="Accent Color"
                 />
               </div>
 
               <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border">
                 <div className="space-y-2">
                   <Label>Visibility</Label>
                   <Select 
                     value={formData.visibility || 'private'} 
                     onValueChange={(v) => setFormData({...formData, visibility: v})}
                   >
                     <SelectTrigger>
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent position="popper" className="z-[1000]">
                       <SelectItem value="private">
                         <div className="flex items-center gap-2">
                           <Lock className="w-4 h-4" /> Private
                         </div>
                       </SelectItem>
                       <SelectItem value="group">
                         <div className="flex items-center gap-2">
                           <Building className="w-4 h-4" /> Share to Group(s)
                         </div>
                       </SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
                 
                 {formData.visibility === 'group' && (
                   <div className="space-y-2">
                     <Label>Select Groups (Multi-select)</Label>
                     <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2 bg-white">
                       {myGroups.length > 0 ? (
                         myGroups.map(group => (
                           <div key={group.id} className="flex items-center space-x-2">
                             <Checkbox 
                               id={`group-${group.id}`}
                               checked={(formData.group_ids || []).includes(group.id)}
                               onCheckedChange={(checked) => {
                                 const currentIds = formData.group_ids || [];
                                 if (checked) {
                                   setFormData({...formData, group_ids: [...currentIds, group.id]});
                                 } else {
                                   setFormData({...formData, group_ids: currentIds.filter(id => id !== group.id)});
                                 }
                               }}
                             />
                             <Label htmlFor={`group-${group.id}`} className="text-sm font-normal cursor-pointer">
                               {group.name}
                             </Label>
                           </div>
                         ))
                       ) : (
                         <p className="text-sm text-gray-500">No groups found. Join or create a group first.</p>
                       )}
                     </div>
                   </div>
                 )}
               </div>

               <div className="flex items-center space-x-2 pt-2">
                 <Switch 
                   id="is-favorite" 
                   checked={formData.is_favorite} 
                   onCheckedChange={(checked) => setFormData({...formData, is_favorite: checked})} 
                 />
                 <Label htmlFor="is-favorite">Mark as Favorite</Label>
               </div>
             </div>
             <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between w-full">
                {editingItem ? (
                  <Button 
                    variant="destructive" 
                    type="button"
                    onClick={() => {
                      setIsAddOpen(false);
                      setResourceToDelete(editingItem);
                    }}
                    className="w-full sm:w-auto"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </Button>
                ) : (
                  <div /> /* Spacer */
                )}
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button onClick={() => saveMutation.mutate(formData)} disabled={saveMutation.isPending || !formData.title}>
                    {saveMutation.isPending ? 'Saving...' : 'Save Resource'}
                  </Button>
                </div>
             </DialogFooter>
           </DialogContent>
         </Dialog>
       </div>
     );
   }