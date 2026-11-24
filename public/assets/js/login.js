(() => {
  'use strict';
  const byId = (id) => document.getElementById(id);
  const lock = () => {
    document.body.classList.add('auth-locked');
    byId('authGate')?.setAttribute('aria-hidden', 'false');
  };
  const unlock = () => {
    document.body.classList.remove('auth-locked');
    byId('authGate')?.setAttribute('aria-hidden', 'true');
  };
  const message = (text, type = 'error') => {
    const el = byId('authMessage');
    if (!el) return;
    el.textContent = text;
    el.className = `auth-message ${type}`;
  };

  document.addEventListener('DOMContentLoaded', async () => {
    const form = byId('gateLoginForm');
    const button = byId('gateSubmit');
    const originalButton = button?.innerHTML || 'Tiếp tục <span>→</span>';
    lock();

    // The page remains locked unless the backend confirms an existing session.
    try {
      const sessionResponse = await fetch('/session', { method: 'GET', credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } });
      if (sessionResponse.ok) {
        const session = await sessionResponse.json();
        if (session.authenticated === true) unlock();
      }
    } catch (_) { /* Keep the login gate closed when the backend is unavailable. */ }

    form?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const username = byId('gateUsername')?.value.trim() || '';
      const password = byId('gatePassword')?.value || '';
      if (!username || !password) return message('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');

      if (button) { button.disabled = true; button.textContent = 'Đang xác thực…'; }
      message('Đang kết nối máy chủ xác thực…', 'pending');
      try {
        const response = await fetch('/login', {
          method: 'POST',
          credentials: 'same-origin',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', Accept: 'application/json' },
          body: new URLSearchParams({ username, password }).toString()
        });
        let data = {};
        try { data = await response.json(); } catch (_) {}
        if (!response.ok || data.authenticated !== true || data.ok !== true) {
          throw new Error(data.error || (response.status === 404
            ? 'Không tìm thấy API /login. Hãy kiểm tra Netlify Functions và netlify.toml.'
            : `Đăng nhập chưa thành công (HTTP ${response.status}).`));
        }
        form.reset();
        unlock();
        window.scrollTo({ top: 0, behavior: 'instant' });
      } catch (error) {
        message(error.message || 'Không thể kết nối máy chủ xác thực.');
      } finally {
        if (button) { button.disabled = false; button.innerHTML = originalButton; }
      }
    });

    window.addEventListener('auto-olm-logout', () => {
      lock();
      form?.reset();
      message('Bạn đã đăng xuất. Hãy đăng nhập lại để tiếp tục.', 'pending');
    });
  });
})();
