import test from 'node:test';
import assert from 'node:assert/strict';
import {
    ALL_ANIIMOS,
    findAniimosByAbility,
    getBestAniimoForFacility,
    getRecommendedWorker,
    resolveFacilityFamilySpec,
    isExcludedFromWorkforce,
    RECOMMENDED_WORKERS
} from '../web/aniidex-data.js';

test('ALL_ANIIMOS contains all 210 Aniimo forms with Thai names and avatars', () => {
    assert.equal(ALL_ANIIMOS.length, 210);
    const sample = ALL_ANIIMOS.find(a => a.name === 'มังกรโลกันตร์');
    assert.ok(sample);
    assert.equal(sample.skills.Fire, 3);
    assert.ok(sample.avatar.includes('UI_PetHead_'));
});

test('Rare Aniimos (มังกรโลกันตร์, ไอริสสายรุ้ง, สิงโตแสงตะวัน, etc.) are excluded from workforce', () => {
    assert.equal(isExcludedFromWorkforce({ name: 'มังกรโลกันตร์', id: '10025' }), true);
    assert.equal(isExcludedFromWorkforce({ name: 'มังกรโลกันตร์', id: '1002503' }), true);
    assert.equal(isExcludedFromWorkforce({ name: 'ไอริสสายรุ้ง', id: '10213' }), true);
    assert.equal(isExcludedFromWorkforce({ name: 'สิงโตแสงตะวัน', id: '10361' }), true);
    assert.equal(isExcludedFromWorkforce({ name: 'ราชสีห์สุริยัน', id: '10363' }), true);
    assert.equal(isExcludedFromWorkforce({ name: 'จิ้งจอกแสงจันทร์', id: '10371' }), true);
    assert.equal(isExcludedFromWorkforce({ name: 'เฟนเนกจันทรา', id: '10373' }), true);

    // Regular farm Aniimos are NOT excluded
    assert.equal(isExcludedFromWorkforce({ name: 'แกะปุยเมฆ', id: '10261' }), false);
    assert.equal(isExcludedFromWorkforce({ name: 'นากขี้อาย', id: '10171' }), false);
    assert.equal(isExcludedFromWorkforce({ name: 'ดาวจิ๋ว', id: '10191' }), false);
    assert.equal(isExcludedFromWorkforce({ name: 'ไอริสน้อย', id: '10211' }), false);
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
    assert.equal(kilnWorker.name, 'เจ้าหมาถ่าน');
    assert.ok(kilnWorker.avatar.includes('UI_PetHead_10051'));

    const mineWorker = getBestAniimoForFacility('Mine', 'Earth', 3);
    assert.ok(mineWorker);
    assert.equal(mineWorker.name, 'กิ้งก่าหินจิ๋ว');
    assert.ok(mineWorker.avatar.includes('UI_PetHead_10281'));
});

test('workforce recommendation provides matching Aniimo and alternatives', () => {
    const worker = getBestAniimoForFacility('Clay Pit', 'Earth', 3);
    assert.ok(worker);
    assert.equal(worker.name, 'ปูไม้พุ่ม');
    assert.ok(worker.avatar.includes('UI_PetHead_'));

    const candidates = findAniimosByAbility('Earth', 3);
    const alts = candidates.filter(c => c.name !== worker.name).slice(0, 3).map(c => c.name);
    assert.ok(alts.length > 0);
    assert.ok(alts.includes('เจ้าหมีขี้เซา') || alts.includes('ด้วงหินซิ่ง'));
});

