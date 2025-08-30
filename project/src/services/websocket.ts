import { WebSocketMessage } from '../types';

class WebSocketService {
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private simulationInterval: NodeJS.Timeout | null = null;
  private connected = false;

  connect(): Promise<void> {
    return new Promise((resolve) => {
      // Simulate WebSocket connection
      this.connected = true;
      this.startSimulation();
      resolve();
    });
  }

  disconnect(): void {
    this.connected = false;
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.listeners.clear();
  }

  subscribe(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  publish(event: string, data: any): void {
    const message: WebSocketMessage = {
      type: event as any,
      payload: data,
      timestamp: Date.now()
    };

    // Simulate small network delay
    setTimeout(() => {
      this.emit(event, message.payload);
    }, 10 + Math.random() * 20);
  }

  private emit(event: string, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  private startSimulation(): void {
    // Simulate real-time updates every 2 seconds
    this.simulationInterval = setInterval(() => {
      if (!this.connected) return;

      // Simulate driver location updates
      const driverUpdates = this.generateDriverLocationUpdates();
      driverUpdates.forEach(update => {
        this.emit('location_update', update);
      });

      // Simulate occasional trip status updates
      if (Math.random() < 0.1) {
        this.emit('trip_status', {
          tripId: 'trip_' + Date.now(),
          status: ['assigned', 'picked_up', 'in_progress', 'completed'][Math.floor(Math.random() * 4)],
          timestamp: Date.now()
        });
      }
    }, 2000);
  }

  private generateDriverLocationUpdates() {
    const updates = [];
    const numDrivers = 8;
    
    for (let i = 0; i < numDrivers; i++) {
      const driverId = `driver_${i + 1}`;
      
      // Simulate movement around a central point (like a city center)
      const baseLocation = {
        lat: 28.6139 + (Math.random() - 0.5) * 0.1,
        lng: 77.2090 + (Math.random() - 0.5) * 0.1
      };

      updates.push({
        driverId,
        location: {
          latitude: baseLocation.lat,
          longitude: baseLocation.lng,
          heading: Math.floor(Math.random() * 360),
          timestamp: Date.now()
        },
        status: Math.random() > 0.3 ? 'available' : 'busy'
      });
    }
    
    return updates;
  }

  isConnected(): boolean {
    return this.connected;
  }
}

export const wsService = new WebSocketService();