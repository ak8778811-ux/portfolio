// script.js - Abhishek Kumar Mehta Portfolio

// Load data from localStorage if available, fallback to default DATA from data.js
(() => {
    try {
        const raw = localStorage.getItem('localPortfolioData');
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
                window.DATA = parsed;
            }
        }
    } catch (e) {
        console.warn('Invalid localPortfolioData in localStorage, using default data.', e);
    }
})();
// Modern interactive behavior, zero external runtime dependencies

document.addEventListener('DOMContentLoaded', () => {
    // 1. Hero profession rotation
    const professionEl = document.getElementById('profession');
    const professions = (window.DATA && DATA.profile && DATA.profile.professions) 
        ? DATA.profile.professions 
        : ["Frontend Developer", "Programmer", "UI/UX Designer"];
    let profIndex = 0;

    if (professionEl && professions.length > 0) {
        setInterval(() => {
            profIndex = (profIndex + 1) % professions.length;
            professionEl.style.opacity = '0';
            setTimeout(() => {
                professionEl.textContent = professions[profIndex];
                professionEl.style.opacity = '1';
            }, 300);
        }, 3200);
    }

    // 2. Populate Profile & About Info if present
    if (window.DATA && DATA.profile) {
        const aboutBio = document.getElementById('about-bio');
        const aboutLoc = document.getElementById('about-location');
        const aboutFocus = document.getElementById('about-focus');
        const aboutLang = document.getElementById('about-languages');
        const heroStatus = document.getElementById('hero-status');

        if (aboutBio && DATA.profile.bio) aboutBio.textContent = DATA.profile.bio;
        if (aboutLoc && DATA.profile.location) aboutLoc.textContent = DATA.profile.location;
        if (aboutFocus && DATA.profile.focusAreas) aboutFocus.textContent = DATA.profile.focusAreas;
        if (aboutLang && DATA.profile.languages) aboutLang.textContent = DATA.profile.languages;
        if (heroStatus && DATA.profile.status) heroStatus.textContent = DATA.profile.status;
    }

    // 3. Mobile Navigation Menu Toggle & Auto-Close
    const menuToggle = document.querySelector('.menu-toggle');
    const navList = document.querySelector('.nav-list');
    if (menuToggle && navList) {
        menuToggle.addEventListener('click', () => {
            const isActive = navList.classList.toggle('active');
            menuToggle.setAttribute('aria-expanded', isActive);
            menuToggle.textContent = isActive ? '✕' : '☰';
        });

        // Close mobile nav when any link is clicked
        navList.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navList.classList.remove('active');
                menuToggle.setAttribute('aria-expanded', 'false');
                menuToggle.textContent = '☰';
            });
        });
    }

    // 4. Render Education Timeline
    const eduContainer = document.getElementById('education-timeline');
    if (eduContainer && window.DATA && DATA.education) {
        eduContainer.innerHTML = '';
        DATA.education.forEach(item => {
            const el = document.createElement('div');
            el.className = 'timeline-item';
            el.innerHTML = `
                <div class="timeline-date">${item.year}</div>
                <h3 class="timeline-title">${item.degree}</h3>
                <h4 class="timeline-subtitle">${item.institution}</h4>
                ${item.description ? `<p class="timeline-desc">${item.description}</p>` : ''}
            `;
            eduContainer.appendChild(el);
        });
    }

    // 5. Render Skills (Categorized Cards, No Fabricated Percentages)
    const skillsContainer = document.getElementById('skills-list');
    if (skillsContainer && window.DATA && DATA.skills) {
        skillsContainer.innerHTML = '';
        DATA.skills.forEach(cat => {
            const card = document.createElement('div');
            card.className = 'skill-category-card card';
            
            const badgesHtml = cat.items.map(skill => `<span class="skill-pill">${skill}</span>`).join('');
            card.innerHTML = `
                <h3 class="skill-category-title">${cat.category}</h3>
                <div class="skill-pills-wrap">
                    ${badgesHtml}
                </div>
            `;
            skillsContainer.appendChild(card);
        });
    }

    // 6. Render Projects Showcase & Filtering
    const projectsContainer = document.getElementById('projects-gallery');
    if (projectsContainer && window.DATA && DATA.projects) {
        projectsContainer.innerHTML = '';
        DATA.projects.forEach(proj => {
            const card = document.createElement('div');
            card.className = 'project-card card';
            card.dataset.category = proj.category;

            const techTags = proj.technologies 
                ? proj.technologies.map(t => `<span class="tech-tag">${t}</span>`).join('') 
                : '';

            card.innerHTML = `
                <div class="project-img-wrapper">
                    <img src="${proj.image || 'assets/project-placeholder.svg'}" alt="${proj.title}" onerror="this.onerror=null;this.src='assets/project-placeholder.svg';" />
                    <span class="project-category-badge">${proj.category}</span>
                </div>
                <div class="project-content">
                    <h3 class="project-title">${proj.title}</h3>
                    <p class="project-desc">${proj.description}</p>
                    <div class="project-tech">${techTags}</div>
                    <div class="project-links">
                        <a href="${proj.link}" class="btn btn-sm btn-primary">Open Project</a>
                    </div>
                </div>
            `;
            projectsContainer.appendChild(card);
        });
    }

    // Project Filter Handlers
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (filterButtons.length && projectsContainer) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const selected = btn.dataset.filter.trim().toLowerCase();
                const projectCards = projectsContainer.querySelectorAll('.project-card');

                projectCards.forEach(card => {
                    const cardCat = (card.dataset.category || '').trim().toLowerCase();
                    if (selected === 'all' || selected === 'all projects' || cardCat === selected) {
                        card.classList.remove('hide');
                    } else {
                        card.classList.add('hide');
                    }
                });
            });
        });
    }

    // 7. Render Services
    const servicesContainer = document.querySelector('.services-grid');
    if (servicesContainer && window.DATA && DATA.services) {
        servicesContainer.innerHTML = '';
        DATA.services.forEach(svc => {
            const card = document.createElement('div');
            card.className = 'service-card card';
            card.innerHTML = `
                <div class="service-icon">${svc.icon || '✨'}</div>
                <h3 class="service-title">${svc.title}</h3>
                <p class="service-desc">${svc.description}</p>
            `;
            servicesContainer.appendChild(card);
        });
    }

    // 8. Render Experience Timeline
    const expContainer = document.getElementById('experience-timeline');
    if (expContainer && window.DATA && DATA.experience) {
        expContainer.innerHTML = '';
        DATA.experience.forEach(exp => {
            const item = document.createElement('div');
            item.className = 'timeline-item';
            item.innerHTML = `
                <div class="timeline-date">${exp.period}</div>
                <h3 class="timeline-title">${exp.role}</h3>
                <h4 class="timeline-subtitle">${exp.organization}</h4>
                <p class="timeline-desc">${exp.details}</p>
            `;
            expContainer.appendChild(item);
        });
    }

    // 9. Render Achievements & Certifications
    const achievementsContainer = document.getElementById('achievements-list');
    if (achievementsContainer && window.DATA && DATA.achievements) {
        achievementsContainer.innerHTML = '';
        DATA.achievements.forEach(ach => {
            const card = document.createElement('div');
            card.className = 'achievement-card card';
            card.innerHTML = `
                <div class="achievement-icon">🏆</div>
                <div class="achievement-content">
                    <span class="achievement-year">${ach.year}</span>
                    <h3 class="achievement-title">${ach.title}</h3>
                    <h4 class="achievement-issuer">${ach.issuer}</h4>
                    <p class="achievement-desc">${ach.description}</p>
                </div>
            `;
            achievementsContainer.appendChild(card);
        });
    }

    // 10. Update Direct Contact Links from DATA (contact section + hero social icons)
    if (window.DATA && DATA.contact) {
        const emailLink = document.getElementById('email-link');
        const whatsappLink = document.getElementById('whatsapp-link');
        const ghLink = document.getElementById('github-link');
        const liLink = document.getElementById('linkedin-link');
        const igLink = document.getElementById('instagram-link');

        // Hero social icons
        const heroWA = document.getElementById('hero-whatsapp');
        const heroGH = document.getElementById('hero-github');
        const heroLI = document.getElementById('hero-linkedin');
        const heroIG = document.getElementById('hero-instagram');

        if (emailLink && DATA.contact.email) {
            emailLink.href = `mailto:${DATA.contact.email}`;
        }
        if (whatsappLink && DATA.contact.whatsapp) {
            whatsappLink.href = DATA.contact.whatsapp;
        }
        if (ghLink && DATA.contact.github) {
            ghLink.href = DATA.contact.github;
        }
        if (liLink && DATA.contact.linkedin) {
            liLink.href = DATA.contact.linkedin;
        }
        if (igLink && DATA.contact.instagram) {
            igLink.href = DATA.contact.instagram;
        }

        // Sync hero social icons with the same data
        if (heroWA && DATA.contact.whatsapp) {
            heroWA.href = DATA.contact.whatsapp;
        }
        if (heroGH && DATA.contact.github) {
            heroGH.href = DATA.contact.github;
        }
        if (heroLI && DATA.contact.linkedin) {
            heroLI.href = DATA.contact.linkedin;
        }
        if (heroIG && DATA.contact.instagram) {
            heroIG.href = DATA.contact.instagram;
        }
    }

    // 11. Active Navigation Highlighting with IntersectionObserver
    const navLinks = document.querySelectorAll('.nav-list li a');
    const sections = document.querySelectorAll('main section.section');

    if ('IntersectionObserver' in window && sections.length > 0 && navLinks.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.getAttribute('id');
                    navLinks.forEach(link => {
                        if (link.getAttribute('href') === `#${id}`) {
                            link.classList.add('active');
                        } else {
                            link.classList.remove('active');
                        }
                    });
                }
            });
        }, {
            root: null,
            rootMargin: '-20% 0px -60% 0px',
            threshold: 0
        });

        sections.forEach(sec => observer.observe(sec));
    }

    // 12. Contact Form Client-side Validation & Clear Demo Notification
    const form = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    if (form && formStatus) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            formStatus.className = 'form-status';

            const name = (form.name ? form.name.value : '').trim();
            const email = (form.email ? form.email.value : '').trim();
            const message = (form.message ? form.message.value : '').trim();

            if (!name || !email || !message) {
                formStatus.className = 'form-status error';
                formStatus.textContent = 'Please fill out all fields before submitting.';
                return;
            }

            // Basic email pattern check
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                formStatus.className = 'form-status error';
                formStatus.textContent = 'Please enter a valid email address.';
                return;
            }

            // Demo notice - do not falsely claim message was sent over backend
            formStatus.className = 'form-status info';
            formStatus.innerHTML = `
                <strong>Demo Form Submitted!</strong><br>
                This static website operates without an external paid server. No message was dispatched.<br>
                To reach Abhishek directly, please use the WhatsApp or Email buttons above.
            `;
            form.reset();
        });
    }

    // 13. Interactive Background Particle Canvas
    const canvas = document.getElementById('particle-bg');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        const particleCount = 65;
        const colors = ['#8a2be2', '#00e5ff', '#3b82f6', '#a855f7'];

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const createParticles = () => {
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    vx: (Math.random() - 0.5) * 0.6,
                    vy: (Math.random() - 0.5) * 0.6,
                    radius: Math.random() * 2 + 1,
                    color: colors[Math.floor(Math.random() * colors.length)]
                });
            }
        };

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Connect nearby particles with subtle lines
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 110) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(138, 43, 226, ${0.15 * (1 - dist / 110)})`;
                        ctx.lineWidth = 0.8;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            // Draw particles
            particles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();

                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
            });

            requestAnimationFrame(render);
        };

        window.addEventListener('resize', () => {
            resizeCanvas();
            createParticles();
        });

        resizeCanvas();
        createParticles();
        render();
    }
});
