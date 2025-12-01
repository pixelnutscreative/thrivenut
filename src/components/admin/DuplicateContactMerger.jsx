import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Merge, Trash2, Loader2, CheckCircle, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

export default function DuplicateContactMerger() {
  const queryClient = useQueryClient();
  const [selectedDuplicates, setSelectedDuplicates] = useState({});
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [currentMergeGroup, setCurrentMergeGroup] = useState(null);
  const [merging, setMerging] = useState(false);
  const [mergeResults, setMergeResults] = useState([]);

  // Fetch all contacts
  const { data: allContacts = [], isLoading } = useQuery({
    queryKey: ['allContactsForMerge'],
    queryFn: () => base44.entities.TikTokContact.list('username', 1000),
  });

  // Find duplicates by username (case-insensitive)
  const findDuplicates = () => {
    const usernameMap = {};
    
    allContacts.forEach(contact => {
      const username = (contact.username || contact.data?.username || '').toLowerCase().trim();
      if (!username) return;
      
      if (!usernameMap[username]) {
        usernameMap[username] = [];
      }
      usernameMap[username].push(contact);
    });

    // Only return groups with more than 1 contact
    return Object.entries(usernameMap)
      .filter(([_, contacts]) => contacts.length > 1)
      .map(([username, contacts]) => ({
        username,
        contacts: contacts.sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date))
      }));
  };

  const duplicateGroups = findDuplicates();

  // Merge contacts - keep the most complete one
  const mergeContacts = async (contacts, primaryId) => {
    setMerging(true);
    try {
      const primary = contacts.find(c => c.id === primaryId);
      const others = contacts.filter(c => c.id !== primaryId);

      // Merge data from all contacts into primary
      // Keep non-empty values from other contacts if primary is empty
      const mergedData = { ...primary.data };
      
      for (const other of others) {
        const otherData = other.data || {};
        
        // For each field, if primary is empty/null but other has value, use other's value
        Object.keys(otherData).forEach(key => {
          const primaryVal = mergedData[key];
          const otherVal = otherData[key];
          
          // Skip if other value is empty
          if (otherVal === null || otherVal === undefined || otherVal === '') return;
          
          // If primary is empty, use other's value
          if (primaryVal === null || primaryVal === undefined || primaryVal === '') {
            mergedData[key] = otherVal;
          }
          
          // For arrays, merge unique values
          if (Array.isArray(primaryVal) && Array.isArray(otherVal)) {
            mergedData[key] = [...new Set([...primaryVal, ...otherVal])];
          }
          
          // For objects (like social_links), merge
          if (typeof primaryVal === 'object' && typeof otherVal === 'object' && !Array.isArray(primaryVal)) {
            mergedData[key] = { ...otherVal, ...primaryVal };
          }
        });
      }

      // Update primary with merged data
      await base44.entities.TikTokContact.update(primaryId, mergedData);

      // Delete other contacts
      for (const other of others) {
        await base44.entities.TikTokContact.delete(other.id);
      }

      setMergeResults(prev => [...prev, { 
        username: primary.username || primary.data?.username, 
        merged: others.length, 
        success: true 
      }]);

      queryClient.invalidateQueries({ queryKey: ['allContactsForMerge'] });
      queryClient.invalidateQueries({ queryKey: ['allTiktokContacts'] });
      queryClient.invalidateQueries({ queryKey: ['tiktokContacts'] });
      
      setMergeDialogOpen(false);
      setCurrentMergeGroup(null);
    } catch (error) {
      console.error('Merge error:', error);
      setMergeResults(prev => [...prev, { 
        username: currentMergeGroup?.username, 
        error: error.message, 
        success: false 
      }]);
    }
    setMerging(false);
  };

  const openMergeDialog = (group) => {
    setCurrentMergeGroup(group);
    setSelectedDuplicates({ [group.username]: group.contacts[0].id }); // Default to most recently updated
    setMergeDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          <span className="ml-2">Loading contacts...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Duplicate Contact Merger
          </CardTitle>
          <CardDescription>
            Found {duplicateGroups.length} username(s) with duplicate records. 
            Merging will combine data and keep the most complete record.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {duplicateGroups.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p>No duplicate contacts found! All usernames are unique.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {duplicateGroups.map(group => (
                <div key={group.username} className="border rounded-lg p-4 bg-amber-50 border-amber-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-medium">@{group.username}</span>
                      <Badge variant="destructive" className="ml-2">
                        {group.contacts.length} duplicates
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => openMergeDialog(group)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Merge className="w-4 h-4 mr-1" />
                      Review & Merge
                    </Button>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Created by: {group.contacts.map(c => c.created_by).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Merge Results */}
          {mergeResults.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Recent Merges:</h4>
              {mergeResults.map((result, idx) => (
                <div key={idx} className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                  {result.success 
                    ? `✓ @${result.username}: Merged ${result.merged} duplicate(s)`
                    : `✗ @${result.username}: ${result.error}`
                  }
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Merge Dialog */}
      <Dialog open={mergeDialogOpen} onOpenChange={setMergeDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Merge Duplicate Contacts
            </DialogTitle>
            <DialogDescription>
              Select which record to keep as primary. Data from other records will be merged in.
            </DialogDescription>
          </DialogHeader>

          {currentMergeGroup && (
            <div className="space-y-3 py-4">
              <p className="font-medium">@{currentMergeGroup.username}</p>
              
              {currentMergeGroup.contacts.map((contact, idx) => {
                const data = contact.data || {};
                const isSelected = selectedDuplicates[currentMergeGroup.username] === contact.id;
                
                return (
                  <div 
                    key={contact.id}
                    onClick={() => setSelectedDuplicates({ 
                      ...selectedDuplicates, 
                      [currentMergeGroup.username]: contact.id 
                    })}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      isSelected ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox checked={isSelected} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{data.display_name || 'No display name'}</span>
                          {idx === 0 && <Badge className="bg-green-100 text-green-700">Most Recent</Badge>}
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>Created by: {contact.created_by}</p>
                          <p>Updated: {new Date(contact.updated_date).toLocaleString()}</p>
                          <p>Phonetic: {data.phonetic || 'Not set'}</p>
                          <p>Roles: {(data.role || []).length > 0 ? data.role.join(', ') : 'None'}</p>
                          <p>Clubs: {(data.clubs || []).length > 0 ? data.clubs.join(', ') : 'None'}</p>
                          <p>Notes: {data.tiktok_notes_text ? 'Has notes' : 'No notes'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setMergeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => mergeContacts(currentMergeGroup.contacts, selectedDuplicates[currentMergeGroup.username])}
              disabled={merging || !selectedDuplicates[currentMergeGroup?.username]}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {merging ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Merging...</>
              ) : (
                <><Merge className="w-4 h-4 mr-2" /> Merge & Keep Selected</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}