'use strict';

const vehicleRepo = require('../repositories/VehicleRepository');

// Default vehicle catalogue — mirrors the data-type / data-rate attributes in book-ride.html
const DEFAULT_VEHICLES = [
  {
    name: 'Car & Sedan',
    category: 'car',
    emoji: '🚗',
    pricePerKm: 8,
    baseFare: 30,
    platformFee: 15,
    capacity: 4,
    isAvailable: true,
    description: 'Hatchbacks, Sedans, SUVs & Luxury Cars',
  },
  {
    name: 'Bike & Scooter',
    category: 'bike',
    emoji: '🏍️',
    pricePerKm: 2,
    baseFare: 15,
    platformFee: 10,
    capacity: 1,
    isAvailable: true,
    description: 'Bikes, Scooters & Electric Two Wheelers',
  },
  {
    name: 'Bus',
    category: 'bus',
    emoji: '🚌',
    pricePerKm: 25,
    baseFare: 100,
    platformFee: 25,
    capacity: 40,
    isAvailable: true,
    description: 'AC, Non-AC, Luxury & Volvo Buses',
  },
  {
    name: 'Commercial Vehicle',
    category: 'commercial',
    emoji: '🚚',
    pricePerKm: 20,
    baseFare: 80,
    platformFee: 20,
    capacity: 2,
    isAvailable: true,
    description: 'Trucks, Pickups, Tempo & Trailers',
  },
  {
    name: 'Van / Minibus',
    category: 'van',
    emoji: '🚐',
    pricePerKm: 16,
    baseFare: 60,
    platformFee: 15,
    capacity: 12,
    isAvailable: true,
    description: 'Tempo Traveller, Minibus & More',
  },
  {
    name: 'EV Vehicle',
    category: 'ev',
    emoji: '🔋',
    pricePerKm: 16,
    baseFare: 30,
    platformFee: 15,
    capacity: 4,
    isAvailable: true,
    description: 'Electric Cars & Bikes for a Green Ride',
  },
];

class VehicleService {
  async getAllVehicles(onlyAvailable = false) {
    const filter = onlyAvailable ? { isAvailable: true } : {};
    return vehicleRepo.findAll(filter);
  }

  async getVehicleByCategory(category) {
    return vehicleRepo.findByCategory(category);
  }

  async updateVehicle(id, data) {
    return vehicleRepo.update(id, data);
  }

  /**
   * Calculate fare for a given vehicle category and distance.
   * Distance is mocked at 12 km in v1 (Google Maps future integration).
   */
  calculateFare(vehicle, distanceKm = 12) {
    const fare = vehicle.baseFare + distanceKm * vehicle.pricePerKm + vehicle.platformFee;
    return Math.round(fare);
  }

  /**
   * Seed default vehicles on startup if the collection is empty.
   */
  async seedDefaultVehicles() {
    for (const v of DEFAULT_VEHICLES) {
      await vehicleRepo.upsertByCategory(v);
    }
    console.log('✅  Vehicle catalogue seeded.');
  }
}

module.exports = new VehicleService();
