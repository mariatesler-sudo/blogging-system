
const API_URL = 'http://localhost:8000/api';
const IS_JEST =
  (typeof process !== "undefined" && !!process.env?.JEST_WORKER_ID) ||
  (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent));



let token = (typeof localStorage !== "undefined") ? localStorage.getItem("token") : null;

let currentUser = null;
let currentSearchTab = 'posts';
let currentPostIdForComments = null;



let feedLimit = 10;
let feedOffset = 0;
let feedIsLoading = false;

let searchLimit = 10;
let searchOffset = 0;
let searchLastQuery = '';
let searchIsLoading = false;




function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');
  if (!notification) return;

  notification.textContent = message;
  notification.className = `notification ${type}`;
  notification.classList.remove('hidden');


  if (!IS_JEST) {
    setTimeout(() => notification.classList.add('hidden'), 3000);
  }
}


function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = String(text);
  return div.innerHTML;
}

function getToken() {
  return localStorage.getItem("token");
}

function updateUI() {
  token = getToken();
  const isLoggedIn = !!token;

  const elements = {
    "guest-buttons": !isLoggedIn,
    "user-buttons": isLoggedIn,
    "create-post-link": isLoggedIn,
    "profile-link": isLoggedIn,
    "create-post-btn": isLoggedIn,
    "favorites-link": isLoggedIn,
  };

  for (const [id, shouldShow] of Object.entries(elements)) {
    const el = document.getElementById(id);
    if (!el) continue;
    el.classList.toggle("hidden", !shouldShow);
  }
}


function guestActionHint() {
  showNotification('Войдите, чтобы ставить лайки, комментировать и добавлять в избранное', 'error');
  showAuthModal('login');
}


function requireAuth() {
  token = getToken();
  if (!token) {
    showNotification('Сначала войдите', 'error');
    showAuthModal('login');
    throw new Error('NO_AUTH');
  }
}

async function getErrorMessage(res) {
  const data = await safeJsonParse(res);


  if (Array.isArray(data.detail)) {
    return data.detail.map(e => {
      const where = Array.isArray(e.loc) ? e.loc.join('.') : '';
      return (where ? `${where}: ` : '') + (e.msg || 'Ошибка валидации');
    }).join(' | ');
  }


  return data.detail || data.message || `Ошибка (${res.status})`;
}




function safeJsonParse(response) {
  return response.json().catch(() => ({}));
}


async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    token = null;
    currentUser = null;
    localStorage.removeItem('token');
    updateUI();
  }
  return res;
}


async function handleApiError(res) {
  if (res.status === 401) {
    showNotification('Сначала войдите в аккаунт', 'error');
    showAuthModal('login');
    return true;
  }

  if (res.status === 403) {
    showNotification('Недостаточно прав для этого действия', 'error');
    return true;
  }

  if (res.status === 404) {
    showNotification('Ресурс не найден', 'error');
    return true;
  }

  if (res.status >= 500) {
    showNotification('Ошибка сервера. Попробуйте позже', 'error');
    return true;
  }

  return false;
}


