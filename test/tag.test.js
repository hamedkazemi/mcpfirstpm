process.env.NODE_ENV = 'test'; // Set NODE_ENV to 'test' AT THE VERY TOP

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app'); // Main application instance
const { db, ObjectID } = require('../src/config/database'); // For direct DB access & ObjectID
const { registerAndLoginUser } = require('./helpers/authHelper'); // Auth helper
const User = require('../src/models/User');
const Project = require('../src/models/Project');
const Tag = require('../src/models/Tag');

chai.use(chaiHttp);
const expect = chai.expect;

// Define default tags as per Tag model's createDefaultTags (assuming these names)
const DEFAULT_TAG_NAMES = ['bug', 'feature', 'enhancement', 'ui', 'ux', 'backend', 'frontend', 'epic'];

describe('Tag Routes', function() {
  this.timeout(5000);

  let ownerUser, ownerToken;
  let memberUser, memberToken;
  let nonMemberUser, nonMemberToken;
  let testProject;

  const userInstance = new User();
  const projectInstance = new Project();
  const tagInstance = new Tag();

  beforeEach(async () => {
    try {
      await db.collection('users').remove({}, { multi: true });
      await db.collection('projects').remove({}, { multi: true });
      await db.collection('tags').remove({}, { multi: true });
    } catch (error) {
      console.error('Error clearing collections:', error);
    }

    const ownerDetails = { username: 'tagowner', email: 'tagowner@example.com', password: 'password123' };
    const ownerAuth = await registerAndLoginUser(ownerDetails);
    ownerToken = ownerAuth.tokens.accessToken;
    ownerUser = await userInstance.findById(ownerAuth.userId);

    const memberDetails = { username: 'tagmember', email: 'tagmember@example.com', password: 'password123' };
    const memberAuth = await registerAndLoginUser(memberDetails);
    memberToken = memberAuth.tokens.accessToken;
    memberUser = await userInstance.findById(memberAuth.userId);

    const nonMemberDetails = { username: 'tagnonmember', email: 'tagnonmember@example.com', password: 'password123' };
    const nonMemberAuth = await registerAndLoginUser(nonMemberDetails);
    nonMemberToken = nonMemberAuth.tokens.accessToken;
    nonMemberUser = await userInstance.findById(nonMemberAuth.userId);

    // Create a project - this should also create default tags
    const projectData = { name: 'Tag Test Project', key: 'TAGKEY', owner: ownerUser._id.toString() };
    testProject = await projectInstance.create(projectData); // createDefaultTags is called within Project.create

    // Add memberUser to the project
    await projectInstance.addMember(testProject._id.toString(), memberUser._id.toString(), 'viewer');
    testProject = await projectInstance.findById(testProject._id.toString()); // Refresh project
  });

  describe('GET /api/projects/:projectId/tags (Get project tags)', () => {
    it('should get default tags for a project with no custom tags (as owner)', async () => {
      const res = await chai.request(app)
        .get(`/api/projects/${testProject._id}/tags`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.be.an('array');
      expect(res.body.data.length).to.equal(DEFAULT_TAG_NAMES.length);
      const returnedTagNames = res.body.data.map(tag => tag.name);
      expect(returnedTagNames).to.have.members(DEFAULT_TAG_NAMES);
    });

    it('should get default tags for a project with no custom tags (as member)', async () => {
      const res = await chai.request(app)
        .get(`/api/projects/${testProject._id}/tags`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res).to.have.status(200);
      expect(res.body.data).to.be.an('array');
      expect(res.body.data.length).to.equal(DEFAULT_TAG_NAMES.length);
    });

    it('should get default and custom tags for a project (as owner)', async () => {
      const customTagData = { name: 'Custom Tag Alpha', projectId: testProject._id.toString(), color: '#123456' };
      await tagInstance.create(customTagData);

      const res = await chai.request(app)
        .get(`/api/projects/${testProject._id}/tags`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res).to.have.status(200);
      expect(res.body.data).to.be.an('array');
      expect(res.body.data.length).to.equal(DEFAULT_TAG_NAMES.length + 1);
      const returnedTagNames = res.body.data.map(tag => tag.name);
      expect(returnedTagNames).to.include(customTagData.name);
      DEFAULT_TAG_NAMES.forEach(defaultName => {
        expect(returnedTagNames).to.include(defaultName);
      });
    });

    it('should return 404 if getting tags for a non-existent project', async () => {
      const nonExistentProjectId = new ObjectID().toString();
      const res = await chai.request(app)
        .get(`/api/projects/${nonExistentProjectId}/tags`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res).to.have.status(404);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Project not found'); // From requireProjectAccess
    });

    it('should return 401 if trying to get tags without authentication', async () => {
      const res = await chai.request(app)
        .get(`/api/projects/${testProject._id}/tags`);

      expect(res).to.have.status(401);
    });

    it('should return 403 if user does not have project access for tags', async () => {
      const res = await chai.request(app)
        .get(`/api/projects/${testProject._id}/tags`)
        .set('Authorization', `Bearer ${nonMemberToken}`);

      expect(res).to.have.status(403);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Access denied to this project'); // From requireProjectAccess
    });
  });

  describe('POST /api/projects/:projectId/tags (Create new tag)', () => {
    const validTagData = {
      name: 'My Custom Tag',
      color: '#A1B2C3'
    };

    it('should successfully create a new tag as project owner', async () => {
      const res = await chai.request(app)
        .post(`/api/projects/${testProject._id}/tags`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(validTagData);

      expect(res).to.have.status(201);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('tag');
      const createdTag = res.body.data.tag;
      expect(createdTag.name).to.equal(validTagData.name);
      expect(createdTag.color).to.equal(validTagData.color);
      expect(createdTag.projectId.toString()).to.equal(testProject._id.toString());

      // Verify in DB
      const dbTag = await tagInstance.findById(createdTag._id);
      expect(dbTag).to.not.be.null;
      expect(dbTag.name).to.equal(validTagData.name);
      expect(dbTag.projectId.toString()).to.equal(testProject._id.toString());
    });

    it('should successfully create a new tag as project member', async () => {
      const memberTagData = { name: 'Member Tag', color: '#3C3C3C' };
      const res = await chai.request(app)
        .post(`/api/projects/${testProject._id}/tags`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send(memberTagData);

      expect(res).to.have.status(201);
      expect(res.body.data.tag.name).to.equal(memberTagData.name);
      expect(res.body.data.tag.projectId.toString()).to.equal(testProject._id.toString());
    });

    it('should return 400 if creating a tag with missing name', async () => {
      const res = await chai.request(app)
        .post(`/api/projects/${testProject._id}/tags`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ color: '#121212' }); // Name is missing

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Validation error');
      expect(res.body.errors[0]).to.contain('"name" is required');
    });

    it('should return 400 if creating a tag with empty name string', async () => {
      const res = await chai.request(app)
        .post(`/api/projects/${testProject._id}/tags`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: '', color: '#121212' });

      expect(res).to.have.status(400);
      expect(res.body.errors[0]).to.contain('"name" is not allowed to be empty');
    });

    it('should return 409 if creating a duplicate tag (same name, same project)', async () => {
      // First, create the tag
      await tagInstance.create({ ...validTagData, projectId: testProject._id.toString() });

      // Then, attempt to create it again
      const res = await chai.request(app)
        .post(`/api/projects/${testProject._id}/tags`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(validTagData);

      expect(res).to.have.status(409);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Tag with this name already exists for this project');
    });

    it('should allow creating tags with the same name in different projects', async () => {
        // Create another project for ownerUser
        const otherProjectData = { name: 'Tag Other Project', key: 'TAGOTHER', owner: ownerUser._id.toString() };
        const otherProject = await projectInstance.create(otherProjectData);

        // Create tag in the first project
        await chai.request(app)
            .post(`/api/projects/${testProject._id}/tags`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send(validTagData);

        // Attempt to create tag with same name in the other project
        const res = await chai.request(app)
            .post(`/api/projects/${otherProject._id}/tags`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send(validTagData);

        expect(res).to.have.status(201); // Should be successful
        expect(res.body.data.tag.name).to.equal(validTagData.name);
        expect(res.body.data.tag.projectId.toString()).to.equal(otherProject._id.toString());
    });


    it('should return 404 if creating a tag in a non-existent project', async () => {
      const nonExistentProjectId = new ObjectID().toString();
      const res = await chai.request(app)
        .post(`/api/projects/${nonExistentProjectId}/tags`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(validTagData);

      expect(res).to.have.status(404);
      expect(res.body).to.have.property('message', 'Project not found'); // From requireProjectAccess
    });

    it('should return 401 if trying to create a tag without authentication', async () => {
      const res = await chai.request(app)
        .post(`/api/projects/${testProject._id}/tags`)
        .send(validTagData);

      expect(res).to.have.status(401);
    });

    it('should return 403 if user does not have project access when creating a tag', async () => {
      const res = await chai.request(app)
        .post(`/api/projects/${testProject._id}/tags`)
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .send(validTagData);

      expect(res).to.have.status(403);
      expect(res.body).to.have.property('message', 'Access denied to this project'); // From requireProjectAccess
    });
  });

  describe('PUT /api/tags/:tagId (Update tag)', () => {
    let tagToUpdate;
    let existingTagForConflictTest;
    let anotherProject; // For permission testing with nonMemberUser
    let tagInAnotherProject;

    beforeEach(async () => {
      // Create tag to be updated in testProject
      tagToUpdate = await tagInstance.create({
        name: 'Tag Before Update',
        color: '#OLDCLR',
        projectId: testProject._id.toString()
      });

      // Create another tag in testProject for conflict testing
      existingTagForConflictTest = await tagInstance.create({
        name: 'Existing Name',
        color: '#EXIST',
        projectId: testProject._id.toString()
      });

      // Create another project and a tag in it (owned by ownerUser for simplicity here)
      // This helps ensure that nonMemberUser's lack of access to testProject is what's tested,
      // not their lack of owning any projects/tags at all.
      const anotherProjectData = { name: 'Another Tag Project', key: 'OTAGKEY', owner: ownerUser._id.toString() };
      anotherProject = await projectInstance.create(anotherProjectData); // This will also create default tags for it
      tagInAnotherProject = await tagInstance.create({
        name: 'Tag in Other Proj',
        color: '#OTHER',
        projectId: anotherProject._id.toString()
      });
    });

    it('should successfully update a tag name and color by a project member', async () => {
      const updates = {
        name: 'Tag After Update',
        color: '#NEWCLR'
      };
      const res = await chai.request(app)
        .put(`/api/tags/${tagToUpdate._id}`)
        .set('Authorization', `Bearer ${memberToken}`) // memberUser has access to testProject
        .send(updates);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      const updatedTag = res.body.data.tag;
      expect(updatedTag.name).to.equal(updates.name);
      expect(updatedTag.color).to.equal(updates.color);
      expect(updatedTag.projectId.toString()).to.equal(testProject._id.toString());

      const dbTag = await tagInstance.findById(tagToUpdate._id);
      expect(dbTag.name).to.equal(updates.name);
      expect(dbTag.color).to.equal(updates.color);
    });

    it('should return 400 if updating a tag with an empty name', async () => {
      const updates = { name: '' };
      const res = await chai.request(app)
        .put(`/api/tags/${tagToUpdate._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updates);

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Validation error');
      expect(res.body.errors[0]).to.contain('"name" is not allowed to be empty');
    });

    it('should return 409 if updating a tag name to a duplicate within the same project', async () => {
      const updates = { name: existingTagForConflictTest.name }; // Try to use existing name
      const res = await chai.request(app)
        .put(`/api/tags/${tagToUpdate._id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updates);

      expect(res).to.have.status(409);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Tag with this name already exists for this project');
    });

    it('should allow updating color without changing name, even if name exists elsewhere (no conflict)', async () => {
        // This test ensures that if only color is updated, the duplicate name check for the *same* name is not triggered incorrectly.
        // Here, we update tagToUpdate's color, its name is 'Tag Before Update'.
        // existingTagForConflictTest has name 'Existing Name'. No conflict.
        const updates = { color: '#NEWCOLORONLY' };
        const res = await chai.request(app)
            .put(`/api/tags/${tagToUpdate._id}`)
            .set('Authorization', `Bearer ${ownerToken}`)
            .send(updates);

        expect(res).to.have.status(200);
        expect(res.body.data.tag.color).to.equal(updates.color);
        expect(res.body.data.tag.name).to.equal(tagToUpdate.name); // Name should be unchanged
    });


    it('should return 404 if updating a non-existent tag', async () => {
      const nonExistentTagId = new ObjectID().toString();
      const res = await chai.request(app)
        .put(`/api/tags/${nonExistentTagId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Update NonExistent' });

      expect(res).to.have.status(404);
      // Message from requireTagProjectAccess if tag not found by middleware
      expect(res.body).to.have.property('message', 'Tag not found');
    });

    it('should return 401 if trying to update a tag without authentication', async () => {
      const res = await chai.request(app)
        .put(`/api/tags/${tagToUpdate._id}`)
        .send({ name: 'Update No Auth' });

      expect(res).to.have.status(401);
    });

    it('should return 403 if user does not have project access for the tag being updated', async () => {
      // nonMemberUser tries to update tagToUpdate, which is in testProject. nonMemberUser is not in testProject.
      const res = await chai.request(app)
        .put(`/api/tags/${tagToUpdate._id}`)
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .send({ name: 'Update By NonProjectMember' });

      expect(res).to.have.status(403);
      expect(res.body).to.have.property('success', false);
      // Message from requireTagProjectAccess
      expect(res.body).to.have.property('message', 'Access denied to this tag\'s project');
    });
  });

  describe('DELETE /api/tags/:tagId (Delete tag)', () => {
    let tagToDelete;
    let tagInUse;
    let testItemForTagging;

    beforeEach(async () => {
      // A regular tag, not yet used
      tagToDelete = await tagInstance.create({
        name: 'Tag For Deletion',
        color: '#DELCLR',
        projectId: testProject._id.toString()
      });

      // A tag that will be marked as "in use"
      tagInUse = await tagInstance.create({
        name: 'Tag In Use',
        color: '#USECLR',
        projectId: testProject._id.toString(),
        // Manually set itemCount to simulate it being used, as controller checks this property
        itemCount: 1
      });

      // Create an item (though for this controller's check, only itemCount on tag matters)
      // For a more integrated test, one would add tagInUse._id to this item's tags array
      // and have a mechanism that updates tag.itemCount.
      testItemForTagging = await itemInstance.create({
          title: 'Item using a tag',
          type: 'task',
          projectId: testProject._id.toString(),
          createdBy: ownerUser._id.toString(),
          tags: [tagInUse._id.toString()] // Link item to tag
      });
      // Note: The current Tag controller's deleteTag checks `req.tag.itemCount > 0`.
      // It does not dynamically count items using the tag at deletion time.
      // So, ensuring `tagInUse.itemCount` is > 0 is the key for the "in-use" test.
      // The above direct setting of `itemCount:1` handles this for the test.
    });

    it('should successfully delete a tag by a project member (tag not in use)', async () => {
      const res = await chai.request(app)
        .delete(`/api/tags/${tagToDelete._id}`)
        .set('Authorization', `Bearer ${memberToken}`); // memberUser has access

      expect(res).to.have.status(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('message', 'Tag deleted successfully');

      const dbTag = await tagInstance.findById(tagToDelete._id);
      expect(dbTag).to.be.null;
    });

    it('should return 400 if attempting to delete a tag that is in use (itemCount > 0)', async () => {
      const res = await chai.request(app)
        .delete(`/api/tags/${tagInUse._id}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res).to.have.status(400);
      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('message', 'Cannot delete tag that is currently in use by items.');
    });

    it('should return 404 if deleting a non-existent tag', async () => {
      const nonExistentTagId = new ObjectID().toString();
      const res = await chai.request(app)
        .delete(`/api/tags/${nonExistentTagId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res).to.have.status(404);
      // This message comes from requireTagProjectAccess if tag not found by middleware
      expect(res.body).to.have.property('message', 'Tag not found');
    });

    it('should return 401 if trying to delete a tag without authentication', async () => {
      const res = await chai.request(app)
        .delete(`/api/tags/${tagToDelete._id}`);

      expect(res).to.have.status(401);
    });

    it('should return 403 if user does not have project access when deleting a tag', async () => {
      // nonMemberUser tries to delete tagToDelete from testProject
      const res = await chai.request(app)
        .delete(`/api/tags/${tagToDelete._id}`)
        .set('Authorization', `Bearer ${nonMemberToken}`);

      expect(res).to.have.status(403);
      expect(res.body).to.have.property('success', false);
      // Message from requireTagProjectAccess
      expect(res.body).to.have.property('message', 'Access denied to this tag\'s project');
    });
  });
});
