// Region definitions for OSRS interactive map
// Each region has a bounding box defined in percentage coordinates (0-100)
// This allows the regions to scale with the map image

// Categories for hot/cold feedback
export const REGION_CATEGORIES = {
  OVERWORLD: 'overworld',
  RAIDS: 'raids',
  BOSSES: 'bosses',
  MINIGAMES: 'minigames',
  OTHER: 'other'
};

// Temperature levels for feedback
export const TEMPERATURE = {
  CORRECT: 'correct',      // Exact match
  HOT: 'hot',              // Same category, nearby region
  WARM: 'warm',            // Same category, different region
  COLD: 'cold',            // Different category
  FROZEN: 'frozen'         // Very far (e.g., overworld vs raids)
};

export const mapRegions = {
  // Tutorial Island
  tutorial_island: {
    id: "tutorial_island",
    name: "Tutorial Island",
    category: REGION_CATEGORIES.OVERWORLD,
    bounds: { x: 18, y: 72, width: 6, height: 5 },
    // Nearby regions for "hot" detection
    nearbyRegions: ["lumbridge", "port_sarim"]
  },

  // Lumbridge Area
  lumbridge: {
    id: "lumbridge",
    name: "Lumbridge",
    category: REGION_CATEGORIES.OVERWORLD,
    bounds: { x: 25, y: 58, width: 8, height: 10 },
    nearbyRegions: ["draynor", "varrock", "al_kharid", "tutorial_island"]
  },

  // Draynor
  draynor: {
    id: "draynor",
    name: "Draynor",
    category: REGION_CATEGORIES.OVERWORLD,
    bounds: { x: 19, y: 55, width: 6, height: 8 },
    nearbyRegions: ["lumbridge", "port_sarim", "falador"]
  },

  // Varrock
  varrock: {
    id: "varrock",
    name: "Varrock",
    category: REGION_CATEGORIES.OVERWORLD,
    bounds: { x: 28, y: 42, width: 10, height: 12 },
    nearbyRegions: ["lumbridge", "wilderness", "morytania"]
  },

  // Falador
  falador: {
    id: "falador",
    name: "Falador",
    category: REGION_CATEGORIES.OVERWORLD,
    bounds: { x: 16, y: 47, width: 9, height: 10 },
    nearbyRegions: ["draynor", "port_sarim", "camelot", "troll_country"]
  },

  // Port Sarim
  port_sarim: {
    id: "port_sarim",
    name: "Port Sarim",
    category: REGION_CATEGORIES.OVERWORLD,
    bounds: { x: 17, y: 59, width: 6, height: 7 },
    nearbyRegions: ["draynor", "falador", "karamja", "tutorial_island", "void_knights_outpost"]
  },

  // Karamja
  karamja: {
    id: "karamja",
    name: "Karamja",
    category: REGION_CATEGORIES.OVERWORLD,
    bounds: { x: 14, y: 68, width: 12, height: 15 },
    nearbyRegions: ["port_sarim", "ape_atoll", "mos_le_harmless", "feldip_hills"]
  },

  // Al Kharid
  al_kharid: {
    id: "al_kharid",
    name: "Al Kharid",
    category: REGION_CATEGORIES.OVERWORLD,
    bounds: { x: 32, y: 58, width: 8, height: 12 },
    nearbyRegions: ["lumbridge", "desert"]
  },

  // Kharidian Desert
  desert: {
    id: "desert",
    name: "Kharidian Desert",
    category: REGION_CATEGORIES.OVERWORLD,
    bounds: { x: 28, y: 70, width: 16, height: 18 },
    nearbyRegions: ["al_kharid"]
  },

  // Wilderness
  wilderness: {
    id: "wilderness",
    name: "Wilderness",
    category: REGION_CATEGORIES.OVERWORLD,
    bounds: { x: 18, y: 12, width: 22, height: 30 },
    nearbyRegions: ["varrock", "fremennik"]
  },

  // Ardougne
  ardougne: {
    id: "ardougne",
    name: "Ardougne",
    category: REGION_CATEGORIES.OVERWORLD,
    bounds: { x: 8, y: 48, width: 8, height: 10 },
    nearbyRegions: ["yanille", "camelot", "tirannwn"]
  },

  // Yanille
  yanille: {
    id: "yanille",
    name: "Yanille",
    category: REGION_CATEGORIES.OVERWORLD,
    bounds: { x: 6, y: 60, width: 6, height: 6 },
    nearbyRegions: ["ardougne", "feldip_hills"]
  },

  // Feldip Hills
  feldip_hills: {
    id: "feldip_hills",
    name: "Feldip Hills",
    category: REGION_CATEGORIES.OVERWORLD,
    bounds: { x: 6, y: 68, width: 8, height: 8 },
    nearbyRegions: ["yanille", "karamja", "ape_atoll"]
  },

  // Camelot/Catherby
  camelot: {
    id: "camelot",
    name: "Camelot",
    category: REGION_CATEGORIES.OVERWORLD,
    bounds: { x: 10, y: 42, width: 8, height: 8 },
    nearbyRegions: ["ardougne", "fremennik", "falador"]
  },

  // Morytania
  morytania: {
    id: "morytania",
    name: "Morytania",
    category: REGION_CATEGORIES.OVERWORLD,
    bounds: { x: 40, y: 42, width: 16, height: 22 },
    nearbyRegions: ["varrock", "fossil_island", "mos_le_harmless"]
  },

  // Fremennik
  fremennik: {
    id: "fremennik",
    name: "Fremennik Province",
    category: REGION_CATEGORIES.OVERWORLD,
    bounds: { x: 8, y: 22, width: 12, height: 16 },
    nearbyRegions: ["camelot", "wilderness", "troll_country", "fossil_island"]
  },

  // Tirannwn (Elven lands)
  tirannwn: {
    id: "tirannwn",
    name: "Tirannwn",
    category: REGION_CATEGORIES.OVERWORLD,
    bounds: { x: 2, y: 50, width: 8, height: 18 },
    nearbyRegions: ["ardougne"]
  },

  // Troll Country
  troll_country: {
    id: "troll_country",
    name: "Troll Country",
    category: REGION_CATEGORIES.OVERWORLD,
    bounds: { x: 14, y: 32, width: 8, height: 10 },
    nearbyRegions: ["fremennik", "falador", "weiss"]
  },

  // Ape Atoll
  ape_atoll: {
    id: "ape_atoll",
    name: "Ape Atoll",
    category: REGION_CATEGORIES.OVERWORLD,
    bounds: { x: 10, y: 82, width: 6, height: 6 },
    nearbyRegions: ["karamja"]
  },

  // Kourend - Hosidius
  hosidius: {
    id: "hosidius",
    name: "Hosidius",
    category: REGION_CATEGORIES.OVERWORLD,
    bounds: { x: 60, y: 48, width: 8, height: 10 },
    nearbyRegions: ["shayzien", "piscarilius", "arceuus", "lovakengj", "varlamore"]
  },

  // Kourend - Arceuus
  arceuus: {
    id: "arceuus",
    name: "Arceuus",
    category: REGION_CATEGORIES.OVERWORLD,
    bounds: { x: 58, y: 36, width: 8, height: 8 },
    nearbyRegions: ["hosidius", "lovakengj", "piscarilius"]
  },

  // Kourend - Lovakengj
  lovakengj: {
    id: "lovakengj",
    name: "Lovakengj",
    category: REGION_CATEGORIES.OVERWORLD,
    bounds: { x: 52, y: 32, width: 8, height: 10 },
    nearbyRegions: ["shayzien", "arceuus"]
  },

  // Kourend - Shayzien
  shayzien: {
    id: "shayzien",
    name: "Shayzien",
    category: REGION_CATEGORIES.OVERWORLD,
    bounds: { x: 52, y: 44, width: 8, height: 10 },
    nearbyRegions: ["hosidius", "lovakengj", "varlamore"]
  },

  // Kourend - Piscarilius
  piscarilius: {
    id: "piscarilius",
    name: "Piscarilius",
    category: REGION_CATEGORIES.OVERWORLD,
    bounds: { x: 66, y: 36, width: 8, height: 8 },
    nearbyRegions: ["hosidius", "arceuus"]
  },

  // Weiss
  weiss: {
    id: "weiss",
    name: "Weiss",
    category: REGION_CATEGORIES.OVERWORLD,
    bounds: { x: 18, y: 8, width: 6, height: 6 },
    nearbyRegions: ["troll_country", "fremennik"]
  },

  // Varlamore (south of Kourend, added 2024)
  varlamore: {
    id: "varlamore",
    name: "Varlamore",
    category: REGION_CATEGORIES.OVERWORLD,
    bounds: { x: 50, y: 58, width: 18, height: 16 },
    nearbyRegions: ["hosidius", "shayzien"]
  },

  // Mos Le'Harmless (island east of Karamja)
  mos_le_harmless: {
    id: "mos_le_harmless",
    name: "Mos Le'Harmless",
    category: REGION_CATEGORIES.OVERWORLD,
    bounds: { x: 40, y: 75, width: 8, height: 8 },
    nearbyRegions: ["karamja", "morytania"]
  },

  // Giant Conch (standalone island near Mos Le'Harmless)
  giant_conch: {
    id: "giant_conch",
    name: "Giant Conch",
    category: REGION_CATEGORIES.OVERWORLD,
    bounds: { x: 48, y: 78, width: 5, height: 5 },
    nearbyRegions: ["mos_le_harmless"]
  },

  // Fossil Island (northeast, accessed via Digsite)
  fossil_island: {
    id: "fossil_island",
    name: "Fossil Island",
    category: REGION_CATEGORIES.OVERWORLD,
    bounds: { x: 42, y: 18, width: 10, height: 10 },
    nearbyRegions: ["morytania", "fremennik"]
  },

  // Isle of Souls - map-clickable overworld region for Soul Wars
  // Guesses here resolve to soul_wars via regionAliases
  isle_of_souls: {
    id: "isle_of_souls",
    name: "Isle of Souls",
    category: REGION_CATEGORIES.OVERWORLD,
    bounds: { x: 2, y: 38, width: 6, height: 8 },
    nearbyRegions: ["falador", "camelot"]
  },

  // Void Knights' Outpost - map-clickable overworld region for Pest Control
  // Guesses here resolve to pest_control via regionAliases
  void_knights_outpost: {
    id: "void_knights_outpost",
    name: "Void Knights' Outpost",
    category: REGION_CATEGORIES.OVERWORLD,
    bounds: { x: 12, y: 75, width: 6, height: 6 },
    nearbyRegions: ["port_sarim", "karamja"]
  }
};

