(() => {
  'use strict';

  const WEB_APP_URL =
    'https://script.google.com/macros/s/AKfycbxvqWwNRKu5GpoVRyDZGdwXRy6ubEgPAg2-stv-G-arF4HRoqkAfP21oTl124ne6CvZ/exec';
  const API_URL = WEB_APP_URL + '?mode=innovation';
  let allItems = [];

  const escapeHtml = value => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  const safeUrl = value => {
    const url = String(value || '').trim();
    if (!/^https?:\/\//i.test(url)) return '';
    return url.replace(/^http:\/\//i, 'https://');
  };

  function renderItems(type) {
    const grid = document.getElementById('innovationGrid');
    if (!grid) return;

    const selectedType = String(type || '').trim();
    const items = selectedType
      ? allItems.filter(item => item.mediaType === selectedType)
      : allItems;

    if (!items.length) {
      grid.innerHTML = '<div class="innovation-empty">ไม่พบรายการในประเภทสื่อที่เลือก</div>';
      return;
    }

    grid.innerHTML = items.map((item, index) => {
      const poster = safeUrl(item.poster);
      const openUrl = safeUrl(item.openUrl);
      if (!poster) return '';

      const button = openUrl
        ? `<a class="innovation-open" href="${escapeHtml(openUrl)}"
             target="_blank" rel="noopener noreferrer">Open file</a>`
        : '';

      return `<article class="innovation-card">
        <div class="innovation-poster-wrap">
          <img class="innovation-poster" src="${escapeHtml(poster)}"
               alt="${escapeHtml(item.mediaName || `สื่อรายการที่ ${index + 1}`)}" loading="lazy">
        </div>
        <h2 class="innovation-name">${escapeHtml(item.mediaName || 'ไม่ระบุชื่อสื่อ')}</h2>
        <p class="innovation-type">${escapeHtml(item.mediaType || 'ไม่ระบุประเภท')}</p>
        ${button}
      </article>`;
    }).join('');

    if (!grid.children.length) {
      grid.innerHTML = '<div class="innovation-empty">ไม่พบรายการที่มีรูป Poster</div>';
    }
  }

  function buildFilter(items) {
    const select = document.getElementById('innovationTypeFilter');
    if (!select) return;

    const types = [...new Set(
      items.map(item => item.mediaType).filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, 'th'));

    select.innerHTML = '<option value="">ทั้งหมด</option>' +
      types.map(type => `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`).join('');
    select.disabled = false;
    select.addEventListener('change', () => renderItems(select.value));
  }

  async function loadInnovations() {
    const status = document.getElementById('innovationStatus');
    const grid = document.getElementById('innovationGrid');
    if (!status || !grid) return;

    try {
      const response = await fetch(API_URL + '&_t=' + Date.now(), {
        method: 'GET',
        cache: 'no-store'
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      if (result.success === false) throw new Error(result.message || 'โหลดข้อมูลไม่สำเร็จ');

      allItems = (Array.isArray(result.items) ? result.items : [])
        .map(item => ({
          mediaType: String(item.mediaType || '').trim(),
          mediaName: String(item.mediaName || '').trim(),
          poster: String(item.poster || '').trim(),
          openUrl: String(item.openUrl || '').trim()
        }))
        .filter(item => item.mediaType || item.mediaName || item.poster || item.openUrl);

      status.hidden = true;
      buildFilter(allItems);

      if (!allItems.length) {
        grid.innerHTML = '<div class="innovation-empty">ยังไม่มีรายการสื่อ/นวัตกรรม</div>';
        return;
      }

      renderItems('');
    } catch (error) {
      console.error('โหลดสื่อ/นวัตกรรมไม่สำเร็จ:', error);
      status.hidden = true;
      grid.innerHTML = `<div class="innovation-error">โหลดรายการไม่สำเร็จ<br>${escapeHtml(error.message)}</div>`;
    }
  }

  document.addEventListener('DOMContentLoaded', loadInnovations);
})();
