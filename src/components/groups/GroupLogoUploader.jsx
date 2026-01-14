import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, X, Image as ImageIcon, Upload, Loader2, RefreshCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function GroupLogoUploader({ group }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const uploadMutation = useMutation({
    mutationFn: async (fileToUpload) => {
      setLoading(true);
      setError(null);
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: fileToUpload });
        return file_url;
      } catch (err) {
        console.error("Upload failed:", err);
        throw new Error('Failed to upload image. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    onSuccess: async (fileUrl) => {
      // Update the CreatorGroup with the new logo_url
      await base44.entities.CreatorGroup.update(group.id, { logo_url: fileUrl });
      queryClient.invalidateQueries(['myGroupsDetails']);
      queryClient.invalidateQueries(['activeGroup', group.id]);
      setFile(null);
      alert('Group logo updated successfully!');
    },
    onError: (err) => {
      setError(err.message || 'An unknown error occurred during upload.');
    }
  });

  const removeLogoMutation = useMutation({
    mutationFn: async () => {
      // Update the CreatorGroup to remove the logo_url
      await base44.entities.CreatorGroup.update(group.id, { logo_url: null });
      queryClient.invalidateQueries(['myGroupsDetails']);
      queryClient.invalidateQueries(['activeGroup', group.id]);
      alert('Group logo removed successfully!');
    },
    onError: (err) => {
      setError(err.message || 'Failed to remove logo.');
    }
  });

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleSubmit = () => {
    if (file) {
      uploadMutation.mutate(file);
    } else {
      setError('Please select an image to upload.');
    }
  };

  const handleRemove = () => {
    if (window.confirm('Are you sure you want to remove the group logo?')) {
      removeLogoMutation.mutate();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Group Logo</CardTitle>
        <CardDescription>Upload a square image to represent your group.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {group.logo_url ? (
          <div className="flex items-center gap-4">
            <img src={group.logo_url} alt="Group Logo" className="w-24 h-24 object-cover rounded-lg border" />
            <div className="space-y-1">
              <p className="text-sm text-gray-700">Current Logo</p>
              <Button variant="outline" size="sm" onClick={handleRemove} disabled={removeLogoMutation.isPending}>
                {removeLogoMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <X className="w-4 h-4 mr-2" />} Remove Logo
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center border border-dashed text-gray-400">
              <ImageIcon className="w-8 h-8" />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="logo-upload" className="sr-only">Upload Logo</Label>
              <Input 
                id="logo-upload" 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                className="w-full"
              />
              <Button onClick={handleSubmit} disabled={!file || uploadMutation.isPending || loading}>
                {loading || uploadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />} Upload Logo
              </Button>
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}