function decodeJwtPayload(jwtStr) {
  if (!jwtStr) return null;
  const parts = jwtStr.split('.');
  if (parts.length !== 3) return null;

  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);

  try {
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function getUserIdFromToken() {
  const storedToken = localStorage.getItem('token');
  if (!storedToken) return null;

  const payload = decodeJwtPayload(storedToken);
  return payload?.sub ?? payload?.user_id ?? payload?.id ?? null;
}



async function login() {
  clearFieldErrors();

  const emailEl = document.getElementById('login-email');
  const passEl = document.getElementById('login-password');

  const email = emailEl?.value.trim();
  const password = passEl?.value;

  let ok = true;

  if (!email || !email.includes('@')) {
    fieldError('login-email', 'Введите корректный email');
    ok = false;
  }

  if (!password || password.length < 6) {
    fieldError('login-password', 'Пароль минимум 6 символов');
    ok = false;
  }

  if (!ok) {
    showNotification('Проверьте поля формы', 'error');
    return;
  }

  try {

    let res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });


    if (!res.ok && (res.status === 400 || res.status === 401 || res.status === 422)) {
      const form = new URLSearchParams();
      form.append('username', email);
      form.append('password', password);

      res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: form.toString(),
      });
    }

    if (res.ok) {
      const data = await safeJsonParse(res);

      token = data.access_token || data.token || data.accessToken || data.jwt;
      if (!token) {
        showNotification('Сервер не вернул токен', 'error');
        return;
      }

      localStorage.setItem('token', token);

      hideAuthModal();
      updateUI();

      showNotification('Вход выполнен успешно!', 'success');


      showSection('feed');
      return;
    }


    if (await handleApiError(res)) return;
    const msg = await getErrorMessage(res);
    showNotification(msg, 'error');
    return;

  } catch (e) {
    console.error(e);
    showNotification('Ошибка сети', 'error');
  }
}

async function register() {
  clearFieldErrors();

  const usernameEl = document.getElementById('reg-username');
  const emailEl = document.getElementById('reg-email');
  const passEl = document.getElementById('reg-password');

  const username = usernameEl?.value.trim();
  const email = emailEl?.value.trim();
  const password = passEl?.value;

  let ok = true;

  if (!username || username.length < 3) {
    fieldError('reg-username', 'Имя пользователя минимум 3 символа');
    ok = false;
  }

  if (!email || !email.includes('@')) {
    fieldError('reg-email', 'Введите корректный email');
    ok = false;
  }

  if (!password || password.length < 6) {
    fieldError('reg-password', 'Пароль минимум 6 символов');
    ok = false;
  }

  if (!ok) {
    showNotification('Проверьте поля формы', 'error');
    return;
  }

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    if (res.ok) {
      showNotification('Регистрация успешна! Теперь войдите.', 'success');
      switchAuthForm('login');
      return;
    }


  if (await handleApiError(res)) return;
  const msg = await getErrorMessage(res);
  showNotification(msg, 'error');
  return;


  } catch (e) {
    showNotification('Ошибка сети', 'error');
  }
}


function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem('token');
  updateUI();
  showSection('feed');
  showNotification('Вы вышли из системы');
}



function showAuthModal(type) {
  document.getElementById('auth-modal')?.classList.remove('hidden');
  switchAuthForm(type);
}

function hideAuthModal() {
  document.getElementById('auth-modal')?.classList.add('hidden');
}

function switchAuthForm(type) {
  const isLogin = type === 'login';
  document.getElementById('login-form')?.classList.toggle('hidden', !isLogin);
  document.getElementById('register-form')?.classList.toggle('hidden', isLogin);

  const title = document.getElementById('modal-title');
  if (title) title.textContent = isLogin ? 'Вход' : 'Регистрация';

  const switchText = document.getElementById('form-switch');
  if (!switchText) return;

  if (isLogin) {
    switchText.innerHTML = `Нет аккаунта? <a href="#" onclick="switchAuthForm('register')">Зарегистрируйтесь</a>`;
  } else {
    switchText.innerHTML = `Есть аккаунт? <a href="#" onclick="switchAuthForm('login')">Войдите</a>`;
  }
}

function showEditProfileModal() {
  if (!currentUser) {
    showNotification('Сначала загрузите профиль', 'error');
    return;
  }

  document.getElementById('edit-username').value = currentUser.username || '';
  document.getElementById('edit-email').value = currentUser.email || '';
  document.getElementById('edit-bio').value = currentUser.bio || '';

  document.getElementById('edit-profile-modal')?.classList.remove('hidden');
}

function hideEditProfileModal() {
  document.getElementById('edit-profile-modal')?.classList.add('hidden');
}



