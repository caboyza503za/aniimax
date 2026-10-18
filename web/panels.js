/* ==========================================================================
   Aniimo Homeland Studio v4.0 — Split-Screen Workspace & Live KPI Controller
   Replaces legacy modal drawers with a persistent 2-column Split-Screen Studio:
   - Top Command Bar: Quick RV Level, Strategy Switch, 4 Live KPIs, Auto-Sync status
   - Left Studio Pane: Persistent 3-Layer Homeland Blueprint Map + Rate Summary
   - Right Studio Pane: Tabbed Analytics & Setup Dock (Workforce / Production / Goals / Config)
   ========================================================================== */
(function () {
    'use strict';

    const $ = id => document.getElementById(id);
    const results = $('results-section');
    const content = $('results-content');
    const config = document.querySelector('.config-section');
    const mainEl = document.querySelector('main');
    const containerEl = document.querySelector('.container');
    if (!results || !content || !config || !mainEl || !containerEl) return;

    // Ensure key cards have stable IDs
    const planContainer = $('facility-plan-container');
    const planCard = planContainer && planContainer.closest('.card');
    if (planCard && !planCard.id) planCard.id = 'facility-plan-card';
    const rateCard = content.querySelector('.rate-card');
    if (rateCard && !rateCard.id) rateCard.id = 'rate-card';
    const layoutCard = $('layout-card');
    const aniimoCard = $('aniimo-card');
    const improveCard = $('improve-card');
    const seedCard = $('seed-card');
    const profitCard = $('profit-card');
    const goalSection = $('goal-section');

    document.body.classList.add('studio-v4');

    // --- 1. Build Top Command & Live KPI Bar -----------------------------------
    const commandBar = document.createElement('section');
    commandBar.id = 'studio-command-bar';
    commandBar.className = 'studio-command-bar';
    commandBar.setAttribute('aria-label', 'แผงควบคุมหลักและสรุปผลการผลิต');
    commandBar.innerHTML = `
        <div class="scb-controls">
            <div class="scb-field">
                <label for="studio-quick-rv" class="scb-label">🏰 เลเวลบ้าน (RV)</label>
                <select id="studio-quick-rv" class="scb-select" aria-label="RV Level"></select>
            </div>
            <div class="scb-field">
                <span class="scb-label">🎯 กลยุทธ์หลัก</span>
                <div class="scb-seg" role="group" aria-label="Strategy mode">
                    <button type="button" class="scb-seg-btn active" id="scb-strat-levelup" data-strat="level-up">🚀 อัปเลเวล RV</button>
                    <button type="button" class="scb-seg-btn" id="scb-strat-priorities" data-strat="priorities">🪙 เน้นเหรียญ/จัดลำดับ</button>
                </div>
            </div>
        </div>

        <div class="scb-kpis">
            <button type="button" class="scb-kpi" id="kpi-btn-rate" data-target-tab="production" title="คลิกเพื่อดูตารางการผลิต">
                <span class="scb-kpi-icon" id="kpi-rate-icon">⏱</span>
                <div class="scb-kpi-body">
                    <span class="scb-kpi-label" id="kpi-rate-label">เวลาอัปเลเวล / อัตราผลิต</span>
                    <strong class="scb-kpi-value" id="kpi-rate-val">กำลังคำนวณ...</strong>
                    <span class="scb-kpi-sub" id="kpi-rate-sub">ซิงค์ข้อมูลอัตโนมัติ</span>
                </div>
            </button>

            <button type="button" class="scb-kpi" id="kpi-btn-workforce" data-target-tab="workforce" title="คลิกเพื่อดูทีมแอนิโมและความสามารถ 13 สาย">
                <span class="scb-kpi-icon">🐾</span>
                <div class="scb-kpi-body">
                    <span class="scb-kpi-label">ทีมแอนิโม & 13 สาย</span>
                    <strong class="scb-kpi-value" id="kpi-workforce-val">- / -</strong>
                    <span class="scb-kpi-sub" id="kpi-workforce-sub">รอผลคำนวณ</span>
                </div>
            </button>

            <button type="button" class="scb-kpi" id="kpi-btn-facilities" data-target-tab="production" title="คลิกเพื่อดูคำสั่งงานแต่ละเครื่องจักร">
                <span class="scb-kpi-icon">🏭</span>
                <div class="scb-kpi-body">
                    <span class="scb-kpi-label">สิ่งปลูกสร้าง & ผลผลิต</span>
                    <strong class="scb-kpi-value" id="kpi-facilities-val">- เครื่อง</strong>
                    <span class="scb-kpi-sub" id="kpi-facilities-sub">แยกตามโซนอุณหภูมิ</span>
                </div>
            </button>

            <button type="button" class="scb-kpi" id="kpi-btn-storage" data-target-tab="map-focus" title="คลิกเพื่อจัดกึ่งกลางแผนผังบ้าน">
                <span class="scb-kpi-icon">📦</span>
                <div class="scb-kpi-body">
                    <span class="scb-kpi-label">คลังเก็บของอัตโนมัติ</span>
                    <strong class="scb-kpi-value" id="kpi-storage-val">Auto</strong>
                    <span class="scb-kpi-sub" id="kpi-storage-sub">คลิกคลังบนแผนที่เพื่อดูเส้นทาง</span>
                </div>
            </button>
        </div>

        <div class="scb-actions">
            <button type="button" class="scb-solve-btn" id="studio-solve-btn" title="คำนวณแผนที่ดีที่สุดใหม่ทันที">
                <span class="scb-solve-dot" id="studio-solve-dot"></span>
                <span class="scb-solve-text" id="studio-solve-text">⚡ คำนวณแผนใหม่</span>
            </button>
        </div>
    `;
    containerEl.insertBefore(commandBar, mainEl);

    // --- 2. Giant Full-Width Map Hero + Collapsed Section Drawers --------------
    const studioGrid = document.createElement('div');
    studioGrid.id = 'studio-split-grid';
    studioGrid.className = 'studio-split-grid studio-map-first';

    // Top Hero Pane: Full-Width Giant "แปลงที่ดินทั้งหมด" Map
    const mapHeroPane = document.createElement('div');
    mapHeroPane.id = 'studio-left-pane';
    mapHeroPane.className = 'studio-map-hero-pane';

    if (layoutCard) {
        layoutCard.style.display = 'block';
        // Add a fullscreen/theater toggle button to the map zoom controls
        const zoomGroup = layoutCard.querySelector('.layout-zoom-controls');
        if (zoomGroup && !$('layout-theater-btn')) {
            const theaterBtn = document.createElement('button');
            theaterBtn.type = 'button';
            theaterBtn.className = 'map-control map-control-theater';
            theaterBtn.id = 'layout-theater-btn';
            theaterBtn.title = 'ขยาย/ย่อความสูงแผนผังแปลงที่ดิน';
            theaterBtn.textContent = '⛶ ขยายเต็มจอ';
            theaterBtn.addEventListener('click', () => {
                const isTheater = layoutCard.classList.toggle('is-theater-map');
                theaterBtn.textContent = isTheater ? '✕ ย่อขนาด' : '⛶ ขยายเต็มจอ';
                const fitBtn = $('layout-zoom-fit');
                if (fitBtn) setTimeout(() => fitBtn.click(), 60);
            });
            zoomGroup.appendChild(theaterBtn);
        }
        mapHeroPane.appendChild(layoutCard);
    }

    // Bottom Collapsible Sections Container (all collapsed by default!)
    const drawersPane = document.createElement('div');
    drawersPane.id = 'studio-right-pane';
    drawersPane.className = 'studio-drawers-pane';

    // Status & Error/Progress container above drawers
    const statusArea = document.createElement('div');
    statusArea.id = 'studio-tab-viewport';
    statusArea.className = 'studio-status-area';
    const errorEl = $('error-message');
    const solveProgress = $('solve-progress');
    const progressBarContainer = $('progress-bar-container');
    const progressBarCaption = $('progress-bar-caption');
    if (errorEl) statusArea.appendChild(errorEl);
    if (solveProgress) statusArea.appendChild(solveProgress);
    if (progressBarContainer) statusArea.appendChild(progressBarContainer);
    if (progressBarCaption) statusArea.appendChild(progressBarCaption);
    mapHeroPane.insertBefore(statusArea, layoutCard);

    // Quick header bar to Collapse All / Expand All other sections
    const drawersBar = document.createElement('div');
    drawersBar.id = 'studio-tab-bar';
    drawersBar.className = 'studio-drawers-header';
    drawersBar.innerHTML = `
        <div class="sdh-title">
            <span>📑 รายละเอียดแผนการผลิตและการตั้งค่า (พับเก็บไว้เพื่อให้แปลงที่ดินแสดงผลขนาดใหญ่)</span>
        </div>
        <div class="sdh-actions">
            <button type="button" class="sdh-btn" id="studio-expand-all-btn">📂 กางดูทั้งหมด</button>
            <button type="button" class="sdh-btn" id="studio-collapse-all-btn">📁 พับเก็บทั้งหมด</button>
        </div>
    `;
    drawersPane.appendChild(drawersBar);

    const DRAWER_SPECS = [
        {
            key: 'rate',
            icon: '⏱',
            title: 'สรุปเวลาอัปเลเวล RV & อัตราการผลิต (Rate & Level-Up Summary)',
            badgeId: 'tab-badge-rate',
            cards: [rateCard],
        },
        {
            key: 'workforce',
            icon: '🐾',
            title: 'ทีมแอนิโม & ความสามารถของบ้าน 13 สาย (Aniimo Workforce & 13 Abilities)',
            badgeId: 'tab-badge-workforce',
            cards: [aniimoCard],
        },
        {
            key: 'production',
            icon: '🏭',
            title: 'คำสั่งงานสิ่งปลูกสร้าง, เมล็ดพันธุ์ & กำไรรายชิ้น (Facilities & Seeds)',
            badgeId: 'tab-badge-production',
            cards: [planCard, seedCard, profitCard],
        },
        {
            key: 'goals',
            icon: '🎯',
            title: 'เป้าหมายการผลิต & โอกาสอัปเกรด (Goals & Upgrade Opportunities)',
            badgeId: 'tab-badge-goals',
            cards: [improveCard, goalSection],
        },
        {
            key: 'config',
            icon: '⚙️',
            title: 'ตั้งค่าบ้าน (RV), สต็อกวัตถุดิบ & สูตรอาหาร (Homeland & Recipe Setup)',
            badgeId: 'tab-badge-config',
            cards: [config],
        },
    ];

    const drawerMap = new Map();
    DRAWER_SPECS.forEach(spec => {
        const details = document.createElement('details');
        details.className = 'studio-drawer';
        details.id = `studio-drawer-${spec.key}`;
        details.dataset.drawerKey = spec.key;
        // Explicitly closed by default so only the giant map is expanded!
        details.open = false;

        const summary = document.createElement('summary');
        summary.className = 'studio-drawer-summary';
        summary.innerHTML = `
            <div class="sds-left">
                <span class="sds-chevron" aria-hidden="true">▸</span>
                <span class="sds-icon" aria-hidden="true">${spec.icon}</span>
                <span class="sds-title">${spec.title}</span>
            </div>
            <div class="sds-right">
                <span class="studio-tab-badge" id="${spec.badgeId}" hidden></span>
                <span class="sds-hint">คลิกเพื่อเปิด/พับ</span>
            </div>
        `;

        const body = document.createElement('div');
        body.className = 'studio-drawer-body';

        spec.cards.forEach(c => {
            if (c) body.appendChild(c);
        });

        details.appendChild(summary);
        details.appendChild(body);
        drawersPane.appendChild(details);
        drawerMap.set(spec.key, details);
    });

    // Also ensure all inner <details> inside cards start collapsed
    document.querySelectorAll('.explain').forEach(d => {
        d.open = false;
    });

    // Keep #results-content wrapping the studioGrid so app.js selectors remain 100% valid
    results.style.display = 'block';
    content.style.display = 'block';
    studioGrid.appendChild(mapHeroPane);
    studioGrid.appendChild(drawersPane);
    content.appendChild(studioGrid);
    mainEl.appendChild(results);

    // Trigger map re-fit once the full-width layout settles
    setTimeout(() => {
        const fitBtn = $('layout-zoom-fit');
        if (fitBtn) fitBtn.click();
    }, 120);

    // --- 3. Drawer Opening / Collapsing Logic ----------------------------------
    function openDrawer(key, scroll = true) {
        const d = drawerMap.get(key);
        if (!d) return;
        d.open = true;
        if (scroll) {
            d.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function collapseAllDrawers() {
        drawerMap.forEach(d => { d.open = false; });
    }

    function expandAllDrawers() {
        drawerMap.forEach(d => { d.open = true; });
    }

    $('studio-collapse-all-btn')?.addEventListener('click', () => {
        collapseAllDrawers();
        mapHeroPane.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const fitBtn = $('layout-zoom-fit');
        if (fitBtn) setTimeout(() => fitBtn.click(), 80);
    });

    $('studio-expand-all-btn')?.addEventListener('click', () => {
        expandAllDrawers();
    });

    // Wire KPI buttons: KPI 1 opens Rate drawer, KPI 2 opens Workforce, KPI 3 opens Production, KPI 4 collapses all & focuses Giant Map
    const kpiRateBtn = $('kpi-btn-rate');
    if (kpiRateBtn) kpiRateBtn.dataset.targetTab = 'rate';

    commandBar.querySelectorAll('.scb-kpi').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.targetTab;
            if (target === 'map-focus') {
                collapseAllDrawers();
                const fitBtn = $('layout-zoom-fit');
                if (fitBtn) fitBtn.click();
                mapHeroPane.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else if (target) {
                openDrawer(target, true);
            }
        });
    });

    // --- 4. Two-Way Sync for Top Command Bar Controls --------------------------
    const homeLevelSelect = $('home-level');
    const quickRvSelect = $('studio-quick-rv');
    const stratLevelUpRadio = $('strategy-level-up');
    const stratPrioRadio = $('strategy-priorities');
    const btnStratLevelUp = $('scb-strat-levelup');
    const btnStratPrio = $('scb-strat-priorities');
    const solveBtn = $('studio-solve-btn');
    const origOptimizeBtn = $('optimize-btn');

    function syncQuickControlsFromForm() {
        if (homeLevelSelect && quickRvSelect) {
            if (quickRvSelect.options.length !== homeLevelSelect.options.length) {
                quickRvSelect.innerHTML = homeLevelSelect.innerHTML;
            }
            quickRvSelect.value = homeLevelSelect.value;
        }
        if (stratLevelUpRadio && btnStratLevelUp && btnStratPrio) {
            const isLu = stratLevelUpRadio.checked;
            btnStratLevelUp.classList.toggle('active', isLu);
            btnStratPrio.classList.toggle('active', !isLu);
        }
    }

    if (quickRvSelect && homeLevelSelect) {
        quickRvSelect.addEventListener('change', () => {
            const modeSimple = $('mode-simple');
            if (modeSimple && !modeSimple.checked) {
                modeSimple.checked = true;
                modeSimple.dispatchEvent(new Event('change', { bubbles: true }));
            }
            homeLevelSelect.value = quickRvSelect.value;
            homeLevelSelect.dispatchEvent(new Event('change', { bubbles: true }));
        });
        homeLevelSelect.addEventListener('change', syncQuickControlsFromForm);
    }

    if (btnStratLevelUp && stratLevelUpRadio) {
        btnStratLevelUp.addEventListener('click', () => {
            if (!stratLevelUpRadio.checked) {
                stratLevelUpRadio.checked = true;
                stratLevelUpRadio.dispatchEvent(new Event('change', { bubbles: true }));
                syncQuickControlsFromForm();
            }
        });
    }
    if (btnStratPrio && stratPrioRadio) {
        btnStratPrio.addEventListener('click', () => {
            if (!stratPrioRadio.checked) {
                stratPrioRadio.checked = true;
                stratPrioRadio.dispatchEvent(new Event('change', { bubbles: true }));
                syncQuickControlsFromForm();
            }
        });
    }
    if (stratLevelUpRadio) stratLevelUpRadio.addEventListener('change', syncQuickControlsFromForm);
    if (stratPrioRadio) stratPrioRadio.addEventListener('change', syncQuickControlsFromForm);

    if (solveBtn && origOptimizeBtn) {
        solveBtn.addEventListener('click', () => {
            if (!origOptimizeBtn.disabled) {
                origOptimizeBtn.click();
            }
        });
    }

    // --- 5. Live KPI & Tab Badge Synchronization -------------------------------
    function refreshStudioKpis() {
        syncQuickControlsFromForm();

        const isSolving = origOptimizeBtn ? origOptimizeBtn.disabled : false;
        const solveTextEl = $('studio-solve-text');
        const runningStep = document.querySelector('#solve-progress .progress-step.running .step-label');
        if (solveBtn && solveTextEl) {
            solveBtn.classList.toggle('is-solving', isSolving || Boolean(runningStep));
            if (isSolving || runningStep) {
                solveTextEl.textContent = runningStep ? `⏳ ${runningStep.textContent.trim()}` : '⏳ กำลังคำนวณแผน...';
            } else {
                solveTextEl.textContent = '⚡ คำนวณอัตโนมัติ (พร้อม)';
            }
        }
        if (solveProgress) {
            const hasRunningOrFail = Boolean(solveProgress.querySelector('.progress-step.running, .progress-step.fail'));
            if (!isSolving && !hasRunningOrFail && solveProgress.style.display === 'block') {
                solveProgress.style.display = 'none';
            }
        }

        // KPI 1: Rate / Level-Up Time
        const luCard = $('level-up-card');
        const kpiRateIcon = $('kpi-rate-icon');
        const kpiRateLabel = $('kpi-rate-label');
        const kpiRateVal = $('kpi-rate-val');
        const kpiRateSub = $('kpi-rate-sub');
        const tabBadgeRate = $('tab-badge-rate');
        const isLuVisible = luCard && luCard.style.display !== 'none';

        if (isLuVisible) {
            const luTime = ($('level-up-time')?.textContent || '').trim();
            const luLabel = ($('level-up-label')?.textContent || 'เลื่อนระดับบ้าน').trim();
            if (kpiRateIcon) kpiRateIcon.textContent = '⏱';
            if (kpiRateLabel) kpiRateLabel.textContent = luLabel;
            if (kpiRateVal) kpiRateVal.textContent = luTime && luTime !== '-' ? luTime : 'กำลังคำนวณ...';
            if (kpiRateSub) kpiRateSub.textContent = 'เวลาเร็วที่สุดในการอัปเลเวล RV';
            if (tabBadgeRate) {
                const hasLu = Boolean(luTime && luTime !== '-');
                tabBadgeRate.textContent = hasLu ? `${luLabel}: ${luTime}` : '';
                tabBadgeRate.hidden = !hasLu;
            }
        } else {
            const prioRow = document.querySelector('#priority-rates tbody tr.top') || document.querySelector('#priority-rates tbody tr');
            const unitSel = $('rate-unit');
            const unitText = unitSel && unitSel.selectedIndex >= 0 ? unitSel.options[unitSel.selectedIndex].text : '';
            if (prioRow && prioRow.cells && prioRow.cells.length >= 3) {
                const prioLabel = (prioRow.cells[1]?.textContent || 'อัตราการผลิต').trim();
                const prioVal = (prioRow.cells[2]?.textContent || '').trim();
                const fullPrio = prioVal ? `${prioVal} ${unitText}`.trim() : '';
                if (kpiRateIcon) kpiRateIcon.textContent = '🪙';
                if (kpiRateLabel) kpiRateLabel.textContent = prioLabel;
                if (kpiRateVal) kpiRateVal.textContent = fullPrio || 'กำลังคำนวณ...';
                if (kpiRateSub) kpiRateSub.textContent = 'ผลผลิตสูงสุดตามลำดับความสำคัญ';
                if (tabBadgeRate) {
                    tabBadgeRate.textContent = fullPrio;
                    tabBadgeRate.hidden = !fullPrio;
                }
            } else {
                const planRateEl = $('plan-rate');
                const hasSkeleton = planRateEl && planRateEl.querySelector('.skeleton');
                const rateText = hasSkeleton ? '' : (planRateEl?.textContent || '').trim();
                const displayRate = rateText && rateText !== '-'
                    ? (rateText.includes('/') ? rateText : `${rateText} ${unitText}`.trim())
                    : '';
                if (kpiRateIcon) kpiRateIcon.textContent = '🪙';
                if (kpiRateLabel) kpiRateLabel.textContent = 'อัตราผลิตเหรียญบ้าน';
                if (kpiRateVal) kpiRateVal.textContent = displayRate || 'กำลังคำนวณ...';
                if (kpiRateSub) kpiRateSub.textContent = 'รายได้สุทธิสูงสุดตามลำดับความสำคัญ';
                if (tabBadgeRate) {
                    tabBadgeRate.textContent = displayRate;
                    tabBadgeRate.hidden = !displayRate;
                }
            }
        }

        // KPI 2: Workforce & 13 Abilities
        const wfBadge = ($('aniimo-workforce-badge')?.textContent || '').trim();
        const statusBadge = ($('homeland-status-badge')?.textContent || '').trim();
        const kpiWfVal = $('kpi-workforce-val');
        const kpiWfSub = $('kpi-workforce-sub');
        const tabBadgeWf = $('tab-badge-workforce');
        if (kpiWfVal) {
            kpiWfVal.textContent = wfBadge && wfBadge !== 'Auto Calculated' ? `${wfBadge} ตัว` : 'จัดทีมอัตโนมัติ';
        }
        if (kpiWfSub) {
            kpiWfSub.textContent = statusBadge || 'ครอบคลุมความสามารถ 13 สาย';
        }
        if (tabBadgeWf) {
            const hasCount = wfBadge && wfBadge !== 'Auto Calculated' && wfBadge !== '0 ตัว';
            tabBadgeWf.textContent = hasCount ? wfBadge.split('/')[0].trim() : '';
            tabBadgeWf.hidden = !hasCount;
        }

        // KPI 3: Facilities & Production
        const facRows = planContainer ? planContainer.querySelectorAll('tbody tr:not(.idle-row)').length : 0;
        const kpiFacVal = $('kpi-facilities-val');
        const kpiFacSub = $('kpi-facilities-sub');
        const tabBadgeProd = $('tab-badge-production');
        if (kpiFacVal) {
            kpiFacVal.textContent = facRows > 0 ? `${facRows} สายการผลิต` : 'กำลังจัดสรร...';
        }
        if (kpiFacSub) {
            const dailyItems = document.querySelectorAll('#layout-daily-output-items .hp-chip').length;
            kpiFacSub.textContent = dailyItems > 0 ? `ผลิตสินค้า ${dailyItems} ชนิดพร้อมกัน` : 'แยกตามโซนอุณหภูมิและเครื่องจักร';
        }
        if (tabBadgeProd) {
            tabBadgeProd.textContent = facRows > 0 ? String(facRows) : '';
            tabBadgeProd.hidden = facRows === 0;
        }

        // KPI 4: Storage Units
        const storageLabel = ($('layout-storage-count-label')?.textContent || '5 Storage Units').trim();
        const kpiStorageVal = $('kpi-storage-val');
        const kpiStorageSub = $('kpi-storage-sub');
        const layoutSum = ($('layout-summary')?.textContent || '').trim();
        if (kpiStorageVal) {
            kpiStorageVal.textContent = storageLabel;
        }
        if (kpiStorageSub) {
            kpiStorageSub.textContent = layoutSum || 'คลิกที่คลังบนแผนที่เพื่อดูเส้นทาง';
        }

        // Tab 3 Badge: Opportunities count
        const improveItems = document.querySelectorAll('#improve-list .improve-item, #improve-list li').length;
        const tabBadgeGoals = $('tab-badge-goals');
        if (tabBadgeGoals) {
            tabBadgeGoals.textContent = improveItems > 0 ? String(improveItems) : '';
            tabBadgeGoals.hidden = improveItems === 0;
        }

        // If a custom roster failed (setup-only), switch to workforce tab so user sees the message
        if (content.classList.contains('setup-only') && activeTab !== 'workforce') {
            selectTab('workforce');
        }
    }

    let queued = false;
    function scheduleKpiRefresh() {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => {
            queued = false;
            refreshStudioKpis();
        });
    }

    const observerOpts = {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['style', 'class', 'disabled', 'hidden'],
    };
    new MutationObserver(scheduleKpiRefresh).observe(results, observerOpts);
    if (origOptimizeBtn) {
        new MutationObserver(scheduleKpiRefresh).observe(origOptimizeBtn, { attributes: true });
    }

    // Initial sync
    setTimeout(refreshStudioKpis, 50);
})();
