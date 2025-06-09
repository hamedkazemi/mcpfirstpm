process.env.NODE_ENV = 'test'; // Set NODE_ENV to 'test' AT THE VERY TOP

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app'); // Main application instance
const { db, ObjectID } = require('../src/config/database'); // For direct DB access & ObjectID
const { registerAndLoginUser } = require('./helpers/authHelper'); // Auth helper
const User = require('../src/models/User');
const Project = require('../src/models/Project');
const Item = require('../src/models/Item');
const Comment = require('../src/models/Comment');

chai.use(chaiHttp);
const expect = chai.expect;

describe('Comment Routes', function() {
  this.timeout(5000); // Increase timeout for this suite

  let ownerUser, ownerToken;
  let memberUser, memberToken;
  let nonMemberUser, nonMemberToken;
  let testProject;
  let testItem;

  const userInstance = new User();
  const projectInstance = new Project();
  const itemInstance = new Item();
  const commentInstance = new Comment();

  beforeEach(async () => {
    // Clear relevant collections before each test
    try {
      await db.collection('users').remove({}, { multi: true });
      await db.collection('projects').remove({}, { multi: true });
      await db.collection('items').remove({}, { multi: true });
      await db.collection('comments').remove({}, { multi: true });
    } catch (error) {
      console.error('Error clearing collections:', error);
    }

    // Create users
    const ownerDetails = { username: 'commentowner', email: 'commentowner@example.com', password: 'password123' };
    const ownerAuth = await registerAndLoginUser(ownerDetails);
    ownerToken = ownerAuth.tokens.accessToken;
    ownerUser = await userInstance.findById(ownerAuth.userId);

    const memberDetails = { username: 'commentmember', email: 'commentmember@example.com', password: 'password123' };
    const memberAuth = await registerAndLoginUser(memberDetails);
    memberToken = memberAuth.tokens.accessToken;
    memberUser = await userInstance.findById(memberAuth.userId);

    const nonMemberDetails = { username: 'commentnonmember', email: 'commentnonmember@example.com', password: 'password123' };
    const nonMemberAuth = await registerAndLoginUser(nonMemberDetails);
    nonMemberToken = nonMemberAuth.tokens.accessToken;
    nonMemberUser = await userInstance.findById(nonMemberAuth.userId);

    // Create a project
    const projectData = {
      name: 'Comment Test Project',
      key: 'COMMKEY',
      owner: ownerUser._id.toString(),
      description: 'Project for testing comment APIs'
    };
    testProject = await projectInstance.create(projectData);

    // Add memberUser to the project
    await projectInstance.addMember(testProject._id.toString(), memberUser._id.toString(), 'editor');
    testProject = await projectInstance.findById(testProject._id.toString()); // Refresh project

    // Create an item within the project
    const itemData = {
      title: 'Item for Comments',
      type: 'task',
      projectId: testProject._id.toString(),
      createdBy: ownerUser._id.toString(),
    };
    testItem = await itemInstance.create(itemData);
  });

  describe('GET /api/items/:itemId/comments (Get item comments)', () => {
    it('should successfully get an empty array of comments for an item with no comments (as owner)', async () => {
      const res = await chai.request(app)
        .get(`/api/items/${testItem._id}/comments`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.be.an('array').with.lengthOf(0);
      expect(res.body).to.have.property('pagination');
      expect(res.body.pagination.totalItems).to.equal(0);
    });

    it('should successfully get an empty array of comments (as member)', async () => {
      const res = await chai.request(app)
        .get(`/api/items/${testItem._id}/comments`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res).to.have.status(200);
      expect(res.body.data).to.be.an('array').with.lengthOf(0);
    });

    it('should successfully get comments for an item with existing comments (as owner), ordered by createdAt ascending', async () => {
      // Create comments
      const comment1 = await commentInstance.create({ itemId: testItem._id, authorId: ownerUser._id, text: 'First comment' });
      // Introduce a slight delay to ensure different createdAt timestamps if system is too fast
      await new Promise(resolve => setTimeout(resolve, 10));
      const comment2 = await commentInstance.create({ itemId: testItem._id, authorId: memberUser._id, text: 'Second comment' });

      const res = await chai.request(app)
        .get(`/api/items/${testItem._id}/comments`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res).to.have.status(200);
      expect(res.body.data).to.be.an('array').with.lengthOf(2);
      expect(res.body.pagination.totalItems).to.equal(2);

      // Check order (createdAt ascending)
      expect(res.body.data[0].text).to.equal(comment1.text);
      expect(res.body.data[0].authorId.username).to.equal(ownerUser.username); // authorId is populated
      expect(res.body.data[1].text).to.equal(comment2.text);
      expect(res.body.data[1].authorId.username).to.equal(memberUser.username);
    });

    it('should return 404 if trying to get comments for a non-existent item', async () => {
      const nonExistentItemId = new ObjectID().toString();
      const res = await chai.request(app)
        .get(`/api/items/${nonExistentItemId}/comments`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res).to.have.status(404);
      expect(res.body).to.have.property('success', false);
      // This message comes from itemController.getItemComments's item check, or requireItemAccess
      expect(res.body).to.have.property('message', 'Item not found');
    });

    it('should return 401 if trying to get comments without authentication', async () => {
      const res = await chai.request(app)
        .get(`/api/items/${testItem._id}/comments`);

      expect(res).to.have.status(401);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Access token required');
    });

    it('should return 403 if user does not have project access for the item\'s comments', async () => {
      const res = await chai.request(app)
        .get(`/api/items/${testItem._id}/comments`)
        .set('Authorization', `Bearer ${nonMemberToken}`); // nonMemberUser is not part of testProject

      expect(res).to.have.status(403);
      expect(res.body).to.have.property('success', false);
      // This message comes from requireItemAccess middleware
      expect(res.body).to.have.property('message', 'Access denied to this item\'s project');
    });
  });

  describe('POST /api/items/:itemId/comments (Create new comment)', () => {
    const commentData = {
      text: 'This is a test comment.'
    };

    it('should successfully create a comment as project owner', async () => {
      const res = await chai.request(app)
        .post(`/api/items/${testItem._id}/comments`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(commentData);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('comment');
      const createdComment = res.body.data.comment;
      expect(createdComment.text).to.equal(commentData.text);
      expect(createdComment.itemId.toString()).to.equal(testItem._id.toString());
      expect(createdComment.authorId._id.toString()).to.equal(ownerUser._id.toString()); // authorId is populated
      expect(createdComment.authorId.username).to.equal(ownerUser.username);

      // Verify in DB
      const dbComment = await commentInstance.findById(createdComment._id);
      expect(dbComment).to.not.be.null;
      expect(dbComment.text).to.equal(commentData.text);
      expect(dbComment.itemId.toString()).to.equal(testItem._id.toString());
      expect(dbComment.authorId.toString()).to.equal(ownerUser._id.toString());
    });

    it('should successfully create a comment as project member', async () => {
      const memberCommentData = { text: 'Member comment here.' };
      const res = await chai.request(app)
        .post(`/api/items/${testItem._id}/comments`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send(memberCommentData);

      expect(res).to.have.status(201);
      const createdComment = res.body.data.comment;
      expect(createdComment.text).to.equal(memberCommentData.text);
      expect(createdComment.authorId._id.toString()).to.equal(memberUser._id.toString());
      expect(createdComment.authorId.username).to.equal(memberUser.username);

      const dbComment = await commentInstance.findById(createdComment._id);
      expect(dbComment.authorId.toString()).to.equal(memberUser._id.toString());
    });

    it('should return 400 if creating a comment with missing text', async () => {
      const res = await chai.request(app)
        .post(`/api/items/${testItem._id}/comments`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ text: '' }); // Empty text

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Validation error');
      // Assuming Joi validation in Comment model for 'text' field
      expect(res.body.errors[0]).to.contain('"text" is not allowed to be empty');
    });

    it('should return 400 if creating a comment with no text field', async () => {
      const res = await chai.request(app)
        .post(`/api/items/${testItem._id}/comments`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({}); // No text field

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Validation error');
      expect(res.body.errors[0]).to.contain('"text" is required');
    });

    it('should return 404 if creating a comment on a non-existent item', async () => {
      const nonExistentItemId = new ObjectID().toString();
      const res = await chai.request(app)
        .post(`/api/items/${nonExistentItemId}/comments`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(commentData);

      expect(res).to.have.status(404);
      expect(res.body).to.have.property('success', false);
      // This message comes from commentController's item check, or requireItemAccess if item not found by it
      expect(res.body).to.have.property('message', 'Item not found');
    });

    it('should return 401 if trying to create a comment without authentication', async () => {
      const res = await chai.request(app)
        .post(`/api/items/${testItem._id}/comments`)
        .send(commentData);

      expect(res).to.have.status(401);
    });

    it('should return 403 if user does not have project access when creating a comment', async () => {
      const res = await chai.request(app)
        .post(`/api/items/${testItem._id}/comments`)
        .set('Authorization', `Bearer ${nonMemberToken}`) // nonMemberUser is not part of testProject
        .send(commentData);

      expect(res).to.have.status(403);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Access denied to this item\'s project'); // From requireItemAccess
    });
  });

  describe('PUT /api/comments/:commentId (Update comment)', () => {
    let testComment; // Comment created by ownerUser on testItem

    beforeEach(async () => {
      // Create a comment by ownerUser to be updated in tests
      const commentContent = {
        itemId: testItem._id.toString(),
        authorId: ownerUser._id.toString(),
        text: 'Original comment text by owner.'
      };
      testComment = await commentInstance.create(commentContent);
    });

    it('should successfully update a comment by its author', async () => {
      const updatedText = 'This comment has been updated by the author.';
      const res = await chai.request(app)
        .put(`/api/comments/${testComment._id}`)
        .set('Authorization', `Bearer ${ownerToken}`) // ownerUser is the author
        .send({ text: updatedText });

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      const updatedComment = res.body.data.comment;
      expect(updatedComment.text).to.equal(updatedText);
      expect(updatedComment.authorId._id.toString()).to.equal(ownerUser._id.toString());
      expect(updatedComment.isEdited).to.equal(true); // Assuming model sets this

      // Verify in DB
      const dbComment = await commentInstance.findById(testComment._id);
      expect(dbComment.text).to.equal(updatedText);
      expect(dbComment.isEdited).to.equal(true);
    });

    it('should return 400 if updating a comment with empty text', async () => {
      const res = await chai.request(app)
        .put(`/api/comments/${testComment._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ text: '' }); // Empty text

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Validation error');
      expect(res.body.errors[0]).to.contain('"text" is not allowed to be empty');
    });

    it('should return 404 if trying to update a non-existent comment', async () => {
      const nonExistentCommentId = new ObjectID().toString();
      const res = await chai.request(app)
        .put(`/api/comments/${nonExistentCommentId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ text: 'Trying to update non-existent comment.' });

      expect(res).to.have.status(404);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Comment not found');
    });

    it('should return 401 if trying to update a comment without authentication', async () => {
      const res = await chai.request(app)
        .put(`/api/comments/${testComment._id}`)
        .send({ text: 'Update attempt without auth.' });

      expect(res).to.have.status(401);
    });

    it('should return 403 if a user tries to update a comment they did not author (even if project member)', async () => {
      const res = await chai.request(app)
        .put(`/api/comments/${testComment._id}`) // testComment was authored by ownerUser
        .set('Authorization', `Bearer ${memberToken}`) // memberUser is not the author
        .send({ text: 'Attempted update by non-author project member.' });

      expect(res).to.have.status(403);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'You can only update your own comments');
    });

    it('should return 403 if a user tries to update a comment they did not author (user not in project)', async () => {
      // nonMemberUser is authenticated but not part of the project, and not the author.
      // The primary check here is authorship.
      const res = await chai.request(app)
        .put(`/api/comments/${testComment._id}`) // testComment was authored by ownerUser
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .send({ text: 'Attempted update by non-author, non-project member.' });

      expect(res).to.have.status(403);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'You can only update your own comments');
    });
  });

  describe('DELETE /api/comments/:commentId (Delete comment)', () => {
    let commentByOwner;
    let commentByMember;

    beforeEach(async () => {
      // Comment by ownerUser on testItem
      const ownerCommentData = { itemId: testItem._id, authorId: ownerUser._id, text: 'Owner\'s comment for deletion tests.' };
      commentByOwner = await commentInstance.create(ownerCommentData);

      // Comment by memberUser on testItem
      const memberCommentData = { itemId: testItem._id, authorId: memberUser._id, text: 'Member\'s comment for deletion tests.' };
      commentByMember = await commentInstance.create(memberCommentData);
    });

    it('should successfully delete a comment by its author', async () => {
      const res = await chai.request(app)
        .delete(`/api/comments/${commentByOwner._id}`)
        .set('Authorization', `Bearer ${ownerToken}`); // ownerUser is the author

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('message', 'Comment deleted successfully');

      const dbComment = await commentInstance.findById(commentByOwner._id);
      expect(dbComment).to.be.null;
    });

    it('should successfully delete a comment by project owner (not author)', async () => {
      // ownerUser is the owner of testProject, where testItem (and commentByMember) exists.
      const res = await chai.request(app)
        .delete(`/api/comments/${commentByMember._id}`) // commentByMember was authored by memberUser
        .set('Authorization', `Bearer ${ownerToken}`); // ownerUser is project owner

      expect(res).to.have.status(200);
      expect(res.body.message).to.equal('Comment deleted successfully');
      const dbComment = await commentInstance.findById(commentByMember._id);
      expect(dbComment).to.be.null;
    });

    it('should successfully delete a comment by an admin (not author, not project owner)', async () => {
      // Make nonMemberUser an admin for this test
      await userInstance.update(nonMemberUser._id, { role: 'admin' });
      // nonMemberUser is now an admin, but not the author of commentByOwner, nor owner of testProject.

      const res = await chai.request(app)
        .delete(`/api/comments/${commentByOwner._id}`) // commentByOwner authored by ownerUser
        .set('Authorization', `Bearer ${nonMemberToken}`); // nonMemberToken is for nonMemberUser (now admin)

      expect(res).to.have.status(200);
      expect(res.body.message).to.equal('Comment deleted successfully');
      const dbComment = await commentInstance.findById(commentByOwner._id);
      expect(dbComment).to.be.null;

      // Clean up: revert nonMemberUser's role if necessary for other tests, though beforeEach will reset users.
      // await userInstance.update(nonMemberUser._id, { role: 'user' }); // Or original role
    });


    it('should return 404 if deleting a non-existent comment', async () => {
      const nonExistentCommentId = new ObjectID().toString();
      const res = await chai.request(app)
        .delete(`/api/comments/${nonExistentCommentId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res).to.have.status(404);
      expect(res.body.message).to.equal('Comment not found');
    });

    it('should return 401 if trying to delete a comment without authentication', async () => {
      const res = await chai.request(app)
        .delete(`/api/comments/${commentByOwner._id}`);

      expect(res).to.have.status(401);
    });

    it('should return 403 if a user (project member, not owner/admin) tries to delete a comment they did not author', async () => {
      // memberUser tries to delete commentByOwner. memberUser is not author, not project owner, not admin.
      const res = await chai.request(app)
        .delete(`/api/comments/${commentByOwner._id}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res).to.have.status(403);
      expect(res.body.message).to.equal('You are not authorized to delete this comment');
    });

    it('should return 403 if an authenticated user (not project member, not author, not admin) tries to delete a comment', async () => {
      // Create a new user who is not part of the project and not an admin
      const outsiderDetails = { username: 'outsiderdeleter', email: 'outsiderdel@example.com', password: 'password123' };
      const outsiderAuth = await registerAndLoginUser(outsiderDetails);
      // This user (outsiderAuth.tokens.accessToken) attempts to delete commentByOwner.
      // They are not author, not project owner, not admin.
      const res = await chai.request(app)
        .delete(`/api/comments/${commentByOwner._id}`)
        .set('Authorization', `Bearer ${outsiderAuth.tokens.accessToken}`);

      expect(res).to.have.status(403);
      expect(res.body.message).to.equal('You are not authorized to delete this comment');
    });
  });
});
