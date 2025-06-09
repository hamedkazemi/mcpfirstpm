process.env.NODE_ENV = 'test'; // Set NODE_ENV to 'test' AT THE VERY TOP

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app'); // Main application instance
const { db, ObjectID } = require('../src/config/database'); // For direct DB access & ObjectID
const { registerAndLoginUser } = require('./helpers/authHelper'); // Auth helper
const User = require('../src/models/User');
const Project = require('../src/models/Project');
const Item = require('../src/models/Item');

chai.use(chaiHttp);
const expect = chai.expect;

describe('Item Routes', function() {
  this.timeout(5000); // Increase timeout for this suite

  let ownerUser, ownerToken;
  let memberUser, memberToken;
  let nonMemberUser, nonMemberToken;
  let testProject;

  const userInstance = new User();
  const projectInstance = new Project();
  const itemInstance = new Item();

  beforeEach(async () => {
    // Clear relevant collections before each test
    try {
      await db.collection('users').remove({}, { multi: true });
      await db.collection('projects').remove({}, { multi: true });
      await db.collection('items').remove({}, { multi: true });
    } catch (error) {
      console.error('Error clearing collections:', error);
      // Depending on how critical this is, you might want to throw or handle
    }

    // Create users
    const ownerDetails = { username: 'itemowner', email: 'itemowner@example.com', password: 'password123' };
    const ownerAuth = await registerAndLoginUser(ownerDetails);
    ownerToken = ownerAuth.tokens.accessToken;
    ownerUser = await userInstance.findById(ownerAuth.userId);

    const memberDetails = { username: 'itemmember', email: 'itemmember@example.com', password: 'password123' };
    const memberAuth = await registerAndLoginUser(memberDetails);
    memberToken = memberAuth.tokens.accessToken;
    memberUser = await userInstance.findById(memberAuth.userId);

    const nonMemberDetails = { username: 'itemnonmember', email: 'itemnonmember@example.com', password: 'password123' };
    const nonMemberAuth = await registerAndLoginUser(nonMemberDetails);
    nonMemberToken = nonMemberAuth.tokens.accessToken;
    nonMemberUser = await userInstance.findById(nonMemberAuth.userId);

    // Create a project owned by ownerUser
    testProject = await projectInstance.create({
      name: 'Item Test Project',
      key: 'ITEMKEY',
      owner: ownerUser._id.toString(),
      description: 'Project for testing item APIs'
    });

    // Add memberUser to the project
    // The owner is already added as a 'manager' during project creation by the model
    await projectInstance.addMember(testProject._id.toString(), memberUser._id.toString(), 'viewer');

    // Refresh testProject to ensure it has the latest members data if needed for assertions later
    testProject = await projectInstance.findById(testProject._id.toString());
  });

  describe('GET /api/projects/:projectId/items (Get project items)', () => {
    it('should successfully get an empty array of items for a project with no items (as owner)', async () => {
      const res = await chai.request(app)
        .get(`/api/projects/${testProject._id}/items`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('items').that.is.an('array').with.lengthOf(0);
      expect(res.body.data).to.have.property('pagination');
    });

    it('should successfully get an empty array of items for a project with no items (as member)', async () => {
      const res = await chai.request(app)
        .get(`/api/projects/${testProject._id}/items`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('items').that.is.an('array').with.lengthOf(0);
    });

    it('should successfully get items for a project with existing items (as owner)', async () => {
      // Create items for the project
      await itemInstance.create({ projectId: testProject._id.toString(), title: 'Item 1', type: 'task', createdBy: ownerUser._id.toString() });
      await itemInstance.create({ projectId: testProject._id.toString(), title: 'Item 2', type: 'feature', createdBy: memberUser._id.toString() });

      const res = await chai.request(app)
        .get(`/api/projects/${testProject._id}/items`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('items').that.is.an('array').with.lengthOf(2);
      expect(res.body.data.items[0]).to.have.property('title', 'Item 1'); // Default sort might be by createdAt or _id
      expect(res.body.data.items[1]).to.have.property('title', 'Item 2');
      // Note: Default sort order is important here. Assuming it's creation order or similar.
      // The itemController.getProjectItems has default sort `sortBy = 'number', sortOrder = 'desc'`.
      // Let's adjust test to be independent of specific order for now, or create items with explicit numbers if that's the sort key.
      // For now, just checking length and presence of titles.
      const titles = res.body.data.items.map(item => item.title);
      expect(titles).to.include.members(['Item 1', 'Item 2']);
    });

    it('should successfully get items for a project with existing items (as member)', async () => {
      await itemInstance.create({ projectId: testProject._id.toString(), title: 'Item A', type: 'bug', createdBy: ownerUser._id.toString() });
      await itemInstance.create({ projectId: testProject._id.toString(), title: 'Item B', type: 'task', createdBy: memberUser._id.toString() });

      const res = await chai.request(app)
        .get(`/api/projects/${testProject._id}/items`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res).to.have.status(200);
      expect(res.body.data.items).to.be.an('array').with.lengthOf(2);
      const titles = res.body.data.items.map(item => item.title);
      expect(titles).to.include.members(['Item A', 'Item B']);
    });

    it('should return 404 if trying to get items for a non-existent project', async () => {
      const nonExistentProjectId = new ObjectID().toString();
      const res = await chai.request(app)
        .get(`/api/projects/${nonExistentProjectId}/items`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res).to.have.status(404); // This comes from requireProjectAccess if project not found by model
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Project not found'); // Or similar from middleware
    });

    it('should return 401 if trying to get items without authentication', async () => {
      const res = await chai.request(app)
        .get(`/api/projects/${testProject._id}/items`);

      expect(res).to.have.status(401);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Access token required');
    });

    it('should return 403 if user does not have project access', async () => {
      const res = await chai.request(app)
        .get(`/api/projects/${testProject._id}/items`)
        .set('Authorization', `Bearer ${nonMemberToken}`); // nonMemberUser is not part of testProject

      expect(res).to.have.status(403);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Access denied to this project'); // From requireProjectAccess
    });
  });

  describe('POST /api/projects/:projectId/items (Create new item)', () => {
    const itemData = {
      title: 'Test Item Title',
      description: 'Test item description',
      type: 'task', // Valid type
      status: 'todo', // Valid status
      priority: 'medium' // Valid priority
    };

    it('should successfully create an item as project owner', async () => {
      const res = await chai.request(app)
        .post(`/api/projects/${testProject._id}/items`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(itemData);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('item');
      const createdItem = res.body.data.item;
      expect(createdItem).to.have.property('title', itemData.title);
      expect(createdItem).to.have.property('type', itemData.type);
      expect(createdItem).to.have.property('projectId', testProject._id.toString());
      expect(createdItem).to.have.property('createdBy', ownerUser._id.toString());
      expect(createdItem).to.have.property('itemNumber', 1); // First item in this project

      // Verify in DB
      const dbItem = await itemInstance.findById(createdItem._id);
      expect(dbItem).to.not.be.null;
      expect(dbItem.title).to.equal(itemData.title);
      expect(dbItem.projectId.toString()).to.equal(testProject._id.toString());
      expect(dbItem.createdBy.toString()).to.equal(ownerUser._id.toString());
      expect(dbItem.itemNumber).to.equal(1);
    });

    it('should successfully create an item as project member', async () => {
      // Create one item first to check itemNumber increment
      await itemInstance.create({ ...itemData, projectId: testProject._id.toString(), createdBy: ownerUser._id.toString(), title: "First Item" });

      const memberItemData = { ...itemData, title: 'Member Created Item' };
      const res = await chai.request(app)
        .post(`/api/projects/${testProject._id}/items`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send(memberItemData);

      expect(res).to.have.status(201);
      expect(res.body.data.item).to.have.property('title', memberItemData.title);
      expect(res.body.data.item).to.have.property('projectId', testProject._id.toString());
      expect(res.body.data.item).to.have.property('createdBy', memberUser._id.toString());
      expect(res.body.data.item).to.have.property('itemNumber', 2); // Second item

      const dbItem = await itemInstance.findById(res.body.data.item._id);
      expect(dbItem.createdBy.toString()).to.equal(memberUser._id.toString());
      expect(dbItem.itemNumber).to.equal(2);
    });

    it('should return 400 if creating an item with missing title', async () => {
      const invalidItemData = { ...itemData };
      delete invalidItemData.title; // title is required

      const res = await chai.request(app)
        .post(`/api/projects/${testProject._id}/items`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(invalidItemData);

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Validation error');
      expect(res.body.errors[0]).to.contain('"title" is required');
    });

    it('should return 400 if creating an item with invalid type', async () => {
      const invalidItemData = { ...itemData, type: 'invalidTypeString' };

      const res = await chai.request(app)
        .post(`/api/projects/${testProject._id}/items`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(invalidItemData);

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Validation error');
      expect(res.body.errors[0]).to.contain('"type" must be one of [epic, feature, task, bug, story]');
    });

    it('should return 404 if creating an item in a non-existent project', async () => {
      const nonExistentProjectId = new ObjectID().toString();
      const res = await chai.request(app)
        .post(`/api/projects/${nonExistentProjectId}/items`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(itemData);

      expect(res).to.have.status(404);
      expect(res.body).to.have.property('success', false);
      // This message comes from requireProjectAccess middleware usually
      expect(res.body).to.have.property('message', 'Project not found');
    });

    it('should return 401 if trying to create an item without authentication', async () => {
      const res = await chai.request(app)
        .post(`/api/projects/${testProject._id}/items`)
        .send(itemData);

      expect(res).to.have.status(401);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Access token required');
    });

    it('should return 403 if user does not have project access when creating an item', async () => {
      const res = await chai.request(app)
        .post(`/api/projects/${testProject._id}/items`)
        .set('Authorization', `Bearer ${nonMemberToken}`) // nonMemberUser is not part of testProject
        .send(itemData);

      expect(res).to.have.status(403);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Access denied to this project'); // From requireProjectAccess
    });
  });

  describe('GET /api/items/:itemId (Get item by ID)', () => {
    let testItem;

    beforeEach(async () => {
      // Create a test item associated with testProject, created by ownerUser
      const itemData = {
        title: 'Specific Item to Get',
        description: 'Details of the specific item.',
        type: 'task',
        projectId: testProject._id.toString(),
        createdBy: ownerUser._id.toString(),
        status: 'todo',
        priority: 'high'
      };
      testItem = await itemInstance.create(itemData);
    });

    it('should successfully get an item by ID (as project owner)', async () => {
      const res = await chai.request(app)
        .get(`/api/items/${testItem._id}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.be.an('object');
      expect(res.body.data._id.toString()).to.equal(testItem._id.toString());
      expect(res.body.data.title).to.equal(testItem.title);
      expect(res.body.data.projectId._id.toString()).to.equal(testProject._id.toString()); // projectId is populated
      expect(res.body.data.createdBy.username).to.equal(ownerUser.username); // createdBy is populated
    });

    it('should successfully get an item by ID (as project member)', async () => {
      const res = await chai.request(app)
        .get(`/api/items/${testItem._id}`)
        .set('Authorization', `Bearer ${memberToken}`); // memberUser is part of testProject

      expect(res).to.have.status(200);
      expect(res.body.data._id.toString()).to.equal(testItem._id.toString());
      expect(res.body.data.title).to.equal(testItem.title);
    });

    it('should return 404 if getting a non-existent item ID', async () => {
      const nonExistentItemId = new ObjectID().toString();
      const res = await chai.request(app)
        .get(`/api/items/${nonExistentItemId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res).to.have.status(404);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Item not found'); // From requireItemAccess or controller
    });

    it('should return 404 if getting an item with an invalid ID format', async () => {
      const invalidItemId = 'invalidItemIdFormat';
      const res = await chai.request(app)
        .get(`/api/items/${invalidItemId}`)
        .set('Authorization', `Bearer ${ownerToken}`);
      // The model's findById will likely fail to convert 'invalidItemIdFormat' to a valid ObjectID,
      // leading to it not finding the item, thus a 404, or a 500 if the ID cast error is not handled.
      // The `requireItemAccess` middleware or controller's `itemModel.findById` should handle this.
      // If `new ObjectID()` in model throws, it might be 500. If it returns null/undefined, then 404.
      // Let's assume graceful handling leads to 404.
      // The `tingodb` ObjectID constructor is quite lenient and might not throw.
      // If `itemModel.findById` uses `new ObjectID(id)` and it fails to cast, it might return null, leading to 404.
      // The middleware `requireItemAccess` calls `itemModel.findById`. If it gets null, it should send 404.
      expect(res).to.have.status(404); // Or 500 if ObjectID parsing is unhandled
      expect(res.body).to.have.property('success', false);
      // Message could be 'Item not found' or an ID validation error if specific middleware is added.
      // For now, 'Item not found' is a likely outcome of the ID not matching anything.
      // If the middleware `isValidObjectId` is applied to this route, it would be 400.
      // Since it's not explicitly mentioned for `/api/items/:id`, we rely on `findById` behavior.
      // The `requireItemAccess` middleware calls `itemModel.findById`. If this returns null (e.g. due to invalid ID format not casting),
      // then `requireItemAccess` itself returns 404.
      expect(res.body).to.have.property('message', 'Item not found');
    });

    it('should return 401 if trying to get an item without authentication', async () => {
      const res = await chai.request(app)
        .get(`/api/items/${testItem._id}`);

      expect(res).to.have.status(401);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Access token required');
    });

    it('should return 403 if user does not have project access for the item', async () => {
      const res = await chai.request(app)
        .get(`/api/items/${testItem._id}`)
        .set('Authorization', `Bearer ${nonMemberToken}`); // nonMemberUser is not part of testProject

      expect(res).to.have.status(403);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Access denied to this item\'s project'); // From requireItemAccess
    });
  });

  describe('PUT /api/items/:itemId (Update item)', () => {
    let testItemToUpdate;
    let anotherUser; // For assignee tests

    beforeEach(async () => {
      // Create a user not in the project for assignee testing
      const anotherUserDetails = { username: 'anotheritemuser', email: 'anotheritemuser@example.com', password: 'password123' };
      const anotherUserAuth = await registerAndLoginUser(anotherUserDetails);
      anotherUser = await userInstance.findById(anotherUserAuth.userId);

      // Create a fresh test item for each update test
      const itemData = {
        title: 'Item Before Update',
        description: 'Initial description.',
        type: 'task', // Type is generally not updated via the generic update route
        projectId: testProject._id.toString(),
        createdBy: ownerUser._id.toString(),
        status: 'todo',
        priority: 'medium'
      };
      testItemToUpdate = await itemInstance.create(itemData);
    });

    it('should successfully update an item by a project member', async () => {
      const updates = {
        title: 'Item After Update',
        description: 'Updated description.',
        status: 'in-progress',
        priority: 'high',
        assignedTo: memberUser._id.toString() // Assign to existing member
      };

      const res = await chai.request(app)
        .put(`/api/items/${testItemToUpdate._id}`)
        .set('Authorization', `Bearer ${memberToken}`) // memberUser can update
        .send(updates);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      const updatedItem = res.body.data;
      expect(updatedItem.title).to.equal(updates.title);
      expect(updatedItem.description).to.equal(updates.description);
      expect(updatedItem.status).to.equal(updates.status);
      expect(updatedItem.priority).to.equal(updates.priority);
      expect(updatedItem.assignedTo._id.toString()).to.equal(updates.assignedTo);

      // Verify in DB
      const dbItem = await itemInstance.findById(testItemToUpdate._id);
      expect(dbItem.title).to.equal(updates.title);
      expect(dbItem.description).to.equal(updates.description);
      expect(dbItem.status).to.equal(updates.status);
      expect(dbItem.priority).to.equal(updates.priority);
      expect(dbItem.assignedTo.toString()).to.equal(updates.assignedTo);
    });

    it('should return 400 if updating with an invalid status string', async () => {
      const updates = { status: 'invalidStatusValue' };
      const res = await chai.request(app)
        .put(`/api/items/${testItemToUpdate._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updates);

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Validation error');
      // The error message comes from Joi validation in the model's update method
      expect(res.body.errors[0]).to.contain('"status" must be one of [todo, in-progress, review, done, archived]');
    });

    it('should return 400 when trying to assign item to a user not in the project', async () => {
      const updates = { assignedTo: anotherUser._id.toString() }; // anotherUser is not in testProject

      const res = await chai.request(app)
        .put(`/api/items/${testItemToUpdate._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updates);

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Cannot assign item to user who is not a project member');
    });

    it('should allow unassigning an item by setting assignedTo to null', async () => {
      // First, assign it to someone
      await itemInstance.update(testItemToUpdate._id, { assignedTo: memberUser._id });

      const updates = { assignedTo: null };
      const res = await chai.request(app)
        .put(`/api/items/${testItemToUpdate._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updates);

      expect(res).to.have.status(200);
      expect(res.body.data.assignedTo).to.be.null;
      const dbItem = await itemInstance.findById(testItemToUpdate._id);
      expect(dbItem.assignedTo).to.be.null;
    });


    it('should return 404 if updating a non-existent item', async () => {
      const nonExistentItemId = new ObjectID().toString();
      const res = await chai.request(app)
        .put(`/api/items/${nonExistentItemId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ title: 'Trying to update non-existent' });

      expect(res).to.have.status(404);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Item not found'); // From requireItemAccess or controller
    });

    it('should return 401 if trying to update an item without authentication', async () => {
      const res = await chai.request(app)
        .put(`/api/items/${testItemToUpdate._id}`)
        .send({ title: 'Update without auth' });

      expect(res).to.have.status(401);
    });

    it('should return 403 if user does not have project access when updating an item', async () => {
      const res = await chai.request(app)
        .put(`/api/items/${testItemToUpdate._id}`)
        .set('Authorization', `Bearer ${nonMemberToken}`) // nonMemberUser is not part of testProject
        .send({ title: 'Update by non-member' });

      expect(res).to.have.status(403);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Access denied to this item\'s project'); // From requireItemAccess
    });
  });

  describe('DELETE /api/items/:itemId (Delete item)', () => {
    let itemToDelete;

    beforeEach(async () => {
      // Create a fresh test item for each delete test, created by ownerUser
      const itemData = {
        title: 'Item To Be Deleted',
        description: 'This item will be deleted.',
        type: 'task',
        projectId: testProject._id.toString(),
        createdBy: ownerUser._id.toString(), // ownerUser creates it
        status: 'todo',
        priority: 'low'
      };
      itemToDelete = await itemInstance.create(itemData);
    });

    it('should successfully delete an item by a project member (not creator)', async () => {
      // memberUser is part of the project, but not the creator of itemToDelete.
      // Current implementation of requireItemAccess should allow any project member.
      const res = await chai.request(app)
        .delete(`/api/items/${itemToDelete._id}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('message', 'Item deleted successfully');

      // Verify item is removed from the database
      const dbItem = await itemInstance.findById(itemToDelete._id);
      expect(dbItem).to.be.null;
    });

    it('should successfully delete an item by its creator (project owner in this case)', async () => {
      const res = await chai.request(app)
        .delete(`/api/items/${itemToDelete._id}`)
        .set('Authorization', `Bearer ${ownerToken}`); // ownerUser (creator) deletes it

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('message', 'Item deleted successfully');

      const dbItem = await itemInstance.findById(itemToDelete._id);
      expect(dbItem).to.be.null;
    });

    it('should return 404 if deleting a non-existent item', async () => {
      const nonExistentItemId = new ObjectID().toString();
      const res = await chai.request(app)
        .delete(`/api/items/${nonExistentItemId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res).to.have.status(404);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Item not found'); // From requireItemAccess or controller
    });

    it('should return 401 if trying to delete an item without authentication', async () => {
      const res = await chai.request(app)
        .delete(`/api/items/${itemToDelete._id}`);

      expect(res).to.have.status(401);
    });

    it('should return 403 if user does not have project access when deleting an item', async () => {
      const res = await chai.request(app)
        .delete(`/api/items/${itemToDelete._id}`)
        .set('Authorization', `Bearer ${nonMemberToken}`); // nonMemberUser is not part of testProject

      expect(res).to.have.status(403);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Access denied to this item\'s project'); // From requireItemAccess
    });
  });

  // --- Add Tag to Item & Remove Tag from Item ---
  describe('Item Tag Management', () => {
    let testItemForTagging;
    let projectTag1, projectTag2;
    let anotherProjectForTags, tagFromAnotherProject;

    beforeEach(async () => {
      testItemForTagging = await itemInstance.create({
        title: 'Item for Tagging Tests',
        type: 'task',
        projectId: testProject._id.toString(),
        createdBy: ownerUser._id.toString()
      });

      projectTag1 = await tagInstance.create({ name: 'ProjectTag1', color: '#PTAG1', projectId: testProject._id.toString() });
      projectTag2 = await tagInstance.create({ name: 'ProjectTag2', color: '#PTAG2', projectId: testProject._id.toString() });

      // Create another project and a tag within it for cross-project tests
      const anotherProjData = { name: 'Other Project For Tags', key: 'OTAGKEY', owner: ownerUser._id.toString() };
      anotherProjectForTags = await projectInstance.create(anotherProjData);
      tagFromAnotherProject = await tagInstance.create({ name: 'ExternalTag', color: '#EXTAG', projectId: anotherProjectForTags._id.toString() });
    });

    // POST /api/items/:itemId/tags/:tagId (Add tag to item)
    describe('POST /api/items/:itemId/tags/:tagId (Add tag to item)', () => {
      it('should successfully add an existing project tag to an item (by project member)', async () => {
        const initialTagCount = await tagInstance.findById(projectTag1._id).then(t => t.itemCount);

        const res = await chai.request(app)
          .post(`/api/items/${testItemForTagging._id}/tags/${projectTag1._id}`)
          .set('Authorization', `Bearer ${memberToken}`);

        expect(res).to.have.status(200);
        expect(res.body).to.have.property('success', true);
        expect(res.body.data.item.tags).to.be.an('array').that.includes(projectTag1._id.toString());

        const dbItem = await itemInstance.findById(testItemForTagging._id);
        expect(dbItem.tags.map(t => t.toString())).to.include(projectTag1._id.toString());

        const dbTag = await tagInstance.findById(projectTag1._id);
        expect(dbTag.itemCount).to.equal(initialTagCount + 1);
      });

      it('should return 400 if attempting to add a tag that is already on the item', async () => {
        // Add the tag first and manually update itemCount for accurate state
        testItemForTagging.tags.addToSet(projectTag1._id);
        await testItemForTagging.save();
        projectTag1.itemCount = (projectTag1.itemCount || 0) + 1;
        await projectTag1.save();

        const res = await chai.request(app)
          .post(`/api/items/${testItemForTagging._id}/tags/${projectTag1._id}`)
          .set('Authorization', `Bearer ${memberToken}`);

        expect(res).to.have.status(400);
        expect(res.body).to.have.property('success', false);
        expect(res.body).to.have.property('message', 'Item already has this tag');
      });

      it('should return 404 if attempting to add a non-existent tag to an item', async () => {
        const nonExistentTagId = new ObjectID().toString();
        const res = await chai.request(app)
          .post(`/api/items/${testItemForTagging._id}/tags/${nonExistentTagId}`)
          .set('Authorization', `Bearer ${memberToken}`);

        expect(res).to.have.status(404);
        expect(res.body).to.have.property('message', 'Tag not found');
      });

      it('should return 404 if attempting to add a tag to a non-existent item', async () => {
        const nonExistentItemId = new ObjectID().toString();
        const res = await chai.request(app)
          .post(`/api/items/${nonExistentItemId}/tags/${projectTag1._id}`)
          .set('Authorization', `Bearer ${memberToken}`);

        expect(res).to.have.status(404);
        // This message comes from requireItemAccess middleware
        expect(res.body).to.have.property('message', 'Item not found');
      });

      it('should return 400 if attempting to add a tag from a different project to an item', async () => {
        const res = await chai.request(app)
          .post(`/api/items/${testItemForTagging._id}/tags/${tagFromAnotherProject._id}`)
          .set('Authorization', `Bearer ${memberToken}`);

        expect(res).to.have.status(400);
        expect(res.body).to.have.property('message', 'Cannot add tag from a different project');
      });

      it('should return 401 when adding tag without authentication', async () => {
        const res = await chai.request(app)
          .post(`/api/items/${testItemForTagging._id}/tags/${projectTag1._id}`);
        expect(res).to.have.status(401);
      });

      it('should return 403 when user is not a member of the item\'s project', async () => {
        const res = await chai.request(app)
          .post(`/api/items/${testItemForTagging._id}/tags/${projectTag1._id}`)
          .set('Authorization', `Bearer ${nonMemberToken}`);
        expect(res).to.have.status(403);
        expect(res.body).to.have.property('message', 'Access denied to this item\'s project');
      });
    });

    // DELETE /api/items/:itemId/tags/:tagId (Remove tag from item)
    describe('DELETE /api/items/:itemId/tags/:tagId (Remove tag from item)', () => {
      beforeEach(async () => {
        // Ensure testItemForTagging has projectTag1 before each DELETE test
        // and projectTag1's itemCount is incremented accordingly for a valid pre-state.
        if (!testItemForTagging.tags.map(t=>t.toString()).includes(projectTag1._id.toString())) {
            testItemForTagging.tags.addToSet(projectTag1._id);
            await testItemForTagging.save();
            projectTag1.itemCount = (projectTag1.itemCount || 0) + 1;
            await projectTag1.save();
        }
        // Reload testItemForTagging to get updated tags array
        testItemForTagging = await itemInstance.findById(testItemForTagging._id);
        // Reload tag to ensure itemCount is fresh from DB for assertion
        projectTag1 = await tagInstance.findById(projectTag1._id);
      });

      it('should successfully remove an existing tag from an item (by project member)', async () => {
        const initialTagCount = await tagInstance.findById(projectTag1._id).then(t => t.itemCount);
        expect(testItemForTagging.tags.map(t=>t.toString())).to.include(projectTag1._id.toString());


        const res = await chai.request(app)
          .delete(`/api/items/${testItemForTagging._id}/tags/${projectTag1._id}`)
          .set('Authorization', `Bearer ${memberToken}`);

        expect(res).to.have.status(200);
        expect(res.body).to.have.property('success', true);
        expect(res.body.data.item.tags).to.be.an('array').that.does.not.include(projectTag1._id.toString());

        const dbItem = await itemInstance.findById(testItemForTagging._id);
        expect(dbItem.tags.map(t => t.toString())).to.not.include(projectTag1._id.toString());

        const dbTag = await tagInstance.findById(projectTag1._id);
        expect(dbTag.itemCount).to.equal(initialTagCount - 1);
      });

      it('should return 404 if attempting to remove a tag that is not on the item', async () => {
        // projectTag2 is not on testItemForTagging initially in this specific test context (though it was in parent)
        // Ensure it's not there after the beforeEach of this describe block
        expect(testItemForTagging.tags.map(t=>t.toString())).to.not.include(projectTag2._id.toString());

        const res = await chai.request(app)
          .delete(`/api/items/${testItemForTagging._id}/tags/${projectTag2._id}`)
          .set('Authorization', `Bearer ${memberToken}`);

        expect(res).to.have.status(404);
        expect(res.body).to.have.property('message', 'Tag not found on this item');
      });

      it('should return 404 if attempting to remove a non-existent tag from an item', async () => {
        const nonExistentTagId = new ObjectID().toString();
        const res = await chai.request(app)
          .delete(`/api/items/${testItemForTagging._id}/tags/${nonExistentTagId}`)
          .set('Authorization', `Bearer ${memberToken}`);

        expect(res).to.have.status(404);
        expect(res.body).to.have.property('message', 'Tag not found');
      });

      it('should return 404 if attempting to remove a tag from a non-existent item', async () => {
        const nonExistentItemId = new ObjectID().toString();
        const res = await chai.request(app)
          .delete(`/api/items/${nonExistentItemId}/tags/${projectTag1._id}`)
          .set('Authorization', `Bearer ${memberToken}`);

        expect(res).to.have.status(404);
        expect(res.body).to.have.property('message', 'Item not found'); // From requireItemAccess
      });

      it('should return 401 when removing tag without authentication', async () => {
        const res = await chai.request(app)
          .delete(`/api/items/${testItemForTagging._id}/tags/${projectTag1._id}`);
        expect(res).to.have.status(401);
      });

      it('should return 403 when user not member of item\'s project tries to remove tag', async () => {
        const res = await chai.request(app)
          .delete(`/api/items/${testItemForTagging._id}/tags/${projectTag1._id}`)
          .set('Authorization', `Bearer ${nonMemberToken}`);
        expect(res).to.have.status(403);
        expect(res.body).to.have.property('message', 'Access denied to this item\'s project');
      });
    });
  });
});
