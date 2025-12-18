// frontend/__tests__/updateUI.test.js
/**
 * @jest-environment jsdom
 */

// Мок функции updateUI
const updateUI = (token) => {
  const isLoggedIn = !!token;

  const elements = {
    'guest-buttons': !isLoggedIn,
    'user-buttons': isLoggedIn,
    'create-post-link': isLoggedIn,
    'profile-link': isLoggedIn,
  };

  for (const [id, shouldShow] of Object.entries(elements)) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.toggle('hidden', !shouldShow);
    }
  }
};

describe('updateUI function', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="guest-buttons"></div>
      <div id="user-buttons" class="hidden"></div>
      <a id="create-post-link" class="hidden"></a>
      <a id="profile-link" class="hidden"></a>
    `;
  });

  test('shows guest buttons when not logged in', () => {
    updateUI(null);

    expect(document.getElementById('guest-buttons').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('user-buttons').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('create-post-link').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('profile-link').classList.contains('hidden')).toBe(true);
  });

  test('shows user buttons when logged in', () => {
    updateUI('some-token');

    expect(document.getElementById('guest-buttons').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('user-buttons').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('create-post-link').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('profile-link').classList.contains('hidden')).toBe(false);
  });
});