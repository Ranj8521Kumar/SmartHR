# TODO: Add Match Details Feature

## Backend Changes
- [ ] Update Application model to include matchedSkills, matchedKeywords, matchedPhrases in aiScore schema
- [ ] Modify aiService.js to calculate and return specific matched skills, keywords, and phrases
- [ ] Update applicationController.js to save matched items when analyzing applications

## Frontend Changes
- [ ] Implement "View Details" button in ViewApplicationsDialog.jsx to open modal showing matched items
- [ ] Create MatchDetailsDialog component to display categorized matched items (skills, keywords, phrases)

## Testing
- [ ] Test the new match details feature by viewing applications and clicking "View Details" button
- [ ] Verify that matched items are accurately displayed and categorized
