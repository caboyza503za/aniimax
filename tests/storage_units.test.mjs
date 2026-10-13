import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layOutHomeland } from '../web/layout.js';

test('layOutHomeland places up to 4 storage units across open plots', () => {
    // 4 open plots (each 20x15)
    const cells = [
        { x: 40, y: 45, w: 20, h: 15 }, // Plot 1
        { x: 20, y: 45, w: 20, h: 15 }, // Plot 2
        { x: 40, y: 30, w: 20, h: 15 }, // Plot 3
        { x: 20, y: 30, w: 20, h: 15 }, // Plot 4
    ];

    // Some sample pieces in different plots
    const pieces = [
        { members: [{ x: 0, y: 0, w: 3, h: 3, weight: 120, facility: 'Wheat Field' }] },
        { members: [{ x: 0, y: 0, w: 3, h: 3, weight: 80, facility: 'Corn Field' }] },
        { members: [{ x: 0, y: 0, w: 2, h: 2, weight: 200, facility: 'Woodworking Bench' }] },
    ];

    const result = layOutHomeland(pieces, cells, { w: 2, h: 2 }, 4);

    assert.ok(result.storages, 'result should contain storages array');
    assert.equal(result.storages.length, 4, 'should place 4 storage units');
    assert.ok(result.storage, 'result should retain backward compatible single storage');
    assert.deepEqual(result.storage, result.storages[0], 'storage should equal storages[0]');

    // Verify all 4 storage units are 2x2 and do not overlap each other
    for (let i = 0; i < result.storages.length; i++) {
        const s1 = result.storages[i];
        assert.equal(s1.w, 2);
        assert.equal(s1.h, 2);
        for (let j = i + 1; j < result.storages.length; j++) {
            const s2 = result.storages[j];
            const overlap = !(s1.x + s1.w <= s2.x || s2.x + s2.w <= s1.x || s1.y + s1.h <= s2.y || s2.y + s2.h <= s1.y);
            assert.ok(!overlap, `storage ${i} and storage ${j} should not overlap`);
        }
    }

    // Verify no storage unit overlaps any placed piece member
    const allMembers = result.pieces.flatMap(p => p.members);
    for (const s of result.storages) {
        for (const m of allMembers) {
            const overlap = !(s.x + s.w <= m.x || m.x + m.w <= s.x || s.y + s.h <= m.y || m.y + m.h <= s.y);
            assert.ok(!overlap, `storage at (${s.x},${s.y}) should not overlap member at (${m.x},${m.y})`);
        }
    }
});

test('layOutHomeland respects custom storageCount (e.g. 1 or 2)', () => {
    const cells = [
        { x: 40, y: 45, w: 20, h: 15 },
        { x: 20, y: 45, w: 20, h: 15 },
    ];
    const pieces = [
        { members: [{ x: 0, y: 0, w: 2, h: 2, weight: 100, facility: 'Woodworking Bench' }] }
    ];

    const res1 = layOutHomeland(pieces, cells, { w: 2, h: 2 }, 1);
    assert.equal(res1.storages.length, 1);

    const res2 = layOutHomeland(pieces, cells, { w: 2, h: 2 }, 2);
    assert.equal(res2.storages.length, 2);
});

test('layOutHomeland handles single plot (RV 1) and places multiple storage units if space permits', () => {
    const cells = [
        { x: 40, y: 45, w: 20, h: 15 }, // Single plot (Plot 1)
    ];
    const pieces = [
        { members: [{ x: 0, y: 0, w: 2, h: 2, weight: 50, facility: 'Woodworking Bench' }] }
    ];

    const res = layOutHomeland(pieces, cells, { w: 2, h: 2 }, 4);
    assert.ok(res.storages.length >= 1 && res.storages.length <= 4);
    // All placed storages are within cell
    for (const s of res.storages) {
        assert.ok(s.x >= cells[0].x && s.x + s.w <= cells[0].x + cells[0].w);
        assert.ok(s.y >= cells[0].y && s.y + s.h <= cells[0].y + cells[0].h);
    }
});

