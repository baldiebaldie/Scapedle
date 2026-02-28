import {
  REGION_CATEGORIES,
  TEMPERATURE,
  mapRegions,
  specialLocations,
  locationToRegion,
  regionAliases,
  getAllRegions,
  getRegionById,
  getRegionForLocation,
  isSpecialLocation,
  getSpecialLocationsByCategory,
  calculateTemperature,
  getCategoryDisplayName,
  getTemperatureColor
} from './mapRegions';

describe('getRegionById', () => {
  test('returns a map region by ID', () => {
    const region = getRegionById('lumbridge');
    expect(region).not.toBeNull();
    expect(region.name).toBe('Lumbridge');
    expect(region.category).toBe(REGION_CATEGORIES.OVERWORLD);
  });

  test('returns a special location by ID', () => {
    const region = getRegionById('chambers_of_xeric');
    expect(region).not.toBeNull();
    expect(region.name).toBe('Chambers of Xeric');
    expect(region.category).toBe(REGION_CATEGORIES.RAIDS);
  });

  test('returns null for unknown ID', () => {
    expect(getRegionById('nonexistent')).toBeNull();
  });
});

describe('getRegionForLocation', () => {
  test('maps a known location string to its region', () => {
    const region = getRegionForLocation('Varrock');
    expect(region).not.toBeNull();
    expect(region.id).toBe('varrock');
  });

  test('maps special locations correctly', () => {
    const region = getRegionForLocation('Chambers of Xeric');
    expect(region).not.toBeNull();
    expect(region.id).toBe('chambers_of_xeric');
  });

  test('returns null for unknown location', () => {
    expect(getRegionForLocation('Nonexistent Place')).toBeNull();
  });
});

describe('isSpecialLocation', () => {
  test('returns true for raids', () => {
    expect(isSpecialLocation('chambers_of_xeric')).toBe(true);
  });

  test('returns true for bosses', () => {
    expect(isSpecialLocation('zulrah')).toBe(true);
  });

  test('returns true for minigames', () => {
    expect(isSpecialLocation('fight_caves')).toBe(true);
  });

  test('returns false for map regions', () => {
    expect(isSpecialLocation('lumbridge')).toBe(false);
    expect(isSpecialLocation('varrock')).toBe(false);
  });

  test('returns false for unknown IDs', () => {
    expect(isSpecialLocation('nonexistent')).toBe(false);
  });
});

describe('getAllRegions', () => {
  test('includes both map and special regions', () => {
    const all = getAllRegions();
    expect(all.lumbridge).toBeDefined();
    expect(all.chambers_of_xeric).toBeDefined();
  });
});

describe('getSpecialLocationsByCategory', () => {
  test('groups special locations by category', () => {
    const categories = getSpecialLocationsByCategory();
    expect(categories.raids.length).toBeGreaterThan(0);
    expect(categories.bosses.length).toBeGreaterThan(0);
    expect(categories.minigames.length).toBeGreaterThan(0);
  });

  test('raids contains chambers of xeric', () => {
    const categories = getSpecialLocationsByCategory();
    const names = categories.raids.map(r => r.id);
    expect(names).toContain('chambers_of_xeric');
  });
});

describe('calculateTemperature', () => {
  test('returns CORRECT for exact match', () => {
    const result = calculateTemperature('lumbridge', 'lumbridge');
    expect(result.temperature).toBe(TEMPERATURE.CORRECT);
    expect(result.categoryMatch).toBe(true);
  });

  test('returns HOT for same category and nearby region', () => {
    // lumbridge has draynor in its nearbyRegions
    const result = calculateTemperature('draynor', 'lumbridge');
    expect(result.temperature).toBe(TEMPERATURE.HOT);
    expect(result.categoryMatch).toBe(true);
  });

  test('returns WARM for same category but not nearby', () => {
    // wilderness and karamja are both overworld but not nearby
    const result = calculateTemperature('wilderness', 'karamja');
    expect(result.temperature).toBe(TEMPERATURE.WARM);
    expect(result.categoryMatch).toBe(true);
  });

  test('returns COLD for different category', () => {
    // lumbridge (overworld) vs chambers_of_xeric (raids)
    const result = calculateTemperature('lumbridge', 'chambers_of_xeric');
    expect(result.temperature).toBe(TEMPERATURE.COLD);
    expect(result.categoryMatch).toBe(false);
  });

  test('returns FROZEN for invalid region IDs', () => {
    const result = calculateTemperature('nonexistent', 'lumbridge');
    expect(result.temperature).toBe(TEMPERATURE.FROZEN);
    expect(result.categoryMatch).toBe(false);
  });

  test('nearby detection is bidirectional', () => {
    // Even if only one side lists the other as nearby, it should count
    const resultA = calculateTemperature('lumbridge', 'draynor');
    const resultB = calculateTemperature('draynor', 'lumbridge');
    expect(resultA.temperature).toBe(TEMPERATURE.HOT);
    expect(resultB.temperature).toBe(TEMPERATURE.HOT);
  });
});

