import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, MessageCircle, Heart, Users, Lock, 
  ChevronDown, ChevronUp, ExternalLink, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const crisisOptions = [
  {
    id: 'suicidal',
    label: 'Thoughts of suicide or self-harm',
    icon: AlertTriangle,
    color: 'bg-red-100 text-red-700 border-red-300',
    resources: [
      { name: '988 Suicide & Crisis Lifeline', action: 'call', value: '988', description: 'Call or text 24/7' },
      { name: 'Crisis Text Line', action: 'text', value: 'HOME to 741741', description: 'Text with a trained counselor' },
      { name: 'International Association for Suicide Prevention', action: 'link', value: 'https://www.iasp.info/resources/Crisis_Centres/', description: 'Find help worldwide' },
    ]
  },
  {
    id: 'depressed',
    label: 'Depression or overwhelming sadness',
    icon: Heart,
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    resources: [
      { name: '988 Suicide & Crisis Lifeline', action: 'call', value: '988', description: 'Also helps with emotional distress' },
      { name: 'SAMHSA Helpline', action: 'call', value: '1-800-662-4357', description: 'Free, confidential, 24/7' },
      { name: 'NAMI Helpline', action: 'call', value: '1-800-950-6264', description: 'Mon-Fri 10am-10pm ET' },
      { name: '211 Resources', action: 'call', value: '211', description: 'Connect to local mental health services' },
    ]
  },
  {
    id: 'bullied',
    label: 'Being bullied or harassed',
    icon: Users,
    color: 'bg-orange-100 text-orange-700 border-orange-300',
    resources: [
      { name: 'StopBullying.gov', action: 'link', value: 'https://www.stopbullying.gov/resources/get-help-now', description: 'Resources and reporting' },
      { name: 'Crisis Text Line', action: 'text', value: 'HOME to 741741', description: 'Text with a trained counselor' },
      { name: 'CyberBullying Research Center', action: 'link', value: 'https://cyberbullying.org/resources', description: 'Online harassment help' },
    ]
  },
  {
    id: 'grief',
    label: 'Loss of a loved one',
    icon: Heart,
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    resources: [
      { name: 'GriefShare', action: 'link', value: 'https://www.griefshare.org/', description: 'Find a local support group' },
      { name: "Compassionate Friends", action: 'call', value: '1-877-969-0010', description: 'Support for bereaved families' },
      { name: '211 Resources', action: 'call', value: '211', description: 'Connect to local grief counseling' },
    ]
  },
  {
    id: 'talk',
    label: 'Need to talk to someone anonymously',
    icon: Lock,
    color: 'bg-teal-100 text-teal-700 border-teal-300',
    resources: [
      { name: '7 Cups', action: 'link', value: 'https://www.7cups.com/', description: 'Free online chat with trained listeners' },
      { name: 'Crisis Text Line', action: 'text', value: 'HOME to 741741', description: 'Anonymous text support' },
      { name: 'Warmline Directory', action: 'link', value: 'https://warmline.org/warmdir.html', description: 'Non-crisis peer support lines' },
    ]
  },
  {
    id: 'addiction',
    label: 'Struggling with addiction',
    icon: Heart,
    color: 'bg-green-100 text-green-700 border-green-300',
    resources: [
      { name: 'SAMHSA Helpline', action: 'call', value: '1-800-662-4357', description: 'Free, confidential, 24/7' },
      { name: 'AA Meeting Finder', action: 'link', value: 'https://www.aa.org/find-aa', description: 'Find local AA meetings' },
      { name: 'NA Meeting Finder', action: 'link', value: 'https://www.na.org/meetingsearch/', description: 'Find local NA meetings' },
      { name: '211 Resources', action: 'call', value: '211', description: 'Connect to local treatment centers' },
    ]
  },
];

export default function CrisisResourcesCard() {
  const [expanded, setExpanded] = useState(null);

  const handleAction = (resource) => {
    if (resource.action === 'call') {
      window.location.href = `tel:${resource.value.replace(/[^0-9]/g, '')}`;
    } else if (resource.action === 'text') {
      // Can't auto-open SMS with specific message on all devices, show instruction
      alert(`To get help, text ${resource.value}`);
    } else if (resource.action === 'link') {
      window.open(resource.value, '_blank');
    }
  };

  return (
    <Card className="border-2 border-rose-200 bg-gradient-to-br from-rose-50 to-purple-50">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Are you currently experiencing any of these?
          </h2>
          <p className="text-gray-600 text-sm">
            You're not alone. Tap any option below to see resources that can help.
          </p>
        </div>

        <div className="space-y-3">
          {crisisOptions.map((option) => {
            const Icon = option.icon;
            const isExpanded = expanded === option.id;

            return (
              <div key={option.id}>
                <button
                  onClick={() => setExpanded(isExpanded ? null : option.id)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${option.color} ${
                    isExpanded ? 'ring-2 ring-offset-2 ring-purple-400' : 'hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{option.label}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 space-y-3 bg-white rounded-b-xl border-x-2 border-b-2 border-gray-200">
                        {option.resources.map((resource, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleAction(resource)}
                            className="w-full p-3 rounded-lg bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 transition-all text-left flex items-center justify-between group"
                          >
                            <div>
                              <p className="font-semibold text-gray-800">{resource.name}</p>
                              <p className="text-sm text-gray-500">{resource.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {resource.action === 'call' && (
                                <Badge className="bg-green-100 text-green-700">
                                  <Phone className="w-3 h-3 mr-1" /> {resource.value}
                                </Badge>
                              )}
                              {resource.action === 'text' && (
                                <Badge className="bg-blue-100 text-blue-700">
                                  <MessageCircle className="w-3 h-3 mr-1" /> Text
                                </Badge>
                              )}
                              {resource.action === 'link' && (
                                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-purple-600" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-white rounded-xl border border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            <strong>In immediate danger?</strong> Call <a href="tel:911" className="text-red-600 font-bold underline">911</a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}