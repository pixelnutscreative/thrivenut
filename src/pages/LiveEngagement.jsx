import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { MapPin, RotateCcw, Trophy, Users, Palette, Briefcase, Plane, Sparkles, Check, X, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Engagement Lists
const engagementLists = {
  professions: [
    "Nurse", "Teacher", "Engineer", "Student", "Artist", "Driver", 
    "Business Owner", "Retail", "Tech/IT", "Hair/Beauty", "Food Service", "Stay at Home Parent",
    "Military/Vet", "Sales", "Real Estate", "Coach", "Creator", "Retired",
    "Construction", "Office/Admin", "Medical", "Legal", "Marketing", "Other"
  ],
  colors: [
    "Red", "Blue", "Green", "Yellow", "Purple", "Pink", 
    "Orange", "Black", "White", "Teal", "Gold/Silver", "Rainbow"
  ],
  vacations: [
    "Beach", "Mountains", "City", "Camping", "Cruise", "Disney/Theme Park",
    "Staycation", "Road Trip", "Europe", "Tropical Island", "Snow/Ski", "Historical"
  ],
  birth_months: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
};

// Map click handler component
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
}

export default function LiveEngagement() {
  const [activeTab, setActiveTab] = useState('map');
  const [markers, setMarkers] = useState([]); // { id, lat, lng, username, location }
  const [showMarkerDialog, setShowMarkerDialog] = useState(false);
  const [newMarkerPos, setNewMarkerPos] = useState(null);
  const [markerForm, setMarkerForm] = useState({ username: '', location: '' });
  
  // Bingo State
  const [activeList, setActiveList] = useState('professions');
  const [claimedSpots, setClaimedSpots] = useState({}); // { listType: { item: username } }
  const [showClaimDialog, setShowClaimDialog] = useState(false);
  const [claimItem, setClaimItem] = useState(null);
  const [claimUsername, setClaimUsername] = useState('');

  // Load from local storage on mount (session persistence)
  useEffect(() => {
    const savedMarkers = localStorage.getItem('live_session_markers');
    const savedSpots = localStorage.getItem('live_session_spots');
    if (savedMarkers) setMarkers(JSON.parse(savedMarkers));
    if (savedSpots) setClaimedSpots(JSON.parse(savedSpots));
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('live_session_markers', JSON.stringify(markers));
  }, [markers]);

  useEffect(() => {
    localStorage.setItem('live_session_spots', JSON.stringify(claimedSpots));
  }, [claimedSpots]);

  // Map Handlers
  const handleMapClick = (latlng) => {
    setNewMarkerPos(latlng);
    setMarkerForm({ username: '', location: '' });
    setShowMarkerDialog(true);
  };

  const saveMarker = () => {
    if (newMarkerPos && markerForm.username) {
      setMarkers(prev => [...prev, {
        id: Date.now(),
        lat: newMarkerPos.lat,
        lng: newMarkerPos.lng,
        ...markerForm
      }]);
      setShowMarkerDialog(false);
      setNewMarkerPos(null);
    }
  };

  const clearMap = () => {
    if (confirm('Clear all viewers from the map?')) {
      setMarkers([]);
    }
  };

  // Bingo Handlers
  const handleSpotClick = (item) => {
    // If already claimed, allow edit/remove
    const currentClaim = claimedSpots[activeList]?.[item];
    setClaimItem(item);
    setClaimUsername(currentClaim || '');
    setShowClaimDialog(true);
  };

  const saveClaim = () => {
    if (claimUsername.trim()) {
      setClaimedSpots(prev => ({
        ...prev,
        [activeList]: {
          ...(prev[activeList] || {}),
          [claimItem]: claimUsername
        }
      }));
      // Check for full board (simple "win" for now)
      const listLength = engagementLists[activeList].length;
      const claimedCount = Object.keys({ ...(claimedSpots[activeList] || {}), [claimItem]: claimUsername }).length;
      
      if (claimedCount === listLength) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        // Mini confetti for single claim
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.7 },
          colors: ['#8B5CF6', '#EC4899']
        });
      }
    } else {
      // Remove claim if empty
      const updatedList = { ...(claimedSpots[activeList] || {}) };
      delete updatedList[claimItem];
      setClaimedSpots(prev => ({
        ...prev,
        [activeList]: updatedList
      }));
    }
    setShowClaimDialog(false);
  };

  const clearBoard = () => {
    if (confirm('Clear this engagement board?')) {
      setClaimedSpots(prev => {
        const updated = { ...prev };
        delete updated[activeList];
        return updated;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 space-y-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Live Engagement</h1>
            <p className="text-gray-600">Interact with your viewers in real-time</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
            <TabsTrigger value="map">
              <MapPin className="w-4 h-4 mr-2" />
              Community Map
            </TabsTrigger>
            <TabsTrigger value="bingo">
              <Trophy className="w-4 h-4 mr-2" />
              Engagement Boards
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Where are you tuning in from?</CardTitle>
                  <p className="text-sm text-gray-500">Click the map to mark viewer locations</p>
                </div>
                <div className="flex gap-2">
                  <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    {markers.length} Viewers
                  </div>
                  <Button variant="outline" size="sm" onClick={clearMap} className="text-red-500 hover:text-red-700">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Map
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 h-[600px] relative">
                <MapContainer 
                  center={[39.8283, -98.5795]} 
                  zoom={4} 
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <MapClickHandler onMapClick={handleMapClick} />
                  {markers.map(marker => (
                    <Marker key={marker.id} position={[marker.lat, marker.lng]}>
                      <Popup>
                        <div className="text-center">
                          <p className="font-bold text-purple-700">@{marker.username}</p>
                          {marker.location && <p className="text-xs text-gray-500">{marker.location}</p>}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bingo" className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button 
                variant={activeList === 'professions' ? 'default' : 'outline'}
                onClick={() => setActiveList('professions')}
                className={activeList === 'professions' ? 'bg-blue-600' : ''}
              >
                <Briefcase className="w-4 h-4 mr-2" /> Professions
              </Button>
              <Button 
                variant={activeList === 'colors' ? 'default' : 'outline'}
                onClick={() => setActiveList('colors')}
                className={activeList === 'colors' ? 'bg-pink-600' : ''}
              >
                <Palette className="w-4 h-4 mr-2" /> Colors
              </Button>
              <Button 
                variant={activeList === 'vacations' ? 'default' : 'outline'}
                onClick={() => setActiveList('vacations')}
                className={activeList === 'vacations' ? 'bg-green-600' : ''}
              >
                <Plane className="w-4 h-4 mr-2" /> Vacation Spots
              </Button>
              <Button 
                variant={activeList === 'birth_months' ? 'default' : 'outline'}
                onClick={() => setActiveList('birth_months')}
                className={activeList === 'birth_months' ? 'bg-amber-600' : ''}
              >
                <Calendar className="w-4 h-4 mr-2" /> Birth Months
              </Button>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="capitalize">{activeList.replace('_', ' ')} Roll Call</CardTitle>
                <Button variant="outline" size="sm" onClick={clearBoard} className="text-red-500 hover:text-red-700">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Board
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {engagementLists[activeList].map((item, idx) => {
                    const claimedBy = claimedSpots[activeList]?.[item];
                    return (
                      <div
                        key={idx}
                        onClick={() => handleSpotClick(item)}
                        className={`
                          relative p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-105
                          flex flex-col items-center justify-center text-center min-h-[120px]
                          ${claimedBy 
                            ? 'bg-gradient-to-br from-purple-100 to-pink-100 border-purple-400 shadow-md' 
                            : 'bg-white border-dashed border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        {claimedBy ? (
                          <>
                            <div className="absolute top-2 right-2">
                              <Check className="w-4 h-4 text-green-600" />
                            </div>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{item}</span>
                            <span className="font-bold text-lg text-purple-700 break-all px-2">@{claimedBy}</span>
                            <span className="text-[10px] text-gray-400 mt-1">Daily Heart Me!</span>
                          </>
                        ) : (
                          <>
                            <span className="font-medium text-gray-700 text-lg">{item}</span>
                            <span className="text-xs text-gray-400 mt-2">Available</span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Marker Dialog */}
        <Dialog open={showMarkerDialog} onOpenChange={setShowMarkerDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Viewer Location</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input
                  placeholder="@username"
                  value={markerForm.username}
                  onChange={(e) => setMarkerForm({ ...markerForm, username: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && saveMarker()}
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">City, State (Optional)</label>
                <Input
                  placeholder="e.g. Austin, TX"
                  value={markerForm.location}
                  onChange={(e) => setMarkerForm({ ...markerForm, location: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && saveMarker()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={saveMarker} disabled={!markerForm.username}>Add to Map</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Claim Spot Dialog */}
        <Dialog open={showClaimDialog} onOpenChange={setShowClaimDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Claim Spot: {claimItem}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-gray-600">
                Who grabbed the daily heart me for this spot?
              </p>
              <Input
                placeholder="@username"
                value={claimUsername}
                onChange={(e) => setClaimUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveClaim()}
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => { setClaimUsername(''); saveClaim(); }}>Clear Spot</Button>
              <Button onClick={saveClaim}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}