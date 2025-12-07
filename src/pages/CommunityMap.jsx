import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, MapPin, Users } from 'lucide-react';
import { useTheme } from '../components/shared/useTheme';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

export default function CommunityMap() {
  const { isDark, bgClass, primaryColor } = useTheme();
  const [geocodedLocations, setGeocodedLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  const { data: preferences = [] } = useQuery({
    queryKey: ['allPreferences'],
    queryFn: () => base44.entities.UserPreferences.filter({ show_on_map: true }),
  });

  // Geocode locations using a free service
  useEffect(() => {
    const geocodeLocations = async () => {
      const results = [];
      
      for (const pref of preferences) {
        if (!pref.location_city || !pref.location_state) continue;
        
        try {
          // Use Nominatim (OpenStreetMap) for free geocoding
          const query = `${pref.location_city}, ${pref.location_state}`;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
            {
              headers: {
                'User-Agent': 'LetsThriveApp/1.0'
              }
            }
          );
          
          const data = await response.json();
          
          if (data && data[0]) {
            results.push({
              lat: parseFloat(data[0].lat),
              lng: parseFloat(data[0].lon),
              city: pref.location_city,
              state: pref.location_state,
              display_name: data[0].display_name
            });
          }
          
          // Rate limiting - wait between requests
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error('Geocoding error:', error);
        }
      }
      
      setGeocodedLocations(results);
      setLoading(false);
    };

    if (preferences.length > 0) {
      geocodeLocations();
    } else {
      setLoading(false);
    }
  }, [preferences]);

  if (loading) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  // Calculate center point (average of all locations)
  const centerLat = geocodedLocations.length > 0
    ? geocodedLocations.reduce((sum, loc) => sum + loc.lat, 0) / geocodedLocations.length
    : 39.8283; // Center of US
  const centerLng = geocodedLocations.length > 0
    ? geocodedLocations.reduce((sum, loc) => sum + loc.lng, 0) / geocodedLocations.length
    : -98.5795; // Center of US

  return (
    <div className={`min-h-screen ${bgClass} p-4 md:p-8`}>
      <div className="max-w-7xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-6 h-6" style={{ color: primaryColor }} />
              Community Map
            </CardTitle>
            <CardDescription>
              See where our Let's Thrive! community members are from around the world
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>{geocodedLocations.length} members sharing their location</span>
            </div>

            {geocodedLocations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No locations shared yet. Be the first to share your location in Settings!</p>
              </div>
            ) : (
              <div className="h-[600px] rounded-lg overflow-hidden border">
                <MapContainer
                  center={[centerLat, centerLng]}
                  zoom={4}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {geocodedLocations.map((location, idx) => (
                    <Marker key={idx} position={[location.lat, location.lng]}>
                      <Popup>
                        <div className="text-center">
                          <p className="font-semibold">{location.city}, {location.state}</p>
                          <p className="text-xs text-gray-500">{location.display_name}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            )}

            <div className="mt-4 text-sm text-gray-500">
              <p>💡 Want to appear on the map? Update your location in Settings and check "Show me on the community map"</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}