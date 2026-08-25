(() => {
  'use strict';

  const API_URL =
    'https://script.google.com/macros/s/AKfycbxvqWwNRKu5GpoVRyDZGdwXRy6ubEgPAg2-stv-G-arF4HRoqkAfP21oTl124ne6CvZ/exec';

  const fields = {
    userTotal: 'userTotalBox',
    userPrimary: 'userPrimaryBox',
    userMiddle: 'userMiddleBox',
    userHigh: 'userHighBox',
    adminTotal: 'adminTotalBox',
    adminPrimary: 'adminPrimaryBox',
    adminMiddle: 'adminMiddleBox',
    adminHigh: 'adminHighBox',
    registrationCount: 'registrationCountBox',
    loginCount: 'loginCountBox',
    adminLoginCount: 'adminLoginCountBox',
    userLoginCount: 'userLoginCountBox',
    websiteVisitCount: 'websiteVisitCountBox'
  };

  function setValue(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = Number(value || 0).toLocaleString('th-TH');
  }

  async function loadHomeSummary() {
    const section = document.getElementById('homeSection');
    if (!section) return;

    section.classList.add('home-summary-loading');

    try {
      const url = new URL(API_URL);
      url.searchParams.set('mode', 'homeSummary');
      url.searchParams.set('_t', Date.now());

      const response = await fetch(url.toString(), { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const result = await response.json();
      if (result.success === false) {
        throw new Error(result.message || 'โหลดข้อมูลสรุปไม่สำเร็จ');
      }

      const data = result.data || result;
      Object.entries(fields).forEach(([key, id]) => setValue(id, data[key]));
    } catch (error) {
      console.error('loadHomeSummary error:', error);
    } finally {
      section.classList.remove('home-summary-loading');
    }
  }

  document.addEventListener('DOMContentLoaded', loadHomeSummary);
})();
