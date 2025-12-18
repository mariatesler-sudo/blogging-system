// frontend/__tests__/switchSearchTab.test.js
/**
 * @jest-environment jsdom
 */

const switchSearchTab = (tabName) => {
  const tabPosts = document.getElementById('tab-posts');
  const tabUsers = document.getElementById('tab-users');
  if (tabPosts) tabPosts.classList.toggle('active', tabName === 'posts');
  if (tabUsers) tabUsers.classList.toggle('active', tabName === 'users');

  const postsRes = document.getElementById('search-results-posts');
  const usersRes = document.getElementById('search-results-users');
  if (postsRes) postsRes.classList.toggle('hidden', tabName !== 'posts');
  if (usersRes) usersRes.classList.toggle('hidden', tabName !== 'users');
};

describe('switchSearchTab function', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="tab-posts"></button>
      <button id="tab-users"></button>
      <div id="search-results-posts"></div>
      <div id="search-results-users" class="hidden"></div>
    `;
  });

  test('switches to posts tab', () => {
    switchSearchTab('posts');

    expect(document.getElementById('tab-posts').classList.contains('active')).toBe(true);
    expect(document.getElementById('tab-users').classList.contains('active')).toBe(false);
    expect(document.getElementById('search-results-posts').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('search-results-users').classList.contains('hidden')).toBe(true);
  });

  test('switches to users tab', () => {
    switchSearchTab('users');

    expect(document.getElementById('tab-posts').classList.contains('active')).toBe(false);
    expect(document.getElementById('tab-users').classList.contains('active')).toBe(true);
    expect(document.getElementById('search-results-posts').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('search-results-users').classList.contains('hidden')).toBe(false);
  });
});