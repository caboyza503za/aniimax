import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL_ANIIMOS, findAniimosByAbility, getBestAniimoForFacility, RECOMMENDED_WORKERS } from '../web/aniidex-data.js';

test('ALL_ANIIMOS contains all 210 Aniimo forms with Thai names and avatars', () => {
    assert.equal(ALL_ANIIMOS.length, 210);
    const sample = ALL_ANIIMOS.find(a => a.name === 'มังกรโลกันตร์');
    assert.ok(sample);
    assert.equal(sample.skills.Fire, 3);
    assert.ok(sample.avatar.includes('UI_PetHead_'));
});

test('findAniimosByAbility returns workers sorted by level descending', () => {
    const fireWorkers = findAniimosByAbility('Fire', 2);
    assert.ok(fireWorkers.length > 0);
    assert.ok(fireWorkers[0].skills.Fire >= fireWorkers[fireWorkers.length - 1].skills.Fire);
    
    // Supports Thai ability name
    const waterWorkers = findAniimosByAbility('น้ำ', 1);
    assert.ok(waterWorkers.length > 0);
    assert.ok(waterWorkers[0].skills.Water >= 1);
});

test('getBestAniimoForFacility maps facilities to concrete Aniimo workers', () => {
    const kilnWorker = getBestAniimoForFacility('Chimney Kiln', 'Fire', 3);
    assert.ok(kilnWorker);
    assert.equal(kilnWorker.name, 'เจ้าเพลิงคำราม');
    assert.ok(kilnWorker.avatar.includes('UI_PetHead_10053'));

    const mineWorker = getBestAniimoForFacility('Mine', 'Earth', 3);
    assert.ok(mineWorker);
    assert.equal(mineWorker.name, 'ตุ่นทลายภูผา');
});

test('workforce recommendation provides matching Aniimo and alternatives', () => {
    const worker = getBestAniimoForFacility('Clay Pit', 'Earth', 3);
    assert.ok(worker);
    assert.equal(worker.name, 'ด้วงหินซิ่ง');
    assert.ok(worker.avatar.includes('UI_PetHead_'));

    const candidates = findAniimosByAbility('Earth', 3);
    const alts = candidates.filter(c => c.name !== worker.name).slice(0, 3).map(c => c.name);
    assert.ok(alts.length > 0);
    assert.ok(alts.includes('เจ้าหมีขี้เซา') || alts.includes('ปูไม้พุ่ม'));
});

test('Dewy House exclusively mandates Fragrancier (นกน้ำหอม)', () => {
    const worker = getBestAniimoForFacility('Dewy House', 'Leisure', 1);
    assert.ok(worker);
    assert.equal(worker.name, 'นกน้ำหอม');
    assert.equal(worker.nameEn, 'Fragrancier');
    assert.equal(worker.level, 3);
    assert.equal(worker.exclusive, true);
    assert.ok(worker.avatar.includes('UI_PetHead_10352.webp'));

    // Also works with Thai name and slug alias
    const thWorker = getBestAniimoForFacility('บ้านน้ำค้าง');
    assert.equal(thWorker.name, 'นกน้ำหอม');
    assert.equal(thWorker.exclusive, true);

    const slugWorker = getBestAniimoForFacility('dewy-house');
    assert.equal(slugWorker.name, 'นกน้ำหอม');
});