test('multiple storage units reduce total hauling walking distance compared to 1 storage unit', () => {
    // 4 plots
    const cells = [
        { x: 40, y: 45, w: 20, h: 15 },
        { x: 20, y: 45, w: 20, h: 15 },
        { x: 40, y: 30, w: 20, h: 15 },
        { x: 20, y: 30, w: 20, h: 15 },
    ];
    const pieces = [
        { members: [{ x: 0, y: 0, w: 3, h: 3, weight: 100, facility: 'Facility 1' }] },
        { members: [{ x: 0, y: 0, w: 3, h: 3, weight: 100, facility: 'Facility 2' }] },
        { members: [{ x: 0, y: 0, w: 3, h: 3, weight: 100, facility: 'Facility 3' }] },
        { members: [{ x: 0, y: 0, w: 3, h: 3, weight: 100, facility: 'Facility 4' }] },
        { members: [{ x: 0, y: 0, w: 3, h: 3, weight: 100, facility: 'Facility 5' }] },
    ];

    const resSingle = layOutHomeland(pieces, cells, { w: 2, h: 2 }, 1);
    const resFour = layOutHomeland(pieces, cells, { w: 2, h: 2 }, 4);

    const membersFour = resFour.pieces.flatMap(p => p.members);
    const distToNearest = (m, storages) => Math.min(...storages.map(s => Math.hypot((m.x + m.w / 2) - (s.x + s.w / 2), (m.y + m.h / 2) - (s.y + s.h / 2))));

    const totalWalkSingle = membersFour.reduce((sum, m) => sum + m.weight * distToNearest(m, resFour.storages.slice(0, 1)), 0);
    const totalWalkFour = membersFour.reduce((sum, m) => sum + m.weight * distToNearest(m, resFour.storages), 0);

    assert.ok(totalWalkFour <= totalWalkSingle, '4 storage units should yield less or equal walking distance than 1');
});

test('storage units stay near the active farm and avoid outer corner coordinates', () => {
    const cells = [];
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            cells.push({ x: c * 12, y: r * 12, w: 12, h: 12 });
        }
    }
    const pieces = [
        { members: [{ x: 0, y: 0, w: 2, h: 2, weight: 100, facility: 'Crafting Table' }] },
        { members: [{ x: 0, y: 0, w: 2, h: 2, weight: 80, facility: 'Claw Game Cooker' }] },
        { members: [{ x: 0, y: 0, w: 3, h: 3, weight: 120, facility: 'Mine' }] },
    ];
    const res = layOutHomeland(pieces, cells, { w: 2, h: 2 }, 4);
    assert.equal(res.storages.length, 4);

    for (const s of res.storages) {
        const isExtremeCorner = (s.x === 0 && s.y === 0) || (s.x === 46 && s.y === 0) || (s.x === 0 && s.y === 46) || (s.x === 46 && s.y === 46);
        assert.ok(!isExtremeCorner, `Storage at (${s.x}, ${s.y}) should not be in extreme corners`);
    }
});

test('layOutHomeland places all facilities conforming strictly to the 3-layer grid system', () => {
    const cells = [
        { x: 40, y: 45, w: 20, h: 15 },
        { x: 20, y: 45, w: 20, h: 15 },
        { x: 40, y: 30, w: 20, h: 15 },
    ];
    const pieces = [
        { members: [{ x: 0, y: 0, w: 2, h: 2, weight: 120, facility: 'Farmland' }] },
        { members: [{ x: 0, y: 0, w: 3, h: 3, weight: 110, facility: 'Mine' }] },
        { members: [{ x: 0, y: 0, w: 2, h: 2, weight: 90, facility: 'Chimney Kiln' }] },
        { members: [{ x: 0, y: 0, w: 4, h: 4, weight: 50, facility: 'Crafting Table' }] },
    ];
    const res = layOutHomeland(pieces, cells, { w: 2, h: 2 }, 3);
    for (const p of res.pieces) {
        for (const m of p.members) {
            assert.ok(Math.abs(Math.round(m.x * 4) - m.x * 4) < 1e-4, `Piece ${m.facility} x: ${m.x} must conform to 3-layer grid`);
            assert.ok(Math.abs(Math.round(m.y * 4) - m.y * 4) < 1e-4, `Piece ${m.facility} y: ${m.y} must conform to 3-layer grid`);
        }
    }
    for (const s of res.storages) {
        assert.ok(Math.abs(Math.round(s.x * 4) - s.x * 4) < 1e-4, `Storage x: ${s.x} must conform to 3-layer grid`);
        assert.ok(Math.abs(Math.round(s.y * 4) - s.y * 4) < 1e-4, `Storage y: ${s.y} must conform to 3-layer grid`);
    }
});
