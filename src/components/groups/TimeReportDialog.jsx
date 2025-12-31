import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileDown, ArrowUpDown, Filter, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function TimeReportDialog({ isOpen, onClose, groupId }) {
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [userFilter, setUserFilter] = useState('all');

  // Fetch Projects first to map IDs to titles
  const { data: projects = [] } = useQuery({
    queryKey: ['groupProjects', groupId],
    queryFn: () => base44.entities.GroupProject.filter({ group_id: groupId }),
    enabled: !!groupId && isOpen
  });

  // Fetch Time Entries for all projects
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['groupTimeEntries', groupId],
    queryFn: async () => {
      if (!projects.length) return [];
      const promises = projects.map(p => base44.entities.TimeEntry.filter({ project_id: p.id }));
      const results = await Promise.all(promises);
      return results.flat();
    },
    enabled: !!groupId && isOpen && projects.length > 0
  });

  // Fetch Group Members for filter
  const { data: members = [] } = useQuery({
    queryKey: ['groupMembers', groupId],
    queryFn: () => base44.entities.CreatorGroupMember.filter({ group_id: groupId }),
    enabled: !!groupId && isOpen
  });

  // Unique users who have logged time
  const usersWithTime = useMemo(() => {
    const emails = new Set(entries.map(e => e.user_email));
    return Array.from(emails);
  }, [entries]);

  const sortedAndFilteredEntries = useMemo(() => {
    let result = [...entries];

    // Filter
    if (userFilter !== 'all') {
      result = result.filter(e => e.user_email === userFilter);
    }

    // Sort
    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Handle project title sorting
      if (sortField === 'project') {
        valA = projects.find(p => p.id === a.project_id)?.title || '';
        valB = projects.find(p => p.id === b.project_id)?.title || '';
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [entries, sortField, sortDirection, userFilter, projects]);

  const totalHours = sortedAndFilteredEntries.reduce((sum, e) => sum + (e.hours || 0), 0);

  const handleHeaderClick = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc'); // Default to newest/highest
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.text("Time Report", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 14, 28);
    doc.text(`Total Hours: ${totalHours.toFixed(2)}h`, 14, 34);

    // Filter Info
    if (userFilter !== 'all') {
      doc.text(`Filtered by User: ${userFilter}`, 14, 40);
    }

    // Table Data
    const tableData = sortedAndFilteredEntries.map(e => {
      const project = projects.find(p => p.id === e.project_id);
      return [
        format(new Date(e.date), 'MMM d, yyyy'),
        e.user_email,
        project?.title || 'Unknown Project',
        e.description || '-',
        `${e.hours.toFixed(2)}h`
      ];
    });

    doc.autoTable({
      startY: 45,
      head: [['Date', 'User', 'Project', 'Description', 'Hours']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [124, 58, 237] }, // Purple header
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 40 },
        2: { cellWidth: 40 },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 20, halign: 'right' }
      }
    });

    // Summary Section by Project
    const projectSummary = {};
    sortedAndFilteredEntries.forEach(e => {
      const pName = projects.find(p => p.id === e.project_id)?.title || 'Unknown';
      projectSummary[pName] = (projectSummary[pName] || 0) + e.hours;
    });

    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("Summary by Project", 14, 20);

    const summaryData = Object.entries(projectSummary).map(([name, hours]) => [name, `${hours.toFixed(2)}h`]);
    
    doc.autoTable({
      startY: 25,
      head: [['Project', 'Total Hours']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [75, 85, 99] },
      columnStyles: {
        1: { cellWidth: 30, halign: 'right' }
      }
    });

    doc.save(`TimeReport_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" /> Time Report
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-4 bg-gray-50 p-4 rounded-lg border">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Time</span>
            <span className="text-3xl font-bold text-gray-900">{totalHours.toFixed(2)}<span className="text-lg text-gray-500 ml-1">hours</span></span>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 flex-1 sm:flex-none">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-[180px] bg-white">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {usersWithTime.map(email => (
                    <SelectItem key={email} value={email}>{email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={exportPDF} variant="outline" className="bg-white">
              <FileDown className="w-4 h-4 mr-2" /> Export PDF
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto border rounded-md bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b sticky top-0 z-10">
              <tr>
                <SortableHeader label="Date" field="date" currentSort={sortField} currentDir={sortDirection} onClick={handleHeaderClick} />
                <SortableHeader label="User" field="user_email" currentSort={sortField} currentDir={sortDirection} onClick={handleHeaderClick} />
                <SortableHeader label="Project" field="project" currentSort={sortField} currentDir={sortDirection} onClick={handleHeaderClick} />
                <th className="p-3 text-left font-medium text-gray-500">Description</th>
                <SortableHeader label="Hours" field="hours" currentSort={sortField} currentDir={sortDirection} onClick={handleHeaderClick} align="right" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading time entries...</td></tr>
              ) : sortedAndFilteredEntries.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No time entries found.</td></tr>
              ) : (
                sortedAndFilteredEntries.map((entry, i) => {
                  const project = projects.find(p => p.id === entry.project_id);
                  return (
                    <tr key={i} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="p-3 whitespace-nowrap text-gray-600">
                        {format(new Date(entry.date), 'MMM d, yyyy')}
                      </td>
                      <td className="p-3 whitespace-nowrap font-medium text-gray-900">
                        {entry.user_email}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          {project?.title || 'Unknown'}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600 max-w-xs truncate" title={entry.description}>
                        {entry.description || '-'}
                      </td>
                      <td className="p-3 text-right font-mono font-medium text-gray-900">
                        {entry.hours.toFixed(2)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SortableHeader({ label, field, currentSort, currentDir, onClick, align = 'left' }) {
  return (
    <th 
      className={`p-3 text-${align} font-medium text-gray-500 cursor-pointer hover:text-gray-700 hover:bg-gray-100 transition-colors select-none`}
      onClick={() => onClick(field)}
    >
      <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : ''}`}>
        {label}
        {currentSort === field && (
          <ArrowUpDown className={`w-3 h-3 ${currentDir === 'asc' ? 'transform rotate-180' : ''}`} />
        )}
      </div>
    </th>
  );
}