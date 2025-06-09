process.env.NODE_ENV = 'test'; // Set NODE_ENV to 'test' AT THE VERY TOP

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app'); // Main application instance
const { db, ObjectID } = require('../src/config/database'); // For direct DB access & ObjectID
const { registerAndLoginUser } = require('./helpers/authHelper'); // Import the helper
const User = require('../src/models/User'); // Needed for creating user for tests
const Project = require('../src/models/Project'); // Needed for direct project interaction or assertions

chai.use(chaiHttp);
const expect = chai.expect;

describe('Project Routes', function() { // Use function() to access this.timeout
  this.timeout(5000); // Increase timeout for this suite

  let defaultUser; // To store user created by helper
  let defaultToken; // To store token for the defaultUser

  beforeEach(async () => {
    // Clear relevant collections
    const collectionsToClear = ['users', 'projects', 'items', 'comments', 'tags'];
    for (const collectionName of collectionsToClear) {
      const collection = db.collection(collectionName);
      await new Promise((resolve, reject) => {
        collection.remove({}, { multi: true }, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    }

    // Setup a default user and token for authenticated tests
    const userDetails = {
      username: 'projecttestuser',
      email: 'projecttestuser@example.com',
      password: 'password123'
    };
    const authInfo = await registerAndLoginUser(userDetails);
    defaultToken = authInfo.tokens.accessToken;
    // Fetch the user document if needed (e.g. to get the full user object)
    const userInstance = new User();
    defaultUser = await userInstance.findById(authInfo.userId);
  });

  describe('POST /api/projects (Create new project)', () => {
    it('should create a new project successfully with valid data', async () => {
      const projectData = {
        name: 'My Test Project',
        description: 'This is a description for my test project.',
        key: 'TESTPROJ' // Added key
      };
      const res = await chai.request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${defaultToken}`)
        .send(projectData);

      console.log("Success case - Response status:", res.status);
      console.log("Success case - Response body:", JSON.stringify(res.body, null, 2));
      expect(res).to.have.status(201);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.be.an('object');
      expect(res.body.data).to.have.property('project');
      const createdProject = res.body.data.project;
      expect(createdProject).to.have.property('name', projectData.name);
      expect(createdProject).to.have.property('description', projectData.description);
      expect(createdProject).to.have.property('owner');
      expect(createdProject.owner.toString()).to.equal(defaultUser._id.toString()); // Check if owner is the logged-in user
      expect(createdProject.members[0].userId).to.equal(defaultUser._id.toString()); // Check if owner is also a member, using userId
      expect(createdProject.members[0].role).to.equal('manager'); // Project model makes owner a 'manager' by default in members array

      // Verify project is in the database
      const projectInstance = new Project();
      const dbProject = await projectInstance.findById(createdProject._id);
      expect(dbProject).to.not.be.null;
      expect(dbProject.name).to.equal(projectData.name);
      expect(dbProject.owner.toString()).to.equal(defaultUser._id.toString());
    });

    it('should return a 400 error if project name is missing', async () => {
      const projectData = {
        description: 'This is a description without a name.',
        key: 'NOKEYPROJ' // Added key to isolate missing name
      };
      const res = await chai.request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${defaultToken}`)
        .send(projectData);

      console.log("Missing name case - Response status:", res.status);
      console.log("Missing name case - Response body:", JSON.stringify(res.body, null, 2));
      expect(res).to.have.status(400);
      expect(res.body).to.have.property('success', false);
      // Based on Project model validation
      expect(res.body).to.have.property('message', 'Validation error');
      expect(res.body.errors[0]).to.contain('"name" is required');
    });

    it('should return a 401 error if trying to create a project without authentication', async () => {
      const projectData = {
        name: 'No Auth Project',
        description: 'This project creation should fail.'
      };
      const res = await chai.request(app)
        .post('/api/projects')
        .send(projectData);

      expect(res).to.have.status(401);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Access token required');
    });
  });

  describe('GET /api/projects (Get user\'s projects)', () => {
    it('should fetch projects for an authenticated user who has projects', async () => {
      // Create a couple of projects for the defaultUser
      const projectInstance = new Project();
      await projectInstance.create({ name: 'Project Alpha', key: 'ALPHA', owner: defaultUser._id.toString(), description: 'Desc Alpha' });
      await projectInstance.create({ name: 'Project Beta', key: 'BETA', owner: defaultUser._id.toString(), description: 'Desc Beta' });

      const res = await chai.request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${defaultToken}`);

      console.log("GET /api/projects (with projects) - Response status:", res.status);
      console.log("GET /api/projects (with projects) - Response body:", JSON.stringify(res.body, null, 2));
      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data.projects).to.be.an('array').with.lengthOf(2);
      // Default sort is updatedAt: 'desc'. Beta is created after Alpha, so Beta comes first.
      expect(res.body.data.projects[0]).to.have.property('name', 'Project Beta');
      expect(res.body.data.projects[1]).to.have.property('name', 'Project Alpha');
      expect(res.body.data.pagination).to.be.an('object');
    });

    it('should fetch an empty array for an authenticated user with no projects', async () => {
      // No projects created for defaultUser in this specific test's context (beforeEach clears)
      const res = await chai.request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${defaultToken}`);

      console.log("GET /api/projects (no projects) - Response status:", res.status);
      console.log("GET /api/projects (no projects) - Response body:", JSON.stringify(res.body, null, 2));
      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data.projects).to.be.an('array').with.lengthOf(0);
    });

    it('should return a 401 error if trying to fetch projects without authentication', async () => {
      const res = await chai.request(app)
        .get('/api/projects');

      expect(res).to.have.status(401);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Access token required');
    });
  });

  describe('GET /api/projects/:id (Get project by ID)', () => {
    let testProject;

    beforeEach(async () => {
      // Create a project for the defaultUser to be used in these tests
      const projectInstance = new Project();
      testProject = await projectInstance.create({
        name: 'Specific Project',
        key: 'SPEC',
        owner: defaultUser._id.toString(),
        description: 'Project for getting by ID'
      });
    });

    it('should fetch an existing project by its ID if user is owner/member', async () => {
      const res = await chai.request(app)
        .get(`/api/projects/${testProject._id}`)
        .set('Authorization', `Bearer ${defaultToken}`);

      console.log("GET /projects/:id (success owner) - Status:", res.status, "Body:", JSON.stringify(res.body, null, 2));
      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      // res.body.data.project._id is a number, testProject._id is an ObjectID from TingoDB
      expect(res.body.data.project._id.toString()).to.equal(testProject._id.toString());
      expect(res.body.data.project).to.have.property('name', testProject.name);
    });

    it('should return 404 if project ID is valid format but does not exist', async () => {
      const nonExistentId = new ObjectID().toString(); // Valid format, but not in DB
      const res = await chai.request(app)
        .get(`/api/projects/${nonExistentId}`)
        .set('Authorization', `Bearer ${defaultToken}`);

      expect(res).to.have.status(404);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Project not found');
    });

    it('should return 404 if project ID is invalid string format', async () => {
      // TingoDB/ObjectID might not error on invalid string format for ID before DB lookup
      // It might just not find it, leading to a 404, due to try/catch in model's findById.
      // If there's specific middleware to validate ObjectID format strictly, it might be 400.
      // For now, let's assume it will result in a 404 if not found.
      // If the app has specific ObjectID validation middleware, this test would change.
      const invalidFormatId = 'invalidID';
      const res = await chai.request(app)
        .get(`/api/projects/${invalidFormatId}`)
        .set('Authorization', `Bearer ${defaultToken}`);

      console.log("GET /projects/:id (invalid format) - Status:", res.status, "Body:", JSON.stringify(res.body, null, 2));
      // Based on current setup (no explicit ID format validation middleware shown),
      // TingoDB's ObjectID constructor might return an object that leads to 'not found'.
      // The Project model's findById also uses `new ObjectID(id)`.
      // If `new ObjectID('invalidID')` throws, controller's generic 500 catch would get it.
      // If it creates a "weird" ObjectID, then 404 is likely.
      // Let's check controller error: if ObjectID constructor fails, it's 500.
      // The `ObjectID` from `tingodb()` might be robust and not throw for invalid strings.
      // The current error handling in `projectController.getProjectById` for its generic catch:
      // `error: (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') ? error.message : 'Internal server error'`
      // If `new ObjectID(id)` in model fails, it will be caught.
      // Let's assume for now it might lead to a 500 if ObjectID creation fails badly, or 404 if it proceeds.
      // The error message in the test output will clarify.
      // For now, we'll predict a 500 if `new ObjectID()` in the model throws for "invalidID"
      // or 404 if it doesn't and just fails to find.
      // The `ObjectID` from `tingodb` is quite lenient. It will likely try to convert 'invalidID'
      // to something, and then not find it, resulting in a 404.
      expect(res).to.have.status(404);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Project not found');
    });

    it('should return 403 if user is not a member of the project', async () => {
      // Create another user
      const otherUserDetails = { username: 'otheruser', email: 'other@example.com', password: 'password123' };
      const { tokens: otherTokenInfo } = await registerAndLoginUser(otherUserDetails);
      console.log("[Test] otherToken for non-member access:", otherTokenInfo.accessToken); // Log the access token

      const res = await chai.request(app)
        .get(`/api/projects/${testProject._id}`) // testProject is owned by defaultUser
        .set('Authorization', `Bearer ${otherTokenInfo.accessToken}`); // Use the accessToken

      console.log("GET /projects/:id (not member) - Status:", res.status, "Body:", JSON.stringify(res.body, null, 2));
      expect(res).to.have.status(403);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Project access required'); // Corrected message
    });

    it('should return a 401 error if trying to fetch a project without authentication', async () => {
      const res = await chai.request(app)
        .get(`/api/projects/${testProject._id}`);

      expect(res).to.have.status(401);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Access token required');
    });
  });

  describe('PUT /api/projects/:id (Update project)', () => {
    let projectToUpdate;
    let ownerToken;
    let ownerUserId;

    beforeEach(async () => {
      // Setup owner user
      const ownerDetails = { username: 'projectowner', email: 'owner@example.com', password: 'password123' };
      const { tokens, userId } = await registerAndLoginUser(ownerDetails);
      ownerToken = tokens.accessToken;
      ownerUserId = userId;

      // Create a project owned by this user
      const projectInstance = new Project();
      projectToUpdate = await projectInstance.create({
        name: 'Original Project Name',
        key: 'ORIGKEY',
        owner: ownerUserId,
        description: 'Original project description'
      });
    });

    it('should update project successfully by the owner', async () => {
      const updateData = {
        name: 'Updated Project Name',
        description: 'Updated project description',
        status: 'archived'
      };
      const res = await chai.request(app)
        .put(`/api/projects/${projectToUpdate._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateData);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data.project.name).to.equal(updateData.name);
      expect(res.body.data.project.description).to.equal(updateData.description);
      expect(res.body.data.project.status).to.equal(updateData.status);

      // Verify in DB
      const dbProject = await new Project().findById(projectToUpdate._id);
      expect(dbProject.name).to.equal(updateData.name);
      expect(dbProject.description).to.equal(updateData.description);
      expect(dbProject.status).to.equal(updateData.status);
    });

    it('should return 400 if updating with invalid data (e.g., empty name)', async () => {
      const updateData = { name: '' }; // Empty name
      const res = await chai.request(app)
        .put(`/api/projects/${projectToUpdate._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateData);

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Validation error');
      expect(res.body.errors[0]).to.contain('"name" is not allowed to be empty');
    });

    it('should return 403 if user is not the owner/admin', async () => {
      // Create a different user
      const otherUserDetails = { username: 'nonowneruser', email: 'nonowner@example.com', password: 'password123' };
      const { tokens: otherTokenInfo } = await registerAndLoginUser(otherUserDetails); // Renamed to otherTokenInfo

      const updateData = { name: 'Attempted Update By NonOwner' };
      const res = await chai.request(app)
        .put(`/api/projects/${projectToUpdate._id}`)
        .set('Authorization', `Bearer ${otherTokenInfo.accessToken}`) // Used .accessToken
        .send(updateData);

      expect(res).to.have.status(403);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Project access required'); // Middleware message
    });

    it('should return 404 if updating a non-existent project', async () => {
      const nonExistentId = new ObjectID().toString();
      const updateData = { name: 'Update NonExistent' };
      const res = await chai.request(app)
        .put(`/api/projects/${nonExistentId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateData);

      expect(res).to.have.status(404);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Project not found');
    });

    it('should return 401 if trying to update without authentication', async () => {
      const updateData = { name: 'Update NoAuth' };
      const res = await chai.request(app)
        .put(`/api/projects/${projectToUpdate._id}`)
        .send(updateData);

      expect(res).to.have.status(401);
    });
  });

describe('DELETE /api/projects/:id (Delete project)', () => {
  let projectToDelete;
  let ownerToken;
  let ownerUserId;

  beforeEach(async () => {
    // Setup owner user
    const ownerDetails = { username: 'deleteowner', email: 'deleteowner@example.com', password: 'password123' };
    const { tokens, userId } = await registerAndLoginUser(ownerDetails);
    ownerToken = tokens.accessToken;
    ownerUserId = userId;

    // Create a project owned by this user
    const projectInstance = new Project();
    projectToDelete = await projectInstance.create({
      name: 'Project To Delete',
      key: 'DELKEY',
      owner: ownerUserId,
      description: 'This project will be deleted'
    });
  });

  it('should delete project successfully by the owner', async () => {
    const res = await chai.request(app)
      .delete(`/api/projects/${projectToDelete._id}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res).to.have.status(200); // Or 204 if no content is returned
    expect(res.body).to.have.property('success', true);
    expect(res.body).to.have.property('message', 'Project deleted successfully');

    // Verify project is deleted from the database
    const dbProject = await new Project().findById(projectToDelete._id);
    expect(dbProject).to.be.null;
  });

  it('should return 403 if user is not the owner/admin', async () => {
    // Create a different user
    const otherUserDetails = { username: 'nonownerdelete', email: 'nonownerdelete@example.com', password: 'password123' };
    const { tokens: otherToken } = await registerAndLoginUser(otherUserDetails);

    const res = await chai.request(app)
      .delete(`/api/projects/${projectToDelete._id}`)
      .set('Authorization', `Bearer ${otherToken.accessToken}`);

    expect(res).to.have.status(403);
    expect(res.body).to.have.property('success', false);
    // Message from controller for non-owner delete attempt
    expect(res.body).to.have.property('message', 'Only project owner can delete project');
  });

  it('should return 404 if deleting a non-existent project', async () => {
    const nonExistentId = new ObjectID().toString();
    const res = await chai.request(app)
      .delete(`/api/projects/${nonExistentId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res).to.have.status(404);
    expect(res.body).to.have.property('success', false);
    expect(res.body).to.have.property('message', 'Project not found');
  });

  it('should return 401 if trying to delete without authentication', async () => {
    const res = await chai.request(app)
      .delete(`/api/projects/${projectToDelete._id}`);

    expect(res).to.have.status(401);
  });
});

describe('Project Deletion (Cascading)', function() {
  this.timeout(7000); // Increase timeout for this suite due to multiple creations/deletions

  let projectOwnerUser;
  let projectOwnerToken;
  let projectInstance;
  let itemInstance;
  let commentInstance;
  let tagInstance;

  beforeEach(async () => {
    // Setup a specific user for these tests
    const userDetails = {
      username: 'cascadedeleteowner',
      email: 'cascadedeleteowner@example.com',
      password: 'password123',
      // roles: ['admin'] // If admin role is strictly needed, otherwise owner is fine
    };
    // Use the global defaultUser and defaultToken if they are suitable, or create new ones.
    // For this specific test, creating a dedicated user might be cleaner.
    const authInfo = await registerAndLoginUser(userDetails);
    projectOwnerToken = authInfo.tokens.accessToken;
    const userModel = new User(); // User model already imported at the top
    projectOwnerUser = await userModel.findById(authInfo.userId);

    projectInstance = new Project(); // Project model already imported
    itemInstance = new Item(); // Item model already imported
    commentInstance = new Comment(); // Comment model already imported
    tagInstance = new Tag(); // Tag model already imported
  });

  it('should delete associated items, comments, and tags when a project is deleted', async () => {
    // 1. Create a project
    const projectData = {
      name: 'Project For Cascade Delete',
      key: 'CASCADE',
      owner: projectOwnerUser._id.toString(),
      description: 'Test project for cascading delete'
    };
    const project = await projectInstance.create(projectData);
    expect(project).to.exist;
    const projectIdStr = project._id.toString(); // For consistency

    // 2. Create tags for the project
    const tag1 = await tagInstance.create({ projectId: projectIdStr, name: 'CascadeTag1', color: '#FF0000' });
    const tag2 = await tagInstance.create({ projectId: projectIdStr, name: 'CascadeTag2', color: '#00FF00' });
    expect(tag1).to.exist;
    expect(tag2).to.exist;

    // 3. Create items for the project
    const item1Data = { projectId: projectIdStr, title: 'Item 1 for Cascade', reporter: projectOwnerUser._id.toString(), type: 'task' };
    const item2Data = { projectId: projectIdStr, title: 'Item 2 for Cascade', reporter: projectOwnerUser._id.toString(), type: 'bug' };
    const item1 = await itemInstance.create(item1Data);
    const item2 = await itemInstance.create(item2Data);
    expect(item1).to.exist;
    expect(item2).to.exist;
    const item1IdStr = item1._id.toString();
    const item2IdStr = item2._id.toString();

    // 4. Create comments for the items
    const comment1Item1 = await commentInstance.create({ itemId: item1IdStr, author: projectOwnerUser._id.toString(), content: 'Comment 1 on Item 1' });
    const comment2Item1 = await commentInstance.create({ itemId: item1IdStr, author: projectOwnerUser._id.toString(), content: 'Comment 2 on Item 1' });
    const comment1Item2 = await commentInstance.create({ itemId: item2IdStr, author: projectOwnerUser._id.toString(), content: 'Comment 1 on Item 2' });
    expect(comment1Item1).to.exist;
    expect(comment2Item1).to.exist;
    expect(comment1Item2).to.exist;

    // 5. Delete the project via API
    const res = await chai.request(app)
      .delete(`/api/projects/${projectIdStr}`)
      .set('Authorization', `Bearer ${projectOwnerToken}`);

    expect(res).to.have.status(200);
    expect(res.body).to.have.property('success', true);
    expect(res.body).to.have.property('message', 'Project deleted successfully');

    // 6. Verify project is deleted
    const dbProject = await projectInstance.findById(projectIdStr);
    expect(dbProject).to.be.null;

    // 7. Verify associated tags are deleted
    const dbTag1 = await tagInstance.findById(tag1._id.toString());
    const dbTag2 = await tagInstance.findById(tag2._id.toString());
    expect(dbTag1).to.be.null;
    expect(dbTag2).to.be.null;
    const projectTags = await tagInstance.findByProject(projectIdStr);
    expect(projectTags).to.be.an('array').with.lengthOf(0);

    // 8. Verify associated items are deleted
    const dbItem1 = await itemInstance.findById(item1IdStr);
    const dbItem2 = await itemInstance.findById(item2IdStr);
    expect(dbItem1).to.be.null;
    expect(dbItem2).to.be.null;
    const projectItems = await itemInstance.findByProject(projectIdStr);
    expect(projectItems).to.be.an('array').with.lengthOf(0);

    // 9. Verify associated comments are deleted
    const dbComment1Item1 = await commentInstance.findById(comment1Item1._id.toString());
    const dbComment2Item1 = await commentInstance.findById(comment2Item1._id.toString());
    const dbComment1Item2 = await commentInstance.findById(comment1Item2._id.toString());
    expect(dbComment1Item1).to.be.null;
    expect(dbComment2Item1).to.be.null;
    expect(dbComment1Item2).to.be.null;

    const commentsForItem1 = await commentInstance.findByItem(item1IdStr);
    expect(commentsForItem1).to.be.an('array').with.lengthOf(0);
    const commentsForItem2 = await commentInstance.findByItem(item2IdStr);
    expect(commentsForItem2).to.be.an('array').with.lengthOf(0);
  });
});
});
