(() => {
  'use strict';

  const ACTIVITY_API_URL =
    'https://script.google.com/macros/s/AKfycbxvqWwNRKu5GpoVRyDZGdwXRy6ubEgPAg2-stv-G-arF4HRoqkAfP21oTl124ne6CvZ/exec?mode=activity';

  const state = {
    items: []
  };

  const escapeHtml = (value) => String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

  function normalizeActivity(row) {
 return {
  title: String(
    row.title ??
    row.topic ??
    ''
  ).trim(),

  image: String(
    row.image ??
    row.imageUrl ??
    ''
  ).trim(),

  url: String(
    row.url ??
    row.link ??
    ''
  ).trim(),

  date: String(
    row.date ??
    ''
  ).trim()
};
  }


  function renderActivities(items) {
    const grid = document.getElementById('activityBoxGrid');
    const status = document.getElementById('activityBoxStatus');

    if (!grid || !status) return;

    if (!items.length) {
      grid.innerHTML = '';
      status.hidden = false;
      status.textContent = 'ยังไม่มีข้อมูลกิจกรรม';
      return;
    }

    status.hidden = true;

    grid.innerHTML = items.map((item, index) => {
      const title = escapeHtml(item.title || 'กิจกรรม');
      const image = escapeHtml(
        item.image ||
        'https://placehold.co/900x650?text=Activity'
      );
      const url = escapeHtml(item.url || '');
      const clickableClass = item.url ? ' is-clickable' : '';

      return `
        <article class="activity-box-card${clickableClass}">
          <a class="activity-box-image-link"
             href="${url || '#'}"
             ${item.url ? 'target="_blank" rel="noopener noreferrer"' : ''}
             aria-label="เปิดรายละเอียด ${title}"
             ${item.url ? '' : 'aria-disabled="true" tabindex="-1"'}>
            <img
              src="${image}"
              alt="${title}"
              loading="lazy"
              onerror="this.onerror=null;this.src='https://placehold.co/900x650?text=Activity';">
            <span class="activity-box-badge">
              <i class="fa fa-star" aria-hidden="true"></i>
              กิจกรรม
            </span>
          </a>

<div class="activity-box-card-body">

    <h3>${title}</h3>

    ${
      item.date
      ? `<div class="activity-box-date">
            <i class="fa fa-calendar"></i>
            ${escapeHtml(item.date)}
         </div>`
      : ''
    }

</div>
        </article>
      `;
    }).join('');
  }

async function loadActivities() {
  const status = document.getElementById('activityBoxStatus');

  try {
    const response = await fetch(
      ACTIVITY_API_URL + '&_t=' + Date.now(),
      {
        method: 'GET',
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(
        result.message || 'โหลดข้อมูลกิจกรรมไม่สำเร็จ'
      );
    }

state.items = (result.activities || [])
  .map(normalizeActivity)
  .filter(item => item.title || item.image)
  .slice(0, 5);   // แสดงเฉพาะ 5 รายการล่าสุด

    renderActivities(state.items);

  } catch (error) {
    console.error('Activity Box:', error);

    if (status) {
      status.hidden = false;
      status.textContent =
        'ไม่สามารถโหลดข้อมูลกิจกรรมได้ กรุณาตรวจสอบ Apps Script';
    }
  }
}

  document.addEventListener('DOMContentLoaded', loadActivities);
})();

