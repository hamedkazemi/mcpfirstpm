const { db, ObjectID } = require('../config/database');
const Joi = require('joi');

class Item {
  constructor() {
    this.collection = db.collection('items');
  }

  // Validation schema
  static getValidationSchema(isUpdate = false) {
    const schema = {
      projectId: Joi.string().length(24), // ObjectID string
      key: Joi.string().pattern(/^[A-Z]+-\d+$/), // e.g., "PROJ-123"
      title: Joi.string().min(1).max(200),
      description: Joi.string().max(5000).allow(''),
      type: Joi.string().valid('epic', 'feature', 'task', 'bug').default('task'),
      status: Joi.string().valid('todo', 'inprogress', 'review', 'testing', 'done').default('todo'),
      priority: Joi.string().valid('low', 'medium', 'high', 'critical').default('medium'),
      assignee: Joi.string().length(24).allow(null), // ObjectID string
      reporter: Joi.string().length(24), // ObjectID string
      parent: Joi.string().length(24).allow(null), // ObjectID string for sub-tasks
      tags: Joi.array().items(Joi.string().max(50)).default([]),
      metadata: Joi.object({
        storyPoints: Joi.number().integer().min(0).max(100).allow(null),
        dueDate: Joi.date().allow(null),
        estimatedHours: Joi.number().min(0).allow(null),
        actualHours: Joi.number().min(0).allow(null),
        customFields: Joi.object().default({})
      }).default({})
    };

    if (isUpdate) {
      // Make all fields optional for updates except projectId
      Object.keys(schema).forEach(key => {
        if (key !== 'projectId' && schema[key].required) {
          schema[key] = schema[key].optional();
        }
      });
    } else {
      // Required fields for creation
      schema.projectId = schema.projectId.required();
      schema.title = schema.title.required();
      schema.reporter = schema.reporter.required();
    }

    return Joi.object(schema);
  }

  // Generate next item key for project
  async generateKey(projectId) {
    // First, get the project to get its key prefix
    const Project = require('./Project');
    const projectModel = new Project();
    const project = await projectModel.findById(projectId);
    
    if (!project) {
      throw new Error('Project not found');
    }

    // Find the highest number for this project
    return new Promise((resolve, reject) => {
      this.collection.find({ 
        projectId,
        key: { $regex: `^${project.key}-\\d+$` }
      })
      .sort({ key: -1 })
      .limit(1)
      .toArray((err, results) => {
        if (err) {
          reject(err);
        } else {
          let nextNumber = 1;
          if (results.length > 0) {
            const lastKey = results[0].key;
            const lastNumber = parseInt(lastKey.split('-')[1]);
            nextNumber = lastNumber + 1;
          }
          resolve(`${project.key}-${nextNumber}`);
        }
      });
    });
  }

