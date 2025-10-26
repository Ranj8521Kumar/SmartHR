# Schedule Interview Feature Implementation

## Tasks
- [ ] Add "Schedule Interview" button to ViewApplicationsDialog.jsx
- [ ] Implement interview scheduling functionality with loading states
- [ ] Add dialog/modal to display generated Vapi link for HR to copy
- [ ] Add error handling for interview scheduling
- [ ] Test the functionality

## Implementation Details
- Button should appear next to Approve/Reject buttons
- Use interviewService.scheduleAIInterview() with 30-minute default duration
- Display link in a copyable format with expiration info
- Update application status to 'interview_scheduled'
- Handle loading and error states appropriately
