import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Search, CheckSquare, Square } from 'lucide-react';

const ALL_TABS = [
  { id: 'feed', label: 'Feed' },
  { id: 'events', label: 'Events' },
  { id: 'qna', label: 'Q&A' },
  { id: 'resources', label: 'Resources' },
  { id: 'training', label: 'Training' },
  { id: 'members', label: 'Members' },
  { id: 'requests', label: 'Requests' },
];

export default function AdminGroupTypesContent() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ key: '', name: '', description: '', color: '', badge_class: '', enabled_tabs: ALL_TABS.map(t => t.id), default_member_levels: [], is_active: true, sort_order: 0 });

  const { data: types = [] } = useQuery({
    queryKey: ['groupTypesAdmin'],
    queryFn: () => base44.entities.GroupType.filter({}, 'sort_order')
  });

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return types;
    return types.filter(t => (t.name || '').toLowerCase().includes(s) || (t.key || '').toLowerCase().includes(s));
  }, [types, search]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.GroupType.create(data),
    onSuccess: () => { queryClient.invalidateQueries(['groupTypesAdmin']); setIsOpen(false); setEditing(null); }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.GroupType.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries(['groupTypesAdmin']); setIsOpen(false); setEditing(null); }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GroupType.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['groupTypesAdmin'])
  });

  const openNew = () => {
    setEditing(null);
    setForm({ key: '', name: '', description: '', color: '', badge_class: '', enabled_tabs: ALL_TABS.map(t => t.id), default_member_levels: [], is_active: true, sort_order: 0 });
    setIsOpen(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({
      key: t.key || '',
      name: t.name || '',
      description: t.description || '',
      color: t.color || '',
      badge_class: t.badge_class || '',
      enabled_tabs: t.enabled_tabs && t.enabled_tabs.length ? t.enabled_tabs : ALL_TABS.map(x => x.id),
      default_member_levels: t.default_member_levels || [],
      is_active: t.is_active !== false,
      sort_order: t.sort_order || 0,
    });
    setIsOpen(true);
  };

  const toggleTab = (id) => {
    const set = new Set(form.enabled_tabs || []);
    if (set.has(id)) set.delete(id); else set.add(id);
    setForm({ ...form, enabled_tabs: Array.from(set) });
  };

  const addLevel = () => {
    const name = prompt('Enter level name');
    if (!name) return;
    setForm({ ...form, default_member_levels: [...(form.default_member_levels || []), name] });
  };

  const removeLevel = (lvl) => {
    setForm({ ...form, default_member_levels: (form.default_member_levels || []).filter(l => l !== lvl) });
  };

  const handleSave = () => {
    const payload = { ...form, key: (form.key || form.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') };
    if (!payload.name || !payload.key) return alert('Name and key are required');
    if (editing) updateMutation.mutate({ id: editing.id, data: payload }); else createMutation.mutate(payload);
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Search className="w-4 h-4 text-gray-400" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search group types..." />
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" /> New Group Type</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editing ? 'Edit Group Type' : 'Create Group Type'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Key (slug)</label>
                    <Input value={form.key} onChange={e => setForm({ ...form, key: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Badge Classes</label>
                    <Input placeholder="e.g. bg-purple-100 text-purple-700" value={form.badge_class} onChange={e => setForm({ ...form, badge_class: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Sort Order</label>
                    <Input type="number" value={form.sort_order} onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Enabled Tabs</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {ALL_TABS.map(t => (
                      <button key={t.id} type="button" onClick={() => toggleTab(t.id)} className={`flex items-center gap-2 px-3 py-2 rounded border ${form.enabled_tabs?.includes(t.id) ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-600'}`}>
                        {form.enabled_tabs?.includes(t.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />} {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Default Member Levels</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(form.default_member_levels || []).map(l => (
                      <Badge key={l} className="bg-blue-100 text-blue-700">
                        <span className="mr-2">{l}</span>
                        <button onClick={() => removeLevel(l)} className="text-blue-700">×</button>
                      </Badge>
                    ))}
                    <Button variant="outline" size="sm" onClick={addLevel}>Add Level</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Active</span>
                  <Switch checked={form.is_active !== false} onCheckedChange={(v) => setForm({ ...form, is_active: !!v })} />
                </div>
                <Button className="w-full" onClick={handleSave}>{editing ? 'Save Changes' : 'Create Type'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Tabs</TableHead>
              <TableHead>Levels</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(t => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell>{t.key}</TableCell>
                <TableCell>{(t.enabled_tabs || []).join(', ')}</TableCell>
                <TableCell>{(t.default_member_levels || []).join(', ')}</TableCell>
                <TableCell>{t.is_active !== false ? <Badge className="bg-green-100 text-green-700">Active</Badge> : <Badge variant="outline">Inactive</Badge>}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(t)}><Pencil className="w-4 h-4 mr-1" /> Edit</Button>
                  <Button variant="ghost" size="sm" className="text-red-600" onClick={() => {
                    if (confirm('Delete this group type?')) deleteMutation.mutate(t.id);
                  }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}