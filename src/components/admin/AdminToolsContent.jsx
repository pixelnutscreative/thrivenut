import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit2, Save, Trash2, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const toolCategories = ['Images', 'Video', 'Audio', 'SEO', 'Scheduling', 'Transcripts'];

export default function AdminToolsContent() {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingTool, setEditingTool] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Images',
    url: ''
  });
  const [activeTab, setActiveTab] = useState('Images');

  const { data: tools = [] } = useQuery({
    queryKey: ['tools'],
    queryFn: () => base44.entities.Tool.list('name'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Tool.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      setShowDialog(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Tool.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] });
      setShowDialog(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Tool.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tools'] }),
  });

  const handleAdd = () => {
    setEditingTool(null);
    setFormData({
      name: '',
      category: activeTab,
      url: ''
    });
    setShowDialog(true);
  };

  const handleEdit = (tool) => {
    setEditingTool(tool);
    setFormData({
      name: tool.name,
      category: tool.category,
      url: tool.url
    });
    setShowDialog(true);
  };

  const handleSave = () => {
    if (editingTool) {
      updateMutation.mutate({ id: editingTool.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (tool) => {
    if (confirm(`Delete ${tool.name}?`)) {
      deleteMutation.mutate(tool.id);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Images',
      url: ''
    });
    setEditingTool(null);
  };

  const getToolsByCategory = (category) => {
    return tools.filter(tool => tool.category === category);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tools</h2>
          <p className="text-sm text-gray-500 mt-1">Manage external tools and user preferences</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add Tool
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full">
          {toolCategories.map((category) => (
            <TabsTrigger key={category} value={category}>
              {category}
              <Badge variant="secondary" className="ml-2">
                {getToolsByCategory(category).length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {toolCategories.map((category) => (
          <TabsContent key={category} value={category} className="space-y-3 mt-4">
            {getToolsByCategory(category).length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  <p>No {category.toLowerCase()} tools added yet</p>
                  <Button size="sm" onClick={handleAdd} className="mt-3">
                    <Plus className="w-4 h-4 mr-2" />
                    Add {category} Tool
                  </Button>
                </CardContent>
              </Card>
            ) : (
              getToolsByCategory(category).map((tool) => (
                <Card key={tool.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{tool.name}</h3>
                          <a
                            href={tool.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                          >
                            {tool.url}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(tool)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(tool)}>
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTool ? 'Edit Tool' : 'Add Tool'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Tool Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Canva, Descript, ChatGPT"
              />
            </div>

            <div>
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {toolCategories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>URL</Label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://"
              />
              <p className="text-xs text-gray-500 mt-1">Users will be able to launch this URL from checklists</p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={() => setShowDialog(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1"
                disabled={!formData.name || !formData.url || !formData.category}
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-800">
            <strong>Tool Preferences:</strong> Each user can set their preferred tool per category. When they click a checklist item linked to a category, their preferred tool launches automatically.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}