(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const status = (text, kind = '') => {
    const el = $('exerciseStatus');
    if (el) { el.textContent = text; el.dataset.state = kind; }
  };
  const show = (id, data) => {
    const el = $(id);
    if (!el) return;
    el.hidden = false;
    el.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  };
  const post = async (url, payload) => {
    const response = await fetch(url, {
      method: 'POST', credentials: 'same-origin', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false || data.ok === false) {
      throw new Error(data.error || data.message || `Yêu cầu thất bại (HTTP ${response.status}).`);
    }
    return data;
  };
  const accountId = () => {
    const id = ($('olmAccountId')?.value || '').trim();
    if (!id || id.length > 64) throw new Error('Vui lòng nhập account ID hợp lệ.');
    return id;
  };
  const busy = (id, yes, busyText) => {
    const b = $(id);
    if (!b) return;
    if (yes) { b.dataset.originalText = b.textContent; b.disabled = true; if (busyText) b.textContent = busyText; }
    else { b.disabled = false; if (b.dataset.originalText) b.textContent = b.dataset.originalText; }
  };
  let exercises = [];

  $('loadExercisesBtn')?.addEventListener('click', async () => {
    busy('loadExercisesBtn', true, 'Đang tải…');
    status('Đang tải danh sách bài tập…', 'pending');
    try {
      const data = await post('/panel/exercises', { account_id: accountId() });
      exercises = Array.isArray(data.exercises) ? data.exercises : (Array.isArray(data.data?.exercises) ? data.data.exercises : []);
      const list = $('exerciseList');
      list.replaceChildren();
      exercises.forEach((item, i) => {
        const row = document.createElement('label');
        row.className = 'exercise-item';
        const cb = document.createElement('input');
        cb.type = 'checkbox'; cb.value = String(i); cb.checked = true;
        const text = document.createElement('span');
        const title = typeof item === 'string' ? item : (item.title || item.name || item.exercise_name || item.url || `Bài tập ${i + 1}`);
        text.textContent = title;
        row.append(cb, text);
        if (item && typeof item === 'object' && item.expired) {
          const expired = document.createElement('small');
          expired.textContent = ' · Hết hạn';
          row.append(expired);
        }
        list.append(row);
      });
      show('exerciseOutput', { count: exercises.length, message: data.message || '' });
      status(exercises.length ? `Đã tải ${exercises.length} bài tập. Chọn bài cần xử lý.` : 'Máy chủ trả về danh sách trống.', exercises.length ? 'success' : '');
    } catch (e) { status(e.message, 'error'); }
    finally { busy('loadExercisesBtn', false); }
  });

  $('doExercisesBtn')?.addEventListener('click', async () => {
    busy('doExercisesBtn', true, 'Đang gửi…');
    status('Đang gửi các bài đã chọn đến máy chủ…', 'pending');
    try {
      const selected = [...document.querySelectorAll('#exerciseList input[type="checkbox"]:checked')]
        .map((x) => exercises[Number(x.value)]).filter((x) => x !== undefined);
      if (!selected.length) throw new Error('Hãy tải bài và chọn ít nhất một bài tập.');
      const rawTime = Number($('timeSpent')?.value || 150);
      const timeSpent = Number.isFinite(rawTime) ? Math.min(3600, Math.max(10, Math.round(rawTime))) : 150;
      const data = await post('/panel/do-exercises', {
        account_id: accountId(), exercises: selected, time_spent: timeSpent
      });
      show('exerciseOutput', data);
      if (data.success === true || data.ok === true) {
        const successCount = data.success_count ?? (Array.isArray(data.results) ? data.results.filter((r) => r.success).length : null);
        status(successCount === null ? (data.message || 'Máy chủ xác nhận đã xử lý yêu cầu.') : `Máy chủ báo hoàn thành ${successCount}/${data.total ?? selected.length} bài.`, 'success');
      } else {
        status(data.message || 'Máy chủ đã nhận yêu cầu nhưng chưa xác nhận hoàn thành.', 'pending');
      }
    } catch (e) { status(e.message, 'error'); }
    finally { busy('doExercisesBtn', false); }
  });

  $('getAnswersBtn')?.addEventListener('click', async () => {
    busy('getAnswersBtn', true, 'Đang tra cứu…');
    try {
      const exerciseUrl = ($('exerciseUrl')?.value || '').trim();
      if (!/^https:\/\//i.test(exerciseUrl)) throw new Error('Vui lòng nhập URL HTTPS hợp lệ.');
      const data = await post('/panel/get-answers', { exercise_url: exerciseUrl, account_id: accountId() });
      show('answersOutput', data);
      if (data.success === true || data.ok === true) status('Máy chủ đã trả dữ liệu tra cứu.', 'success');
      else status(data.message || 'Máy chủ chưa xác nhận có dữ liệu đáp án.', 'pending');
    } catch (e) { show('answersOutput', { error: e.message }); status(e.message, 'error'); }
    finally { busy('getAnswersBtn', false); }
  });
})();
