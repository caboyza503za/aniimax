import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const english = JSON.parse(await readFile(new URL('../web/locales/en.json', import.meta.url)));
const thai = JSON.parse(await readFile(new URL('../web/locales/th.json', import.meta.url)));

// Check that every English phrase is covered in Thai
for (const phrase of english) {
    assert.ok(phrase in thai, `Missing translation for: "${phrase}"`);
}

// Check slots matching
for (const [source, target] of Object.entries(thai)) {
    const slots = text => new Set(text.match(/\{[a-z_]+\}/gi) || []);
    assert.deepEqual(slots(source), slots(target), source);
}

const saved = new Map([['aniimax-language', 'th']]);
globalThis.localStorage = { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value) };
let releaseCatalog;
globalThis.fetch = async url => {
    await new Promise(resolve => { releaseCatalog = resolve; });
    return { ok: true, json: async () => JSON.parse(await readFile(url)) };
};
globalThis.Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 };
globalThis.NodeFilter = { SHOW_ELEMENT: 1, SHOW_TEXT: 4 };
const node = { nodeType: 3, nodeValue: 'Your Homeland' };
const labelled = {
    nodeType: 1, values: new Map([['data-label', 'Profit']]),
    hasAttribute(name) { return this.values.has(name); },
    getAttribute(name) { return this.values.get(name); },
    setAttribute(name, value) { this.values.set(name, value); },
};
const body = { nodeType: 1, hasAttribute: () => false };
let change;
const selector = { value: 'en', add() {}, addEventListener: (_, listener) => { change = listener; } };
globalThis.Option = class { constructor(label, value) { this.label = label; this.value = value; } };
globalThis.document = {
    body, documentElement: { lang: 'en' }, title: '', getElementById: () => selector,
    dispatchEvent() {},
    createTreeWalker: () => ({ currentNode: null, index: 0, nextNode() {
        this.currentNode = [node, labelled][this.index++];
        return !!this.currentNode;
    } }),
};
globalThis.MutationObserver = class { observe() {} };

const { translate, languageReady } = await import('../web/i18n.js');
assert.equal(node.nodeValue, 'Your Homeland');
assert.equal(document.documentElement.lang, 'en');
assert.equal(selector.value, 'th');
assert.equal(saved.get('aniimax-language'), 'th');

releaseCatalog();
await languageReady;
assert.equal(node.nodeValue, 'ดินแดนบ้านเกิดของคุณ');
assert.equal(document.documentElement.lang, 'th');
assert.equal(labelled.getAttribute('data-label'), 'กำไร');
assert.equal(translate('+ Add level'), '+ เพิ่มเลเวล');
assert.equal(translate('Home Coins/min'), 'เหรียญบ้าน/นาที');

selector.value = 'en';
await change();
assert.equal(node.nodeValue, 'Your Homeland');
assert.equal(labelled.getAttribute('data-label'), 'Profit');

selector.value = 'th';
await change();
assert.equal(node.nodeValue, 'ดินแดนบ้านเกิดของคุณ');
assert.equal(labelled.getAttribute('data-label'), 'กำไร');
assert.equal(saved.get('aniimax-language'), 'th');

console.log('All locale tests passed successfully!');
