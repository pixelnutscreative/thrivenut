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

export default function QuickMedicationCheck({ userEmail }) {
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: medications = [] } = useQuery({
    queryKey: ['activeMedications', userEmail],
    queryFn: () => base44.entities.Medication.filter({ is_active: true, created_by: userEmail }),
    enabled: !!userEmail,
  });

  const { data: todaysLogs = [] } = useQuery({
    queryKey: ['medicationLogs', today, userEmail],
    queryFn: () => base44.entities.MedicationLog.filter({ date: today, created_by: userEmail }),
    enabled: !!userEmail,
  });

  const logMutation = useMutation({
    mutationFn: async ({ medicationId, doseNumber }) => {
      const existingLog = todaysLogs.find(l => l.medication_id === medicationId);
      if (existingLog) {
        const doses = existingLog.doses_taken || [];
        if (doses.includes(doseNumber)) {
          // Remove dose
          return base44.entities.MedicationLog.update(existingLog.id, {
            doses_taken: doses.filter(d => d !== doseNumber)
          });
        } else {
          // Add dose
          return base44.entities.MedicationLog.update(existingLog.id, {
            doses_taken: [...doses, doseNumber]
          });
        }
      } else {
        return base44.entities.MedicationLog.create({
          medication_id: medicationId,
          date: today,
          doses_taken: [doseNumber]
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicationLogs'] });
    }
  });

  if (medications.length === 0) return null;

  const getLogForMed = (medId) => todaysLogs.find(l => l.medication_id === medId);
  const getDosesTaken = (medId) => getLogForMed(medId)?.doses_taken || [];

  const totalDoses = medications.reduce((sum, med) => sum + (frequencyDoses[med.frequency] || 1), 0);
  const completedDoses = medications.reduce((sum, med) => sum + getDosesTaken(med.id).length, 0);

  return (
    <Card className="shadow-lg border-0 bg-gradient-to-br from-pink-50 to-rose-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-pink-500" />
            Medications
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={completedDoses === totalDoses ? "default" : "secondary"} 
                   className={completedDoses === totalDoses ? "bg-green-500" : ""}>
              {completedDoses}/{totalDoses}
            </Badge>
            <Link to={createPageUrl('Medications')}>
              <Button variant="ghost" size="sm" className="h-7 px-2">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {medications.map(med => {
            const numDoses = frequencyDoses[med.frequency] || 1;
            const dosesTaken = getDosesTaken(med.id);
            const isAsNeeded = med.frequency === 'as_needed';

            if (isAsNeeded) {
              const taken = dosesTaken.length > 0;
              return (
                <button
                  key={med.id}
                  onClick={() => logMutation.mutate({ medicationId: med.id, doseNumber: 1 })}
                  className={`px-3 py-2 rounded-xl border-2 transition-all flex items-center gap-2 ${
                    taken
                      ? 'border-green-400 bg-green-100 text-green-800'
                      : 'border-gray-200 bg-white hover:border-pink-300'
                  }`}
                >
                  {taken && <Check className="w-4 h-4" />}
                  <span className="font-medium text-sm">{med.name}</span>
                  <span className="text-xs text-gray-500">PRN</span>
                </button>
              );
            }

            return (
              <div key={med.id} className="flex items-center gap-1 bg-white rounded-xl border-2 border-gray-200 p-1">
                <span className="font-medium text-sm px-2">{med.name}</span>
                {Array.from({ length: numDoses }, (_, i) => i + 1).map(doseNum => {
                  const taken = dosesTaken.includes(doseNum);
                  return (
                    <button
                      key={doseNum}
                      onClick={() => logMutation.mutate({ medicationId: med.id, doseNumber: doseNum })}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        taken
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 hover:bg-pink-100 text-gray-500'
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