// Special locations that appear in the side panel (not on map)
export const specialLocations = {
  // Raids
  chambers_of_xeric: {
    id: "chambers_of_xeric",
    name: "Chambers of Xeric",
    category: REGION_CATEGORIES.RAIDS,
    nearbyRegions: ["theatre_of_blood", "tombs_of_amascut"]
  },
  theatre_of_blood: {
    id: "theatre_of_blood",
    name: "Theatre of Blood",
    category: REGION_CATEGORIES.RAIDS,
    nearbyRegions: ["chambers_of_xeric", "tombs_of_amascut"]
  },
  tombs_of_amascut: {
    id: "tombs_of_amascut",
    name: "Tombs of Amascut",
    category: REGION_CATEGORIES.RAIDS,
    nearbyRegions: ["chambers_of_xeric", "theatre_of_blood"]
  },

  // Bosses
  god_wars_dungeon: {
    id: "god_wars_dungeon",
    name: "God Wars Dungeon",
    category: REGION_CATEGORIES.BOSSES,
    nearbyRegions: ["zulrah", "vorkath", "corporeal_beast", "the_nightmare"]
  },
  zulrah: {
    id: "zulrah",
    name: "Zulrah",
    category: REGION_CATEGORIES.BOSSES,
    nearbyRegions: ["god_wars_dungeon", "vorkath"]
  },
  vorkath: {
    id: "vorkath",
    name: "Vorkath",
    category: REGION_CATEGORIES.BOSSES,
    nearbyRegions: ["zulrah", "god_wars_dungeon"]
  },
  corporeal_beast: {
    id: "corporeal_beast",
    name: "Corporeal Beast",
    category: REGION_CATEGORIES.BOSSES,
    nearbyRegions: ["god_wars_dungeon", "the_nightmare"]
  },
  the_nightmare: {
    id: "the_nightmare",
    name: "The Nightmare",
    category: REGION_CATEGORIES.BOSSES,
    nearbyRegions: ["corporeal_beast", "god_wars_dungeon"]
  },
  the_gauntlet: {
    id: "the_gauntlet",
    name: "The Gauntlet",
    category: REGION_CATEGORIES.BOSSES,
    nearbyRegions: ["zulrah", "vorkath"]
  },

  // Minigames
  fight_caves: {
    id: "fight_caves",
    name: "Fight Caves",
    category: REGION_CATEGORIES.MINIGAMES,
    nearbyRegions: ["inferno"]
  },
  inferno: {
    id: "inferno",
    name: "The Inferno",
    category: REGION_CATEGORIES.MINIGAMES,
    nearbyRegions: ["fight_caves"]
  },
  pest_control: {
    id: "pest_control",
    name: "Pest Control",
    category: REGION_CATEGORIES.MINIGAMES,
    nearbyRegions: ["castle_wars", "barbarian_assault"]
  },
  castle_wars: {
    id: "castle_wars",
    name: "Castle Wars",
    category: REGION_CATEGORIES.MINIGAMES,
    nearbyRegions: ["pest_control", "soul_wars"]
  },
  barbarian_assault: {
    id: "barbarian_assault",
    name: "Barbarian Assault",
    category: REGION_CATEGORIES.MINIGAMES,
    nearbyRegions: ["pest_control"]
  },
  trouble_brewing: {
    id: "trouble_brewing",
    name: "Trouble Brewing",
    category: REGION_CATEGORIES.MINIGAMES,
    nearbyRegions: ["tempoross"]
  },
  wintertodt: {
    id: "wintertodt",
    name: "Wintertodt",
    category: REGION_CATEGORIES.MINIGAMES,
    nearbyRegions: ["tempoross", "guardians_of_the_rift"]
  },
  tempoross: {
    id: "tempoross",
    name: "Tempoross",
    category: REGION_CATEGORIES.MINIGAMES,
    nearbyRegions: ["wintertodt", "trouble_brewing"]
  },
  soul_wars: {
    id: "soul_wars",
    name: "Soul Wars",
    category: REGION_CATEGORIES.MINIGAMES,
    nearbyRegions: ["castle_wars"]
  },
  guardians_of_the_rift: {
    id: "guardians_of_the_rift",
    name: "Guardians of the Rift",
    category: REGION_CATEGORIES.MINIGAMES,
    nearbyRegions: ["wintertodt"]
  },

  // Other
  login_screen: {
    id: "login_screen",
    name: "Login Screen",
    category: REGION_CATEGORIES.OTHER,
    nearbyRegions: []
  },
  player_owned_house: {
    id: "player_owned_house",
    name: "Player-Owned House",
    category: REGION_CATEGORIES.OTHER,
    nearbyRegions: []
  },
};

