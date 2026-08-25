(() => {
  'use strict';

  const WEB_APP_URL =
    'https://script.google.com/macros/s/AKfycbxvqWwNRKu5GpoVRyDZGdwXRy6ubEgPAg2-stv-G-arF4HRoqkAfP21oTl124ne6CvZ/exec';
  const API_URL = WEB_APP_URL + '?mode=media';
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

  const filterElements = {
    title: document.getElementById('mediaTitleFilter'),
    subject: document.getElementById('mediaSubjectFilter'),
    grade: document.getElementById('mediaGradeFilter'),
    mediaType: document.getElementById('mediaTypeFilter')
  };
  const searchInput = document.getElementById('mediaSearch');

  function getFilteredItems() {
    const keyword = String(searchInput?.value || '').trim().toLocaleLowerCase('th');

    return allItems.filter(item => {
      const matchesFilters =
        (!filterElements.title.value || item.title === filterElements.title.value) &&
        (!filterElements.subject.value || item.subject === filterElements.subject.value) &&
        (!filterElements.grade.value || item.grade === filterElements.grade.value) &&
        (!filterElements.mediaType.value || item.mediaType === filterElements.mediaType.value);

      if (!matchesFilters || !keyword) return matchesFilters;

      const searchableText = [
        item.title,
        item.subject,
        item.grade,
        item.mediaType,
        item.owner
      ].join(' ').toLocaleLowerCase('th');

      return searchableText.includes(keyword);
    });
  }

  function renderItems() {
    const grid = document.getElementById('mediaGrid');
    if (!grid) return;

    const items = getFilteredItems();
    if (!items.length) {
      grid.innerHTML = '<div class="media-empty">ไม่พบรายการตามตัวกรองที่เลือก</div>';
      return;
    }

    grid.innerHTML = items.map((item, index) => {
      const image = safeUrl(item.image);
      const fileUrl = safeUrl(item.fileUrl);
      const imageHtml = image
        ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(item.title || `สื่อรายการที่ ${index + 1}`)}" loading="lazy">`
        : '<div class="media-no-image" aria-hidden="true">📚</div>';
      const button = fileUrl
        ? `<a class="media-open" href="${escapeHtml(fileUrl)}" target="_blank" rel="noopener noreferrer">Open File</a>`
        : '<span class="media-open is-disabled">ไม่มีไฟล์</span>';

      return `<article class="media-card">
        <div class="media-card-image">${imageHtml}</div>
        <div class="media-card-body">
          <h2>${escapeHtml(item.title || 'ไม่ระบุชื่อเรื่อง')}</h2>
          <dl>
            <div><dt>วิชา</dt><dd>${escapeHtml(item.subject || '-')}</dd></div>
            <div><dt>ชั้น</dt><dd>${escapeHtml(item.grade || '-')}</dd></div>
            <div><dt>ประเภทสื่อ</dt><dd>${escapeHtml(item.mediaType || '-')}</dd></div>
            <div><dt>เจ้าของผลงาน</dt><dd>${escapeHtml(item.owner || '-')}</dd></div>
          </dl>
          ${button}
        </div>
      </article>`;
    }).join('');
  }

  function fillFilter(select, key) {
    const values = [...new Set(allItems.map(item => item[key]).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'th'));

    select.innerHTML = '<option value="">ทั้งหมด</option>' +
      values.map(value => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join('');
    select.disabled = false;
    select.addEventListener('change', renderItems);
  }

  async function loadMedia() {
    const status = document.getElementById('mediaStatus');
    const grid = document.getElementById('mediaGrid');

    try {
      const response = await fetch(API_URL, { method: 'GET', cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      if (result.success === false) {
        throw new Error(result.message || 'โหลดข้อมูลไม่สำเร็จ');
      }

      allItems = (Array.isArray(result.items) ? result.items : [])
        .map(item => ({
          mediaType: String(item.mediaType || '').trim(),
          title: String(item.title || '').trim(),
          subject: String(item.subject || '').trim(),
          grade: String(item.grade || '').trim(),
          fileUrl: String(item.fileUrl || '').trim(),
          image: String(item.image || '').trim(),
          owner: String(item.owner || '').trim()
        }))
        .filter(item => Object.values(item).some(Boolean));

      status.hidden = true;

      Object.entries(filterElements).forEach(([key, select]) => {
        fillFilter(select, key);
      });

      if (searchInput) {
        searchInput.addEventListener('input', renderItems);
      }

      if (!allItems.length) {
        grid.innerHTML = '<div class="media-empty">ยังไม่มีรายการในคลังสื่อการสอน</div>';
        return;
      }

      renderItems();
    } catch (error) {
      console.error('โหลดคลังสื่อการสอนไม่สำเร็จ:', error);
      status.hidden = true;
      grid.innerHTML = `<div class="media-error">โหลดรายการไม่สำเร็จ<br>${escapeHtml(error.message)}</div>`;
    }
  }

  document.addEventListener('DOMContentLoaded', loadMedia);
})();
