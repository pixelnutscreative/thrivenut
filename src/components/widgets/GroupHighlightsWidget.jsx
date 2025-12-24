import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Cake, Award, Calendar, ChevronRight, Gift } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, addDays, isSameDay, parseISO, isWithinInterval, getYear, setYear, isBefore, startOfDay } from 'date-fns';

export default function GroupHighlightsWidget({ userEmail }) {
  const [viewMode, setViewMode] = useState('upcoming'); // 'today' or 'upcoming'
  const [daysAhead, setDaysAhead] = useState(7);

  const { data: contacts = [] } = useQuery({
    queryKey: ['personalContacts', userEmail],
    queryFn: () => base44.entities.PersonalContact.filter({ linked_user_email: userEmail }), // or created_by depending on usage
    enabled: !!userEmail
  });

  const getUpcomingDates = () => {
    const today = startOfDay(new Date());
    const endRange = addDays(today, daysAhead);
    const highlights = [];

    contacts.forEach(contact => {
      // Birthdays
      if (contact.birthday) {
        const bday = parseISO(contact.birthday);
        let nextBday = setYear(bday, getYear(today));
        if (isBefore(nextBday, today)) {
          nextBday = setYear(bday, getYear(today) + 1);
        }
        
        if (viewMode === 'today' && isSameDay(nextBday, today)) {
          highlights.push({
            id: `${contact.id}_bday`,
            contactName: contact.name,
            type: 'birthday',
            date: nextBday,
            label: 'Birthday'
          });
        } else if (viewMode === 'upcoming' && isWithinInterval(nextBday, { start: today, end: endRange })) {
          highlights.push({
            id: `${contact.id}_bday`,
            contactName: contact.name,
            type: 'birthday',
            date: nextBday,
            label: 'Birthday'
          });
        }
      }

      // Sobriety Dates
      if (contact.sobriety_date && contact.is_in_recovery) {
        const sDate = parseISO(contact.sobriety_date);
        let nextSDate = setYear(sDate, getYear(today));
        if (isBefore(nextSDate, today)) {
          nextSDate = setYear(sDate, getYear(today) + 1);
        }
        
        // Years sober
        const years = getYear(nextSDate) - getYear(sDate);

        if (viewMode === 'today' && isSameDay(nextSDate, today)) {
          highlights.push({
            id: `${contact.id}_sobriety`,
            contactName: contact.name,
            type: 'milestone',
            date: nextSDate,
            label: `${years} Year${years !== 1 ? 's' : ''} Sober`
          });
        } else if (viewMode === 'upcoming' && isWithinInterval(nextSDate, { start: today, end: endRange })) {
          highlights.push({
            id: `${contact.id}_sobriety`,
            contactName: contact.name,
            type: 'milestone',
            date: nextSDate,
            label: `${years} Year${years !== 1 ? 's' : ''} Sober`
          });
        }
      }
    });

    return highlights.sort((a, b) => a.date - b.date);
  };

  const highlights = getUpcomingDates();

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Gift className="w-5 h-5 text-pink-500" />
            Highlights
          </CardTitle>
          <div className="flex bg-gray-100 rounded-lg p-1 text-xs">
            <button
              onClick={() => setViewMode('today')}
              className={`px-3 py-1 rounded-md transition-all ${viewMode === 'today' ? 'bg-white shadow text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Today
            </button>
            <button
              onClick={() => setViewMode('upcoming')}
              className={`px-3 py-1 rounded-md transition-all ${viewMode === 'upcoming' ? 'bg-white shadow text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Upcoming
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-[250px] px-6 pb-4">
          {highlights.length > 0 ? (
            <div className="space-y-3 pt-2">
              {highlights.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.type === 'birthday' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                      {item.type === 'birthday' ? <Cake className="w-5 h-5" /> : <Award className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{item.contactName}</p>
                      <p className="text-xs text-gray-500">{item.label}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">
                      {isSameDay(item.date, new Date()) ? 'Today' : format(item.date, 'MMM d')}
                    </p>
                    <p className="text-xs text-gray-400">
                      {isSameDay(item.date, new Date()) ? '🎉' : format(item.date, 'EEEE')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
              <Calendar className="w-8 h-8 mb-2 opacity-50" />
              <p>No highlights {viewMode === 'today' ? 'today' : 'coming up'}</p>
            </div>
          )}
        </ScrollArea>
        {viewMode === 'upcoming' && (
           <div className="px-6 py-2 border-t flex justify-center">
             <select 
               value={daysAhead} 
               onChange={(e) => setDaysAhead(Number(e.target.value))}
               className="text-xs border rounded p-1 bg-gray-50 text-gray-600"
             >
               <option value={7}>Next 7 Days</option>
               <option value={14}>Next 14 Days</option>
               <option value={30}>Next 30 Days</option>
             </select>
           </div>
        )}
      </CardContent>
    </Card>
  );
}