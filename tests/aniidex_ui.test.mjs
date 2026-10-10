import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';

test('Aniidex item icons, facility glyphs, and worker avatars data', async () => {
    const aniidexData = await import('../web/aniidex-data.js');
    
    // Verify item icons exist
    assert.ok(aniidexData.getItemIconUrl('strawberry'), 'Strawberry icon should exist');
    assert.ok(aniidexData.getItemIconUrl('wheat'), 'Wheat icon should exist');
    assert.ok(aniidexData.getItemIconUrl('lemon'), 'Lemon icon should exist');
    assert.ok(aniidexData.getItemIconUrl('coins'), 'Coins icon should exist');
    assert.ok(aniidexData.getItemIconUrl('standard_planks'), 'Standard Planks icon should exist');
    assert.ok(aniidexData.getItemIconUrl('sintered_ore_brick'), 'Sintered Ore Brick icon should exist');

    // Verify facility glyphs exist
    assert.ok(aniidexData.getFacilityGlyphUrl('Crackle Generator'), 'Generator glyph should exist');
    assert.ok(aniidexData.getFacilityGlyphUrl('Crackle Power Pole'), 'Power Pole glyph should exist');
    assert.ok(aniidexData.getFacilityGlyphUrl('Farmland'), 'Farmland glyph should exist');
    assert.ok(aniidexData.getFacilityGlyphUrl('Woodworking Bench'), 'Bench glyph should exist');

    // Verify recommended workers exist
    const benchWorker = aniidexData.getRecommendedWorker('Woodworking Bench');
    assert.ok(benchWorker, 'Bench worker should exist');
    assert.equal(benchWorker.ability, 'Artisanship');
    assert.ok(benchWorker.avatar.includes('UI_PetHead_'), 'Avatar should be UI_PetHead');

    const kilnWorker = aniidexData.getRecommendedWorker('Chimney Kiln');
    assert.ok(kilnWorker, 'Kiln worker should exist');
    assert.equal(kilnWorker.ability, 'Fire');
    assert.ok(kilnWorker.avatar.includes('UI_PetHead_'), 'Avatar should be UI_PetHead');
});