async function loadPosts(reset = false) {
  try {
    if (feedIsLoading) return;
    feedIsLoading = true;

    if (reset) feedOffset = 0;

    const res = await api(`/posts?limit=${feedLimit}&offset=${feedOffset}`);
    const posts = res.ok ? await safeJsonParse(res) : [];
    console.log('POSTS FROM API:', posts);

    if (reset) {
      displayPosts(posts, 'posts-container');
    } else {
      appendPosts(posts, 'posts-container');
    }


    if (Array.isArray(posts) && posts.length === feedLimit) {
      feedOffset += feedLimit;
      showLoadMore(true);
    } else {
      showLoadMore(false);
    }
  } catch (e) {
    console.error(e);
  } finally {
    feedIsLoading = false;
  }
}

function showLoadMore(show) {
  const btn = document.getElementById('load-more-btn');
  if (!btn) return;
  btn.classList.toggle('hidden', !show);
}

function appendPosts(posts, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!Array.isArray(posts) || posts.length === 0) return;

  container.insertAdjacentHTML('beforeend', posts.map(post => `
    <div class="post-card">
      <h3 class="post-title">${escapeHtml(post.title)}</h3>
      <p class="post-content">${escapeHtml((post.content || '').substring(0, 200))}${(post.content || '').length > 200 ? '...' : ''}</p>
      <div class="post-meta">
        <span>👤 ${escapeHtml(post.author_username || 'Неизвестно')}</span>
        <span>📅 ${post.created_at ? new Date(post.created_at).toLocaleDateString() : ''}</span>
      </div>
      <div class="post-actions">
        <button class="action-btn" onclick="likePost(${post.id})">
          <i class="fas fa-heart"></i> ${post.likes_count || 0}
        </button>
        <button class="action-btn" onclick="showComments(${post.id})">
          <i class="fas fa-comment"></i> Комментировать
        </button>
        <button class="action-btn" onclick="toggleFavorite(${post.id})">
          <i class="far fa-star"></i> В избранное
        </button>
      </div>
    </div>
  `).join(''));
}


async function createPost() {
  requireAuth();

  const title = document.getElementById('post-title')?.value.trim();
  const content = document.getElementById('post-content')?.value.trim();

  if (!title || !content) {
    showNotification('Заполните заголовок и содержание', 'error');
    return;
  }

  try {
    const res = await api('/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content }),
    });

    const data = await safeJsonParse(res);

    if (res.ok) {
      showNotification('Пост опубликован!');
      document.getElementById('post-title').value = '';
      document.getElementById('post-content').value = '';
      showSection('feed');
      return;
    }
    if (!res.ok) {
    if (await handleApiError(res)) return;
    const msg = await getErrorMessage(res);
    showNotification(msg, 'error');
    return;
    }


    showNotification(data.detail || 'Ошибка создания поста', 'error');
  } catch (e) {
    showNotification('Ошибка сети', 'error');
  }
}

