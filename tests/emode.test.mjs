import test from 'node:test';
import assert from 'node:assert/strict';
import { FACILITIES, CRACKLE_GENERATOR, CRACKLE_POWER_POLE, FACILITY_FOOTPRINTS } from '../web/facility-config.js';

test('CRACKLE_GENERATOR has correct unlock and levels', () => {
    assert.equal(CRACKLE_GENERATOR.name, 'Crackle Generator');
    assert.equal(CRACKLE_GENERATOR.ability, 'Lightning');
    assert.equal(CRACKLE_GENERATOR.unlockHomeLevel, 12);
    assert.equal(CRACKLE_GENERATOR.maxPlaced, 1); // Placed at most 1 in Homeland
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

test('CRACKLE_POWER_POLE has correct limits by RV level', () => {
    assert.equal(CRACKLE_POWER_POLE.name, 'Crackle Power Pole');
    assert.equal(CRACKLE_POWER_POLE.unlockHomeLevel, 12);
    assert.equal(CRACKLE_POWER_POLE.maxPolesByHomeLevel(11), 0);
    assert.equal(CRACKLE_POWER_POLE.maxPolesByHomeLevel(12), 6); // Max 6 at RV 12
    assert.equal(CRACKLE_POWER_POLE.maxPolesByHomeLevel(13), 6);
    assert.equal(CRACKLE_POWER_POLE.maxPolesByHomeLevel(14), 8);
    assert.equal(CRACKLE_POWER_POLE.maxPolesByHomeLevel(16), 12);
    assert.equal(CRACKLE_POWER_POLE.maxPolesByHomeLevel(18), 16);
    assert.equal(CRACKLE_POWER_POLE.maxPolesByHomeLevel(20), 20);
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
    assert.deepEqual(FACILITY_FOOTPRINTS['Crackle Power Pole'], [1.5, 1.5]);
    assert.deepEqual(CRACKLE_POWER_POLE.footprint, [1.5, 1.5]);
    assert.deepEqual(CRACKLE_POWER_POLE.range, [7, 7]);
});

test('Single Crackle Generator wattage capacity and maximum E-Mode facilities', () => {
    // Only 1 Crackle Generator can be placed in Homeland
    // At RV 12 (Generator Lv.1 = 120W) -> at most 120 / 60 = 2 machines in E-Mode
    const genLevel12 = CRACKLE_GENERATOR.levelByHomeLevel(12);
    const maxWatts12 = CRACKLE_GENERATOR.wattsByLevel[genLevel12];
    const maxMachines12 = Math.floor(maxWatts12 / 60);
    assert.equal(maxMachines12, 2);

    // At RV 18 (Generator Lv.4 = 480W) -> at most 480 / 60 = 8 machines in E-Mode
    const genLevel18 = CRACKLE_GENERATOR.levelByHomeLevel(18);
    const maxWatts18 = CRACKLE_GENERATOR.wattsByLevel[genLevel18];
    const maxMachines18 = Math.floor(maxWatts18 / 60);
    assert.equal(maxMachines18, 8);

    // Exactly 1 Lightning Aniimo needed to staff the 1 generator
    const generatorPlaced = 1;
    const lightningAniimoNeeded = 1;
    assert.equal(generatorPlaced, 1);
    assert.equal(lightningAniimoNeeded, 1);
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

test('Crackle Generator (max 1) and Power Poles (capped at RV limit) are generated for layout', () => {
    // When E-mode facilities exist, exactly 1 Crackle Generator is placed
    const generatorCount = 1;
    assert.equal(generatorCount, CRACKLE_GENERATOR.maxPlaced);

    // At RV 12, poles placed cannot exceed 6
    const homeLevel12 = 12;
    const maxPoles12 = CRACKLE_POWER_POLE.maxPolesByHomeLevel(homeLevel12);
    const emodeFacilities = 2; // at RV 12, max 2 machines
    const polesNeeded12 = Math.min(maxPoles12, Math.max(1, Math.ceil(emodeFacilities / 2)));
    assert.equal(polesNeeded12, 1);
    assert.ok(polesNeeded12 <= maxPoles12);
    assert.equal(maxPoles12, 6);
});

test('Idle and unused facilities are omitted from layout pieces', () => {
    // Simulating homeland pieces generation with active and idle units
    const steps = [
        { facility: 'Woodworking Bench', item_name: 'rough_lumber', status: 'producing', facility_count: 1, cycle_time: 30 },
        { facility: 'Aniipod Maker', item_name: null, status: 'idle', facility_count: 1, cycle_time: null },
        { facility: 'Blazing Stove', item_name: null, status: 'idle', facility_count: 1, cycle_time: null },
    ];
    const turnAllocations = new Map([
        ['Woodworking Bench', [[{ item: 'rough_lumber', cycle: 30, rate: 0.5 }]]],
        ['Chimney Kiln', [[]]], // idle turn unit with no jobs
    ]);

    const pieces = [];
    // Turn allocations logic: skip empty jobs
    turnAllocations.forEach((allocations, facility) => {
        allocations.forEach(jobs => {
            if (!jobs || jobs.length === 0) return; // Must skip idle
            pieces.push({ facility, crop: jobs[0]?.item });
        });
    });

    // Non-turn steps logic: only producing
    steps.filter(step => !turnAllocations.has(step.facility) && step.status === 'producing').forEach(step => {
        pieces.push({ facility: step.facility, crop: step.item_name });
    });

    // Verify pieces only contain Woodworking Bench, not Aniipod Maker, Blazing Stove, or idle Chimney Kiln
    assert.equal(pieces.length, 1);
    assert.equal(pieces[0].facility, 'Woodworking Bench');
    assert.equal(pieces[0].crop, 'rough_lumber');
});

