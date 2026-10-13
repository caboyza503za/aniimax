import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const source = await readFile(new URL('../web/app.js', import.meta.url), 'utf8');
const start = source.indexOf('let layoutMapState = null;');
const end = source.indexOf('function renderHomelandLayout(plan)', start);
assert.ok(start >= 0 && end > start, 'the interactive layout camera should remain a self-contained UI layer');

function explorer() {
    const listeners = {};
    const attributes = new Map([['viewBox', '0 0 120 80']]);
    const svg = {
        getAttribute: name => attributes.get(name),
        setAttribute: (name, value) => attributes.set(name, String(value)),
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 600, height: 400 }),
        setPointerCapture() {},
        addEventListener: (name, handler) => { listeners[name] = handler; },
    };
    const text = () => ({ textContent: '', classList: { add() {}, remove() {} } });
    const context = {
        document: {
            querySelector: () => svg,
            querySelectorAll: () => [],
            getElementById: () => text(),
        },
        translate: value => value,
        Math,
    };
    runInNewContext(`${source.slice(start, end)}\nglobalThis.explorer = { setupInteractiveLayout, zoomLayout, resetLayoutViewport, state: () => layoutMapState };`, context);
    context.explorer.setupInteractiveLayout();
    return { ...context.explorer, svg, listeners };
}

test('layout explorer zooms the SVG camera without changing its planned base bounds', () => {
    const map = explorer();
    map.zoomLayout(2);
    assert.deepEqual({ ...map.state().baseViewBox }, { x: 0, y: 0, width: 120, height: 80 });
    assert.equal(map.state().viewBox.width, 60);
    assert.equal(map.state().viewBox.height, 40);
    assert.equal(map.svg.getAttribute('viewBox'), '30 20 60 40');

    map.resetLayoutViewport();
    assert.equal(map.svg.getAttribute('viewBox'), '0 0 120 80');
});

test('layout explorer can zoom out beyond base bounds to inspect all plots from afar', () => {
    const map = explorer();
    map.zoomLayout(0.5); // zoom out by 2x
    assert.equal(map.state().viewBox.width, 240);
    assert.equal(map.state().viewBox.height, 160);
    assert.equal(map.svg.getAttribute('viewBox'), '-60 -40 240 160');

    map.zoomLayout(0.5);
    assert.ok(map.state().viewBox.width > 240);
});

test('layout explorer exposes keyboard pan and zoom after a map is drawn', () => {
    const map = explorer();
    let prevented = false;
    map.listeners.keydown({ key: '+', preventDefault: () => { prevented = true; } });
    assert.equal(prevented, true);
    assert.equal(map.state().viewBox.width, 120 / 1.35);

    map.listeners.keydown({ key: 'ArrowRight', preventDefault() {} });
    assert.ok(map.state().viewBox.x > 0);
});

