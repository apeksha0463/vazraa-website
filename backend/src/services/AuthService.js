'use strict';

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

const userRepo   = require('../repositories/UserRepository');
const driverRepo = require('../repositories/DriverRepository');
const { ROLES, ERROR_CODES } = require('../constants');

const SALT_ROUNDS = 12;

class AuthService {
  // ─── Helpers ────────────────────────────────────────────────────────────────
  async hashPassword(plain) {
    return bcrypt.hash(plain, SALT_ROUNDS);
  }

  async comparePassword(plain, hash) {
    return bcrypt.compare(plain, hash);
  }

  generateToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
  }

  verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  }

  // ─── Customer Registration ───────────────────────────────────────────────────
  async registerCustomer({ name, email, phone, password }) {
    // Duplicate checks
    const existingEmail = await userRepo.findByEmail(email);
    if (existingEmail) {
      const err = new Error('Email already registered');
      err.code = ERROR_CODES.DUPLICATE_EMAIL;
      throw err;
    }

    const existingPhone = await userRepo.findByPhone(phone);
    if (existingPhone) {
      const err = new Error('Phone number already registered');
      err.code = ERROR_CODES.DUPLICATE_PHONE;
      throw err;
    }

    const passwordHash = await this.hashPassword(password);
    const user = await userRepo.create({ name, email, phone, passwordHash, role: ROLES.CUSTOMER });

    const token = this.generateToken({ id: user._id, role: user.role });
    return { token, user };
  }

  // ─── Customer / Admin Login ──────────────────────────────────────────────────
  async loginCustomer(identifier, password) {
    const user = await userRepo.findByEmailOrPhone(identifier);
    if (!user || !user.isActive) {
      const err = new Error('Invalid credentials');
      err.code = ERROR_CODES.INVALID_CREDENTIALS;
      throw err;
    }
    if (user.role === ROLES.DRIVER) {
      const err = new Error('Please use the driver login endpoint');
      err.code = ERROR_CODES.INVALID_CREDENTIALS;
      throw err;
    }

    const match = await this.comparePassword(password, user.passwordHash);
    if (!match) {
      const err = new Error('Invalid credentials');
      err.code = ERROR_CODES.INVALID_CREDENTIALS;
      throw err;
    }

    const token = this.generateToken({ id: user._id, role: user.role });
    return { token, user };
  }

  // ─── Driver Login ────────────────────────────────────────────────────────────
  async loginDriver(identifier, password) {
    const driver = await driverRepo.findByEmailOrPhone(identifier);
    if (!driver || !driver.isActive) {
      const err = new Error('Invalid credentials');
      err.code = ERROR_CODES.INVALID_CREDENTIALS;
      throw err;
    }

    const match = await this.comparePassword(password, driver.passwordHash);
    if (!match) {
      const err = new Error('Invalid credentials');
      err.code = ERROR_CODES.INVALID_CREDENTIALS;
      throw err;
    }

    const token = this.generateToken({ id: driver._id, role: ROLES.DRIVER });
    return { token, driver };
  }

  // ─── Admin Login ─────────────────────────────────────────────────────────────
  async loginAdmin(identifier, password) {
    const user = await userRepo.findByEmailOrPhone(identifier);
    if (!user || user.role !== ROLES.ADMIN || !user.isActive) {
      const err = new Error('Invalid admin credentials');
      err.code = ERROR_CODES.INVALID_CREDENTIALS;
      throw err;
    }

    const match = await this.comparePassword(password, user.passwordHash);
    if (!match) {
      const err = new Error('Invalid admin credentials');
      err.code = ERROR_CODES.INVALID_CREDENTIALS;
      throw err;
    }

    const token = this.generateToken({ id: user._id, role: user.role });
    return { token, user };
  }
}

module.exports = new AuthService();
