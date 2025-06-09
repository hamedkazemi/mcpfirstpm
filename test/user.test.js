process.env.NODE_ENV = 'test'; // Set NODE_ENV to 'test' AT THE VERY TOP

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app'); // Main application instance
const { db, ObjectID } = require('../src/config/database'); // For direct DB access & ObjectID
const { registerAndLoginUser } = require('./helpers/authHelper'); // Auth helper

// Models
const User = require('../src/models/User');
const Project = require('../src/models/Project');
const Item = require('../src/models/Item');
const Comment = require('../src/models/Comment');

chai.use(chaiHttp);
const expect = chai.expect;

describe('User Deletion Logic', function() {
  this.timeout(10000); // Increase timeout for this suite due to complex setups

  let adminUser, userToDelete, otherUser;
  let adminToken;

  let userModel, projectModel, itemModel, commentModel;

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

    userModel = new User();
    projectModel = new Project();
    itemModel = new Item();
    commentModel = new Comment();

    // Create an admin user for performing deletions
    const adminDetails = { username: 'testadmin', email: 'admin@example.com', password: 'password123', roles: ['admin'] };
    // Need to manually create admin as registerAndLoginUser might not set roles directly, or use a specific admin creation helper if available.
    // For simplicity, let's assume direct model creation for roles and then login.
    // However, authHelper.registerAndLoginUser doesn't directly support passing roles.
    // Let's create users directly with model then login admin.

    // Create adminUser
    adminUser = await userModel.create({ ...adminDetails, email: 'admin@example.com', username: 'adminuser' });
    const adminLoginRes = await chai.request(app).post('/api/auth/login').send({ email: adminDetails.email, password: adminDetails.password });
    adminToken = adminLoginRes.body.data.tokens.accessToken;

    // Create userToDelete
    userToDelete = await userModel.create({ username: 'usertodelete', email: 'delete@example.com', password: 'password123', roles: ['developer'] });

    // Create otherUser
    otherUser = await userModel.create({ username: 'otheruser', email: 'other@example.com', password: 'password123', roles: ['developer'] });
  });

  it('should transfer project ownership, remove memberships, and anonymize content when a user is deleted', async () => {
    // 1. Setup initial state:
    //    - userToDelete owns project1
    //    - userToDelete is a member of project2 (owned by otherUser)
    //    - userToDelete has created items and comments in project1 and project2
    //    - userToDelete is assigned to some items

    const project1 = await projectModel.create({
      name: 'Project Owned by UserToDelete',
      key: 'PROJ1',
      owner: userToDelete._id.toString(),
      description: 'P1 desc'
    });

    const project2 = await projectModel.create({
      name: 'Project Owned by OtherUser',
      key: 'PROJ2',
      owner: otherUser._id.toString(),
      description: 'P2 desc'
    });
    // Add userToDelete as a member to project2
    await projectModel.addMember(project2._id.toString(), userToDelete._id.toString(), 'developer');

    // Items and comments
    const item1_p1 = await itemModel.create({ projectId: project1._id.toString(), title: 'Item 1 P1', reporter: userToDelete._id.toString(), assignee: userToDelete._id.toString() });
    const item2_p1 = await itemModel.create({ projectId: project1._id.toString(), title: 'Item 2 P1', reporter: userToDelete._id.toString() });
    const item1_p2 = await itemModel.create({ projectId: project2._id.toString(), title: 'Item 1 P2', reporter: userToDelete._id.toString(), assignee: otherUser._id.toString() });
    const item2_p2 = await itemModel.create({ projectId: project2._id.toString(), title: 'Item 2 P2', reporter: otherUser._id.toString(), assignee: userToDelete._id.toString() });

    const comment1_item1_p1 = await commentModel.create({ itemId: item1_p1._id.toString(), author: userToDelete._id.toString(), content: 'Comment by userToDelete on item1_p1' });
    const comment1_item1_p2 = await commentModel.create({ itemId: item1_p2._id.toString(), author: userToDelete._id.toString(), content: 'Comment by userToDelete on item1_p2' });

    // 2. Delete userToDelete via API as adminUser
    const res = await chai.request(app)
      .delete(`/api/users/${userToDelete._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res).to.have.status(200);
    expect(res.body).to.have.property('success', true);
    expect(res.body).to.have.property('message', 'User deleted successfully');

    // 3. Verifications
    //    - userToDelete is deleted
    const deletedUserDoc = await userModel.findById(userToDelete._id);
    expect(deletedUserDoc).to.be.null;

    //    - project1 is now owned by adminUser (the first admin found)
    const updatedProject1 = await projectModel.findById(project1._id);
    expect(updatedProject1).to.exist;
    expect(updatedProject1.owner.toString()).to.equal(adminUser._id.toString());

    //    - userToDelete is no longer a member of project2
    const updatedProject2 = await projectModel.findById(project2._id);
    expect(updatedProject2).to.exist;
    const member = updatedProject2.members.find(m => m.userId.toString() === userToDelete._id.toString());
    expect(member).to.be.undefined;

    //    - Items reported by userToDelete now have reporter as null
    const updatedItem1P1_reporter = await itemModel.findById(item1_p1._id);
    expect(updatedItem1P1_reporter.reporter).to.be.null;
    const updatedItem2P1_reporter = await itemModel.findById(item2_p1._id);
    expect(updatedItem2P1_reporter.reporter).to.be.null;
    const updatedItem1P2_reporter = await itemModel.findById(item1_p2._id); // This one was reported by userToDelete
    expect(updatedItem1P2_reporter.reporter).to.be.null;

    //    - Items assigned to userToDelete now have assignee as null
    const updatedItem1P1_assignee = await itemModel.findById(item1_p1._id); // Was assigned to userToDelete
    expect(updatedItem1P1_assignee.assignee).to.be.null;
    const updatedItem2P2_assignee = await itemModel.findById(item2_p2._id); // Was assigned to userToDelete
    expect(updatedItem2P2_assignee.assignee).to.be.null;

    //    - Comments authored by userToDelete now have author as null
    const updatedComment1Item1P1 = await commentModel.findById(comment1_item1_p1._id);
    expect(updatedComment1Item1P1.author).to.be.null;
    const updatedComment1Item1P2 = await commentModel.findById(comment1_item1_p2._id);
    expect(updatedComment1Item1P2.author).to.be.null;
  });

  it('should prevent deletion of a user if they are the sole admin and own projects', async () => {
    // 1. Setup: soleAdmin owns a project. No other admin exists.
    //    userToDelete is already an admin in this context (re-create it as the sole admin for this test)

    // Clear previous users to ensure sole admin context
    await db.collection('users').remove({}, { multi: true });

    const soleAdminDetails = { username: 'soleadmin', email: 'soleadmin@example.com', password: 'password123', roles: ['admin'] };
    const soleAdmin = await userModel.create(soleAdminDetails);

    // Log in soleAdmin to perform actions IF NEEDED, but we're deleting this user via another (hypothetical) super admin or system process.
    // For this test, we need an admin token to attempt the deletion.
    // Let's create a temporary second admin to get a token, then delete that second admin,
    // or assume the API allows an admin to delete another admin.
    // The existing adminToken is from 'adminuser'. We'll try to delete 'soleAdmin'.
    // Ensure 'adminuser' is different from 'soleAdmin'.

    // If adminUser (from beforeEach) is different from soleAdmin, its token can be used.
    // Let's ensure adminUser is not soleAdmin. If they are the same, this test logic is flawed.
    // The beforeEach creates 'adminUser'. Let's make sure it's not the one we are testing as sole.
    // Best to create a new admin for the deletion attempt if the global adminUser is the one being deleted.

    // Re-create adminUser to ensure it's distinct and has a token
    await userModel.create({ username: 'tempdeleteradmin', email: 'tempdeleteradmin@example.com', password: 'password123', roles: ['admin'] });
    const tempAdminLoginRes = await chai.request(app).post('/api/auth/login').send({ email: 'tempdeleteradmin@example.com', password: 'password123' });
    const tempAdminToken = tempAdminLoginRes.body.data.tokens.accessToken;

    const projectOwnedBySoleAdmin = await projectModel.create({
      name: 'Project Owned by Sole Admin',
      key: 'SOLEPROJ',
      owner: soleAdmin._id.toString(),
      description: 'This project should prevent sole admin deletion'
    });

    // 2. Attempt to delete soleAdmin
    const res = await chai.request(app)
      .delete(`/api/users/${soleAdmin._id}`)
      .set('Authorization', `Bearer ${tempAdminToken}`); // Use a different admin's token

    // 3. Verify deletion is prevented
    expect(res).to.have.status(400); // As per implementation
    expect(res.body).to.have.property('success', false);
    expect(res.body.message).to.contain('Cannot delete user: This user owns projects and no other admin exists');

    // 4. Verify soleAdmin and their project still exist
    const soleAdminDoc = await userModel.findById(soleAdmin._id);
    expect(soleAdminDoc).to.exist;
    const projectDoc = await projectModel.findById(projectOwnedBySoleAdmin._id);
    expect(projectDoc).to.exist;
    expect(projectDoc.owner.toString()).to.equal(soleAdmin._id.toString());
  });
});
