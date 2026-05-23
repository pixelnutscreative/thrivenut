import React, { useState, useMemo, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { toast, Toaster as SonnerToaster } from 'sonner';
import { Plus, Search, Loader2, LayoutGrid, List as ListIcon, ChevronRight, ChevronDown, Paperclip, X, RefreshCw, ChevronLeft, Trash2, Eye, Settings, EyeOff, Brain, Link as LinkIcon, UploadCloud } from 'lucide-react';
import moment from 'moment';
import { useGlobalDialog } from '@/components/shared/GlobalDialogProvider';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const KANBAN_COLUMNS = [
  { id: '💬 New', label: '💬 New' },
  { id: '📦 Batch', label: '📦 Batch' },
  { id: '⚙️ Processing', label: '⚙️ Processing' },
  { id: '🧠 Thinking', label: '🧠 Thinking' },
  { id: '⏸️ On Hold', label: '⏸️ On Hold' },
  { id: '⏳ Needs GO', label: '⏳ Needs GO' },
  { id: '🧪 Needs Testing', label: '🧪 Needs Testing' },
  { id: '📬 My Inbox', label: '📬 My Inbox' },
  { id: '✅ Done', label: '🎉 ✅ Done' },
  { id: '➡️ Moved to Task', label: '➡️ Moved to Task' },
  { id: '🔁 Duplicate', label: '🔁 Duplicate' }
];

const priorityConfig = {
  'Urgent': { emoji: '🔥', color: 'bg-red-100 text-red-700' },
  'Normal': { emoji: '🔵', color: 'bg-[#24C4D6]/20 text-[#0D626C]' },
  'When You Get To It': { emoji: '⚪', color: 'bg-slate-100 text-slate-700' },
  'Critical': { emoji: '🔴', color: 'bg-red-100 text-red-700' },
  'High': { emoji: '🟠', color: 'bg-orange-100 text-orange-700' },
  'Medium': { emoji: '🟡', color: 'bg-yellow-100 text-yellow-700' },
  'Low': { emoji: '🟢', color: 'bg-green-100 text-green-700' }
};

const CATEGORIES = ["ThriveNut", "Personal", "Projects", "Pixel Tours", "Websites", "Offers", "AI Tools", "Social Media", "Other"];

const LOCATIONS = [
  "PixelBoard",
  "Groups > Feed",
  "Groups > Members",
  "Groups > Calendar",
  "Groups > Q&A",
  "Groups > Resources",
  "Groups > Requests (Support Tickets)",
  "Groups > Ask AI",
  "Groups > Navigation",
  "Groups > Settings",
  "Groups > Danger Zone",
  "Groups > Agency Group view",
  "Groups > Invite flow",
  "Creator Groups list page",
  "Social House Agency group view",
  "Onboarding modal (first login)",
  "User Profile",
  "Settings > Permissions",
  "Settings > Hourly Tracking",
  "Settings > Recruiters",
  "Admin Panel",
  "Home / Dashboard",
  "Other"
];

const mapStatus = (item) => {
  if (!item) return '💬 New';
  
  const isNikoleRead = item.nikole_read === true || item.nikole_read === 'true';
  if (!isNikoleRead && item.pixel_response && item.pixel_response.trim() !== '') {
    return '📬 My Inbox';
  }
  
  const s = item.status;
  if (!s || typeof s !== 'string') return '💬 New';
  if (['💬 New', '📦 Batch', '⚙️ Processing', '🧠 Thinking', '⏸️ On Hold', '⏳ Needs GO', '🧪 Needs Testing', '📬 My Inbox', '✅ Done', '➡️ Moved to Task', '🔁 Duplicate'].includes(s)) return s;
  
  if (s.includes('Done') || s === 'Reviewed') return '✅ Done';
  if (s.includes('Task')) return '➡️ Moved to Task';
  if (s.includes('Needs GO') || s === 'Answered') return '⏳ Needs GO';
  if (s === 'Batch' || s === 'Batched') return '📦 Batch';
  if (s.includes('Inbox')) return '📬 My Inbox';
  if (s.includes('Progress') || s.includes('Process')) return '⚙️ Processing';
  if (s.includes('Wait') || s.includes('Hold') || s === '⏸️ On Hold') return '⏸️ On Hold';
  if (s.includes('Think')) return '🧠 Thinking';
  if (s.includes('Duplicate')) return '🔁 Duplicate';
  if (s.includes('Testing') || s.includes('Test')) return '🧪 Needs Testing';
  
  return '💬 New';
};

const getTurnIndicator = (item) => {
  const s = mapStatus(item);
  if (s === '✅ Done' || s === '➡️ Moved to Task' || s === '⏸️ On Hold' || s === '🔁 Duplicate') return null;
  
  if (item.thread && item.thread.length > 0) {
      const lastMsg = item.thread[item.thread.length - 1];
      if (lastMsg.sender === 'nikole') return "Daisy's turn 🤖";
      return "Nikole's turn 🎯";
  }

  if (!item.pixel_response || item.pixel_response.trim() === '') return "Daisy's turn 🤖";
  if (item.pixel_read === false) return "Daisy's turn 🤖"; // Nikole just replied
  
  return "Nikole's turn 🎯"; // Default if pixel_response exists and Nikole hasn't replied yet
};

export default function PixelBoard() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const { confirm, prompt } = useGlobalDialog();
  const [loadingUser, setLoadingUser] = useState(true);
  
  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setLoadingUser(false);
    }).catch(() => setLoadingUser(false));
  }, []);

  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState(KANBAN_COLUMNS.filter(c => c.id !== '🔁 Duplicate').map(c => c.id));
  const { data: userPrefsList } = useQuery({
    queryKey: ['userPreferences', user?.email],
    queryFn: () => base44.entities.UserPreferences.filter({ user_email: user.email }),
    enabled: !!user?.email
  });
  const userPrefs = userPrefsList?.[0];
  const currentCategories = userPrefs?.custom_fields?.pixelboard_categories || CATEGORIES;

  const [visibleColumns, setVisibleColumns] = useState(KANBAN_COLUMNS.filter(c => c.id !== '🔁 Duplicate').map(c => c.id));
  
  useEffect(() => {
    if (userPrefs?.custom_fields?.pixelboard_columns) {
      setVisibleColumns(userPrefs.custom_fields.pixelboard_columns);
    }
  }, [userPrefs]);
  
  const updateColumnsMutation = useMutation({
    mutationFn: async (newCols) => {
      if (userPrefs?.id) {
        return base44.entities.UserPreferences.update(userPrefs.id, {
          custom_fields: { ...(userPrefs.custom_fields || {}), pixelboard_columns: newCols }
        });
      } else {
        return base44.entities.UserPreferences.create({
          user_email: user.email,
          custom_fields: { pixelboard_columns: newCols }
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
    }
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const newOrder = Array.from(visibleColumns);
    const [moved] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, moved);
    setVisibleColumns(newOrder);
    updateColumnsMutation.mutate(newOrder);
  };

  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [tempCategories, setTempCategories] = useState([]);
  const [squirrelModalOpen, setSquirrelModalOpen] = useState(false);
  const [isSquirrelLoading, setIsSquirrelLoading] = useState(false);
  const [squirrelProposal, setSquirrelProposal] = useState(null);

  const handleSquirrelAction = (textToAnalyze, contextTitle) => {
    setSquirrelModalOpen(true);
    setIsSquirrelLoading(false);
    setSquirrelProposal({
        title: "",
        details: textToAnalyze || ""
    });
  };
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDoneCollapsed, setIsDoneCollapsed] = useState(false);
  const [newResponse, setNewResponse] = useState('');
  const [newImages, setNewImages] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [isDraggingOverFile, setIsDraggingOverFile] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [promptDialog, setPromptDialog] = useState(null);
  const [duplicateFinderOpen, setDuplicateFinderOpen] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState([]);
  
  const fileInputRef = useRef(null);

  const customConfirm = (message, onConfirm) => {
    confirm(message, onConfirm, { variant: 'destructive', confirmText: 'Delete' });
  };

  const customPrompt = (message, onConfirm) => {
    prompt(message, '', onConfirm);
  };

  const findDuplicates = () => {
    const groups = [];
    const processed = new Set();
    
    // Simple fuzzy match by splitting words and checking overlap
    const getSimilarity = (s1, s2) => {
      if (!s1 || !s2) return 0;
      const w1 = s1.toLowerCase().split(/\s+/);
      const w2 = s2.toLowerCase().split(/\s+/);
      const intersection = w1.filter(w => w2.includes(w));
      return intersection.length / Math.min(w1.length, w2.length);
    };

    items.forEach(item1 => {
      if (processed.has(item1.id)) return;
      const similar = [item1];
      processed.add(item1.id);

      items.forEach(item2 => {
        if (!processed.has(item2.id)) {
          if (getSimilarity(item1.title, item2.title) > 0.7) {
            similar.push(item2);
            processed.add(item2.id);
          }
        }
      });

      if (similar.length > 1) {
        groups.push(similar);
      }
    });

    setDuplicateGroups(groups);
    setDuplicateFinderOpen(true);
  };
  
  const [newQuestion, setNewQuestion] = useState({
    title: '',
    details: '',
    category: 'Other',
    priority: 'Normal',
    card_color: '#24C4D6',
    urls: [],
    page_location: '',
    group_tag: '',
    card_type: '❓ Question',
    images: []
  });
  const [isNewQuestionUploading, setIsNewQuestionUploading] = useState(false);
  const newQuestionFileInputRef = useRef(null);

  const uploadImagesToNewQuestion = async (files) => {
    if (!files || files.length === 0) return;
    setIsNewQuestionUploading(true);
    try {
      let uploadedUrls = [];
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(file_url);
      }
      if (uploadedUrls.length > 0) {
        setNewQuestion(prev => ({ ...prev, images: [...(prev.images || []), ...uploadedUrls] }));
      }
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setIsNewQuestionUploading(false);
    }
  };

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['pixelBoard'],
    queryFn: () => base44.entities.PixelBoard.list('-created_date')
  });

  const saveCategoriesMutation = useMutation({
    mutationFn: async (newCategories) => {
      const prefsId = userPrefs?.id;
      if (!prefsId) {
        // Create prefs if they don't exist
        return base44.entities.UserPreferences.create({
          user_email: user.email,
          custom_fields: { pixelboard_categories: newCategories }
        });
      }
      return base44.entities.UserPreferences.update(prefsId, {
        custom_fields: { ...(userPrefs.custom_fields || {}), pixelboard_categories: newCategories }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
      setSettingsModalOpen(false);
      toast.success("Categories updated!");
    }
  });

  const sendToTaskMutation = useMutation({
    mutationFn: async (item) => {
      await base44.entities.Task.create({
        title: item.title,
        details: item.details || '',
        source: 'PixelBoard',
        status: 'To Do',
        category: item.category || 'Uncategorized'
      });
      return base44.entities.PixelBoard.update(item.id, { status: '➡️ Moved to Task' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pixelBoard'] });
      setSelectedItem(null);
      toast.success("Sent to Tasks!");
    },
    onError: (err) => {
      toast.error(`Failed to send to Task: ${err.message}`);
    }
  });

  const sendToCreatorTaskMutation = useMutation({
    mutationFn: async (item) => {
      await base44.entities.CreatorTask.create({
        title: item.title,
        details: item.details + `\n\nOriginal Ticket: /pixel-board?id=${item.id}`,
        source: 'PixelBoard',
        status_id: 'pending'
      });
      const newThreadMsg = {
        sender: 'system',
        message: 'Ticket sent to Creator Tasks successfully.',
        timestamp: new Date().toISOString()
      };
      return base44.entities.PixelBoard.update(item.id, { 
        status: '➡️ Moved to Task',
        thread: [...(item.thread || []), newThreadMsg]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pixelBoard'] });
      setSelectedItem(null);
      toast.success("Sent to CreatorTasks!");
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const { in_batch, page_location, group_tag, ...rest } = data;
      return base44.entities.PixelBoard.create({
        ...rest,
        status: in_batch ? '📦 Batch' : '💬 New',
        in_batch: !!in_batch,
        asked_by: 'Nikole',
        custom_fields: { page_location, group_tag }
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pixelBoard'] });
      setIsAskModalOpen(false);
      setNewQuestion({ title: '', details: '', category: 'Other', priority: 'Normal', card_color: '#24C4D6', urls: [], page_location: '', group_tag: '' });
      toast.success("Ticket created!", { style: { background: '#24C4D6', color: '#fff', border: 'none' } });
      return data;
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PixelBoard.update(id, data),
    onSuccess: (updatedItem) => {
      queryClient.invalidateQueries({ queryKey: ['pixelBoard'] });
      if (selectedItem && selectedItem.id === updatedItem.id) {
        setSelectedItem(updatedItem);
      }
    }
  });

  // Call the new backend function directly!
  const handleBulkDelete = async (ids) => {
    if (ids.length === 0) return;
    try {
      if (ids.length === 1) {
         await base44.functions.invoke('deletePixelBoardCard', { id: ids[0] });
      } else {
         await base44.functions.invoke('deletePixelBoardCards', { ids });
      }
      queryClient.invalidateQueries({ queryKey: ['pixelBoard'] });
      if (selectedItem && ids.includes(selectedItem.id)) {
        setSelectedItem(null);
      }
      toast.success(`Deleted ${ids.length} ticket(s)!`);
    } catch(err) {
      toast.error('Failed to delete tickets');
    }
  };

  const handleSendBatch = async () => {
    const batchedItems = items.filter(i => i.in_batch);
    if (batchedItems.length === 0) return;
    
    const loadingToastId = toast.loading("Sending batch...");
    try {
      await base44.functions.invoke('sendBatch', {});
      
      // Auto-update locally to prevent visual lag
      batchedItems.forEach(item => {
        updateMutation.mutate({ id: item.id, data: { in_batch: false, batch_ready: true, status: '⚙️ Processing' } });
      });

      queryClient.invalidateQueries({ queryKey: ['pixelBoard'] });
      toast.dismiss(loadingToastId);
      toast.success("Batch sent to Daisy! ✅");
    } catch (err) {
      console.error(err);
      toast.dismiss(loadingToastId);
      toast.error("❌ Something went wrong — try again");
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Hide duplicates from view if the column/status is not selected
      if (mapStatus(item) === '🔁 Duplicate' && !statusFilter.includes('🔁 Duplicate')) return false;

      if (searchQuery) {
         const q = searchQuery.toLowerCase();
         const matchTitle = item.title?.toLowerCase().includes(q);
         const matchDetails = item.details?.toLowerCase().includes(q);
         if (!matchTitle && !matchDetails) return false;
      }
      
      if (categoryFilter !== 'All' && item.category !== categoryFilter) return false;
      if (priorityFilter !== 'All' && item.priority !== priorityFilter) return false;
      
      if (!statusFilter.includes(mapStatus(item))) return false;
      return true;
    }).sort((a, b) => new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date));
  }, [items, searchQuery, categoryFilter, priorityFilter, statusFilter]);

  const getRealColCount = (colId) => {
    return items.filter(item => {
      if (searchQuery) {
         const q = searchQuery.toLowerCase();
         const matchTitle = item.title?.toLowerCase().includes(q);
         const matchDetails = item.details?.toLowerCase().includes(q);
         if (!matchTitle && !matchDetails) return false;
      }
      if (categoryFilter !== 'All' && item.category !== categoryFilter) return false;
      if (priorityFilter !== 'All' && item.priority !== priorityFilter) return false;
      return mapStatus(item) === colId;
    }).length;
  };

  // customConfirm and customPrompt have been moved to GlobalDialogProvider
  const { confirm: confirmGlobal, prompt: promptGlobal } = useGlobalDialog();

  const handleAskSubmit = (inBatch = false) => {
    if (!newQuestion.title) return;
    const { images, ...rest } = newQuestion;
    createMutation.mutate({ 
      ...rest, 
      in_batch: inBatch,
      attachment_url: images && images.length > 0 ? images.join(',') : ''
    });
  };

  const uploadFilesFromEvent = async (files) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    let uploadedUrls = [];
    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        uploadedUrls.push(file_url);
      }
      if (uploadedUrls.length > 0) {
        setNewImages(prev => [...prev, ...uploadedUrls]);
      }
    } catch (error) {
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const getAttachments = (url) => {
    if (!url) return [];
    if (url.includes(',')) return url.split(',').map(u => u.trim()).filter(Boolean);
    return [url];
  };

  const handleSendResponse = () => {
    if ((!newResponse.trim() && newImages.length === 0) || !selectedItem) return;
    
    const messageText = newResponse.trim();
    let currentThread = selectedItem.thread || [];
    
    // Migration of old responses if thread is empty
    if (currentThread.length === 0 && (selectedItem.nikole_response || selectedItem.pixel_response)) {
      if (selectedItem.nikole_response) {
        currentThread.push({ sender: 'nikole', message: selectedItem.nikole_response, timestamp: selectedItem.created_date });
      }
      if (selectedItem.pixel_response) {
        currentThread.push({ sender: 'daisy', message: selectedItem.pixel_response, timestamp: selectedItem.updated_date || selectedItem.created_date });
      }
      currentThread.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }
    
    const newMessage = {
      sender: 'nikole',
      message: messageText,
      image_urls: newImages,
      timestamp: new Date().toISOString()
    };
    
    let newThread = [...currentThread, newMessage];
    let updates = { nikole_read: true, pixel_read: false };
    
    // Auto-update status
    if (['⏳ Needs GO'].includes(mapStatus(selectedItem))) {
      updates.status = '⚙️ Processing';
    }
    
    // Auto-Squirrel disabled. Now triggered manually via "Squirrel This" button.
    
    updates.thread = newThread;
    
    updateMutation.mutate({ 
      id: selectedItem.id, 
      data: updates 
    });
    setNewResponse('');
    setNewImages([]);
  };

  const updateStatus = (id, newStatus) => {
    updateMutation.mutate({ id, data: { status: newStatus } });
  };

  const TicketCard = ({ item }) => {
    const s = mapStatus(item);
    const isDone = s === '✅ Done' || s === '➡️ Moved to Task' || s === '🔁 Duplicate';
    const turn = getTurnIndicator(item);
    const pConf = priorityConfig[item.priority] || priorityConfig['Normal'];
    const isUrgent = item.priority === 'Urgent';
    const isDaisyInit = item.asked_by === 'Daisy' || item.asked_by === 'Pixel Poster';
    const borderColor = isDaisyInit ? '#A8E6E6' : '#ffffff';

    let lastResponseText = null;
    if (item.thread && item.thread.length > 0) {
      lastResponseText = `Last reply ${moment(item.thread[item.thread.length - 1].timestamp).fromNow()}`;
    } else if (item.pixel_response || item.nikole_response) {
      lastResponseText = `Last reply ${moment(item.updated_date).fromNow()}`;
    }
    
    const hasMention = useMemo(() => {
      const th = item.thread || [];
      const text = th.filter(m => m.sender === 'nikole').map(m => m.message).join(' ') + ' ' + (item.nikole_response || '');
      return /@\w+/.test(text) || /\b(Naomi|Suzy|Carlos|Gwen)\b/i.test(text);
    }, [item.thread, item.nikole_response]);

    return (
      <Card 
        onClick={() => {
          setSelectedItem(item);
          if (item.nikole_read === false) {
            updateMutation.mutate({ id: item.id, data: { nikole_read: true } });
          }
        }}
        className={`cursor-pointer transition-all duration-200 border-2 min-h-[120px] w-full ${isDone ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-white border-slate-200 hover:border-[#24C4D6]/50 hover:shadow-md'} overflow-hidden relative ${isUrgent && !isDone ? 'ring-2 ring-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : ''}`}
        style={{ borderLeftColor: !isDone ? (isUrgent ? '#EF4444' : borderColor) : undefined, borderLeftWidth: !isDone ? '8px' : undefined }}
      >
        <CardContent className="p-4 flex flex-col gap-3 w-full">
          <div className="flex justify-between items-start gap-2">
            <h4 className={`font-bold text-[15px] ${isDone ? 'line-through text-slate-500' : 'text-slate-800'} leading-tight break-words whitespace-normal min-w-0 flex-1 block`}>{item.title || 'Untitled Ticket'}</h4>
            {hasMention && !isDone && <div className="text-lg" title="Involves external person">👤</div>}
          </div>
          
          {!isDone && (
            <>
              <div className="flex flex-wrap gap-1.5 items-center">
                <Badge variant="secondary" className="text-[11px] bg-slate-100 text-slate-600 hover:bg-slate-200" title={`Asked by ${isDaisyInit ? 'Daisy' : 'Nikole'}`}>
                  {isDaisyInit ? '🤖' : '📝'}
                </Badge>
            <Badge variant="secondary" className="text-[11px] bg-slate-100 text-slate-600 hover:bg-slate-200">{item.category}</Badge>
            {item.custom_fields?.page_location && (
              <Badge variant="secondary" className="text-[11px] bg-indigo-50 text-indigo-600 hover:bg-indigo-100" title="Page / Location">
                📍 {item.custom_fields.page_location}
              </Badge>
            )}
            {item.custom_fields?.group_tag && (
              <Badge variant="secondary" className="text-[11px] bg-pink-50 text-pink-600 hover:bg-pink-100" title="Group Name">
                👥 {item.custom_fields.group_tag}
              </Badge>
            )}
            <Badge variant="outline" className={`text-[11px] ${pConf.color} border-0`}>{pConf.emoji} {item.priority}</Badge>
            {item.card_type && (
              <Badge variant="secondary" className="text-[11px] bg-blue-50 text-blue-600 border-0">{item.card_type}</Badge>
            )}
            {item.in_batch && <Badge variant="secondary" className="text-[11px] bg-slate-800 text-white border-0">📦 In Batch</Badge>}
            {s !== '💬 New' && s !== '📬 My Inbox' && s !== '📦 Batch' && <Badge variant="outline" className="text-[11px] bg-white border-slate-200 text-slate-500">{s}</Badge>}
          </div>
          
          {!isDone && (item.attachment_url || item.nikole_attachment_url || (item.thread && item.thread.some(m => m.image_urls?.length > 0 || m.image_url))) && (
            <div className="flex gap-1 overflow-hidden mt-1 h-12">
              {[...getAttachments(item.attachment_url), ...getAttachments(item.nikole_attachment_url), ...(item.thread || []).flatMap(m => m.image_urls || (m.image_url ? [m.image_url] : []))].filter(Boolean).slice(0, 4).map((url, i) => (
                <img key={i} src={url} className="h-full w-auto max-w-[60px] object-cover rounded border border-slate-200" alt="attachment thumbnail" />
              ))}
            </div>
          )}
          
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
            <span>Created {moment(item.created_date).format('MMM D')}</span>
            {lastResponseText && <span>• {lastResponseText}</span>}
          </div>

          {item.pixel_response && (
            <div className="mt-2 bg-[#24C4D6]/10 border border-[#24C4D6]/30 p-2.5 rounded-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#24C4D6]"></div>
              <span className="text-[10px] font-bold text-[#0D626C] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Brain className="w-3 h-3" /> 💬 Daisy's Response
              </span>
              <p className="text-xs text-[#0D626C] line-clamp-3 leading-snug break-words">
                {item.pixel_response}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2 mt-2">
            {s === '📬 My Inbox' && (
              <Button 
                size="lg"
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold text-sm shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  updateStatus(item.id, '✅ Done');
                  toast.success('Marked as Done!', { style: { background: '#24C4D6', color: '#fff', border: 'none' } });
                }}
              >
                ✅ Mark Done
              </Button>
            )}

            <div className="flex items-center justify-between mt-1">
              {turn && !isDone ? (
                <div className={`text-[11px] font-medium px-2 py-1 rounded-md inline-flex items-center w-fit ${turn.includes('Nikole') ? 'bg-[#24C4D6] text-white' : 'bg-[#A8E6E6] text-[#0D626C]'}`}>
                  {turn}
                </div>
              ) : <div />}
              
              {!isDone && (
                <Button 
                  size="sm" 
                  variant={item.in_batch ? 'default' : 'outline'}
                className={`h-7 px-2 text-[10px] font-bold z-10 ${item.in_batch ? 'bg-slate-700 hover:bg-slate-800 text-white border-0' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!item.in_batch) {
                    updateMutation.mutate({ id: item.id, data: { in_batch: true, status: '📦 Batch' } });
                    toast.success('Added to batch!');
                  } else {
                    updateMutation.mutate({ id: item.id, data: { in_batch: false, status: '💬 New' } });
                    toast.success('Removed from batch!');
                  }
                }}
              >
                {item.in_batch ? '✓ In Batch' : '+ Add to Batch'}
              </Button>
            )}
          </div>
          </div>
          </>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loadingUser) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#24C4D6]" /></div>;
  if (user?.role !== 'admin') return <div className="p-12 text-center"><h2 className="text-2xl font-bold text-red-500">Access Denied</h2><p>This is an admin-only page.</p></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <style>{`.sm\\:max-w-\\[900px\\] > button.absolute.right-4.top-4 { display: none !important; }`}</style>
      <SonnerToaster position="top-center" richColors />
      <div className="w-full mx-auto space-y-6">
        <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-800">Categories Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current Categories</Label>
                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {tempCategories.map((c, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input 
                        value={c} 
                        onChange={(e) => {
                          const newCats = [...tempCategories];
                          newCats[idx] = e.target.value;
                          setTempCategories(newCats);
                        }}
                        className="h-8 border-slate-200 focus-visible:ring-[#24C4D6]"
                      />
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600 shrink-0"
                        onClick={() => {
                          setTempCategories(tempCategories.filter((_, i) => i !== idx));
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    className="w-full h-8 border-dashed border-slate-300 text-slate-500"
                    onClick={() => setTempCategories([...tempCategories, 'New Category'])}
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Category
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setSettingsModalOpen(false)}>Cancel</Button>
              <Button 
                onClick={() => saveCategoriesMutation.mutate(tempCategories)} 
                disabled={saveCategoriesMutation.isPending}
                className="bg-slate-800 hover:bg-slate-900 text-white"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <span className="text-[#24C4D6]">#</span> PixelBoard
            </h1>
            <p className="text-slate-500 mt-1 font-medium">Ticket system & chat with Daisy</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {items.filter(i => i.in_batch).length > 0 && (
              <div className="flex items-center gap-3 bg-[#24C4D6]/10 px-4 py-2 rounded-lg border-2 border-[#24C4D6]/20 mr-2">
                <span className="font-bold text-[#0D626C]">📦 {items.filter(i => i.in_batch).length} cards in batch</span>
                <Button 
                  onClick={handleSendBatch}
                  className="bg-[#24C4D6] hover:bg-[#1db0c0] text-white font-bold shadow-md hover:shadow-lg transition-all"
                >
                  🚀 SEND IT
                </Button>
              </div>
            )}
            
            <Button 
              variant="outline" 
              className="border-2 border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold"
              onClick={findDuplicates}
            >
              🔍 Find Duplicates
            </Button>

            <div className="relative w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input 
                placeholder="Search board..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 border-2 border-slate-200 h-10 font-medium placeholder:font-normal focus-visible:ring-[#24C4D6]"
              />
            </div>

            <Button 
              variant="outline"
              className="border-2 border-slate-200 text-slate-600 hover:bg-slate-100 font-bold"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ['pixelBoard'] });
                toast.success("Board Refreshed!");
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px] border-2 border-slate-200 font-medium">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[160px] border-2 border-slate-200 font-medium justify-between px-3 text-slate-700 bg-white hover:bg-slate-50">
                  {statusFilter.length === KANBAN_COLUMNS.length ? 'All Statuses' : `${statusFilter.length} Selected`}
                  <ChevronDown className="w-4 h-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-2" align="start">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 px-2 py-1.5 hover:bg-slate-100 rounded-md">
                    <Checkbox 
                      id="status-all"
                      checked={statusFilter.length === KANBAN_COLUMNS.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setStatusFilter(KANBAN_COLUMNS.map(c => c.id));
                        } else {
                          setStatusFilter([]);
                        }
                      }}
                    />
                    <label htmlFor="status-all" className="text-sm font-bold leading-none cursor-pointer flex-1">
                      All Statuses
                    </label>
                  </div>
                  <div className="h-px bg-slate-200 my-1"></div>
                  {KANBAN_COLUMNS.map(c => (
                    <div key={c.id} className="flex items-center space-x-2 px-2 py-1.5 hover:bg-slate-100 rounded-md">
                      <Checkbox 
                        id={`status-${c.id}`}
                        checked={statusFilter.includes(c.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setStatusFilter([...statusFilter, c.id]);
                          } else {
                            setStatusFilter(statusFilter.filter(id => id !== c.id));
                          }
                        }}
                      />
                      <label htmlFor={`status-${c.id}`} className="text-sm font-medium leading-none cursor-pointer flex-1">
                        {c.label}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="border-2 border-slate-200 text-slate-600 hover:bg-slate-100">
                  {visibleColumns.length === KANBAN_COLUMNS.length ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-amber-500" />}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[240px] p-2" align="end">
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Columns</span>
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2 text-[#24C4D6]" onClick={() => setVisibleColumns(KANBAN_COLUMNS.map(c => c.id))}>Restore All</Button>
                  </div>
                  <div className="h-px bg-slate-200"></div>
                  {KANBAN_COLUMNS.map(c => (
                    <div key={c.id} className="flex items-center space-x-2 px-2 py-1 hover:bg-slate-50 rounded-md">
                      <Checkbox 
                        id={`col-${c.id}`}
                        checked={visibleColumns.includes(c.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setVisibleColumns([...visibleColumns, c.id]);
                          } else {
                            setVisibleColumns(visibleColumns.filter(id => id !== c.id));
                          }
                        }}
                      />
                      <label htmlFor={`col-${c.id}`} className="text-sm font-medium cursor-pointer flex-1 select-none">
                        {c.label}
                      </label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            
            <Button variant="outline" size="icon" className="border-2 border-slate-200 text-slate-600 hover:bg-slate-100" onClick={() => {
              setTempCategories([...currentCategories]);
              setSettingsModalOpen(true);
            }}>
              <Settings className="w-4 h-4" />
            </Button>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px] border-2 border-slate-200 font-medium">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Priorities</SelectItem>
                <SelectItem value="Urgent">🔥 Urgent</SelectItem>
                <SelectItem value="Critical">🔴 Critical</SelectItem>
                <SelectItem value="High">🟠 High</SelectItem>
                <SelectItem value="Normal">🔵 Normal</SelectItem>
                <SelectItem value="Medium">🟡 Medium</SelectItem>
                <SelectItem value="Low">🟢 Low</SelectItem>
                <SelectItem value="When You Get To It">⚪ When You Get To It</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex bg-slate-100 rounded-lg p-1 border-2 border-slate-200">
              <Button size="sm" variant={viewMode === 'kanban' ? 'default' : 'ghost'} onClick={() => setViewMode('kanban')} className={viewMode === 'kanban' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}>
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button size="sm" variant={viewMode === 'list' ? 'default' : 'ghost'} onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}>
                <ListIcon className="w-4 h-4" />
              </Button>
            </div>

            <Dialog open={isAskModalOpen} onOpenChange={setIsAskModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#24C4D6] hover:bg-[#1db0c0] text-white font-bold shadow-md hover:shadow-lg transition-all border-2 border-[#24C4D6]">
                  <Plus className="w-4 h-4 mr-2" /> New Item
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-slate-800">Create Item</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Title</Label>
                    <Input placeholder="What needs doing?" value={newQuestion.title} onChange={e => setNewQuestion({...newQuestion, title: e.target.value})} className="border-2 border-slate-200 focus-visible:ring-[#24C4D6]" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Details</Label>
                    <Textarea placeholder="Provide context..." value={newQuestion.details} onChange={e => setNewQuestion({...newQuestion, details: e.target.value})} className="min-h-[100px] border-2 border-slate-200 focus-visible:ring-[#24C4D6]" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">URLs</Label>
                    <div className="space-y-2">
                      {newQuestion.urls.map((url, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Input 
                            value={url} 
                            onChange={e => {
                              const newUrls = [...newQuestion.urls];
                              newUrls[idx] = e.target.value;
                              setNewQuestion({...newQuestion, urls: newUrls});
                            }} 
                            placeholder="https://..." 
                            className="border-2 border-slate-200 focus-visible:ring-[#24C4D6]" 
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="shrink-0 text-slate-400 hover:text-red-500 hover:bg-red-50"
                            onClick={() => {
                              const newUrls = [...newQuestion.urls];
                              newUrls.splice(idx, 1);
                              setNewQuestion({...newQuestion, urls: newUrls});
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-full border-dashed border-2 border-slate-200 text-slate-500"
                        onClick={() => setNewQuestion({...newQuestion, urls: [...newQuestion.urls, '']})}
                      >
                        <Plus className="w-4 h-4 mr-2" /> Add URL
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-2">
                      <Label className="font-bold text-slate-700">Page / Location</Label>
                      <Input list="locations-list" placeholder="Search or type custom location..." value={newQuestion.page_location || ''} onChange={e => setNewQuestion({...newQuestion, page_location: e.target.value})} className="border-2 border-slate-200 focus-visible:ring-[#24C4D6]" />
                      <datalist id="locations-list">
                        {LOCATIONS.map(loc => <option key={loc} value={loc} />)}
                      </datalist>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label className="font-bold text-slate-700">Group Name</Label>
                      <Input placeholder="Which ThriveNut group does this apply to?" value={newQuestion.group_tag || ''} onChange={e => setNewQuestion({...newQuestion, group_tag: e.target.value})} className="border-2 border-slate-200 focus-visible:ring-[#24C4D6]" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Category</Label>
                      <Select value={newQuestion.category} onValueChange={v => setNewQuestion({...newQuestion, category: v})}>
                        <SelectTrigger className="border-2 border-slate-200"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {currentCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Priority</Label>
                      <Select value={newQuestion.priority} onValueChange={v => setNewQuestion({...newQuestion, priority: v})}>
                        <SelectTrigger className="border-2 border-slate-200"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="When You Get To It">⚪ When You Get To It</SelectItem>
                          <SelectItem value="Normal">🔵 Normal</SelectItem>
                          <SelectItem value="Medium">🟡 Medium</SelectItem>
                          <SelectItem value="High">🟠 High</SelectItem>
                          <SelectItem value="Critical">🔴 Critical</SelectItem>
                          <SelectItem value="Urgent">🔥 Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label className="font-bold text-slate-700">Images</Label>
                      <div className="flex items-center gap-2 flex-wrap">
                        {newQuestion.images?.map((url, i) => (
                          <div key={i} className="relative inline-block">
                            <img src={url} alt="Upload preview" className="h-12 w-12 rounded-md border border-slate-200 object-cover" />
                            <button 
                              onClick={() => setNewQuestion(prev => ({ ...prev, images: prev.images.filter((_, index) => index !== i) }))}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-sm"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <div>
                          <input 
                            type="file" 
                            id="new-question-attachment"
                            className="hidden" 
                            accept="image/png, image/jpeg, image/gif, image/webp"
                            onChange={(e) => uploadImagesToNewQuestion(e.target.files)}
                            multiple
                          />
                          <Button variant="outline" size="sm" className="h-12 text-[10px]" disabled={isNewQuestionUploading} onClick={() => document.getElementById('new-question-attachment').click()}>
                            {isNewQuestionUploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Paperclip className="w-4 h-4 mr-1" />} Add
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 col-span-2">
                      <Label className="font-bold text-slate-700">Card Type</Label>
                      <Select value={newQuestion.card_type} onValueChange={v => setNewQuestion({...newQuestion, card_type: v})}>
                        <SelectTrigger className="border-2 border-slate-200"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="🐛 Bug">🐛 Bug</SelectItem>
                          <SelectItem value="❓ Question">❓ Question</SelectItem>
                          <SelectItem value="💡 Feature Request">💡 Feature Request</SelectItem>
                          <SelectItem value="💬 Idea to Discuss">💬 Idea to Discuss</SelectItem>
                          <SelectItem value="✅ Task">✅ Task</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Card Color Accent</Label>
                    <div className="flex gap-2">
                      {['#24C4D6', '#C8A4F2', '#F472B6', '#FBBF24', '#34D399', '#94A3B8'].map(color => (
                        <button key={color} onClick={() => setNewQuestion({...newQuestion, card_color: color})} className={`w-8 h-8 rounded-full border-2 ${newQuestion.card_color === color ? 'border-slate-800 scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0 sm:justify-end">
                  <Button variant="outline" className="border-2 border-slate-200" onClick={() => setIsAskModalOpen(false)}>Cancel</Button>
                  <Button onClick={() => handleAskSubmit(false)} disabled={!newQuestion.title || createMutation.isPending} className="bg-slate-800 hover:bg-slate-900 text-white font-bold">
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />} Create
                  </Button>
                  <Button onClick={() => handleAskSubmit(true)} disabled={!newQuestion.title || createMutation.isPending} className="bg-[#24C4D6] hover:bg-[#1db0c0] text-white font-bold">
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />} Save & Add to Batch
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Board / List View */}
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#24C4D6]" /></div>
        ) : viewMode === 'kanban' ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="board" direction="horizontal" type="COLUMN">
              {(provided) => (
                <div 
                  className="flex gap-6 overflow-x-auto pb-4 snap-x"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {visibleColumns.map((colId, index) => {
                    const col = KANBAN_COLUMNS.find(c => c.id === colId);
                    if (!col) return null;
                    
                    const colItems = filteredItems.filter(item => mapStatus(item) === col.id);
                    const realCount = getRealColCount(col.id);
                    
                    if (col.id === '✅ Done' && isDoneCollapsed) {
                      return (
                        <Draggable key={col.id} draggableId={col.id} index={index}>
                          {(provided) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="min-w-[60px] max-w-[60px] bg-slate-100/50 rounded-2xl border-2 border-slate-200 border-dashed flex flex-col items-center py-4 cursor-pointer hover:bg-slate-100 transition-colors" 
                              onClick={() => setIsDoneCollapsed(false)}
                            >
                              <div {...provided.dragHandleProps} className="w-full flex justify-center py-2 -mt-4 cursor-grab text-slate-300 hover:text-slate-500">
                                <LayoutGrid className="w-4 h-4" />
                              </div>
                              <div className="rotate-90 whitespace-nowrap font-bold text-slate-500 mt-10 tracking-widest uppercase">{col.label} ({realCount})</div>
                            </div>
                          )}
                        </Draggable>
                      );
                    }

                    return (
                      <Draggable key={col.id} draggableId={col.id} index={index}>
                        {(provided) => (
                          <div 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`min-w-[220px] max-w-[220px] w-[220px] flex flex-col gap-3 snap-start ${col.id === '🧪 Needs Testing' ? 'bg-amber-50/50 p-2 rounded-xl border border-amber-100' : ''} ${col.id === '📬 My Inbox' ? 'bg-teal-50/30 p-2 rounded-xl border border-teal-100' : ''}`}
                          >
                            <div className="flex items-center justify-between pb-2 border-b-2 border-slate-200 group">
                              <div className="flex items-center gap-2">
                                <div {...provided.dragHandleProps} className="cursor-grab opacity-50 hover:opacity-100 text-slate-400">
                                  <LayoutGrid className="w-4 h-4" />
                                </div>
                                <h3 className="font-bold text-slate-700">{col.label}</h3>
                              </div>
                              <Badge variant="secondary" className="bg-slate-200 text-slate-600 border-0">{realCount}</Badge>
                            </div>
                            {col.id === '✅ Done' && (
                              <Button variant="ghost" size="sm" className="w-full text-xs text-slate-500 -mt-2" onClick={() => setIsDoneCollapsed(true)}>Minimize</Button>
                            )}
                            <div className="flex flex-col gap-3 overflow-y-auto max-h-[70vh] custom-scrollbar pr-1 pb-4">
                              {colItems.map(item => <TicketCard key={item.id} item={item} />)}
                              {colItems.length === 0 && <div className="text-sm text-slate-400 text-center py-6 border-2 border-dashed border-slate-200 rounded-xl">Empty</div>}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        ) : (
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 font-bold text-slate-500 border-b-2 border-slate-100 text-sm">
              <div className="col-span-5">Title</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-2">Priority</div>
              <div className="col-span-1">Turn</div>
            </div>
            <div className="flex flex-col">
              {filteredItems.map(item => {
                const s = mapStatus(item);
                const turn = getTurnIndicator(item);
                const pConf = priorityConfig[item.priority] || priorityConfig['Normal'];
                return (
                  <div key={item.id} onClick={() => setSelectedItem(item)} className="grid grid-cols-12 gap-4 p-4 items-center border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                    <div className="col-span-5 font-bold text-slate-800 truncate pr-4">{item.title}</div>
                    <div className="col-span-2"><Badge variant="outline" className="border-slate-200 bg-white text-slate-600">{s}</Badge></div>
                    <div className="col-span-2"><Badge variant="secondary" className="bg-slate-100 text-slate-600">{item.category}</Badge></div>
                    <div className="col-span-2"><span className="text-sm">{pConf.emoji} {item.priority}</span></div>
                    <div className="col-span-1 text-sm font-medium text-slate-500">{turn ? turn.split(' ')[0] : '-'}</div>
                  </div>
                );
              })}
              {filteredItems.length === 0 && <div className="p-8 text-center text-slate-500">No tickets found.</div>}
            </div>
          </div>
        )}

        {/* Thread Panel Modal */}
        <Dialog open={!!selectedItem} onOpenChange={(open) => {
          if (!open) {
            setSelectedItem(null);
          }
        }}>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col p-0 bg-slate-50">
            {selectedItem && (
              <div className="flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="p-4 bg-white border-b border-slate-200 flex-shrink-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <Input 
                      className="text-xl font-bold text-slate-800 leading-tight border-transparent hover:border-slate-300 focus:border-[#24C4D6] px-2 -ml-2 bg-transparent h-auto py-1 w-full"
                      defaultValue={selectedItem.title}
                      onBlur={(e) => {
                        if (e.target.value !== selectedItem.title && e.target.value.trim()) {
                          updateMutation.mutate({ id: selectedItem.id, data: { title: e.target.value.trim() } });
                        }
                      }}
                    />
                    <div className="flex items-center gap-2 flex-shrink-0 pr-6">
                      <Button 
                        size="sm"
                        variant={selectedItem.in_batch ? 'default' : 'outline'}
                        className={`h-8 font-bold flex-shrink-0 ${selectedItem.in_batch ? 'bg-slate-700 hover:bg-slate-800 text-white border-0' : 'border-slate-300 text-slate-600 hover:bg-slate-100'}`}
                        onClick={() => {
                          if (!selectedItem.in_batch) {
                            updateMutation.mutate({ id: selectedItem.id, data: { in_batch: true, status: '📦 Batch' } });
                            toast.success('Added to batch!');
                          } else {
                            updateMutation.mutate({ id: selectedItem.id, data: { in_batch: false, status: '💬 New' } });
                            toast.success('Removed from batch!');
                          }
                          setSelectedItem(null);
                        }}
                      >
                        {selectedItem.in_batch ? '✓ In Batch' : '+ Add to Batch'}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 border-slate-200 text-slate-600 hover:bg-slate-100" 
                        onClick={() => setSelectedItem(null)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        size="sm" 
                        variant="default" 
                        className="h-8 bg-slate-800 hover:bg-slate-900 text-white font-bold" 
                        onClick={() => setSelectedItem(null)}
                      >
                        Save & Close
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-2 items-center">
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-500">Status</Label>
                      <Select value={mapStatus(selectedItem)} onValueChange={(v) => updateStatus(selectedItem.id, v)}>
                        <SelectTrigger className="w-full border-2 border-slate-200 bg-white font-bold h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {KANBAN_COLUMNS.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-500">Priority</Label>
                      <Select value={selectedItem.priority || 'Normal'} onValueChange={(v) => updateMutation.mutate({ id: selectedItem.id, data: { priority: v } })}>
                        <SelectTrigger className="w-full border-2 border-slate-200 bg-white font-bold h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="When You Get To It">⚪ When You Get To It</SelectItem>
                          <SelectItem value="Normal">🔵 Normal</SelectItem>
                          <SelectItem value="Medium">🟡 Medium</SelectItem>
                          <SelectItem value="High">🟠 High</SelectItem>
                          <SelectItem value="Critical">🔴 Critical</SelectItem>
                          <SelectItem value="Urgent">🔥 Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-500">Category</Label>
                      <Select value={selectedItem.category || 'Other'} onValueChange={(v) => updateMutation.mutate({ id: selectedItem.id, data: { category: v } })}>
                        <SelectTrigger className="w-full border-2 border-slate-200 bg-white font-bold h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currentCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-500">Card Color</Label>
                      <div className="flex gap-1 h-9 items-center">
                        {['#ffffff', '#24C4D6', '#C8A4F2', '#F472B6', '#FBBF24', '#34D399'].map(color => (
                          <button 
                            key={color} 
                            onClick={() => updateMutation.mutate({ id: selectedItem.id, data: { card_color: color } })} 
                            className={`w-6 h-6 rounded-full border-2 ${selectedItem.card_color === color ? 'border-slate-800 scale-110' : 'border-slate-300'}`} 
                            style={{ backgroundColor: color }} 
                          />
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-500">Page / Location</Label>
                      <Input 
                        list="edit-locations-list"
                        value={selectedItem.custom_fields?.page_location || ''} 
                        onChange={(e) => updateMutation.mutate({ id: selectedItem.id, data: { custom_fields: { ...selectedItem.custom_fields, page_location: e.target.value } } })}
                        className="w-full border-2 border-slate-200 bg-white h-9 text-xs" 
                        placeholder="Search or type..."
                      />
                      <datalist id="edit-locations-list">
                        {LOCATIONS.map(loc => <option key={loc} value={loc} />)}
                      </datalist>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-bold text-slate-500">Group Name</Label>
                      <Input 
                        value={selectedItem.custom_fields?.group_tag || ''} 
                        onChange={(e) => updateMutation.mutate({ id: selectedItem.id, data: { custom_fields: { ...selectedItem.custom_fields, group_tag: e.target.value } } })}
                        className="w-full border-2 border-slate-200 bg-white h-9 text-xs" 
                        placeholder="Which group?"
                      />
                    </div>
                  </div>
                  
                  {mapStatus(selectedItem) === '📬 My Inbox' && (
                    <Button 
                      size="lg"
                      className="w-full mt-3 bg-green-500 hover:bg-green-600 text-white font-bold shadow-md"
                      onClick={() => {
                        updateStatus(selectedItem.id, '✅ Done');
                        toast.success('Marked as Done!', { style: { background: '#24C4D6', color: '#fff', border: 'none' } });
                        setSelectedItem(null);
                      }}
                    >
                      ✅ Mark Done
                    </Button>
                  )}
                  
                  {/* Inline URLs editor */}
                  <div className="mt-3 space-y-2 max-h-[80px] overflow-y-auto custom-scrollbar">
                     <div className="flex flex-wrap gap-2 items-center">
                        {(selectedItem.urls || []).map((url, idx) => (
                           <div key={idx} className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-md p-1 overflow-hidden max-w-full">
                              <Input 
                                value={url} 
                                onChange={e => {
                                  const newUrls = [...(selectedItem.urls || [])];
                                  newUrls[idx] = e.target.value;
                                  updateMutation.mutate({ id: selectedItem.id, data: { urls: newUrls } });
                                  setSelectedItem(prev => ({...prev, urls: newUrls}));
                                }}
                                className="h-6 text-xs w-[200px] border-none bg-transparent"
                              />
                              <Button size="sm" variant="default" className="h-6 text-[10px] px-2 font-bold text-white bg-[#24C4D6] hover:bg-[#1db0c0]" onClick={() => window.open(url, '_blank')}>
                                Open ↗
                              </Button>
                              <button onClick={() => {
                                 const newUrls = [...(selectedItem.urls || [])];
                                 newUrls.splice(idx, 1);
                                 updateMutation.mutate({ id: selectedItem.id, data: { urls: newUrls } });
                                 setSelectedItem(prev => ({...prev, urls: newUrls}));
                              }} className="text-slate-400 hover:text-red-500 p-1">
                                 <X className="w-3 h-3" />
                              </button>
                           </div>
                        ))}
                        <Button 
                           variant="outline" 
                           size="sm" 
                           className="h-7 text-[10px] border-dashed text-slate-500"
                           onClick={() => {
                              customPrompt("Enter URL:", (newUrl) => {
                                if (newUrl && newUrl.trim()) {
                                  const newUrls = [...(selectedItem.urls || []), newUrl.trim()];
                                  updateMutation.mutate({ id: selectedItem.id, data: { urls: newUrls } });
                                  setSelectedItem(prev => ({...prev, urls: newUrls}));
                                }
                              });
                           }}
                        >
                           <Plus className="w-3 h-3 mr-1" /> Add URL
                        </Button>
                     </div>
                  </div>
                </div>

                {/* Body (Scrollable) */}
                <div 
                  className={`flex-1 px-4 py-2 space-y-2 overflow-y-auto relative ${isDraggingOverFile ? 'bg-blue-50/50' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingOverFile(true);
                  }}
                  onDragLeave={() => setIsDraggingOverFile(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingOverFile(false);
                    uploadFilesFromEvent(e.dataTransfer.files);
                  }}
                >
                  {isDraggingOverFile && (
                    <div className="absolute inset-0 z-50 bg-blue-500/10 border-4 border-blue-500 border-dashed rounded-xl flex items-center justify-center pointer-events-none">
                      <div className="bg-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 font-bold text-blue-600">
                        <UploadCloud className="w-6 h-6 animate-bounce" />
                        Drop images to upload!
                      </div>
                    </div>
                  )}

                  {/* Attachments */}
                  <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Reference Images</Label>
                    <div className="flex items-center gap-2">
                      {(selectedItem.attachment_url || selectedItem.nikole_attachment_url) && (
                        <div className="flex gap-2 flex-wrap">
                          {[...getAttachments(selectedItem.attachment_url), ...getAttachments(selectedItem.nikole_attachment_url)].filter(Boolean).map((url, i) => (
                            <div key={i} onClick={() => { 
                              const allImgs = [...getAttachments(selectedItem.attachment_url), ...getAttachments(selectedItem.nikole_attachment_url)].filter(Boolean);
                              setLightboxImages(allImgs); 
                              setLightboxIndex(i); 
                            }} className="cursor-pointer">
                              <img src={url} alt="Attachment" className="w-8 h-8 rounded-md border border-slate-200 object-cover hover:opacity-80 transition-opacity" />
                            </div>
                          ))}
                        </div>
                      )}
                      <div>
                        <input 
                          type="file" 
                          id={`attachment-upload-${selectedItem.id}`}
                          className="hidden" 
                          accept="image/png, image/jpeg, image/gif, image/webp"
                          onChange={(e) => uploadFilesFromEvent(e.target.files)}
                          multiple
                        />
                        <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => document.getElementById(`attachment-upload-${selectedItem.id}`).click()}>
                          <Paperclip className="w-3 h-3 mr-1" /> Add
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Thread Area */}
                  <div className="flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden h-[450px]">
                    <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar bg-slate-50">
                      {(() => {
                        let th = selectedItem.thread || [];
                        if (th.length === 0 && (selectedItem.nikole_response || selectedItem.pixel_response)) {
                          th = [];
                          if (selectedItem.nikole_response) th.push({ sender: 'nikole', message: selectedItem.nikole_response, timestamp: selectedItem.created_date });
                          if (selectedItem.pixel_response) th.push({ sender: 'daisy', message: selectedItem.pixel_response, timestamp: selectedItem.updated_date || selectedItem.created_date });
                          th.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                        }

                        // Add original context as the first message
                        if (selectedItem.details) {
                          const isDaisyInit = selectedItem.asked_by === 'Daisy' || selectedItem.asked_by === 'Pixel Poster';
                          th = [{ 
                            sender: isDaisyInit ? 'daisy' : 'nikole', 
                            message: selectedItem.details, 
                            timestamp: selectedItem.created_date,
                            isOriginal: true
                          }, ...th];
                        }
                        
                        if (th.length === 0) {
                          return <div className="text-center text-slate-400 text-sm mt-10">No messages yet. Start the conversation!</div>;
                        }

                        return th.map((msg, i) => {
                          if (msg.sender === 'system') {
                            return (
                              <div key={i} className="flex justify-center my-2">
                                <span className="bg-slate-200 text-slate-500 text-xs px-3 py-1 rounded-full font-medium">
                                  {msg.message}
                                </span>
                              </div>
                            );
                          }

                          const isNikole = msg.sender === 'nikole';
                          return (
                            <div key={i} className={`flex flex-col ${isNikole ? 'items-end' : 'items-start'}`}>
                              <div className="flex items-center justify-between w-full max-w-[85%] mb-1 px-1">
                                <span className="text-[10px] font-bold text-slate-400">
                                  {msg.isOriginal && <span className="text-[#24C4D6] mr-1">(Original Details)</span>}
                                  {isNikole ? '👤 NIKOLE' : '🤖 DAISY'} • {moment(msg.timestamp).format('MMM D, h:mm A')}
                                </span>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); handleSquirrelAction(msg.message, selectedItem.title); }} 
                                  className="text-[10px] flex items-center gap-1 text-amber-500 hover:text-amber-600 bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded transition-colors border border-amber-200" 
                                  title="Squirrel This Message"
                                >
                                  🐿️ Squirrel This
                                </button>
                              </div>
                              <div className={`p-3 rounded-2xl max-w-[85%] whitespace-pre-wrap text-sm shadow-sm ${
                                isNikole 
                                  ? 'bg-[#24C4D6] text-white rounded-tl-2xl rounded-tr-sm border border-[#24C4D6]/20' 
                                  : 'bg-[#A8E6E6] text-[#0D626C] rounded-tr-2xl rounded-tl-sm border border-[#A8E6E6]/50'
                              }`}>
                                {msg.message}
                                {(msg.image_urls || (msg.image_url ? [msg.image_url] : [])).map((url, imgI) => (
                                  <div key={imgI} className={msg.message || imgI > 0 ? 'mt-2' : ''}>
                                    <div onClick={() => { setLightboxImages([url]); setLightboxIndex(0); }} className="cursor-pointer">
                                      <img src={url} alt="Attached" className="max-w-full rounded-md border border-black/10 max-h-64 object-contain" />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                    
                    {newImages.length > 0 && (
                      <div className="px-4 py-2 bg-white border-t border-slate-200 flex gap-2 flex-wrap">
                        {newImages.map((url, i) => (
                          <div key={i} className="relative inline-block">
                            <img src={url} alt="Upload preview" className="h-16 w-16 rounded-md border border-slate-200 object-cover" />
                            <button 
                              onClick={() => setNewImages(prev => prev.filter((_, index) => index !== i))}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-sm"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="p-3 bg-white border-t border-slate-200 flex gap-2 items-end">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/png, image/jpeg, image/gif, image/webp"
                        onChange={(e) => uploadFilesFromEvent(e.target.files)}
                        multiple
                      />
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="shrink-0 h-[44px] w-[44px] border-slate-200 hover:bg-slate-100"
                        disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-slate-500" /> : <Paperclip className="w-4 h-4 text-slate-500" />}
                      </Button>
                      <Textarea 
                        value={newResponse}
                        onChange={e => setNewResponse(e.target.value)}
                        placeholder="Message Daisy... (or drag & drop images anywhere here)"
                        className="min-h-[44px] max-h-[120px] border-slate-200 focus-visible:ring-[#24C4D6] resize-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendResponse();
                          }
                        }}
                      />
                      <Button onClick={handleSendResponse} className="bg-[#24C4D6] hover:bg-[#1db0c0] text-white shrink-0 h-[44px]">
                        Send 💬
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-3 bg-white border-t border-slate-200 flex-shrink-0 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 hidden sm:inline">Created: {moment(selectedItem.created_date).format('MMM D [at] h:mm A')}</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 px-2 font-bold"
                      onClick={() => {
                        customConfirm("Are you sure you want to completely delete this ticket? This cannot be undone.", () => {
                          handleBulkDelete([selectedItem.id]);
                        });
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                  <div className="flex gap-1.5 flex-wrap justify-end">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 text-[10px] px-2 border-blue-200 hover:bg-blue-50 text-blue-700 bg-blue-50/50" 
                      disabled={sendToTaskMutation.isPending}
                      onClick={() => sendToTaskMutation.mutate(selectedItem)}
                    >
                      📋 Send to Task
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 text-[10px] px-2 border-indigo-200 hover:bg-indigo-50 text-indigo-700 bg-indigo-50/50" 
                      disabled={sendToCreatorTaskMutation.isPending}
                      onClick={() => sendToCreatorTaskMutation.mutate(selectedItem)}
                    >
                      📋 Send to CreatorTask
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-7 text-[10px] px-2 border-amber-200 hover:bg-amber-50 text-amber-700 bg-amber-50/50" 
                      onClick={() => {
                        const selection = window.getSelection().toString();
                        const textToAnalyze = selection || selectedItem?.details || "New Idea";
                        handleSquirrelAction(textToAnalyze, selectedItem?.title);
                      }}
                    >
                      🐿️ Squirrel This
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Image Lightbox */}
        <Dialog open={lightboxImages.length > 0} onOpenChange={(open) => { if (!open) setLightboxImages([]); }}>
          <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-full p-0 bg-black/95 border-none flex flex-col items-center justify-center">
            {lightboxImages.length > 0 && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-4 right-4 text-white hover:bg-white/20 z-50 rounded-full"
                  onClick={() => setLightboxImages([])}
                >
                  <X className="w-6 h-6" />
                </Button>

                {/* Delete Button */}
                {selectedItem && getAttachments(selectedItem.attachment_url).includes(lightboxImages[lightboxIndex]) && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-4 left-4 text-red-400 hover:bg-red-500/20 hover:text-red-500 z-50 rounded-full"
                    onClick={() => setImageToDelete(lightboxImages[lightboxIndex])}
                  >
                    <Trash2 className="w-6 h-6" />
                  </Button>
                )}

                {lightboxImages.length > 1 && (
                  <>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-50 rounded-full"
                      onClick={() => setLightboxIndex(prev => (prev === 0 ? lightboxImages.length - 1 : prev - 1))}
                    >
                      <ChevronLeft className="w-8 h-8" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 z-50 rounded-full"
                      onClick={() => setLightboxIndex(prev => (prev === lightboxImages.length - 1 ? 0 : prev + 1))}
                    >
                      <ChevronRight className="w-8 h-8" />
                    </Button>
                  </>
                )}
                
                <div className="relative w-full h-full flex items-center justify-center p-8">
                  <img 
                    src={lightboxImages[lightboxIndex]} 
                    alt="Lightbox" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                
                {lightboxImages.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-y-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-xs z-50">
                    {lightboxIndex + 1} / {lightboxImages.length}
                  </div>
                )}
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Image Confirmation */}
        <Dialog open={!!imageToDelete} onOpenChange={(open) => { if (!open) setImageToDelete(null); }}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-800">Delete Image?</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-slate-600">Are you sure you want to delete this image? This can't be undone.</p>
              {imageToDelete && (
                <div className="mt-4 flex justify-center">
                  <img src={imageToDelete} alt="To delete" className="h-32 rounded-lg object-contain border border-slate-200" />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setImageToDelete(null)}>Cancel</Button>
              <Button 
                className="bg-red-500 hover:bg-red-600 text-white font-bold"
                onClick={() => {
                  if (selectedItem && imageToDelete) {
                    const currentAttachments = getAttachments(selectedItem.attachment_url);
                    const newUrls = currentAttachments.filter(url => url !== imageToDelete).join(',');
                    updateMutation.mutate({ id: selectedItem.id, data: { attachment_url: newUrls } });
                    setSelectedItem(prev => ({ ...prev, attachment_url: newUrls }));
                    
                    // Update lightbox state if needed
                    const newLightboxImages = lightboxImages.filter(url => url !== imageToDelete);
                    if (newLightboxImages.length === 0) {
                      setLightboxImages([]);
                    } else {
                      setLightboxImages(newLightboxImages);
                      if (lightboxIndex >= newLightboxImages.length) {
                        setLightboxIndex(newLightboxImages.length - 1);
                      }
                    }
                    setImageToDelete(null);
                    toast.success("Image deleted!");
                  }
                }}
              >
                Yes, Delete It
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>



      {/* Duplicate Finder Modal */}
      <Dialog open={duplicateFinderOpen} onOpenChange={setDuplicateFinderOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-indigo-700 flex items-center gap-2">
              <Search className="w-5 h-5" /> Possible Duplicates
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {duplicateGroups.length === 0 ? (
              <div className="text-center py-8 text-slate-500 font-medium">No obvious duplicates found!</div>
            ) : (
              duplicateGroups.map((group, idx) => (
                <div key={idx} className="border-2 border-indigo-100 bg-indigo-50/30 rounded-xl p-4 space-y-4">
                  <h4 className="font-bold text-indigo-800 text-sm">Duplicate Group {idx + 1}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {group.map(item => (
                      <Card key={item.id} className="border-2 border-slate-200">
                        <CardContent className="p-3 space-y-2">
                          <h5 className="font-bold text-sm line-clamp-2">{item.title}</h5>
                          <p className="text-xs text-slate-500 line-clamp-3">{item.details}</p>
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                            <Badge variant="outline" className="text-[10px]">{mapStatus(item)}</Badge>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-6 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 px-2"
                              onClick={() => {
                                handleBulkDelete([item.id]);
                                setDuplicateGroups(prev => {
                                  const newGroups = [...prev];
                                  newGroups[idx] = newGroups[idx].filter(i => i.id !== item.id);
                                  return newGroups.filter(g => g.length > 1);
                                });
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateFinderOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Squirrel Modal */}
        <Dialog open={squirrelModalOpen} onOpenChange={(open) => {
          if (!open) {
            setSquirrelModalOpen(false);
            setSquirrelProposal(null);
            setIsSquirrelLoading(false);
          }
        }}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-amber-700 flex items-center gap-2">
                🐿️ Catch a Squirrel
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {isSquirrelLoading ? (
                <div className="flex flex-col items-center justify-center py-6 text-amber-600">
                  <Loader2 className="w-8 h-8 animate-spin mb-4" />
                  <p className="text-sm font-bold text-center">Squirrel is analyzing the text...</p>
                  <p className="text-xs text-amber-600/70 text-center mt-1">Extracting the new topic for you.</p>
                </div>
              ) : squirrelProposal ? (
                <>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700">Proposed Title</Label>
                    <Input 
                      value={squirrelProposal.title} 
                      onChange={e => setSquirrelProposal({...squirrelProposal, title: e.target.value})}
                      className="border-amber-200 focus-visible:ring-amber-400 font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-bold text-slate-700">Proposed Details</Label>
                    <Textarea 
                      value={squirrelProposal.details} 
                      onChange={e => setSquirrelProposal({...squirrelProposal, details: e.target.value})} 
                      className="min-h-[120px] border-amber-200 focus-visible:ring-amber-400"
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No proposal generated.</p>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={() => setSquirrelModalOpen(false)}>Cancel</Button>
              <Button 
                disabled={isSquirrelLoading || !squirrelProposal?.title?.trim() || createMutation.isPending}
                className="bg-amber-500 hover:bg-amber-600 text-white font-bold"
                onClick={async () => {
                  if (!squirrelProposal?.title?.trim()) return;
                  const newTicket = await createMutation.mutateAsync({
                    title: squirrelProposal.title.substring(0, 80),
                    details: `${squirrelProposal.details}\n\nParent Ticket: ${selectedItem?.id}`,
                    category: selectedItem?.category || 'Other',
                    priority: 'Normal',
                    card_color: '#FBBF24',
                    status: '💬 New',
                    asked_by: 'Nikole'
                  });
                  setSquirrelModalOpen(false);
                  setSquirrelProposal(null);
                  if (newTicket) {
                    setSelectedItem(newTicket);
                  }
                }}
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Confirm & Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}