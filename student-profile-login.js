(() => {
  'use strict';

  const PROFILE_URL = String(window.STUDENT_PROFILE_WEB_APP_URL || '').trim();
  const REQUEST_TIMEOUT = 30000;

  function showMessage(options) {
    if (window.Swal) return Swal.fire(options);
    window.alert(options.text || options.title || 'เกิดข้อผิดพลาด');
    return Promise.resolve();
  }

  function requestProfile(rollno) {
    return new Promise((resolve, reject) => {
      if (!/^https:\/\/script\.google\.com\/macros\/s\//i.test(PROFILE_URL)) {
        reject(new Error('ยังไม่ได้กำหนด URL ของ Apps Script ระบบโปรไฟล์'));
        return;
      }

      const callbackName = `studentProfileCallback_${Date.now()}_${Math.random()
        .toString(36).slice(2)}`;
      const script = document.createElement('script');
      const timer = window.setTimeout(() => {
        cleanup();
        reject(new Error('Apps Script ใช้เวลาตอบกลับนานเกินไป'));
      }, REQUEST_TIMEOUT);

      function cleanup() {
        window.clearTimeout(timer);
        delete window[callbackName];
        script.remove();
      }

      window[callbackName] = result => {
        cleanup();
        resolve(result || {});
      };

      script.onerror = () => {
        cleanup();
        reject(new Error('ไม่สามารถเชื่อมต่อ Apps Script ระบบโปรไฟล์ได้'));
      };

      const url = new URL(PROFILE_URL);
      url.searchParams.set('mode', 'githubProfileLogin');
      url.searchParams.set('rollno', rollno);
      url.searchParams.set('callback', callbackName);
      url.searchParams.set('_t', Date.now());
      script.src = url.toString();
      document.head.appendChild(script);
    });
  }

  async function login(event) {
    event.preventDefault();

    const input = document.getElementById('studentServicesId');
    const button = document.getElementById('studentServicesLoginBtn');
    const rollno = String(input?.value || '').replace(/\D/g, '').trim();

    if (!rollno) {
      await showMessage({
        icon: 'warning',
        title: 'กรุณากรอกรหัสนักศึกษา',
        text: 'ระบุรหัสนักศึกษาก่อนเข้าสู่ระบบ',
        confirmButtonText: 'ตกลง'
      });
      input?.focus();
      return;
    }

    if (input) input.value = rollno;
    if (button) button.disabled = true;

    if (window.Swal) {
      Swal.fire({
        title: '<p style="font-size:20px;font-weight:700;margin:0">เรากำลังนำท่านเข้าสู่ระบบ<br>กรุณารอ...</p>',
        html: 'Getting response from the server...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading()
      });
    }

    try {
      const result = await requestProfile(rollno);

      if (!result.success) {
        throw new Error('ไม่พบข้อมูลรหัสนักศึกษา');
      }

      sessionStorage.setItem('SSS_PROFILE_ROLLNO', rollno);
      if (window.Swal) Swal.close();

      const profileUrl =
        `profile.html?rollno=${encodeURIComponent(rollno)}&_t=${Date.now()}`;
      window.location.replace(profileUrl);
    } catch (error) {
      if (window.Swal) Swal.close();
      await showMessage({
        icon: 'error',
        title: 'เข้าสู่ระบบไม่สำเร็จ',
        text: error.message || 'กรุณาตรวจสอบรหัสนักศึกษาแล้วลองอีกครั้ง',
        confirmButtonText: 'ลองอีกครั้ง'
      });
      input?.focus();
    } finally {
      if (button) button.disabled = false;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('studentServicesLoginForm');
    const input = document.getElementById('studentServicesId');

    input?.addEventListener('input', () => {
      input.value = input.value.replace(/\D/g, '').slice(0, 10);
    });
    form?.addEventListener('submit', login);
  });
})();
