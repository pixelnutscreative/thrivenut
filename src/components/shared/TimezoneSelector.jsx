import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const commonTimezones = [
  // US & Canada
  { value: 'America/New_York', label: 'Eastern Standard Time (EST)' },
  { value: 'America/Chicago', label: 'Central Standard Time (CST)' },
  { value: 'America/Denver', label: 'Mountain Standard Time (MST)' },
  { value: 'America/Phoenix', label: 'Arizona Time (MST - No DST)' },
  { value: 'America/Los_Angeles', label: 'Pacific Standard Time (PST)' },
  { value: 'America/Anchorage', label: 'Alaska Standard Time (AKST)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii-Aleutian Time (HST)' },
  
  // Europe
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Europe/Berlin', label: 'Central European Time (CET)' },
  { value: 'Europe/Rome', label: 'Central European Time (CET)' },
  { value: 'Europe/Madrid', label: 'Central European Time (CET)' },
  { value: 'Europe/Athens', label: 'Eastern European Time (EET)' },
  { value: 'Europe/Moscow', label: 'Moscow Standard Time (MSK)' },
  
  // Asia
  { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)' },
  { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
  { value: 'Asia/Bangkok', label: 'Indochina Time (ICT)' },
  { value: 'Asia/Singapore', label: 'Singapore Time (SGT)' },
  { value: 'Asia/Shanghai', label: 'China Standard Time (CST)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Asia/Seoul', label: 'Korea Standard Time (KST)' },
  
  // Australia & Pacific
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AEST)' },
  { value: 'Australia/Melbourne', label: 'Australian Eastern Time (AEST)' },
  { value: 'Australia/Brisbane', label: 'Australian Eastern Time (AEST - No DST)' },
  { value: 'Australia/Perth', label: 'Australian Western Time (AWST)' },
  { value: 'Pacific/Auckland', label: 'New Zealand Time (NZST)' },
  
  // Latin America
  { value: 'America/Mexico_City', label: 'Central Standard Time (CST - Mexico)' },
  { value: 'America/Sao_Paulo', label: 'Brasilia Time (BRT)' },
  { value: 'America/Buenos_Aires', label: 'Argentina Time (ART)' },
  
  // Africa
  { value: 'Africa/Cairo', label: 'Eastern European Time (EET)' },
  { value: 'Africa/Johannesburg', label: 'South Africa Standard Time (SAST)' },
  { value: 'Africa/Lagos', label: 'West Africa Time (WAT)' },
];

export default function TimezoneSelector({ value, onChange, label }) {
  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select timezone" />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {commonTimezones.map((tz) => (
            <SelectItem key={tz.value} value={tz.value}>
              {tz.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}