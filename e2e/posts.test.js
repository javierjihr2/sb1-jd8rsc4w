describe('Posts Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should display feed screen', async () => {
    await expect(element(by.id('feed-screen'))).toBeVisible();
  });

  it('should create a new post', async () => {
    // Navigate to post composer
    await element(by.id('create-post-button')).tap();
    await expect(element(by.id('post-composer'))).toBeVisible();
    
    // Fill post content
    await element(by.id('post-content-input')).typeText('This is a test post from E2E testing');
    
    // Add tags
    await element(by.id('add-tag-button')).tap();
    await element(by.id('tag-input')).typeText('gaming');
    await element(by.id('confirm-tag-button')).tap();
    
    // Submit post
    await element(by.id('submit-post-button')).tap();
    
    // Verify post appears in feed
    await expect(element(by.text('This is a test post from E2E testing'))).toBeVisible();
  });

  it('should like a post', async () => {
    // Find first post in feed
    await element(by.id('post-card-0')).tap();
    
    // Tap like button
    await element(by.id('like-button')).tap();
    
    // Verify like count increased
    await expect(element(by.id('like-count'))).toHaveText('1');
    
    // Tap like button again to unlike
    await element(by.id('like-button')).tap();
    
    // Verify like count decreased
    await expect(element(by.id('like-count'))).toHaveText('0');
  });

  it('should add a comment', async () => {
    // Open post details
    await element(by.id('post-card-0')).tap();
    
    // Open comments
    await element(by.id('comments-button')).tap();
    await expect(element(by.id('comments-sheet'))).toBeVisible();
    
    // Add comment
    await element(by.id('comment-input')).typeText('Great post!');
    await element(by.id('submit-comment-button')).tap();
    
    // Verify comment appears
    await expect(element(by.text('Great post!'))).toBeVisible();
  });

  it('should bookmark a post', async () => {
    // Find first post
    await element(by.id('post-card-0')).tap();
    
    // Tap bookmark button
    await element(by.id('bookmark-button')).tap();
    
    // Navigate to profile to check bookmarks
    await element(by.id('profile-tab')).tap();
    await element(by.id('bookmarks-section')).tap();
    
    // Verify post is bookmarked
    await expect(element(by.id('bookmarked-post-0'))).toBeVisible();
  });

  it('should search posts by tags', async () => {
    // Open search
    await element(by.id('search-button')).tap();
    
    // Search for gaming tag
    await element(by.id('search-input')).typeText('#gaming');
    await element(by.id('search-submit')).tap();
    
    // Verify filtered results
    await expect(element(by.id('search-results'))).toBeVisible();
    await expect(element(by.text('gaming'))).toBeVisible();
  });
});