function displayPosts(posts, containerId) {
  console.log('displayPosts called, posts:', posts, 'container:', containerId);

  const container = document.getElementById(containerId);
  if (!container) return;

  if (!posts || !Array.isArray(posts) || posts.length === 0) {
    container.innerHTML = '<div class="loading">Постов пока нет</div>';
    return;
  }

  const isLoggedIn = !!token;

  container.innerHTML = posts.map(post => `
    <div class="post-card">
      <h3 class="post-title">${escapeHtml(post.title)}</h3>

      <p class="post-content">
        ${escapeHtml((post.content || '').substring(0, 200))}
        ${(post.content || '').length > 200 ? '...' : ''}
      </p>

      <div class="post-meta">
        <span>👤 ${escapeHtml(post.author_username || 'Неизвестно')}</span>
        <span>📅 ${post.created_at ? new Date(post.created_at).toLocaleDateString() : ''}</span>
      </div>

      <div class="post-actions">
        <button
          class="action-btn ${isLoggedIn ? '' : 'guest-disabled'}"
          onclick="${isLoggedIn ? `likePost(${post.id})` : 'guestActionHint()'}"
        >
          <i class="fas fa-heart"></i> ${post.likes_count || 0}
        </button>

        <button
          class="action-btn ${isLoggedIn ? '' : 'guest-disabled'}"
          onclick="${isLoggedIn ? `showComments(${post.id})` : 'guestActionHint()'}"
        >
          <i class="fas fa-comment"></i> Комментировать
        </button>

        <button
          class="action-btn ${isLoggedIn ? '' : 'guest-disabled'}"
          id="fav-btn-${post.id}"
          data-fav="${post.is_favorite ? '1' : '0'}"
          onclick="${isLoggedIn ? `toggleFavorite(${post.id})` : 'guestActionHint()'}"
          style="${post.is_favorite ? 'color:#ffc107;' : ''}"
        >
          <i class="${post.is_favorite ? 'fas fa-star' : 'far fa-star'}"></i>
          ${post.is_favorite ? 'В избранном' : 'В избранное'}
        </button>
      </div>

      ${isLoggedIn ? '' : `
        <div class="guest-hint">
          Войдите, чтобы лайкать, комментировать и добавлять в избранное
        </div>
      `}
    </div>
  `).join('');
}





async function loadProfile() {
  requireAuth();

  const userId = getUserIdFromToken();
  if (!userId) {
    showNotification('Не удалось прочитать пользователя из токена', 'error');
    return;
  }

  try {

    const userRes = await api(`/users/${encodeURIComponent(userId)}`);
    if (!userRes.ok) {
      const err = await safeJsonParse(userRes);
      showNotification(err.detail || err.message || 'Не удалось загрузить профиль', 'error');
      return;
    }

    currentUser = await safeJsonParse(userRes);
    updateProfileDisplay();


    let userPosts = [];
    const postsRes = await api(`/posts?author_id=${encodeURIComponent(userId)}`);
    if (postsRes.ok) {
      const data = await safeJsonParse(postsRes);
      userPosts = Array.isArray(data) ? data : [];
      displayPosts(userPosts, 'user-posts-container');
    } else {

      displayPosts([], 'user-posts-container');
    }


    let favoritesCount = 0;
    const favRes = await api('/posts/me/favorites');
    if (favRes.ok) {
      const favPosts = await safeJsonParse(favRes);
      favoritesCount = Array.isArray(favPosts) ? favPosts.length : 0;
    }


    updateStatsDisplay(userPosts, favoritesCount);

    showNotification('Профиль загружен!');
  } catch (e) {
    console.error('Ошибка загрузки профиля:', e);
    showNotification('Ошибка загрузки профиля', 'error');
  }
}


function updateProfileDisplay() {
  if (!currentUser) return;

  const usernameEl = document.getElementById('profile-username');
  const emailEl = document.getElementById('profile-email');
  const bioEl = document.getElementById('profile-bio');

  if (usernameEl) usernameEl.textContent = currentUser.username || 'Неизвестно';
  if (emailEl) emailEl.textContent = currentUser.email || 'Нет email';
  if (bioEl) bioEl.textContent = currentUser.bio || 'О себе не указано';

  const dbg = document.getElementById('debug-content');
  if (dbg) {
    const payload = token ? decodeJwtPayload(token) : null;
    dbg.innerHTML = `
      token: ${token ? 'есть' : 'нет'}<br>
      userId: ${escapeHtml(String(getUserIdFromToken() ?? 'null'))}<br>
      payload: <pre style="white-space: pre-wrap; margin: 6px 0 0;">${escapeHtml(JSON.stringify(payload, null, 2) || '')}</pre>
    `;
  }
}

function updateStatsDisplay(userPosts, favoritesCount = 0) {
  const postsEl = document.getElementById('stat-posts');
  const favEl = document.getElementById('stat-favorites');
  const likesEl = document.getElementById('stat-likes');
  const commentsEl = document.getElementById('stat-comments');

  const posts = Array.isArray(userPosts) ? userPosts : [];

  const postsCount = posts.length;


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
}


