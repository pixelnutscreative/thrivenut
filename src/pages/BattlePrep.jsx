import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { format, addDays, addHours, isAfter, isBefore, parseISO } from 'date-fns';
import { useMemo } from 'react';
import { Swords, Shield, Zap, Skull, Wind, Users, Plus, Clock, Trash2, Edit2, Save, CheckCircle, Copy, Link as LinkIcon, Loader2, AlertTriangle, MessageCircle, Download, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GloveAssignmentManager from '../components/battles/GloveAssignmentManager';
import MVPTracker from '../components/battles/MVPTracker';
import BattlePosterManager from '../components/battles/BattlePosterManager';

export default function BattlePrep() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('inventory');
  const [stationSubTab, setStationSubTab] = useState('strategy');
  const [arsenalFilter, setArsenalFilter] = useState('all');
  
  // Inventory Form State
  const [newItem, setNewItem] = useState({
    contact_id: '',
    contact_name: '',
    type: 'Glove',
    quantity: 1,
    acquired_date: format(new Date(), 'yyyy-MM-dd'),
    acquired_time: '12:00'
  });

  // Battle Plan Form State
  const [newPlan, setNewPlan] = useState({
    opponent: '',
    battle_date: '',
    mist_strategy: 'No',
    glove_assignments: [],
    strategy_notes: '',
    group_ids: []
  });

  // Get user preferences for battle timing options
  const { data: preferences = {} } = useQuery({
    queryKey: ['userPreferences'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return {};
      const prefs = await base44.entities.UserPreferences.filter({ user_email: user.email }, '-updated_date');
      return prefs[0] || {};
    },
    staleTime: Infinity
  });

  const enabledDropTimings = preferences?.battle_drop_timings || ['beginning', 'first_bonus', 'middle_bonus', 'end'];

  const [activeBattleId, setActiveBattleId] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [modUsername, setModUsername] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [shareLoading, setShareLoading] = useState(false);

  // Fetch Contacts for dropdown
  const { data: contacts = [] } = useQuery({
    queryKey: ['tiktokContacts'],
    queryFn: () => base44.entities.TikTokContact.list('display_name', 100),
  });

  // Fetch Power Ups (only user's own)
  const { data: powerUps = [] } = useQuery({
    queryKey: ['battlePowerUps'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return [];
      return base44.entities.BattlePowerUp.filter({ created_by: user.email }, '-acquired_date', 100);
    },
  });

  // Fetch Battle Plans (user's own + group battles where user is creator)
  const { data: battlePlans = [] } = useQuery({
    queryKey: ['battlePlans'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return [];
      // Get all battles created by user (personal and group battles user created)
      return base44.entities.BattlePlan.filter({ created_by: user.email }, '-battle_date', 50);
    },
  });

  // Fetch Gifted Power-Ups (power-ups user gave to others)
  const { data: giftedPowerUps = [] } = useQuery({
    queryKey: ['giftedPowerUps'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return [];
      return base44.entities.GiftedPowerUp.filter({ created_by: user.email }, '-given_date', 100);
    },
  });

  // Active gifted power-ups (not expired/used)
  const activeGiftedPowerUps = useMemo(() => {
    return giftedPowerUps
      .filter(item => {
        if (item.is_used) return false;
        const expires = parseISO(item.expires_at);
        return isAfter(expires, new Date());
      })
      .sort((a, b) => parseISO(a.expires_at) - parseISO(b.expires_at));
  }, [giftedPowerUps]);

  // Fetch User's Groups
  const { data: myMenuGroups = [] } = useQuery({
    queryKey: ['userGroups'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return [];
      const response = await base44.functions.invoke('getUserGroups', { userEmail: user.email });
      return response.data?.groups || [];
    },
    enabled: true,
  });

  // Group power-ups by contact (who I have power-ups for)
  const myPowerUpsByContact = useMemo(() => {
    const grouped = {};
    powerUps.forEach(item => {
      if (!grouped[item.contact_name]) {
        grouped[item.contact_name] = [];
      }
      grouped[item.contact_name].push(item);
    });
    return grouped;
  }, [powerUps]);

  // Filter Active Power Ups (Not Expired, sorted by expiry) - UNFILTERED for inventory summary
  const allActivePowerUps = useMemo(() => {
    return powerUps
      .filter(item => {
        if (item.is_used) return false;
        let expires;
        if (item.expires_at) {
          expires = parseISO(item.expires_at);
        } else {
          expires = addDays(parseISO(item.acquired_date), 5);
        }
        return isAfter(expires, new Date());
      })
      .sort((a, b) => {
        const expiresA = a.expires_at ? parseISO(a.expires_at) : addDays(parseISO(a.acquired_date), 5);
        const expiresB = b.expires_at ? parseISO(b.expires_at) : addDays(parseISO(b.acquired_date), 5);
        return expiresA - expiresB;
      });
  }, [powerUps]);

  // Filtered display list (respects arsenal filter)
  const activePowerUps = useMemo(() => {
    if (arsenalFilter === 'all') return allActivePowerUps;
    return allActivePowerUps.filter(item => item.type === arsenalFilter);
  }, [allActivePowerUps, arsenalFilter]);

  // Battle Deadline Logic
  const activePlan = activeBattleId ? battlePlans.find(p => p.id === activeBattleId) : null;
  const battleDeadline = activePlan?.battle_date ? addHours(parseISO(activePlan.battle_date), 1) : null;

  // Identify items that will expire before the battle (plus buffer)
  const atRiskItems = activePowerUps.filter(item => {
    if (!battleDeadline) return false;
    const expires = item.expires_at ? parseISO(item.expires_at) : addDays(parseISO(item.acquired_date), 5);
    // It's at risk if it expires BEFORE the battle deadline
    return isBefore(expires, battleDeadline);
  });

  // Aggregated Inventory (always from all items, not filtered)
  const inventorySummary = allActivePowerUps.reduce((acc, item) => {
    if (!acc[item.type]) acc[item.type] = 0;
    acc[item.type] += item.quantity;
    return acc;
  }, {});

  // Mutations
  const createItemMutation = useMutation({
    mutationFn: (data) => {
      const dateTimeString = `${data.acquired_date}T${data.acquired_time || '12:00'}:00`;
      const acquisitionDate = new Date(dateTimeString);
      const expirationDate = addDays(acquisitionDate, 5);
      
      return base44.entities.BattlePowerUp.create({
        ...data,
        expires_at: expirationDate.toISOString(),
        expires_date: format(expirationDate, 'yyyy-MM-dd')
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['battlePowerUps'] });
      setNewItem({ ...newItem, contact_id: '', contact_name: '', quantity: 1 });
    }
  });

  const createGiftedMutation = useMutation({
    mutationFn: (data) => {
      const dateTimeString = `${data.given_date}T${data.given_time || '12:00'}:00`;
      const giftDate = new Date(dateTimeString);
      const expirationDate = addDays(giftDate, 5);
      
      return base44.entities.GiftedPowerUp.create({
        ...data,
        expires_at: expirationDate.toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['giftedPowerUps'] });
    }
  });

  const deleteGiftedMutation = useMutation({
    mutationFn: (id) => base44.entities.GiftedPowerUp.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['giftedPowerUps'] })
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BattlePowerUp.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['battlePowerUps'] })
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id) => base44.entities.BattlePowerUp.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['battlePowerUps'] })
  });

  const createPlanMutation = useMutation({
    mutationFn: async (data) => {
      const user = await base44.auth.me();
      return base44.entities.BattlePlan.create({
        ...data,
        creator_name: user?.full_name || user?.email || 'Unknown'
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['battlePlans'] });
      setActiveBattleId(data.id);
      setNewPlan({ opponent: '', battle_date: '', mist_strategy: 'No', glove_assignments: [], strategy_notes: '' });
    }
  });

  const updatePlanMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BattlePlan.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['battlePlans'] })
  });

  const handleContactSelect = (contactId) => {
    const contact = contacts.find(c => c.id === contactId);
    setNewItem({
      ...newItem,
      contact_id: contactId,
      contact_name: contact ? (contact.display_name || contact.username) : ''
    });
  };

  const handleGenerateLink = async () => {
    if (!modUsername.trim()) return;
    setShareLoading(true);
    try {
      const res = await base44.functions.invoke('sharedInventory', { 
        action: 'create_link', 
        mod_username: modUsername.replace('@', '').trim() 
      });
      const token = res.data.token;
      const url = `${window.location.origin}/BattleInventoryShared?token=${token}`;
      setGeneratedLink(url);
    } catch (e) {
      console.error(e);
    } finally {
      setShareLoading(false);
    }
  };

  const generateAlertScript = () => {
    if (!activePlan || atRiskItems.length === 0) return '';
    
    const battleTime = format(parseISO(activePlan.battle_date), 'h:mm a');
    
    // Group by user to avoid duplicate mentions
    const userItems = {};
    atRiskItems.forEach(item => {
      const contact = contacts.find(c => c.id === item.contact_id);
      const handle = contact?.username ? `@${contact.username}` : item.contact_name;
      
      if (!userItems[handle]) userItems[handle] = [];
      userItems[handle].push(`${item.quantity} ${item.type}`);
    });

    const mentions = Object.entries(userItems).map(([handle, items]) => {
      return `${handle} (${items.join(', ')})`;
    }).join(' ');

    return `🚨 BATTLE ALERT! 🚨\n\nWe need you for the battle at ${battleTime}!\n\n${mentions}\n\nYour power-ups are expiring! Use them or lose them! ⚔️🔥`;
  };

  const [scriptCopied, setScriptCopied] = useState(false);
  const handleCopyScript = () => {
    const script = generateAlertScript();
    navigator.clipboard.writeText(script);
    setScriptCopied(true);
    setTimeout(() => setScriptCopied(false), 2000);
  };

  const handleDownloadPDF = async () => {
    if (!activePlan) return;
    
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    let yPos = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;

    // Title
    doc.setFontSize(18);
    doc.text('Battle Prep Sheet', margin, yPos);
    yPos += 12;

    // Battle Info
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Battle Information', margin, yPos);
    yPos += 8;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.text(`Opponent: ${activePlan.opponent}`, margin, yPos);
    yPos += 6;
    doc.text(`Date & Time: ${activePlan.battle_date ? format(parseISO(activePlan.battle_date), 'MMM d, yyyy h:mm a') : 'TBD'}`, margin, yPos);
    yPos += 6;
    doc.text(`Mist Strategy: ${activePlan.mist_strategy}`, margin, yPos);
    yPos += 10;

    // Glove Assignments
    if (activePlan.glove_assignments && activePlan.glove_assignments.length > 0) {
      doc.setFont(undefined, 'bold');
      doc.setFontSize(11);
      doc.text('Glove Assignments', margin, yPos);
      yPos += 7;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);

      activePlan.glove_assignments.forEach((assignment, idx) => {
        const contact = contacts.find(c => c.id === assignment.contact_id);
        const contactName = contact?.display_name || assignment.contact_name || 'Unknown';
        const text = `${idx + 1}. @${contactName} - ${assignment.type} at ${assignment.drop_timing || 'N/A'}`;
        doc.text(text, margin + 5, yPos);
        yPos += 5;
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
      });
      yPos += 5;
    }

    // Strategy Notes
    if (activePlan.strategy_notes) {
      doc.setFont(undefined, 'bold');
      doc.setFontSize(11);
      doc.text('Strategy Notes', margin, yPos);
      yPos += 7;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      const splitText = doc.splitTextToSize(activePlan.strategy_notes, contentWidth);
      doc.text(splitText, margin, yPos);
      yPos += splitText.length * 5 + 5;
    }

    // MVPs
    if (activePlan.our_mvps && activePlan.our_mvps.length > 0) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont(undefined, 'bold');
      doc.setFontSize(11);
      doc.text('Our MVPs', margin, yPos);
      yPos += 7;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      activePlan.our_mvps.forEach((mvp) => {
        doc.text(`${mvp.rank}. ${mvp.username} - ${mvp.gifts_received || 0} gifts`, margin + 5, yPos);
        yPos += 5;
      });
      yPos += 5;
    }

    if (activePlan.opponent_mvps && activePlan.opponent_mvps.length > 0) {
      doc.setFont(undefined, 'bold');
      doc.setFontSize(11);
      doc.text('Opponent MVPs', margin, yPos);
      yPos += 7;
      doc.setFont(undefined, 'normal');
      doc.setFontSize(9);
      activePlan.opponent_mvps.forEach((mvp) => {
        doc.text(`${mvp.rank}. ${mvp.username} - ${mvp.gifts_received || 0} gifts`, margin + 5, yPos);
        yPos += 5;
      });
      yPos += 10;
    }

    // Notes section for writing
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text('Additional Notes (Write In):', margin, yPos);
    yPos += 8;
    doc.setDrawColor(200);
    for (let i = 0; i < 5; i++) {
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;
    }

    doc.save(`Battle_Prep_vs_${activePlan.opponent}.pdf`);
  };

  const getIcon = (type) => {
    switch(type) {
      case 'Glove': return <Shield className="w-4 h-4 text-blue-500" />;
      case 'Mist': return <Wind className="w-4 h-4 text-gray-500" />;
      case 'Sniper': return <Crosshair className="w-4 h-4 text-red-500" />; // Need to import Crosshair
      case 'Jet': return <Zap className="w-4 h-4 text-yellow-500" />;
      default: return <Swords className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Swords className="w-8 h-8 text-indigo-600" />
              Battle Prep & Strategy
            </h1>
            <p className="text-slate-600">Manage inventory, track power-ups, and plan your victories.</p>
          </div>
          <Button 
            variant="outline"
            onClick={() => {
              setModUsername('');
              setGeneratedLink('');
              setShowShareModal(true);
            }}
            className="bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
          >
            <Users className="w-4 h-4 mr-2" />
            Share with Mod
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="inventory">🎒 Inventory</TabsTrigger>
            <TabsTrigger value="station">⚔️ Battle Station</TabsTrigger>
          </TabsList>

          {/* INVENTORY TAB */}
          <TabsContent value="inventory" className="space-y-6">
            {/* Add New Item */}
            <Card>
              <CardHeader>
                <CardTitle>Log Power-Up</CardTitle>
                <CardDescription>Items expire 5 days after acquisition.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-2 w-full">
                    <label className="text-sm font-medium">Who has it?</label>
                    <Select value={newItem.contact_id} onValueChange={handleContactSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Contact" />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.display_name || c.username}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full md:w-40 space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <Select value={newItem.type} onValueChange={(v) => setNewItem({...newItem, type: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                       <SelectContent>
                          <SelectItem value="Glove">🥊 Glove</SelectItem>
                          <SelectItem value="Hammer">🔨 Hammer</SelectItem>
                          <SelectItem value="Lightning2">⚡ Lightning (2nd)</SelectItem>
                          <SelectItem value="Lightning3">⚡ Lightning (3rd)</SelectItem>
                          <SelectItem value="TimeExtender">⏱️ Time Extender</SelectItem>
                          <SelectItem value="Mist">🌫️ Mist</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="w-full md:w-24 space-y-2">
                    <label className="text-sm font-medium">Qty</label>
                    <Input 
                      type="number" 
                      min="1" 
                      value={newItem.quantity} 
                      onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})} 
                    />
                  </div>
                  <div className="w-full md:w-40 space-y-2">
                    <label className="text-sm font-medium">Acquired</label>
                    <div className="flex gap-1">
                      <Input 
                        type="date" 
                        value={newItem.acquired_date} 
                        onChange={(e) => setNewItem({...newItem, acquired_date: e.target.value})} 
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-24 space-y-2">
                    <label className="text-sm font-medium">Time</label>
                    <Select 
                      value={newItem.acquired_time} 
                      onValueChange={(v) => setNewItem({...newItem, acquired_time: v})}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }).map((_, i) => {
                          const hour = i.toString().padStart(2, '0');
                          return <SelectItem key={hour} value={`${hour}:00`}>{hour}:00</SelectItem>;
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={() => createItemMutation.mutate(newItem)}
                    disabled={!newItem.contact_id}
                    className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Inventory List */}
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  Active Arsenal 
                  <Badge variant="secondary" className="ml-2">{activePowerUps.length} Items</Badge>
                </h3>
                <ArsenalFilter filter={arsenalFilter} onFilterChange={setArsenalFilter} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activePowerUps.map(item => {
                  const expires = item.expires_at ? parseISO(item.expires_at) : addDays(parseISO(item.acquired_date), 5);
                  const now = new Date();
                  const hoursLeft = Math.max(0, Math.ceil((expires - now) / (1000 * 60 * 60)));
                  const daysLeft = Math.ceil(hoursLeft / 24);
                  
                  return (
                    <Card key={item.id} className="border-l-4 border-l-indigo-500">
                      <CardContent className="p-4 flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-lg">{item.contact_name}</span>
                            <Badge variant="outline">{item.type}</Badge>
                          </div>
                          <div className="text-sm text-slate-500 space-y-1">
                            <p>Quantity: <span className="font-semibold text-slate-900">{item.quantity}</span></p>
                            <p className={daysLeft <= 1 ? "text-red-500 font-medium" : ""}>
                              Expires in {daysLeft > 1 ? `${daysLeft} days` : `${hoursLeft} hours`} ({format(expires, 'MMM d HH:mm')})
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => deleteItemMutation.mutate(item.id)}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateItemMutation.mutate({ id: item.id, data: { quantity: Math.max(0, item.quantity - 1) } })}
                            disabled={item.quantity <= 0}
                          >
                            -1
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                {activePowerUps.length === 0 && (
                  <div className="col-span-full p-8 text-center bg-white rounded-xl border border-dashed">
                    <Shield className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                    <p className="text-slate-500">No active power-ups found. Log some gloves!</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* BATTLE STATION TAB */}
          <TabsContent value="station" className="space-y-6">
            {/* Station Sub-Tabs */}
            <div className="flex gap-2 border-b flex-wrap">
              <button
                onClick={() => setStationSubTab('strategy')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  stationSubTab === 'strategy'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                ⚔️ Battle Strategy
              </button>
              <button
                onClick={() => setStationSubTab('gifters')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  stationSubTab === 'gifters'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                💝 Who I Have Power Ups For ({Object.keys(myPowerUpsByContact).length})
              </button>
              <button
                onClick={() => setStationSubTab('given')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  stationSubTab === 'given'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                🎁 Power Ups I Gave ({activeGiftedPowerUps.length})
              </button>
            </div>

            {stationSubTab === 'strategy' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Left Col: Battle Plan */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-white shadow-lg border-indigo-100">
                  <CardHeader className="bg-indigo-50/50 border-b border-indigo-100">
                    <CardTitle className="text-indigo-900">Battle Strategy</CardTitle>
                    <CardDescription>Plan your attack and defense</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Battle Selector - Only Upcoming Battles */}
                    <div className="flex gap-4 items-end">
                      <div className="flex-1">
                        <label className="text-sm font-medium mb-1 block">Select Battle Plan to Edit</label>
                        <Select 
                          value={activeBattleId || ''} 
                          onValueChange={(v) => setActiveBattleId(v || null)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a battle to edit or scroll down to create new" />
                          </SelectTrigger>
                          <SelectContent>
                            {battlePlans
                              .filter(plan => !plan.battle_date || isAfter(parseISO(plan.battle_date), new Date()))
                              .map(plan => (
                                <SelectItem key={plan.id} value={plan.id}>
                                  VS {plan.opponent} • {plan.creator_name ? `by ${plan.creator_name}` : 'No creator'} • {plan.battle_date ? format(parseISO(plan.battle_date), 'MMM d h:mm a') : 'Unscheduled'}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {activeBattleId && (
                        <Button 
                          variant="outline" 
                          onClick={() => setActiveBattleId(null)}
                        >
                          Create New
                        </Button>
                      )}
                    </div>

                    {/* At Risk Items Warning */}
                    <AnimatePresence>
                      {activeBattleId && atRiskItems.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3"
                        >
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                            <div>
                              <h4 className="font-semibold text-amber-800">At-Risk Inventory!</h4>
                              <p className="text-sm text-amber-700">
                                The following items will expire before the battle ends (Battle Time + 1hr buffer).
                                Reach out to these people ASAP to use them or swap!
                              </p>
                            </div>
                          </div>

                          <div className="pl-8">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={handleCopyScript}
                              className="bg-white border-amber-300 text-amber-800 hover:bg-amber-100 w-full justify-start"
                            >
                              {scriptCopied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                              {scriptCopied ? 'Script Copied!' : 'Copy TikTok Shoutout Script'}
                            </Button>
                          </div>
                          
                          <div className="grid gap-2 pl-8">
                            {atRiskItems.map(item => (
                              <div key={item.id} className="flex items-center justify-between bg-white/50 p-2 rounded text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold">{item.contact_name}</span>
                                  <Badge variant="outline" className="border-amber-300 text-amber-800 bg-amber-50">
                                    {item.quantity} {item.type}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-red-600 font-medium">
                                    Expires: {format(parseISO(item.expires_at || item.acquired_date), 'MMM d h:mm a')}
                                  </span>
                                  <a 
                                    href={`https://www.tiktok.com/@${contacts.find(c => c.id === item.contact_id)?.username || item.contact_name}`}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-1 hover:bg-amber-100 rounded text-amber-700"
                                    title="Contact on TikTok"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Plan Form */}
                    <div className="space-y-4 border-t pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Opponent</label>
                          <Input 
                            value={activeBattleId ? (battlePlans.find(p => p.id === activeBattleId)?.opponent || '') : newPlan.opponent}
                            onChange={(e) => activeBattleId 
                              ? updatePlanMutation.mutate({ id: activeBattleId, data: { opponent: e.target.value } })
                              : setNewPlan({...newPlan, opponent: e.target.value})
                            }
                            placeholder="@username"
                          />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Date & Time</label>
                            <Input 
                              type="datetime-local"
                              value={activeBattleId ? (battlePlans.find(p => p.id === activeBattleId)?.battle_date || '') : newPlan.battle_date}
                              onChange={(e) => activeBattleId 
                                ? updatePlanMutation.mutate({ id: activeBattleId, data: { battle_date: e.target.value } })
                                : setNewPlan({...newPlan, battle_date: e.target.value})
                              }
                            />
                          </div>
                        </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Mist Strategy</label>
                        <Select 
                          value={activeBattleId ? (battlePlans.find(p => p.id === activeBattleId)?.mist_strategy || 'No') : newPlan.mist_strategy}
                          onValueChange={(v) => activeBattleId 
                            ? updatePlanMutation.mutate({ id: activeBattleId, data: { mist_strategy: v } })
                            : setNewPlan({...newPlan, mist_strategy: v})
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="No">No Mist Planned</SelectItem>
                            <SelectItem value="Yes">Use Mist</SelectItem>
                            <SelectItem value="Agreed No Mist">🤝 Agreed No Mist</SelectItem>
                            <SelectItem value="Mist on Bonus">🌫️ Mist on Bonus</SelectItem>
                            <SelectItem value="Mist at End">🏁 Mist at End</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2 border-t pt-4">
                        <GloveAssignmentManager 
                          assignments={activeBattleId ? (battlePlans.find(p => p.id === activeBattleId)?.glove_assignments || []) : newPlan.glove_assignments}
                          availableInventory={activePowerUps}
                          enabledTimings={enabledDropTimings}
                          onUpdate={(assignments) => {
                            if (activeBattleId) {
                              updatePlanMutation.mutate({ id: activeBattleId, data: { glove_assignments: assignments } });
                            } else {
                              setNewPlan({...newPlan, glove_assignments: assignments});
                            }
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Strategy Notes</label>
                        <Textarea 
                          placeholder="e.g., Throw all gloves at start, save snipers for last 30s..."
                          rows={4}
                          value={activeBattleId ? (battlePlans.find(p => p.id === activeBattleId)?.strategy_notes || '') : newPlan.strategy_notes}
                          onChange={(e) => activeBattleId 
                            ? updatePlanMutation.mutate({ id: activeBattleId, data: { strategy_notes: e.target.value } })
                            : setNewPlan({...newPlan, strategy_notes: e.target.value})
                          }
                        />
                      </div>

                      {activeBattleId && (
                        <>
                          <div className="space-y-2 border-t pt-4">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">📊 Battle Results & MVPs</label>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleDownloadPDF}
                                className="gap-2"
                              >
                                <Download className="w-4 h-4" />
                                📄 Download Battle Plan PDF
                              </Button>
                            </div>
                            <p className="text-xs text-slate-500 mb-2">Enter MVP info after your battle completes</p>
                            <MVPTracker 
                              ourMVPs={battlePlans.find(p => p.id === activeBattleId)?.our_mvps || []}
                              opponentMVPs={battlePlans.find(p => p.id === activeBattleId)?.opponent_mvps || []}
                              onUpdate={(side, mvps) => {
                                const data = side === 'our' ? { our_mvps: mvps } : { opponent_mvps: mvps };
                                updatePlanMutation.mutate({ id: activeBattleId, data });
                              }}
                            />
                          </div>

                          <BattlePosterManager
                            battleId={activeBattleId}
                            battleOpponent={activePlan?.opponent || ''}
                            existingPosters={activePlan?.poster_urls || []}
                            onPostersUpdate={(posters) => {
                              updatePlanMutation.mutate({ 
                                id: activeBattleId, 
                                data: { poster_urls: posters } 
                              });
                            }}
                          />
                        </>
                      )}

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Share with Groups</label>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {myMenuGroups.map(group => (
                            <label key={group.id} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={newPlan.group_ids?.includes(group.id) || false}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewPlan({...newPlan, group_ids: [...(newPlan.group_ids || []), group.id]});
                                  } else {
                                    setNewPlan({...newPlan, group_ids: newPlan.group_ids?.filter(id => id !== group.id) || []});
                                  }
                                }}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">{group.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {!activeBattleId && (
                         <>
                           <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                             <h4 className="font-semibold text-blue-900 mb-2">➕ Create New Battle Plan</h4>
                             <p className="text-sm text-blue-700 mb-4">Fill out the opponent and other details below, then click Create.</p>
                           </div>
                           <Button 
                             onClick={() => createPlanMutation.mutate(newPlan)}
                             disabled={!newPlan.opponent}
                             className="w-full bg-indigo-600 hover:bg-indigo-700"
                           >
                             ⚔️ Create Battle Plan
                           </Button>
                         </>
                       )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Col: Armory Summary */}
              <div className="space-y-6">
                <Card className="bg-slate-900 text-white border-none shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-blue-400" />
                      Armory Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-800 p-3 rounded-lg text-center">
                        <p className="text-slate-400 text-xs uppercase tracking-wider">Gloves</p>
                        <p className="text-2xl font-bold text-blue-400">{inventorySummary['Glove'] || 0}</p>
                      </div>
                      <div className="bg-slate-800 p-3 rounded-lg text-center">
                        <p className="text-slate-400 text-xs uppercase tracking-wider">Hammers</p>
                        <p className="text-2xl font-bold text-orange-400">{inventorySummary['Hammer'] || 0}</p>
                      </div>
                      <div className="bg-slate-800 p-3 rounded-lg text-center">
                        <p className="text-slate-400 text-xs uppercase tracking-wider">Lightning (2nd)</p>
                        <p className="text-2xl font-bold text-purple-400">{inventorySummary['Lightning2'] || 0}</p>
                      </div>
                      <div className="bg-slate-800 p-3 rounded-lg text-center">
                        <p className="text-slate-400 text-xs uppercase tracking-wider">Lightning (3rd)</p>
                        <p className="text-2xl font-bold text-indigo-400">{inventorySummary['Lightning3'] || 0}</p>
                      </div>
                      <div className="bg-slate-800 p-3 rounded-lg text-center">
                        <p className="text-slate-400 text-xs uppercase tracking-wider">Time Ext</p>
                        <p className="text-2xl font-bold text-cyan-400">{inventorySummary['TimeExtender'] || 0}</p>
                      </div>
                      <div className="bg-slate-800 p-3 rounded-lg text-center">
                        <p className="text-slate-400 text-xs uppercase tracking-wider">Mist</p>
                        <p className="text-2xl font-bold text-gray-400">{inventorySummary['Mist'] || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                   <CardHeader>
                     <CardTitle className="text-base">Battle Inventory by Type</CardTitle>
                   </CardHeader>
                   <CardContent className="p-0">
                     <div className="max-h-[400px] overflow-y-auto">
                       {allActivePowerUps.length > 0 ? (
                         Object.entries(
                           allActivePowerUps.reduce((acc, item) => {
                             if (!acc[item.type]) {
                               acc[item.type] = [];
                             }
                             acc[item.type].push(item);
                             return acc;
                           }, {})
                         )
                         .sort(([typeA], [typeB]) => typeA.localeCompare(typeB))
                         .map(([type, items]) => (
                           <div key={type} className="border-b last:border-0">
                             <div className="p-3 bg-slate-50 font-semibold text-sm sticky top-0 flex items-center gap-2">
                               {getIcon(type)}
                               {type}
                             </div>
                             {items
                               .sort((a, b) => a.contact_name.localeCompare(b.contact_name))
                               .map((item) => (
                               <div key={item.id} className="flex justify-between items-center p-3 border-t text-sm hover:bg-blue-50">
                                 <div className="flex items-center gap-2">
                                   <span className="text-xs text-slate-600">{item.contact_name}</span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                   <span className="font-medium text-sm">{item.quantity}</span>
                                   <Button 
                                     size="icon" 
                                     variant="ghost" 
                                     className="h-5 w-5"
                                     onClick={() => updateItemMutation.mutate({ id: item.id, data: { quantity: Math.max(0, item.quantity - 1) } })}
                                   >
                                     <span className="text-xs">-1</span>
                                   </Button>
                                 </div>
                               </div>
                             ))}
                           </div>
                         ))
                       ) : (
                         <p className="p-4 text-center text-slate-500 text-sm">No items in inventory.</p>
                       )}
                     </div>
                   </CardContent>
                 </Card>
              </div>

            </div>
            )}

            {stationSubTab === 'gifters' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      💝 My Power-Ups for Others
                    </CardTitle>
                    <CardDescription>
                      Track who you have power-ups for and support them in battles
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {Object.keys(myPowerUpsByContact).length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        <Gift className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p>You don't have any power-ups yet!</p>
                        <p className="text-xs mt-2">Log power-ups in the Inventory tab to track who you're supporting.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {Object.entries(myPowerUpsByContact).map(([contactName, items]) => (
                          <div key={contactName} className="border rounded-lg p-4 bg-slate-50">
                            <div className="font-semibold text-slate-900 mb-3">@{contactName}</div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {items.reduce((acc, item) => {
                                const existing = acc.find(i => i.type === item.type);
                                if (existing) {
                                  existing.quantity += item.quantity;
                                } else {
                                  acc.push({ type: item.type, quantity: item.quantity });
                                }
                                return acc;
                              }, []).sort((a, b) => a.type.localeCompare(b.type)).map(summed => (
                                <div key={summed.type} className="bg-white p-3 rounded-lg border text-center">
                                  <div className="flex items-center justify-center mb-2">
                                    {getIcon(summed.type)}
                                  </div>
                                  <div className="text-sm font-semibold text-slate-900">{summed.quantity}</div>
                                  <div className="text-xs text-slate-600">{summed.type}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
            )}

            {stationSubTab === 'given' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Log Power-Up Given</CardTitle>
                    <CardDescription>Track power-ups you gave to others (expires 5 days after)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Input
                        placeholder="Who did you give it to? (name or @username)"
                        onChange={(e) => setNewItem({...newItem, contact_name: e.target.value})}
                        value={newItem.contact_name}
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Type</label>
                          <Select value={newItem.type} onValueChange={(v) => setNewItem({...newItem, type: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Glove">🥊 Glove</SelectItem>
                              <SelectItem value="Hammer">🔨 Hammer</SelectItem>
                              <SelectItem value="Lightning2">⚡ Lightning (2nd)</SelectItem>
                              <SelectItem value="Lightning3">⚡ Lightning (3rd)</SelectItem>
                              <SelectItem value="TimeExtender">⏱️ Time Extender</SelectItem>
                              <SelectItem value="Mist">🌫️ Mist</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Quantity</label>
                          <Input 
                            type="number" 
                            min="1" 
                            value={newItem.quantity}
                            onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Date Given</label>
                          <Input 
                            type="date" 
                            value={newItem.acquired_date}
                            onChange={(e) => setNewItem({...newItem, acquired_date: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Time Given</label>
                          <Select value={newItem.acquired_time} onValueChange={(v) => setNewItem({...newItem, acquired_time: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 24 }).map((_, i) => {
                                const hour = i.toString().padStart(2, '0');
                                return <SelectItem key={hour} value={`${hour}:00`}>{hour}:00</SelectItem>;
                              })}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button 
                        onClick={() => createGiftedMutation.mutate({ recipient_name: newItem.contact_name, type: newItem.type, quantity: newItem.quantity, given_date: newItem.acquired_date, given_time: newItem.acquired_time })}
                        disabled={!newItem.contact_name}
                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Plus className="w-4 h-4 mr-2" /> Log Power-Up Given
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Active Power-Ups Given</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activeGiftedPowerUps.length === 0 ? (
                      <p className="text-center text-slate-500 py-8">No active power-ups logged yet</p>
                    ) : (
                      <div className="space-y-3">
                        {activeGiftedPowerUps.map(item => {
                          const expires = parseISO(item.expires_at);
                          const now = new Date();
                          const hoursLeft = Math.max(0, Math.ceil((expires - now) / (1000 * 60 * 60)));
                          const daysLeft = Math.ceil(hoursLeft / 24);
                          return (
                            <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg bg-slate-50">
                              <div>
                                <div className="font-semibold text-slate-900">@{item.recipient_name}</div>
                                <div className="text-sm text-slate-600 flex items-center gap-2">
                                  <Badge variant="outline">{item.quantity} {item.type}</Badge>
                                  <span className={daysLeft <= 1 ? "text-red-600 font-medium" : "text-slate-600"}>
                                    Expires in {daysLeft > 1 ? `${daysLeft} days` : `${hoursLeft} hours`}
                                  </span>
                                </div>
                              </div>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => deleteGiftedMutation.mutate(item.id)}
                                className="text-red-400 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
            )}
            </TabsContent>
            </Tabs>
            </div>

      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Inventory Access</DialogTitle>
            <DialogDescription>
              Create a secure link for your Mod to manage your battle inventory.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mod's TikTok Username</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                  <Input 
                    value={modUsername} 
                    onChange={(e) => setModUsername(e.target.value)} 
                    placeholder="username"
                    className="pl-7"
                  />
                </div>
                <Button 
                  onClick={handleGenerateLink} 
                  disabled={!modUsername.trim() || shareLoading}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {shareLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate'}
                </Button>
              </div>
            </div>

            {generatedLink && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3"
              >
                <div className="flex items-center gap-2 text-green-800 font-medium">
                  <CheckCircle className="w-4 h-4" />
                  Link Created!
                </div>
                <div className="flex gap-2">
                  <Input value={generatedLink} readOnly className="bg-white text-xs font-mono" />
                  <Button 
                    size="icon" 
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedLink);
                      // Visual feedback could be added here
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-green-700">
                  Share this unique link with @{modUsername}. They can view and update your inventory without logging in.
                </p>
              </motion.div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Filter Component
function ArsenalFilter({ filter, onFilterChange }) {
  const types = [
    { label: '🥊 Glove', value: 'Glove' },
    { label: '🔨 Hammer', value: 'Hammer' },
    { label: '⚡ Lightning (2nd)', value: 'Lightning2' },
    { label: '⚡ Lightning (3rd)', value: 'Lightning3' },
    { label: '⏱️ Time Extender', value: 'TimeExtender' },
    { label: '🌫️ Mist', value: 'Mist' }
  ];

  return (
    <div className="flex gap-2 flex-wrap">
      <Button 
        size="sm"
        variant={filter === 'all' ? 'default' : 'outline'}
        onClick={() => onFilterChange('all')}
      >
        All
      </Button>
      {types.map(type => (
        <Button 
          key={type.value}
          size="sm"
          variant={filter === type.value ? 'default' : 'outline'}
          onClick={() => onFilterChange(type.value)}
        >
          {type.label}
        </Button>
      ))}
    </div>
  );
}

// Missing Icon import component
function Crosshair(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="22" x2="18" y1="12" y2="12" />
      <line x1="6" x2="2" y1="12" y2="12" />
      <line x1="12" x2="12" y1="6" y2="2" />
      <line x1="12" x2="12" y1="22" y2="18" />
    </svg>
  );
}