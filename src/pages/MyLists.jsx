import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Search, ExternalLink, User, CheckCircle2, Circle, Trash2, 
  Film, Book, Search as SearchIcon, ShoppingCart, RotateCcw, MapPin, Headphones, FlaskConical, Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../components/shared/useTheme';
import CollectionItemModal from '../components/lists/CollectionItemModal';

const categories = [
  { id: 'watch', label: 'Watch', emoji: '🎬', icon: Film, color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-200' },
  { id: 'read', label: 'Read', emoji: '📚', icon: Book, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
  { id: 'research', label: 'Research', emoji: '🔍', icon: SearchIcon, color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200' },
  { id: 'buy', label: 'Buy', emoji: '🛒', icon: ShoppingCart, color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200' },
  { id: 'return', label: 'Return', emoji: '↩️', icon: RotateCcw, color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200' },
  { id: 'visit', label: 'Visit', emoji: '📍', icon: MapPin, color: 'text-rose-600', bg: 'bg-rose-100', border: 'border-rose-200' },
  { id: 'listen', label: 'Listen', emoji: '🎧', icon: Headphones, color: 'text-indigo-600', bg: 'bg-indigo-100', border: 'border-indigo-200' },
  { id: 'try', label: 'Try', emoji: '🧪', icon: FlaskConical, color: 'text-cyan-600', bg: 'bg-cyan-100', border: 'border-cyan-200' },
  { id: 'other', label: 'Other', emoji: '📦', icon: Package, color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' }
];

export default function MyLists() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('watch');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const queryClient = useQueryClient();
  const { bgClass, textClass, subtextClass } = useTheme();

  React.useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['collectionItems', user?.email],
    queryFn: () => base44.entities.CollectionItem.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user
  });

  const itemMutation = useMutation({
    mutationFn: async (data) => {
      if (data.id) {
        return await base44.entities.CollectionItem.update(data.id, data);
      } else {
        return await base44.entities.CollectionItem.create({
          created_by: user?.email,
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collectionItems'] });
      setShowModal(false);
      setEditingItem(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => base44.entities.CollectionItem.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['collectionItems'] })
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (item) => {
      const newStatus = item.status === 'completed' ? 'pending' : 'completed';
      return await base44.entities.CollectionItem.update(item.id, { status: newStatus });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['collectionItems'] })
  });

  const filteredItems = items.filter(item => {
    const matchesTab = activeTab === 'all' || item.category === activeTab;
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || 
                          (item.recommended_by && item.recommended_by.toLowerCase().includes(search.toLowerCase())) ||
                          (item.notes && item.notes.toLowerCase().includes(search.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  // Sort: Pending first, then completed
  filteredItems.sort((a, b) => {
    if (a.status === b.status) return 0;
    return a.status === 'pending' ? -1 : 1;
  });

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              My Lists
            </h1>
            <p className={subtextClass}>Keep track of everything you want to watch, read, and do.</p>
          </div>
          <Button 
            onClick={() => { setEditingItem(null); setShowModal(true); }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Item
          </Button>
        </div>

        <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm p-2 rounded-xl border border-gray-200/50 max-w-md">
          <Search className="w-5 h-5 text-gray-400 ml-2" />
          <Input 
            placeholder="Search items, recommendations..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto h-auto p-2 gap-2 bg-transparent">
            {categories.map(cat => (
              <TabsTrigger 
                key={cat.id} 
                value={cat.id}
                className={`rounded-full px-4 py-2 border transition-all data-[state=active]:ring-2 data-[state=active]:ring-offset-2 ${cat.bg} ${cat.border} ${cat.color} data-[state=active]:bg-white`}
              >
                <span className="mr-2">{cat.emoji}</span>
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map(cat => (
            <TabsContent key={cat.id} value={cat.id} className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredItems.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-400">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                        <cat.icon className="w-8 h-8 text-gray-300" />
                      </div>
                      <p>No items in this list yet.</p>
                      <Button variant="link" onClick={() => setShowModal(true)}>Add your first one!</Button>
                    </div>
                  ) : (
                    filteredItems.map(item => (
                      <ListItemCard 
                        key={item.id} 
                        item={item} 
                        category={cat}
                        onToggle={() => toggleStatusMutation.mutate(item)}
                        onEdit={() => { setEditingItem(item); setShowModal(true); }}
                        onDelete={() => deleteMutation.mutate(item.id)}
                      />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      <CollectionItemModal 
        isOpen={showModal}
        onClose={() => { setShowModal(false); setEditingItem(null); }}
        item={editingItem}
        onSave={(data) => itemMutation.mutate({ ...data, id: editingItem?.id })}
        defaultCategory={activeTab}
      />
    </div>
  );
}

function ListItemCard({ item, category, onToggle, onEdit, onDelete }) {
  const isCompleted = item.status === 'completed';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`relative group rounded-xl border p-4 transition-all hover:shadow-md bg-white ${
        isCompleted ? 'opacity-60 bg-gray-50' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <button 
          onClick={onToggle}
          className={`mt-1 flex-shrink-0 transition-colors ${
            isCompleted ? 'text-green-500' : 'text-gray-300 hover:text-green-500'
          }`}
        >
          {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
        </button>
        
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-lg truncate ${isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}`}>
            {item.title}
          </h3>
          
          {item.recommended_by && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-1">
              <User className="w-3.5 h-3.5 text-purple-500" />
              <span>Recommended by <span className="font-medium text-purple-700">{item.recommended_by}</span></span>
            </div>
          )}

          {item.notes && (
            <p className="text-sm text-gray-500 mt-2 line-clamp-2">{item.notes}</p>
          )}

          {item.link && (
            <a 
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-2 bg-blue-50 px-2 py-1 rounded-md"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3 h-3" />
              View Link
            </a>
          )}
        </div>
      </div>

      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100" onClick={onEdit}>
          <span className="sr-only">Edit</span>
          <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 text-red-400 hover:text-red-600" onClick={onDelete}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}