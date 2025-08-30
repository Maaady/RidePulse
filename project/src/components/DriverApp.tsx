import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { wsService } from '../services/websocket';
import { apiService } from '../services/api';
import { Driver, Trip } from '../types';
import { Map } from './Map';
import { 
  Power, 
  Navigation, 
  Clock, 
  DollarSign, 
  Star, 
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  PlayCircle
} from 'lucide-react';

export function DriverApp() {
  const { user, logout } = useAuth();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [earnings, setEarnings] = useState(0);

  useEffect(() => {
    if (user && user.role === 'driver') {
      loadDriverData();
      connectWebSocket();
      startLocationSharing();
    }

    return () => {
      wsService.disconnect();
      stopLocationSharing();
    };
  }, [user]);

  const loadDriverData = async () => {
    const driverData = apiService.getDriver(user!.id);
    if (driverData) {
      setDriver(driverData);
    }
  };

  const connectWebSocket = async () => {
    await wsService.connect();
    
    // Subscribe to trip assignments
    wsService.subscribe('trip_assigned', (data) => {
      if (data.driverId === user!.id) {
        setCurrentTrip(data);
      }
    });

    // Subscribe to trip status updates
    wsService.subscribe('trip_status', (data) => {
      if (data.driverId === user!.id) {
        setCurrentTrip(prev => prev ? { ...prev, status: data.status } : null);
        
        if (data.status === 'completed') {
          setEarnings(prev => prev + (data.fare || 0));
          setCurrentTrip(null);
        }
      }
    });
  };

  const startLocationSharing = () => {
    if (!locationSharing) return;

    const interval = setInterval(() => {
      if (driver && isOnline) {
        // Simulate GPS updates
        const newLocation = {
          latitude: driver.location.latitude + (Math.random() - 0.5) * 0.001,
          longitude: driver.location.longitude + (Math.random() - 0.5) * 0.001,
          heading: driver.location.heading + (Math.random() - 0.5) * 10,
          timestamp: Date.now()
        };

        setDriver(prev => prev ? { ...prev, location: newLocation } : null);
        
        // Publish location update
        wsService.publish('location_update', {
          driverId: user!.id,
          location: newLocation,
          status: driver.status
        });

        // Update API
        apiService.updateDriverLocation(user!.id, newLocation);
      }
    }, 3000);

    return () => clearInterval(interval);
  };

  const stopLocationSharing = () => {
    // Location sharing cleanup handled by useEffect cleanup
  };

  const toggleOnlineStatus = async () => {
    const newStatus = isOnline ? 'offline' : 'available';
    setIsOnline(!isOnline);
    
    if (driver) {
      await apiService.updateDriverStatus(driver.id, newStatus);
      setDriver(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const acceptTrip = async () => {
    if (currentTrip) {
      await apiService.updateTripStatus(currentTrip.id, 'picked_up');
      setCurrentTrip(prev => prev ? { ...prev, status: 'picked_up' } : null);
    }
  };

  const startTrip = async () => {
    if (currentTrip) {
      await apiService.updateTripStatus(currentTrip.id, 'in_progress');
      setCurrentTrip(prev => prev ? { ...prev, status: 'in_progress' } : null);
    }
  };

  const completeTrip = async () => {
    if (currentTrip) {
      await apiService.updateTripStatus(currentTrip.id, 'completed');
      setEarnings(prev => prev + (currentTrip.fare || 0));
      setCurrentTrip(null);
      
      if (driver) {
        await apiService.updateDriverStatus(driver.id, 'available');
        setDriver(prev => prev ? { ...prev, status: 'available' } : null);
      }
    }
  };

  if (!driver) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading driver profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-500 text-white rounded-full p-2">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-lg">RidePulse Driver</h1>
                <p className="text-sm text-gray-600">Welcome, {driver.name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm text-gray-600">Today's Earnings</p>
                <p className="font-bold text-lg text-success-600">₹{earnings}</p>
              </div>
              
              <button
                onClick={toggleOnlineStatus}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                  isOnline 
                    ? 'bg-success-500 hover:bg-success-600 text-white' 
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                }`}
              >
                <Power className="w-4 h-4" />
                <span>{isOnline ? 'Online' : 'Offline'}</span>
              </button>
              
              <button
                onClick={logout}
                className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Map Section */}
        <div className="order-2 lg:order-1">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <h2 className="text-lg font-semibold mb-4">Live Map</h2>
            <Map 
              drivers={driver ? [driver] : []}
              trips={currentTrip ? [currentTrip] : []}
              selectedTrip={currentTrip}
              className="h-96"
            />
          </div>
        </div>

        {/* Status & Trip Section */}
        <div className="order-1 lg:order-2 space-y-6">
          {/* Driver Status */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Driver Status</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Star className="w-6 h-6 text-warning-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{driver.rating}</div>
                <div className="text-sm text-gray-600">Rating</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <Clock className="w-6 h-6 text-primary-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{driver.totalTrips}</div>
                <div className="text-sm text-gray-600">Total Trips</div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Location Sharing</span>
                <div className={`w-3 h-3 rounded-full ${locationSharing ? 'bg-success-500 animate-pulse' : 'bg-gray-400'}`}></div>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {locationSharing ? 'Broadcasting live location' : 'Location sharing disabled'}
              </div>
            </div>
          </div>

          {/* Current Trip */}
          {currentTrip ? (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Current Trip</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Rider: {currentTrip.riderName}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    currentTrip.status === 'assigned' ? 'bg-primary-100 text-primary-700' :
                    currentTrip.status === 'picked_up' ? 'bg-warning-100 text-warning-700' :
                    'bg-success-100 text-success-700'
                  }`}>
                    {currentTrip.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-4 h-4 text-primary-500 mt-1" />
                    <div>
                      <div className="font-medium text-sm">Pickup</div>
                      <div className="text-gray-600 text-sm">{currentTrip.pickup.address}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Navigation className="w-4 h-4 text-error-500 mt-1" />
                    <div>
                      <div className="font-medium text-sm">Destination</div>
                      <div className="text-gray-600 text-sm">{currentTrip.destination.address}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Fare: ₹{currentTrip.fare}</span>
                  <span className="text-gray-600">Distance: {currentTrip.distance?.toFixed(1)} km</span>
                </div>

                {/* Trip Actions */}
                <div className="space-y-2 mt-6">
                  {currentTrip.status === 'assigned' && (
                    <button
                      onClick={acceptTrip}
                      className="w-full bg-success-500 hover:bg-success-600 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Arrived at Pickup</span>
                    </button>
                  )}
                  
                  {currentTrip.status === 'picked_up' && (
                    <button
                      onClick={startTrip}
                      className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <PlayCircle className="w-4 h-4" />
                      <span>Start Trip</span>
                    </button>
                  )}
                  
                  {currentTrip.status === 'in_progress' && (
                    <button
                      onClick={completeTrip}
                      className="w-full bg-success-500 hover:bg-success-600 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Complete Trip</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Waiting for Rides</h3>
              <p className="text-gray-600 text-sm">
                You're online and ready to receive trip requests
              </p>
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Today's Summary</h2>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary-600">12</div>
                <div className="text-sm text-gray-600">Trips</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-success-600">8.5h</div>
                <div className="text-sm text-gray-600">Online</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}