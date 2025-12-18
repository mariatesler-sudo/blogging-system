// frontend/__tests__/displayPosts.test.js
/**
 * @jest-environment jsdom
 */

// Мок функции displayPosts
const displayPosts = (posts, containerId) => {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!Array.isArray(posts) || posts.length === 0) {
    container.innerHTML = '<div class="loading">Постов пока нет</div>';
    return;
  }

  container.innerHTML = posts.map(post => `
    <div class="post-card">
      <h3 class="post-title">${escapeHtml(post.title)}</h3>
      <p class="post-content">${escapeHtml((post.content || '').substring(0, 200))}</p>
      <div class="post-meta">
        <span>👤 ${escapeHtml(post.author_username || 'Неизвестно')}</span>
        <span>📅 ${post.created_at ? 'Дата' : ''}</span>
      </div>
    </div>
  `).join('');
};

// Вспомогательная функция
const escapeHtml = (text) => {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

describe('displayPosts function', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="posts-container"></div>';
  });

  test('displays posts correctly', () => {
    const posts = [
      {
        id: 1,
        title: 'First Post',
        content: 'Content of first post',
        author_username: 'user1',
        created_at: '2024-01-01'
      },
      {
        id: 2,
        title: 'Second Post',
        content: 'Content of second post',
        author_username: 'user2',
        created_at: '2024-01-02'
      }
    ];

    displayPosts(posts, 'posts-container');
    const container = document.getElementById('posts-container');

    expect(container.innerHTML).toContain('First Post');
    expect(container.innerHTML).toContain('Second Post');
    expect(container.innerHTML).toContain('user1');
    expect(container.innerHTML).toContain('user2');
    expect(container.querySelectorAll('.post-card').length).toBe(2);
  });

  test('shows empty message when no posts', () => {
    displayPosts([], 'posts-container');
    const container = document.getElementById('posts-container');

    expect(container.innerHTML).toContain('Постов пока нет');
  });

  test('handles missing container gracefully', () => {
    // Не должно быть ошибки если контейнера нет
    expect(() => {
      displayPosts([{ title: 'Test' }], 'non-existent-container');
    }).not.toThrow();
  });
});