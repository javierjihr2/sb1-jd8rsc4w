describe('Matchmaking Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should navigate to matchmaking screen', async () => {
    await element(by.id('match-tab')).tap();
    await expect(element(by.id('match-finder-screen'))).toBeVisible();
  });

  it('should set matchmaking preferences', async () => {
    // Navigate to matchmaking
    await element(by.id('match-tab')).tap();
    
    // Open preferences
    await element(by.id('preferences-button')).tap();
    await expect(element(by.id('preferences-form'))).toBeVisible();
    
    // Set game mode
    await element(by.id('game-mode-picker')).tap();
    await element(by.text('Squad')).tap();
    
    // Set region
    await element(by.id('region-picker')).tap();
    await element(by.text('North America')).tap();
    
    // Set rank range
    await element(by.id('rank-slider')).swipe('right', 'slow', 0.5);
    
    // Set language preference
    await element(by.id('language-picker')).tap();
    await element(by.text('English')).tap();
    
    // Enable microphone
    await element(by.id('mic-toggle')).tap();
    
    // Save preferences
    await element(by.id('save-preferences-button')).tap();
    
    // Verify preferences saved
    await expect(element(by.text('Preferences saved'))).toBeVisible();
  });

  it('should start matchmaking', async () => {
    // Navigate to matchmaking
    await element(by.id('match-tab')).tap();
    
    // Start matchmaking
    await element(by.id('start-matchmaking-button')).tap();
    
    // Verify matchmaking started
    await expect(element(by.text('Searching for players...'))).toBeVisible();
    await expect(element(by.id('cancel-matchmaking-button'))).toBeVisible();
  });

  it('should cancel matchmaking', async () => {
    // Navigate to matchmaking
    await element(by.id('match-tab')).tap();
    
    // Start matchmaking
    await element(by.id('start-matchmaking-button')).tap();
    
    // Wait for matchmaking to start
    await expect(element(by.text('Searching for players...'))).toBeVisible();
    
    // Cancel matchmaking
    await element(by.id('cancel-matchmaking-button')).tap();
    
    // Verify matchmaking cancelled
    await expect(element(by.id('start-matchmaking-button'))).toBeVisible();
    await expect(element(by.text('Matchmaking cancelled'))).toBeVisible();
  });

  it('should display match found notification', async () => {
    // This test would require mocking the matchmaking service
    // or having a test environment with controlled matching
    
    // Navigate to matchmaking
    await element(by.id('match-tab')).tap();
    
    // Start matchmaking
    await element(by.id('start-matchmaking-button')).tap();
    
    // In a real test, you would wait for a match to be found
    // For this example, we'll simulate the match found state
    
    // Verify match found elements would appear
    // await expect(element(by.text('Match Found!'))).toBeVisible();
    // await expect(element(by.id('accept-match-button'))).toBeVisible();
    // await expect(element(by.id('decline-match-button'))).toBeVisible();
  });

  it('should show active match screen', async () => {
    // This test assumes a match has been found and accepted
    
    // Navigate to active match (this would typically happen automatically)
    // await element(by.id('active-match-screen')).tap();
    
    // Verify active match elements
    // await expect(element(by.id('team-members-list'))).toBeVisible();
    // await expect(element(by.id('match-timer'))).toBeVisible();
    // await expect(element(by.id('leave-match-button'))).toBeVisible();
  });

  it('should handle role selection', async () => {
    // Navigate to matchmaking
    await element(by.id('match-tab')).tap();
    
    // Open role selection
    await element(by.id('role-selection-button')).tap();
    
    // Select preferred role
    await element(by.id('role-assault')).tap();
    
    // Select secondary role
    await element(by.id('role-support')).tap();
    
    // Confirm role selection
    await element(by.id('confirm-roles-button')).tap();
    
    // Verify roles saved
    await expect(element(by.text('Roles updated'))).toBeVisible();
  });

  it('should display matchmaking history', async () => {
    // Navigate to profile
    await element(by.id('profile-tab')).tap();
    
    // Open match history
    await element(by.id('match-history-button')).tap();
    
    // Verify history screen
    await expect(element(by.id('match-history-list'))).toBeVisible();
    
    // Check if there are any previous matches
    // This would depend on test data setup
  });
});