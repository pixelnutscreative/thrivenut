import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, Mail, MapPin, Users, Building, Briefcase, Calendar, 
  MessageSquare, Plus, Edit2, CheckCircle2, Clock, Activity,
  PhoneCall, Video, StickyNote, Mail as MailIcon
} from 'lucide-react';
import { format } from 'date-fns';

export default function GroupSalesTab({ group, isAdmin }) {
  const queryClient = useQueryClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [logType, setLogType] = useState('note');

  // Fetch Engagements
  const { data: engagements = [] } = useQuery({
    queryKey: ['prospectEngagements', group.id],
    queryFn: () => base44.entities.ProspectEngagement.filter({ prospect_id: group.id }, '-engagement_date')
  });

  // Update Group Mutation
  const updateGroupMutation = useMutation({
    mutationFn: (data) => base44.entities.CreatorGroup.update(group.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['activeGroup', group.id]);
      queryClient.invalidateQueries(['myGroupsDetails']); // Refresh list view if stage changes
      setIsEditOpen(false);
    }
  });

  // Create Engagement Mutation
  const createEngagementMutation = useMutation({
    mutationFn: (data) => base44.entities.ProspectEngagement.create({
      ...data,
      prospect_id: group.id,
      engagement_date: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['prospectEngagements', group.id]);
      setIsLogOpen(false);
    }
  });

  const stageColors = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-indigo-100 text-indigo-800',
    qualified: 'bg-purple-100 text-purple-800',
    proposal: 'bg-amber-100 text-amber-800',
    negotiation: 'bg-orange-100 text-orange-800',
    won: 'bg-green-100 text-green-800',
    lost: 'bg-red-100 text-red-800',
    nurture: 'bg-teal-100 text-teal-800',
    archived: 'bg-gray-100 text-gray-800'
  };

  const engagementIcons = {
    call: PhoneCall,
    email: MailIcon,
    meeting: Video,
    message: MessageSquare,
    note: StickyNote,
    other: Activity
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Lead Card */}
      <Card className="border-t-4 border-t-purple-500 shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="flex-1 space-y-4 w-full">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Badge className={stageColors[group.sales_stage] || 'bg-gray-100'}>
                    {(group.sales_stage || 'new').toUpperCase()}
                  </Badge>
                  {group.next_follow_up_date && (
                    <Badge variant="outline" className="flex items-center gap-1 text-gray-600">
                      <Clock className="w-3 h-3" />
                      Follow-up: {format(new Date(group.next_follow_up_date), 'MMM d, h:mm a')}
                    </Badge>
                  )}
                </div>
                <h2 className="text-3xl font-bold text-gray-900">{group.name}</h2>
                <div className="flex items-center gap-2 text-gray-500 mt-1">
                  {group.industry && <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {group.industry}</span>}
                  {group.corporate_address && <span className="flex items-center gap-1 mx-2"><MapPin className="w-4 h-4" /> {group.corporate_address}</span>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="space-y-1">
                  <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Contact</div>
                  <div className="font-medium">{group.contact_person_name || '—'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Phone</div>
                  <div className="font-medium">
                    {group.contact_person_phone ? (
                      <a href={`tel:${group.contact_person_phone}`} className="hover:text-purple-600 hover:underline">
                        {group.contact_person_phone}
                      </a>
                    ) : '—'}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Email</div>
                  <div className="font-medium break-all">
                    {group.contact_person_email ? (
                      <a href={`mailto:${group.contact_person_email}`} className="text-purple-600 hover:underline">
                        {group.contact_person_email}
                      </a>
                    ) : '—'}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Company Size</div>
                  <div className="font-medium">
                    {group.employee_count ? `${group.employee_count} Employees` : '—'}
                    {group.number_of_locations ? ` • ${group.number_of_locations} Locs` : ''}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 min-w-[140px]">
              <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Edit2 className="w-4 h-4 mr-2" /> Edit Details
                  </Button>
                </DialogTrigger>
                <EditProspectDialog 
                  group={group} 
                  onSubmit={(data) => updateGroupMutation.mutate(data)} 
                  isSubmitting={updateGroupMutation.isPending}
                />
              </Dialog>
              
              <Select 
                value={group.sales_stage || 'new'} 
                onValueChange={(val) => updateGroupMutation.mutate({ sales_stage: val })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Update Stage" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(stageColors).map(stage => (
                    <SelectItem key={stage} value={stage} className="capitalize">{stage}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions & Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase text-gray-500">Log Engagement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => { setLogType('call'); setIsLogOpen(true); }}
              >
                <PhoneCall className="w-4 h-4 mr-2 text-blue-500" /> Log Call
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => { setLogType('email'); setIsLogOpen(true); }}
              >
                <MailIcon className="w-4 h-4 mr-2 text-purple-500" /> Log Email
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => { setLogType('meeting'); setIsLogOpen(true); }}
              >
                <Video className="w-4 h-4 mr-2 text-green-500" /> Log Meeting
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => { setLogType('note'); setIsLogOpen(true); }}
              >
                <StickyNote className="w-4 h-4 mr-2 text-amber-500" /> Add Note
              </Button>
            </CardContent>
          </Card>

          <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log {logType}</DialogTitle>
              </DialogHeader>
              <LogEngagementForm 
                type={logType} 
                onSubmit={(data) => createEngagementMutation.mutate(data)}
                isSubmitting={createEngagementMutation.isPending}
              />
            </DialogContent>
          </Dialog>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase text-gray-500">Next Step</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                 <div className="space-y-2">
                   <Label>Follow-up Date</Label>
                   <Input 
                     type="datetime-local" 
                     value={group.next_follow_up_date ? group.next_follow_up_date.slice(0, 16) : ''}
                     onChange={(e) => updateGroupMutation.mutate({ next_follow_up_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                   />
                 </div>
                 <Button 
                    variant="ghost" 
                    className="w-full text-gray-500" 
                    onClick={() => updateGroupMutation.mutate({ next_follow_up_date: null })}
                    disabled={!group.next_follow_up_date}
                 >
                   Clear Follow-up
                 </Button>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg">Activity History</h3>
            <span className="text-sm text-gray-500">{engagements.length} entries</span>
          </div>

          <div className="space-y-4">
            {engagements.map((eng) => {
              const Icon = engagementIcons[eng.engagement_type] || Activity;
              return (
                <Card key={eng.id} className="hover:bg-gray-50 transition-colors">
                  <CardContent className="p-4 flex gap-4">
                    <div className="mt-1">
                      <div className="w-10 h-10 rounded-full bg-white border shadow-sm flex items-center justify-center">
                        <Icon className="w-5 h-5 text-gray-600" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <div className="font-medium capitalize">{eng.engagement_type}</div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(eng.engagement_date), 'MMM d, yyyy • h:mm a')}
                        </div>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap text-sm">{eng.notes}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            {engagements.length === 0 && (
              <div className="text-center py-12 text-gray-400 border-2 border-dashed rounded-xl">
                <Activity className="w-12 h-12 mx-auto mb-2 opacity-20" />
                <p>No activity logged yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EditProspectDialog({ group, onSubmit, isSubmitting }) {
  const [data, setData] = useState({
    contact_person_name: group.contact_person_name || '',
    contact_person_email: group.contact_person_email || '',
    contact_person_phone: group.contact_person_phone || '',
    employee_count: group.employee_count || '',
    number_of_locations: group.number_of_locations || '',
    industry: group.industry || '',
    corporate_address: group.corporate_address || ''
  });

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Edit Prospect Details</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
        <div className="space-y-2">
          <Label>Contact Name</Label>
          <Input 
            value={data.contact_person_name} 
            onChange={(e) => setData({...data, contact_person_name: e.target.value})} 
          />
        </div>
        <div className="space-y-2">
          <Label>Industry</Label>
          <Input 
            value={data.industry} 
            onChange={(e) => setData({...data, industry: e.target.value})} 
          />
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input 
            type="email"
            value={data.contact_person_email} 
            onChange={(e) => setData({...data, contact_person_email: e.target.value})} 
          />
        </div>
        <div className="space-y-2">
          <Label>Phone</Label>
          <Input 
            value={data.contact_person_phone} 
            onChange={(e) => setData({...data, contact_person_phone: e.target.value})} 
          />
        </div>
        <div className="space-y-2">
          <Label>Employees</Label>
          <Input 
            type="number"
            value={data.employee_count} 
            onChange={(e) => setData({...data, employee_count: parseInt(e.target.value) || 0})} 
          />
        </div>
        <div className="space-y-2">
          <Label>Locations</Label>
          <Input 
            type="number"
            value={data.number_of_locations} 
            onChange={(e) => setData({...data, number_of_locations: parseInt(e.target.value) || 0})} 
          />
        </div>
        <div className="col-span-full space-y-2">
          <Label>Address</Label>
          <Input 
            value={data.corporate_address} 
            onChange={(e) => setData({...data, corporate_address: e.target.value})} 
          />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => onSubmit(data)} disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function LogEngagementForm({ type, onSubmit, isSubmitting }) {
  const [notes, setNotes] = useState('');
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea 
          value={notes} 
          onChange={(e) => setNotes(e.target.value)} 
          placeholder={`Details about the ${type}...`}
          className="h-32"
          autoFocus
        />
      </div>
      <Button 
        onClick={() => onSubmit({ engagement_type: type, notes })} 
        disabled={!notes.trim() || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? 'Logging...' : 'Log Engagement'}
      </Button>
    </div>
  );
}