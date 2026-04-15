document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.getElementById('login-form');
    const loginContainerRoot = document.getElementById('login-container-root');
    const dashboard = document.getElementById('dashboard');
    const errorMsg = document.getElementById('error-msg');
    const logoutBtn = document.getElementById('logout-btn');
    const welcomeUser = document.getElementById('welcome-user');
    const avatarTxt = document.getElementById('avatar-txt');

    // Form fields
    const bioEditor = document.getElementById('bio-editor');
    const birthdateText = document.getElementById('birthdate-text');
    const experienceText = document.getElementById('experience-text');
    const phoneText = document.getElementById('phone-text');
    const addressText = document.getElementById('address-text');
    const statProjects = document.getElementById('stat-projects');
    const statCustomers = document.getElementById('stat-customers');
    const skillsList = document.getElementById('skills-list');
    const addSkillBtn = document.getElementById('add-skill-btn');
    
    // Quill Instance Holder
    let bioQuill = null;
    
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
                    if (currentSectionName) {
                        // Clone the node and remove the badge/icons for a clean title
                        const tempDiv = link.cloneNode(true);
                        const badge = tempDiv.querySelector('.badge');
                        const icon = tempDiv.querySelector('i');
                        if(badge) badge.remove();
                        if(icon) icon.remove();
                        currentSectionName.innerText = tempDiv.innerText.trim();
                    }
                }
            });
        });
    });

    let adminData = null;
    let hasUnsavedChanges = false;

    // --- Safety Feature ---
    window.onbeforeunload = (e) => {
        if (hasUnsavedChanges) return "You have unsaved changes! Your updates will not be live if you leave without saving.";
    };

    const markUnsaved = () => {
        if (!hasUnsavedChanges) {
            hasUnsavedChanges = true;
            syncTextStatus.innerHTML = '<span style="color: #ff4d4d; font-weight: bold; animation: pulse 1.5s infinite;"><i class="fa fa-exclamation-triangle"></i> CHANGES NOT SYNCED TO FIREBASE</span>';
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
            if (bioQuill) {
                bioQuill.root.innerHTML = adminData.profile.bio || '';
            } else {
                initBioQuill(adminData.profile.bio);
            }
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
                        <label class="form-label small fw-bold text-muted">Responsibilities (Rich Text)</label>
                        <div id="exp-editor-${index}" class="exp-editor"></div>
                    </div>`;
                expList.appendChild(item);
                initQuill(`exp-editor-${index}`, exp.description, (html) => {
                    adminData.experience_list[index].description = html;
                    markUnsaved();
                });
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
                        <label class="form-label small fw-bold text-muted">Description (Rich Text)</label>
                        <div id="edu-editor-${index}" class="edu-editor"></div>
                    </div>`;
                eduList.appendChild(item);
                initQuill(`edu-editor-${index}`, edu.description, (html) => {
                    adminData.education_list[index].description = html;
                    markUnsaved();
                });
            });
        }
        renderLanguages();
        renderPortfolio();
        renderMessages();
    };
    
    // --- Quill Helper ---
    const initQuill = (id, initialHtml, callback) => {
        setTimeout(() => {
            const container = document.getElementById(id);
            if (!container) return;
            const quill = new Quill(container, {
                theme: 'snow',
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                        [{ 'font': [] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'script': 'sub'}, { 'script': 'super' }],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        [{ 'indent': '-1'}, { 'indent': '+1' }],
                        [{ 'align': [] }],
                        ['blockquote', 'code-block'],
                        ['link', 'image', 'video'],
                        ['clean']
                    ]
                }
            });
            quill.root.innerHTML = initialHtml || '';
            // Only listen for changes AFTER the initial content is set to avoid false "unsaved" warnings
            setTimeout(() => {
                quill.on('text-change', () => callback(quill.root.innerHTML));
            }, 500);
        }, 100);
    };

    const initBioQuill = (html) => {
        const container = document.getElementById('bio-editor');
        if (!container) return;
        bioQuill = new Quill(container, {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ 'header': [1, 2, 3, false] }],
                    ['bold', 'italic', 'underline'],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    [{ 'align': [] }],
                    ['link', 'clean']
                ]
            }
        });
        bioQuill.root.innerHTML = html || '';
        // Only listen for changes AFTER the initial content is set
        setTimeout(() => {
            bioQuill.on('text-change', () => {
                adminData.profile.bio = bioQuill.root.innerHTML;
                markUnsaved();
            });
        }, 500);
    };

    const renderPortfolio = () => {
        const kanbanList = document.getElementById('portfolio-kanban-list');
        const kanbanHeader = document.getElementById('portfolio-kanban-header');
        const formView = document.getElementById('portfolio-form-view');
        
        if (!kanbanList) return;
        if (!adminData.portfolio) adminData.portfolio = [];
        
        // Ensure we are in Kanban View by default during render
        kanbanList.innerHTML = '';
        adminData.portfolio.forEach((proj, index) => {
            const card = document.createElement('div');
            card.className = 'col-6 col-md-4 col-lg-3 mb-4 d-flex';
            card.innerHTML = `
                <div class="card w-100 border-0 shadow-sm rounded-4 overflow-hidden project-kanban-card" 
                     style="cursor: pointer; transition: transform 0.2s;" 
                     onclick="openProjectForm(${index})">
                    <div style="height: 160px; overflow: hidden; background: #f8f9fa;">
                        ${proj.header_img ? `<img src="${proj.header_img}" class="w-100 h-100" style="object-fit: cover; object-position: top;">` : '<div class="d-flex align-items-center justify-content-center text-muted small h-100">No Image</div>'}
                    </div>
                    <div class="card-body p-3 d-flex flex-column" style="height: 70px; overflow: hidden;">
                        <div id="v-details" class="text-white-50 lh-lg" style="font-size: 17px; text-align: justify;"></div>
                        <h6 class="fw-bold text-dark text-truncate mb-1" style="font-size: 13px;">${proj.name || 'Untitled'}</h6>
                        <p class="text-muted small mb-0 text-truncate" style="font-size: 10px;">${proj.short_desc || 'No description'}</p>
                    </div>
                </div>`;
            kanbanList.appendChild(card);
        });
    };

    window.openProjectForm = (index) => {
        const proj = adminData.portfolio[index];
        const kanbanList = document.getElementById('portfolio-kanban-list');
        const kanbanHeader = document.getElementById('portfolio-kanban-header');
        const formView = document.getElementById('portfolio-form-view');
        const formContent = document.getElementById('portfolio-form-content');
        const formTitle = document.getElementById('form-title-area');

        formTitle.innerText = proj.name || 'Edit Project';
        kanbanList.classList.add('d-none');
        kanbanHeader.classList.add('d-none');
        formView.classList.remove('d-none');

        formContent.innerHTML = `
            <div class="row g-4 mt-1">
                <div class="col-md-7">
                    <div class="mb-4">
                        <label class="form-label small fw-bold text-muted text-uppercase">Project Name</label>
                        <input type="text" class="form-control form-control-lg fw-bold" value="${proj.name || ''}" 
                               oninput="updateProject(${index}, 'name', this.value); document.getElementById('form-title-area').innerText = this.value">
                    </div>
                    
                    <div class="row g-3 mb-4">
                        <div class="col-md-6">
                            <label class="form-label small fw-bold text-muted text-uppercase">Short Description</label>
                            <input type="text" class="form-control" value="${proj.short_desc || ''}" oninput="updateProject(${index}, 'short_desc', this.value)">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label small fw-bold text-muted text-uppercase">Tags (Comma separated)</label>
                            <input type="text" class="form-control" value="${proj.tags || ''}" oninput="updateProject(${index}, 'tags', this.value)">
                        </div>
                    </div>

                    <div class="mb-4">
                        <label class="form-label small fw-bold text-muted text-uppercase">Details (Rich Text)</label>
                        <div id="proj-editor-${index}"></div>
                    </div>

                    <button class="btn btn-danger btn-sm rounded-pill px-3" onclick="rmProject(${index})">
                        <i class="fa fa-trash me-1"></i> Delete Project
                    </button>
                </div>

                <div class="col-md-5">
                    <div class="mb-4">
                        <label class="form-label small fw-bold text-muted text-uppercase">Header Image</label>
                        <div class="p-3 border rounded-4 bg-light text-center border-dashed">
                            <input type="hidden" id="p-img-${index}" value="${proj.header_img || ''}">
                            <input type="file" class="d-none" id="f-img-${index}" accept="image/*" onchange="upImg(event, ${index}, 'header_img')">
                            <button class="btn btn-outline-primary btn-sm rounded-pill mb-3" onclick="document.getElementById('f-img-${index}').click()">
                                <i class="fa fa-upload me-2"></i> Change Image
                            </button>
                            <div class="ratio ratio-16x9 rounded-3 overflow-hidden bg-white shadow-sm border">
                                ${proj.header_img ? `<img id="prev-header-${index}" src="${proj.header_img}" class="object-fit-contain">` : '<div class="d-flex align-items-center justify-content-center text-muted small">Primary Photo</div>'}
                            </div>
                        </div>
                    </div>

                    <div class="mb-4">
                        <label class="form-label small fw-bold text-muted text-uppercase d-flex justify-content-between">
                            Gallery
                            <a href="javascript:void(0)" class="text-danger x-small" onclick="clearGal(${index})">Clear Gallery</a>
                        </label>
                        <div class="p-3 border rounded-4 bg-light border-dashed">
                            <input type="hidden" id="p-gal-${index}" value="${proj.gallery_imgs || ''}">
                            <input type="file" class="d-none" id="f-gal-${index}" accept="image/*" multiple onchange="upImg(event, ${index}, 'gallery_imgs')">
                            <button class="btn btn-outline-secondary btn-sm w-100 rounded-pill mb-3" onclick="document.getElementById('f-gal-${index}').click()">
                                <i class="fa fa-plus me-2"></i> Add Gallery Photos
                            </button>
                            <div class="row g-2" id="gal-prev-${index}">
                                ${(proj.gallery_imgs || '').split('|').filter(img => img.trim()).map(img => `
                                    <div class="col-4">
                                        <div class="ratio ratio-1x1 rounded-3 overflow-hidden border bg-white">
                                            <img src="${img.trim()}" class="object-fit-cover">
                                        </div>
                                    </div>
                                `).join('') || '<div class="col-12 text-center text-muted x-small py-4">Gallery is empty</div>'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        initQuill(`proj-editor-${index}`, proj.details, (html) => {
            adminData.portfolio[index].details = html;
            markUnsaved();
        });
    };

    window.closeProjectForm = () => {
        document.getElementById('portfolio-kanban-list').classList.remove('d-none');
        document.getElementById('portfolio-kanban-header').classList.remove('d-none');
        document.getElementById('portfolio-form-view').classList.add('d-none');
        renderPortfolio();
    };

    window.updateProject = (i, f, v) => { adminData.portfolio[i][f] = v; markUnsaved(); };
    window.clearGal = (i) => { adminData.portfolio[i].gallery_imgs = ''; markUnsaved(); openProjectForm(i); };
    window.rmProject = (i) => { 
        if(confirm('Are you sure you want to delete this project?')) {
            adminData.portfolio.splice(i, 1); 
            markUnsaved(); 
            closeProjectForm(); 
        }
    };

    const addProjBtn = document.getElementById('add-project-btn');
    if (addProjBtn) addProjBtn.onclick = () => {
        if (!adminData.portfolio) adminData.portfolio = [];
        const newIdx = adminData.portfolio.length;
        adminData.portfolio.push({ name: 'New Project', header_img: '', gallery_imgs: '', short_desc: '', details: '', tags: '' });
        markUnsaved();
        openProjectForm(newIdx);
    };

    window.upImg = (ev, i, field) => {
        const files = ev.target.files;
        if (!files.length) return;
        
        const resizeImage = (file) => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const img = new Image();
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;
                        const max_size = 1000; // Max dimension

                        if (width > height) {
                            if (width > max_size) {
                                height *= max_size / width;
                                width = max_size;
                            }
                        } else {
                            if (height > max_size) {
                                width *= max_size / height;
                                height = max_size;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress as JPEG
                    };
                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            });
        };

        const promises = Array.from(files).map(file => resizeImage(file));

        Promise.all(promises).then(results => {
            if (field === 'gallery_imgs') {
                const existing = adminData.portfolio[i][field] ? adminData.portfolio[i][field].split('|') : [];
                adminData.portfolio[i][field] = existing.concat(results).filter(x => x).join('|');
            } else {
                adminData.portfolio[i][field] = results[0];
            }
            markUnsaved();
            openProjectForm(i);
        });
    };

    const renderLanguages = () => {
        const langList = document.getElementById('languages-list');
        if (!langList || !adminData.languages) return;
        
        langList.innerHTML = '';
        adminData.languages.forEach((lang, index) => {
            const col = document.createElement('div');
            col.className = 'col-md-6 col-lg-4';
            col.innerHTML = `
                <div class="card border-0 shadow-sm rounded-4 p-3 position-relative">
                    <button class="btn btn-sm btn-outline-danger position-absolute top-0 end-0 m-2 border-0" onclick="rmLang(${index})"><i class="fa fa-trash"></i></button>
                    <div class="mb-3">
                        <label class="form-label small fw-bold text-muted">Language</label>
                        <input type="text" class="form-control" value="${lang.name}" oninput="updateLang(${index}, 'name', this.value)">
                    </div>
                    <div>
                        <label class="form-label small fw-bold text-muted">Level (e.g. Fluent, Native)</label>
                        <input type="text" class="form-control" value="${lang.level}" oninput="updateLang(${index}, 'level', this.value)">
                    </div>
                </div>`;
            langList.appendChild(col);
        });
    };

    window.updateLang = (i, f, v) => { adminData.languages[i][f] = v; markUnsaved(); };
    window.rmLang = (i) => { adminData.languages.splice(i, 1); markUnsaved(); renderEverything(); };
    const addLangBtn = document.getElementById('add-lang-btn');
    if (addLangBtn) addLangBtn.onclick = () => {
        if (!adminData.languages) adminData.languages = [];
        adminData.languages.push({ name: 'New Language', level: 'Fluent' });
        markUnsaved(); renderEverything();
    };

    const renderMessages = () => {
        const msgs = adminData.messages || {};
        
        // Reset counts and columns
        document.getElementById('col-draft').innerHTML = '';
        document.getElementById('col-read').innerHTML = '';
        document.getElementById('col-deal').innerHTML = '';
        document.getElementById('messages-table-body').innerHTML = '';
        let cntDraft = 0, cntRead = 0, cntDeal = 0;

        Object.keys(msgs).forEach(key => {
            const m = msgs[key];
            const date = new Date(m.timestamp).toLocaleDateString();
            const stage = m.stage || "Draft";

            // Kanban Card
            const card = document.createElement('div');
            card.className = "card border-0 shadow-sm rounded-3 p-3 mb-3";
            card.innerHTML = `
                <div class="d-flex justify-content-between mb-2">
                    <span class="badge bg-light text-dark border">${date}</span>
                    <select class="form-select form-select-sm w-auto border-0 bg-light" onchange="updateMsgStage('${key}', this.value)">
                        <option value="Draft" ${stage==='Draft'?'selected':''}>Draft</option>
                        <option value="Read" ${stage==='Read'?'selected':''}>Read</option>
                        <option value="Deal Done" ${stage==='Deal Done'?'selected':''}>Deal Done</option>
                    </select>
                </div>
                <h6 class="fw-bold mb-1">${m.subject || "No Subject"}</h6>
                <p class="text-muted small mb-1"><i class="fa fa-user me-1"></i> ${m.name}</p>
                <p class="text-secondary small mb-1"><i class="fa fa-envelope me-1"></i> ${m.email || 'N/A'}</p>
                <p class="text-primary small mb-2"><i class="fa fa-phone me-1"></i> ${m.phone || 'N/A'}</p>
                <p class="small mb-0 text-truncate">${m.message}</p>
            `;

            if (stage === "Draft") { document.getElementById('col-draft').appendChild(card); cntDraft++; }
            else if (stage === "Read") { document.getElementById('col-read').appendChild(card); cntRead++; }
            else { document.getElementById('col-deal').appendChild(card); cntDeal++; }

            // List Table Row
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="ps-4 text-muted small">${date}</td>
                <td class="fw-bold">${m.name}</td>
                <td>
                    <div class="small"><i class="fa fa-envelope me-1 text-muted"></i> ${m.email}</div>
                    <div class="small"><i class="fa fa-phone me-1 text-muted"></i> ${m.phone}</div>
                </td>
                <td>${m.subject || "N/A"}</td>
                <td><span class="badge ${stage==='Draft'?'bg-warning':stage==='Read'?'bg-info':'bg-success'}">${stage}</span></td>
                <td class="text-end pe-4">
                    <select class="form-select form-select-sm d-inline-block w-auto" onchange="updateMsgStage('${key}', this.value)">
                        <option value="Draft" ${stage==='Draft'?'selected':''}>Draft</option>
                        <option value="Read" ${stage==='Read'?'selected':''}>Read</option>
                        <option value="Deal Done" ${stage==='Deal Done'?'selected':''}>Deal Done</option>
                    </select>
                </td>
            `;
            document.getElementById('messages-table-body').appendChild(tr);
        });

        document.getElementById('count-draft').innerText = cntDraft;
        document.getElementById('count-read').innerText = cntRead;
        document.getElementById('count-deal').innerText = cntDeal;
        
        const badge = document.getElementById('new-msg-badge');
        if(badge) {
            badge.style.display = cntDraft > 0 ? "inline-block" : "none";
            badge.innerText = cntDraft;
        }
    };

    window.updateMsgStage = async (id, newStage) => {
        const idToken = localStorage.getItem('fb_id_token');
        if(!idToken) return;
        
        try {
            const url = `https://amul-portfolio-default-rtdb.firebaseio.com/messages/${id}.json?auth=${idToken}`;
            const r = await fetch(url, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stage: newStage })
            });

            if (r.ok) {
                adminData.messages[id].stage = newStage;
                renderMessages();
            } else {
                throw new Error("Update failed");
            }
        } catch(e) {
            alert("Failed to update stage. Firebase Rules might be blocking it or your session expired.");
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

    // --- Message View Toggle ---
    const btnKanban = document.getElementById('btn-kanban-view');
    const btnList = document.getElementById('btn-list-view');
    const kanbanContainer = document.getElementById('messages-kanban');
    const listContainer = document.getElementById('messages-list');

    if(btnKanban && btnList) {
        btnKanban.onclick = () => {
            kanbanContainer.classList.remove('d-none');
            listContainer.classList.add('d-none');
            btnKanban.className = 'btn btn-primary btn-sm me-2 fw-bold px-3';
            btnList.className = 'btn btn-outline-secondary btn-sm fw-bold px-3';
        };
        btnList.onclick = () => {
            kanbanContainer.classList.add('d-none');
            listContainer.classList.remove('d-none');
            btnList.className = 'btn btn-primary btn-sm fw-bold px-3';
            btnKanban.className = 'btn btn-outline-secondary btn-sm me-2 fw-bold px-3';
        };
    }

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
            adminData.profile.bio = bioEditor.innerHTML;
            adminData.profile.birthdate = birthdateText.value;
            adminData.profile.experience = experienceText.value;
            adminData.profile.phone = phoneText.value;
            adminData.profile.address = addressText.value;
            adminData.stats.projects = statProjects.value;
            adminData.stats.customers = statCustomers.value;

            try {
                const idToken = localStorage.getItem('fb_id_token');
                if (!idToken) {
                    showNotification("Error: You are not logged in! Please Logout and Login again.");
                    return;
                }
                
                const url = `https://amul-portfolio-default-rtdb.firebaseio.com/.json?auth=${idToken}`;
                
                const r = await fetch(url, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(adminData)
                });

                if (r.status === 401) {
                    throw new Error("Unauthorized: Your session has expired. Please Logout and Login again.");
                }

                if (!r.ok) {
                    throw new Error("Permission Denied: Firebase rules rejected the update.");
                }

                try {
                    localStorage.setItem('portfolio_data_cache', JSON.stringify(adminData));
                } catch (e) {
                    console.warn("Local storage quota exceeded. Changes saved to Firebase but not cached locally.", e);
                }
                hasUnsavedChanges = false;
                syncTextStatus.innerHTML = '<span style="color: #3fd38c"><i class="fa fa-save"></i> Firebase Updated!</span>';
                showNotification("Success: Data saved LIVE to Firebase! 🚀");
            } catch(e) {
                console.error("Save failed:", e);
                showNotification(e.message || "Permission Denied: Could not write to Firebase.");
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

    [bioEditor, birthdateText, experienceText, phoneText, addressText, statProjects, statCustomers].forEach(el => {
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
