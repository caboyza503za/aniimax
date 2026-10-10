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