async function updateProfile() {
  requireAuth();

  const username = document.getElementById('edit-username')?.value.trim();
  const email = document.getElementById('edit-email')?.value.trim();
  const bio = document.getElementById('edit-bio')?.value.trim();

  if (!username || !email) {
    showNotification('Имя пользователя и email обязательны', 'error');
    return;
  }

  try {
    const res = await api('/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, bio }),
    });

    const data = await safeJsonParse(res);

    if (res.ok) {
      currentUser = data;
      updateProfileDisplay();
      hideEditProfileModal();
      showNotification('Профиль обновлен!');
      return;
    }

    showNotification(data.detail || 'Ошибка обновления профиля', 'error');
  } catch (e) {
    showNotification('Ошибка сети', 'error');
  }
}



async function likePost(postId) {
  requireAuth();

  try {
    const res = await api(`/posts/${postId}/like`, { method: 'POST' });

    if (res.ok) {
      showNotification('Лайк поставлен!');
      loadPosts();
      return;
    }
    if (!res.ok) {
    if (await handleApiError(res)) return;
    const msg = await getErrorMessage(res);
    showNotification(msg, 'error');
    return;
    }


    const err = await safeJsonParse(res);

    showNotification(err.detail || 'Ошибка лайка', 'error');
  } catch (e) {
    showNotification('Ошибка сети', 'error');
  }
}



function switchSearchTab(tabName) {
  currentSearchTab = tabName;

  const tabPosts = document.getElementById('tab-posts');
  const tabUsers = document.getElementById('tab-users');
  if (tabPosts) tabPosts.classList.toggle('active', tabName === 'posts');
  if (tabUsers) tabUsers.classList.toggle('active', tabName === 'users');

  const postsRes = document.getElementById('search-results-posts');
  const usersRes = document.getElementById('search-results-users');
  if (postsRes) postsRes.classList.toggle('hidden', tabName !== 'posts');
  if (usersRes) usersRes.classList.toggle('hidden', tabName !== 'users');

  const input = document.getElementById('search-input');
  if (input) input.value = '';

  if (postsRes) postsRes.innerHTML = '';
  if (usersRes) usersRes.innerHTML = '';
}

async function performSearch() {
  const query = document.getElementById('search-input')?.value.trim();
  if (!query) {
    showNotification('Введите поисковый запрос', 'error');
    return;
  }

  if (currentSearchTab === 'posts') {
    await searchPosts(query, true);
  } else {
    await searchUsers(query);
  }
}


async function searchPosts(query, reset = true) {
  try {
    if (searchIsLoading) return;
    searchIsLoading = true;

    if (reset) {
      searchOffset = 0;
      searchLastQuery = query;
    }

    const res = await api(`/posts?query=${encodeURIComponent(searchLastQuery)}&limit=${searchLimit}&offset=${searchOffset}`);
    if (!res.ok) {
      const err = await safeJsonParse(res);
      showNotification(err.detail || 'Ошибка поиска постов', 'error');
      return;
    }

    const posts = await safeJsonParse(res);
    const container = document.getElementById('search-results-posts');
    if (!container) return;

    if (reset) {
      container.innerHTML = `<h3 style="margin:10px 0 15px;">Результаты по запросу: “${escapeHtml(searchLastQuery)}”</h3>
                             <div id="search-posts-cards" class="posts-grid"></div>
                             <div style="display:flex;justify-content:center;margin:20px 0;">
                               <button id="search-load-more-btn" class="btn btn-outline hidden"
                                 onclick="searchPosts(searchLastQuery, false)">Показать ещё</button>
                             </div>`;
    }

    const cardsId = 'search-posts-cards';
    if (Array.isArray(posts) && posts.length > 0) {
      if (searchOffset === 0) {
        displayPosts(posts, cardsId);
      } else {
        appendPosts(posts, cardsId);
      }
    } else if (searchOffset === 0) {
      document.getElementById(cardsId).innerHTML = '<div class="loading">Посты не найдены</div>';
    }


    const btn = document.getElementById('search-load-more-btn');
    if (btn) {
      const hasMore = Array.isArray(posts) && posts.length === searchLimit;
      btn.classList.toggle('hidden', !hasMore);
    }

    if (Array.isArray(posts) && posts.length === searchLimit) {
      searchOffset += searchLimit;
    }
  } catch (e) {
    console.error(e);
    showNotification('Ошибка поиска', 'error');
  } finally {
    searchIsLoading = false;
  }
}


