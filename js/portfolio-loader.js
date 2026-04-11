document.addEventListener('DOMContentLoaded', function() {
    const loadPortfolioData = async () => {
        try {
            let data = null;
            try {
                const response = await fetch('https://amul-portfolio-default-rtdb.firebaseio.com/.json');
                if (!response.ok) throw new Error("Firebase fetch failed");
                data = await response.json();
                console.log("Portfolio: Loaded LIVE from Firebase");
            } catch (err) {
                console.warn("Failed to load from Firebase, falling back to local file:", err);
                const response = await fetch('data.json');
                data = await response.json();
            }

            if (data && data.profile) {
                const profile = data.profile;
                
                // Update DOM elements if they exist
                const updateElement = (id, value) => {
                    const el = document.getElementById(id);
                    if (el) el.innerText = value;
                };

                updateElement('bio-val', profile.bio);
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

                // Render Skills
                const skillsContainer = document.getElementById('skills-container');
                if (skillsContainer && data.skills) {
                    skillsContainer.innerHTML = '';
                    data.skills.forEach(skill => {
                        const skillHtml = `
                            <div class="col-12 col-md-6">
                                <span class="skill-text">${skill.name}</span>
                                <div class="chart-bar">
                                    <span class="item-progress" data-percent="${skill.level}" style="width: ${skill.level}%;"></span>
                                    <span class="percent" style="right: ${100 - parseInt(skill.level)}%;">${skill.level}%<span class="arrow"></span></span>
                                </div>
                            </div>
                        `;
                        skillsContainer.insertAdjacentHTML('beforeend', skillHtml);
                    });
                }

                // Render Experience (Desc. Bootstrap Vertical Timeline)
                const expContainer = document.getElementById('experiencecarousel');
                if (expContainer && data.experience_list) {
                    expContainer.className = ''; 
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
                        } catch(e) {
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
                                            <p style="opacity: 0.8; font-size: 15px; line-height: 1.6; margin-bottom: 0px; text-align: left;">${exp.description}</p>
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
                                    <p>${edu.description}</p>
                                </div>
                            </div>
                        `;
                        timeline.insertAdjacentHTML('beforeend', eduHtml);
                    });
                }

                // Render Languages
                const langContainer = document.getElementById('languages-container');
                if (langContainer && data.languages) {
                    langContainer.innerHTML = '';
                    data.languages.forEach(lang => {
                        const langHtml = `
                            <div class="col-12 col-md-4 mb-4">
                                <div class="language-item text-center">
                                    <h5 class="mb-1">${lang.name}</h5>
                                    <span class="text-uppercase" style="font-size: 14px; color: var(--main-color);">${lang.level}</span>
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
