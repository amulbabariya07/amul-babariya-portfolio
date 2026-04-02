document.addEventListener('DOMContentLoaded', function() {
    const loadPortfolioData = async () => {
        try {
            let data = null;
            // Check localStorage for overrides from Admin panel
            const localData = localStorage.getItem('portfolio_data_cache');
            
            if (localData) {
                data = JSON.parse(localData);
                console.log("Portfolio: Loaded from LocalStorage Cache");
            } else {
                const response = await fetch('data.json');
                data = await response.json();
                console.log("Portfolio: Loaded from data.json");
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
            }
        } catch (err) {
            console.error("Portfolio Loader Error:", err);
        }
    };

    loadPortfolioData();
});