  // Create item
  async create(itemData) {
    // Validate input
    const { error, value } = Item.getValidationSchema().validate(itemData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    // Generate key if not provided
    if (!value.key) {
      value.key = await this.generateKey(value.projectId);
    }

    // Validate parent relationship
    if (value.parent) {
      const parentItem = await this.findById(value.parent);
      if (!parentItem || parentItem.projectId !== value.projectId) {
        throw new Error('Invalid parent item');
      }
    }

    // Prepare item document
    const item = {
      ...value,
      _id: new ObjectID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return new Promise((resolve, reject) => {
      this.collection.insert(item, (err, result) => {
        if (err) reject(err);
        else resolve(result[0]);
      });
    });
  }

  // Find item by ID
  async findById(id) {
    return new Promise((resolve, reject) => {
      this.collection.findOne({ _id: new ObjectID(id) }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Find item by key
  async findByKey(key) {
    return new Promise((resolve, reject) => {
      this.collection.findOne({ key }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Find items by project
  async findByProject(projectId, filters = {}, limit = 50, skip = 0) {
    const query = { projectId };

    // Apply filters
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.type) {
      query.type = filters.type;
    }
    if (filters.assignee) {
      query.assignee = filters.assignee;
    }
    if (filters.priority) {
      query.priority = filters.priority;
    }
    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }
    if (filters.parent !== undefined) {
      query.parent = filters.parent;
    }

    return new Promise((resolve, reject) => {
      this.collection.find(query)
        .limit(limit)
        .skip(skip)
        .sort({ createdAt: -1 })
        .toArray((err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
    });
  }

  // Find items by assignee
  async findByAssignee(assigneeId, filters = {}, limit = 50, skip = 0) {
    const query = { assignee: assigneeId };

    // Apply additional filters
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.projectId) {
      query.projectId = filters.projectId;
    }

    return new Promise((resolve, reject) => {
      this.collection.find(query)
        .limit(limit)
        .skip(skip)
        .sort({ createdAt: -1 })
        .toArray((err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
    });
  }

  // Update item
  async update(id, updateData) {
    const { error, value } = Item.getValidationSchema(true).validate(updateData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    // Validate parent relationship if being updated
    if (value.parent) {
      const parentItem = await this.findById(value.parent);
      const currentItem = await this.findById(id);
      
      if (!parentItem || parentItem.projectId !== currentItem.projectId) {
        throw new Error('Invalid parent item');
      }
      
      // Prevent circular references
      if (value.parent === id) {
        throw new Error('Item cannot be its own parent');
      }
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

  // Update item status
  async updateStatus(id, status) {
    const validStatuses = ['todo', 'inprogress', 'review', 'testing', 'done'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    return new Promise((resolve, reject) => {
      this.collection.update(
        { _id: new ObjectID(id) },
        { 
          $set: { 
            status,
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

  // Assign item to user
  async assign(id, assigneeId) {
    return new Promise((resolve, reject) => {
      this.collection.update(
        { _id: new ObjectID(id) },
        { 
          $set: { 
            assignee: assigneeId,
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

  // Add tag to item
  async addTag(id, tag) {
    return new Promise((resolve, reject) => {
      this.collection.update(
        { _id: new ObjectID(id) },
        { 
          $addToSet: { tags: tag },
          $set: { updatedAt: new Date() }
        },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  }

  // Remove tag from item
  async removeTag(id, tag) {
    return new Promise((resolve, reject) => {
      this.collection.update(
        { _id: new ObjectID(id) },
        { 
          $pull: { tags: tag },
          $set: { updatedAt: new Date() }
        },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
  }

  // Search items
  async search(query, projectId = null, limit = 20) {
    const searchRegex = new RegExp(query, 'i');
    
    const searchCriteria = {
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { key: searchRegex },
        { tags: searchRegex }
      ]
    };

    if (projectId) {
      searchCriteria.projectId = projectId;
    }

    return new Promise((resolve, reject) => {
      this.collection.find(searchCriteria)
        .limit(limit)
        .sort({ updatedAt: -1 })
        .toArray((err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
    });
  }

  // Get item statistics for project
  async getProjectStats(projectId) {
    return new Promise((resolve, reject) => {
      this.collection.aggregate([
        { $match: { projectId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            byStatus: {
              $push: {
                status: '$status',
                count: 1
              }
            },
            byType: {
              $push: {
                type: '$type',
                count: 1
              }
            },
            byPriority: {
              $push: {
                priority: '$priority',
                count: 1
              }
            }
          }
        }
      ], (err, result) => {
        if (err) reject(err);
        else resolve(result[0] || { total: 0, byStatus: [], byType: [], byPriority: [] });
      });
    });
  }

  // Get child items (sub-tasks)
  async getChildren(parentId, limit = 20) {
    return new Promise((resolve, reject) => {
      this.collection.find({ parent: parentId })
        .limit(limit)
        .sort({ createdAt: -1 })
        .toArray((err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
    });
  }

  // Delete item
  async delete(id) {
    // First, remove any child items' parent reference
    await new Promise((resolve, reject) => {
      this.collection.update(
        { parent: id },
        { $unset: { parent: 1 } },
        { multi: true },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    // Then delete the item
    return new Promise((resolve, reject) => {
      this.collection.remove({ _id: new ObjectID(id) }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Get items due soon
  async getItemsDueSoon(projectId, days = 7) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);

    return new Promise((resolve, reject) => {
      this.collection.find({
        projectId,
        'metadata.dueDate': {
          $lte: dueDate,
          $gte: new Date()
        },
        status: { $ne: 'done' }
      })
      .sort({ 'metadata.dueDate': 1 })
      .toArray((err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }
}

module.exports = Item;
