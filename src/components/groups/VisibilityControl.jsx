import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function VisibilityControl({ 
  group, 
  selectedLevels = [], 
  selectedEmails = [], 
  onLevelsChange, 
  onEmailsChange,
  className = ""
}) {
  const [searchTerm, setSearchQuery] = useState('');
  
  // Fetch members for selection
  const { data: members = [] } = useQuery({
    queryKey: ['groupMembersSimple', group.id],
    queryFn: async () => {
      // Optimally, backend should support filtering/searching members
      return await base44.entities.CreatorGroupMember.filter({ group_id: group.id, status: 'active' });
    }
  });

  const allLevels = group.member_levels || [];

  const handleLevelToggle = (level) => {
    if (selectedLevels.includes(level)) {
      onLevelsChange(selectedLevels.filter(l => l !== level));
    } else {
      onLevelsChange([...selectedLevels, level]);
    }
  };

  const handleEmailToggle = (email) => {
    if (selectedEmails.includes(email)) {
      onEmailsChange(selectedEmails.filter(e => e !== email));
    } else {
      onEmailsChange([...selectedEmails, email]);
    }
  };

  const isPublic = selectedLevels.length === 0 && selectedEmails.length === 0;

  const filteredMembers = members.filter(m => 
    m.user_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`space-y-3 border p-3 rounded-lg bg-white ${className}`}>
      <Label className="font-semibold mb-2 block">Visibility Settings</Label>
      
      <Tabs defaultValue="levels" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-8">
          <TabsTrigger value="levels" className="text-xs">By Level</TabsTrigger>
          <TabsTrigger value="members" className="text-xs">By Member</TabsTrigger>
        </TabsList>
        
        <TabsContent value="levels" className="space-y-3 pt-3">
          <div className="flex items-center space-x-2 pb-2 border-b">
            <Checkbox 
              id="vis-public" 
              checked={isPublic}
              onCheckedChange={(checked) => {
                if (checked) {
                  onLevelsChange([]);
                  onEmailsChange([]);
                }
              }}
            />
            <Label htmlFor="vis-public" className="cursor-pointer font-bold text-sm">Everyone (Public to Group)</Label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {allLevels.map(level => (
              <div key={level} className="flex items-center space-x-2">
                <Checkbox 
                  id={`vis-lvl-${level}`} 
                  checked={selectedLevels.includes(level)}
                  onCheckedChange={() => handleLevelToggle(level)}
                />
                <Label htmlFor={`vis-lvl-${level}`} className="cursor-pointer text-sm truncate" title={level}>{level}</Label>
              </div>
            ))}
            {allLevels.length === 0 && (
              <p className="text-xs text-gray-400 col-span-2 italic">No levels defined.</p>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="members" className="space-y-3 pt-3">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3 w-3 text-gray-400" />
            <Input 
              placeholder="Search members..." 
              className="h-8 pl-7 text-xs" 
              value={searchTerm}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <ScrollArea className="h-32 border rounded-md p-2">
            <div className="space-y-2">
              {filteredMembers.map(member => (
                <div key={member.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`vis-mem-${member.id}`} 
                    checked={selectedEmails.includes(member.user_email)}
                    onCheckedChange={() => handleEmailToggle(member.user_email)}
                  />
                  <Label htmlFor={`vis-mem-${member.id}`} className="cursor-pointer text-xs truncate w-full">
                    {member.user_email}
                  </Label>
                </div>
              ))}
              {filteredMembers.length === 0 && <p className="text-xs text-gray-400 text-center">No members found.</p>}
            </div>
          </ScrollArea>
          <div className="text-xs text-gray-500 text-right">
            {selectedEmails.length} members selected
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}