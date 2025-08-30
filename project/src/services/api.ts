import { Driver, Rider, Trip, User, UserRole } from '../types';
import { calculateDistance, calculateETA } from '../utils/geolocation';

class APIService {
  private baseURL = 'http://localhost:8080/api';
  
  // Mock data storage (simulating Redis/PostgreSQL)
  private drivers: Map<string, Driver> = new Map();
  private riders: Map<string, Rider> = new Map();
  private trips: Map<string, Trip> = new Map();
  private users: Map<string, User> = new Map();

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // Initialize mock drivers
    const mockDrivers = [
      { id: 'driver_1', name: 'Rajesh Kumar', phone: '+91-9876543210', vehicleType: 'car' as const, vehicleNumber: 'DL01AB1234', rating: 4.8 },
      { id: 'driver_2', name: 'Priya Sharma', phone: '+91-9876543211', vehicleType: 'auto' as const, vehicleNumber: 'DL02CD5678', rating: 4.6 },
      { id: 'driver_3', name: 'Amit Singh', phone: '+91-9876543212', vehicleType: 'bike' as const, vehicleNumber: 'DL03EF9012', rating: 4.9 },
      { id: 'driver_4', name: 'Sunita Patel', phone: '+91-9876543213', vehicleType: 'car' as const, vehicleNumber: 'DL04GH3456', rating: 4.7 },
      { id: 'driver_5', name: 'Vikram Gupta', phone: '+91-9876543214', vehicleType: 'auto' as const, vehicleNumber: 'DL05IJ7890', rating: 4.5 },
      { id: 'driver_6', name: 'Kavya Reddy', phone: '+91-9876543215', vehicleType: 'car' as const, vehicleNumber: 'DL06KL1234', rating: 4.8 },
      { id: 'driver_7', name: 'Rohit Jain', phone: '+91-9876543216', vehicleType: 'bike' as const, vehicleNumber: 'DL07MN5678', rating: 4.6 },
      { id: 'driver_8', name: 'Neha Agarwal', phone: '+91-9876543217', vehicleType: 'auto' as const, vehicleNumber: 'DL08OP9012', rating: 4.9 },
    ];

    mockDrivers.forEach(driver => {
      const fullDriver: Driver = {
        ...driver,
        location: {
          latitude: 28.6139 + (Math.random() - 0.5) * 0.1,
          longitude: 77.2090 + (Math.random() - 0.5) * 0.1,
          heading: Math.floor(Math.random() * 360),
          timestamp: Date.now()
        },
        status: Math.random() > 0.3 ? 'available' : 'busy',
        totalTrips: Math.floor(Math.random() * 500) + 50
      };
      this.drivers.set(driver.id, fullDriver);
    });

    // Initialize mock riders
    const mockRiders = [
      { id: 'rider_1', name: 'Ananya Mehta', phone: '+91-8765432109', rating: 4.7 },
      { id: 'rider_2', name: 'Arjun Kapoor', phone: '+91-8765432108', rating: 4.8 },
      { id: 'rider_3', name: 'Isha Verma', phone: '+91-8765432107', rating: 4.6 },
    ];

