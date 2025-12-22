import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Search, ExternalLink } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function AdminGroupsContent() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: groups = [] } = useQuery({
    queryKey: ['allCreatorGroupsAdmin'],
    queryFn: async () => base44.entities.CreatorGroup.filter({}),
  });

  const toggleDiscovery = useMutation({
    mutationFn: ({ id, allow }) => base44.entities.CreatorGroup.update(id, { allow_public_discovery: allow }),
    onSuccess: () => queryClient.invalidateQueries(['allCreatorGroupsAdmin'])
  });

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return groups;
    return groups.filter(g =>
      (g.name || '').toLowerCase().includes(s) ||
      (g.owner_email || '').toLowerCase().includes(s) ||
      (g.type || '').toLowerCase().includes(s)
    );
  }, [groups, search]);

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Search className="w-4 h-4 text-gray-400" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search groups by name, owner, type..." />
        </div>

        <div className="text-sm text-gray-500">Total groups: {groups.length}</div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Discoverable</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(g => (
              <TableRow key={g.id}>
                <TableCell className="font-medium">{g.name}</TableCell>
                <TableCell>{g.owner_email}</TableCell>
                <TableCell><Badge variant="outline">{g.type || 'community'}</Badge></TableCell>
                <TableCell>
                  <Badge className={g.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                    {g.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {g.allow_public_discovery ? (
                    <Badge className="bg-indigo-100 text-indigo-700">Public</Badge>
                  ) : (
                    <Badge variant="outline">Private</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleDiscovery.mutate({ id: g.id, allow: !g.allow_public_discovery })}
                  >
                    {g.allow_public_discovery ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />} {g.allow_public_discovery ? 'Make Private' : 'Make Public'}
                  </Button>
                  <a href={createPageUrl(`CreatorGroups?id=${g.id}`)} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="sm"><ExternalLink className="w-4 h-4" /></Button>
                  </a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}