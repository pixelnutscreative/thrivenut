import React, { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';

export default function MemberSelector({ group, selectedUsers = [], onChange }) {
  const [open, setOpen] = useState(false);

  const { data: members = [] } = useQuery({
    queryKey: ['groupMembers', group.id],
    queryFn: async () => {
      const ms = await base44.entities.CreatorGroupMember.filter({ group_id: group.id, status: 'active' });
      return ms.map(m => ({
        label: m.user_email, // Ideally verify if nickname exists but email is safer identifier
        value: m.user_email
      }));
    }
  });

  const handleSelect = (currentValue) => {
    const isSelected = selectedUsers.includes(currentValue);
    let newSelected;
    if (isSelected) {
      newSelected = selectedUsers.filter((value) => value !== currentValue);
    } else {
      newSelected = [...selectedUsers, currentValue];
    }
    onChange(newSelected);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedUsers.map(user => (
            <Badge key={user} variant="secondary" className="pr-1">
                {user}
                <button 
                    className="ml-1 hover:text-red-500" 
                    onClick={() => handleSelect(user)}
                >
                    ×
                </button>
            </Badge>
        ))}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            Select members...
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder="Search member email..." />
            <CommandList>
              <CommandEmpty>No member found.</CommandEmpty>
              <CommandGroup>
                {members.map((member) => (
                  <CommandItem
                    key={member.value}
                    value={member.value}
                    onSelect={() => handleSelect(member.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedUsers.includes(member.value) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {member.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}