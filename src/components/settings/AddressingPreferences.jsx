import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from 'lucide-react';

export default function AddressingPreferences({ formData, setFormData }) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4" /> How should I address you?</CardTitle>
        <CardDescription>Select your preference for personalized language</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Label htmlFor="address-as">Used for personalized language</Label>
        <Select value={formData.address_as || 'Queen'} onValueChange={(v) => setFormData({ ...formData, address_as: v })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select how the AI should address you" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Queen">Queen</SelectItem>
            <SelectItem value="King">King</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}