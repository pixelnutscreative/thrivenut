import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, ExternalLink, Loader2 } from 'lucide-react';

export default function MySheets() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const realUserEmail = user?.email ? user.email.toLowerCase() : '';
  const adminEmails = ['pixelnutscreative@gmail.com', 'pixel@thrivenut.app'];
  const isAdmin = realUserEmail && adminEmails.includes(realUserEmail);

  const fetchSheets = async () => {
    const url = 'https://docs.google.com/spreadsheets/d/102aSumJeqOObvkk_g6mNPU-gr6c-eHt6gMxNCdsbV9I/export?format=csv&gid=196794770';
    const res = await base44.functions.invoke('fetchPublicSheetCsv', { url });
    if (res.data?.error) throw new Error(res.data.error);
    return res.data.csv;
  };

  const { data: csvText, isLoading, error } = useQuery({
    queryKey: ['my_sheets_csv'],
    queryFn: fetchSheets,
    enabled: !!isAdmin
  });

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/);
    return lines.map(line => {
      const row = [];
      let cur = '';
      let inQuote = false;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
          if (i < line.length - 1 && line[i+1] === '"') {
            cur += '"'; i++;
          } else {
            inQuote = !inQuote;
          }
        } else if (line[i] === ',' && !inQuote) {
          row.push(cur); cur = '';
        } else {
          cur += line[i];
        }
      }
      row.push(cur);
      return row;
    });
  };

  if (!isAdmin && user) {
    return <div className="p-10 text-center text-slate-500 mt-20">Access Denied: Admin Only</div>;
  }

  if (isLoading || !user) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-[#24C4D6]" /></div>;
  }

  if (error) {
    return <div className="p-10 text-center text-red-500 mt-20">Error loading sheets: {error.message}</div>;
  }

  const rows = parseCSV(csvText || '').slice(1); // skip header
  
  const sections = [];
  let currentSection = { title: 'General', items: [] };

  rows.forEach(row => {
    if (!row || row.length === 0 || row.every(c => !c.trim())) return; // skip blank rows
    const colA = row[0] || '';
    if (colA.startsWith('━━━')) {
      if (currentSection.items.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { title: colA.replace(/━━━/g, '').trim(), items: [] };
    } else {
      const [name, description, url, type, color, status] = row;
      if (name?.trim() || url?.trim()) {
        currentSection.items.push({ name, description, url, type, color, status });
      }
    }
  });
  if (currentSection.items.length > 0 || currentSection.title !== 'General') {
    sections.push(currentSection);
  }

  const getColorStyle = (colorStr) => {
    const c = (colorStr || '').toUpperCase();
    if (c.includes('VIBE DATA FEED')) return { bg: '#24C4D620', text: '#24C4D6' };
    if (c.includes('ACTIVE SYSTEM')) return { bg: '#A7E06320', text: '#85c23d' };
    if (c.includes('CLIENT WORK')) return { bg: '#f9731620', text: '#f97316' }; // orange
    if (c.includes('FINANCIAL')) return { bg: '#C8A4F220', text: '#9333ea' }; // purple
    if (c.includes('ARCHIVE')) return { bg: '#fecaca', text: '#ef4444' }; // soft red
    if (c.includes('INTERNAL ADMIN')) return { bg: '#f1f5f9', text: '#64748b' }; // grey
    return { bg: '#f1f5f9', text: '#64748b' }; // default grey
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-[#24C4D6]/10 rounded-2xl">
            <FileSpreadsheet className="w-8 h-8 text-[#24C4D6]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">My Sheets</h1>
            <p className="text-slate-500 mt-1">Centralized directory of all operational spreadsheets</p>
          </div>
        </div>

        <div className="space-y-12">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-6">
              {section.title && section.title !== 'General' && (
                <h2 className="text-2xl font-bold text-slate-800 border-b border-slate-200 pb-3">{section.title}</h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {section.items.map((item, i) => {
                  const colorStyle = getColorStyle(item.color);
                  return (
                    <Card key={i} className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col">
                      <div className="absolute top-0 left-0 w-1.5 bottom-0" style={{ backgroundColor: colorStyle.text }} />
                      <CardContent className="p-5 pl-6 flex flex-col h-full">
                        <div className="mb-2">
                          <span className="text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider" style={{ backgroundColor: colorStyle.bg, color: colorStyle.text }}>
                            {item.color || 'UNSPECIFIED'}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mt-1">{item.name}</h3>
                        <p className="text-sm text-slate-600 mt-2 flex-grow">{item.description}</p>
                        {item.status && (
                          <p className="text-xs text-slate-400 mt-3 italic">{item.status}</p>
                        )}
                        <div className="mt-5 pt-4 border-t border-slate-100">
                          <Button 
                            className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200" 
                            onClick={() => window.open(item.url, '_blank')}
                            disabled={!item.url}
                          >
                            Open Sheet <ExternalLink className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
          
          {sections.length === 0 && !isLoading && (
            <div className="text-center py-20 text-slate-500">
              No sheets data available or sheet could not be parsed.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}