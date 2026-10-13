import test from 'node:test';
import assert from 'node:assert/strict';
import {
    HOMELAND_ABILITY_KEYS,
    HOMELAND_ABILITY_META,
    calculateHomelandDemands,
    findBestMultiSkillAniimos,
    calculateCurrentDistribution
} from '../web/aniidex-data.js';

test('HOMELAND_ABILITY_KEYS contains all 13 homeland abilities from the game', () => {
    assert.equal(HOMELAND_ABILITY_KEYS.length, 13);
    const expected = ['Fire', 'Grass', 'Water', 'Earth', 'Lightning', 'Ice', 'Wind', 'Dark', 'Light', 'Hauling', 'Artisanship', 'Leisure', 'Perfumery'];
    assert.deepEqual(HOMELAND_ABILITY_KEYS, expected);
});

test('HOMELAND_ABILITY_META provides Thai names, icons, and descriptions for all 13 abilities', () => {
    for (const key of HOMELAND_ABILITY_KEYS) {
        const meta = HOMELAND_ABILITY_META[key];
        assert.ok(meta, `Missing meta for ${key}`);
        assert.ok(meta.th, `Missing Thai name for ${key}`);
        assert.ok(meta.icon, `Missing icon for ${key}`);
        assert.ok(meta.desc, `Missing description for ${key}`);
    }
    assert.equal(HOMELAND_ABILITY_META.Fire.th, 'ไฟ');
    assert.equal(HOMELAND_ABILITY_META.Grass.th, 'หญ้า');
    assert.equal(HOMELAND_ABILITY_META.Water.th, 'น้ำ');
    assert.equal(HOMELAND_ABILITY_META.Hauling.th, 'แบก');
});

test('calculateHomelandDemands estimates requirements from plan facilities and plots', () => {
    const mockPlan = {
        steps: [
            { facility: 'Cropland', recipe: 'Corn', building_count: 4 },
            { facility: 'Chimney Kiln', recipe: 'Ceramic Plate', building_count: 2, aniimo: ['Fire', 2] },
            { facility: 'Mine', recipe: 'Mineral Sand', building_count: 1, aniimo: ['Earth', 1] },
            { facility: 'Woodworking Bench', recipe: 'Wood Block', building_count: 1, aniimo: ['Artisanship', 1] },
        ],
        has_generator: true,
    };
    const mockLayout = {
        layout: {
            croplandCount: 4,
            woodlandCount: 1,
            pieces: [
                { facility: 'Crackle Generator' }
            ]
        }
    };

    const demands = calculateHomelandDemands(mockPlan, mockLayout);
    assert.ok(demands.Fire >= 2, 'Fire should reflect kiln count');
    assert.ok(demands.Grass >= 2, 'Grass should reflect croplands/woodlands');
    assert.ok(demands.Water >= 1, 'Water should reflect croplands watering');
    assert.ok(demands.Earth >= 1, 'Earth should reflect mine');
    assert.ok(demands.Artisanship >= 1, 'Artisanship should reflect bench');
    assert.ok(demands.Lightning >= 1, 'Lightning should reflect generator');
    assert.ok(demands.Hauling >= 2, 'Hauling should reflect total transport demand');
});

test('calculateCurrentDistribution sums ability counts from assigned workforce', () => {
    const assignedWorkers = [
        { name: 'เจ้าเพลิงคำราม', skills: { Fire: 3, Hauling: 1 } },
        { name: 'เจ้าใบบัว', skills: { Grass: 3, Water: 2, Hauling: 3 } },
        { name: 'ตุ่นทลายภูผา', skills: { Earth: 3, Hauling: 1 } },
    ];
    const dist = calculateCurrentDistribution(assignedWorkers);
    assert.equal(dist.Fire, 1);
    assert.equal(dist.Grass, 1);
    assert.equal(dist.Water, 1);
    assert.equal(dist.Earth, 1);
    assert.equal(dist.Hauling, 3);
    assert.equal(dist.Ice, 0);
});

test('findBestMultiSkillAniimos returns top high-value hybrid Aniimos', () => {
    const demands = { Grass: 2, Water: 2, Hauling: 2, Fire: 1 };
    const hybrids = findBestMultiSkillAniimos(demands);
    assert.ok(hybrids.length > 0);
    // 'เจ้าใบบัว' has Grass + Water + Hauling
    const lotus = hybrids.find(h => h.name === 'เจ้าใบบัว');
    assert.ok(lotus);
    assert.ok(lotus.matchedAbilities.length >= 2);
});
