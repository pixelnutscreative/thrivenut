import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function BatchModeSuggestion({ cardCount, stepName, onDismiss }) {
  const navigate = useNavigate();

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Target className="w-6 h-6 text-purple-600" />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="font-semibold text-purple-900">Try Batch Mode</p>
                <Badge className="bg-purple-600">{cardCount} cards ready</Badge>
              </div>
              <p className="text-sm text-purple-700 mb-3">
                You have {cardCount} content cards at the "{stepName}" step. Batch Mode lets you process them all at once—perfect for completing checklists, adding assets, or launching tools.
              </p>
              <Button
                size="sm"
                onClick={() => navigate(createPageUrl('BatchMode'))}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Open Batch Mode <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDismiss}
            className="text-purple-600 hover:text-purple-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}