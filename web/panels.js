/* Panels: turns every result card except the Homeland map into a slide-out drawer,
   and the setup card into a left drawer once a plan exists. Pure DOM/CSS layering:
   cards keep their IDs, so app.js keeps rendering into them untouched. */
(function () {
    'use strict';

    const $ = id => document.getElementById(id);
    const results = $('results-section');
    const content = $('results-content');
    const config = document.querySelector('.config-section');
    if (!results || !content || !config) return;

    // Cards without an id of their own.
    const planContainer = $('facility-plan-container');
    const planCard = planContainer && planContainer.closest('.card');
    if (planCard && !planCard.id) planCard.id = 'facility-plan-card';
    const rateCard = content.querySelector('.rate-card');
    if (rateCard && !rateCard.id) rateCard.id = 'rate-card';

    const PANELS = [
        { key: 'rate-card',         icon: '📈', label: 'อัตราผลิต' },
        { key: 'facility-plan-card', icon: '🏭', label: 'แต่ละ Facility' },
        { key: 'aniimo-card',       icon: '🐾', label: 'ทีม Aniimo' },
        { key: 'improve-card',      icon: '💡', label: 'โอกาสปรับปรุง' },
        { key: 'seed-card',         icon: '🌱', label: 'เมล็ดพันธุ์' },
        { key: 'profit-card',       icon: '💰', label: 'กำไรต่อสินค้า' },
        { key: 'goal-section',      icon: '🎯', label: 'ตั้งเป้าหมาย' },
    ].filter(p => $(p.key));
    const SETUP = { key: 'setup', icon: '⚙️', label: 'ตั้งค่า' };

    const elFor = key => (key === 'setup' ? config : $(key));
    const titleFor = key => {
        const p = key === 'setup' ? SETUP : PANELS.find(x => x.key === key);
        return p ? `${p.icon} ${p.label}` : '';
    };

    // --- Drawer chrome -------------------------------------------------------------
    function addHead(el, key) {
        if (el.querySelector(':scope > .panel-head')) return;
        const head = document.createElement('div');
        head.className = 'panel-head';
        head.innerHTML = '<span class="panel-title"></span><button type="button" class="panel-close" aria-label="ปิด">&times;</button>';
        head.querySelector('.panel-title').textContent = titleFor(key);
        head.querySelector('.panel-close').addEventListener('click', closePanel);
        el.insertBefore(head, el.firstChild);
    }
    PANELS.forEach(p => {
        const el = $(p.key);
        el.classList.add('panel-drawer');
        addHead(el, p.key);
    });
    addHead(config, 'setup');

    const backdrop = document.createElement('div');
    backdrop.id = 'panel-backdrop';
    backdrop.addEventListener('click', closePanel);
    document.body.appendChild(backdrop);

    // --- Dock ----------------------------------------------------------------------
    const dock = document.createElement('nav');
    dock.id = 'dock-bar';
    dock.setAttribute('aria-label', 'แผงข้อมูล');
    dock.hidden = true;

    const chip = document.createElement('span');
    chip.className = 'dock-chip';
    chip.setAttribute('role', 'status');
    chip.setAttribute('aria-live', 'polite');
    dock.appendChild(chip);

    const buttons = new Map();
    function makeButton(p, extraClass) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'dock-btn' + (extraClass ? ' ' + extraClass : '');
        b.title = p.label;
        b.setAttribute('aria-expanded', 'false');
        b.innerHTML = `<span class="dock-icon" aria-hidden="true">${p.icon}</span><span class="dock-label"></span>`;
        b.querySelector('.dock-label').textContent = p.label;
        b.addEventListener('click', () => togglePanel(p.key));
        buttons.set(p.key, b);
        return b;
    }
    const sep = () => { const s = document.createElement('span'); s.className = 'dock-sep'; return s; };

    dock.appendChild(sep());
    dock.appendChild(makeButton(SETUP));
    const rerun = document.createElement('button');
    rerun.type = 'button';
    rerun.className = 'dock-btn primary';
    rerun.title = 'คำนวณแผนใหม่';
    rerun.innerHTML = '<span class="dock-icon" aria-hidden="true">▶</span><span class="dock-label">คำนวณใหม่</span>';
    rerun.addEventListener('click', () => {
        const run = $('optimize-btn');
        if (run && !run.disabled) run.click();
    });
    dock.appendChild(rerun);
    dock.appendChild(sep());
    PANELS.forEach(p => dock.appendChild(makeButton(p)));
    document.body.appendChild(dock);

    // --- Open / close --------------------------------------------------------------
    let openKey = null;

    function paint() {
        PANELS.concat([SETUP]).forEach(p => {
            const el = elFor(p.key);
            const on = p.key === openKey;
            if (el) el.classList.toggle('panel-open', on);
            const b = buttons.get(p.key);
            if (b) {
                b.classList.toggle('active', on);
                b.setAttribute('aria-expanded', String(on));
            }
        });
        backdrop.classList.toggle('show', !!openKey);
        document.body.classList.toggle('panel-lock', !!openKey);
    }
    function openPanel(key) {
        const el = elFor(key);
        if (!el || getComputedStyle(el).display === 'none') return;
        openKey = key;
        paint();
        el.scrollTop = 0;
    }
    function closePanel() {
        openKey = null;
        paint();
    }
    function togglePanel(key) {
        if (openKey === key) closePanel(); else openPanel(key);
    }
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && openKey) closePanel();
    });

    // --- Keeping everything in sync with what app.js does ---------------------------
    let hadResults = false;
    let forcedAniimo = false;

    function headline() {
        const running = document.querySelector('#solve-progress .progress-step.running .step-label');
        if (running) return { text: running.textContent.trim(), busy: true };
        const lu = $('level-up-card');
        if (lu && getComputedStyle(lu).display !== 'none') {
            const t = ($('level-up-time') || {}).textContent;
            return { text: t && t.trim() !== '-' ? `⏱ ${t.trim()}` : '', busy: false };
        }
        const rate = ($('plan-rate') || {}).textContent;
        const unit = $('rate-unit');
        if (rate && rate.trim() !== '-') {
            const u = unit && unit.selectedIndex >= 0 ? unit.options[unit.selectedIndex].text : '';
            return { text: `🪙 ${rate.trim()} ${u}`.trim(), busy: false };
        }
        return { text: '', busy: false };
    }

    function refresh() {
        const has = getComputedStyle(results).display !== 'none';

        document.body.classList.toggle('has-results', has);
        config.classList.toggle('panel-drawer', has);
        config.classList.toggle('panel-left', has);
        dock.hidden = !has;
        if (!has && openKey) closePanel();
        if (has && !hadResults) window.scrollTo({ top: 0, behavior: 'smooth' });
        hadResults = has;

        // A failed plan shows only the Aniimo card: bring it up so there's something to act on.
        const setupOnly = content.classList.contains('setup-only');
        if (has && setupOnly && !forcedAniimo && $('aniimo-card')) {
            forcedAniimo = true;
            openPanel('aniimo-card');
        }
        if (!setupOnly) forcedAniimo = false;

        PANELS.forEach(p => {
            const el = $(p.key);
            const b = buttons.get(p.key);
            if (el && b) b.disabled = getComputedStyle(el).display === 'none';
        });

        const h = headline();
        if (chip.textContent !== h.text) chip.textContent = h.text;
        chip.classList.toggle('busy', h.busy);
    }

    let queued = false;
    function schedule() {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => { queued = false; refresh(); });
    }

    const opts = { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['style', 'class'] };
    new MutationObserver(schedule).observe(results, opts);
    const progress = $('solve-progress');
    if (progress) new MutationObserver(schedule).observe(progress, opts);
    const unit = $('rate-unit');
    if (unit) unit.addEventListener('change', schedule);

    refresh();
})();
