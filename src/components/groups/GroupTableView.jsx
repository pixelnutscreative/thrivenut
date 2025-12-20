import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Trash2, MoreHorizontal, Settings } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';

export default function GroupTableView({ groups, myMemberships, onDelete, onToggleVisibility, hiddenGroupIds = [] }) {
  const navigate = useNavigate();
  const [selectedIds, setSelectedIds] = useState([]);

  const toggleSelectAll = () => {
    if (selectedIds.length === groups.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(groups.map(g => g.id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="p-4 border-b flex justify-between items-center bg-gray-50">
        <div className="text-sm text-gray-500">
          {selectedIds.length} selected
        </div>
        {selectedIds.length > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onToggleVisibility(selectedIds, true)}>
              <EyeOff className="w-4 h-4 mr-2" /> Hide Selected
            </Button>
            <Button variant="destructive" size="sm" onClick={() => onDelete(selectedIds)}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete Selected
            </Button>
          </div>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox 
                checked={selectedIds.length === groups.length && groups.length > 0} 
                onCheckedChange={toggleSelectAll} 
              />
            </TableHead>
            <TableHead>Group Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Visibility</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map(group => {
            const membership = myMemberships.find(m => m.group_id === group.id);
            const isOwner = membership?.role === 'owner';
            const isHidden = hiddenGroupIds.includes(group.id);

            return (
              <TableRow key={group.id} className="hover:bg-gray-50">
                <TableCell>
                  <Checkbox 
                    checked={selectedIds.includes(group.id)} 
                    onCheckedChange={() => toggleSelect(group.id)} 
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs bg-gray-100 text-gray-600`}>
                      {group.logo_url ? <img src={group.logo_url} alt="" className="w-full h-full object-cover rounded-lg" /> : group.name[0]}
                    </div>
                    <div>
                      <div className="font-medium cursor-pointer hover:text-purple-600 hover:underline" onClick={() => navigate(`/creator-groups?id=${group.id}`)}>
                        {group.name}
                      </div>
                      <div className="text-xs text-gray-500">{group.description || 'No description'}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">{group.type}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={isOwner ? "default" : "outline"} className={isOwner ? "bg-purple-100 text-purple-700 border-purple-200" : ""}>
                    {membership?.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => onToggleVisibility([group.id], !isHidden)}>
                    {isHidden ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-green-500" />}
                    <span className="ml-2 text-xs">{isHidden ? 'Hidden' : 'Visible'}</span>
                  </Button>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/creator-groups?id=${group.id}`)}>
                        View Dashboard
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/creator-groups?id=${group.id}&tab=settings`)}>
                        Settings
                      </DropdownMenuItem>
                      {isOwner && (
                        <>
                          <DropdownMenuItem className="text-red-600" onClick={() => onDelete([group.id])}>
                            Delete Group
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
          {groups.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                No groups found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}