import React, { useEffect, useRef, useState } from 'react';
import { Driver, Trip } from '../types';
import { Car, Navigation, MapPin, Clock } from 'lucide-react';

interface MapProps {
  drivers: Driver[];
  trips?: Trip[];
  center?: { lat: number; lng: number };
  className?: string;
  selectedTrip?: Trip | null;
  onDriverClick?: (driver: Driver) => void;
}

export function Map({ 
  drivers, 
  trips = [], 
  center = { lat: 28.6139, lng: 77.2090 }, 
  className = '',
  selectedTrip,
  onDriverClick 
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapCenter, setMapCenter] = useState(center);
  const [zoom, setZoom] = useState(12);

  // Simulate map coordinates to pixel conversion
  const coordsToPixels = (lat: number, lng: number) => {
    const mapWidth = 800;
    const mapHeight = 600;
    
    // Simple projection for demo (not accurate for real use)
    const x = ((lng - (mapCenter.lng - 0.1)) / 0.2) * mapWidth;
    const y = ((mapCenter.lat + 0.1 - lat) / 0.2) * mapHeight;
    
    return { x: Math.max(0, Math.min(mapWidth, x)), y: Math.max(0, Math.min(mapHeight, y)) };
  };

  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType) {
      case 'car': return '🚗';
      case 'bike': return '🏍️';
      case 'auto': return '🛺';
      default: return '🚗';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-success-500';
      case 'busy': return 'bg-warning-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className={`relative bg-gray-100 rounded-lg overflow-hidden ${className}`}>
      {/* Map Container */}
      <div 
        ref={mapRef}
        className="w-full h-full bg-gray-200 relative"
        style={{
          backgroundImage: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="%23e5e7eb" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="%23f3f4f6"/><rect width="100" height="100" fill="url(%23grid)"/></svg>')`,
          minHeight: '400px'
        }}
      >
        {/* Map Controls */}
        <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
          <button
            onClick={() => setZoom(prev => Math.min(prev + 1, 18))}
            className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-2 shadow-md transition-colors duration-200"
          >
            <span className="text-lg font-bold text-gray-700">+</span>
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(prev - 1, 8))}
            className="bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-2 shadow-md transition-colors duration-200"
          >
            <span className="text-lg font-bold text-gray-700">-</span>
          </button>
        </div>

        {/* Legend */}
        <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-md p-3 max-w-xs">
          <h3 className="font-medium text-gray-900 mb-2">Driver Status</h3>
          <div className="space-y-1 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-success-500"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-warning-500"></div>
              <span>Busy</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
              <span>Offline</span>
            </div>
          </div>
        </div>

        {/* Driver Markers */}
        {drivers.map((driver) => {
          const position = coordsToPixels(driver.location.latitude, driver.location.longitude);
          
          return (
            <div
              key={driver.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 hover:scale-110"
              style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
              }}
              onClick={() => onDriverClick?.(driver)}
            >
              {/* Driver Marker */}
              <div className={`relative ${getStatusColor(driver.status)} rounded-full p-2 shadow-lg`}>
                <div className="text-white text-lg">
                  {getVehicleIcon(driver.vehicleType)}
                </div>
                
                {/* Pulsing effect for available drivers */}
                {driver.status === 'available' && (
                  <div className="absolute inset-0 rounded-full bg-success-500 animate-ping opacity-20"></div>
                )}
                
                {/* Driver info tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  <div className="font-medium">{driver.name}</div>
                  <div className="text-gray-300">
                    {driver.vehicleType.toUpperCase()} • {driver.vehicleNumber}
                  </div>
                  <div className="text-gray-300">
                    ⭐ {driver.rating} • {driver.totalTrips} trips
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Selected Trip Route */}
        {selectedTrip && (
          <>
            {/* Pickup Location */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${coordsToPixels(selectedTrip.pickup.latitude, selectedTrip.pickup.longitude).x}px`,
                top: `${coordsToPixels(selectedTrip.pickup.latitude, selectedTrip.pickup.longitude).y}px`,
              }}
            >
              <div className="bg-primary-500 text-white rounded-full p-2 shadow-lg">
                <MapPin className="w-5 h-5" />
              </div>
            </div>

            {/* Destination */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${coordsToPixels(selectedTrip.destination.latitude, selectedTrip.destination.longitude).x}px`,
                top: `${coordsToPixels(selectedTrip.destination.latitude, selectedTrip.destination.longitude).y}px`,
              }}
            >
              <div className="bg-error-500 text-white rounded-full p-2 shadow-lg">
                <Navigation className="w-5 h-5" />
              </div>
            </div>

            {/* Route Line (simplified) */}
            <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
              <line
                x1={coordsToPixels(selectedTrip.pickup.latitude, selectedTrip.pickup.longitude).x}
                y1={coordsToPixels(selectedTrip.pickup.latitude, selectedTrip.pickup.longitude).y}
                x2={coordsToPixels(selectedTrip.destination.latitude, selectedTrip.destination.longitude).x}
                y2={coordsToPixels(selectedTrip.destination.latitude, selectedTrip.destination.longitude).y}
                stroke="#0066FF"
                strokeWidth="3"
                strokeDasharray="5,5"
                className="animate-pulse"
              />
            </svg>
          </>
        )}

        {/* Center Marker */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
        </div>
      </div>

      {/* Map Info */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4" />
          <span>New Delhi, India</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Zoom: {zoom} • {drivers.length} drivers online
        </div>
      </div>
    </div>
  );
}