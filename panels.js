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

    // --- 2. Build Split-Screen Studio DOM Structure ----------------------------
    const studioGrid = document.createElement('div');
    studioGrid.id = 'studio-split-grid';
    studioGrid.className = 'studio-split-grid';

    // Left Pane: Persistent Map + Rate Breakdown
    const leftPane = document.createElement('div');
    leftPane.id = 'studio-left-pane';
    leftPane.className = 'studio-left-pane';

    // Right Pane: Sticky Tab Bar + Tab Panels
    const rightPane = document.createElement('div');
    rightPane.id = 'studio-right-pane';
    rightPane.className = 'studio-right-pane';

    const tabBar = document.createElement('nav');
    tabBar.id = 'studio-tab-bar';
    tabBar.className = 'studio-tab-bar';
    tabBar.setAttribute('role', 'tablist');
    tabBar.setAttribute('aria-label', 'หมวดหมู่ข้อมูลและการตั้งค่า');

    const TABS = [
        { key: 'workforce',  icon: '🐾', label: 'ทีมแอนิโม & 13 สาย', badgeId: 'tab-badge-workforce' },
        { key: 'production', icon: '🏭', label: 'สายการผลิต & เมล็ด', badgeId: 'tab-badge-production' },
        { key: 'goals',      icon: '🎯', label: 'เป้าหมาย & อัปเกรด', badgeId: 'tab-badge-goals' },
        { key: 'config',     icon: '⚙️', label: 'ตั้งค่าบ้าน & สูตร', badgeId: 'tab-badge-config' },
    ];

    const tabButtons = new Map();
    TABS.forEach(t => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'studio-tab-btn';
        btn.dataset.tab = t.key;
        btn.setAttribute('role', 'tab');
        btn.setAttribute('aria-selected', 'false');
        btn.innerHTML = `
            <span class="studio-tab-icon" aria-hidden="true">${t.icon}</span>
            <span class="studio-tab-label">${t.label}</span>
            <span class="studio-tab-badge" id="${t.badgeId}" hidden></span>
        `;
        btn.addEventListener('click', () => selectTab(t.key));
        tabButtons.set(t.key, btn);
        tabBar.appendChild(btn);
    });

    const tabViewport = document.createElement('div');
    tabViewport.id = 'studio-tab-viewport';
    tabViewport.className = 'studio-tab-viewport';

    // Move cards into their designated Split-Screen slots
    // Left Pane gets layoutCard and rateCard
    if (layoutCard) {
        layoutCard.style.display = 'block';
        leftPane.appendChild(layoutCard);
    }
    if (rateCard) {
        leftPane.appendChild(rateCard);
    }

    // Right Pane gets error-message, solve-progress, and all tabbed cards inside #results-content
    const errorEl = $('error-message');
    const solveProgress = $('solve-progress');
    if (errorEl) tabViewport.appendChild(errorEl);
    if (solveProgress) tabViewport.appendChild(solveProgress);

    // Tag each card with its tab group
    if (aniimoCard) {
        aniimoCard.dataset.studioTab = 'workforce';
        tabViewport.appendChild(aniimoCard);
    }
    if (planCard) {
        planCard.dataset.studioTab = 'production';
        tabViewport.appendChild(planCard);
    }
    if (seedCard) {
        seedCard.dataset.studioTab = 'production';
        tabViewport.appendChild(seedCard);
    }
    if (profitCard) {
        profitCard.dataset.studioTab = 'production';
        tabViewport.appendChild(profitCard);
    }
    if (improveCard) {
        improveCard.dataset.studioTab = 'goals';
        tabViewport.appendChild(improveCard);
    }
    if (goalSection) {
        goalSection.dataset.studioTab = 'goals';
        tabViewport.appendChild(goalSection);
    }
    if (config) {
        config.dataset.studioTab = 'config';
        tabViewport.appendChild(config);
    }

    rightPane.appendChild(tabBar);
    rightPane.appendChild(tabViewport);

    // Keep #results-content wrapping the studioGrid so app.js selectors remain 100% valid
    results.style.display = 'block';
    content.style.display = 'block';
    studioGrid.appendChild(leftPane);
    studioGrid.appendChild(rightPane);
    content.appendChild(studioGrid);
    mainEl.appendChild(results);

    // --- 3. Tab Switching Logic ------------------------------------------------
    let activeTab = 'workforce';

    function selectTab(tabKey) {
        activeTab = tabKey;
        rightPane.dataset.activeTab = tabKey;
        tabButtons.forEach((btn, key) => {
            const isSelected = key === tabKey;
            btn.classList.toggle('active', isSelected);
            btn.setAttribute('aria-selected', String(isSelected));
        });
    }

    // Default to workforce tab
    selectTab('workforce');

    // Wire KPI buttons to switch tabs or fit map
    commandBar.querySelectorAll('.scb-kpi').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.targetTab;
            if (target === 'map-focus') {
                const fitBtn = $('layout-zoom-fit');
                if (fitBtn) fitBtn.click();
                leftPane.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else if (target) {
                selectTab(target);
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
        if (solveBtn && solveTextEl) {
            solveBtn.classList.toggle('is-solving', isSolving);
            const runningStep = document.querySelector('#solve-progress .progress-step.running .step-label');
            if (isSolving) {
                solveTextEl.textContent = runningStep ? `⏳ ${runningStep.textContent.trim()}` : '⏳ กำลังคำนวณแผน...';
            } else {
                solveTextEl.textContent = '⚡ คำนวณอัตโนมัติ (พร้อม)';
            }
        }

        // KPI 1: Rate / Level-Up Time
        const luCard = $('level-up-card');
        const kpiRateIcon = $('kpi-rate-icon');
        const kpiRateLabel = $('kpi-rate-label');
        const kpiRateVal = $('kpi-rate-val');
        const kpiRateSub = $('kpi-rate-sub');
        const isLuVisible = luCard && getComputedStyle(luCard).display !== 'none';

        if (isLuVisible) {
            const luTime = ($('level-up-time')?.textContent || '').trim();
            const luLabel = ($('level-up-label')?.textContent || 'เลื่อนระดับบ้าน').trim();
            if (kpiRateIcon) kpiRateIcon.textContent = '⏱';
            if (kpiRateLabel) kpiRateLabel.textContent = luLabel;
            if (kpiRateVal) kpiRateVal.textContent = luTime && luTime !== '-' ? luTime : 'กำลังคำนวณ...';
            if (kpiRateSub) kpiRateSub.textContent = 'เวลาเร็วที่สุดในการอัปเลเวล RV';
        } else {
            const rateText = ($('plan-rate')?.textContent || '').trim();
            const unitSel = $('rate-unit');
            const unitText = unitSel && unitSel.selectedIndex >= 0 ? unitSel.options[unitSel.selectedIndex].text : '';
            if (kpiRateIcon) kpiRateIcon.textContent = '🪙';
            if (kpiRateLabel) kpiRateLabel.textContent = 'อัตราผลิตเหรียญบ้าน';
            if (kpiRateVal) kpiRateVal.textContent = rateText && rateText !== '-' ? `${rateText} ${unitText}`.trim() : 'กำลังคำนวณ...';
            if (kpiRateSub) kpiRateSub.textContent = 'รายได้สุทธิสูงสุดตามลำดับความสำคัญ';
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
