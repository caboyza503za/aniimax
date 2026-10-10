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

test('Speed comparison between Aniimo worker levels and E-Mode (1.2x grid efficiency)', () => {
    // Speed helper function matching the game mechanics and app.js
    const calculateSpeed = (workerLevel, minLevel, hasPersonality) => {
        const above = Math.max(0, workerLevel - minLevel);
        const baseSpeed = above === 0 ? 1.0 : (2.0 + above);
        return hasPersonality ? baseSpeed * 1.2 : baseSpeed;
    };
    const eModeSpeed = 1.2; // 120% efficiency buff with stable electrical grid

    // Level = minLevel without bonus: 1.0x (E-Mode is faster with 1.2x buff)
    assert.equal(calculateSpeed(1, 1, false), 1.0);
    assert.ok(calculateSpeed(1, 1, false) < eModeSpeed, 'E-Mode is faster than Lv.1 without bonus');

    // Level = minLevel with bonus: 1.2x (E-Mode equals speed and frees the worker)
    assert.equal(calculateSpeed(1, 1, true), 1.2);
    assert.equal(calculateSpeed(1, 1, true), eModeSpeed, 'E-Mode equals Lv.1 with bonus');

    // Level 2 on Level 1 (above = 1): 3.0x without bonus, 3.6x with bonus
    assert.equal(calculateSpeed(2, 1, false), 3.0);
    assert.ok(Math.abs(calculateSpeed(2, 1, true) - 3.6) < 1e-9);
    assert.ok(calculateSpeed(2, 1, false) > eModeSpeed, 'Lv.2 worker is faster than E-Mode');

    // Level 4 on Level 1 (above = 3): 5.0x without bonus, 6.0x with bonus
    assert.equal(calculateSpeed(4, 1, false), 5.0);
    assert.equal(calculateSpeed(4, 1, true), 6.0);
    assert.ok(calculateSpeed(4, 1, true) > eModeSpeed, 'Lv.4 worker is 5x faster than E-Mode');
});