test('clicking or tapping a facility piece selects it and updates the inspector', () => {
    const listeners = {};
    const attributes = new Map([['viewBox', '0 0 120 80']]);
    const svg = {
        getAttribute: name => attributes.get(name),
        setAttribute: (name, value) => attributes.set(name, String(value)),
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 600, height: 400 }),
        setPointerCapture() {},
        releasePointerCapture() {},
        addEventListener: (name, handler) => { listeners[name] = handler; },
    };

    let inspectorTitle = '';
    let inspectorDetail = '';
    let inspectorStat = '';
    const titleEl = { set textContent(v) { inspectorTitle = v; }, get textContent() { return inspectorTitle; } };
    const detailEl = { set textContent(v) { inspectorDetail = v; }, get textContent() { return inspectorDetail; } };
    const statEl = { set textContent(v) { inspectorStat = v; }, get textContent() { return inspectorStat; } };

    const selectedList = new Set();
    const mockPiece = {
        dataset: {
            tip: 'Stargazing Bed',
            tipDetail: 'Stars · Recommended Aniimo: Star Master Squirrel (Lv.4)',
            tipStats: '2.4 trips/hour · 4.0 tiles from storage',
        },
        classList: {
            add: c => selectedList.add(c),
            remove: c => selectedList.delete(c),
        },
        closest: sel => sel === '.layout-piece' ? mockPiece : null,
    };

    const context = {
        document: {
            querySelector: () => svg,
            querySelectorAll: () => [],
            getElementById: id => {
                if (id === 'layout-inspector-title') return titleEl;
                if (id === 'layout-inspector-detail') return detailEl;
                if (id === 'layout-inspector-stat') return statEl;
                return { textContent: '', classList: { add() {}, remove() {} } };
            },
            elementFromPoint: () => mockPiece,
        },
        translate: value => value,
        Math,
    };
    runInNewContext(`${source.slice(start, end)}\nglobalThis.explorer = { setupInteractiveLayout, setLayoutInspector, state: () => layoutMapState };`, context);
    context.explorer.setupInteractiveLayout();

    // Trigger click on piece
    listeners.click({ clientX: 100, clientY: 100, target: mockPiece });
    assert.equal(inspectorTitle, 'Stargazing Bed');
    assert.equal(inspectorDetail, 'Stars · Recommended Aniimo: Star Master Squirrel (Lv.4)');
    assert.equal(inspectorStat, '2.4 trips/hour · 4.0 tiles from storage');
    assert.ok(selectedList.has('selected'));

    // Trigger pointer click sequence
    selectedList.clear();
    listeners.pointerdown({ pointerId: 1, clientX: 100, clientY: 100, target: mockPiece });
    listeners.pointerup({ pointerId: 1, clientX: 100, clientY: 100, target: svg });
    assert.equal(inspectorTitle, 'Stargazing Bed');
    assert.ok(selectedList.has('selected'));
});

test('clicking a facility highlights all units of same facility type and opens drawer', () => {
    const listeners = {};
    const attributes = new Map([['viewBox', '0 0 120 80']]);
    const svg = {
        getAttribute: name => attributes.get(name),
        setAttribute: (name, value) => attributes.set(name, String(value)),
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 600, height: 400 }),
        setPointerCapture() {},
        releasePointerCapture() {},
        addEventListener: (name, handler) => { listeners[name] = handler; },
    };

    const makeMockEl = (fac, x, y) => {
        const classes = new Set(['layout-piece']);
        const el = {
            dataset: { facility: fac, x: String(x), y: String(y), tip: fac },
            classList: {
                add: c => classes.add(c),
                remove: c => classes.delete(c),
                contains: c => classes.has(c),
            },
            getAttribute: k => k === 'data-facility' ? fac : null,
        };
        el.closest = sel => sel === '.layout-piece' ? el : null;
        return el;
    };

    const piece1 = makeMockEl('Cropland', 10, 10);
    const piece2 = makeMockEl('Cropland', 15, 10);
    const piece3 = makeMockEl('Kiln', 20, 20);
    const allPieces = [piece1, piece2, piece3];

    let drawerOpened = false;
    let drawerContent = '';
    const drawerEl = {
        classList: {
            add: c => { if (c === 'open') drawerOpened = true; },
            remove: c => { if (c === 'open') drawerOpened = false; },
            contains: c => c === 'open' ? drawerOpened : false,
        },
        hidden: true,
    };
    const fdContentEl = {
        set innerHTML(v) { drawerContent = v; },
        get innerHTML() { return drawerContent; },
        querySelectorAll: () => [],
    };
    const fdTitleEl = { textContent: '' };
    const fdIconEl = { innerHTML: '' };

    const context = {
        document: {
            querySelector: () => svg,
            querySelectorAll: sel => sel.includes('.layout-piece') ? allPieces : [],
            getElementById: id => {
                if (id === 'facility-detail-drawer') return drawerEl;
                if (id === 'fd-title') return fdTitleEl;
                if (id === 'fd-head-icon') return fdIconEl;
                if (id === 'fd-content') return fdContentEl;
                return { textContent: '', classList: { add() {}, remove() {} } };
            },
            elementFromPoint: () => piece1,
        },
        translate: value => value,
        Math,
    };

    runInNewContext(`${source.slice(start, end)}\nglobalThis.explorer = { setupInteractiveLayout, setLayoutInspector, state: () => layoutMapState };`, context);
    context.explorer.setupInteractiveLayout();

    // Select piece 1 (Cropland)
    context.explorer.setLayoutInspector(piece1);
    assert.ok(piece1.classList.contains('selected'));
    assert.ok(piece2.classList.contains('same-facility'));
    assert.ok(!piece3.classList.contains('same-facility'));
    assert.equal(drawerOpened, true);
    assert.equal(drawerEl.hidden, false);
    assert.equal(fdTitleEl.textContent, 'Cropland');

    // Deselect (click on empty area)
    context.explorer.setLayoutInspector(null);
    assert.ok(!piece1.classList.contains('selected'));
    assert.ok(!piece2.classList.contains('same-facility'));
    assert.equal(drawerOpened, false);
});

