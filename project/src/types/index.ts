export interface Driver {
  id: string;
  name: string;
  phone: string;
  vehicleType: 'car' | 'bike' | 'auto';
  vehicleNumber: string;
  location: {
    latitude: number;
    longitude: number;
    heading: number;
    timestamp: number;
  };
  status: 'available' | 'busy' | 'offline';
  rating: number;
  totalTrips: number;
}

export interface Rider {
  id: string;
  name: string;
  phone: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  rating: number;
}

export interface Trip {
  id: string;
  riderId: string;
  riderName: string;
  driverId?: string;
  driverName?: string;
  pickup: {
    latitude: number;
    longitude: number;
    address: string;
  };
  destination: {
    latitude: number;
    longitude: number;
    address: string;
  };
  status: 'requested' | 'assigned' | 'picked_up' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: number;
  estimatedArrival?: number;
  actualArrival?: number;
  fare?: number;
  distance?: number;
  duration?: number;
}

export interface WebSocketMessage {
  type: 'location_update' | 'trip_request' | 'trip_assigned' | 'trip_status' | 'driver_status' | 'rider_connected';
  payload: any;
  timestamp: number;
  userId?: string;
}

export type UserRole = 'driver' | 'rider' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  createdAt: number;
}