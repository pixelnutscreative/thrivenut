import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function DigitalTwinGallery({ mode = 'gallery', customTrigger }) {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  // Fetch digital twin images from CreatorPortfolio
  const { data: twins = [], isLoading } = useQuery({
    queryKey: ['digitalTwins'],
    queryFn: async () => {
      const portfolios = await base44.entities.CreatorPortfolio.list('-created_date', 100);
      return portfolios.filter(p => p.tags?.includes('digital_twin'));
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData) => {
      const file = formData.get('file');
      const prompt = formData.get('prompt');
      const description = formData.get('description');

      // 1. Upload file
      setIsUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // 2. Create portfolio item
      const user = await base44.auth.me();
      await base44.entities.CreatorPortfolio.create({
        creator_email: user.email,
        creator_name: user.full_name,
        title: 'My Digital Twin',
        description: description,
        content_type: 'image',
        image_urls: [file_url],
        text_content: prompt, 
        tags: ['digital_twin'],
        approval_status: 'approved',
        is_featured: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['digitalTwins']);
      setIsUploadOpen(false);
      setIsUploading(false);
      updateUserFlag();
      toast({ title: 'Success', description: 'Digital twin uploaded!' });
    },
    onError: (error) => {
      setIsUploading(false);
      toast({ title: 'Error', description: 'Failed to upload: ' + error.message, variant: 'destructive' });
    }
  });

  const updateUserFlag = async () => {
     try {
         const user = await base44.auth.me();
         const platformUsers = await base44.entities.AIPlatformUser.filter({ user_email: user.email });
         if (platformUsers.length > 0 && !platformUsers[0].has_digital_twin) {
             await base44.entities.AIPlatformUser.update(platformUsers[0].id, { has_digital_twin: true });
             queryClient.invalidateQueries(['aiPlatformUser']);
         }
     } catch (e) {
         console.error("Failed to update flag", e);
     }
  };

  const handleUpload = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    uploadMutation.mutate(formData);
  };

  const UploadDialog = (
    <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
      <DialogTrigger asChild>
        {customTrigger || (
          <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg">
            <Upload className="w-4 h-4 mr-2" /> Upload Your Twin
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Digital Twin</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleUpload} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="file">Image File</Label>
            <Input id="file" name="file" type="file" accept="image/*" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt Used (Optional)</Label>
            <Textarea id="prompt" name="prompt" placeholder="The prompt you used to generate this..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description / Notes</Label>
            <Input id="description" name="description" placeholder="Any extra details..." />
          </div>
          <Button type="submit" disabled={isUploading} className="w-full bg-blue-600">
            {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Upload'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );

  if (mode === 'upload') {
    return UploadDialog;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Digital Twin Gallery</h2>
           <p className="text-gray-500">See the digital clones of our community members!</p>
        </div>
        {UploadDialog}
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <ScrollArea className="h-[500px] w-full rounded-md border p-4 bg-gray-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {twins.map((twin) => (
              <Card key={twin.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 border-none bg-white/80 backdrop-blur">
                <div className="aspect-square relative group">
                  <img 
                    src={twin.image_urls?.[0]} 
                    alt={twin.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Sparkles className="text-white w-8 h-8" />
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-gray-800 truncate">{twin.creator_name}'s Twin</h3>
                  {twin.text_content && (
                    <div className="mt-2 text-xs text-gray-500 bg-gray-100 p-2 rounded italic line-clamp-3">
                      "{twin.text_content}"
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
             {twins.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-400">
                    <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No digital twins uploaded yet. Be the first!</p>
                </div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}