test('clicking generator or environment building toggles active-radius on matching frame', () => {
    const listeners = {};
    const attributes = new Map([['viewBox', '0 0 120 80']]);
    const svg = {
        getAttribute: name => attributes.get(name),
        setAttribute: (name, value) => attributes.set(name, String(value)),
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 600, height: 400 }),
        setPointerCapture() {},
        releasePointerCapture() {},
        addEventListener: (name, handler) => { listeners[name] = handler; },
    };

    const makeMockEl = (fac, x, y, extraClass = '') => {
        const classes = new Set(['layout-piece']);
        if (extraClass) classes.add(extraClass);
        const el = {
            dataset: { facility: fac, x: String(x), y: String(y), tip: fac },
            classList: {
                add: c => classes.add(c),
                remove: c => classes.delete(c),
                contains: c => classes.has(c),
            },
            getAttribute: k => k === 'data-facility' ? fac : (k === 'data-x' ? String(x) : (k === 'data-y' ? String(y) : null)),
        };
        el.closest = sel => sel === '.layout-piece' ? el : null;
        return el;
    };

    const genPiece = makeMockEl('Crackle Generator', 5, 5, 'crackle-generator');
    const radiusClasses = new Set(['layout-radius-edge', 'layout-generator-grid-frame']);
    const mockGenFrame = {
        dataset: { sourceX: '5', sourceY: '5', radiusX: '0', radiusY: '0', radiusW: '11', radiusH: '11' },
        classList: {
            add: c => radiusClasses.add(c),
            remove: c => radiusClasses.delete(c),
            contains: c => radiusClasses.has(c),
        },
        getAttribute: k => mockGenFrame.dataset[k] || null,
    };

    const context = {
        document: {
            querySelector: () => svg,
            querySelectorAll: sel => {
                if (sel.includes('.layout-piece')) return [genPiece];
                if (sel.includes('data-source-x') || sel.includes('active-radius') || sel.includes('layout-generator-grid-frame')) return [mockGenFrame];
                return [];
            },
            getElementById: () => ({ textContent: '', classList: { add() {}, remove() {} } }),
            elementFromPoint: () => genPiece,
        },
        translate: value => value,
        Math,
    };

    runInNewContext(`${source.slice(start, end)}\nglobalThis.explorer = { setupInteractiveLayout, setLayoutInspector, state: () => layoutMapState };`, context);
    context.explorer.setupInteractiveLayout();

    // Clicking generator activates its radius frame
    context.explorer.setLayoutInspector(genPiece);
    assert.ok(mockGenFrame.classList.contains('active-radius'));

    // Deselecting removes active-radius
    context.explorer.setLayoutInspector(null);
    assert.ok(!mockGenFrame.classList.contains('active-radius'));
});

test('homelandSvg renders in-game grid with solid and dashed lines, grass pattern, and seamless plots', () => {
    assert.ok(source.includes("cls = isSolid ? 'grid-solid' : 'grid-dashed'"));
    assert.ok(source.includes('id="layout-grass"'));
    assert.ok(source.includes('fill="url(#layout-grass)"'));
    assert.ok(source.includes('rx="0"'));
});

