import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, User } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm();

  // Fetch user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) throw new Error("Not logged in");
      
      const profiles = await base44.entities.UserProfile.filter({ user_email: user.email });
      // If no profile exists, return a default object or create one
      if (profiles.length === 0) return { user_email: user.email };
      return profiles[0];
    }
  });

  // Reset form when profile loads
  useEffect(() => {
    if (profile) {
      reset(profile);
    }
  }, [profile, reset]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data) => {
        // If profile exists (has id), update it. Otherwise create it.
        if (profile.id) {
            return await base44.entities.UserProfile.update(profile.id, data);
        } else {
            return await base44.entities.UserProfile.create({
                ...data,
                user_email: (await base44.auth.me()).email
            });
        }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
      toast({ title: 'Success', description: 'Profile settings saved successfully' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: 'Failed to save profile: ' + error.message, variant: 'destructive' });
    }
  });

  const onSubmit = (data) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent">Settings & Profile</h1>
        <p className="text-gray-500 mt-1">Manage your account preferences and profile details</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>How you appear to others in the community</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="real_name">Real Name</Label>
                <Input id="real_name" {...register('real_name')} placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nickname">Nickname</Label>
                <Input id="nickname" {...register('nickname')} placeholder="What should we call you?" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" {...register('phone')} placeholder="+1 (555) 000-0000" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Input id="occupation" {...register('occupation')} placeholder="What do you do?" />
            </div>

             <div className="space-y-2">
              <Label htmlFor="creator_notes">Creator Bio / Notes</Label>
              <Textarea 
                id="creator_notes" 
                {...register('creator_notes')} 
                placeholder="Tell us a bit about yourself..." 
                className="h-24"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Social Media</CardTitle>
            <CardDescription>Connect your social accounts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label htmlFor="tiktok_username">TikTok Username</Label>
                <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-500">@</span>
                    <Input id="tiktok_username" {...register('tiktok_username')} className="pl-8" placeholder="username" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="social_links.instagram">Instagram URL</Label>
                <Input id="social_links.instagram" {...register('social_links.instagram')} placeholder="https://instagram.com/..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="social_links.youtube">YouTube URL</Label>
                <Input id="social_links.youtube" {...register('social_links.youtube')} placeholder="https://youtube.com/..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="social_links.website">Website</Label>
                <Input id="social_links.website" {...register('social_links.website')} placeholder="https://yourwebsite.com" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Customize your experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="favorite_color">Favorite Color</Label>
                    <div className="flex gap-2">
                        <Input id="favorite_color" type="color" {...register('favorite_color')} className="w-12 h-10 p-1" />
                        <Input {...register('favorite_color')} placeholder="#000000" className="flex-1" />
                    </div>
                </div>
            </CardContent>
        </Card>

        <div className="sticky bottom-6 flex justify-end">
            <Button type="submit" size="lg" disabled={updateMutation.isPending} className="bg-teal-600 hover:bg-teal-700 shadow-xl">
                {updateMutation.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                Save Changes
            </Button>
        </div>
      </form>
    </div>
  );
}