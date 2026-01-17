import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Gift, Calendar, Heart, Award, Star, History } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, addDays, subDays, isSameDay, parseISO, isWithinInterval, startOfDay } from 'date-fns';

export default function SpecialDatesWidget({ userEmail, tiktokContacts = [] }) {
  const [viewMode, setViewMode] = useState('upcoming'); // 'recent', 'today', 'upcoming'
  const [daysAhead, setDaysAhead] = useState("30");
  const [daysBack, setDaysBack] = useState("30");

  const { data: familyMembers = [] } = useQuery({
    queryKey: ['familyMembers', userEmail],
    queryFn: () => base44.entities.FamilyMember.filter({ created_by: userEmail }),
    enabled: !!userEmail,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2,
  });

  // Merge contacts and standardize fields
  const allContacts = [
    ...tiktokContacts.map(c => ({
      id: c.id,
      name: c.real_name || c.display_name || c.nickname || c.username,
      photo_url: c.image_url,
      birthday: c.birthday,
      sobriety_date: c.sobriety_date,
      moments: c.moments || [],
      source: 'contact'
    })),
    ...familyMembers.map(f => ({
      id: f.id,
      name: f.name || f.nickname,
      photo_url: f.profile_image_url,
      birthday: f.birthday,
      sobriety_date: f.sobriety_date,
      moments: f.memorable_moments || [], // FamilyMember uses memorable_moments
      source: 'family'
    }))
  ];

  const getEvents = () => {
    const today = startOfDay(new Date());
    const events = [];

    // Define range based on viewMode
    let rangeStart, rangeEnd;
    
    if (viewMode === 'upcoming') {
      rangeStart = today;
      rangeEnd = addDays(today, parseInt(daysAhead));
    } else if (viewMode === 'recent') {
      rangeStart = subDays(today, parseInt(daysBack));
      rangeEnd = subDays(today, 1); // Yesterday
    } else {
      // Today
      rangeStart = today;
      rangeEnd = today;
    }

    allContacts.forEach(contact => {
      // Helper to process date fields
      const processDate = (dateStr, type, label) => {
        if (!dateStr) return;
        
        // Manual parse to prevent timezone shifts (treat YYYY-MM-DD as local date)
        let originalDate;
        if (dateStr.includes('T')) {
          originalDate = parseISO(dateStr);
        } else {
          const [y, m, d] = dateStr.split('-').map(Number);
          originalDate = new Date(y, m - 1, d);
        }

        const currentYear = today.getFullYear();
        const yearsToCheck = [currentYear - 1, currentYear, currentYear + 1];
        
        yearsToCheck.forEach(year => {
          const occurrence = new Date(year, originalDate.getMonth(), originalDate.getDate());
          
          if (isWithinInterval(occurrence, { start: rangeStart, end: rangeEnd })) {
             if (!events.some(e => e.contact.id === contact.id && e.type === type && isSameDay(e.date, occurrence))) {
               events.push({
                 contact,
                 date: occurrence,
                 originalDate,
                 type,
                 label
               });
             }
          }
        });
      };

      processDate(contact.birthday, 'birthday', 'Birthday');
      processDate(contact.sobriety_date, 'sobriety', 'Sobriety Anniversary');
      
      // Process moments
      if (contact.moments && Array.isArray(contact.moments)) {
        contact.moments.forEach(moment => {
           if (moment.date && (moment.is_special_date || moment.type === 'milestone')) {
             processDate(moment.date, 'moment', moment.title || 'Special Day');
           }
        });
      }
    });
    
    return events.sort((a, b) => {
      return viewMode === 'recent' ? b.date - a.date : a.date - b.date;
    });
  };

  const events = getEvents();

  const getIcon = (type) => {
    switch (type) {
      case 'birthday': return <Gift className="w-4 h-4 text-pink-500" />;
      case 'sobriety': return <Award className="w-4 h-4 text-purple-500" />;
      case 'moment': 
      case 'milestone': 
        return <Star className="w-4 h-4 text-amber-500" />;
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
                onClick={() => setViewMode('recent')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'recent' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Recent
              </button>
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
        
        {viewMode !== 'today' && (
           <div className="flex items-center gap-2 mt-2 justify-end">
             <span className="text-xs text-gray-500">{viewMode === 'recent' ? 'Show past:' : 'Show next:'}</span>
             <Select 
               value={viewMode === 'recent' ? daysBack : daysAhead} 
               onValueChange={viewMode === 'recent' ? setDaysBack : setDaysAhead}
             >
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
            {viewMode === 'today' ? 'No special dates today.' : 
             viewMode === 'recent' ? 'No recent special dates.' : 'No upcoming special dates found.'}
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event, idx) => (
              <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border hover:shadow-sm transition-shadow ${isSameDay(event.date, new Date()) ? 'bg-purple-50 border-purple-100' : 'bg-gray-50'}`}>
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