async function searchUsers(query) {
  const resultsContainer = document.getElementById('search-results-users');
  if (!resultsContainer) return;

  resultsContainer.innerHTML = '<div class="loading">Поиск пользователей...</div>';

  try {

    const res = await api(`/users?query=${encodeURIComponent(query)}&limit=50&offset=0`);

    if (!res.ok) {
      const err = await safeJsonParse(res);
      resultsContainer.innerHTML = `<div class="loading">${escapeHtml(err.detail || 'Ошибка поиска пользователей')}</div>`;
      return;
    }

    const users = await safeJsonParse(res);
    displayUsers(Array.isArray(users) ? users : [], resultsContainer);
  } catch (e) {
    console.error('Ошибка поиска пользователей:', e);
    resultsContainer.innerHTML = '<div class="loading">Ошибка поиска</div>';
  }
}


function displayUsers(users, container) {
  if (!container) return;

  if (!Array.isArray(users) || users.length === 0) {
    container.innerHTML = '<div class="loading">Пользователи не найдены</div>';
    return;
  }

  container.innerHTML = `
    <h3 style="margin: 10px 0 15px;">Найдено пользователей: ${users.length}</h3>
    <div class="users-list">
      ${users.map(u => `
        <div class="user-card" style="display:flex; gap:14px; padding:14px; border:1px solid #eaeaea; border-radius:12px; background:#fff; margin-bottom:12px;">
          <div class="user-avatar" style="font-size:28px; color:#007bff;">
            <i class="fas fa-user-circle"></i>
          </div>
          <div class="user-info" style="flex:1;">
            <div class="user-name" style="font-weight:700; font-size:16px; margin-bottom:2px;">
              ${escapeHtml(u.username || 'Без имени')}
            </div>
            <div class="user-email" style="color:#666; font-size:13px; margin-bottom:6px;">
              ${escapeHtml(u.email || '')}
            </div>
            <div class="user-bio" style="color:#444; font-size:14px;">
              ${escapeHtml(u.bio || 'Нет информации')}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}




async function showComments(postId) {
  currentPostIdForComments = postId;
  document.getElementById('comments-modal')?.classList.remove('hidden');

  const title = document.getElementById('comments-modal-title');
  if (title) title.textContent = 'Комментарии';

  await loadComments(postId);
}

function hideCommentsModal() {
  document.getElementById('comments-modal')?.classList.add('hidden');
  currentPostIdForComments = null;
  const t = document.getElementById('comment-text');
  if (t) t.value = '';
}

async function loadComments(postId) {
  const list = document.getElementById('comments-list');
  if (!list) return;

  list.innerHTML = '<div class="loading">Загрузка комментариев...</div>';

  try {
    const res = await api(`/posts/${postId}/comments`);
    if (!res.ok) {
      list.innerHTML = `
        <div style="text-align:center;padding:20px;color:#666;">
          <p>Не удалось загрузить комментарии</p>
        </div>
      `;
      return;
    }

    const comments = await safeJsonParse(res);
    displayComments(comments);
  } catch (e) {
    list.innerHTML = '<div class="loading">Ошибка загрузки комментариев</div>';
  }
}

