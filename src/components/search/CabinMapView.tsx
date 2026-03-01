
import React, { useEffect, useRef, useState } from 'react';
import { getImageUrl } from '@/lib/utils';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin } from 'lucide-react';

interface CabinResult {
  _id: string;
  name: string;
  description: string;
  price: number;
  capacity: number;
  imageSrc: string;
  category: 'standard' | 'premium' | 'luxury';
  location: {
    coordinates: {
      latitude: number;
      longitude: number;
    };
    fullAddress: string;
    city: { _id:string, name:string};
    state: { _id:string, name:string};
    area?: { _id:string, name:string};
  };
  averageRating?: number;
  distance?: number;
}

interface CabinMapViewProps {
  cabins: CabinResult[];
  selectedLocation?: { lat: number; lng: number } | null;
  loading?: boolean;
}

export const CabinMapView = ({ cabins, selectedLocation, loading }: CabinMapViewProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [selectedCabin, setSelectedCabin] = useState<CabinResult | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const navigate = useNavigate();

  useEffect(() => {
    if (!mapContainer.current) return;
      
    // Initialize Map
    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm',
          },
        ],
      },
      center: selectedLocation ? [selectedLocation.lng, selectedLocation.lat] : [77.2090, 28.6139],
      zoom: selectedLocation ? 12 : 5,
    });

    mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    mapRef.current.addControl(
        new maplibregl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true
        })
    );

    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          // Fly to current location
          // mapRef.current?.flyTo({
          //   center: [longitude, latitude],
          //   zoom: 14,
          // });
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    } else {
      console.warn('Geolocation not supported by this browser.');
    }

    return () => {
      // Clean up markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
    };
  }, [selectedLocation]);

  useEffect(() => {
    if (!mapRef.current || !cabins?.length) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    cabins.forEach(cabin => {
      const { latitude, longitude } = cabin.location.coordinates;

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'cabin-marker';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.borderRadius = '50%';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.color = 'white';
      el.style.fontWeight = 'bold';
      el.style.boxShadow = '0 4px 8px rgba(0,0,0,0.3)';
      el.style.cursor = 'pointer';
      el.style.border = '2px solid white';
      el.style.fontSize = '12px';

      // Set background color based on category
      el.style.backgroundColor =
        cabin.category === 'luxury' ? '#f59e0b' :
        cabin.category === 'premium' ? '#8b5cf6' :
        '#3b82f6';

      el.innerText = '₹';

      // Create popup content
      const popupContent = document.createElement('div');
      popupContent.className = 'cabin-popup';
      popupContent.style.minWidth = '220px';
      popupContent.innerHTML = `
        <div class="p-3">
          <div class="flex items-start justify-between mb-2">
            <h3 class="font-semibold text-sm">${cabin.name}</h3>
            <span class="text-xs px-2 py-1 rounded ${
              cabin.category === 'luxury' ? 'bg-amber-100 text-amber-800' :
              cabin.category === 'premium' ? 'bg-purple-100 text-purple-800' :
              'bg-blue-100 text-blue-800'
            }">${cabin.category}</span>
          </div>
          <div class="flex items-center text-xs text-gray-600 mb-2">
            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
            <span>${cabin.location.area?.name}, ${cabin.location.city?.name}</span>
          </div>
          <div class="text-lg font-semibold text-primary mb-3">
            ₹${cabin.price}/month
          </div>
          <div class="text-xs text-gray-600 mb-3">
            Capacity: ${cabin.capacity} person${cabin.capacity !== 1 ? 's' : ''}
          </div>
          <div class="flex gap-2">
            <button 
              class="book-now-btn flex-1 px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              data-cabin-id="${(cabin as any).serial_number || cabin._id}"
            >
              Book Now
            </button>
          </div>
        </div>
      `;

      // Add event listeners to buttons
      const viewDetailsBtn = popupContent.querySelector('.view-details-btn');
      const bookNowBtn = popupContent.querySelector('.book-now-btn');

      const cabinSlug = (cabin as any).serial_number || cabin._id;
      viewDetailsBtn?.addEventListener('click', () => {
        navigate(`/cabins/${cabinSlug}`);
      });

      bookNowBtn?.addEventListener('click', () => {
        navigate(`/book-seat/${cabinSlug}`);
      });

      // Create popup
      const popup = new maplibregl.Popup({
        offset: 5,
        closeButton: true,
        closeOnClick: false
      }).setDOMContent(popupContent);

      // Create marker
      const marker = new maplibregl.Marker(el)
        .setLngLat([longitude, latitude])
        .setPopup(popup)
        .addTo(mapRef.current);

      // Add click event to marker
      el.addEventListener('click', () => {
        setSelectedCabin(cabin);
        console.log(cabin)
        // mapRef.current?.flyTo({
        //   center: [longitude, latitude],
        //   zoom: 15
        // });
      });

      markersRef.current.push(marker);
    });

    // Fit map to show all markers if there are cabins
    if (cabins.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      cabins.forEach(cabin => {
        bounds.extend([cabin.location.coordinates.longitude, cabin.location.coordinates.latitude]);
      });
      
      mapRef.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      });
    }
  }, [cabins, navigate]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'luxury': return 'bg-amber-500';
      case 'premium': return 'bg-purple-500';
      default: return 'bg-blue-500';
    }
  };

  const handleBookNow = (cabinId: string) => navigate(`/book-seat/${cabinId}`); // cabinId here is already slug from selectedCabin

  return (
    <div className="space-y-4">
      <div className="relative w-full h-96 rounded-lg overflow-hidden border">
        <div ref={mapContainer} className="absolute inset-0" />
        
        {/* Category Legend */}
        {/* <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-md z-[1000]">
          <div className="text-sm font-medium mb-2">Categories</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span>Standard</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full" />
              <span>Premium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-amber-500 rounded-full" />
              <span>Luxury</span>
            </div>
          </div>
        </div> */}

        {/* Loading indicator */}
        {loading && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center z-[1001]">
            <div className="bg-white p-4 rounded-lg shadow-lg">
              <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          </div>
        )}
      </div>

      {selectedCabin && (
        <Card className="border-primary">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <img
                src={getImageUrl(selectedCabin.imageSrc) || '/placeholder.svg'} 
                alt={selectedCabin.name}
                className="w-20 h-20 object-cover rounded-lg"
              />
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{selectedCabin.name}</h3>
                  <Badge className={getCategoryColor(selectedCabin.category)}>
                    {selectedCabin.category}
                  </Badge>
                </div>
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="truncate">{selectedCabin.location?.area ? selectedCabin.location?.area.name + ", " :''}{selectedCabin.location?.city?.name}</span>
                </div>
                <div className="text-lg font-semibold text-primary mb-3">
                  ₹{selectedCabin.price}/month
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleBookNow((selectedCabin as any).serial_number || selectedCabin._id)}>
                    Book Now
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-sm text-muted-foreground">
        Showing {cabins.length} reading room{cabins.length !== 1 ? 's' : ''} on the map
      </div>
    </div>
  );
};