test('Dewy House exclusively mandates Fragrancier (นกน้ำหอม) and family alts', () => {
    const worker = getBestAniimoForFacility('Dewy House', 'Leisure', 1);
    assert.ok(worker);
    assert.equal(worker.name, 'นกน้ำหอม');
    assert.equal(worker.nameEn, 'Fragrancier');
    assert.equal(worker.level, 3);
    assert.equal(worker.exclusive, true);
    assert.deepEqual(worker.alts, ['นกน้ำดอกไม้']);
    assert.ok(worker.avatar.includes('UI_PetHead_10352.webp'));

    // Also works with Thai name and slug alias
    const thWorker = getBestAniimoForFacility('บ้านน้ำค้าง');
    assert.equal(thWorker.name, 'นกน้ำหอม');
    assert.equal(thWorker.exclusive, true);

    const slugWorker = getBestAniimoForFacility('dewy-house');
    assert.equal(slugWorker.name, 'นกน้ำหอม');
});

test('Nimbus Bed (เตียงเมฆฝน) requires sheep family for Wool and Iris family for Petals', () => {
    // Wool -> วงศ์แกะ (แกะปุยเมฆ, แกะเทอร์โบ, แกะแดนฝัน)
    const woolWorker = getBestAniimoForFacility('Nimbus Bed', 'Leisure', 1, 'Wool');
    assert.ok(woolWorker);
    assert.equal(woolWorker.name, 'แกะปุยเมฆ');
    assert.equal(woolWorker.exclusive, true);
    assert.deepEqual(woolWorker.alts, ['แกะเทอร์โบ', 'แกะแดนฝัน']);
    assert.ok(woolWorker.exclusiveNote.includes('วงศ์แกะ'));

    // Thai item name: ขนแกะ
    const thWoolWorker = getBestAniimoForFacility('เตียงเมฆฝน', 'Leisure', 1, 'ขนแกะ');
    assert.equal(thWoolWorker.name, 'แกะปุยเมฆ');
    assert.equal(thWoolWorker.exclusive, true);

    // Petals -> วงศ์ไอริสน้อย (ไอริสน้อย, ไอริสเริงระบำ; excludes ไอริสสายรุ้ง)
    const petalWorker = getBestAniimoForFacility('Nimbus Bed', 'Leisure', 1, 'Petals');
    assert.ok(petalWorker);
    assert.equal(petalWorker.name, 'ไอริสน้อย');
    assert.equal(petalWorker.exclusive, true);
    assert.deepEqual(petalWorker.alts, ['ไอริสเริงระบำ']);
    assert.ok(!petalWorker.alts.includes('ไอริสสายรุ้ง'));
    assert.ok(petalWorker.exclusiveNote.includes('วงศ์ไอริสน้อย'));

    // Thai item name: กลีบดอกไม้
    const thPetalWorker = getBestAniimoForFacility('เตียงเมฆฝน', 'Leisure', 1, 'กลีบดอกไม้');
    assert.equal(thPetalWorker.name, 'ไอริสน้อย');

    // getRecommendedWorker check
    const recWool = getRecommendedWorker('Nimbus Bed', 'Wool');
    assert.equal(recWool.name, 'แกะปุยเมฆ');
    const recPetal = getRecommendedWorker('Nimbus Bed', 'Petals');
    assert.equal(recPetal.name, 'ไอริสน้อย');
});

