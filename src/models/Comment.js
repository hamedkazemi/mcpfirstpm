const { db, ObjectID } = require('../config/database');
const Joi = require('joi');

class Comment {
  constructor() {
    this.collection = db.collection('comments');
  }

  // Validation schema
  static getValidationSchema(isUpdate = false) {
    const schema = {
      itemId: Joi.string().length(24), // ObjectID string
      author: Joi.string().length(24), // ObjectID string
      content: Joi.string().min(1).max(2000),
      mentions: Joi.array().items(Joi.string().length(24)).default([])
    };

    if (isUpdate) {
      // Make all fields optional for updates except itemId and author
      Object.keys(schema).forEach(key => {
        if (!['itemId', 'author'].includes(key) && schema[key].required) {
          schema[key] = schema[key].optional();
        }
      });
    } else {
      // Required fields for creation
      schema.itemId = schema.itemId.required();
      schema.author = schema.author.required();
      schema.content = schema.content.required();
    }

    return Joi.object(schema);
  }

  // Extract mentions from comment content
  extractMentions(content) {
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1]);
    }
    
    return [...new Set(mentions)]; // Remove duplicates
  }

  // Create comment
  async create(commentData) {
    // Validate input
    const { error, value } = Comment.getValidationSchema().validate(commentData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    // Extract mentions from content if not provided
    if (!value.mentions || value.mentions.length === 0) {
      const mentionedUsernames = this.extractMentions(value.content);
      
      if (mentionedUsernames.length > 0) {
        // Convert usernames to user IDs
        const User = require('./User');
        const userModel = new User();
        
        const mentionedUsers = await Promise.all(
          mentionedUsernames.map(username => userModel.findByUsername(username))
        );
        
        value.mentions = mentionedUsers
          .filter(user => user !== null)
          .map(user => user._id.toString());
      }
    }

    // Prepare comment document
    const comment = {
      ...value,
      _id: new ObjectID(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return new Promise((resolve, reject) => {
      this.collection.insert(comment, (err, result) => {
        if (err) reject(err);
        else resolve(result[0]);
      });
    });
  }

  // Find comment by ID
  async findById(id) {
    return new Promise((resolve, reject) => {
      this.collection.findOne({ _id: new ObjectID(id) }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Find comments by item
  async findByItem(itemId, limit = 50, skip = 0) {
    return new Promise((resolve, reject) => {
      this.collection.find({ itemId })
        .limit(limit)
        .skip(skip)
        .sort({ createdAt: 1 }) // Oldest first for conversation flow
        .toArray((err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
    });
  }

  // Find comments by author
  async findByAuthor(authorId, limit = 50, skip = 0) {
    return new Promise((resolve, reject) => {
      this.collection.find({ author: authorId })
        .limit(limit)
        .skip(skip)
        .sort({ createdAt: -1 })
        .toArray((err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
    });
  }

  // Find comments that mention a user
  async findMentions(userId, limit = 20, skip = 0) {
    return new Promise((resolve, reject) => {
      this.collection.find({ mentions: userId })
        .limit(limit)
        .skip(skip)
        .sort({ createdAt: -1 })
        .toArray((err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
    });
  }

  // Update comment
  async update(id, updateData) {
    const { error, value } = Comment.getValidationSchema(true).validate(updateData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    // Re-extract mentions if content is being updated
    if (value.content) {
      const mentionedUsernames = this.extractMentions(value.content);
      
      if (mentionedUsernames.length > 0) {
        const User = require('./User');
        const userModel = new User();
        
        const mentionedUsers = await Promise.all(
          mentionedUsernames.map(username => userModel.findByUsername(username))
        );
        
        value.mentions = mentionedUsers
          .filter(user => user !== null)
          .map(user => user._id.toString());
      } else {
        value.mentions = [];
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

  // Delete comment
  async delete(id) {
    return new Promise((resolve, reject) => {
      this.collection.remove({ _id: new ObjectID(id) }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }

  // Get comment count for item
  async getItemCommentCount(itemId) {
    return new Promise((resolve, reject) => {
      this.collection.count({ itemId }, (err, count) => {
        if (err) reject(err);
        else resolve(count);
      });
    });
  }

  // Get recent activity (comments) for project
  async getProjectActivity(projectId, limit = 20) {
    // First get all items for the project
    const Item = require('./Item');
    const itemModel = new Item();
    const items = await itemModel.findByProject(projectId, {}, 1000); // Get all items
    
    const itemIds = items.map(item => item._id.toString());

    return new Promise((resolve, reject) => {
      this.collection.find({ itemId: { $in: itemIds } })
        .limit(limit)
        .sort({ createdAt: -1 })
        .toArray((err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
    });
  }

  // Search comments
  async search(query, itemId = null, limit = 20) {
    const searchRegex = new RegExp(query, 'i');
    
    const searchCriteria = {
      content: searchRegex
    };

    if (itemId) {
      searchCriteria.itemId = itemId;
    }

    return new Promise((resolve, reject) => {
      this.collection.find(searchCriteria)
        .limit(limit)
        .sort({ createdAt: -1 })
        .toArray((err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
    });
  }

  // Get comments with populated author and item data
  async findByItemWithDetails(itemId, limit = 50, skip = 0) {
    const comments = await this.findByItem(itemId, limit, skip);
    
    // Populate author and item details
    const User = require('./User');
    const Item = require('./Item');
    const userModel = new User();
    const itemModel = new Item();

    const populatedComments = await Promise.all(
      comments.map(async (comment) => {
        const [author, item] = await Promise.all([
          userModel.findById(comment.author),
          itemModel.findById(comment.itemId)
        ]);

        return {
          ...comment,
          authorDetails: author ? {
            _id: author._id,
            username: author.username,
            profile: author.profile
          } : null,
          itemDetails: item ? {
            _id: item._id,
            key: item.key,
            title: item.title,
            projectId: item.projectId
          } : null
        };
      })
    );

    return populatedComments;
  }

  // Get user's comment statistics
  async getUserStats(userId) {
    return new Promise((resolve, reject) => {
      this.collection.aggregate([
        { $match: { author: userId } },
        {
          $group: {
            _id: null,
            totalComments: { $sum: 1 },
            firstComment: { $min: '$createdAt' },
            lastComment: { $max: '$createdAt' }
          }
        }
      ], (err, result) => {
        if (err) reject(err);
        else resolve(result[0] || { totalComments: 0, firstComment: null, lastComment: null });
      });
    });
  }

  // Delete all comments for an item (used when item is deleted)
  async deleteByItem(itemId) {
    return new Promise((resolve, reject) => {
      this.collection.remove({ itemId }, { multi: true }, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  }
}

module.exports = Comment;
