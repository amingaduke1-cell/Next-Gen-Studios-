
const app = (() => {
  const LS_USERS = 'hc_users';
  const LS_APPTS = 'hc_appointments';
  const LS_PATIENTS = 'hc_patients';
  const LS_DOCTORS = 'hc_doctors';

  function ensureDefaultAdmin(){
    let users = JSON.parse(localStorage.getItem(LS_USERS) || '[]');
    if(!users.find(u=>u.email==='admin@hospital.com')){
      users.push({name:'Admin', email:'admin@hospital.com', password:'admin123', role:'admin'});
      localStorage.setItem(LS_USERS, JSON.stringify(users));
    }
  }

  function signupBind(){
    const f = document.getElementById('signupForm');
    if(!f) return;
    f.addEventListener('submit', e=>{
      e.preventDefault();
      const name = document.getElementById('su_name').value.trim();
      const email = document.getElementById('su_email').value.trim().toLowerCase();
      const pass = document.getElementById('su_password').value;
      let users = JSON.parse(localStorage.getItem(LS_USERS) || '[]');
      if(users.find(u=>u.email===email)){ alert('Email already registered'); return; }
      users.push({name,email,password:pass,role:'patient'});
      localStorage.setItem(LS_USERS, JSON.stringify(users));
      alert('Account created. You can login now.');
      window.location.href = 'login.html';
    });
  }

  function loginBind(){
    const f = document.getElementById('loginForm');
    if(!f) return;
    f.addEventListener('submit', e=>{
      e.preventDefault();
      const email = document.getElementById('li_email').value.trim().toLowerCase();
      const pass = document.getElementById('li_password').value;
      let users = JSON.parse(localStorage.getItem(LS_USERS) || '[]');
      const user = users.find(u=>u.email===email && u.password===pass);
      if(!user){ alert('Invalid credentials'); return; }
      sessionStorage.setItem('hc_session', JSON.stringify({email:user.email, name:user.name, role:user.role}));
      if(user.role==='admin') window.location.href='dashboard.html';
      else window.location.href='appointments.html';
    });
  }

  function logoutBind(){
    const logoutLink = document.getElementById('logoutLink');
    if(logoutLink){
      logoutLink.addEventListener('click', e=>{
        e.preventDefault();
        sessionStorage.removeItem('hc_session');
        window.location.href = 'index.html';
      });
    }
  }

  function requireAuthAdmin(){
    const s = JSON.parse(sessionStorage.getItem('hc_session') || 'null');
    if(!s || s.role!=='admin'){ window.location.href='login.html'; return false; }
    return true;
  }

  function bookingBind(){
    const f = document.getElementById('bookingForm');
    if(!f) return;
    f.addEventListener('submit', e=>{
      e.preventDefault();
      const name = document.getElementById('p_name').value.trim();
      const email = document.getElementById('p_email').value.trim();
      const doctor = document.getElementById('p_doctor').value;
      const date = document.getElementById('p_date').value;
      const time = document.getElementById('p_time').value;
      if(!name || !email || !date || !time) { alert('Fill all fields'); return; }
      let appts = JSON.parse(localStorage.getItem(LS_APPTS) || '[]');
      const id = Date.now();
      appts.push({id,name,email,doctor,date,time,status:'booked'});
      localStorage.setItem(LS_APPTS, JSON.stringify(appts));
      alert('Appointment booked');
      f.reset();
      renderAppointmentsList();
      
      if(window.location.pathname.endsWith('dashboard.html')) renderDashboardStats();
    });
  }

  function renderAppointmentsList(){
    const list = document.getElementById('appointmentsList');
    if(!list) return;
    let appts = JSON.parse(localStorage.getItem(LS_APPTS) || '[]');
    list.innerHTML = '';
    appts.forEach(a=>{
      const li = document.createElement('li');
      li.textContent = `${a.date} ${a.time} — ${a.name} with Dr ${getDoctorName(a.doctor)} `;
      const del = document.createElement('button'); del.textContent='Cancel'; del.className='btn small';
      del.style.marginLeft='8px';
      del.addEventListener('click', ()=>{ removeAppointment(a.id); });
      li.appendChild(del);
      list.appendChild(li);
    });
  }

  function removeAppointment(id){
    let appts = JSON.parse(localStorage.getItem(LS_APPTS) || '[]');
    appts = appts.filter(x=>x.id !== id);
    localStorage.setItem(LS_APPTS, JSON.stringify(appts));
    renderAppointmentsList();
    renderDashboardStats();
  }
  function ensureDefaultDoctors(){
    let docs = JSON.parse(localStorage.getItem(LS_DOCTORS) || '[]');
    if(docs.length===0){
      docs = [
        {id:1,name:'Dr. Mary Otieno',spec:'Cardiology'},
        {id:2,name:'Dr. Daniel Mwangi',spec:'Geriatrics'},
        {id:3,name:'Dr. Aisha Noor',spec:'General Medicine'}
      ];
      localStorage.setItem(LS_DOCTORS, JSON.stringify(docs));
    }
  }

  function getDoctorName(id){
    const docs = JSON.parse(localStorage.getItem(LS_DOCTORS) || '[]');
    const d = docs.find(x=>String(x.id)===String(id));
    return d ? d.name : 'Unknown';
  }

  /* ---------- Dashboard CRUD ---------- */
  function dashboardBind(){
    if(!document.getElementById('page-dashboard')) return;
    if(!requireAuthAdmin()) return;
    // tabs
    document.querySelectorAll('.dash-tab').forEach(a=>{
      a.addEventListener('click', e=>{
        e.preventDefault();
        document.querySelectorAll('.dash-tab').forEach(x=>x.classList.remove('active'));
        a.classList.add('active');
        document.querySelectorAll('.dash-pane').forEach(p=>p.classList.remove('active'));
        const pane = document.querySelector(a.getAttribute('href'));
        if(pane) pane.classList.add('active');
      });
    });

    // forms
    const userAdd = document.getElementById('userAddForm');
    userAdd && userAdd.addEventListener('submit', e=>{
      e.preventDefault();
      const name = document.getElementById('u_name').value.trim();
      const email = document.getElementById('u_email').value.trim().toLowerCase();
      const pass = document.getElementById('u_pass').value;
      let users = JSON.parse(localStorage.getItem(LS_USERS) || '[]');
      users.push({name,email,password:pass,role:'staff'});
      localStorage.setItem(LS_USERS, JSON.stringify(users));
      renderUsers();
      userAdd.reset();
    });

    const patientAdd = document.getElementById('patientAddForm');
    patientAdd && patientAdd.addEventListener('submit', e=>{
      e.preventDefault();
      const name = document.getElementById('pt_name').value.trim();
      const age = document.getElementById('pt_age').value;
      const contact = document.getElementById('pt_contact').value.trim();
      let pts = JSON.parse(localStorage.getItem(LS_PATIENTS) || '[]');
      pts.push({id:Date.now(),name,age,contact});
      localStorage.setItem(LS_PATIENTS, JSON.stringify(pts));
      renderPatients();
      patientAdd.reset();
    });

    const docAdd = document.getElementById('doctorAddForm');
    docAdd && docAdd.addEventListener('submit', e=>{
      e.preventDefault();
      const name = document.getElementById('doc_name').value.trim();
      const spec = document.getElementById('doc_spec').value.trim();
      let docs = JSON.parse(localStorage.getItem(LS_DOCTORS) || '[]');
      docs.push({id:Date.now(),name,spec});
      localStorage.setItem(LS_DOCTORS, JSON.stringify(docs));
      renderDoctors();
      docAdd.reset();
    });

    renderUsers(); renderPatients(); renderDoctors(); renderAdminAppointments(); renderDashboardStats();
  }

  function renderUsers(){
    const tbody = document.querySelector('#usersTable tbody');
    let users = JSON.parse(localStorage.getItem(LS_USERS) || '[]');
    tbody.innerHTML = '';
    users.forEach((u,i)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${u.name}</td><td>${u.email}</td><td><button class="btn small" data-i="${i}" data- action="del-user">Delete</button></td>`;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('button[data-action="del-user"]').forEach(b=>{
      b.addEventListener('click', ()=>{ 
        const idx = Number(b.getAttribute('data-i'));
        users.splice(idx,1); localStorage.setItem(LS_USERS, JSON.stringify(users)); renderUsers();
      });
    });
  }

  function renderPatients(){
    const tbody = document.querySelector('#patientsTable tbody');
    let pts = JSON.parse(localStorage.getItem(LS_PATIENTS) || '[]');
    tbody.innerHTML = '';
    pts.forEach((p,i)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${p.name}</td><td>${p.age}</td><td>${p.contact||''}</td><td><button class="btn small" data-i="${i}" data-action="del-patient">Delete</button></td>`;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('button[data-action="del-patient"]').forEach(b=>{
      b.addEventListener('click', ()=>{
        const idx = Number(b.getAttribute('data-i'));
        pts.splice(idx,1); localStorage.setItem(LS_PATIENTS, JSON.stringify(pts)); renderPatients(); renderDashboardStats();
      });
    });
  }

  function renderDoctors(){
    const tbody = document.querySelector('#doctorsTable tbody');
    let docs = JSON.parse(localStorage.getItem(LS_DOCTORS) || '[]');
    tbody.innerHTML = '';
    docs.forEach((d,i)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${d.name}</td><td>${d.spec}</td><td><button class="btn small" data-i="${i}" data-action="del-doc">Delete</button></td>`;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('button[data-action="del-doc"]').forEach(b=>{
      b.addEventListener('click', ()=>{
        const idx = Number(b.getAttribute('data-i'));
        docs.splice(idx,1); localStorage.setItem(LS_DOCTORS, JSON.stringify(docs)); renderDoctors();
      });
    });
  }

  function renderAdminAppointments(){
    const tbody = document.querySelector('#adminAppointmentsTable tbody');
    let appts = JSON.parse(localStorage.getItem(LS_APPTS) || '[]');
    tbody.innerHTML = '';
    appts.forEach((a,i)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${a.name}</td><td>${getDoctorName(a.doctor)}</td><td>${a.date} ${a.time}</td><td><button class="btn small" data-i="${i}" data-action="del-appt">Delete</button></td>`;
      tbody.appendChild(tr);
    });
    tbody.querySelectorAll('button[data-action="del-appt"]').forEach(b=>{
      b.addEventListener('click', ()=>{
        const idx = Number(b.getAttribute('data-i'));
        appts.splice(idx,1); localStorage.setItem(LS_APPTS, JSON.stringify(appts)); renderAdminAppointments(); renderDashboardStats();
      });
    });
  }

  function renderDashboardStats(){
    document.getElementById('statUsers').textContent = (JSON.parse(localStorage.getItem(LS_USERS) || '[]')).length;
    document.getElementById('statPatients').textContent = (JSON.parse(localStorage.getItem(LS_PATIENTS) || '[]')).length;
    document.getElementById('statAppointments').textContent = (JSON.parse(localStorage.getItem(LS_APPTS) || '[]')).length;
  }

 
  function contactBind(){
    const f = document.getElementById('contactForm');
    if(!f) return;
    f.addEventListener('submit', e=>{
      e.preventDefault();
      alert('Thank you — message sent (demo).');
      f.reset();
    });
  }

  function init(){
    ensureDefaultAdmin();
    ensureDefaultDoctors();
    
    signupBind();
    loginBind();
    logoutBind();
    bookingBind();
    contactBind();
    dashboardBind();
    renderAppointmentsList();
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', ()=>{ app.init(); });