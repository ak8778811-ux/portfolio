// admin.js – Local Admin Dashboard & Portfolio Content Editor (Stage 3)
// Full CRUD editor for Profile, Skills, Projects, Services, Education, Contact.
// Persists to localStorage under 'localPortfolioData'. Vanilla JavaScript only.

(function () {
    'use strict';

    const STORAGE_KEY = 'localPortfolioData';

    // Application state in memory
    let state = {};
    let isModifiedFromStorage = false;
    let activityLog = [];

    // Modal state tracker
    let currentModalHandler = null;

    document.addEventListener('DOMContentLoaded', () => {
        initState();
        setupNavigation();
        setupGlobalActions();
        renderAll();
    });

    /**
     * Initializes state from localStorage or falls back to deep clone of window.DATA
     */
    function initState() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                state = JSON.parse(stored);
                logActivity('Loaded portfolio content from local browser storage.');
            } catch (e) {
                console.error('Error parsing stored portfolio data:', e);
                state = cloneDefaults();
                logActivity('Initialized portfolio content from default data.js.');
            }
        } else {
            state = cloneDefaults();
            logActivity('Initialized portfolio content from default data.js.');
        }

        // Clean unconfirmed placeholder location if present
        cleanUnconfirmedPlaceholders();
    }

    function cloneDefaults() {
        return JSON.parse(JSON.stringify(window.DATA || {}));
    }

    function cleanUnconfirmedPlaceholders() {
        if (state.profile && typeof state.profile.location === 'string') {
            if (state.profile.location.includes('[Your Location') || state.profile.location.includes('City, Country')) {
                state.profile.location = '';
            }
        }
    }

    function logActivity(message) {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        activityLog.unshift({ message, time });
        if (activityLog.length > 20) activityLog.pop();
    }

    /**
     * Re-renders all panels, statistics, and indicators
     */
    function renderAll() {
        updateStorageIndicator();
        renderDashboardStats();
        renderProfileEditor();
        renderSkillsEditor();
        renderProjectsEditor();
        renderServicesEditor();
        renderEducationEditor();
        renderContactEditor();
        renderResumeEditor();
        renderSettingsEditor();
    }

    /**
     * Sets up sidebar navigation & panel toggles
     */
    function setupNavigation() {
        const sidebar = document.getElementById('admin-sidebar');
        const toggleBtn = document.getElementById('sidebar-toggle');
        const navLinks = document.querySelectorAll('.sidebar-nav a');
        const panels = document.querySelectorAll('.panel');

        function activatePanel(panelName) {
            panels.forEach(panel => {
                panel.classList.toggle('active', panel.id === `panel-${panelName}`);
            });

            navLinks.forEach(link => {
                link.classList.toggle('active', link.dataset.panel === panelName);
            });

            if (window.innerWidth <= 860 && sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
            }

            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const panel = link.dataset.panel;
                if (panel) {
                    activatePanel(panel);
                    window.location.hash = panel;
                }
            });
        });

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('active');
            });
        }

        const hash = window.location.hash.replace('#', '');
        if (hash && document.getElementById(`panel-${hash}`)) {
            activatePanel(hash);
        }

        // Setup modal close buttons
        const modalOverlay = document.getElementById('admin-modal');
        const modalCloseBtn = document.getElementById('modal-close-btn');
        const modalCancelBtn = document.getElementById('modal-cancel-btn');
        const modalSaveBtn = document.getElementById('modal-save-btn');

        if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
        if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeModal);
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) closeModal();
            });
        }

        if (modalSaveBtn) {
            modalSaveBtn.addEventListener('click', () => {
                if (typeof currentModalHandler === 'function') {
                    currentModalHandler();
                }
            });
        }
    }

    /**
     * Setup global Save, Reset, and Export handlers
     */
    function setupGlobalActions() {
        const btnSave = document.getElementById('btn-save-changes');
        const btnReset = document.getElementById('btn-reset-changes');
        const btnExport = document.getElementById('btn-export-backup');

        if (btnSave) {
            btnSave.addEventListener('click', saveChangesToStorage);
        }

        if (btnReset) {
            btnReset.addEventListener('click', resetChangesToDefaults);
        }

        if (btnExport) {
            btnExport.addEventListener('click', exportBackupJson);
        }

        // Section add buttons
        const btnAddCategory = document.getElementById('btn-add-category');
        if (btnAddCategory) btnAddCategory.addEventListener('click', promptAddCategory);

        const btnAddProject = document.getElementById('btn-add-project');
        if (btnAddProject) btnAddProject.addEventListener('click', openAddProjectModal);

        const btnAddService = document.getElementById('btn-add-service');
        if (btnAddService) btnAddService.addEventListener('click', openAddServiceModal);

        const btnAddEducation = document.getElementById('btn-add-education');
        if (btnAddEducation) btnAddEducation.addEventListener('click', openAddEducationModal);
    }

    /**
     * Saves working data to localStorage
     */
    function saveChangesToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            isModifiedFromStorage = false;
            logActivity('Saved all modifications to browser localStorage (localPortfolioData).');
            showToast('Changes successfully saved to local browser storage!', 'success');
            renderAll();
        } catch (e) {
            console.error('Error saving to localStorage:', e);
            showToast('Failed to save changes: ' + e.message, 'error');
        }
    }

    /**
     * Resets working data back to data.js defaults after user confirmation
     */
    function resetChangesToDefaults() {
        const confirmed = window.confirm(
            'Are you sure you want to reset all portfolio content back to the original defaults from data.js?\n\n' +
            'All unexported local edits in this browser will be discarded.'
        );

        if (!confirmed) return;

        localStorage.removeItem(STORAGE_KEY);
        state = cloneDefaults();
        cleanUnconfirmedPlaceholders();
        isModifiedFromStorage = false;
        logActivity('Reset all portfolio data back to original defaults from data.js.');
        showToast('All portfolio data reset to original defaults from data.js.', 'info');
        renderAll();
    }

    /**
     * Exports a JSON backup file of current working state
     */
    function exportBackupJson() {
        try {
            const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
            const downloadAnchor = document.createElement('a');
            const dateStr = new Date().toISOString().slice(0, 10);
            downloadAnchor.setAttribute('href', dataStr);
            downloadAnchor.setAttribute('download', `portfolio-backup-${dateStr}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();

            logActivity(`Exported portfolio backup JSON (portfolio-backup-${dateStr}.json).`);
            showToast('Backup JSON exported successfully!', 'success');
        } catch (e) {
            console.error('Export error:', e);
            showToast('Failed to export backup: ' + e.message, 'error');
        }
    }

    function updateStorageIndicator() {
        const dot = document.getElementById('storage-indicator-dot');
        const text = document.getElementById('storage-indicator-text');
        const hasStored = !!localStorage.getItem(STORAGE_KEY);

        if (dot && text) {
            if (isModifiedFromStorage) {
                dot.className = 'indicator-dot modified';
                text.textContent = 'Storage: Unsaved Changes (Click "Save Changes")';
            } else if (hasStored) {
                dot.className = 'indicator-dot';
                text.textContent = 'Storage: localStorage (localPortfolioData)';
            } else {
                dot.className = 'indicator-dot';
                text.textContent = 'Storage: data.js (Default Baseline)';
            }
        }
    }

    function markModified() {
        isModifiedFromStorage = true;
        updateStorageIndicator();
    }

    /**
     * Renders Dashboard stats & snapshot
     */
    function renderDashboardStats() {
        const projects = Array.isArray(state.projects) ? state.projects : [];
        const skills = Array.isArray(state.skills) ? state.skills : [];
        const services = Array.isArray(state.services) ? state.services : [];
        const education = Array.isArray(state.education) ? state.education : [];
        const profile = state.profile || {};

        let totalSkillsCount = 0;
        skills.forEach(cat => {
            if (Array.isArray(cat.items)) totalSkillsCount += cat.items.length;
        });

        const statProjectsEl = document.getElementById('stat-projects');
        const statSkillsEl = document.getElementById('stat-skills');
        const statSkillsMetaEl = document.getElementById('stat-skills-meta');
        const statServicesEl = document.getElementById('stat-services');
        const statEducationEl = document.getElementById('stat-education');
        const welcomeHeading = document.getElementById('welcome-heading');
        const profileStatusEl = document.getElementById('dash-profile-status');

        if (statProjectsEl) statProjectsEl.textContent = projects.length;
        if (statSkillsEl) statSkillsEl.textContent = totalSkillsCount;
        if (statSkillsMetaEl) statSkillsMetaEl.textContent = `${skills.length} categories (${totalSkillsCount} items)`;
        if (statServicesEl) statServicesEl.textContent = services.length;
        if (statEducationEl) statEducationEl.textContent = education.length;

        if (welcomeHeading && profile.name) {
            welcomeHeading.textContent = `Welcome, ${profile.name}`;
        }

        if (profileStatusEl) {
            profileStatusEl.textContent = profile.status || 'Available';
        }

        // Profile Snapshot
        const profileSummaryEl = document.getElementById('dash-profile-summary');
        if (profileSummaryEl) {
            profileSummaryEl.innerHTML = `
                <div class="profile-summary-list">
                    <div class="profile-summary-item">
                        <span class="label">Full Name</span>
                        <span class="value">${escapeHtml(profile.name || 'Not set')}</span>
                    </div>
                    <div class="profile-summary-item">
                        <span class="label">Professional Title</span>
                        <span class="value">${escapeHtml(profile.title || 'Not set')}</span>
                    </div>
                    <div class="profile-summary-item">
                        <span class="label">Primary Roles</span>
                        <span class="value">${escapeHtml(Array.isArray(profile.professions) ? profile.professions.join(', ') : 'Not set')}</span>
                    </div>
                    <div class="profile-summary-item">
                        <span class="label">Focus Areas</span>
                        <span class="value">${escapeHtml(profile.focusAreas || 'Not set')}</span>
                    </div>
                    <div class="profile-summary-item">
                        <span class="label">Languages</span>
                        <span class="value">${escapeHtml(profile.languages || 'Not set')}</span>
                    </div>
                </div>
            `;
        }

        // Activity List
        const activityListEl = document.getElementById('activity-list');
        if (activityListEl) {
            if (activityLog.length === 0) {
                activityListEl.innerHTML = `
                    <div class="empty-state" style="padding: 1.5rem 1rem;">
                        <div class="empty-state-icon">📋</div>
                        <h3>No activity yet</h3>
                        <p>No changes or administrative events recorded in this session.</p>
                    </div>
                `;
            } else {
                activityListEl.innerHTML = `
                    <div class="activity-list">
                        ${activityLog.slice(0, 5).map(item => `
                            <div class="activity-item">
                                <span>${escapeHtml(item.message)}</span>
                                <span class="activity-time">${escapeHtml(item.time)}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        }
    }

    /**
     * PROFILE: Edit full name, professional title, roles, bio, focus areas and languages.
     * Does not display an unconfirmed location placeholder.
     */
    function renderProfileEditor() {
        const container = document.getElementById('profile-editor-container');
        if (!container) return;

        const profile = state.profile || {};
        const professionsStr = Array.isArray(profile.professions) ? profile.professions.join(', ') : '';

        container.innerHTML = `
            <div class="card" style="max-width: 860px;">
                <form id="profile-edit-form" novalidate>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="prof-name">Full Name <span style="color:var(--primary-cyan)">*</span></label>
                            <input type="text" id="prof-name" value="${escapeHtml(profile.name || '')}" placeholder="e.g. Abhishek Kumar Mehta" required />
                        </div>
                        <div class="form-group">
                            <label for="prof-title">Professional Title</label>
                            <input type="text" id="prof-title" value="${escapeHtml(profile.title || '')}" placeholder="e.g. Developer & Designer" />
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="prof-roles">Rotating Roles (Comma-separated)</label>
                            <input type="text" id="prof-roles" value="${escapeHtml(professionsStr)}" placeholder="e.g. BTech Student, Web Developer, Programmer" />
                            <span class="field-hint">Used for animated hero role rotation on the website</span>
                        </div>
                        <div class="form-group">
                            <label for="prof-status">Availability Status</label>
                            <input type="text" id="prof-status" value="${escapeHtml(profile.status || '')}" placeholder="e.g. Available for Projects" />
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="prof-focus">Focus Areas</label>
                            <input type="text" id="prof-focus" value="${escapeHtml(profile.focusAreas || '')}" placeholder="e.g. Web Development, Programming, Software Design" />
                        </div>
                        <div class="form-group">
                            <label for="prof-languages">Languages</label>
                            <input type="text" id="prof-languages" value="${escapeHtml(profile.languages || '')}" placeholder="e.g. English, Hindi" />
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="prof-bio">Biography</label>
                        <textarea id="prof-bio" rows="4" placeholder="Write your professional bio...">${escapeHtml(profile.bio || '')}</textarea>
                    </div>

                    <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem;">
                        <button type="submit" class="btn btn-primary">
                            <span>✓</span> Update Profile
                        </button>
                    </div>
                </form>
            </div>
        `;

        const form = document.getElementById('profile-edit-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('prof-name').value.trim();
            const title = document.getElementById('prof-title').value.trim();
            const rolesRaw = document.getElementById('prof-roles').value.trim();
            const status = document.getElementById('prof-status').value.trim();
            const focusAreas = document.getElementById('prof-focus').value.trim();
            const languages = document.getElementById('prof-languages').value.trim();
            const bio = document.getElementById('prof-bio').value.trim();

            if (!name) {
                showToast('Full Name cannot be empty.', 'error');
                return;
            }

            const professions = rolesRaw
                ? rolesRaw.split(',').map(r => r.trim()).filter(Boolean)
                : [];

            state.profile = {
                ...state.profile,
                name,
                title,
                professions,
                status,
                focusAreas,
                languages,
                bio
            };

            // Unconfirmed location is cleanly excluded from placeholders
            delete state.profile.location;

            markModified();
            logActivity(`Updated profile details for "${name}".`);
            showToast('Profile information updated in local working state.', 'success');
            renderDashboardStats();
            renderProfileEditor();
        });
    }

    /**
     * SKILLS: Add, edit and delete skill categories and individual skills.
     */
    function renderSkillsEditor() {
        const container = document.getElementById('skills-editor-container');
        if (!container) return;

        const skills = Array.isArray(state.skills) ? state.skills : [];

        if (skills.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">⚡</div>
                    <h3>No Skill Categories Found</h3>
                    <p>Click "+ Add Category" above to create your first categorized skill group.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="cards-layout-grid">
                ${skills.map((cat, catIndex) => {
                    const items = Array.isArray(cat.items) ? cat.items : [];
                    return `
                        <div class="card skill-category-card">
                            <div class="card-header">
                                <h3>${escapeHtml(cat.category || 'Untitled Category')}</h3>
                                <div class="category-header-actions">
                                    <button type="button" class="btn-icon" data-cat-idx="${catIndex}" data-action="edit-cat" title="Edit Category Name">✏️</button>
                                    <button type="button" class="btn-icon danger" data-cat-idx="${catIndex}" data-action="delete-cat" title="Delete Category">🗑️</button>
                                </div>
                            </div>
                            <div class="skill-pills-wrap">
                                ${items.length > 0 ? items.map((skill, skillIndex) => `
                                    <span class="editable-skill-pill">
                                        <span class="skill-title-text" data-cat-idx="${catIndex}" data-skill-idx="${skillIndex}" title="Click to edit skill">${escapeHtml(skill)}</span>
                                        <button type="button" class="skill-delete-btn" data-cat-idx="${catIndex}" data-skill-idx="${skillIndex}" title="Delete skill">✕</button>
                                    </span>
                                `).join('') : '<span class="text-dim" style="font-size: 0.85rem;">No skills in this category yet.</span>'}
                            </div>
                            <div class="add-skill-bar">
                                <input type="text" placeholder="Add skill (e.g. TypeScript)..." id="add-skill-input-${catIndex}" />
                                <button type="button" class="btn btn-secondary btn-sm" data-cat-idx="${catIndex}" data-action="add-skill">+ Add</button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // Bind delete skill buttons
        container.querySelectorAll('.skill-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const catIdx = parseInt(btn.dataset.catIdx, 10);
                const skillIdx = parseInt(btn.dataset.skillIdx, 10);
                const skillName = state.skills[catIdx].items[skillIdx];

                const confirmed = window.confirm(`Are you sure you want to delete skill "${skillName}"?`);
                if (!confirmed) return;

                state.skills[catIdx].items.splice(skillIdx, 1);
                markModified();
                logActivity(`Deleted skill "${skillName}".`);
                showToast(`Deleted skill "${skillName}".`, 'info');
                renderSkillsEditor();
                renderDashboardStats();
            });
        });

        // Bind edit skill text click
        container.querySelectorAll('.skill-title-text').forEach(span => {
            span.addEventListener('click', () => {
                const catIdx = parseInt(span.dataset.catIdx, 10);
                const skillIdx = parseInt(span.dataset.skillIdx, 10);
                const currentName = state.skills[catIdx].items[skillIdx];

                const newName = window.prompt(`Edit skill name:`, currentName);
                if (newName !== null && newName.trim() && newName.trim() !== currentName) {
                    state.skills[catIdx].items[skillIdx] = newName.trim();
                    markModified();
                    logActivity(`Renamed skill "${currentName}" to "${newName.trim()}".`);
                    showToast('Skill updated.', 'success');
                    renderSkillsEditor();
                    renderDashboardStats();
                }
            });
        });

        // Bind add skill action
        container.querySelectorAll('[data-action="add-skill"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const catIdx = parseInt(btn.dataset.catIdx, 10);
                const input = document.getElementById(`add-skill-input-${catIdx}`);
                const val = input.value.trim();
                if (!val) return;

                if (!Array.isArray(state.skills[catIdx].items)) {
                    state.skills[catIdx].items = [];
                }

                state.skills[catIdx].items.push(val);
                input.value = '';
                markModified();
                logActivity(`Added skill "${val}" to category "${state.skills[catIdx].category}".`);
                showToast(`Added skill "${val}".`, 'success');
                renderSkillsEditor();
                renderDashboardStats();
            });
        });

        // Support enter key on add skill inputs
        container.querySelectorAll('.add-skill-bar input').forEach(input => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const catIdx = input.id.replace('add-skill-input-', '');
                    const btn = container.querySelector(`[data-action="add-skill"][data-cat-idx="${catIdx}"]`);
                    if (btn) btn.click();
                }
            });
        });

        // Category edit name
        container.querySelectorAll('[data-action="edit-cat"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const catIdx = parseInt(btn.dataset.catIdx, 10);
                const currentCat = state.skills[catIdx].category;
                const newCatName = window.prompt('Edit category name:', currentCat);
                if (newCatName !== null && newCatName.trim() && newCatName.trim() !== currentCat) {
                    state.skills[catIdx].category = newCatName.trim();
                    markModified();
                    logActivity(`Renamed category "${currentCat}" to "${newCatName.trim()}".`);
                    showToast('Category renamed.', 'success');
                    renderSkillsEditor();
                    renderDashboardStats();
                }
            });
        });

        // Category delete
        container.querySelectorAll('[data-action="delete-cat"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const catIdx = parseInt(btn.dataset.catIdx, 10);
                const cat = state.skills[catIdx];
                const confirmed = window.confirm(
                    `Are you sure you want to delete category "${cat.category}"?\n` +
                    `This will also delete its ${cat.items ? cat.items.length : 0} skill items.`
                );
                if (!confirmed) return;

                state.skills.splice(catIdx, 1);
                markModified();
                logActivity(`Deleted skill category "${cat.category}".`);
                showToast(`Deleted category "${cat.category}".`, 'info');
                renderSkillsEditor();
                renderDashboardStats();
            });
        });
    }

    function promptAddCategory() {
        const catName = window.prompt('Enter new skill category name (e.g. Backend Development, DevOps):');
        if (!catName || !catName.trim()) return;

        if (!Array.isArray(state.skills)) state.skills = [];

        state.skills.push({
            category: catName.trim(),
            items: []
        });

        markModified();
        logActivity(`Created new skill category "${catName.trim()}".`);
        showToast(`Created category "${catName.trim()}".`, 'success');
        renderSkillsEditor();
        renderDashboardStats();
    }

    /**
     * PROJECTS: Add, edit and delete projects.
     * Supports title, description, category, technologies, image path and project URL.
     */
    function renderProjectsEditor() {
        const container = document.getElementById('projects-editor-container');
        if (!container) return;

        const projects = Array.isArray(state.projects) ? state.projects : [];

        if (projects.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📁</div>
                    <h3>No Projects Available</h3>
                    <p>Click "+ Add Project" above to create your first portfolio project entry.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="cards-layout-grid">
                ${projects.map((proj, idx) => {
                    const techs = Array.isArray(proj.technologies) ? proj.technologies : [];
                    return `
                        <div class="card project-admin-card">
                            <div class="project-card-top">
                                <div>
                                    <h3>${escapeHtml(proj.title || 'Untitled Project')}</h3>
                                    <span class="badge-primary" style="margin-top: 0.35rem; display: inline-block;">
                                        ${escapeHtml(proj.category || 'General')}
                                    </span>
                                </div>
                            </div>
                            <p class="project-admin-desc">${escapeHtml(proj.description || 'No description provided.')}</p>
                            <div class="project-admin-tech">
                                ${techs.map(t => `<span class="tech-tag">${escapeHtml(t)}</span>`).join('')}
                            </div>
                            <div style="font-size: 0.8rem; color: var(--text-dim);">
                                <div><strong>Image:</strong> ${escapeHtml(proj.image || 'None')}</div>
                                <div><strong>Link:</strong> ${escapeHtml(proj.link || '#')}</div>
                            </div>
                            <div class="card-action-bar">
                                <button type="button" class="btn btn-secondary btn-sm" data-proj-idx="${idx}" data-action="edit-proj">
                                    ✏️ Edit
                                </button>
                                <button type="button" class="btn btn-danger btn-sm" data-proj-idx="${idx}" data-action="delete-proj">
                                    🗑️ Delete
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        container.querySelectorAll('[data-action="edit-proj"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.projIdx, 10);
                openEditProjectModal(idx);
            });
        });

        container.querySelectorAll('[data-action="delete-proj"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.projIdx, 10);
                const proj = state.projects[idx];
                const confirmed = window.confirm(`Are you sure you want to delete project "${proj.title}"?`);
                if (!confirmed) return;

                state.projects.splice(idx, 1);
                markModified();
                logActivity(`Deleted project "${proj.title}".`);
                showToast(`Deleted project "${proj.title}".`, 'info');
                renderProjectsEditor();
                renderDashboardStats();
            });
        });
    }

    function openAddProjectModal() {
        showModal('Add New Project', `
            <div class="form-group">
                <label for="proj-form-title">Project Title <span style="color:var(--primary-cyan)">*</span></label>
                <input type="text" id="proj-form-title" placeholder="e.g. Personal Portfolio Website" required />
            </div>
            <div class="form-group">
                <label for="proj-form-cat">Category <span style="color:var(--primary-cyan)">*</span></label>
                <input type="text" id="proj-form-cat" placeholder="e.g. Web Development, Programming, Creative & Media" required />
            </div>
            <div class="form-group">
                <label for="proj-form-desc">Description <span style="color:var(--primary-cyan)">*</span></label>
                <textarea id="proj-form-desc" placeholder="Brief project summary and feature highlights..." required></textarea>
            </div>
            <div class="form-group">
                <label for="proj-form-tech">Technologies (Comma-separated)</label>
                <input type="text" id="proj-form-tech" placeholder="e.g. HTML5, CSS3, JavaScript" />
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="proj-form-img">Image Path</label>
                    <input type="text" id="proj-form-img" placeholder="e.g. assets/portfolio-project.png" />
                </div>
                <div class="form-group">
                    <label for="proj-form-link">Project URL</label>
                    <input type="text" id="proj-form-link" placeholder="e.g. #home or https://..." />
                </div>
            </div>
        `, () => {
            const title = document.getElementById('proj-form-title').value.trim();
            const category = document.getElementById('proj-form-cat').value.trim();
            const description = document.getElementById('proj-form-desc').value.trim();
            const techStr = document.getElementById('proj-form-tech').value.trim();
            const image = document.getElementById('proj-form-img').value.trim();
            const link = document.getElementById('proj-form-link').value.trim();

            if (!title || !category || !description) {
                showToast('Please fill in Title, Category, and Description.', 'error');
                return;
            }

            if (!Array.isArray(state.projects)) state.projects = [];

            const technologies = techStr ? techStr.split(',').map(t => t.trim()).filter(Boolean) : [];

            state.projects.push({
                title,
                category,
                description,
                technologies,
                image: image || 'assets/project-placeholder.svg',
                link: link || '#'
            });

            closeModal();
            markModified();
            logActivity(`Added new project "${title}".`);
            showToast(`Project "${title}" added.`, 'success');
            renderProjectsEditor();
            renderDashboardStats();
        });
    }

    function openEditProjectModal(index) {
        const proj = state.projects[index];
        const techStr = Array.isArray(proj.technologies) ? proj.technologies.join(', ') : '';

        showModal('Edit Project', `
            <div class="form-group">
                <label for="proj-form-title">Project Title <span style="color:var(--primary-cyan)">*</span></label>
                <input type="text" id="proj-form-title" value="${escapeHtml(proj.title || '')}" required />
            </div>
            <div class="form-group">
                <label for="proj-form-cat">Category <span style="color:var(--primary-cyan)">*</span></label>
                <input type="text" id="proj-form-cat" value="${escapeHtml(proj.category || '')}" required />
            </div>
            <div class="form-group">
                <label for="proj-form-desc">Description <span style="color:var(--primary-cyan)">*</span></label>
                <textarea id="proj-form-desc" required>${escapeHtml(proj.description || '')}</textarea>
            </div>
            <div class="form-group">
                <label for="proj-form-tech">Technologies (Comma-separated)</label>
                <input type="text" id="proj-form-tech" value="${escapeHtml(techStr)}" />
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="proj-form-img">Image Path</label>
                    <input type="text" id="proj-form-img" value="${escapeHtml(proj.image || '')}" />
                </div>
                <div class="form-group">
                    <label for="proj-form-link">Project URL</label>
                    <input type="text" id="proj-form-link" value="${escapeHtml(proj.link || '')}" />
                </div>
            </div>
        `, () => {
            const title = document.getElementById('proj-form-title').value.trim();
            const category = document.getElementById('proj-form-cat').value.trim();
            const description = document.getElementById('proj-form-desc').value.trim();
            const techStrInput = document.getElementById('proj-form-tech').value.trim();
            const image = document.getElementById('proj-form-img').value.trim();
            const link = document.getElementById('proj-form-link').value.trim();

            if (!title || !category || !description) {
                showToast('Please fill in Title, Category, and Description.', 'error');
                return;
            }

            const technologies = techStrInput ? techStrInput.split(',').map(t => t.trim()).filter(Boolean) : [];

            state.projects[index] = {
                title,
                category,
                description,
                technologies,
                image: image || 'assets/project-placeholder.svg',
                link: link || '#'
            };

            closeModal();
            markModified();
            logActivity(`Updated project "${title}".`);
            showToast(`Project "${title}" updated.`, 'success');
            renderProjectsEditor();
            renderDashboardStats();
        });
    }

    /**
     * SERVICES: Add, edit and delete services.
     */
    function renderServicesEditor() {
        const container = document.getElementById('services-editor-container');
        if (!container) return;

        const services = Array.isArray(state.services) ? state.services : [];

        if (services.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🛠️</div>
                    <h3>No Services Configured</h3>
                    <p>Click "+ Add Service" above to add capabilities to your offerings.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="cards-layout-grid">
                ${services.map((svc, idx) => `
                    <div class="card service-admin-card">
                        <div class="service-card-top">
                            <div class="service-icon-box">${svc.icon || '✨'}</div>
                            <div>
                                <h3 style="font-size: 1.15rem; color: var(--text-main);">${escapeHtml(svc.title || 'Untitled Service')}</h3>
                            </div>
                        </div>
                        <p style="color: var(--text-muted); font-size: 0.9rem; line-height: 1.5; flex: 1;">
                            ${escapeHtml(svc.description || 'No description.')}
                        </p>
                        <div class="card-action-bar">
                            <button type="button" class="btn btn-secondary btn-sm" data-svc-idx="${idx}" data-action="edit-svc">
                                ✏️ Edit
                            </button>
                            <button type="button" class="btn btn-danger btn-sm" data-svc-idx="${idx}" data-action="delete-svc">
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        container.querySelectorAll('[data-action="edit-svc"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.svcIdx, 10);
                openEditServiceModal(idx);
            });
        });

        container.querySelectorAll('[data-action="delete-svc"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.svcIdx, 10);
                const svc = state.services[idx];
                const confirmed = window.confirm(`Are you sure you want to delete service "${svc.title}"?`);
                if (!confirmed) return;

                state.services.splice(idx, 1);
                markModified();
                logActivity(`Deleted service "${svc.title}".`);
                showToast(`Deleted service "${svc.title}".`, 'info');
                renderServicesEditor();
                renderDashboardStats();
            });
        });
    }

    function openAddServiceModal() {
        showModal('Add New Service', `
            <div class="form-group">
                <label for="svc-form-icon">Icon (Emoji or Symbol)</label>
                <input type="text" id="svc-form-icon" placeholder="e.g. 💻, ⚙️, 🎨, 🚀" value="💻" />
            </div>
            <div class="form-group">
                <label for="svc-form-title">Service Title <span style="color:var(--primary-cyan)">*</span></label>
                <input type="text" id="svc-form-title" placeholder="e.g. Web Development" required />
            </div>
            <div class="form-group">
                <label for="svc-form-desc">Description <span style="color:var(--primary-cyan)">*</span></label>
                <textarea id="svc-form-desc" placeholder="Explain what you provide in this service..." required></textarea>
            </div>
        `, () => {
            const icon = document.getElementById('svc-form-icon').value.trim();
            const title = document.getElementById('svc-form-title').value.trim();
            const description = document.getElementById('svc-form-desc').value.trim();

            if (!title || !description) {
                showToast('Please provide Title and Description.', 'error');
                return;
            }

            if (!Array.isArray(state.services)) state.services = [];

            state.services.push({
                icon: icon || '✨',
                title,
                description
            });

            closeModal();
            markModified();
            logActivity(`Added service "${title}".`);
            showToast(`Service "${title}" added.`, 'success');
            renderServicesEditor();
            renderDashboardStats();
        });
    }

    function openEditServiceModal(index) {
        const svc = state.services[index];
        showModal('Edit Service', `
            <div class="form-group">
                <label for="svc-form-icon">Icon (Emoji or Symbol)</label>
                <input type="text" id="svc-form-icon" value="${escapeHtml(svc.icon || '💻')}" />
            </div>
            <div class="form-group">
                <label for="svc-form-title">Service Title <span style="color:var(--primary-cyan)">*</span></label>
                <input type="text" id="svc-form-title" value="${escapeHtml(svc.title || '')}" required />
            </div>
            <div class="form-group">
                <label for="svc-form-desc">Description <span style="color:var(--primary-cyan)">*</span></label>
                <textarea id="svc-form-desc" required>${escapeHtml(svc.description || '')}</textarea>
            </div>
        `, () => {
            const icon = document.getElementById('svc-form-icon').value.trim();
            const title = document.getElementById('svc-form-title').value.trim();
            const description = document.getElementById('svc-form-desc').value.trim();

            if (!title || !description) {
                showToast('Please provide Title and Description.', 'error');
                return;
            }

            state.services[index] = {
                icon: icon || '✨',
                title,
                description
            };

            closeModal();
            markModified();
            logActivity(`Updated service "${title}".`);
            showToast(`Service "${title}" updated.`, 'success');
            renderServicesEditor();
            renderDashboardStats();
        });
    }

    /**
     * EDUCATION: Add, edit and delete education records.
     */
    function renderEducationEditor() {
        const container = document.getElementById('education-editor-container');
        if (!container) return;

        const education = Array.isArray(state.education) ? state.education : [];

        if (education.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🎓</div>
                    <h3>No Education Records Found</h3>
                    <p>Click "+ Add Education" above to list your academic journey.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="cards-layout-grid">
                ${education.map((edu, idx) => `
                    <div class="card education-admin-card">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div>
                                <span class="badge-primary">${escapeHtml(edu.year || 'Period N/A')}</span>
                                <div class="degree" style="margin-top: 0.5rem;">${escapeHtml(edu.degree || 'Degree')}</div>
                                <div class="institution">${escapeHtml(edu.institution || 'Institution')}</div>
                            </div>
                        </div>
                        <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.25rem;">
                            ${escapeHtml(edu.description || '')}
                        </p>
                        <div class="card-action-bar">
                            <button type="button" class="btn btn-secondary btn-sm" data-edu-idx="${idx}" data-action="edit-edu">
                                ✏️ Edit
                            </button>
                            <button type="button" class="btn btn-danger btn-sm" data-edu-idx="${idx}" data-action="delete-edu">
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        container.querySelectorAll('[data-action="edit-edu"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.eduIdx, 10);
                openEditEducationModal(idx);
            });
        });

        container.querySelectorAll('[data-action="delete-edu"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.eduIdx, 10);
                const edu = state.education[idx];
                const confirmed = window.confirm(`Are you sure you want to delete education entry "${edu.degree}" at "${edu.institution}"?`);
                if (!confirmed) return;

                state.education.splice(idx, 1);
                markModified();
                logActivity(`Deleted education entry "${edu.degree}".`);
                showToast(`Deleted education record.`, 'info');
                renderEducationEditor();
                renderDashboardStats();
            });
        });
    }

    function openAddEducationModal() {
        showModal('Add Education Record', `
            <div class="form-group">
                <label for="edu-form-degree">Degree / Course <span style="color:var(--primary-cyan)">*</span></label>
                <input type="text" id="edu-form-degree" placeholder="e.g. BTech" required />
            </div>
            <div class="form-group">
                <label for="edu-form-inst">Institution <span style="color:var(--primary-cyan)">*</span></label>
                <input type="text" id="edu-form-inst" placeholder="e.g. Atria Institute of Technology" required />
            </div>
            <div class="form-group">
                <label for="edu-form-year">Year / Semester <span style="color:var(--primary-cyan)">*</span></label>
                <input type="text" id="edu-form-year" placeholder="e.g. Current • 3rd Semester" required />
            </div>
            <div class="form-group">
                <label for="edu-form-desc">Description</label>
                <textarea id="edu-form-desc" placeholder="Details about course, specialization or achievements..."></textarea>
            </div>
        `, () => {
            const degree = document.getElementById('edu-form-degree').value.trim();
            const institution = document.getElementById('edu-form-inst').value.trim();
            const year = document.getElementById('edu-form-year').value.trim();
            const description = document.getElementById('edu-form-desc').value.trim();

            if (!degree || !institution || !year) {
                showToast('Please provide Degree, Institution, and Year.', 'error');
                return;
            }

            if (!Array.isArray(state.education)) state.education = [];

            state.education.push({
                degree,
                institution,
                year,
                description
            });

            closeModal();
            markModified();
            logActivity(`Added education record "${degree}" at "${institution}".`);
            showToast(`Education record added.`, 'success');
            renderEducationEditor();
            renderDashboardStats();
        });
    }

    function openEditEducationModal(index) {
        const edu = state.education[index];
        showModal('Edit Education Record', `
            <div class="form-group">
                <label for="edu-form-degree">Degree / Course <span style="color:var(--primary-cyan)">*</span></label>
                <input type="text" id="edu-form-degree" value="${escapeHtml(edu.degree || '')}" required />
            </div>
            <div class="form-group">
                <label for="edu-form-inst">Institution <span style="color:var(--primary-cyan)">*</span></label>
                <input type="text" id="edu-form-inst" value="${escapeHtml(edu.institution || '')}" required />
            </div>
            <div class="form-group">
                <label for="edu-form-year">Year / Semester <span style="color:var(--primary-cyan)">*</span></label>
                <input type="text" id="edu-form-year" value="${escapeHtml(edu.year || '')}" required />
            </div>
            <div class="form-group">
                <label for="edu-form-desc">Description</label>
                <textarea id="edu-form-desc">${escapeHtml(edu.description || '')}</textarea>
            </div>
        `, () => {
            const degree = document.getElementById('edu-form-degree').value.trim();
            const institution = document.getElementById('edu-form-inst').value.trim();
            const year = document.getElementById('edu-form-year').value.trim();
            const description = document.getElementById('edu-form-desc').value.trim();

            if (!degree || !institution || !year) {
                showToast('Please provide Degree, Institution, and Year.', 'error');
                return;
            }

            state.education[index] = {
                degree,
                institution,
                year,
                description
            };

            closeModal();
            markModified();
            logActivity(`Updated education record "${degree}".`);
            showToast(`Education record updated.`, 'success');
            renderEducationEditor();
            renderDashboardStats();
        });
    }

    /**
     * CONTACT: Edit email, WhatsApp and LinkedIn URLs. Validate email and URL formats.
     */
    function renderContactEditor() {
        const container = document.getElementById('contact-editor-container');
        if (!container) return;

        const contact = state.contact || {};

        container.innerHTML = `
            <div class="card" style="max-width: 860px;">
                <form id="contact-edit-form" novalidate>
                    <div class="form-group" id="grp-contact-email">
                        <label for="contact-email">Email Address <span style="color:var(--primary-cyan)">*</span></label>
                        <input type="email" id="contact-email" value="${escapeHtml(contact.email || '')}" placeholder="e.g. abhishekraaz9771@gmail.com" required />
                        <span class="field-error-msg" id="err-contact-email" style="display:none;"></span>
                    </div>

                    <div class="form-group" id="grp-contact-wa">
                        <label for="contact-whatsapp">WhatsApp Link <span style="color:var(--primary-cyan)">*</span></label>
                        <input type="url" id="contact-whatsapp" value="${escapeHtml(contact.whatsapp || '')}" placeholder="e.g. https://wa.me/919608850355" required />
                        <span class="field-hint">Format: https://wa.me/&lt;phonenumber&gt;</span>
                        <span class="field-error-msg" id="err-contact-wa" style="display:none;"></span>
                    </div>

                    <div class="form-group" id="grp-contact-li">
                        <label for="contact-linkedin">LinkedIn Profile URL <span style="color:var(--primary-cyan)">*</span></label>
                        <input type="url" id="contact-linkedin" value="${escapeHtml(contact.linkedin || '')}" placeholder="e.g. https://www.linkedin.com/in/abhishek-mehta-bbab1339b/" required />
                        <span class="field-error-msg" id="err-contact-li" style="display:none;"></span>
                    </div>

                    <div class="form-row">
                        <div class="form-group" id="grp-contact-gh">
                            <label for="contact-github">GitHub Profile URL (Optional)</label>
                            <input type="url" id="contact-github" value="${escapeHtml(contact.github || '')}" placeholder="https://github.com/..." />
                            <span class="field-error-msg" id="err-contact-gh" style="display:none;"></span>
                        </div>
                        <div class="form-group" id="grp-contact-ig">
                            <label for="contact-instagram">Instagram Profile URL (Optional)</label>
                            <input type="url" id="contact-instagram" value="${escapeHtml(contact.instagram || '')}" placeholder="https://instagram.com/..." />
                            <span class="field-error-msg" id="err-contact-ig" style="display:none;"></span>
                        </div>
                    </div>

                    <div style="display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1rem;">
                        <button type="submit" class="btn btn-primary">
                            <span>✓</span> Update Contact Channels
                        </button>
                    </div>
                </form>
            </div>
        `;

        const form = document.getElementById('contact-edit-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const emailInput = document.getElementById('contact-email');
            const waInput = document.getElementById('contact-whatsapp');
            const liInput = document.getElementById('contact-linkedin');
            const ghInput = document.getElementById('contact-github');
            const igInput = document.getElementById('contact-instagram');

            const emailVal = emailInput.value.trim();
            const waVal = waInput.value.trim();
            const liVal = liInput.value.trim();
            const ghVal = ghInput.value.trim();
            const igVal = igInput.value.trim();

            let hasError = false;

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailVal || !emailRegex.test(emailVal)) {
                setFieldError('grp-contact-email', 'err-contact-email', 'Please provide a valid email address (e.g. user@example.com).');
                hasError = true;
            } else {
                clearFieldError('grp-contact-email', 'err-contact-email');
            }

            // WhatsApp validation (URL)
            if (!waVal || !isValidUrl(waVal)) {
                setFieldError('grp-contact-wa', 'err-contact-wa', 'Please provide a valid WhatsApp URL starting with https://');
                hasError = true;
            } else {
                clearFieldError('grp-contact-wa', 'err-contact-wa');
            }

            // LinkedIn validation
            if (!liVal || !isValidUrl(liVal)) {
                setFieldError('grp-contact-li', 'err-contact-li', 'Please provide a valid LinkedIn URL starting with https://');
                hasError = true;
            } else {
                clearFieldError('grp-contact-li', 'err-contact-li');
            }

            // Optional GitHub validation
            if (ghVal && !isValidUrl(ghVal)) {
                setFieldError('grp-contact-gh', 'err-contact-gh', 'Please enter a valid URL or leave blank.');
                hasError = true;
            } else {
                clearFieldError('grp-contact-gh', 'err-contact-gh');
            }

            // Optional Instagram validation
            if (igVal && !isValidUrl(igVal)) {
                setFieldError('grp-contact-ig', 'err-contact-ig', 'Please enter a valid URL or leave blank.');
                hasError = true;
            } else {
                clearFieldError('grp-contact-ig', 'err-contact-ig');
            }

            if (hasError) {
                showToast('Validation failed. Please correct highlighted contact fields.', 'error');
                return;
            }

            state.contact = {
                ...state.contact,
                email: emailVal,
                whatsapp: waVal,
                linkedin: liVal,
                github: ghVal,
                instagram: igVal
            };

            markModified();
            logActivity('Updated contact channels and social profile URLs.');
            showToast('Contact channels updated successfully.', 'success');
            renderContactEditor();
        });
    }

    function isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    function setFieldError(groupId, errorId, message) {
        const grp = document.getElementById(groupId);
        const err = document.getElementById(errorId);
        if (grp) grp.classList.add('has-error');
        if (err) {
            err.textContent = message;
            err.style.display = 'block';
        }
    }

    function clearFieldError(groupId, errorId) {
        const grp = document.getElementById(groupId);
        const err = document.getElementById(errorId);
        if (grp) grp.classList.remove('has-error');
        if (err) {
            err.textContent = '';
            err.style.display = 'none';
        }
    }

    /**
     * RESUME: Preview & Status
     */
    function renderResumeEditor() {
        const container = document.getElementById('resume-editor-container');
        if (!container) return;

        container.innerHTML = `
            <div class="card" style="max-width: 700px;">
                <div class="card-header">
                    <h3>Resume Document Reference</h3>
                    <span class="badge-primary">PDF Asset</span>
                </div>
                <div class="detail-list">
                    <div class="detail-row">
                        <div class="detail-label">Configured File</div>
                        <div class="detail-value"><code>assets/resume.pdf</code> / <code>resume.pdf</code></div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Public Section</div>
                        <div class="detail-value">Section <code>#resume</code> on main portfolio</div>
                    </div>
                    <div class="detail-row" style="border-bottom: none;">
                        <div class="detail-label">Actions</div>
                        <div class="detail-value">
                            <a href="resume.pdf" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
                                ↗ Open Resume in Tab
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * SETTINGS: Persistence details & Backup controls
     */
    function renderSettingsEditor() {
        const container = document.getElementById('settings-editor-container');
        if (!container) return;

        const hasStored = !!localStorage.getItem(STORAGE_KEY);

        container.innerHTML = `
            <div class="card" style="max-width: 760px;">
                <div class="card-header">
                    <h3>Storage Configuration</h3>
                    <span class="status-badge">Stage 3 Active</span>
                </div>
                <div class="detail-list">
                    <div class="detail-row">
                        <div class="detail-label">Storage Backend</div>
                        <div class="detail-value">
                            Browser LocalStorage (<code>${STORAGE_KEY}</code>)
                            <div style="font-size: 0.85rem; color: var(--text-dim); margin-top: 0.25rem;">
                                ${hasStored ? '<strong style="color:var(--success-green);">Active:</strong> Custom modifications are saved locally in this browser.' : '<strong style="color:var(--primary-cyan);">Active:</strong> Running on baseline data.js.'}
                            </div>
                        </div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Public Synchronization</div>
                        <div class="detail-value" style="color: var(--text-muted); font-size: 0.9rem;">
                            <strong>Note:</strong> In Stage 3, modifications are saved in your local browser storage (<code>${STORAGE_KEY}</code>).
                            The original <code>data.js</code> file remains untouched as your permanent baseline.
                        </div>
                    </div>
                    <div class="detail-row" style="border-bottom: none;">
                        <div class="detail-label">Emergency Controls</div>
                        <div class="detail-value" style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                            <button type="button" class="btn btn-export btn-sm" id="btn-settings-export">
                                📥 Export Backup JSON
                            </button>
                            <button type="button" class="btn btn-danger btn-sm" id="btn-settings-reset">
                                ↺ Reset to Baseline
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const btnExport = document.getElementById('btn-settings-export');
        const btnReset = document.getElementById('btn-settings-reset');
        if (btnExport) btnExport.addEventListener('click', exportBackupJson);
        if (btnReset) btnReset.addEventListener('click', resetChangesToDefaults);
    }

    /**
     * Modal Dialog helpers
     */
    function showModal(title, bodyHtml, onSaveHandler) {
        const overlay = document.getElementById('admin-modal');
        const titleEl = document.getElementById('modal-title');
        const bodyEl = document.getElementById('modal-body');

        if (!overlay || !titleEl || !bodyEl) return;

        titleEl.textContent = title;
        bodyEl.innerHTML = bodyHtml;
        currentModalHandler = onSaveHandler;

        overlay.classList.remove('hidden');
        overlay.setAttribute('aria-hidden', 'false');

        // Focus first input inside modal
        setTimeout(() => {
            const firstInput = bodyEl.querySelector('input, textarea, select');
            if (firstInput) firstInput.focus();
        }, 50);
    }

    function closeModal() {
        const overlay = document.getElementById('admin-modal');
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.setAttribute('aria-hidden', 'true');
        }
        currentModalHandler = null;
    }

    /**
     * Toast notification system
     */
    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const iconMap = {
            success: '✓',
            error: '✕',
            info: 'ℹ'
        };

        toast.innerHTML = `
            <span>${iconMap[type] || '•'}</span>
            <span>${escapeHtml(message)}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    function escapeHtml(str) {
        if (typeof str !== 'string') return String(str || '');
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
})();
