const { db, ObjectID } = require('../config/database');
const Joi = require('joi');

class Tag {
  constructor() {
    this.collection = db.collection('tags');
  }

  // Validation schema
  static getValidationSchema(isUpdate = false) {
    const schema = {
      projectId: Joi.string(), // Relaxed: TingoDB ObjectID.toString() might not be 24 chars
      name: Joi.string().min(1).max(50),
      color: Joi.string().pattern(/^#[0-9a-fA-F]{6}$/).default('#007bff'), // Hex color
      description: Joi.string().max(200).allow('')
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
      schema.name = schema.name.required();
    }

    return Joi.object(schema);
  }

  // Create tag
  async create(tagData) {
    // Validate input
    const { error, value } = Tag.getValidationSchema().validate(tagData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    // Check if tag name already exists in project
    const existingTag = await this.findByNameAndProject(value.name, value.projectId);
    if (existingTag) {
      throw new Error('Tag with this name already exists in the project');
    }

    // Prepare tag document
    const tag = {
      ...value,
      _id: new ObjectID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return new Promise((resolve, reject) => {
      this.collection.insert(tag, (err, result) => {
        if (err) reject(err);
        else resolve(result[0]);
      });
    });
  }

  // Find tag by ID
  async findById(id) {
    return new Promise((resolve, reject) => {
      this.collection.findOne({ _id: new ObjectID(id) }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Find tag by name and project
  async findByNameAndProject(name, projectId) {
    return new Promise((resolve, reject) => {
      this.collection.findOne({ 
        name: name,
        projectId: projectId
      }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Find all tags for a project
  async findByProject(projectId, limit = 100, skip = 0) {
    return new Promise((resolve, reject) => {
      this.collection.find({ projectId })
        .limit(limit)
        .skip(skip)
        .sort({ name: 1 })
        .toArray((err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
    });
  }

  // Update tag
  async update(id, updateData) {
    const { error, value } = Tag.getValidationSchema(true).validate(updateData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    // If name is being updated, check for duplicates
    if (value.name) {
      const currentTag = await this.findById(id);
      if (!currentTag) {
        throw new Error('Tag not found');
      }

      const existingTag = await this.findByNameAndProject(value.name, currentTag.projectId);
      if (existingTag && existingTag._id.toString() !== id) {
        throw new Error('Tag with this name already exists in the project');
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

  // Delete tag
  async delete(id) {
    // First, remove this tag from all items that use it
    const tag = await this.findById(id);
    if (!tag) {
      throw new Error('Tag not found');
    }

    const Item = require('./Item');
    const itemModel = new Item();
    
    // Remove tag from all items
    await new Promise((resolve, reject) => {
      itemModel.collection.update(
        { tags: tag.name },
        { $pull: { tags: tag.name } },
        { multi: true },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    // Then delete the tag
    return new Promise((resolve, reject) => {
      this.collection.remove({ _id: new ObjectID(id) }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Search tags within a project
  async search(query, projectId, limit = 20) {
    const searchRegex = new RegExp(query, 'i');
    
    return new Promise((resolve, reject) => {
      this.collection.find({
        projectId,
        $or: [
          { name: searchRegex },
          { description: searchRegex }
        ]
      })
      .limit(limit)
      .sort({ name: 1 })
      .toArray((err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Get tag usage statistics
  async getTagStats(projectId) {
    const tags = await this.findByProject(projectId);
    const Item = require('./Item');
    const itemModel = new Item();

    const tagStats = await Promise.all(
      tags.map(async (tag) => {
        const items = await itemModel.findByProject(projectId, { tags: [tag.name] });
        return {
          ...tag,
          usageCount: items.length
        };
      })
    );

    return tagStats.sort((a, b) => b.usageCount - a.usageCount);
  }

  // Get most used tags in project
  async getMostUsedTags(projectId, limit = 10) {
    const tagStats = await this.getTagStats(projectId);
    return tagStats
      .filter(tag => tag.usageCount > 0)
      .slice(0, limit);
  }

  // Create default tags for a new project
  async createDefaultTags(projectId) {
    const defaultTags = [
      { name: 'frontend', color: '#28a745', description: 'Frontend development tasks' },
      { name: 'backend', color: '#dc3545', description: 'Backend development tasks' },
      { name: 'bug', color: '#ffc107', description: 'Bug fixes and issues' },
      { name: 'enhancement', color: '#17a2b8', description: 'Feature enhancements' },
      { name: 'urgent', color: '#ff6b6b', description: 'Urgent priority items' },
      { name: 'documentation', color: '#6f42c1', description: 'Documentation tasks' }
    ];

    const createdTags = [];
    
    for (const tagData of defaultTags) {
      try {
        const tag = await this.create({
          ...tagData,
          projectId: projectId.toString() // Convert ObjectID to string
        });
        createdTags.push(tag);
      } catch (error) {
        // Skip if tag already exists
        if (!error.message.includes('already exists')) {
          throw error;
        }
      }
    }

    return createdTags;
  }

  // Bulk create tags
  async bulkCreate(tagsData) {
    const results = [];
    const errors = [];

    for (const tagData of tagsData) {
      try {
        const tag = await this.create(tagData);
        results.push(tag);
      } catch (error) {
        errors.push({
          tagData,
          error: error.message
        });
      }
    }

    return { results, errors };
  }

  // Get color suggestions for new tags
  getColorSuggestions() {
    return [
      '#007bff', // Blue
      '#28a745', // Green
      '#dc3545', // Red
      '#ffc107', // Yellow
      '#17a2b8', // Cyan
      '#6f42c1', // Purple
      '#e83e8c', // Pink
      '#fd7e14', // Orange
      '#20c997', // Teal
      '#6c757d'  // Gray
    ];
  }

  // Delete all tags for a project (used when project is deleted)
  async deleteByProject(projectId) {
    return new Promise((resolve, reject) => {
      this.collection.remove({ projectId }, { multi: true }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }
}

module.exports = Tag;
