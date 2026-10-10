// Tests for the Thai (th) web text using official Aniimo translations
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const saved = new Map([['aniimax-language', 'th']]);
globalThis.localStorage = { getItem: key => saved.get(key), setItem: (key, value) => saved.set(key, value) };
globalThis.fetch = async url => ({ ok: true, json: async () => JSON.parse(await readFile(url)) });
globalThis.Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 };
globalThis.NodeFilter = { SHOW_ELEMENT: 1, SHOW_TEXT: 4 };
const node = { nodeType: 3, nodeValue: 'Your Homeland' };
const selector = { value: 'en', add() {}, addEventListener() {} };
globalThis.Option = class { constructor(label, value) { this.label = label; this.value = value; } };
globalThis.document = {
    body: { nodeType: 1, hasAttribute: () => false }, documentElement: { lang: 'en' }, title: '',
    getElementById: () => selector, dispatchEvent() {},
    createTreeWalker: () => ({ currentNode: null, done: false, nextNode() {
        this.currentNode = this.done ? null : node;
        this.done = true;
        return !!this.currentNode;
    } }),
};
globalThis.MutationObserver = class { observe() {} };

const i18n = await import('../web/i18n.js');
const catalog = JSON.parse(await readFile(new URL('../web/locales/th.json', import.meta.url)));

// Check slots matching
for (const [source, target] of Object.entries(catalog)) {
    const slots = text => new Set(text.match(/\{[a-z_]+\}/gi) || []);
    assert.deepEqual(slots(source), slots(target), source);
}

// Test key translations
assert.equal(i18n.translate('Your Homeland'), 'ดินแดนบ้านเกิดของคุณ');
assert.equal(i18n.translate('Chimney Kiln'), 'เตาเผาปล่องไฟ');
assert.equal(i18n.translate('Woodworking Bench'), 'โต๊ะงานไม้');
assert.equal(i18n.translate('Coarse-Sifted Ore'), 'แร่กรองหยาบ');
assert.equal(i18n.translate('Sintered Ore Brick'), 'อิฐแร่ซินเตอร์');
assert.equal(i18n.translate('Rough Lumber'), 'ไม้แปรรูปดิบ');
assert.equal(i18n.translate('Standard Planks'), 'แผ่นไม้กระดานมาตรฐาน');
assert.equal(i18n.translate('Home Coins'), 'เหรียญบ้าน');
assert.equal(i18n.translate('RV level'), 'เลเวล RV');

console.log('All Thai locale tests passed successfully!');
