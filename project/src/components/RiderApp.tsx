import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { wsService } from '../services/websocket';
import { apiService } from '../services/api';
import { Driver, Trip, Rider } from '../types';
import { Map } from './Map';
import { calculateDistance, calculateETA } from '../utils/geolocation';
import { 
  MapPin, 
  Navigation, 
  Search, 
  Clock, 
  DollarSign, 
  Star,
  User,
  Phone,
  Car,
  XCircle
} from 'lucide-react';

export function RiderApp() {
  const { user, logout } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [rider, setRider] = useState<Rider | null>(null);
  const [pickupLocation, setPickupLocation] = useState('');
  const [destinationLocation, setDestinationLocation] = useState('');
  const [showBooking, setShowBooking] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [estimatedFare, setEstimatedFare] = useState<number | null>(null);

  useEffect(() => {
    if (user && user.role === 'rider') {
      loadRiderData();
      loadDrivers();
      connectWebSocket();
    }

    return () => {
      wsService.disconnect();
    };
  }, [user]);

  const loadRiderData = () => {
    const riderData = apiService.getRider(user!.id);
    if (riderData) {
      setRider(riderData);
    }
  };

  const loadDrivers = async () => {
    const driversData = await apiService.getDrivers();
    setDrivers(driversData);
  };

  const connectWebSocket = async () => {
    await wsService.connect();
    
    // Subscribe to driver location updates
    wsService.subscribe('location_update', (data) => {
      setDrivers(prev => prev.map(driver => 
        driver.id === data.driverId 
          ? { ...driver, location: data.location, status: data.status }
          : driver
      ));
    });

    // Subscribe to trip updates
    wsService.subscribe('trip_assigned', (data) => {
      if (data.riderId === user!.id) {
        setCurrentTrip(data);
        setShowBooking(false);
      }
    });

    wsService.subscribe('trip_status', (data) => {
      if (data.riderId === user!.id) {
        setCurrentTrip(prev => prev ? { ...prev, status: data.status } : null);
        
        if (data.status === 'completed') {
          setTimeout(() => setCurrentTrip(null), 3000); // Clear after 3 seconds
        }
      }
    });
  };

  const requestRide = async () => {
    if (!pickupLocation || !destinationLocation || !rider?.location) return;

    // Mock coordinates for demo
    const pickup = {
      latitude: rider.location.latitude,
      longitude: rider.location.longitude,
      address: pickupLocation
    };

    const destination = {
      latitude: rider.location.latitude + (Math.random() - 0.5) * 0.02,
      longitude: rider.location.longitude + (Math.random() - 0.5) * 0.02,
      address: destinationLocation
    };

    const trip = await apiService.requestTrip(user!.id, pickup, destination);
    setCurrentTrip(trip);
    setShowBooking(false);
    setPickupLocation('');
    setDestinationLocation('');
  };

  const cancelTrip = async () => {
    if (currentTrip && ['requested', 'assigned'].includes(currentTrip.status)) {
      await apiService.updateTripStatus(currentTrip.id, 'cancelled');
      setCurrentTrip(null);
    }
  };

  const calculateEstimatedFare = () => {
    if (!rider?.location || !destinationLocation) return;
    
    // Mock destination coordinates
    const destCoords = {
      latitude: rider.location.latitude + (Math.random() - 0.5) * 0.02,
      longitude: rider.location.longitude + (Math.random() - 0.5) * 0.02
    };

    const distance = calculateDistance(
      rider.location.latitude,
      rider.location.longitude,
      destCoords.latitude,
      destCoords.longitude
    );

    const fare = Math.ceil(distance * 15 + 50);
    setEstimatedFare(fare);
  };

  useEffect(() => {
    if (destinationLocation) {
      calculateEstimatedFare();
    }
  }, [destinationLocation]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-500 text-white rounded-full p-2">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-lg">RidePulse</h1>
                <p className="text-sm text-gray-600">Hey, {rider?.name || user?.name}!</p>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Current Trip Status */}
        {currentTrip ? (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Your Trip</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                currentTrip.status === 'requested' ? 'bg-warning-100 text-warning-700' :
                currentTrip.status === 'assigned' ? 'bg-primary-100 text-primary-700' :
                currentTrip.status === 'picked_up' ? 'bg-warning-100 text-warning-700' :
                currentTrip.status === 'in_progress' ? 'bg-success-100 text-success-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {currentTrip.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            {currentTrip.driverName && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{currentTrip.driverName}</div>
                    <div className="text-sm text-gray-600 flex items-center space-x-2">
                      <Star className="w-4 h-4 text-warning-500" />
                      <span>4.8 • Car</span>
                    </div>
                  </div>
                  <button className="bg-success-500 hover:bg-success-600 text-white p-2 rounded-full transition-colors duration-200">
                    <Phone className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-primary-500 mt-1" />
                <div className="flex-1">
                  <div className="font-medium text-sm">Pickup</div>
                  <div className="text-gray-600 text-sm">{currentTrip.pickup.address}</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Navigation className="w-4 h-4 text-error-500 mt-1" />
                <div className="flex-1">
                  <div className="font-medium text-sm">Destination</div>
                  <div className="text-gray-600 text-sm">{currentTrip.destination.address}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm">
                <span className="text-gray-600">Fare: </span>
                <span className="font-bold text-lg">₹{currentTrip.fare}</span>
              </div>
              
              {['requested', 'assigned'].includes(currentTrip.status) && (
                <button
                  onClick={cancelTrip}
                  className="bg-error-500 hover:bg-error-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
              )}
            </div>

            {currentTrip.estimatedArrival && (
              <div className="mt-4 bg-primary-50 border border-primary-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-primary-600" />
                  <span className="text-sm font-medium text-primary-900">
                    ETA: {Math.ceil((currentTrip.estimatedArrival - Date.now()) / 60000)} minutes
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Booking Form */
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Book a Ride</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    placeholder="Enter pickup location"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination
                </label>
                <div className="relative">
                  <Navigation className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={destinationLocation}
                    onChange={(e) => setDestinationLocation(e.target.value)}
                    placeholder="Where to?"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              {estimatedFare && (
                <div className="bg-success-50 border border-success-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-success-900">Estimated Fare</span>
                    <span className="text-lg font-bold text-success-700">₹{estimatedFare}</span>
                  </div>
                </div>
              )}

              <button
                onClick={requestRide}
                disabled={!pickupLocation || !destinationLocation}
                className="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Search className="w-4 h-4" />
                <span>Find Drivers</span>
              </button>
            </div>
          </div>
        )}

        {/* Live Map */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <Navigation className="w-5 h-5 text-primary-500" />
            <span>Live Driver Locations</span>
            <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
          </h2>
          <Map 
            drivers={drivers.filter(d => d.status !== 'offline')}
            trips={currentTrip ? [currentTrip] : []}
            selectedTrip={currentTrip}
            className="h-96"
            onDriverClick={setSelectedDriver}
          />
        </div>

        {/* Available Drivers */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Available Drivers</h2>
          <div className="space-y-3">
            {drivers.filter(d => d.status === 'available').slice(0, 5).map(driver => (
              <div key={driver.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <div className="flex items-center space-x-3">
                  <div className="text-lg">{driver.vehicleType === 'car' ? '🚗' : driver.vehicleType === 'bike' ? '🏍️' : '🛺'}</div>
                  <div>
                    <div className="font-medium">{driver.name}</div>
                    <div className="text-sm text-gray-600 flex items-center space-x-1">
                      <Star className="w-3 h-3 text-warning-500" />
                      <span>{driver.rating}</span>
                      <span>•</span>
                      <span>{driver.vehicleNumber}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{rider?.location ? 
                    calculateDistance(
                      rider.location.latitude,
                      rider.location.longitude,
                      driver.location.latitude,
                      driver.location.longitude
                    ).toFixed(1) : '0.0'} km</div>
                  <div className="text-xs text-gray-600">{rider?.location ?
                    calculateETA(
                      calculateDistance(
                        rider.location.latitude,
                        rider.location.longitude,
                        driver.location.latitude,
                        driver.location.longitude
                      )
                    ) : 0} min away</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Driver Details Modal */}
      {selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-md animate-slide-up">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Driver Details</h3>
                <button
                  onClick={() => setSelectedDriver(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-primary-500 text-white rounded-full flex items-center justify-center text-2xl">
                  {selectedDriver.vehicleType === 'car' ? '🚗' : 
                   selectedDriver.vehicleType === 'bike' ? '🏍️' : '🛺'}
                </div>
                <div>
                  <div className="font-bold text-lg">{selectedDriver.name}</div>
                  <div className="text-sm text-gray-600">{selectedDriver.vehicleNumber}</div>
                  <div className="flex items-center space-x-1 mt-1">
                    <Star className="w-4 h-4 text-warning-500" />
                    <span className="font-medium">{selectedDriver.rating}</span>
                    <span className="text-gray-600">({selectedDriver.totalTrips} trips)</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Distance</div>
                  <div className="font-bold">
                    {rider?.location ? 
                      calculateDistance(
                        rider.location.latitude,
                        rider.location.longitude,
                        selectedDriver.location.latitude,
                        selectedDriver.location.longitude
                      ).toFixed(1) : '0.0'} km
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">ETA</div>
                  <div className="font-bold">
                    {rider?.location ?
                      calculateETA(
                        calculateDistance(
                          rider.location.latitude,
                          rider.location.longitude,
                          selectedDriver.location.latitude,
                          selectedDriver.location.longitude
                        )
                      ) : 0} min
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedDriver.status)}`}>
                  <div className="w-2 h-2 rounded-full bg-current mr-2"></div>
                  {selectedDriver.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'available': return 'bg-success-100 text-success-700';
    case 'busy': return 'bg-warning-100 text-warning-700';
    case 'offline': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}