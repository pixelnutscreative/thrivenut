import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Gift, Calendar, Heart, Award, Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, addDays, isSameDay, parseISO, isWithinInterval } from 'date-fns';

export default function SpecialDatesWidget({ userEmail }) {
  const [viewMode, setViewMode] = useState('upcoming'); // 'today' or 'upcoming'
  const [daysAhead, setDaysAhead] = useState("7");

  const { data: contacts = [] } = useQuery({
    queryKey: ['personalContacts', userEmail],
    queryFn: () => base44.entities.PersonalContact.filter({ created_by: userEmail }),
    enabled: !!userEmail,
  });

  const getUpcomingDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endDate = addDays(today, parseInt(daysAhead));
    
    const events = [];

    contacts.forEach(contact => {
      // Helper to process date fields
      const processDate = (dateStr, type, label) => {
        if (!dateStr) return;
        
        // Parse the original date (e.g., birthday year)
        const originalDate = parseISO(dateStr);
        // Create a date object for *this year* to check upcoming
        const currentYearDate = new Date(today.getFullYear(), originalDate.getMonth(), originalDate.getDate());
        
        // If date passed this year, look at next year
        if (currentYearDate < today && !isSameDay(currentYearDate, today)) {
          currentYearDate.setFullYear(today.getFullYear() + 1);
        }

        if (viewMode === 'today') {
           if (isSameDay(currentYearDate, today)) {
             events.push({
               contact,
               date: currentYearDate,
               originalDate,
               type,
               label
             });
           }
        } else {
           // Upcoming
           if (isWithinInterval(currentYearDate, { start: today, end: endDate })) {
             events.push({
                contact,
                date: currentYearDate,
                originalDate,
                type,
                label
             });
           }
        }
      };

      processDate(contact.birthday, 'birthday', 'Birthday');
      processDate(contact.sobriety_date, 'sobriety', 'Sobriety Anniversary');
      
      // Process moments
      if (contact.moments && Array.isArray(contact.moments)) {
        contact.moments.forEach(moment => {
           if (moment.date) {
             processDate(moment.date, 'moment', moment.title || 'Special Moment');
           }
        });
      }
    });

    return events.sort((a, b) => a.date - b.date);
  };

  const events = getUpcomingDates();

  const getIcon = (type) => {
    switch (type) {
      case 'birthday': return <Gift className="w-4 h-4 text-pink-500" />;
      case 'sobriety': return <Award className="w-4 h-4 text-purple-500" />;
      case 'moment': return <Star className="w-4 h-4 text-amber-500" />;
      default: return <Heart className="w-4 h-4 text-red-500" />;
    }
  };

  const getYears = (date, originalDate) => {
    const years = date.getFullYear() - originalDate.getFullYear();
    if (years <= 0) return '';
    return `(${years} years)`;
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="w-5 h-5 text-purple-600" />
            Special Dates
          </CardTitle>
          <div className="flex gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('today')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'today' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setViewMode('upcoming')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'upcoming' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Upcoming
              </button>
            </div>
          </div>
        </div>
        {viewMode === 'upcoming' && (
           <div className="flex items-center gap-2 mt-2">
             <span className="text-xs text-gray-500">Show next:</span>
             <Select value={daysAhead} onValueChange={setDaysAhead}>
               <SelectTrigger className="h-7 w-24 text-xs">
                 <SelectValue />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="7">7 Days</SelectItem>
                 <SelectItem value="14">14 Days</SelectItem>
                 <SelectItem value="30">30 Days</SelectItem>
                 <SelectItem value="60">60 Days</SelectItem>
               </SelectContent>
             </Select>
           </div>
        )}
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            {viewMode === 'today' ? 'No special dates today.' : 'No upcoming special dates found.'}
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-3">
                  {event.contact.photo_url ? (
                    <img 
                      src={event.contact.photo_url} 
                      alt={event.contact.name} 
                      className="w-10 h-10 rounded-full object-cover border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold border border-purple-200">
                      {event.contact.name?.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-sm flex items-center gap-2">
                      {event.contact.name}
                      {getIcon(event.type)}
                    </div>
                    <div className="text-xs text-gray-500 flex gap-1">
                      {event.label} {getYears(event.date, event.originalDate)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={isSameDay(event.date, new Date()) ? "default" : "outline"} className={isSameDay(event.date, new Date()) ? "bg-purple-600" : ""}>
                    {format(event.date, 'MMM d')}
                  </Badge>
                  {!isSameDay(event.date, new Date()) && (
                     <div className="text-[10px] text-gray-400 mt-1">
                       {format(event.date, 'EEE')}
                     </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}