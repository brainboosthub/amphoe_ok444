(() => {
  'use strict';

  const API_URL = 'https://script.google.com/macros/s/AKfycbxvqWwNRKu5GpoVRyDZGdwXRy6ubEgPAg2-stv-G-arF4HRoqkAfP21oTl124ne6CvZ/exec';
  const CONFIG = {
    text: { title: 'แก้ไขข้อความ', range: 'setting!S1:T4' },
    image: { title: 'แก้ไขโลโก้ ชื่อ รูปหัวเว็บไซต์', range: 'website_image!A1:B4' }
  };
  let activeHighlight = '';
  const highlightBox = document.createElement('div');
  highlightBox.className = 'editwebsite-highlight-box';
  highlightBox.setAttribute('aria-hidden', 'true');

  function getUnionRect(elements) {
    const rects = elements
      .filter(element => element && !element.hidden)
      .map(element => element.getBoundingClientRect())
      .filter(rect => rect.width > 0 && rect.height > 0);
    if (!rects.length) return null;
    return {
      top: Math.min(...rects.map(rect => rect.top)),
      left: Math.min(...rects.map(rect => rect.left)),
      right: Math.max(...rects.map(rect => rect.right)),
      bottom: Math.max(...rects.map(rect => rect.bottom))
    };
  }

  function updateHighlight() {
    if (!activeHighlight) return;
    const targets = activeHighlight === 'text'
      ? ['heroKickerText', 'heroTitleText', 'heroDescriptionText'].map(id => document.getElementById(id))
      : [document.getElementById('websiteHeroOverlay')];
    const rect = getUnionRect(targets);
    if (!rect) return hideHighlight();
    const padding = activeHighlight === 'text' ? 18 : 5;
    highlightBox.style.top = `${Math.max(3, rect.top - padding)}px`;
    highlightBox.style.left = `${Math.max(3, rect.left - padding)}px`;
    highlightBox.style.width = `${Math.min(window.innerWidth - Math.max(3, rect.left - padding) - 3, rect.right - rect.left + padding * 2)}px`;
    highlightBox.style.height = `${Math.min(window.innerHeight - Math.max(3, rect.top - padding) - 3, rect.bottom - rect.top + padding * 2)}px`;
    highlightBox.classList.add('is-visible');
  }

  function showHighlight(type) {
    activeHighlight = type;
    document.body.classList.toggle('editwebsite-highlight-image', type === 'image');
    updateHighlight();
  }

  function hideHighlight() {
    activeHighlight = '';
    highlightBox.classList.remove('is-visible');
    document.body.classList.remove('editwebsite-highlight-image');
  }

  const escapeHtml = value => String(value ?? '').replace(/[&<>"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
  })[char]);

  async function request(params) {
    const token = sessionStorage.getItem('mysiteAdminToken') || '';
    const response = await fetch(API_URL, {
      method: 'POST', cache: 'no-store',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(Object.assign({}, params, { token }))
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    if (result.success === false) throw new Error(result.message || 'ดำเนินการไม่สำเร็จ');
    return result;
  }

  function applyPreview(type, values) {
    if (type === 'text') {
      ['heroKickerText', 'heroTitleText', 'heroDescriptionText'].forEach((id, index) => {
        const element = document.getElementById(id);
        if (!element) return;
        element.textContent = values[index] || '';
        element.hidden = !values[index];
      });
      return;
    }

    const logoUrl = values[0] || '';
    const brandName = values[1] || '';
    const heroUrl = values[2] || '';
    document.querySelectorAll('[data-website-brand-icon]').forEach(icon => {
      icon.textContent = '';
      icon.style.backgroundImage = logoUrl ? `url("${logoUrl}")` : '';
      icon.style.backgroundSize = 'cover';
      icon.style.backgroundPosition = 'center';
    });
    document.querySelectorAll('[data-website-brand-name]').forEach(name => {
      name.textContent = brandName;
    });
    if (brandName) document.title = brandName;
    const overlay = document.getElementById('websiteHeroOverlay');
    if (overlay && heroUrl) {
      overlay.style.backgroundImage = `linear-gradient(90deg,rgba(5,28,44,.96) 0%,rgba(5,28,44,.79) 40%,rgba(5,28,44,.1) 78%),url("${heroUrl}")`;
      overlay.style.backgroundSize = 'cover';
      overlay.style.backgroundPosition = 'center';
      overlay.classList.add('website-hero-ready');
    }
  }

  async function openEditor(type) {
    const config = CONFIG[type];
    if (!config || !window.Swal) return;

    Swal.fire({ title: 'กำลังโหลดข้อมูล...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
      const result = await request({ mode: 'editwebsite', editor: type });
      const rows = Array.isArray(result.rows) ? result.rows : [];
      const headers = Array.isArray(result.headers) ? result.headers : ['รายการ', 'ข้อมูล'];
      const html = `<div class="editwebsite-popup"><table class="editwebsite-table"><thead><tr><th>${escapeHtml(headers[0] || 'รายการ')}</th><th>${escapeHtml(headers[1] || 'ข้อมูล')}</th></tr></thead><tbody>${rows.map((row, index) => `<tr><td>${escapeHtml(row.label)}</td><td><textarea class="editwebsite-input" data-row="${index}" rows="${type === 'text' && index === 2 ? 3 : 2}">${escapeHtml(row.value)}</textarea></td></tr>`).join('')}</tbody></table><div id="editwebsiteStatus" class="editwebsite-status">แก้ไขข้อมูล แล้วกด “บันทึก”</div></div>`;

      const modal = await Swal.fire({
        title: config.title,
        html,
        width: type === 'text' ? 760 : 820,
        showCancelButton: true,
        confirmButtonText: 'บันทึก',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#dc2626',
        focusConfirm: false,
        preConfirm: async () => {
          const values = Array.from(Swal.getPopup().querySelectorAll('.editwebsite-input')).map(input => input.value.trim());
          const status = document.getElementById('editwebsiteStatus');
          status.textContent = 'กำลังบันทึก...';
          status.classList.remove('is-error');
          try {
            await request({ mode: 'saveeditwebsite', editor: type, values: JSON.stringify(values) });
            return values;
          } catch (error) {
            status.textContent = error.message;
            status.classList.add('is-error');
            Swal.showValidationMessage(error.message);
            return false;
          }
        }
      });

      if (modal.isConfirmed) {
        applyPreview(type, modal.value);
        Swal.fire({ icon: 'success', title: 'บันทึกแล้ว', text: 'หน้าเว็บไซต์อัปเดตทันที', timer: 1500, showConfirmButton: false });
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'โหลดข้อมูลไม่สำเร็จ', text: error.message, confirmButtonText: 'ตกลง' });
    }
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-editwebsite]');
    if (button) openEditor(button.dataset.editwebsite);
  });

  document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(highlightBox);
    document.querySelectorAll('.editwebsite-btn[data-editwebsite]').forEach(button => {
      const type = button.dataset.editwebsite;
      button.addEventListener('mouseenter', () => showHighlight(type));
      button.addEventListener('mouseleave', hideHighlight);
      button.addEventListener('focus', () => showHighlight(type));
      button.addEventListener('blur', hideHighlight);
    });
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight, { passive: true });
  });
})();
