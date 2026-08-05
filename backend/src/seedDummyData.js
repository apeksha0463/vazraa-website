const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb:27017/vazraa-mobility';

async function seedDummyData() {
  try {
    console.log(`Connecting to ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected!');
    
    const db = mongoose.connection.db;

    const passwordHash = await bcrypt.hash('Password123', 10);
    
    // 1. Seed Dummy Users (Customers)
    const users = [
      { name: 'Rahul Sharma', email: 'rahul.s@example.com', phone: '9876543210', role: 'customer', passwordHash, isActive: true, createdAt: new Date(Date.now() - 86400000 * 5) },
      { name: 'Priya Patel', email: 'priya.p@example.com', phone: '9876543211', role: 'customer', passwordHash, isActive: true, createdAt: new Date(Date.now() - 86400000 * 12) },
      { name: 'Amit Kumar', email: 'amit.k@example.com', phone: '9876543212', role: 'customer', passwordHash, isActive: false, createdAt: new Date(Date.now() - 86400000 * 20) },
      { name: 'Sneha Gupta', email: 'sneha.g@example.com', phone: '9876543213', role: 'customer', passwordHash, isActive: true, createdAt: new Date(Date.now() - 86400000 * 2) }
    ];
    
    // 2. Seed Dummy Drivers
    const drivers = [
      { name: 'Ramesh (YOT India)', email: 'ramesh.yot@example.com', phone: '9988776655', role: 'driver', passwordHash, isActive: true, createdAt: new Date(Date.now() - 86400000 * 30) },
      { name: 'Suresh Singh', email: 'suresh.s@example.com', phone: '9988776656', role: 'driver', passwordHash, isActive: true, createdAt: new Date(Date.now() - 86400000 * 15) },
      { name: 'Kiran Reddy', email: 'kiran.r@example.com', phone: '9988776657', role: 'driver', passwordHash, isActive: true, createdAt: new Date(Date.now() - 86400000 * 8) }
    ];

    const userRes = await db.collection('users').insertMany([...users, ...drivers]);
    console.log('Dummy users & drivers seeded:', userRes.insertedCount);

    // Extract a customer ID for bookings
    const insertedDocs = Object.values(userRes.insertedIds);
    const customerId1 = insertedDocs[0];
    const customerId2 = insertedDocs[1];

    // 3. Seed Dummy Bookings
    const bookings = [
      {
        bookingNumber: 'VZ-10045',
        customer: customerId1,
        pickup: 'Kempegowda International Airport, Bengaluru',
        drop: 'Koramangala, Bengaluru',
        scheduledDate: new Date(Date.now() + 86400000 * 1).toISOString(),
        scheduledTime: '10:30 AM',
        bookingStatus: 'pending',
        amount: 1250,
        createdAt: new Date()
      },
      {
        bookingNumber: 'VZ-10046',
        customer: customerId2,
        pickup: 'Indiranagar, Bengaluru',
        drop: 'Mysuru Palace, Mysuru',
        scheduledDate: new Date(Date.now() + 86400000 * 2).toISOString(),
        scheduledTime: '06:00 AM',
        bookingStatus: 'confirmed',
        amount: 3500,
        createdAt: new Date(Date.now() - 86400000 * 1)
      },
      {
        bookingNumber: 'VZ-10047',
        customer: customerId1,
        pickup: 'Whitefield, Bengaluru',
        drop: 'Electronic City, Bengaluru',
        scheduledDate: new Date(Date.now() - 86400000 * 1).toISOString(),
        scheduledTime: '08:00 PM',
        bookingStatus: 'completed',
        amount: 850,
        createdAt: new Date(Date.now() - 86400000 * 2)
      },
      {
        bookingNumber: 'VZ-10048',
        customer: customerId2,
        pickup: 'Malleswaram, Bengaluru',
        drop: 'Nandi Hills, Chikkaballapur',
        scheduledDate: new Date(Date.now() + 86400000 * 5).toISOString(),
        scheduledTime: '04:30 AM',
        bookingStatus: 'pending',
        amount: 2100,
        createdAt: new Date()
      }
    ];

    const bookingRes = await db.collection('bookings').insertMany(bookings);
    console.log('Dummy bookings seeded:', bookingRes.insertedCount);
    
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    process.exit(0);
  }
}

seedDummyData();
