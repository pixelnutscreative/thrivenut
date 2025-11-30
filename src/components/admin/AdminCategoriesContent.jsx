import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Trash2, GripVertical, Check, X, Pencil } from 'lucide-react';

export default function AdminCategoriesContent() {
  const queryClient = useQueryClient();
  const [newCategory, setNewCategory] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['adminCategories'],
    queryFn: () => base44.entities.ResourceCategory.list('sort_order')
  });

  const createMutation = useMutation({
    mutationFn: (name) => base44.entities.ResourceCategory.create({ 
      name, 
      sort_order: (categories.length + 1) * 10,
      is_active: true 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      setNewCategory('');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ResourceCategory.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      setEditingId(null);
      setEditName('');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ResourceCategory.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminCategories'] })
  });

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      createMutation.mutate(newCategory.trim());
    }
  };

  const handleSaveEdit = () => {
    if (editName.trim() && editingId) {
      updateMutation.mutate({ id: editingId, data: { name: editName.trim() } });
    }
  };

  const toggleActive = (category) => {
    updateMutation.mutate({ id: category.id, data: { is_active: !category.is_active } });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Resource Categories</h2>
        <p className="text-gray-600 text-sm">Manage categories for your Products I Love section</p>
      </div>

      {/* Add New Category */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Input
              placeholder="New category name..."
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <Button 
              onClick={handleAddCategory}
              disabled={!newCategory.trim() || createMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Category List */}
      <div className="space-y-2">
        {categories.map((category, index) => (
          <Card key={category.id} className={`${!category.is_active ? 'opacity-50' : ''}`}>
            <CardContent className="p-3 flex items-center gap-3">
              <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
              
              {editingId === category.id ? (
                <>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit();
                      if (e.key === 'Escape') { setEditingId(null); setEditName(''); }
                    }}
                  />
                  <Button size="sm" variant="ghost" onClick={handleSaveEdit}>
                    <Check className="w-4 h-4 text-green-500" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditName(''); }}>
                    <X className="w-4 h-4 text-red-500" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 font-medium">{category.name}</span>
                  <span className="text-xs text-gray-400">Order: {category.sort_order}</span>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => { setEditingId(category.id); setEditName(category.name); }}
                  >
                    <Pencil className="w-4 h-4 text-gray-500" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleActive(category)}
                  >
                    {category.is_active ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <X className="w-4 h-4 text-red-500" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Delete "${category.name}"?`)) {
                        deleteMutation.mutate(category.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No categories yet. Add your first one above!</p>
        </div>
      )}
    </div>
  );
}