import React, { useRef, useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapPickerProps {
  name: string;
  initialLocation?: { lat: number; lng: number };
  onLocationSelect: (location: { lat: number; lng: number }) => void;
}

const MapPickerComponent = ({ initialLocation, name, onLocationSelect }: MapPickerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const defaultLocation = initialLocation || { lat: 20.5937, lng: 78.9629 };
  const [zoom] = useState(initialLocation ? 14 : 4);
  const [currentLocation] = useState(defaultLocation);

  useEffect(() => {
    mapRef.current = new maplibregl.Map({
      container: mapContainer.current!,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm'
          }
        ]
      },
      center: defaultLocation,
      zoom: zoom
    });

    mapRef.current.addControl(new maplibregl.NavigationControl(), 'top-right');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          mapRef.current?.flyTo({
            center: [longitude, latitude],
            zoom: 14
          });

          const marker = new maplibregl.Marker({ color: 'blue' })
            .setLngLat([longitude, latitude])
            .setPopup(new maplibregl.Popup({ offset: 25 }).setText('Current Location'))
            .addTo(mapRef.current!);
          marker.togglePopup();
          markersRef.current.push(marker);
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }

    mapRef.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      const newLocation = { lat, lng };
      onLocationSelect(newLocation);

      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];

      const el = document.createElement('div');
      el.style.backgroundColor = 'red';
      el.style.width = '12px';
      el.style.height = '12px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 0 4px rgba(0, 0, 0, 0.3)';

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(new maplibregl.Popup({ offset: 25 }).setText('Hostel Location'))
        .addTo(mapRef.current!);
      marker.togglePopup();
      markersRef.current.push(marker);
    });

    return () => {
      mapRef.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (initialLocation && initialLocation.lng && initialLocation.lng !== 0) {
      const timer = setTimeout(() => {
        if (mapRef.current) {
          const el = document.createElement('div');
          el.style.backgroundColor = 'red';
          el.style.width = '12px';
          el.style.height = '12px';
          el.style.borderRadius = '50%';
          el.style.border = '2px solid white';
          el.style.boxShadow = '0 0 4px rgba(0, 0, 0, 0.3)';

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([initialLocation.lng, initialLocation.lat])
            .setPopup(new maplibregl.Popup({ offset: 25 }).setText(name + ' Hostel Location'))
            .addTo(mapRef.current!);
          marker.togglePopup();

          markersRef.current.push(marker);
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [initialLocation]);

  return (
    <div>
      <h2 className="text-lg font-bold mb-2">Your Current Location</h2>
      <div
        ref={mapContainer}
        style={{ width: '100%', height: '400px', border: '1px solid #ccc' }}
      />
    </div>
  );
};

// ✅ Memoized export with custom comparison
const MapPicker = React.memo(MapPickerComponent);

export default MapPicker;
