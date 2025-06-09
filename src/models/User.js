const { db, ObjectID } = require('../config/database');
const bcrypt = require('bcryptjs');
const Joi = require('joi');

class User {
  constructor() {
    this.collection = db.collection('users');
  }

  // Validation schema
  static getValidationSchema(isUpdate = false) {
    const schema = {
      username: Joi.string().alphanum().min(3).max(30),
      email: Joi.string().email(),
      password: Joi.string().min(6).max(128),
      profile: Joi.object({
        firstName: Joi.string().max(50).allow(''),
        lastName: Joi.string().max(50).allow(''),
        avatar: Joi.string().uri().allow('')
      }).default({}),
      roles: Joi.array().items(Joi.string().valid('admin', 'manager', 'developer', 'viewer')).default(['developer']),
      lastLoginAt: Joi.date(),
      passwordHash: Joi.string()
    };

    if (isUpdate) {
      // Make all fields optional for updates
      Object.keys(schema).forEach(key => {
        if (schema[key].required) {
          schema[key] = schema[key].optional();
        }
      });
      delete schema.password; // Don't allow password updates through regular update
    } else {
      // Required fields for creation
      schema.username = schema.username.required();
      schema.email = schema.email.required();
      schema.password = schema.password.required();
    }

    return Joi.object(schema);
  }

  // Create user with encrypted password
  async create(userData) {
    // Validate input
    const { error, value } = User.getValidationSchema().validate(userData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    // Check if user already exists
    const existingUser = await this.findByEmail(value.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const existingUsername = await this.findByUsername(value.username);
    if (existingUsername) {
      throw new Error('Username already taken');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(value.password, saltRounds);

    // Prepare user document
    const user = {
      ...value,
      passwordHash,
      createdAt: new Date(),
      lastActive: new Date(),
      _id: new ObjectID()
    };

    delete user.password; // Remove plain password

    return new Promise((resolve, reject) => {
      this.collection.insert(user, (err, result) => {
        if (err) reject(err);
        else resolve(result[0]);
      });
    });
  }

  // Find user by ID
  async findById(id) {
    return new Promise((resolve, reject) => {
      this.collection.findOne({ _id: new ObjectID(id) }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Find user by email
  async findByEmail(email) {
    return new Promise((resolve, reject) => {
      this.collection.findOne({ email }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Find user by username
  async findByUsername(username) {
    return new Promise((resolve, reject) => {
      this.collection.findOne({ username }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Verify password
  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Update user
  async update(id, updateData) {
    const { error, value } = User.getValidationSchema(true).validate(updateData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    value.updatedAt = new Date();

    return new Promise((resolve, reject) => {
      this.collection.update(
        { _id: new ObjectID(id) },
        { $set: value },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  }

  // Update last active timestamp
  async updateLastActive(id) {
    return new Promise((resolve, reject) => {
      this.collection.update(
        { _id: new ObjectID(id) },
        { $set: { lastActive: new Date() } },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  }

  // Find all users (for admin purposes)
  async findAll(limit = 50, skip = 0) {
    return new Promise((resolve, reject) => {
      this.collection.find({})
        .limit(limit)
        .skip(skip)
        .toArray((err, result) => {
          if (err) reject(err);
          else {
            // Remove password hashes from results
            const sanitizedUsers = result.map(user => {
              delete user.passwordHash;
              return user;
            });
            resolve(sanitizedUsers);
          }
        });
    });
  }

  // Delete user
  async delete(id) {
    return new Promise((resolve, reject) => {
      this.collection.remove({ _id: new ObjectID(id) }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Search users by username or email
  async search(query, limit = 10) {
    const searchRegex = new RegExp(query, 'i');
    
    return new Promise((resolve, reject) => {
      this.collection.find({
        $or: [
          { username: searchRegex },
          { email: searchRegex },
          { 'profile.firstName': searchRegex },
          { 'profile.lastName': searchRegex }
        ]
      })
      .limit(limit)
      .toArray((err, result) => {
        if (err) reject(err);
        else {
          // Remove password hashes from results
          const sanitizedUsers = result.map(user => {
            delete user.passwordHash;
            return user;
          });
          resolve(sanitizedUsers);
        }
      });
    });
  }
}

module.exports = User;