test('Tidewhisper Sandcastle (ปราสาททราย) requires otter family for Sea Salt and star family for Pearl', () => {
    // Sea Salt -> วงศ์นาก (นากขี้อาย, นากแอบรัก, นากเจ้าเสน่ห์, นากนักสร้าง)
    const saltWorker = getBestAniimoForFacility('Tidewhisper Sandcastle', 'Leisure', 1, 'Sea Salt');
    assert.ok(saltWorker);
    assert.equal(saltWorker.name, 'นากขี้อาย');
    assert.equal(saltWorker.exclusive, true);
    assert.deepEqual(saltWorker.alts, ['นากแอบรัก', 'นากเจ้าเสน่ห์', 'นากนักสร้าง']);
    assert.ok(saltWorker.exclusiveNote.includes('วงศ์นาก'));

    // Thai item name: เกลือสมุทร / เกลือทะเล
    const thSaltWorker1 = getBestAniimoForFacility('ปราสาททราย', 'Leisure', 1, 'เกลือสมุทร');
    assert.equal(thSaltWorker1.name, 'นากขี้อาย');
    const thSaltWorker2 = getBestAniimoForFacility('ประสาททราย', 'Leisure', 1, 'เกลือทะเล');
    assert.equal(thSaltWorker2.name, 'นากขี้อาย');

    // Pearl -> วงศ์ดาวจิ๋ว (ดาวจิ๋ว, ดาวติดเกราะ, ดาวนักรบ)
    const pearlWorker = getBestAniimoForFacility('Tidewhisper Sandcastle', 'Leisure', 1, 'Pearl');
    assert.ok(pearlWorker);
    assert.equal(pearlWorker.name, 'ดาวจิ๋ว');
    assert.equal(pearlWorker.exclusive, true);
    assert.deepEqual(pearlWorker.alts, ['ดาวติดเกราะ', 'ดาวนักรบ']);
    assert.ok(pearlWorker.exclusiveNote.includes('วงศ์ดาวจิ๋ว'));

    // Thai item name: ไข่มุก
    const thPearlWorker = getBestAniimoForFacility('ปราสาททราย', 'Leisure', 1, 'ไข่มุก');
    assert.equal(thPearlWorker.name, 'ดาวจิ๋ว');

    // getRecommendedWorker check
    const recSalt = getRecommendedWorker('Tidewhisper Sandcastle', 'Sea Salt');
    assert.equal(recSalt.name, 'นากขี้อาย');
    const recPearl = getRecommendedWorker('Tidewhisper Sandcastle', 'Pearl');
    assert.equal(recPearl.name, 'ดาวจิ๋ว');
});

test('Starfall Hammock (เปลดาวตก) requires squirrel family (วงศ์กระรอกเจ้าเวหา)', () => {
    const worker = getBestAniimoForFacility('Starfall Hammock', 'Leisure', 1);
    assert.ok(worker);
    assert.equal(worker.name, 'กระรอกจ้าวเวหา');
    assert.equal(worker.exclusive, true);
    assert.deepEqual(worker.alts, ['กระรอกจ้าวดารา']);
    assert.ok(worker.exclusiveNote.includes('วงศ์กระรอกเจ้าเวหา'));

    // Thai facility name
    const thWorker = getBestAniimoForFacility('เปลดาวตก', 'Leisure', 1);
    assert.equal(thWorker.name, 'กระรอกจ้าวเวหา');
    assert.equal(thWorker.exclusive, true);

    const rec = getRecommendedWorker('เปลดาวตก');
    assert.equal(rec.name, 'กระรอกจ้าวเวหา');
});

test('Sunlamp recommended worker uses Light ability (ปลาดาวเรืองแสง) and Nikhahit+Sara Aa is normalized', () => {
    const sunlampWorker = getBestAniimoForFacility('Sunlamp', 'Light', 1);
    assert.ok(sunlampWorker);
    assert.equal(sunlampWorker.name, 'ปลาดาวเรืองแสง');
    assert.equal(sunlampWorker.ability, 'Light');

    // Thai Nikhahit + Sara Aa (\u0e4d\u0e32) in บ้านนํ้าค้าง resolves to Dewy House
    const nikhahitDewy = getBestAniimoForFacility('บ้านน\u0e4d\u0e49าค้าง', 'Leisure', 1);
    assert.ok(nikhahitDewy);
    assert.equal(nikhahitDewy.name, 'นกน้ำหอม');
    assert.equal(nikhahitDewy.exclusive, true);

    // 6xxxx / 9xxxx special IDs (e.g. ภูตไฟน้อย 69993) are excluded from workforce
    assert.equal(isExcludedFromWorkforce({ name: 'ภูตไฟน้อย', id: '69993' }), true);
    assert.equal(isExcludedFromWorkforce({ id: '6999301' }), true);
    assert.equal(isExcludedFromWorkforce('ภูตไฟน้อย'), true);
});


