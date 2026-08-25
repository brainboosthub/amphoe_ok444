(() => {
  'use strict';
  const API_URL = 'https://script.google.com/macros/s/AKfycbxvqWwNRKu5GpoVRyDZGdwXRy6ubEgPAg2-stv-G-arF4HRoqkAfP21oTl124ne6CvZ/exec';
  const gate = document.getElementById('mysiteLoginGate');
  const form = document.getElementById('mysiteLoginForm');
  const status = document.getElementById('mysiteLoginStatus');
  const submit = document.getElementById('mysiteLoginButton');

  async function api(payload) {
    const response = await fetch(API_URL, { method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'ดำเนินการไม่สำเร็จ');
    return result;
  }

  function unlock(token, username) {
    sessionStorage.setItem('mysiteAdminToken', token);
    sessionStorage.setItem('mysiteAdminName', username || 'Admin');
    gate.hidden = true;
    document.body.classList.remove('mysite-locked');
  }

  form.addEventListener('submit', async event => {
    event.preventDefault(); status.textContent = ''; submit.disabled = true; submit.textContent = 'กำลังตรวจสอบ...';
    try {
      const result = await api({ mode: 'adminlogin', username: form.username.value.trim(), password: form.password.value });
      unlock(result.token, result.username);
    } catch (error) { status.textContent = error.message; }
    finally { submit.disabled = false; submit.textContent = 'เข้าสู่ระบบ'; }
  });

  document.getElementById('mysiteForgotButton').addEventListener('click', async () => {
    const modal = await Swal.fire({ title: 'ลืมรหัสผ่าน', input: 'email', inputLabel: 'กรอก Email ที่ลงทะเบียนไว้', inputPlaceholder: 'name@example.com', showCancelButton: true, confirmButtonText: 'ส่งข้อมูลเข้าสู่ Email', cancelButtonText: 'ยกเลิก', confirmButtonColor: '#dc2626', inputValidator: value => !value ? 'กรุณากรอก Email' : undefined });
    if (!modal.isConfirmed) return;
    Swal.fire({ title: 'กำลังส่ง Email...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try { await api({ mode: 'adminforgot', email: modal.value.trim() }); Swal.fire({ icon: 'success', title: 'ส่ง Email แล้ว', text: 'กรุณาตรวจสอบกล่องจดหมายและจดหมายขยะ' }); }
    catch (error) { Swal.fire({ icon: 'error', title: 'ส่งไม่สำเร็จ', text: error.message }); }
  });

  document.getElementById('mysiteTogglePassword').addEventListener('click', event => {
    const input = document.getElementById('mysitePassword'); input.type = input.type === 'password' ? 'text' : 'password';
    event.currentTarget.querySelector('i').className = input.type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
  });

  sessionStorage.removeItem('mysiteAdminToken');
})();
