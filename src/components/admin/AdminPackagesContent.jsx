import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Plus, Edit, Trash2, Tag, Calendar, DollarSign, Package } from 'lucide-react';
import { format } from 'date-fns';

const INTERVALS = [
  { value: 'month', label: 'Monthly' },
  { value: 'quarter', label: 'Quarterly (Every 3 months)' },
  { value: 'year', label: 'Yearly' },
  { value: 'lifetime', label: 'Lifetime (One-time)' },
  { value: 'one_time', label: 'One-time (Non-recurring)' }
];

const MODULES = [
  { id: 'tiktok', label: 'Social Media Suite' },
  { id: 'goals', label: 'Goals & Habits' },
  { id: 'wellness', label: 'Wellness Tracker' },
  { id: 'journal', label: 'Journal' },
  { id: 'finance', label: 'Finance' },
  { id: 'pets', label: 'Pet Care' },
  { id: 'supplements', label: 'Supplements' },
  { id: 'medications', label: 'Medications' },
  { id: 'care_reminders', label: 'Care Reminders' },
  { id: 'people', label: 'People/Contacts' },
  { id: 'activity', label: 'Activity Tracker' },
  { id: 'motivations', label: 'Motivations' },
  { id: 'quick_notes', label: 'Quick Notes' },
  { id: 'mental_health', label: 'Mental Health' }
];

const PAGES = [
  'Dashboard', 'Goals', 'VisionBoard', 'Journal', 'Finance', 
  'People', 'CareReminders', 'PetCare', 'PrayerRequests', 
  'HolyHitmakers', 'BibleResources', 'MentalHealth', 'Wellness', 
  'Supplements', 'Medications', 'ActivityTracker', 'ContentCreatorHub',
  'ContentMarketplace', 'SongGenerator', 'SocialShortcuts', 
  'TikTokEngagement', 'TikTokContacts', 'LiveSchedule', 'BattlePrep',
  'LiveEngagement', 'WeeklyGifterGallery', 'LoveAway', 'PictionaryHelper'
];

const GROUP_TYPES = [
  { value: 'none', label: 'None (Standard)' },
  { value: 'personal', label: 'Personal (Friends/Family)' },
  { value: 'business', label: 'Business' },
  { value: 'agency', label: 'Agency' },
  { value: 'mlm', label: 'MLM' }
];