function displayComments(comments) {
  const list = document.getElementById('comments-list');
  if (!list) return;

  if (!comments || !Array.isArray(comments) || comments.length === 0) {
    list.innerHTML = `
      <div style="text-align:center;padding:20px;color:#666;">
        <p>Комментариев пока нет. Будьте первым!</p>
      </div>
    `;
    return;
  }


  list.innerHTML = comments.map(c => `
    <div class="comment" style="background:white;border:1px solid #eaeaea;border-radius:8px;padding:15px;margin-bottom:15px;border-left:4px solid #007bff;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <span style="font-weight:600;color:#333;">👤 ${escapeHtml(c.user_username || 'Аноним')}</span>
        <span style="font-size:.8rem;color:#888;">📅 ${new Date(c.created_at || Date.now()).toLocaleDateString()}</span>
      </div>
      <div style="color:#555;line-height:1.5;">
        ${escapeHtml(c.text || '')}
      </div>
    </div>
  `).join('');
}

async function addComment() {
  requireAuth();

  const commentText = document.getElementById('comment-text')?.value.trim();
  if (!commentText) {
    showNotification('Введите текст комментария', 'error');
    return;
  }
  if (!currentPostIdForComments) {
    showNotification('Ошибка: пост не выбран', 'error');
    return;
  }

  try {
    const res = await api(`/posts/${currentPostIdForComments}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: commentText }),
    });

    const data = await safeJsonParse(res);

    if (res.ok) {
      showNotification('Комментарий добавлен!');
      document.getElementById('comment-text').value = '';
      await loadComments(currentPostIdForComments);
      return;
    }
    if (!res.ok) {
    if (await handleApiError(res)) return;
    const msg = await getErrorMessage(res);
    showNotification(msg, 'error');
    return;
    }


    showNotification(data.detail || 'Не удалось добавить комментарий', 'error');
  } catch (e) {
    showNotification('Ошибка сети', 'error');
  }
}



function updateFavoriteButton(postId, isFavorite) {
  const btn = document.getElementById(`fav-btn-${postId}`);
  if (!btn) return;

  btn.dataset.fav = isFavorite ? '1' : '0';
  btn.style.color = isFavorite ? '#ffc107' : '';
  btn.innerHTML = `
    <i class="${isFavorite ? 'fas fa-star' : 'far fa-star'}"></i>
    ${isFavorite ? 'В избранном' : 'В избранное'}
  `;
}





async function toggleFavorite(postId) {
  requireAuth();

  const btn = document.getElementById(`fav-btn-${postId}`);
  const currentlyFav = btn?.dataset?.fav === '1';

  try {
    const res = await api(`/posts/${postId}/favorite`, {
      method: currentlyFav ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await safeJsonParse(res);

    if (res.ok) {
      const newFav = !currentlyFav;
      updateFavoriteButton(postId, newFav);
      showNotification(newFav ? 'Добавлено в избранное!' : 'Удалено из избранного', 'success');


      const favSection = document.getElementById('favorites-section');
      if (favSection && !favSection.classList.contains('hidden')) {
        loadFavorites();
      }
      return;
    }
    if (!res.ok) {
    if (await handleApiError(res)) return;
    const msg = await getErrorMessage(res);
    showNotification(msg, 'error');
    return;
    }


    showNotification(data.detail || data.message || 'Ошибка избранного', 'error');
  } catch (e) {
    console.error(e);
    showNotification('Ошибка сети', 'error');
  }
}


async function loadFavorites() {
  requireAuth();

  const container = document.getElementById('favorites-container');
  if (!container) return;

  container.innerHTML = '<div class="loading">Загрузка избранного...</div>';

  try {
    const res = await api('/posts/me/favorites');
    if (!res.ok) {
      const err = await safeJsonParse(res);
      container.innerHTML = `<div class="loading">${escapeHtml(err.detail || 'Ошибка загрузки избранного')}</div>`;
      return;
    }

    const posts = await safeJsonParse(res);

    if (!Array.isArray(posts) || posts.length === 0) {
      container.innerHTML = `
        <div style="text-align:center;padding:40px;color:#666;">
          <i class="fas fa-star" style="font-size:3rem;margin-bottom:20px;color:#ddd;"></i>
          <h3>Избранное пусто</h3>
          <p>Добавляйте посты в избранное, чтобы они были здесь</p>
        </div>
      `;
      return;
    }


    posts.forEach(p => p.is_favorite = true);
    displayPosts(posts, 'favorites-container');
  } catch (e) {
    console.error(e);
    container.innerHTML = '<div class="loading">Ошибка загрузки избранного</div>';
  }
}



function showSection(sectionName) {
  const sections = ['feed', 'create-post', 'profile', 'search', 'explore', 'favorites'];
  sections.forEach(name => {
    const el = document.getElementById(`${name}-section`);
    if (el) el.classList.add('hidden');
  });

  const target = document.getElementById(`${sectionName}-section`);
  if (!target) return;

  target.classList.remove('hidden');

  if (sectionName === 'feed') loadPosts(true);
  if (sectionName === 'profile') {
    if (token) loadProfile();
    else showNotification('Войдите, чтобы открыть профиль', 'error');
  }
  if (sectionName === 'favorites') {
    if (token) loadFavorites();
    else showNotification('Войдите, чтобы открыть избранное', 'error');
  }
}



function toggleMobileMenu() {
  const nav = document.querySelector('.nav-links');
  if (!nav) return;
  nav.style.display = (nav.style.display === 'flex') ? 'none' : 'flex';
}

function debugToken() {
  const payload = token ? decodeJwtPayload(token) : null;
  console.log('TOKEN:', token);
  console.log('PAYLOAD:', payload);
  showNotification(payload ? 'Токен есть (см. консоль)' : 'Токена нет', payload ? 'success' : 'error');
}









function initApp() {
  updateUI();
  showSection('feed');
  loadPosts(true);
}














function clearFieldErrors() {
  document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
  document.querySelectorAll('.error-text').forEach(el => el.remove());
}

function fieldError(inputId, message) {
  const el = document.getElementById(inputId);
  if (!el) return;
  el.classList.add('input-error');

  const msg = document.createElement('div');
  msg.className = 'error-text';
  msg.textContent = message;

  el.parentElement?.appendChild(msg);
}






const IS_TEST =
  typeof process !== "undefined" &&
  !!process.env.JEST_WORKER_ID;


if (!IS_TEST && typeof window !== "undefined" && typeof document !== "undefined") {

  document.addEventListener("DOMContentLoaded", initApp);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && document.activeElement?.id === "search-input") {
      performSearch();
    }
  });


  window.onclick = function (event) {
    const authModal = document.getElementById("auth-modal");
    const editModal = document.getElementById("edit-profile-modal");
    const commentsModal = document.getElementById("comments-modal");

    if (event.target === authModal) hideAuthModal();
    if (event.target === editModal) hideEditProfileModal();
    if (event.target === commentsModal) hideCommentsModal();
  };


  Object.assign(window, {
    showSection,
    toggleMobileMenu,
    debugToken,
    login,
    register,
    logout,
    showAuthModal,
    hideAuthModal,
    switchAuthForm,
    loadPosts,
    createPost,
    likePost,
    showComments,
    hideCommentsModal,
    addComment,
    loadProfile,
    showEditProfileModal,
    hideEditProfileModal,
    updateProfile,
    performSearch,
    switchSearchTab,
    toggleFavorite,
    loadFavorites,
  });
}

export {
  decodeJwtPayload,
  escapeHtml,
  getUserIdFromToken,
  updateUI,
  displayPosts,
  displayUsers,
  updateStatsDisplay,
  switchSearchTab,
  updateFavoriteButton,
  toggleMobileMenu,
  initApp,
  showNotification,

};