describe('getCategoryDisplayName', () => {
  test('returns correct display names', () => {
    expect(getCategoryDisplayName(REGION_CATEGORIES.OVERWORLD)).toBe('Overworld');
    expect(getCategoryDisplayName(REGION_CATEGORIES.RAIDS)).toBe('Raids');
    expect(getCategoryDisplayName(REGION_CATEGORIES.BOSSES)).toBe('Bosses');
    expect(getCategoryDisplayName(REGION_CATEGORIES.MINIGAMES)).toBe('Minigames');
    expect(getCategoryDisplayName(REGION_CATEGORIES.OTHER)).toBe('Other');
  });

  test('returns the input for unknown category', () => {
    expect(getCategoryDisplayName('unknown')).toBe('unknown');
  });
});

describe('getTemperatureColor', () => {
  test('returns a color for each temperature level', () => {
    expect(getTemperatureColor(TEMPERATURE.CORRECT)).toBe('#4caf50');
    expect(getTemperatureColor(TEMPERATURE.HOT)).toBe('#ff5722');
    expect(getTemperatureColor(TEMPERATURE.WARM)).toBe('#ff9800');
    expect(getTemperatureColor(TEMPERATURE.COLD)).toBe('#2196f3');
    expect(getTemperatureColor(TEMPERATURE.FROZEN)).toBe('#9c27b0');
  });

  test('returns fallback color for unknown temperature', () => {
    expect(getTemperatureColor('unknown')).toBe('#666');
  });
});

describe('new overworld regions', () => {
  test('varlamore, fossil island, mos le harmless, and giant conch are in mapRegions', () => {
    expect(mapRegions.varlamore).toBeDefined();
    expect(mapRegions.fossil_island).toBeDefined();
    expect(mapRegions.mos_le_harmless).toBeDefined();
    expect(mapRegions.giant_conch).toBeDefined();
  });

  test('isle_of_souls and void_knights_outpost are in mapRegions', () => {
    expect(mapRegions.isle_of_souls).toBeDefined();
    expect(mapRegions.void_knights_outpost).toBeDefined();
  });

  test('new location strings resolve to correct regions', () => {
    expect(getRegionForLocation('Varlamore')?.id).toBe('varlamore');
    expect(getRegionForLocation('Civitas illa Fortis')?.id).toBe('varlamore');
    expect(getRegionForLocation("Mos Le'Harmless")?.id).toBe('mos_le_harmless');
    expect(getRegionForLocation('Fossil Island')?.id).toBe('fossil_island');
    expect(getRegionForLocation('Giant Conch')?.id).toBe('giant_conch');
  });

  test('varlamore is hot when guessing hosidius', () => {
    const result = calculateTemperature('hosidius', 'varlamore');
    expect(result.temperature).toBe(TEMPERATURE.HOT);
  });

  test('fossil_island is hot when guessing morytania', () => {
    const result = calculateTemperature('morytania', 'fossil_island');
    expect(result.temperature).toBe(TEMPERATURE.HOT);
  });
});

describe('regionAliases', () => {
  test('isle_of_souls aliases to soul_wars', () => {
    expect(regionAliases.isle_of_souls).toBe('soul_wars');
  });

  test('void_knights_outpost aliases to pest_control', () => {
    expect(regionAliases.void_knights_outpost).toBe('pest_control');
  });

  test('all alias targets exist in specialLocations', () => {
    Object.values(regionAliases).forEach(targetId => {
      expect(specialLocations[targetId]).toBeDefined();
    });
  });

  test('all alias sources exist in mapRegions', () => {
    Object.keys(regionAliases).forEach(sourceId => {
      expect(mapRegions[sourceId]).toBeDefined();
    });
  });

  test('guessing soul_wars for soul_wars returns CORRECT', () => {
    const result = calculateTemperature('soul_wars', 'soul_wars');
    expect(result.temperature).toBe(TEMPERATURE.CORRECT);
  });
});

describe('data integrity', () => {
  test('all map regions have required fields', () => {
    Object.values(mapRegions).forEach(region => {
      expect(region.id).toBeDefined();
      expect(region.name).toBeDefined();
      expect(region.category).toBeDefined();
      expect(region.bounds).toBeDefined();
      expect(region.bounds.x).toBeDefined();
      expect(region.bounds.y).toBeDefined();
      expect(region.bounds.width).toBeDefined();
      expect(region.bounds.height).toBeDefined();
    });
  });

  test('all special locations have required fields', () => {
    Object.values(specialLocations).forEach(loc => {
      expect(loc.id).toBeDefined();
      expect(loc.name).toBeDefined();
      expect(loc.category).toBeDefined();
      expect(loc.nearbyRegions).toBeDefined();
      expect(Array.isArray(loc.nearbyRegions)).toBe(true);
    });
  });

  test('all nearbyRegions reference valid region IDs', () => {
    const allRegions = getAllRegions();
    const allIds = Object.keys(allRegions);

    Object.values(allRegions).forEach(region => {
      if (region.nearbyRegions) {
        region.nearbyRegions.forEach(nearbyId => {
          expect(allIds).toContain(nearbyId);
        });
      }
    });
  });

  test('all locationToRegion values reference valid region IDs', () => {
    const allRegions = getAllRegions();
    const allIds = Object.keys(allRegions);

    Object.entries(locationToRegion).forEach(([location, regionId]) => {
      expect(allIds).toContain(regionId);
    });
  });
});
