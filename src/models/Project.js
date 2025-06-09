const { db, ObjectID } = require('../config/database');
const Joi = require('joi');

class Project {
  constructor() {
    this.collection = db.collection('projects');
  }

  // Validation schema
  static getValidationSchema(isUpdate = false) {
    const schema = {
      name: Joi.string().min(1).max(100),
      description: Joi.string().max(1000).allow(''),
      key: Joi.string().alphanum().min(2).max(10).uppercase(),
      owner: Joi.string().length(24), // ObjectID string
      members: Joi.array().items(
        Joi.object({
          userId: Joi.string().length(24).required(),
          role: Joi.string().valid('manager', 'developer', 'viewer').default('developer'),
          joinedAt: Joi.date().default(Date.now)
        })
      ).default([]),
      status: Joi.string().valid('active', 'archived', 'completed').default('active'),
      metadata: Joi.object({
        startDate: Joi.date().allow(null),
        endDate: Joi.date().allow(null),
        tags: Joi.array().items(Joi.string().max(50)).default([]),
        customFields: Joi.object().default({})
      }).default({})
    };

    if (isUpdate) {
      // Make all fields optional for updates except owner
      Object.keys(schema).forEach(key => {
        if (key !== 'owner' && schema[key].required) {
          schema[key] = schema[key].optional();
        }
      });
    } else {
      // Required fields for creation
      schema.name = schema.name.required();
      schema.key = schema.key.required();
      schema.owner = schema.owner.required();
    }

    return Joi.object(schema);
  }

  // Create project
  async create(projectData) {
    // Validate input
    const { error, value } = Project.getValidationSchema().validate(projectData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    // Check if project key already exists
    const existingProject = await this.findByKey(value.key);
    if (existingProject) {
      throw new Error('Project key already exists');
    }

    // Add owner to members if not already present
    const ownerMember = {
      userId: value.owner,
      role: 'manager',
      joinedAt: new Date()
    };
    
    if (!value.members.some(member => member.userId === value.owner)) {
      value.members.push(ownerMember);
    }

    // Prepare project document
    const project = {
      ...value,
      _id: new ObjectID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return new Promise((resolve, reject) => {
      this.collection.insert(project, (err, result) => {
        if (err) reject(err);
        else resolve(result[0]);
      });
    });
  }

  // Find project by ID
  async findById(id) {
    return new Promise((resolve, reject) => {
      this.collection.findOne({ _id: new ObjectID(id) }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Find project by key
  async findByKey(key) {
    return new Promise((resolve, reject) => {
      this.collection.findOne({ key: key.toUpperCase() }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Find projects by user (owner or member)
  async findByUser(userId, limit = 20, skip = 0) {
    return new Promise((resolve, reject) => {
      this.collection.find({
        $or: [
          { owner: userId },
          { 'members.userId': userId }
        ]
      })
      .limit(limit)
      .skip(skip)
      .toArray((err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Update project
  async update(id, updateData) {
    const { error, value } = Project.getValidationSchema(true).validate(updateData);
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

  // Add member to project
  async addMember(projectId, userId, role = 'developer') {
    const member = {
      userId,
      role,
      joinedAt: new Date()
    };

    return new Promise((resolve, reject) => {
      this.collection.update(
        { 
          _id: new ObjectID(projectId),
          'members.userId': { $ne: userId } // Don't add if already exists
        },
        { 
          $push: { members: member },
          $set: { updatedAt: new Date() }
        },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  }

  // Remove member from project
  async removeMember(projectId, userId) {
    return new Promise((resolve, reject) => {
      this.collection.update(
        { _id: new ObjectID(projectId) },
        { 
          $pull: { members: { userId } },
          $set: { updatedAt: new Date() }
        },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  }

  // Update member role
  async updateMemberRole(projectId, userId, newRole) {
    return new Promise((resolve, reject) => {
      this.collection.update(
        { 
          _id: new ObjectID(projectId),
          'members.userId': userId
        },
        { 
          $set: { 
            'members.$.role': newRole,
            updatedAt: new Date()
          }
        },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  }

  // Check if user has access to project
  async checkAccess(projectId, userId) {
    return new Promise((resolve, reject) => {
      this.collection.findOne({
        _id: new ObjectID(projectId),
        $or: [
          { owner: userId },
          { 'members.userId': userId }
        ]
      }, (err, result) => {
        if (err) reject(err);
        else resolve(!!result);
      });
    });
  }

  // Get user role in project
  async getUserRole(projectId, userId) {
    return new Promise((resolve, reject) => {
      this.collection.findOne({
        _id: new ObjectID(projectId)
      }, (err, project) => {
        if (err) {
          reject(err);
        } else if (!project) {
          resolve(null);
        } else if (project.owner === userId) {
          resolve('owner');
        } else {
          const member = project.members.find(m => m.userId === userId);
          resolve(member ? member.role : null);
        }
      });
    });
  }

  // Search projects by name or description
  async search(query, userId = null, limit = 20) {
    const searchRegex = new RegExp(query, 'i');
    
    const searchCriteria = {
      $or: [
        { name: searchRegex },
        { description: searchRegex },
        { key: searchRegex }
      ]
    };

    // If userId provided, only search in user's projects
    if (userId) {
      searchCriteria.$and = [{
        $or: [
          { owner: userId },
          { 'members.userId': userId }
        ]
      }];
    }

    return new Promise((resolve, reject) => {
      this.collection.find(searchCriteria)
        .limit(limit)
        .toArray((err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
    });
  }

  // Get project statistics
  async getStats(projectId) {
    // This would typically aggregate data from Items collection
    // For now, returning basic project info
    const project = await this.findById(projectId);
    if (!project) return null;

    return {
      projectId,
      memberCount: project.members.length,
      status: project.status,
      createdAt: project.createdAt,
      lastUpdated: project.updatedAt
    };
  }

  // Delete project
  async delete(id) {
    return new Promise((resolve, reject) => {
      this.collection.remove({ _id: new ObjectID(id) }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Find all projects (admin only)
  async findAll(limit = 50, skip = 0) {
    return new Promise((resolve, reject) => {
      this.collection.find({})
        .limit(limit)
        .skip(skip)
        .sort({ createdAt: -1 })
        .toArray((err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
    });
  }
}

module.exports = Project;
