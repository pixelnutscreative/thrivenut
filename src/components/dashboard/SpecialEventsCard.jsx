import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cake, Heart, ExternalLink } from 'lucide-react';
import { format, parseISO, differenceInYears } from 'date-fns';

export default function SpecialEventsCard({ contacts = [] }) {
  const today = format(new Date(), 'MM-dd');
  
  // Find contacts with birthdays or sobriety anniversaries today
  const todayEvents = [];
  
  contacts.forEach(contact => {
    // Check birthday
    if (contact.birthday) {
      const birthdayMMDD = contact.birthday.slice(5); // Get MM-DD part
      if (birthdayMMDD === today) {
        const age = differenceInYears(new Date(), parseISO(contact.birthday));
        todayEvents.push({
          type: 'birthday',
          contact,
          age,
          label: `🎂 ${contact.display_name || '@' + contact.username} turns ${age} today!`
        });
      }
    }
    
    // Check sobriety anniversary
    if (contact.is_in_recovery && contact.sobriety_date) {
      const sobrietyMMDD = contact.sobriety_date.slice(5);
      if (sobrietyMMDD === today) {
        const years = differenceInYears(new Date(), parseISO(contact.sobriety_date));
        if (years > 0) {
          todayEvents.push({
            type: 'sobriety',
            contact,
            years,
            label: `💜 ${contact.display_name || '@' + contact.username} celebrates ${years} year${years !== 1 ? 's' : ''} of sobriety!`
          });
        }
      }
    }
  });

  if (todayEvents.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <span>🎉</span>
          Today's Special Events
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {todayEvents.map((event, idx) => (
          <div 
            key={idx}
            className={`p-3 rounded-lg flex items-center justify-between ${
              event.type === 'birthday' 
                ? 'bg-pink-100 border border-pink-200' 
                : 'bg-purple-100 border border-purple-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {event.type === 'birthday' ? (
                <Cake className="w-5 h-5 text-pink-600" />
              ) : (
                <Heart className="w-5 h-5 text-purple-600" />
              )}
              <div>
                <p className="font-medium text-gray-800">{event.label}</p>
                <p className="text-xs text-gray-500">@{event.contact.username}</p>
              </div>
            </div>
            <button
              onClick={() => window.open(`https://tiktok.com/@${event.contact.username}`, '_blank')}
              className="p-2 hover:bg-white/50 rounded-full transition-colors"
              title="Visit TikTok Profile"
            >
              <ExternalLink className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}