    mockRiders.forEach(rider => {
      this.riders.set(rider.id, {
        ...rider,
        location: {
          latitude: 28.6139 + (Math.random() - 0.5) * 0.05,
          longitude: 77.2090 + (Math.random() - 0.5) * 0.05
        }
      });
    });
  }

  // Authentication
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    await this.delay(500); // Simulate API delay
    
    // Mock authentication
    const mockUser: User = {
      id: email.includes('driver') ? 'driver_1' : email.includes('admin') ? 'admin_1' : 'rider_1',
      name: email.includes('driver') ? 'Rajesh Kumar' : email.includes('admin') ? 'System Admin' : 'Ananya Mehta',
      email,
      phone: '+91-9876543210',
      role: email.includes('driver') ? 'driver' : email.includes('admin') ? 'admin' : 'rider',
      createdAt: Date.now()
    };

    return {
      user: mockUser,
      token: 'mock_jwt_token_' + Date.now()
    };
  }

  // Driver APIs
  async getDrivers(): Promise<Driver[]> {
    await this.delay(300);
    return Array.from(this.drivers.values());
  }

  async updateDriverLocation(driverId: string, location: any): Promise<void> {
    await this.delay(100);
    const driver = this.drivers.get(driverId);
    if (driver) {
      driver.location = { ...location, timestamp: Date.now() };
      this.drivers.set(driverId, driver);
    }
  }

  async updateDriverStatus(driverId: string, status: Driver['status']): Promise<void> {
    await this.delay(200);
    const driver = this.drivers.get(driverId);
    if (driver) {
      driver.status = status;
      this.drivers.set(driverId, driver);
    }
  }

  // Trip APIs
  async requestTrip(riderId: string, pickup: any, destination: any): Promise<Trip> {
    await this.delay(500);
    
    const trip: Trip = {
      id: 'trip_' + Date.now(),
      riderId,
      riderName: this.riders.get(riderId)?.name || 'Unknown Rider',
      pickup: {
        ...pickup,
        address: pickup.address || `${pickup.latitude.toFixed(4)}, ${pickup.longitude.toFixed(4)}`
      },
      destination: {
        ...destination,
        address: destination.address || `${destination.latitude.toFixed(4)}, ${destination.longitude.toFixed(4)}`
      },
      status: 'requested',
      createdAt: Date.now(),
      distance: calculateDistance(pickup.latitude, pickup.longitude, destination.latitude, destination.longitude),
    };

    // Calculate fare based on distance
    trip.fare = Math.ceil(trip.distance! * 15 + 50); // Base fare + per km

    this.trips.set(trip.id, trip);
    
    // Simulate driver assignment after 2-5 seconds
    setTimeout(() => {
      this.assignDriverToTrip(trip.id);
    }, 2000 + Math.random() * 3000);

    return trip;
  }

  private async assignDriverToTrip(tripId: string): Promise<void> {
    const trip = this.trips.get(tripId);
    if (!trip || trip.status !== 'requested') return;

    // Find nearest available driver
    const availableDrivers = Array.from(this.drivers.values())
      .filter(driver => driver.status === 'available');

    if (availableDrivers.length === 0) return;

    const nearestDriver = availableDrivers.reduce((nearest, current) => {
      const nearestDistance = calculateDistance(
        trip.pickup.latitude,
        trip.pickup.longitude,
        nearest.location.latitude,
        nearest.location.longitude
      );
      const currentDistance = calculateDistance(
        trip.pickup.latitude,
        trip.pickup.longitude,
        current.location.latitude,
        current.location.longitude
      );
      return currentDistance < nearestDistance ? current : nearest;
    });

    // Update trip and driver status
    trip.driverId = nearestDriver.id;
    trip.driverName = nearestDriver.name;
    trip.status = 'assigned';
    trip.estimatedArrival = Date.now() + calculateETA(
      calculateDistance(
        trip.pickup.latitude,
        trip.pickup.longitude,
        nearestDriver.location.latitude,
        nearestDriver.location.longitude
      )
    ) * 60000; // Convert minutes to milliseconds

    nearestDriver.status = 'busy';
    
    this.trips.set(tripId, trip);
    this.drivers.set(nearestDriver.id, nearestDriver);
  }

  async getTrips(userId?: string, role?: UserRole): Promise<Trip[]> {
    await this.delay(300);
    const allTrips = Array.from(this.trips.values());
    
    if (!userId || role === 'admin') {
      return allTrips;
    }
    
    if (role === 'driver') {
      return allTrips.filter(trip => trip.driverId === userId);
    }
    
    if (role === 'rider') {
      return allTrips.filter(trip => trip.riderId === userId);
    }
    
    return [];
  }

  async updateTripStatus(tripId: string, status: Trip['status']): Promise<void> {
    await this.delay(200);
    const trip = this.trips.get(tripId);
    if (trip) {
      trip.status = status;
      
      if (status === 'completed' || status === 'cancelled') {
        // Free up the driver
        if (trip.driverId) {
          const driver = this.drivers.get(trip.driverId);
          if (driver) {
            driver.status = 'available';
            if (status === 'completed') {
              driver.totalTrips += 1;
            }
            this.drivers.set(trip.driverId, driver);
          }
        }
        
        if (status === 'completed') {
          trip.actualArrival = Date.now();
          trip.duration = Math.floor((trip.actualArrival - trip.createdAt) / 60000); // Duration in minutes
        }
      }
      
      this.trips.set(tripId, trip);
    }
  }

  // Analytics
  async getAnalytics() {
    await this.delay(400);
    
    const trips = Array.from(this.trips.values());
    const drivers = Array.from(this.drivers.values());
    
    return {
      totalTrips: trips.length,
      completedTrips: trips.filter(t => t.status === 'completed').length,
      activeDrivers: drivers.filter(d => d.status !== 'offline').length,
      totalDrivers: drivers.length,
      averageRating: drivers.reduce((sum, d) => sum + d.rating, 0) / drivers.length,
      totalRevenue: trips
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + (t.fare || 0), 0),
      recentTrips: trips
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 10)
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Getter methods for accessing data
  getDriver(driverId: string): Driver | undefined {
    return this.drivers.get(driverId);
  }

  getRider(riderId: string): Rider | undefined {
    return this.riders.get(riderId);
  }

  getTrip(tripId: string): Trip | undefined {
    return this.trips.get(tripId);
  }
}

export const apiService = new APIService();