// Maps overworld map region IDs to their equivalent special location IDs.
// When a player clicks these areas on the map, the guess is treated as
// the aliased special location so that map clicks and side-panel clicks
// are treated as the same guess (consistent temperature, deduplication, etc.).
export const regionAliases = {
  void_knights_outpost: "pest_control",
  stranglewood: "varlamore",
  isle_of_souls: "soul_wars"
};

// Mapping from music track locations to region IDs
export const locationToRegion = {
  // Tutorial Island & Lumbridge area
  "Tutorial Island": "tutorial_island",
  "Lumbridge": "lumbridge",
  "Lumbridge Castle": "lumbridge",
  "Lumbridge Swamp": "lumbridge",
  "Lumbridge farms": "lumbridge",
  "Draynor Manor": "draynor",

  // Varrock & Wilderness
  "Varrock": "varrock",
  "Varrock Palace": "varrock",
  "Wilderness": "wilderness",
  "Deep Wilderness": "wilderness",

  // Falador
  "Falador": "falador",

  // Port Sarim & Karamja
  "Port Sarim": "port_sarim",
  "Karamja": "karamja",
  "Ship to Karamja": "port_sarim",
  "Brimhaven": "karamja",

  // Al Kharid & Desert
  "Al Kharid": "al_kharid",
  "Kharidian Desert": "desert",
  "Duel Arena": "al_kharid",

  // Ardougne & Yanille
  "Ardougne": "ardougne",
  "Yanille": "yanille",

  // Camelot & Catherby
  "Camelot": "camelot",
  "Catherby": "camelot",

  // Morytania
  "Morytania": "morytania",
  "Canifis": "morytania",
  "Slayer Tower": "morytania",
  "Mort Myre Swamp": "morytania",
  "Barrows": "morytania",

  // Fremennik
  "Rellekka": "fremennik",
  "Fremennik Province": "fremennik",
  "Miscellania": "fremennik",

  // Tirannwn & Elves
  "Tirannwn": "tirannwn",
  "Lletya": "tirannwn",
  "Prifddinas": "tirannwn",

  // Troll Country
  "Troll Stronghold": "troll_country",
  "Troll Country": "troll_country",
  "Ice Path": "weiss",
  "Weiss": "weiss",

  // Ape Atoll
  "Ape Atoll": "ape_atoll",

  // Varlamore
  "Varlamore": "varlamore",
  "Civitas illa Fortis": "varlamore",
  "Hunter Guild": "varlamore",
  "Outer Fortis": "varlamore",

  // Mos Le'Harmless
  "Mos Le'Harmless": "mos_le_harmless",
  "Mos Le'Harmless Caves": "mos_le_harmless",
  "Harmony Island": "mos_le_harmless",

  // Giant Conch
  "Giant Conch": "giant_conch",

  // Fossil Island
  "Fossil Island": "fossil_island",
  "Mushroom Forest": "fossil_island",
  "Volcanic Mine": "fossil_island",
  "Wyvern Cave": "fossil_island",
  "Museum Camp": "fossil_island",

  // Kourend
  "Hosidius": "hosidius",
  "Arceuus": "arceuus",
  "Lovakengj": "lovakengj",
  "Shayzien": "shayzien",
  "Piscarilius": "piscarilius",

  // Raids
  "Chambers of Xeric": "chambers_of_xeric",
  "Theatre of Blood": "theatre_of_blood",
  "Tombs of Amascut": "tombs_of_amascut",

  // Bosses
  "God Wars Dungeon": "god_wars_dungeon",
  "Zulrah": "zulrah",
  "Vorkath": "vorkath",
  "Corporeal Beast": "corporeal_beast",
  "The Nightmare": "the_nightmare",
  "The Gauntlet": "the_gauntlet",
  "Basilisk Knights": "morytania",

  // Minigames
  "Fight Caves": "fight_caves",
  "The Inferno": "inferno",
  "Pest Control": "pest_control",
  "Castle Wars": "castle_wars",
  "Barbarian Assault": "barbarian_assault",
  "Trouble Brewing": "trouble_brewing",
  "Wintertodt": "wintertodt",
  "Tempoross": "tempoross",
  "Soul Wars": "soul_wars",
  "Guardians of the Rift": "guardians_of_the_rift",

  // Other/Special
  "Login screen": "login_screen",
  "Player-owned house": "player_owned_house",
  "Starting areas": "lumbridge",
  "Farming Guild": "hosidius",

  // Lumbridge area sub-locations
  "Lumbridge Castle Cellar": "lumbridge",
  "Lumbridge Farm (East)": "lumbridge",
  "Path: Lumbridge to Draynor": "lumbridge",
  "North of Lumbridge": "lumbridge",

  // Draynor sub-locations
  "Draynor Market": "draynor",

  // Varrock sub-locations
  "Cooks' Guild": "varrock",
  "Varrock East Mine": "varrock",
  "South Varrock Stone Circle": "varrock",
  "Varrock Southwest Mine": "varrock",
  "Edgeville": "varrock",

  // Wilderness sub-locations
  "Lava Maze (North)": "wilderness",
  "Hobgoblin Mine": "wilderness",
  "East Level 20 Wilderness": "wilderness",
  "Wilderness (East of Boneyard)": "wilderness",
  "Lava Maze (East)": "wilderness",
  "North of Goblin Village": "wilderness",

  // Falador / Asgarnia sub-locations
  "North of Falador": "falador",
  "Burthorpe": "troll_country",
  "Farm South of Falador": "falador",
  "Edgeville Monastery": "falador",
  "Rimmington": "port_sarim",

  // Karamja sub-locations
  "Musa Point (Karamja)": "karamja",

  // Ardougne / Kandarin sub-locations
  "Port Khazard": "ardougne",
  "Ardougne Market": "ardougne",
  "East Ardougne Castle": "ardougne",
  "Gnome Stronghold (Brimstail's Cave)": "camelot",
  "Piscatoris Fishing Colony": "camelot",

  // Al Kharid sub-locations
  "Emir's Arena (North)": "al_kharid",
  "Emir's Arena": "al_kharid",
  "Al Kharid Mine": "al_kharid",

  // Desert sub-locations
  "Kalphite Hive Entrance": "desert",
  "Desert Treasure II": "desert",

  // Morytania sub-locations
  "Slayer Tower (Roof)": "morytania",
  "Stranglewood": "varlamore",

  // Fremennik sub-locations
  "Southwest of Rellekka": "fremennik",

  // Tirannwn / Gauntlet
  "The Gauntlet (Prifddinas)": "the_gauntlet",

  // Zanaris (fairy realm, accessed via Lumbridge Swamp)
  "Zanaris": "lumbridge"
};

