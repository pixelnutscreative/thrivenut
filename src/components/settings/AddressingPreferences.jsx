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
        <CardDescription>Select your preference for personalized language (user, you, etc.)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Label htmlFor="address-as">Used for personalized language (e.g. your username, etc.)</Label>
        <Select value={formData.address_as || 'you'} onValueChange={(v) => setFormData({ ...formData, address_as: v })}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select how the AI should address you" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="you">You</SelectItem>
            <SelectItem value="nickname">My Nickname (e.g. {formData.nickname || 'Thrive user'})</SelectItem>
            <SelectItem value="full_name">My Full Name (e.g. {formData.full_name || 'Thrive User'})</SelectItem>
            <SelectItem value="my_love">My Love</SelectItem>
            <SelectItem value="darling">Darling</SelectItem>
            <SelectItem value="sweetie">Sweetie</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}