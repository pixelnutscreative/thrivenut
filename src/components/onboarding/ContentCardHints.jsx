import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, X } from 'lucide-react';

export default function ContentCardHints({ section, onDismiss }) {
  const hints = {
    core_fields: {
      title: 'Core Fields',
      content: 'Title, brand, campaign, content type, and intent define your content foundation. These help organize and categorize your work.'
    },
    platform_tabs: {
      title: 'Platform Tabs',
      content: 'Each platform (TikTok, Instagram, etc.) gets its own tab with custom captions, hashtags, and schedule times.'
    },
    script_drawer: {
      title: 'Script & Caption Drawer',
      content: 'Click "View Script & Copy" to write scripts, captions, and SEO keywords without cluttering the main editor.'
    },
    workflow_checklist: {
      title: 'Workflow Checklist',
      content: 'Track your progress with checklists. Check items off as you complete them, and attach tools for quick access.'
    }
  };

  const hint = hints[section];
  if (!hint) return null;

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-blue-900">{hint.title}</p>
              <p className="text-sm text-blue-700 mt-1">{hint.content}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDismiss}
            className="text-blue-600 hover:text-blue-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}