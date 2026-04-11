document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form');
    const loginContainerRoot = document.getElementById('login-container-root');
    const dashboard = document.getElementById('dashboard');
    const errorMsg = document.getElementById('error-msg');
    const logoutBtn = document.getElementById('logout-btn');
    const welcomeUser = document.getElementById('welcome-user');
    const avatarTxt = document.getElementById('avatar-txt');

    // Form fields
    const bioText = document.getElementById('bio-text');
    const birthdateText = document.getElementById('birthdate-text');
    const experienceText = document.getElementById('experience-text');
    const phoneText = document.getElementById('phone-text');
    const addressText = document.getElementById('address-text');
    const statProjects = document.getElementById('stat-projects');
    const statCustomers = document.getElementById('stat-customers');
    const skillsList = document.getElementById('skills-list');
    const addSkillBtn = document.getElementById('add-skill-btn');
    
    // Buttons
    const syncFileBtn = document.getElementById('sync-file-btn');
    const reconnectFileBtn = document.getElementById('reconnect-file-btn');
    const syncTextStatus = document.getElementById('sync-text-status');
    const globalSaveBtn = document.getElementById('global-save-btn');
    const rejectChangesBtn = document.getElementById('reject-changes-btn');

    // Sidebar View Logic
    const navLinks = document.querySelectorAll('.nav-link');
    const viewSections = document.querySelectorAll('.view-section');
    const currentSectionName = document.getElementById('current-section-name');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = `view-${link.dataset.view}`;
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            viewSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === viewId) {
                    section.classList.add('active');
                    if (currentSectionName) currentSectionName.innerText = link.innerText.trim();
                }
            });
        });
    });

    let adminData = null;
    let localFileHandle = null;
    let hasUnsavedChanges = false;

    // --- Safety Feature ---
    window.onbeforeunload = (e) => {
        if (hasUnsavedChanges) return "You have unsaved changes! Your data.json will NOT be updated if you leave now.";
    };

    const markUnsaved = () => {
        if (!hasUnsavedChanges) {
            hasUnsavedChanges = true;
            syncTextStatus.innerHTML = '<span style="color: #ff4d4d; font-weight: bold; animation: pulse 1.5s infinite;"><i class="fa fa-exclamation-triangle"></i> CHANGES NOT SYNCED TO FILE</span>';
        }
    };

    const expList = document.getElementById('experience-list');
    const addExpBtn = document.getElementById('add-exp-btn');
    const eduList = document.getElementById('education-list');
    const addEduBtn = document.getElementById('add-edu-btn');

    // --- Core Data Logic ---
    const renderEverything = () => {
        if (!adminData) return;
        
        // Header
        if (adminData.profile) {
            if (welcomeUser) welcomeUser.innerText = adminData.profile.name;
            if (avatarTxt) avatarTxt.innerText = adminData.profile.name.charAt(0);
            
            // Personal Info
            bioText.value = adminData.profile.bio || '';
            birthdateText.value = adminData.profile.birthdate || '';
            experienceText.value = adminData.profile.experience || '';
            phoneText.value = adminData.profile.phone || '';
            addressText.value = adminData.profile.address || '';
        }

        // Stats
        if (adminData.stats) {
            statProjects.value = adminData.stats.projects || '';
            statCustomers.value = adminData.stats.customers || '';
        }

        // Skills
        if (adminData.skills) {
            skillsList.innerHTML = '';
            adminData.skills.forEach((skill, index) => {
                const col = document.createElement('div');
                col.className = 'col-md-6 col-lg-4';
                col.innerHTML = `
                    <div class="card border-0 shadow-sm rounded-4 p-3 position-relative">
                        <button class="btn btn-sm btn-outline-danger position-absolute top-0 end-0 m-2 border-0" onclick="rmSk(${index})"><i class="fa fa-trash"></i></button>
                        <div class="mb-3">
                            <label class="form-label small fw-bold text-muted">Skill Name</label>
                            <input type="text" class="form-control form-control-sm" value="${skill.name}" oninput="updateSk(${index}, 'name', this.value)">
                        </div>
                        <div>
                            <label class="form-label small fw-bold text-muted">Level (%)</label>
                            <input type="number" class="form-control form-control-sm" value="${skill.level}" oninput="updateSk(${index}, 'level', this.value)">
                        </div>
                    </div>`;
                skillsList.appendChild(col);
            });
        }

        // Experience
        if (expList && adminData.experience_list) {
            expList.innerHTML = '';
            adminData.experience_list.forEach((exp, index) => {
                const item = document.createElement('div');
                item.className = 'card border-0 shadow-sm rounded-4 p-4 mb-4 position-relative';
                item.innerHTML = `
                    <button class="btn btn-outline-danger position-absolute top-0 end-0 m-3 border-0" onclick="rmExp(${index})"><i class="fa fa-trash"></i></button>
                    <div class="mb-3">
                        <label class="form-label small fw-bold text-muted">Role / Title</label>
                        <input type="text" class="form-control fw-bold" value="${exp.title}" oninput="updateExp(${index}, 'title', this.value)">
                    </div>
                    <div class="row g-3 mb-3 text-start">
                        <div class="col-6">
                            <label class="form-label small fw-bold text-muted">Period</label>
                            <input type="text" class="form-control" value="${exp.period}" oninput="updateExp(${index}, 'period', this.value)">
                        </div>
                        <div class="col-6">
                            <label class="form-label small fw-bold text-muted">Company</label>
                            <input type="text" class="form-control" value="${exp.company}" oninput="updateExp(${index}, 'company', this.value)">
                        </div>
                    </div>
                    <div>
                        <label class="form-label small fw-bold text-muted">Responsibilities</label>
                        <textarea class="form-control" rows="3" oninput="updateExp(${index}, 'description', this.value)">${exp.description}</textarea>
                    </div>`;
                expList.appendChild(item);
            });
        }

        // Education
        if (eduList && adminData.education_list) {
            eduList.innerHTML = '';
            adminData.education_list.forEach((edu, index) => {
                const item = document.createElement('div');
                item.className = 'card border-0 shadow-sm rounded-4 p-4 mb-4 position-relative';
                item.innerHTML = `
                    <button class="btn btn-outline-danger position-absolute top-0 end-0 m-3 border-0" onclick="rmEdu(${index})"><i class="fa fa-trash"></i></button>
                    <div class="mb-3">
                        <label class="form-label small fw-bold text-muted">Degree / Cert</label>
                        <input type="text" class="form-control fw-bold" value="${edu.degree}" oninput="updateEdu(${index}, 'degree', this.value)">
                    </div>
                    <div class="row g-3 mb-3 text-start">
                        <div class="col-6">
                            <label class="form-label small fw-bold text-muted">Period</label>
                            <input type="text" class="form-control" value="${edu.period}" oninput="updateEdu(${index}, 'period', this.value)">
                        </div>
                        <div class="col-6">
                            <label class="form-label small fw-bold text-muted">Institution</label>
                            <input type="text" class="form-control" value="${edu.institution}" oninput="updateEdu(${index}, 'institution', this.value)">
                        </div>
                    </div>
                    <div>
                        <label class="form-label small fw-bold text-muted">Description</label>
                        <textarea class="form-control" rows="2" oninput="updateEdu(${index}, 'description', this.value)">${edu.description}</textarea>
                    </div>`;
                eduList.appendChild(item);
            });
        }
    };

    window.updateSk = (i, f, v) => { adminData.skills[i][f] = v; markUnsaved(); };
    window.rmSk = (i) => { adminData.skills.splice(i, 1); markUnsaved(); renderEverything(); };
    
    window.updateExp = (i, f, v) => { adminData.experience_list[i][f] = v; markUnsaved(); };
    window.rmExp = (i) => { adminData.experience_list.splice(i, 1); markUnsaved(); renderEverything(); };
    if (addExpBtn) addExpBtn.onclick = () => {
        if (!adminData.experience_list) adminData.experience_list = [];
        adminData.experience_list.push({title:'New Role', period:'2024 - Present', company:'Company Name', description:'Job description here...'});
        markUnsaved(); renderEverything();
    };

    window.updateEdu = (i, f, v) => { adminData.education_list[i][f] = v; markUnsaved(); };
    window.rmEdu = (i) => { adminData.education_list.splice(i, 1); markUnsaved(); renderEverything(); };
    if (addEduBtn) addEduBtn.onclick = () => {
        if (!adminData.education_list) adminData.education_list = [];
        adminData.education_list.push({degree:'New Degree', period:'2024', institution:'University Name', description:'Description here...'});
        markUnsaved(); renderEverything();
    };
    if (addSkillBtn) addSkillBtn.onclick = () => { 
        if (!adminData.skills) adminData.skills = [];
        adminData.skills.push({name: 'New Skill', level: '80'}); 
        markUnsaved(); 
        renderEverything(); 
    };

    // --- Firebase Sync Logic ---
    const loadFromFirebase = async () => {
        try {
            const r = await fetch('https://amul-portfolio-default-rtdb.firebaseio.com/.json');
            if (r.ok) {
                adminData = await r.json();
                if(syncFileBtn) syncFileBtn.style.display = 'none';
                syncTextStatus.innerHTML = '<span style="color: #3fd38c"><i class="fa fa-wifi"></i> Live: Connected to Firebase</span>';
                renderEverything();
                hasUnsavedChanges = false;
            } else {
                throw new Error("Unable to fetch data from Firebase");
            }
        } catch(e) {
            console.error(e);
            syncTextStatus.innerHTML = '<span style="color: #ff4d4d"><i class="fa fa-times"></i> Database Error</span>';
        }
    };

    // --- Init App ---
    const init = async () => {
        // Check login session
        if (localStorage.getItem('admin_session') === 'active') {
            dashboard.style.display = 'block';
            document.getElementById('admin-sidebar').style.display = 'flex';
            loginContainerRoot.style.display = 'none';
            document.body.style.overflow = 'auto';
            loadFromFirebase();
        }
    };

    init();

    // --- Event Listeners ---
    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const emInput = document.getElementById('email').value;
            const pwInput = document.getElementById('password').value;
            
            errorMsg.style.display = 'none';
            const apiKey = "AIzaSyADf8OmA6RXLpdMqmAm9hfWxM_XtTvpaXM";

            try {
                const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: emInput, password: pwInput, returnSecureToken: true })
                });
                
                const data = await response.json();
                if (data.idToken) {
                    localStorage.setItem('admin_session', 'active');
                    localStorage.setItem('fb_id_token', data.idToken);
                    location.reload();
                } else {
                    throw new Error("Invalid credentials");
                }
            } catch(e) {
                errorMsg.style.display = 'block';
                errorMsg.innerText = "Access denied: check your credentials.";
                errorMsg.style.color = "#ff4d4d";
            }
        };
    }

    if (globalSaveBtn) {
        globalSaveBtn.onclick = async () => {
            if (!adminData) return;

            // Capture all fields
            adminData.profile.bio = bioText.value;
            adminData.profile.birthdate = birthdateText.value;
            adminData.profile.experience = experienceText.value;
            adminData.profile.phone = phoneText.value;
            adminData.profile.address = addressText.value;
            adminData.stats.projects = statProjects.value;
            adminData.stats.customers = statCustomers.value;

            try {
                const idToken = localStorage.getItem('fb_id_token');
                const url = `https://amul-portfolio-default-rtdb.firebaseio.com/.json` + (idToken ? `?auth=${idToken}` : '');
                
                const r = await fetch(url, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(adminData)
                });

                if (!r.ok) {
                    throw new Error("Permission Denied (Firebase Rule)");
                }

                localStorage.setItem('portfolio_data_cache', JSON.stringify(adminData));
                hasUnsavedChanges = false;
                syncTextStatus.innerHTML = '<span style="color: #3fd38c"><i class="fa fa-save"></i> Firebase Updated!</span>';
                showNotification("Success: Data saved LIVE to Firebase! 🚀");
            } catch(e) {
                console.error("Save failed:", e);
                showNotification("Permission Denied: Could not write to Firebase.");
            }
        };
    }

    if (rejectChangesBtn) {
        rejectChangesBtn.onclick = () => {
            if (confirm("Discard all edits and reload from Firebase?")) {
                location.reload();
            }
        };
    }

    if (syncFileBtn) {
        syncFileBtn.style.display = 'none'; // Firebase is always connected
    }

    if (logoutBtn) {
        logoutBtn.onclick = () => {
            localStorage.removeItem('admin_session');
            localStorage.removeItem('fb_id_token');
            localStorage.removeItem('portfolio_data_cache');
            location.reload();
        };
    }

    [bioText, birthdateText, experienceText, phoneText, addressText, statProjects, statCustomers].forEach(el => {
        if (el) el.oninput = () => markUnsaved();
    });

    const demoJsonBtn = document.getElementById('demo-json-btn');
    if (demoJsonBtn) {
        demoJsonBtn.onclick = () => {
            const demo = {
                "admin": { "email": "admin@test.com", "password": "pass" },
                "profile": {
                    "name": "Demo User",
                    "title": "Software Architect",
                    "bio": "Extremely experienced developer with a passion for building robust applications.",
                    "birthdate": "Jan 1990",
                    "nationality": "Indian",
                    "experience": "10 Years",
                    "phone": "+91 9999999999",
                    "address": "Silicon Valley, CA",
                    "email": "demo@user.com"
                },
                "stats": { "experience": "10", "projects": "50", "customers": "100" },
                "skills": [
                    { "name": "React", "level": "90" },
                    { "name": "Node.js", "level": "85" }
                ],
                "experience_list": [
                    { "title": "Senior Engineer", "period": "2020 - 2024", "company": "Tech Corp", "description": "Led a team of 10 developers." }
                ],
                "education_list": [
                    { "degree": "B.Tech CS", "period": "2012", "institution": "Stanford University", "description": "GPA: 4.0" }
                ],
                "languages": [
                    { "name": "English", "level": "Fluent" }
                ]
            };
            const blob = new Blob([JSON.stringify(demo, null, 4)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'demo_portfolio.json';
            a.click();
            URL.revokeObjectURL(url);
            showNotification("✅ Demo file generated and downloaded!");
        };
    }

    function showNotification(msg) {
        const t = document.createElement('div');
        t.style.cssText = `position:fixed; bottom:2rem; right:2rem; background:rgba(0,0,0,0.9); padding:1rem; border-radius:1rem; color:white; z-index:9999;`;
        t.innerText = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 4000);
    }
});
