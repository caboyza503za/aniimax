import test from 'node:test';
import assert from 'node:assert/strict';
import { FACILITIES, CRACKLE_GENERATOR, FACILITY_FOOTPRINTS } from '../web/facility-config.js';

test('CRACKLE_GENERATOR has correct unlock and levels', () => {
    assert.equal(CRACKLE_GENERATOR.name, 'Crackle Generator');
    assert.equal(CRACKLE_GENERATOR.ability, 'Lightning');
    assert.equal(CRACKLE_GENERATOR.unlockHomeLevel, 12);
    assert.deepEqual(CRACKLE_GENERATOR.footprint, [2, 2]);

    // Watts by level
    assert.equal(CRACKLE_GENERATOR.wattsByLevel[1], 120);
    assert.equal(CRACKLE_GENERATOR.wattsByLevel[2], 240);
    assert.equal(CRACKLE_GENERATOR.wattsByLevel[3], 360);
    assert.equal(CRACKLE_GENERATOR.wattsByLevel[4], 480);
    assert.equal(CRACKLE_GENERATOR.wattsByLevel[5], 600);

    // Level by Home RV level
    assert.equal(CRACKLE_GENERATOR.levelByHomeLevel(11), 1);
    assert.equal(CRACKLE_GENERATOR.levelByHomeLevel(12), 1);
    assert.equal(CRACKLE_GENERATOR.levelByHomeLevel(13), 1);
    assert.equal(CRACKLE_GENERATOR.levelByHomeLevel(14), 2);
    assert.equal(CRACKLE_GENERATOR.levelByHomeLevel(15), 2);
    assert.equal(CRACKLE_GENERATOR.levelByHomeLevel(16), 3);
    assert.equal(CRACKLE_GENERATOR.levelByHomeLevel(17), 3);
    assert.equal(CRACKLE_GENERATOR.levelByHomeLevel(18), 4);
    assert.equal(CRACKLE_GENERATOR.levelByHomeLevel(19), 4);
    assert.equal(CRACKLE_GENERATOR.levelByHomeLevel(20), 5);
});

test('Materials Processing facilities support E-Mode with 60W power demand', () => {
    const processingFacilities = FACILITIES.filter(f => f.category === 'Materials Processing');
    assert.equal(processingFacilities.length, 14);

    processingFacilities.forEach(f => {
        assert.equal(f.supportsEMode, true, `${f.name} should support E-Mode`);
        assert.equal(f.electricRequire, 60, `${f.name} should require 60W`);
    });
});

test('Crackle Generator and Power Pole footprints exist', () => {
    assert.deepEqual(FACILITY_FOOTPRINTS['Crackle Generator'], [2, 2]);
    assert.deepEqual(FACILITY_FOOTPRINTS['Crackle Power Pole'], [1, 1]);
});

test('Power and Lightning Aniimo requirements calculation', () => {
    // 5 machines in E-mode = 5 * 60W = 300W
    const demandWatts = 5 * 60;
    
    // At RV 12 (Generator Lv.1 = 120W)
    const genLevel12 = CRACKLE_GENERATOR.levelByHomeLevel(12);
    const wattsPerGen12 = CRACKLE_GENERATOR.wattsByLevel[genLevel12];
    const gensNeeded12 = Math.ceil(demandWatts / wattsPerGen12);
    assert.equal(gensNeeded12, 3); // 300 / 120 = 2.5 -> 3 generators / 3 Lightning Aniimos
    
    // At RV 16 (Generator Lv.3 = 360W)
    const genLevel16 = CRACKLE_GENERATOR.levelByHomeLevel(16);
    const wattsPerGen16 = CRACKLE_GENERATOR.wattsByLevel[genLevel16];
    const gensNeeded16 = Math.ceil(demandWatts / wattsPerGen16);
    assert.equal(gensNeeded16, 1); // 300 / 360 = 0.83 -> 1 generator / 1 Lightning Aniimo
    
    // Saved workers: originally 5 workers, now 1 Lightning Aniimo -> Net 4 saved!
    const netSaved = 5 - gensNeeded16;
    assert.equal(netSaved, 4);
});
