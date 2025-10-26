# Vapi AI Interview Link Verification Guide

This guide provides HR recruiters with a step-by-step process to verify that Vapi AI interview links are working correctly before sharing them with candidates.

## Prerequisites

### 1. Environment Setup
- Ensure both backend and frontend servers are running:
  ```bash
  # Backend (Terminal 1)
  cd SmartHR/backend
  npm start

  # Frontend (Terminal 2)
  cd SmartHR/frontend
  npm run dev
  ```

### 2. Vapi Configuration
- Verify Vapi API key is configured in backend `.env`:
  ```
  VAPI_API_KEY=your_actual_vapi_api_key_here
  ```
- Ensure `@vapi-ai/web` package is installed in frontend:
  ```bash
  cd SmartHR/frontend
  npm list @vapi-ai/web
  ```

### 3. Browser Permissions
- Allow microphone and camera permissions when prompted
- Use a modern browser (Chrome, Firefox, Safari, Edge)

## Step-by-Step Verification Process

### Step 1: Generate AI Interview Link

1. **Log in as HR Recruiter**
   - Access the SmartHR application
   - Navigate to Applications dashboard
   - Find an application you want to test

2. **Schedule AI Interview**
   - Click on the application
   - Look for "Schedule AI Interview" button
   - Set interview duration (15-120 minutes)
   - Click "Schedule Interview"

3. **Copy the Generated Link**
   - After scheduling, you'll see a success message with the interview link
   - Copy the full URL (e.g., `http://localhost:3000/ai-interview/abc123def456`)

### Step 2: Test Link Accessibility

1. **Open Link in New Browser/Incognito Window**
   - Paste the copied link in a new browser tab or incognito window
   - This simulates how a candidate would access it

2. **Verify Page Loads**
   - Page should load without errors
   - You should see:
     - "AI Video Interview" header
     - Interview details (position, company, duration)
     - "Ready to Start" status badge
     - "Start Interview" button

3. **Check Interview Information**
   - Verify correct job title and company
   - Confirm interview duration matches what was set
   - Ensure expiration date is reasonable (7 days from creation)

### Step 3: Test Vapi Initialization

1. **Click "Start Interview"**
   - Click the "Start Interview" button
   - Grant microphone permissions when prompted

2. **Verify Vapi Loading**
   - Status should change to "In Progress"
   - You should see:
     - Green microphone indicator when speaking
     - "AI Interview in Progress" message
     - Timer starts counting down

3. **Test Audio Interaction**
   - Speak into the microphone
   - AI should respond (you may hear audio or see transcript)
   - Check that transcript appears in the sidebar

### Step 4: Test Interview Controls

1. **Pause/Resume Functionality**
   - Click "Pause" button
   - Status should change to "Paused"
   - Timer should stop
   - Click "Resume" to continue

2. **End Interview**
   - Click "End Interview" button
   - Confirm the action
   - Interview should stop and show completion screen

3. **Submit Results**
   - Add optional feedback in the textarea
   - Click "Submit Results"
   - Should show "Submitted" status

### Step 5: Verify Backend Integration

1. **Check Application Status**
   - Return to HR dashboard
   - Find the test application
   - Status should be "interviewed"
   - Interview should show as "completed"

2. **Verify Interview Data**
   - Click on the application
   - Check interview details:
     - Transcript should be saved
     - Duration should match actual interview time
     - Vapi call ID should be present
     - Any feedback should be recorded

## Troubleshooting Common Issues

### Issue: Link Shows "Interview Not Found"
**Possible Causes:**
- Link expired (check expiration date)
- Interview already completed
- Invalid link format

**Solutions:**
- Generate a new interview link
- Check database for interview status
- Verify link format matches `/ai-interview/{uniqueLink}`

### Issue: "Failed to initialize voice system"
**Possible Causes:**
- Vapi API key not configured
- Network connectivity issues
- Vapi service unavailable

**Solutions:**
- Check `VAPI_API_KEY` in backend `.env`
- Verify internet connection
- Check Vapi dashboard for service status

### Issue: No Audio/Video Response
**Possible Causes:**
- Microphone permissions denied
- Browser compatibility issues
- Vapi assistant configuration problems

**Solutions:**
- Grant microphone permissions
- Try different browser
- Check Vapi assistant ID in code (default: `5966f84b-85ec-47ca-b294-9b1ca366ac2f`)

### Issue: Transcript Not Appearing
**Possible Causes:**
- Vapi transcription service issues
- Network interruptions
- Browser console errors

**Solutions:**
- Check browser console for errors
- Verify stable internet connection
- Test with different network

### Issue: Interview Results Not Saved
**Possible Causes:**
- Backend API errors
- Database connection issues
- Authentication problems

**Solutions:**
- Check backend server logs
- Verify database connection
- Ensure HR user has proper permissions

## Advanced Testing

### API Endpoint Testing

Test backend endpoints directly:

```bash
# Get interview by link (public endpoint)
curl http://localhost:5000/api/v1/applications/public/ai-interview/{uniqueLink}

# Get Vapi config
curl -H "Authorization: Bearer {token}" http://localhost:5000/api/v1/applications/{applicationId}/vapi-config
```

### Browser Console Debugging

1. Open browser developer tools (F12)
2. Check Console tab for errors
3. Look for Vapi-related messages:
   - "Vapi initialized successfully"
   - "Call started"
   - "Message received"

### Network Tab Analysis

1. Open Network tab in developer tools
2. Start interview and monitor requests
3. Verify API calls to:
   - `/api/v1/applications/public/ai-interview/{link}`
   - `/api/v1/applications/{id}/vapi-config`

## Best Practices

### Before Sharing Links
- Always test the complete flow yourself first
- Verify all prerequisites are met
- Check that Vapi credits are available
- Ensure candidate has good internet connection

### During Testing
- Use headphones to avoid audio feedback loops
- Test in the same environment candidates will use
- Document any issues encountered
- Keep test interviews separate from real candidates

### After Testing
- Clean up test data if necessary
- Document successful verification
- Update any configuration issues found
- Share working links with candidates

## Support

If you encounter persistent issues:

1. Check the TODO files:
   - `SmartHR/TODO_vapi_integration.md`
   - `SmartHR/backend/TODO_ai_interview.md`

2. Review server logs for error details

3. Verify all dependencies are installed:
   ```bash
   cd SmartHR/frontend && npm install
   cd ../backend && npm install
   ```

4. Ensure environment variables are set correctly

This guide ensures HR can confidently verify Vapi AI interview links before distributing them to candidates, minimizing technical issues during the actual interview process.
