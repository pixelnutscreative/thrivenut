import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Loader2, Trash2, ExternalLink, MapPin, Clock, Check } from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';
import { getEffectiveUserEmail } from '../components/admin/ImpersonationBanner';
import AddManualEventModal from '../components/dashboard/AddManualEventModal';

export default function MyEvents() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const effectiveEmail = user ? getEffectiveUserEmail(user.email) : null;

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['allMyEvents', effectiveEmail],
    queryFn: () => base44.entities.ExternalEvent.filter({ created_by: effectiveEmail }, '-date'),
    enabled: !!effectiveEmail,
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id) => base44.entities.ExternalEvent.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allMyEvents'] }),
  });

  const toggleCompleteMutation = useMutation({
    mutationFn: ({ id, completed }) => base44.entities.ExternalEvent.update(id, { is_completed: completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['allMyEvents'] }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const upcomingEvents = events.filter(e => !e.is_completed && (!e.date || !isPast(parseISO(e.date))));
  const pastEvents = events.filter(e => e.is_completed || (e.date && isPast(parseISO(e.date))));

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">My Events</h1>
              <p className="text-gray-600">Track all your important events</p>
            </div>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-orange-500 to-pink-500">
            <Calendar className="w-4 h-4 mr-2" />
            Add Event
          </Button>
        </div>

        {/* Upcoming Events */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              Upcoming Events ({upcomingEvents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No upcoming events</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map(event => (
                  <div key={event.id} className="p-4 bg-gradient-to-r from-orange-50 to-pink-50 rounded-lg border-2 border-orange-200">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Checkbox
                            checked={event.is_completed}
                            onCheckedChange={(checked) => toggleCompleteMutation.mutate({ id: event.id, completed: checked })}
                          />
                          <h3 className="font-semibold text-gray-800">{event.title}</h3>
                        </div>
                        {event.description && (
                          <p className="text-sm text-gray-600 mb-2 ml-6">{event.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 ml-6">
                          {event.date && (
                            <Badge variant="outline" className="text-xs">
                              <Calendar className="w-3 h-3 mr-1" />
                              {format(parseISO(event.date), 'MMM d, yyyy')}
                            </Badge>
                          )}
                          {event.time && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {event.time}
                            </Badge>
                          )}
                          {event.location && (
                            <Badge variant="outline" className="text-xs">
                              <MapPin className="w-3 h-3 mr-1" />
                              {event.location}
                            </Badge>
                          )}
                        </div>
                        {event.url && (
                          <a
                            href={event.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-2 ml-6"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Event Link
                          </a>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteEventMutation.mutate(event.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-gray-400" />
              Past Events ({pastEvents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pastEvents.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No past events</p>
            ) : (
              <div className="space-y-2">
                {pastEvents.map(event => (
                  <div key={event.id} className="p-3 bg-gray-50 rounded-lg border opacity-60">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-600 line-through">{event.title}</h3>
                        {event.date && (
                          <p className="text-xs text-gray-500 mt-1">
                            {format(parseISO(event.date), 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteEventMutation.mutate(event.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AddManualEventModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        userEmail={effectiveEmail}
      />
    </div>
  );
}