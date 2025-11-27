import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pill, Check, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { format } from 'date-fns';

const frequencyDoses = {
  once_daily: 1,
  twice_daily: 2,
  three_times_daily: 3,
  as_needed: 0,
  weekly: 1
};

export default function QuickSupplementCheck({ userEmail }) {
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: supplements = [] } = useQuery({
    queryKey: ['activeSupplements', userEmail],
    queryFn: () => base44.entities.Supplement.filter({ is_active: true, created_by: userEmail }),
    enabled: !!userEmail,
  });

  const { data: todaysLogs = [] } = useQuery({
    queryKey: ['supplementLogs', today, userEmail],
    queryFn: () => base44.entities.SupplementLog.filter({ date: today, created_by: userEmail }),
    enabled: !!userEmail,
  });

  const logMutation = useMutation({
    mutationFn: async ({ supplementId, doseNumber }) => {
      const existingLog = todaysLogs.find(l => l.supplement_id === supplementId);
      if (existingLog) {
        const doses = existingLog.doses_taken || [];
        if (doses.includes(doseNumber)) {
          return base44.entities.SupplementLog.update(existingLog.id, {
            doses_taken: doses.filter(d => d !== doseNumber)
          });
        } else {
          return base44.entities.SupplementLog.update(existingLog.id, {
            doses_taken: [...doses, doseNumber]
          });
        }
      } else {
        return base44.entities.SupplementLog.create({
          supplement_id: supplementId,
          date: today,
          doses_taken: [doseNumber]
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplementLogs'] });
    }
  });

  if (supplements.length === 0) return null;

  const getLogForSupp = (suppId) => todaysLogs.find(l => l.supplement_id === suppId);
  const getDosesTaken = (suppId) => getLogForSupp(suppId)?.doses_taken || [];

  const totalDoses = supplements.reduce((sum, supp) => sum + (frequencyDoses[supp.frequency] || 1), 0);
  const completedDoses = supplements.reduce((sum, supp) => sum + getDosesTaken(supp.id).length, 0);

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-amber-50 to-yellow-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-amber-500" />
            Supplements
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={completedDoses === totalDoses ? "default" : "secondary"} 
                   className={completedDoses === totalDoses ? "bg-green-500" : ""}>
              {completedDoses}/{totalDoses}
            </Badge>
            <Link to={createPageUrl('Supplements')}>
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {supplements.map(supp => {
            const numDoses = frequencyDoses[supp.frequency] || 1;
            const dosesTaken = getDosesTaken(supp.id);
            const isAsNeeded = supp.frequency === 'as_needed';

            if (isAsNeeded) {
              const taken = dosesTaken.length > 0;
              return (
                <button
                  key={supp.id}
                  onClick={() => logMutation.mutate({ supplementId: supp.id, doseNumber: 1 })}
                  className={`px-3 py-2 rounded-xl border-2 transition-all flex items-center gap-2 ${
                    taken
                      ? 'border-green-400 bg-green-100 text-green-800'
                      : 'border-gray-200 bg-white hover:border-amber-300'
                  }`}
                >
                  {taken && <Check className="w-4 h-4" />}
                  <span className="font-medium text-sm">{supp.name}</span>
                  <span className="text-xs text-gray-500">PRN</span>
                </button>
              );
            }

            return (
              <div key={supp.id} className="flex items-center gap-1 bg-white rounded-xl border-2 border-gray-200 p-1">
                <span className="font-medium text-sm px-2">{supp.name}</span>
                {Array.from({ length: numDoses }, (_, i) => i + 1).map(doseNum => {
                  const taken = dosesTaken.includes(doseNum);
                  return (
                    <button
                      key={doseNum}
                      onClick={() => logMutation.mutate({ supplementId: supp.id, doseNumber: doseNum })}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        taken
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 hover:bg-amber-100 text-gray-500'
                      }`}
                      title={`Dose ${doseNum}`}
                    >
                      {taken ? <Check className="w-4 h-4" /> : doseNum}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}