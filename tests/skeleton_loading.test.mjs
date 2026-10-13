import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const saved = new Map([['aniimax-language', 'th']]);
globalThis.localStorage = { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value) };
globalThis.fetch = async url => ({ ok: true, json: async () => JSON.parse(await readFile(url)) });
globalThis.Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 };
globalThis.NodeFilter = { SHOW_ELEMENT: 1, SHOW_TEXT: 4 };
const element = {
    value: 'en',
    style: {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    add() {},
    options: [],
    closest() { return null; },
    matches() { return false; },
    appendChild() {},
    setAttribute() {},
    getAttribute() { return null; },
    addEventListener() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
};
globalThis.Option = class { constructor(label, value) { this.label = label; this.value = value; } };
globalThis.location = { hash: '', search: '', pathname: '/' };
globalThis.document = {
    body: { nodeType: 1, hasAttribute: () => false, appendChild() {} },
    documentElement: { lang: 'en' },
    title: '',
    readyState: 'complete',
    getElementById: () => element,
    querySelector: () => element,
    querySelectorAll: () => [element],
    createElement: () => element,
    dispatchEvent() {},
    addEventListener() {},
    createTreeWalker: () => ({ currentNode: null, nextNode() { return false; } }),
};
globalThis.window = { addEventListener() {}, location: globalThis.location };
globalThis.MutationObserver = class { observe() {} };
globalThis.Worker = class { postMessage() {} terminate() {} addEventListener() {} };

const {
    getLayoutSkeletonHtml,
    getWorkforceSkeletonHtml,
    getAbilitiesSkeletonHtml,
    getTableSkeletonHtml,
    getImprovementSkeletonHtml
} = await import('../web/app.js');

test('getLayoutSkeletonHtml renders animated blueprint map structure', () => {
    const html = getLayoutSkeletonHtml();
    assert.ok(html.includes('skeleton-map-wrapper'));
    assert.ok(html.includes('skeleton-map-grid-bg'));
    assert.ok(html.includes('skeleton-map-radar'));
    assert.ok(html.includes('skeleton-map-plots'));
    assert.ok(html.includes('skeleton-spinner'));
    assert.ok(html.includes('Arranging optimal homeland layout...') || html.includes('กำลังจัดวางผังบ้าน'));
});

test('getWorkforceSkeletonHtml renders 6 skeleton worker cards', () => {
    const html = getWorkforceSkeletonHtml();
    assert.ok(html.includes('skeleton-workforce-grid'));
    const cards = html.split('skeleton-worker-card').length - 1;
    assert.equal(cards, 6);
    assert.ok(html.includes('skeleton-worker-avatar'));
});

test('getAbilitiesSkeletonHtml renders 13 skeleton ability pills', () => {
    const html = getAbilitiesSkeletonHtml();
    assert.ok(html.includes('skeleton-abilities-strip'));
    const pills = html.split('skeleton-ability-pill').length - 1;
    assert.equal(pills, 13);
});

test('getTableSkeletonHtml renders correct number of skeleton rows and cells', () => {
    const html = getTableSkeletonHtml(4, 5);
    assert.ok(html.includes('skeleton-table-wrapper'));
    const rows = html.split('<tr>').length - 1;
    const cells = html.split('<td>').length - 1;
    assert.equal(rows, 5);
    assert.equal(cells, 20);
});

test('getImprovementSkeletonHtml renders 3 opportunity skeleton cards', () => {
    const html = getImprovementSkeletonHtml();
    assert.ok(html.includes('skeleton-improve-list'));
    const items = html.split('skeleton-improve-item').length - 1;
    assert.equal(items, 3);
});