// Get all regions (both map and special)
export const getAllRegions = () => {
  return {
    ...mapRegions,
    ...specialLocations
  };
};

// Get region by ID
export const getRegionById = (id) => {
  return mapRegions[id] || specialLocations[id] || null;
};

// Get region for a track location
export const getRegionForLocation = (location) => {
  const regionId = locationToRegion[location];
  if (!regionId) return null;
  return getRegionById(regionId);
};

// Check if a location is a special (side panel) location
export const isSpecialLocation = (regionId) => {
  return !!specialLocations[regionId];
};

// Get special locations by category
export const getSpecialLocationsByCategory = () => {
  const categories = {
    raids: [],
    bosses: [],
    minigames: [],
    other: []
  };

  Object.values(specialLocations).forEach(loc => {
    if (categories[loc.category]) {
      categories[loc.category].push(loc);
    }
  });

  return categories;
};

/**
 * Calculate the "temperature" of a guess
 * Returns a temperature level indicating how close the guess is to the correct answer
 *
 * @param {string} guessedRegionId - The ID of the guessed region
 * @param {string} correctRegionId - The ID of the correct region
 * @returns {object} - { temperature: string, message: string, categoryMatch: boolean }
 */
export const calculateTemperature = (guessedRegionId, correctRegionId) => {
  // Exact match
  if (guessedRegionId === correctRegionId) {
    return {
      temperature: TEMPERATURE.CORRECT,
      message: "Correct!",
      categoryMatch: true
    };
  }

  const guessedRegion = getRegionById(guessedRegionId);
  const correctRegion = getRegionById(correctRegionId);

  if (!guessedRegion || !correctRegion) {
    return {
      temperature: TEMPERATURE.FROZEN,
      message: "Ice cold!",
      categoryMatch: false
    };
  }

  const sameCategory = guessedRegion.category === correctRegion.category;

  // Check if guessed region is nearby the correct one
  const isNearby = correctRegion.nearbyRegions?.includes(guessedRegionId) ||
                   guessedRegion.nearbyRegions?.includes(correctRegionId);

  if (sameCategory && isNearby) {
    return {
      temperature: TEMPERATURE.HOT,
      message: "Hot! Very close!",
      categoryMatch: true
    };
  }

  if (sameCategory) {
    return {
      temperature: TEMPERATURE.WARM,
      message: "Warm - right category!",
      categoryMatch: true
    };
  }

  // Different category
  return {
    temperature: TEMPERATURE.COLD,
    message: "Cold - wrong category",
    categoryMatch: false
  };
};

/**
 * Get the category display name
 */
export const getCategoryDisplayName = (category) => {
  const names = {
    [REGION_CATEGORIES.OVERWORLD]: 'Overworld',
    [REGION_CATEGORIES.RAIDS]: 'Raids',
    [REGION_CATEGORIES.BOSSES]: 'Bosses',
    [REGION_CATEGORIES.MINIGAMES]: 'Minigames',
    [REGION_CATEGORIES.OTHER]: 'Other'
  };
  return names[category] || category;
};

/**
 * Get color for temperature level
 */
export const getTemperatureColor = (temperature) => {
  const colors = {
    [TEMPERATURE.CORRECT]: '#4caf50',  // Green
    [TEMPERATURE.HOT]: '#ff5722',      // Deep orange
    [TEMPERATURE.WARM]: '#ff9800',     // Orange
    [TEMPERATURE.COLD]: '#2196f3',     // Blue
    [TEMPERATURE.FROZEN]: '#9c27b0'    // Purple (ice cold)
  };
  return colors[temperature] || '#666';
};
