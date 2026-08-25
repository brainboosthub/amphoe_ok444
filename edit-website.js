(() => {
  'use strict';

  const API_URL = 'https://script.google.com/macros/s/AKfycbxvqWwNRKu5GpoVRyDZGdwXRy6ubEgPAg2-stv-G-arF4HRoqkAfP21oTl124ne6CvZ/exec';
  const CONFIG = {
    text: { title: 'แก้ไขข้อความ', range: 'setting!S1:T4' },
    image: { title: 'แก้ไขโลโก้ ชื่อ รูปหัวเว็บไซต์', range: 'website_image!A1:B4' }
  };

  const escapeHtml = value => String(value ?? '').replace(/[&<>"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'
  })[char]);

  async function request(params) {
    const url = new URL(API_URL);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    url.searchParams.set('_t', Date.now());
    const response = await fetch(url, { method: 'GET', cache: 'no-store' });
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
})();
