import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { wsService } from '../services/websocket';
import { apiService } from '../services/api';
import { Driver, Trip } from '../types';
import { Map } from './Map';
import { 
  BarChart3, 
  Users, 
  Car, 
  TrendingUp, 
  Clock, 
  DollarSign,
  MapPin,
  Activity,
  XCircle,
  Eye,
  Navigation
} from 'lucide-react';

interface Analytics {
  totalTrips: number;
  completedTrips: number;
  activeDrivers: number;
  totalDrivers: number;
  averageRating: number;
  totalRevenue: number;
  recentTrips: Trip[];
}

export function AdminDashboard() {
  const { user, logout } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'drivers' | 'trips'>('overview');

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadData();
      connectWebSocket();
      
      // Refresh data every 30 seconds
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
    }

    return () => {
      wsService.disconnect();
    };
  }, [user]);

  const loadData = async () => {
    try {
      const [driversData, tripsData, analyticsData] = await Promise.all([
        apiService.getDrivers(),
        apiService.getTrips(undefined, 'admin'),
        apiService.getAnalytics()
      ]);
      
      setDrivers(driversData);
      setTrips(tripsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
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
    wsService.subscribe('trip_status', (data) => {
      setTrips(prev => prev.map(trip => 
        trip.id === data.tripId 
          ? { ...trip, status: data.status }
          : trip
      ));
      
      // Refresh analytics on trip completion
      if (data.status === 'completed') {
        loadData();
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-success-600 bg-success-100';
      case 'busy': return 'text-warning-600 bg-warning-100';
      case 'offline': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTripStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-success-600 bg-success-100';
      case 'in_progress': return 'text-primary-600 bg-primary-100';
      case 'assigned': return 'text-warning-600 bg-warning-100';
      case 'cancelled': return 'text-error-600 bg-error-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-primary-500 text-white rounded-full p-2">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">RidePulse Admin</h1>
                <p className="text-gray-600">Fleet Management Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600">Live Updates Active</span>
              </div>
              <button
                onClick={logout}
                className="text-gray-600 hover:text-gray-900 transition-colors duration-200"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-6 mt-6">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'drivers', label: 'Drivers', icon: Car },
              { id: 'trips', label: 'Trips', icon: Navigation }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 pb-3 border-b-2 transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="p-6">
        {activeTab === 'overview' && analytics && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Active Drivers</p>
                    <p className="text-3xl font-bold text-success-600">{analytics.activeDrivers}</p>
                    <p className="text-xs text-gray-500">of {analytics.totalDrivers} total</p>
                  </div>
                  <div className="bg-success-100 p-3 rounded-lg">
                    <Car className="w-6 h-6 text-success-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Trips</p>
                    <p className="text-3xl font-bold text-primary-600">{analytics.totalTrips}</p>
                    <p className="text-xs text-success-600">+{analytics.completedTrips} completed</p>
                  </div>
                  <div className="bg-primary-100 p-3 rounded-lg">
                    <MapPin className="w-6 h-6 text-primary-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Revenue</p>
                    <p className="text-3xl font-bold text-warning-600">₹{analytics.totalRevenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Total earnings</p>
                  </div>
                  <div className="bg-warning-100 p-3 rounded-lg">
                    <DollarSign className="w-6 h-6 text-warning-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Rating</p>
                    <p className="text-3xl font-bold text-purple-600">{analytics.averageRating.toFixed(1)}</p>
                    <p className="text-xs text-gray-500">Fleet average</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Map and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Live Fleet Map</h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Activity className="w-4 h-4" />
                    <span>Real-time</span>
                  </div>
                </div>
                <Map 
                  drivers={drivers}
                  trips={selectedTrip ? [selectedTrip] : []}
                  selectedTrip={selectedTrip}
                  className="h-96"
                />
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Recent Trips</h2>
                <div className="space-y-3">
                  {analytics.recentTrips.map(trip => (
                    <div 
                      key={trip.id}
                      onClick={() => setSelectedTrip(trip)}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{trip.riderName}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTripStatusColor(trip.status)}`}>
                          {trip.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        ₹{trip.fare} • {new Date(trip.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'drivers' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Driver Management</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trips</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Update</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {drivers.map(driver => (
                    <tr key={driver.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{driver.vehicleType.toUpperCase()}</div>
                        <div className="text-sm text-gray-500">{driver.vehicleNumber}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(driver.status)}`}>
                          {driver.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-warning-500 mr-1" />
                          <span className="text-sm text-gray-900">{driver.rating}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {driver.totalTrips}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(driver.location.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'trips' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Trip Management</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trip ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rider</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fare</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trips.slice(0, 20).map(trip => (
                    <tr key={trip.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{trip.id.slice(-6)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trip.riderName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trip.driverName || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTripStatusColor(trip.status)}`}>
                          {trip.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{trip.fare || 'TBD'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(trip.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedTrip(trip)}
                          className="text-primary-600 hover:text-primary-900 transition-colors duration-200"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}