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
