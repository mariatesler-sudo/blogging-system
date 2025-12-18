// frontend/__tests__/displayUsers.test.js
/**
 * @jest-environment jsdom
 */

const escapeHtml = (text) => {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

const displayUsers = (users, container) => {
  if (!container) return;

  if (!Array.isArray(users) || users.length === 0) {
    container.innerHTML = '<div class="loading">Пользователи не найдены</div>';
    return;
  }

  container.innerHTML = `
    <h3 style="margin: 10px 0 15px;">Найдено пользователей: ${users.length}</h3>
    <div class="users-list">
      ${users.map(u => `
        <div class="user-card">
          <div class="user-info">
            <div class="user-name">
              ${escapeHtml(u.username || 'Без имени')}
            </div>
            <div class="user-email">
              ${escapeHtml(u.email || '')}
            </div>
            <div class="user-bio">
              ${escapeHtml(u.bio || 'Нет информации')}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
};

describe('displayUsers function', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="users-container"></div>';
  });

  test('displays users correctly', () => {
    const users = [
      { username: 'Alice', email: 'alice@example.com', bio: 'Developer' },
      { username: 'Bob', email: 'bob@example.com', bio: 'Designer' }
    ];

    displayUsers(users, document.getElementById('users-container'));
    const container = document.getElementById('users-container');

    expect(container.innerHTML).toContain('Alice');
    expect(container.innerHTML).toContain('Bob');
    expect(container.innerHTML).toContain('alice@example.com');
    expect(container.innerHTML).toContain('Найдено пользователей: 2');
  });

  test('shows empty message when no users', () => {
    displayUsers([], document.getElementById('users-container'));
    const container = document.getElementById('users-container');

    expect(container.innerHTML).toContain('Пользователи не найдены');
  });

  test('handles missing container gracefully', () => {
    expect(() => {
      displayUsers([{ username: 'Test' }], null);
    }).not.toThrow();
  });

  test('handles users with missing fields', () => {
    const users = [
      { username: 'User1' }, // нет email и bio
      { email: 'test@test.com' } // нет username
    ];

    displayUsers(users, document.getElementById('users-container'));
    const container = document.getElementById('users-container');

    expect(container.innerHTML).toContain('User1');
    expect(container.innerHTML).toContain('Без имени');
    expect(container.innerHTML).toContain('Нет информации');
  });
});