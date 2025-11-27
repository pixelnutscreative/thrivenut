import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function AdminSettingsContent() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Admin Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="py-8 text-center text-gray-500">
        <p>Admin settings coming soon...</p>
        <p className="text-sm mt-2">App configuration, feature flags, and more.</p>
      </CardContent>
    </Card>
  );
}