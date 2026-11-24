(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const video = $('mainVideo');
  if (video) {
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.controls = false;
    video.setAttribute('playsinline', '');
    video.setAttribute('disablepictureinpicture', '');
    video.setAttribute('controlslist', 'nodownload noplaybackrate nofullscreen');
    video.addEventListener('contextmenu', (event) => event.preventDefault());
    video.addEventListener('click', (event) => event.preventDefault());
    const play = () => { const result = video.play(); if (result?.catch) result.catch(() => {}); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', play, { once: true });
    else play();
  }

  const logout = async () => {
    const buttons = [$('logoutBtn'), $('sessionLogout')].filter(Boolean);
    buttons.forEach((button) => { button.disabled = true; });
    try {
      const response = await fetch('/logout', { method: 'POST', credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' } });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.loggedOut !== true || data.ok !== true) {
        window.alert(data.error || 'Máy chủ chưa xác nhận đăng xuất. Giao diện vẫn được khóa trên thiết bị này.');
      }
    } catch (_) {
      window.alert('Không kết nối được máy chủ đăng xuất. Giao diện sẽ được khóa trên thiết bị này; phiên máy chủ có thể vẫn còn hiệu lực.');
    } finally {
      document.body.classList.add('auth-locked');
      $('authGate')?.setAttribute('aria-hidden', 'false');
      window.dispatchEvent(new Event('auto-olm-logout'));
      buttons.forEach((button) => { button.disabled = false; });
    }
  };
  $('logoutBtn')?.addEventListener('click', logout);
  $('sessionLogout')?.addEventListener('click', logout);
})();
