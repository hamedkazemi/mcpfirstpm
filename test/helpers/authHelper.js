const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../app'); // Adjust path if app.js is elsewhere relative to helper
const User = require('../../src/models/User'); // Adjust path

chai.use(chaiHttp);

/**
 * Registers a new user and then logs them in.
 * @param {object} userDetails - Object containing username, email, password.
 * @returns {Promise<object>} An object containing { tokens: { accessToken, refreshToken }, userId: string }
 * @throws Will throw an error if registration or login fails.
 */
async function registerAndLoginUser(userDetails) {
  console.log(`[AuthHelper] Attempting to register/login user: ${userDetails.email}`);
  const userInstance = new User();
  let createdUser;
  try {
    createdUser = await userInstance.create(userDetails);
    console.log(`[AuthHelper] User created successfully: ${createdUser.email}, ID: ${createdUser._id}`);
  } catch (error) {
    console.log(`[AuthHelper] Creation failed for ${userDetails.email}, attempting to find. Error: ${error.message}`);
    if (error.message.includes('already exists') || error.message.includes('already taken')) {
      createdUser = await userInstance.findByEmail(userDetails.email);
      if (createdUser) {
        console.log(`[AuthHelper] Found existing user by email: ${createdUser.email}, ID: ${createdUser._id}`);
      } else {
        createdUser = await userInstance.findByUsername(userDetails.username);
        if (createdUser) {
          console.log(`[AuthHelper] Found existing user by username: ${createdUser.username}, ID: ${createdUser._id}`);
        }
      }
      if (!createdUser) {
        console.error(`[AuthHelper] Failed to create or find user for login: ${userDetails.email}. Original error: ${error.message}`);
        throw new Error(`Helper: User creation failed and existing user not found for ${userDetails.email}. Original error: ${error.message}`);
      }
    } else {
      console.error(`[AuthHelper] User creation genuinely failed for ${userDetails.email}`, error);
      throw error;
    }
  }

  if (!createdUser || !createdUser._id) {
    console.error(`[AuthHelper] User ID not found after create/find for ${userDetails.email}. User object:`, createdUser);
    throw new Error(`Helper: User ID not found after create/find for ${userDetails.email}`);
  }

  console.log(`[AuthHelper] Proceeding to login for user: ${createdUser.email}`);
  const loginRes = await chai.request(app)
    .post('/api/auth/login')
    .send({
      email: userDetails.email,
      password: userDetails.password,
    });

  if (loginRes.status !== 200 || !loginRes.body.data || !loginRes.body.data.tokens) {
    console.error(`[AuthHelper] Login failed for ${userDetails.email}. Status: ${loginRes.status}, Body:`, loginRes.body);
    throw new Error(`Helper: Login failed for ${userDetails.email}. Status: ${loginRes.status}`);
  }
  console.log(`[AuthHelper] Login successful for ${createdUser.email}. Token generated.`);
  return { tokens: loginRes.body.data.tokens, userId: createdUser._id.toString() };
}

module.exports = {
  registerAndLoginUser,
};