export default function AdminPackagesContent() {
  const queryClient = useQueryClient();
  const [editingPackage, setEditingPackage] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ['subscriptionPackages'],
    queryFn: () => base44.entities.SubscriptionPackage.list('sort_order'),
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      // Ensure prices are numbers
      const payload = {
        ...data,
        price: Number(data.price),
        sale_price: data.sale_price ? Number(data.sale_price) : null,
        max_groups: Number(data.max_groups || 1),
        sort_order: Number(data.sort_order || 0)
      };

      if (editingPackage?.id) {
        return await base44.entities.SubscriptionPackage.update(editingPackage.id, payload);
      } else {
        return await base44.entities.SubscriptionPackage.create(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptionPackages'] });
      setIsDialogOpen(false);
      setEditingPackage(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.SubscriptionPackage.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscriptionPackages'] }),
  });

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingPackage({
      name: '',
      description: '',
      price: 0,
      currency: 'usd',
      interval: 'month',
      included_modules: [],
      included_pages: [],
      is_active: true,
      is_sale: false,
      sale_price: 0,
      group_type: 'none',
      max_groups: 1,
      sort_order: 0
    });
    setIsDialogOpen(true);
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Subscription Packages</h2>
          <p className="text-sm text-gray-500">Manage pricing, features, and billing intervals</p>
        </div>
        <Button onClick={handleCreate} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Package
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <Card key={pkg.id} className={`relative ${!pkg.is_active ? 'opacity-60 bg-gray-50' : ''}`}>
            {pkg.is_sale && (
              <div className="absolute top-2 right-2">
                <Badge className="bg-red-500">SALE</Badge>
              </div>
            )}
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-start">
                <span>{pkg.name}</span>
              </CardTitle>
              <CardDescription className="line-clamp-2">{pkg.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                {pkg.is_sale ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-red-600">${(pkg.sale_price / 100).toFixed(2)}</span>
                    <span className="text-sm text-gray-500 line-through">${(pkg.price / 100).toFixed(2)}</span>
                    <span className="text-sm text-gray-500">/{pkg.interval}</span>
                  </div>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">${(pkg.price / 100).toFixed(2)}</span>
                    <span className="text-sm text-gray-500">/{pkg.interval}</span>
                  </div>
                )}
                {pkg.is_sale && pkg.sale_end_date && (
                  <p className="text-xs text-red-600 mt-1 flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    Ends: {format(new Date(pkg.sale_end_date), 'MMM d, yyyy')}
                  </p>
                )}
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex flex-wrap gap-1">
                  {pkg.included_modules.slice(0, 3).map(m => (
                    <Badge key={m} variant="secondary" className="text-xs">
                      {MODULES.find(mod => mod.id === m)?.label || m}
                    </Badge>
                  ))}
                  {pkg.included_modules.length > 3 && (
                    <Badge variant="outline" className="text-xs">+{pkg.included_modules.length - 3} more</Badge>
                  )}
                </div>
                {pkg.group_type !== 'none' && (
                  <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                    {GROUP_TYPES.find(t => t.value === pkg.group_type)?.label}
                  </Badge>
                )}
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(pkg)}>
                  <Edit className="w-4 h-4 mr-2" /> Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => {
                  if (confirm('Are you sure you want to delete this package?')) deleteMutation.mutate(pkg.id);
                }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPackage?.id ? 'Edit Package' : 'Create Package'}</DialogTitle>
          </DialogHeader>
          
          {editingPackage && (
            <div className="grid gap-4 py-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Package Name</Label>
                  <Input 
                    value={editingPackage.name} 
                    onChange={(e) => setEditingPackage({...editingPackage, name: e.target.value})}
                    placeholder="e.g. Founder's Special"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Billing Interval</Label>
                  <Select 
                    value={editingPackage.interval} 
                    onValueChange={(v) => setEditingPackage({...editingPackage, interval: v})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {INTERVALS.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea 
                  value={editingPackage.description} 
                  onChange={(e) => setEditingPackage({...editingPackage, description: e.target.value})}
                  placeholder="What's included?"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <Label>Regular Price (in Cents)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                    <Input 
                      type="number" 
                      value={editingPackage.price} 
                      onChange={(e) => setEditingPackage({...editingPackage, price: e.target.value})}
                      className="pl-9"
                      placeholder="3300 = $33.00"
                    />
                  </div>
                  <p className="text-xs text-gray-500">Enter 3300 for $33.00</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>On Sale?</Label>
                    <Switch 
                      checked={editingPackage.is_sale} 
                      onCheckedChange={(c) => setEditingPackage({...editingPackage, is_sale: c})}
                    />
                  </div>
                  {editingPackage.is_sale && (
                    <div className="space-y-2">
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-red-500" />
                        <Input 
                          type="number" 
                          value={editingPackage.sale_price} 
                          onChange={(e) => setEditingPackage({...editingPackage, sale_price: e.target.value})}
                          className="pl-9 border-red-200"
                          placeholder="Sale Price (Cents)"
                        />
                      </div>
                      <Input 
                        type="date"
                        value={editingPackage.sale_end_date ? editingPackage.sale_end_date.split('T')[0] : ''}
                        onChange={(e) => setEditingPackage({...editingPackage, sale_end_date: e.target.value ? new Date(e.target.value).toISOString() : null})}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Included Modules/Features</Label>
                  <div className="grid grid-cols-1 gap-2 p-4 border rounded-lg max-h-48 overflow-y-auto bg-white">
                    {MODULES.map(module => (
                      <div key={module.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`mod-${module.id}`}
                          checked={editingPackage.included_modules.includes(module.id)}
                          onCheckedChange={(checked) => {
                            const current = editingPackage.included_modules;
                            setEditingPackage({
                              ...editingPackage,
                              included_modules: checked 
                                ? [...current, module.id]
                                : current.filter(m => m !== module.id)
                            });
                          }}
                        />
                        <label htmlFor={`mod-${module.id}`} className="text-sm font-medium leading-none cursor-pointer">
                          {module.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Specific Pages (Optional)</Label>
                  <div className="grid grid-cols-1 gap-2 p-4 border rounded-lg max-h-48 overflow-y-auto bg-white">
                    {PAGES.map(page => (
                      <div key={page} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`page-${page}`}
                          checked={editingPackage.included_pages?.includes(page)}
                          onCheckedChange={(checked) => {
                            const current = editingPackage.included_pages || [];
                            setEditingPackage({
                              ...editingPackage,
                              included_pages: checked 
                                ? [...current, page]
                                : current.filter(p => p !== page)
                            });
                          }}
                        />
                        <label htmlFor={`page-${page}`} className="text-sm font-medium leading-none cursor-pointer">
                          {page}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Group Creation Type</Label>
                  <Select 
                    value={editingPackage.group_type} 
                    onValueChange={(v) => setEditingPackage({...editingPackage, group_type: v})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GROUP_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Max Groups</Label>
                  <Input 
                    type="number" 
                    value={editingPackage.max_groups} 
                    onChange={(e) => setEditingPackage({...editingPackage, max_groups: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="space-y-0.5">
                  <Label>Active Status</Label>
                  <p className="text-xs text-gray-500">Visible to users?</p>
                </div>
                <Switch 
                  checked={editingPackage.is_active} 
                  onCheckedChange={(c) => setEditingPackage({...editingPackage, is_active: c})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Input 
                  type="number"
                  value={editingPackage.sort_order}
                  onChange={(e) => setEditingPackage({...editingPackage, sort_order: e.target.value})}
                />
              </div>

            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(editingPackage)} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Package
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}