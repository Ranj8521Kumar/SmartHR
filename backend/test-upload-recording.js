/**
 * Test Script: Upload Interview Recording
 *
 * This script helps you test the interview recording upload functionality.
 *
 * Prerequisites:
 * 1. Backend server must be running (npm run dev)
 * 2. You must have a valid user token (login first)
 * 3. You must have a valid applicationId
 * 4. You must have a video/audio file to upload
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE_URL = 'http://localhost:5000/api/v1';

// Test credentials (change these to your actual credentials)
const TEST_USER = {
  email: 'admin@hrms.com',
  password: 'admin123'
};

// Test data
const TEST_FILE_PATH = path.join(__dirname, 'test-recording.mp4'); // Change to your test file
const TEST_APPLICATION_ID = ''; // You'll need to get this from your database

/**
 * Step 1: Login to get authentication token
 */
async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, TEST_USER);

    if (response.data.success && response.data.token) {
      console.log('✅ Login successful!');
      console.log('Token:', response.data.token.substring(0, 20) + '...');
      return response.data.token;
    } else {
      throw new Error('Login failed: No token received');
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
    throw error;
  }
}

/**
 * Step 2: Get a valid application ID
 */
async function getApplicationId(token) {
  try {
    console.log('\n📋 Fetching applications...');
    const response = await axios.get(`${API_BASE_URL}/applications`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.data.data && response.data.data.length > 0) {
      const appId = response.data.data[0]._id;
      console.log('✅ Found application:', appId);
      console.log('   Applicant:', response.data.data[0].applicant?.firstName, response.data.data[0].applicant?.lastName);
      console.log('   Job:', response.data.data[0].job?.title);
      return appId;
    } else {
      throw new Error('No applications found in database');
    }
  } catch (error) {
    console.error('❌ Failed to get applications:', error.response?.data?.message || error.message);
    throw error;
  }
}

/**
 * Step 3: Upload interview recording
 */
async function uploadRecording(token, applicationId, filePath) {
  try {
    console.log('\n📤 Uploading recording...');

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Test file not found at: ${filePath}`);
      console.log('📝 To test with a real file:');
      console.log('   1. Place a video/audio file in the backend directory');
      console.log('   2. Update TEST_FILE_PATH in this script');
      console.log('   3. Run this script again');
      console.log('\n✨ You can also test using Postman or curl');
      return null;
    }

    // Create form data
    const formData = new FormData();
    formData.append('recording', fs.createReadStream(filePath));
    formData.append('applicationId', applicationId);
    formData.append('interviewType', 'ai_voice');
    formData.append('notes', 'Test recording uploaded via script');
    formData.append('duration', '1800'); // 30 minutes

    const response = await axios.post(
      `${API_BASE_URL}/interview-recordings/upload`,
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          ...formData.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    if (response.data.success) {
      console.log('✅ Recording uploaded successfully!');
      console.log('\n📊 Recording Details:');
      console.log('   ID:', response.data.data._id);
      console.log('   Cloudinary URL:', response.data.data.recordingUrl);
      console.log('   File Name:', response.data.data.fileName);
      console.log('   File Size:', (response.data.data.fileSize / 1024 / 1024).toFixed(2), 'MB');
      console.log('   Status:', response.data.data.status);
      console.log('\n🔗 Access recording at:');
      console.log('   ', response.data.data.recordingUrl);
      return response.data.data;
    }
  } catch (error) {
    console.error('❌ Upload failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('   Details:', error.response.data);
    }
    throw error;
  }
}

/**
 * Step 4: Get all recordings
 */
async function getRecordings(token) {
  try {
    console.log('\n📋 Fetching all recordings...');
    const response = await axios.get(`${API_BASE_URL}/interview-recordings`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    console.log(`✅ Found ${response.data.count} recording(s)`);

    if (response.data.count > 0) {
      console.log('\n📊 Recordings List:');
      response.data.data.forEach((recording, index) => {
        console.log(`\n   ${index + 1}. Recording ID: ${recording._id}`);
        console.log(`      Applicant: ${recording.applicant?.firstName} ${recording.applicant?.lastName}`);
        console.log(`      Job: ${recording.job?.title}`);
        console.log(`      Type: ${recording.interviewType}`);
        console.log(`      Status: ${recording.status}`);
        console.log(`      Cloudinary URL: ${recording.recordingUrl}`);
      });
    }

    return response.data.data;
  } catch (error) {
    console.error('❌ Failed to get recordings:', error.response?.data?.message || error.message);
    throw error;
  }
}

/**
 * Main test function
 */
async function runTest() {
  console.log('🚀 Interview Recording Upload Test\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Login
    const token = await login();

    // Step 2: Get application ID
    let applicationId = TEST_APPLICATION_ID;
    if (!applicationId) {
      applicationId = await getApplicationId(token);
    }

    // Step 3: Upload recording (if file exists)
    if (fs.existsSync(TEST_FILE_PATH)) {
      await uploadRecording(token, applicationId, TEST_FILE_PATH);
    } else {
      console.log('\n⚠️  No test file found. Skipping upload test.');
      console.log('📝 To test upload:');
      console.log('   1. Add a video/audio file to the backend directory');
      console.log('   2. Update TEST_FILE_PATH in this script');
      console.log('   3. Run: node test-upload-recording.js');
    }

    // Step 4: Get all recordings
    await getRecordings(token);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test completed!\n');

    console.log('📝 Next Steps:');
    console.log('   1. Check MongoDB collection: hrms.interviewrecordings');
    console.log('   2. Check Cloudinary: SmartHR/InterviewRecordings folder');
    console.log('   3. Test with Postman for manual uploads');

  } catch (error) {
    console.log('\n' + '='.repeat(60));
    console.log('❌ Test failed!');
    console.log('Error:', error.message);
  }
}

// Alternative: Manual instructions
function showManualInstructions() {
  console.log('\n📖 Manual Upload Instructions (Using Postman):\n');
  console.log('1. Login:');
  console.log('   POST http://localhost:5000/api/v1/auth/login');
  console.log('   Body: { "email": "admin@hrms.com", "password": "admin123" }');
  console.log('   → Copy the token from response\n');

  console.log('2. Get Application ID:');
  console.log('   GET http://localhost:5000/api/v1/applications');
  console.log('   Headers: Authorization: Bearer {token}');
  console.log('   → Copy an application._id from response\n');

  console.log('3. Upload Recording:');
  console.log('   POST http://localhost:5000/api/v1/interview-recordings/upload');
  console.log('   Headers: Authorization: Bearer {token}');
  console.log('   Body (form-data):');
  console.log('     - recording: [Select File]');
  console.log('     - applicationId: [paste application ID]');
  console.log('     - interviewType: ai_voice');
  console.log('     - notes: Test recording\n');

  console.log('4. View Cloudinary URL in response.data.data.recordingUrl');
}

// Check if running directly
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    showManualInstructions();
  } else {
    runTest();
  }
}

module.exports = { login, getApplicationId, uploadRecording, getRecordings };
