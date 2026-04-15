document.addEventListener('DOMContentLoaded', function () {
    const loadPortfolioData = async () => {
        try {
            const response = await fetch('https://amul-portfolio-default-rtdb.firebaseio.com/.json');
            if (!response.ok) throw new Error("Firebase fetch failed");
            const data = await response.json();
            console.log("Portfolio: Loaded LIVE from Firebase");

            if (data && data.profile) {
                const profile = data.profile;

                // Update DOM elements if they exist
                const updateElement = (id, value) => {
                    const el = document.getElementById(id);
                    if (el) el.innerText = value;
                };

                const applyBootstrapToHtml = (container) => {
                    if (!container) return;
                    container.querySelectorAll('img').forEach(img => {
                        img.classList.add('img-fluid', 'rounded-4', 'my-3', 'shadow-sm');
                    });
                    container.querySelectorAll('iframe').forEach(ifrm => {
                        ifrm.classList.add('w-100', 'rounded-4', 'my-3');
                        ifrm.style.aspectRatio = '16/9';
                        ifrm.style.height = 'auto';
                    });
                };

                const aboutText = document.getElementById('bio-val');
                if (aboutText) {
                    aboutText.innerHTML = data.profile.bio || '';
                    aboutText.classList.add('text-white-50', 'lh-lg');
                    applyBootstrapToHtml(aboutText);
                }

                updateElement('birthdate-val', profile.birthdate);
                updateElement('experience-val', profile.experience);
                updateElement('phone-val', profile.phone);
                updateElement('address-val', profile.address);
                updateElement('email-val', profile.email);

                // Update Name and Title in Hero section
                const heroH2 = document.querySelector('.hero-section h2 span');
                if (heroH2) heroH2.innerText = profile.name.split(' ')[0];

                const heroP = document.querySelector('.hero-section p');
                if (heroP) heroP.innerText = `I'm an ${profile.title} based in ${profile.address}.`;

                if (data.stats) {
                    updateElement('stat-exp-val', data.stats.experience);
                    updateElement('stat-proj-val', data.stats.projects);
                    updateElement('stat-cust-val', data.stats.customers);
                }

                // Render Skills (Neon Linear Cards)
                const skillsContainer = document.getElementById('skills-container');
                if (skillsContainer && data.skills) {
                    skillsContainer.innerHTML = '';
                    data.skills.forEach(skill => {
                        const skillHtml = `
                            <div class="col-12 col-md-6">
                                <div class="skill-card-neon">
                                    <div class="skill-header-neon">
                                        <span class="skill-name-neon">${skill.name}</span>
                                        <span class="skill-percent-neon">${skill.level}%</span>
                                    </div>
                                    <div class="skill-bar-outer-neon">
                                        <div class="skill-bar-inner-neon" style="width: ${skill.level}%"></div>
                                    </div>
                                </div>
                            </div>
                        `;
                        skillsContainer.insertAdjacentHTML('beforeend', skillHtml);
                    });
                }

                // Render Experience (Desc. Bootstrap Vertical Timeline)
                const expContainer = document.getElementById('experiencecarousel');
                if (expContainer && data.experience_list) {
                    expContainer.classList.add('position-relative');
                    expContainer.innerHTML = '<div class="education-timeline" id="experience-education-style-timeline"></div>';
                    const timeline = expContainer.querySelector('#experience-education-style-timeline');

                    // Sort Descending (Newest First -> "motu upar")
                    const getYearMonth = (periodStr) => {
                        if (!periodStr) return { year: 0, month: 0 };
                        let start = periodStr.split('-')[0].trim();
                        let parts = start.split('/');
                        if (parts.length >= 2) {
                            return { month: parseInt(parts[0], 10), year: parseInt(parts[1], 10) };
                        }
                        return { year: parseInt(start, 10) || 0, month: 0 };
                    };

                    const sortedXp = [...data.experience_list].sort((a, b) => {
                        let dateA = getYearMonth(a.period);
                        let dateB = getYearMonth(b.period);
                        if (dateB.year !== dateA.year) {
                            return dateB.year - dateA.year;
                        }
                        return dateB.month - dateA.month;
                    });

                    sortedXp.forEach((exp, index) => {
                        // Exact Duration Calculation
                        let durationStr = '';
                        try {
                            const parts = exp.period.split('-');
                            if (parts.length === 2) {
                                const parseDate = (dStr) => {
                                    dStr = dStr.trim();
                                    if (dStr.toLowerCase() === 'present') return new Date();
                                    if (dStr.includes('/')) {
                                        const [month, year] = dStr.split('/');
                                        return new Date(parseInt(year, 10), parseInt(month, 10) - 1);
                                    }
                                    return new Date(parseInt(dStr, 10), 0);
                                };
                                const startD = parseDate(parts[0]);
                                const endD = parseDate(parts[1]);

                                if (startD && endD) {
                                    let totalMonths = (endD.getFullYear() - startD.getFullYear()) * 12 + (endD.getMonth() - startD.getMonth());

                                    if (totalMonths <= 0) totalMonths = 1; // Minimum 1 month

                                    const y = Math.floor(totalMonths / 12);
                                    const m = totalMonths % 12;

                                    if (y > 0) durationStr += `${y} yr${y > 1 ? 's' : ''} `;
                                    if (m > 0 || (y === 0 && m > 0)) durationStr += `${m} mo${m > 1 ? 's' : ''}`;
                                }
                            }
                        } catch (e) {
                            console.warn("Date calculation err:", e);
                        }

                        const expHtml = `
                            <div class="timeline-item">
                                <div class="timeline-dot"></div>
                                <div class="timeline-content">
                                    <h5 class="mb-0">${exp.title}</h5>
                                    <span class="date">${exp.period}</span>
                                    ${durationStr ? `<span style="color: #888; font-size: 13px; font-weight: 500; margin: 0 4px;">(${durationStr.trim()})</span>` : ''}
                                    <span class="institution">${exp.company}</span>
                                    
                                    <div style="margin-top: 15px;">
                                        <button title="Toggle Responsibilities" onclick="toggleSimpleDrawer(this)" style="background: transparent; border: none; color: var(--main-color, #ff5722); font-size: 14px; cursor: pointer; padding: 4px; outline: none; box-shadow: none;">
                                            <i class="fa fa-chevron-down" style="font-size: 12px; transition: transform 0.3s ease;"></i>
                                        </button>
                                        <div class="simple-drawer mt-3" style="display: none; animation: fadeInDown 0.3s ease;">
                                             <div class="text-white-50 lh-lg text-start small">${exp.description}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                        timeline.insertAdjacentHTML('beforeend', expHtml);
                    });
                }

                // Render Education
                const eduContainer = document.getElementById('education-hierarchy');
                if (eduContainer && data.education_list) {
                    eduContainer.classList.add('position-relative');
                    eduContainer.innerHTML = '<div class="education-timeline"></div>';
                    const timeline = eduContainer.querySelector('.education-timeline');
                    data.education_list.forEach((edu, index) => {
                        const eduHtml = `
                            <div class="timeline-item">
                                <div class="timeline-dot"></div>
                                <div class="timeline-content">
                                    <h5 class="mb-0">${edu.degree}</h5>
                                    <span class="date">${edu.period}</span>
                                    <span class="institution">${edu.institution}</span>
                                    <div class="text-white-50 lh-lg">${edu.description}</div>
                                </div>
                            </div>
                        `;
                        timeline.insertAdjacentHTML('beforeend', eduHtml);
                    });
                }

                // Render Portfolio (Odoo App Store Style)
                const portfolioGrid = document.getElementById('portfolio-grid');
                const portfolioTagsUl = document.getElementById('portfolio-tags');

                if (portfolioGrid && data.portfolio) {
                    const allProjs = data.portfolio;

                    // Tag Filter Logic
                    if (portfolioTagsUl) {
                        const tagsSet = new Set();
                        allProjs.forEach(p => {
                            if (p.tags) p.tags.split(',').forEach(t => tagsSet.add(t.trim().toLowerCase()));
                        });

                        portfolioTagsUl.innerHTML = '<li class="list-inline-item active" data-filter="all">All</li>';
                        tagsSet.forEach(tag => {
                            const li = document.createElement('li');
                            li.className = 'list-inline-item';
                            li.setAttribute('data-filter', tag);
                            li.textContent = tag.charAt(0).toUpperCase() + tag.slice(1);
                            li.onclick = () => filterByTag(tag, li);
                            portfolioTagsUl.appendChild(li);
                        });
                        // Add click for "All"
                        portfolioTagsUl.querySelector('[data-filter="all"]').onclick = (e) => filterByTag('all', e.target);
                    }

                    const renderFiltered = (filter) => {
                        portfolioGrid.innerHTML = '';
                        allProjs.forEach((proj, index) => {
                            const pTags = proj.tags ? proj.tags.toLowerCase() : '';
                            if (filter === 'all' || pTags.includes(filter)) {
                                const tagsList = proj.tags ? proj.tags.split(',') : [];
                                const colHtml = `
                                    <div class="col-12 col-md-4 col-lg-3 mb-4 d-flex align-items-stretch project-item-anim">
                                        <div class="card bg-white border-0 w-100 shadow-sm rounded-4 overflow-hidden project-card-odoo" 
                                             style="cursor: pointer; transition: transform 0.3s ease;" 
                                             onclick="showProjectView(${index})">
                                            <div class="project-img-container" style="height: 140px; overflow: hidden; background: #f8f9fa;">
                                                <img src="${proj.header_img || ''}" class="w-100 h-100" style="object-fit: cover; object-position: top;" alt="${proj.name}">
                                            </div>
                                            <div class="card-body p-3 text-start bg-white">
                                                <h6 class="card-title text-dark fw-bold mb-2 text-truncate" style="font-size: 13px;">${proj.name}</h6>
                                                <div class="d-flex flex-wrap gap-1">
                                                    ${tagsList.map(t => `<span class="badge rounded-pill bg-primary bg-opacity-10 fw-normal mr-1 p-1" style="font-size: 9px; color: #f9f9f9ff;">${t.trim()}</span>`).join('') || ''}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                `;
                                portfolioGrid.insertAdjacentHTML('beforeend', colHtml);
                            }
                        });
                    };

                    const filterByTag = (tag, el) => {
                        portfolioTagsUl.querySelectorAll('li').forEach(li => li.classList.remove('active'));
                        el.classList.add('active');
                        renderFiltered(tag);
                    };

                    renderFiltered('all');
                    window._portfolio_data = data.portfolio;
                }

                window.showProjectView = (idx) => {
                    const proj = window._portfolio_data[idx];
                    if (!proj) return;

                    // Header Img (Row 1)
                    document.getElementById('v-header-img').src = proj.header_img || '';

                    // Name (Row 2)
                    document.getElementById('v-name').innerText = proj.name;

                    // Tags (Row 3)
                    const tagsList = proj.tags ? proj.tags.split(',') : [];
                    document.getElementById('v-tags').innerHTML = tagsList.map(t =>
                        `<span class="badge rounded-pill bg-primary bg-opacity-10 p-2 px-3 mx-1 mb-2" style="color:white; font-size: 12px; border: 1px solid rgba(13, 110, 253, 0.2);">${t.trim()}</span>`
                    ).join('');

                    // Short Desc (Row 4)
                    document.getElementById('v-short-desc').innerText = proj.short_desc || '';

                    // Details (Row 5)
                    const detailsContainer = document.getElementById('v-details');
                    detailsContainer.innerHTML = proj.details || '';
                    applyBootstrapToHtml(detailsContainer);

                    // Gallery (Row 6)
                    const galRow = document.getElementById('v-gallery-row');
                    galRow.innerHTML = '';
                    if (proj.gallery_imgs) {
                        const imgs = proj.gallery_imgs.split('|');
                        imgs.forEach(imgUrl => {
                            if (!imgUrl.trim()) return;
                            const galCol = `
                                <div class="col-12 mb-4 text-center">
                                    <div class="shadow-lg rounded-4 overflow-hidden border border-light border-opacity-10 d-inline-block" 
                                         style="cursor: zoom-in; max-width: 100%;" 
                                         onclick="showBigImg('${imgUrl.trim()}')">
                                        <img src="${imgUrl.trim()}" class="img-fluid" style="max-height: 80vh; width: auto;">
                                    </div>
                                </div>
                            `;
                            galRow.insertAdjacentHTML('beforeend', galCol);
                        });
                    }

                    // UI Toggle
                    document.getElementById('work-content').style.display = 'none';
                    document.getElementById('project-view').style.display = 'block';

                    // Scroll to top of section
                    document.getElementById('work').scrollIntoView({ behavior: 'smooth' });
                };

                window.closeProjectView = () => {
                    document.getElementById('project-view').style.display = 'none';
                    document.getElementById('work-content').style.display = 'block';
                };

                window.showBigImg = (url) => {
                    document.getElementById('preview-img-full').src = url;
                    const myModal = new bootstrap.Modal(document.getElementById('imagePreviewModal'));
                    myModal.show();
                };

                // Render Languages (Glass Dark Design)
                const langContainer = document.getElementById('languages-container');
                if (langContainer && data.languages) {
                    langContainer.innerHTML = '';
                    data.languages.forEach(lang => {
                        const langHtml = `
                            <div class="col-12 col-md-4">
                                <div class="language-card-pro">
                                    <div class="lang-header-pro">
                                        <div class="lang-icon-pro">
                                            <i class="fa fa-language"></i>
                                        </div>
                                        <div class="lang-info-pro">
                                            <h5>${lang.name}</h5>
                                            <span>${lang.level}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                        langContainer.insertAdjacentHTML('beforeend', langHtml);
                    });
                }
            }
        } catch (err) {
            console.error("Portfolio Loader Error:", err);
        }
    };

    loadPortfolioData();
});

function toggleSimpleDrawer(btn) {
    const drawer = btn.nextElementSibling;
    const isHidden = drawer.style.display === 'none';
    const icon = btn.querySelector('i');

    if (isHidden) {
        drawer.style.display = 'block';
        if (icon) {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        }
        btn.classList.add('active');
    } else {
        drawer.style.display = 'none';
        if (icon) {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
        btn.classList.remove('active');
    }
}
