// frontend/__tests__/updateStatsDisplay.test.js
/**
 * @jest-environment jsdom
 */

const updateStatsDisplay = (userPosts, favoritesCount = 0) => {
  const postsEl = document.getElementById('stat-posts');
  const favEl = document.getElementById('stat-favorites');
  const likesEl = document.getElementById('stat-likes');
  const commentsEl = document.getElementById('stat-comments');

  const posts = Array.isArray(userPosts) ? userPosts : [];

  const postsCount = posts.length;

  // лайки/комменты — это сумма по твоим постам
  let totalLikes = 0;
  let totalComments = 0;

  posts.forEach(p => {
    totalLikes += Number(p.likes_count || 0);
    totalComments += Number(p.comments_count || 0);
  });

  if (postsEl) postsEl.textContent = String(postsCount);
  if (favEl) favEl.textContent = String(favoritesCount);

  if (likesEl) likesEl.textContent = String(totalLikes);
  if (commentsEl) commentsEl.textContent = String(totalComments);
};

describe('updateStatsDisplay function', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <span id="stat-posts"></span>
      <span id="stat-favorites"></span>
      <span id="stat-likes"></span>
      <span id="stat-comments"></span>
    `;
  });

  test('calculates stats correctly', () => {
    const userPosts = [
      { likes_count: 5, comments_count: 3 },
      { likes_count: 2, comments_count: 1 },
      { likes_count: 0, comments_count: 0 }
    ];

    updateStatsDisplay(userPosts, 10);

    expect(document.getElementById('stat-posts').textContent).toBe('3');
    expect(document.getElementById('stat-favorites').textContent).toBe('10');
    expect(document.getElementById('stat-likes').textContent).toBe('7'); // 5+2+0
    expect(document.getElementById('stat-comments').textContent).toBe('4'); // 3+1+0
  });

  test('handles empty posts array', () => {
    updateStatsDisplay([], 5);

    expect(document.getElementById('stat-posts').textContent).toBe('0');
    expect(document.getElementById('stat-favorites').textContent).toBe('5');
    expect(document.getElementById('stat-likes').textContent).toBe('0');
    expect(document.getElementById('stat-comments').textContent).toBe('0');
  });

  test('handles non-array input', () => {
    updateStatsDisplay(null, 3);

    expect(document.getElementById('stat-posts').textContent).toBe('0');
    expect(document.getElementById('stat-favorites').textContent).toBe('3');
    expect(document.getElementById('stat-likes').textContent).toBe('0');
    expect(document.getElementById('stat-comments').textContent).toBe('0');
  });

  test('handles posts with missing counts', () => {
    const userPosts = [
      { likes_count: null, comments_count: undefined },
      {},
      { likes_count: '5', comments_count: '2' } // строки
    ];

    updateStatsDisplay(userPosts, 0);

    expect(document.getElementById('stat-posts').textContent).toBe('3');
    expect(document.getElementById('stat-likes').textContent).toBe('5'); // 0+0+5
    expect(document.getElementById('stat-comments').textContent).toBe('2'); // 0+0+2
  });
});