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

    // --- Core Data Logic ---
    const renderEverything = () => {
        if (!adminData) return;
        
        // Header
        if (adminData.profile) {
            welcomeUser.innerText = adminData.profile.name;
            avatarTxt.innerText = adminData.profile.name.charAt(0);
            
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
                const card = document.createElement('div');
                card.className = 'panel-card';
                card.style.cssText = 'padding: 1.5rem; margin-bottom: 0; position: relative; border: 1px solid rgba(255,255,255,0.05);';
                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;">
                        <div style="flex: 1;">
                            <div style="margin-bottom: 10px;">
                                <label style="font-size: 0.65rem; color: var(--primary); text-transform: uppercase;">Skill Name</label>
                                <input type="text" value="${skill.name}" oninput="updateSk(${index}, 'name', this.value)" style="background:transparent; border:none; border-bottom:1px solid rgba(255,255,255,0.1); width:100%; color:white; font-size: 0.9rem; padding: 5px 0;">
                            </div>
                            <div>
                                <label style="font-size: 0.65rem; color: var(--primary); text-transform: uppercase;">Level (%)</label>
                                <input type="number" value="${skill.level}" oninput="updateSk(${index}, 'level', this.value)" style="background:transparent; border:none; border-bottom:1px solid rgba(255,255,255,0.1); width:100%; color:white; font-size: 0.9rem; padding: 5px 0;">
                            </div>
                        </div>
                        <button onclick="rmSk(${index})" style="background:transparent; border:none; color:#ff4d4d; cursor:pointer;">
                            <span class="material-icons">delete</span>
                        </button>
                    </div>`;
                skillsList.appendChild(card);
            });
        }
    };

    window.updateSk = (i, f, v) => { adminData.skills[i][f] = v; markUnsaved(); };
    window.rmSk = (i) => { adminData.skills.splice(i, 1); markUnsaved(); renderEverything(); };
    if (addSkillBtn) addSkillBtn.onclick = () => { 
        if (!adminData.skills) adminData.skills = [];
        adminData.skills.push({name: 'New Skill', level: '80'}); 
        markUnsaved(); 
        renderEverything(); 
    };

    // --- Handle Persistence ---
    const DB_NAME = 'PortfolioAdminDB';
    const STORE_NAME = 'FileHandles';
    const openDB = () => new Promise((resolve) => {
        const r = indexedDB.open(DB_NAME, 1);
        r.onupgradeneeded = () => r.result.createObjectStore(STORE_NAME);
        r.onsuccess = () => resolve(r.result);
    });

    const getHandle = async () => {
        const db = await openDB();
        return db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get('data.json');
    };

    const saveHandle = async (h) => {
        const db = await openDB();
        db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(h, 'data.json');
    };

    const loadFromFile = async (handle) => {
        try {
            const file = await handle.getFile();
            const text = await file.text();
            adminData = JSON.parse(text);
            localFileHandle = handle;
            syncFileBtn.style.display = 'none';
            syncTextStatus.innerHTML = '<span style="color: #3fd38c"><i class="fa fa-check-double"></i> Database Online: data.json</span>';
            renderEverything();
            hasUnsavedChanges = false;
        } catch(e) { console.error("File load failed:", e); }
    };

    // --- Init App ---
    const init = async () => {
        // Try Cache first
        const cache = localStorage.getItem('portfolio_data_cache');
        if (cache) {
            adminData = JSON.parse(cache);
            renderEverything();
        }

        // Try handle auto-sync
        const h = await getHandle();
        if (h && typeof h.queryPermission === 'function') {
            const status = await h.queryPermission({ mode: 'readwrite' });
            if (status === 'granted') {
                loadFromFile(h);
            } else {
                syncFileBtn.style.display = 'block';
                syncFileBtn.innerHTML = '<i class="fa fa-plug"></i> Re-connect data.json';
                syncTextStatus.innerHTML = '<span style="color: #ffcc00">Database Connection Sleeping. Click to Re-connect.</span>';
                document.body.addEventListener('click', async function activate() {
                    try {
                        const p = await h.requestPermission({ mode: 'readwrite' });
                        if (p === 'granted') {
                            loadFromFile(h);
                            document.body.removeEventListener('click', activate);
                        }
                    } catch(e) {}
                }, { once: true });
            }
        } else {
            // Blocked by protocol (file://)
            syncFileBtn.style.display = 'block';
            syncFileBtn.style.background = "rgba(255, 77, 5, 0.1)";
            syncFileBtn.style.borderColor = "var(--primary)";
            syncFileBtn.innerHTML = '<i class="fa fa-folder-open"></i> Link data.json (Local Folder)';
            syncTextStatus.innerHTML = '<span style="color: #a0a0a0; font-size: 0.75rem;">Running via File. Click <b>Link</b> to enable saves.</span>';
            
            // Helpful Guide
            showNotification("🚀 Setup Tip: Use 'Live Server' for automatic zero-click syncing.");
        }

        // Check login session
        if (localStorage.getItem('admin_session') === 'active') {
            dashboard.style.display = 'block';
            loginContainerRoot.style.display = 'none';
            document.body.style.overflow = 'auto';
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

            // Triple-check credentials
            try {
                // 1. Try fetching from data.json first
                const r = await fetch('../data.json');
                const d = await r.json();
                if (emInput === d.admin.email && pwInput === d.admin.password) {
                    localStorage.setItem('admin_session', 'active');
                    location.reload();
                    return;
                }
            } catch(e) {
                // 2. Local fallback if browser blocks file reading (CORS)
                console.warn("Using offline login fallback.");
                if (emInput === "amulbabariya07@gmail.com" && pwInput === "AmulBabariya@121") {
                    localStorage.setItem('admin_session', 'active');
                    location.reload();
                    return;
                }
            }
            
            // 3. Last check against cached data if any
            const cache = localStorage.getItem('portfolio_data_cache');
            if (cache) {
                const d = JSON.parse(cache);
                if (emInput === d.admin.email && pwInput === d.admin.password) {
                    localStorage.setItem('admin_session', 'active');
                    location.reload();
                    return;
                }
            }

            errorMsg.style.display = 'block';
            errorMsg.innerText = "Invalid credentials. Please try again.";
        };
    }

    if (globalSaveBtn) {
        globalSaveBtn.onclick = async () => {
            if (!localFileHandle) {
                showNotification("Error: Please sync your data.json first!");
                return;
            }

            // Capture all fields
            adminData.profile.bio = bioText.value;
            adminData.profile.birthdate = birthdateText.value;
            adminData.profile.experience = experienceText.value;
            adminData.profile.phone = phoneText.value;
            adminData.profile.address = addressText.value;
            adminData.stats.projects = statProjects.value;
            adminData.stats.customers = statCustomers.value;

            try {
                const w = await localFileHandle.createWritable();
                await w.write(JSON.stringify(adminData, null, 4));
                await w.close();
                localStorage.setItem('portfolio_data_cache', JSON.stringify(adminData));
                hasUnsavedChanges = false;
                syncTextStatus.innerHTML = '<span style="color: #3fd38c"><i class="fa fa-save"></i> data.json Updated!</span>';
                showNotification("Success: Statistics and Skills saved! 🚀");
            } catch(e) {
                console.error("Save failed:", e);
                showNotification("Permission Denied: Could not write to file.");
            }
        };
    }

    if (rejectChangesBtn) {
        rejectChangesBtn.onclick = () => {
            if (confirm("Reject all changes and reload from the real data.json?")) {
                localStorage.removeItem('portfolio_data_cache');
                location.reload();
            }
        };
    }

    if (syncFileBtn) {
        syncFileBtn.onclick = async () => {
            try {
                const [h] = await window.showOpenFilePicker({ types: [{ description:'JSON', accept: {'application/json':['.json']} }] });
                await saveHandle(h);
                loadFromFile(h);
            } catch(e) {}
        };
    }

    if (logoutBtn) {
        logoutBtn.onclick = () => {
            localStorage.removeItem('admin_session');
            localStorage.removeItem('portfolio_data_cache');
            location.reload();
        };
    }

    [bioText, birthdateText, experienceText, phoneText, addressText, statProjects, statCustomers].forEach(el => {
        if (el) el.oninput = () => markUnsaved();
    });

    function showNotification(msg) {
        const t = document.createElement('div');
        t.style.cssText = `position:fixed; bottom:2rem; right:2rem; background:rgba(0,0,0,0.9); padding:1rem; border-radius:1rem; color:white; z-index:9999;`;
        t.innerText = msg;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 4000);
    }
});
