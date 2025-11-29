import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, Bug, Lightbulb, HelpCircle, CheckCircle, 
  Clock, AlertCircle, Loader2, Send, User, Calendar, Image,
  Star, UserCheck, UserX, Users, Trash2
} from 'lucide-react';

const ticketTypes = {
  bug: { label: 'Bug', icon: Bug, color: 'text-red-500 bg-red-100' },
  feature_request: { label: 'Feature', icon: Lightbulb, color: 'text-amber-500 bg-amber-100' },
  question: { label: 'Question', icon: HelpCircle, color: 'text-blue-500 bg-blue-100' },
  feedback: { label: 'Feedback', icon: MessageSquare, color: 'text-purple-500 bg-purple-100' },
  other: { label: 'Other', icon: MessageSquare, color: 'text-gray-500 bg-gray-100' },
};

const statusOptions = [
  { value: 'open', label: 'Open', color: 'bg-blue-100 text-blue-700' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-amber-100 text-amber-700' },
  { value: 'waiting_on_user', label: 'Waiting on User', color: 'bg-orange-100 text-orange-700' },
  { value: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-700' },
  { value: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-700' },
];

const priorityColors = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

export default function AdminSupportContent() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('tickets');
  const [filterStatus, setFilterStatus] = useState('open');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [response, setResponse] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [betaFilterStatus, setBetaFilterStatus] = useState('pending');

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['allSupportTickets'],
    queryFn: () => base44.entities.SupportTicket.list('-created_date'),
  });

  const { data: betaTesters = [] } = useQuery({
    queryKey: ['allBetaTesters'],
    queryFn: () => base44.entities.BetaTester.list('-created_date'),
  });

  const updateTicketMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.SupportTicket.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allSupportTickets'] });
      setSelectedTicket(null);
      setResponse('');
      setAdminNotes('');
    },
  });

  const deleteTicketMutation = useMutation({
    mutationFn: (id) => base44.entities.SupportTicket.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allSupportTickets'] });
      setSelectedTicket(null);
    },
  });

  const updateBetaTesterMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BetaTester.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allBetaTesters'] }),
  });

  const filteredTickets = tickets.filter(t => 
    filterStatus === 'all' ? true : t.status === filterStatus
  );

  const filteredBetaTesters = betaTesters.filter(bt =>
    betaFilterStatus === 'all' ? true : bt.status === betaFilterStatus
  );

  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
  const pendingBetaCount = betaTesters.filter(bt => bt.status === 'pending').length;
  const activeBetaCount = betaTesters.filter(bt => bt.status === 'active').length;
  const waitlistCount = betaTesters.filter(bt => bt.status === 'waitlist').length;

  const handleOpenTicket = (ticket) => {
    setSelectedTicket(ticket);
    setAdminNotes(ticket.admin_notes || '');
    setResponse(ticket.resolution || '');
  };

  const handleUpdateStatus = (ticketId, newStatus) => {
    updateTicketMutation.mutate({ id: ticketId, data: { status: newStatus } });
  };

  const handleSaveTicket = () => {
    if (!selectedTicket) return;
    
    // Build updated messages array if there's a new response
    let updatedData = {
      admin_notes: adminNotes,
      status: selectedTicket.status,
    };

    // Only auto-resolve if the response has changed AND there's a new response
    if (response.trim() && response !== selectedTicket.resolution) {
      const newMessage = {
        sender: 'admin',
        sender_type: 'admin',
        message: response,
        timestamp: new Date().toISOString(),
      };
      updatedData.messages = [...(selectedTicket.messages || []), newMessage];
      updatedData.resolution = response;
      // Keep the user-selected status instead of forcing resolved
    }

    updateTicketMutation.mutate({
      id: selectedTicket.id,
      data: updatedData
    });
  };

  const approveBetaTester = (tester) => {
    const trialStart = new Date().toISOString().split('T')[0];
    const trialEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    updateBetaTesterMutation.mutate({
      id: tester.id,
      data: { 
        status: 'active',
        trial_start: trialStart,
        trial_end: trialEnd
      }
    });
  };

  const denyBetaTester = (tester) => {
    updateBetaTesterMutation.mutate({
      id: tester.id,
      data: { status: 'waitlist' }
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-700">{openCount}</p>
            <p className="text-sm text-blue-600">Open Tickets</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-700">{inProgressCount}</p>
            <p className="text-sm text-amber-600">In Progress</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-700">{tickets.filter(t => t.status === 'resolved').length}</p>
            <p className="text-sm text-green-600">Resolved</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-orange-700">{pendingBetaCount}</p>
            <p className="text-sm text-orange-600">Pending Beta</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-purple-700">{activeBetaCount}</p>
            <p className="text-sm text-purple-600">Active Testers</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tickets" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Tickets
            {openCount > 0 && <Badge className="bg-red-500 text-white ml-1">{openCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="beta" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Beta Testers
            {pendingBetaCount > 0 && <Badge className="bg-orange-500 text-white ml-1">{pendingBetaCount}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="mt-4 space-y-4">
      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        {[{ value: 'all', label: 'All' }, ...statusOptions].map(status => (
          <Button
            key={status.value}
            variant={filterStatus === status.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus(status.value)}
            className={filterStatus === status.value ? 'bg-purple-600' : ''}
          >
            {status.label}
            {status.value === 'open' && openCount > 0 && (
              <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5">{openCount}</span>
            )}
          </Button>
        ))}
      </div>

      {/* Tickets List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <p className="text-gray-500">No tickets in this category. You're crushing it! 🎉</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map(ticket => {
            const typeConfig = ticketTypes[ticket.type] || ticketTypes.other;
            const TypeIcon = typeConfig.icon;
            const isBetaTester = betaTesters.some(bt => bt.user_email === ticket.user_email);
            
            return (
              <Card 
                key={ticket.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleOpenTicket(ticket)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                      <TypeIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-gray-800 truncate">{ticket.subject}</h3>
                        <Badge className={statusOptions.find(s => s.value === ticket.status)?.color}>
                          {statusOptions.find(s => s.value === ticket.status)?.label}
                        </Badge>
                        <Badge className={priorityColors[ticket.priority]}>
                          {ticket.priority}
                        </Badge>
                        {isBetaTester && (
                          <Badge className="bg-purple-100 text-purple-700">Beta Tester</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {ticket.user_email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(ticket.created_date).toLocaleDateString()}
                        </span>
                        {ticket.screenshot_url && (
                          <span className="flex items-center gap-1 text-blue-500">
                            <Image className="w-3 h-3" />
                            Has screenshot
                          </span>
                        )}
                      </div>
                      {ticket.description && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{ticket.description}</p>
                      )}
                    </div>
                    <Select
                      value={ticket.status}
                      onValueChange={(v) => {
                        event.stopPropagation();
                        handleUpdateStatus(ticket.id, v);
                      }}
                    >
                      <SelectTrigger className="w-32" onClick={(e) => e.stopPropagation()}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

        </TabsContent>

        <TabsContent value="beta" className="mt-4 space-y-4">
          {/* Beta Tester Filters */}
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'All' },
              { value: 'pending', label: 'Pending', count: pendingBetaCount },
              { value: 'active', label: 'Active', count: activeBetaCount },
              { value: 'waitlist', label: 'Waitlist', count: waitlistCount },
              { value: 'expired', label: 'Expired' },
            ].map(status => (
              <Button
                key={status.value}
                variant={betaFilterStatus === status.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBetaFilterStatus(status.value)}
                className={betaFilterStatus === status.value ? 'bg-purple-600' : ''}
              >
                {status.label}
                {status.count > 0 && (
                  <span className="ml-1 bg-orange-500 text-white text-xs rounded-full px-1.5">{status.count}</span>
                )}
              </Button>
            ))}
          </div>

          {/* Beta Testers List */}
          {filteredBetaTesters.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No beta testers in this category.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredBetaTesters.map(tester => (
                <Card key={tester.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-800">{tester.user_email}</span>
                          <Badge className={
                            tester.status === 'active' ? 'bg-green-100 text-green-700' :
                            tester.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                            tester.status === 'waitlist' ? 'bg-gray-100 text-gray-700' :
                            'bg-red-100 text-red-700'
                          }>
                            {tester.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-500 space-x-3">
                          <span>Applied: {tester.applied_date || tester.created_date?.split('T')[0] || 'N/A'}</span>
                          {tester.trial_start && <span>Trial: {tester.trial_start} - {tester.trial_end}</span>}
                          <span>Feedback: {tester.feedback_count || 0}</span>
                        </div>
                        {tester.notes && (
                          <p className="text-sm text-gray-600 mt-1">{tester.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {tester.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => approveBetaTester(tester)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <UserCheck className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => denyBetaTester(tester)}
                              className="text-gray-600"
                            >
                              <UserX className="w-4 h-4 mr-1" />
                              Waitlist
                            </Button>
                          </>
                        )}
                        {tester.status === 'waitlist' && (
                          <Button
                            size="sm"
                            onClick={() => approveBetaTester(tester)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                        )}
                        {tester.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateBetaTesterMutation.mutate({ 
                              id: tester.id, 
                              data: { status: 'expired' } 
                            })}
                          >
                            Expire
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Capacity Info */}
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-purple-800">Beta Capacity</h4>
                  <p className="text-sm text-purple-600">
                    {activeBetaCount} / 33 active testers • {waitlistCount} on waitlist
                  </p>
                </div>
                <div className="text-3xl font-bold text-purple-700">
                  {Math.round((activeBetaCount / 33) * 100)}%
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ticket Detail Modal */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedTicket && ticketTypes[selectedTicket.type] && (
                  React.createElement(ticketTypes[selectedTicket.type].icon, { className: "w-5 h-5" })
                )}
                {selectedTicket?.subject}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                  if (confirm('Delete this ticket permanently?')) {
                    deleteTicketMutation.mutate(selectedTicket.id);
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              {/* Meta info */}
              <div className="flex flex-wrap gap-2 text-sm">
                <Badge className={statusOptions.find(s => s.value === selectedTicket.status)?.color}>
                  {statusOptions.find(s => s.value === selectedTicket.status)?.label}
                </Badge>
                <Badge className={priorityColors[selectedTicket.priority]}>
                  {selectedTicket.priority} priority
                </Badge>
                <span className="text-gray-500">
                  From: {selectedTicket.user_email}
                </span>
                <span className="text-gray-500">
                  {new Date(selectedTicket.created_date).toLocaleString()}
                </span>
              </div>

              {/* Description */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Description</h4>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {selectedTicket.description || 'No description provided'}
                </p>
              </div>

              {/* Screenshot */}
              {selectedTicket.screenshot_url && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Screenshot</h4>
                  <img 
                    src={selectedTicket.screenshot_url} 
                    alt="Screenshot" 
                    className="max-w-full rounded-lg border cursor-pointer"
                    onClick={() => window.open(selectedTicket.screenshot_url, '_blank')}
                  />
                </div>
              )}

              {/* Conversation Thread */}
              {selectedTicket.messages?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-700">Conversation Thread</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-gray-50 rounded-lg">
                    {selectedTicket.messages.map((msg, idx) => (
                      <div 
                        key={idx} 
                        className={`p-2 rounded-lg text-sm ${
                          msg.sender_type === 'admin' 
                            ? 'bg-purple-100 border-l-4 border-purple-500' 
                            : 'bg-blue-100 border-l-4 border-blue-500'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1 text-xs text-gray-500">
                          <span className="font-medium">
                            {msg.sender_type === 'admin' ? 'Admin' : msg.sender}
                          </span>
                          <span>•</span>
                          <span>{new Date(msg.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Notes (internal) */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Admin Notes (internal)</h4>
                <Textarea
                  placeholder="Internal notes - user won't see these..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Response to User */}
              <div className="space-y-2">
                <h4 className="font-medium text-gray-700">Response to User</h4>
                <Textarea
                  placeholder="Write your response here - this will be visible to the user..."
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <Select
                  value={selectedTicket.status}
                  onValueChange={(v) => {
                    setSelectedTicket({ ...selectedTicket, status: v });
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex-1" />

                <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveTicket}
                  disabled={updateTicketMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {updateTicketMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Save & Update
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}