import { createClient } from "jsr:@supabase/supabase-js@2";

// Identical to utils.js seededRandom
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Mulberry32 PRNG — good distribution for seeded shuffle
function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher-Yates shuffle using a seeded PRNG so the order is stable but non-sequential
// deno-lint-ignore no-explicit-any
function shuffleWithSeed(arr: any[], seedStr: string): any[] {
  const rng = mulberry32(seededRandom(seedStr));
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getDateString(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${
    String(d.getDate()).padStart(2, "0")
  }`;
}

// Music tracks — mirrors musicTracks.js (frontend is the source of truth)
const MUSIC_TRACKS = [
  // Tutorial Island & Lumbridge
  { name: "Newbie Melody", url: "Newbie_Melody.ogg", location: "Tutorial Island" },
  { name: "Harmony", url: "Harmony.ogg", location: "Lumbridge Castle" },
  { name: "Harmony 2", url: "Harmony_2.ogg", location: "Lumbridge Castle Cellar" },
  { name: "Autumn Voyage", url: "Autumn_Voyage.ogg", location: "Lumbridge Farm (East)" },
  { name: "Dream", url: "Dream.ogg", location: "Path: Lumbridge to Draynor" },
  { name: "Flute Salad", url: "Flute_Salad.ogg", location: "North of Lumbridge" },
  { name: "Yesteryear", url: "Yesteryear.ogg", location: "Lumbridge Swamp" },
  { name: "Spooky", url: "Spooky.ogg", location: "Draynor Manor" },
  { name: "Book of Spells", url: "Book_of_Spells.ogg", location: "Draynor Manor" },
  { name: "Unknown Land", url: "Unknown_Land.ogg", location: "Draynor Market" },

  // Varrock
  { name: "Spirit", url: "Spirit.ogg", location: "Cooks' Guild" },
  { name: "Garden", url: "Garden.ogg", location: "Varrock" },
  { name: "Adventure", url: "Adventure.ogg", location: "Varrock Palace" },
  { name: "Medieval", url: "Medieval.ogg", location: "Varrock East Mine" },
  { name: "Soundscape", url: "Soundscape.ogg", location: "Varrock" },
  { name: "Overture", url: "Overture.ogg", location: "Varrock" },
  { name: "Expanse", url: "Expanse.ogg", location: "South Varrock Stone Circle" },
  { name: "Still Night", url: "Still_Night.ogg", location: "Varrock Southwest Mine" },

  // Edgeville & Wilderness
  { name: "Edgeville", url: "Forever.ogg", location: "Edgeville" },
  { name: "Scape Wild", url: "Scape_Wild.ogg", location: "Wilderness" },
  { name: "Wild Side", url: "Wild_Side.ogg", location: "Lava Maze (North)" },
  { name: "Wilderness", url: "Wilderness.ogg", location: "Hobgoblin Mine" },
  { name: "Dark", url: "Dark.ogg", location: "East Level 20 Wilderness" },
  { name: "The Terrible Caverns", url: "The_Terrible_Caverns.ogg", location: "Wilderness" },
  { name: "Wilderness 2", url: "Wilderness_2.ogg", location: "Lava Maze (East)" },
  { name: "Wilderness 3", url: "Wilderness_3.ogg", location: "North of Goblin Village" },
  { name: "Witching", url: "Witching.ogg", location: "Wilderness (East of Boneyard)" },

  // Falador & Asgarnia
  { name: "Fanfare", url: "Fanfare.ogg", location: "Falador" },
  { name: "Fanfare 2", url: "Fanfare_2.ogg", location: "Falador" },
  { name: "Fanfare 3", url: "Fanfare_3.ogg", location: "Port Khazard" },
  { name: "Scape Soft", url: "Scape_Soft.ogg", location: "North of Falador" },
  { name: "Principality", url: "Principality.ogg", location: "Burthorpe" },
  { name: "Wander", url: "Wander.ogg", location: "Farm South of Falador" },
  { name: "March", url: "March.ogg", location: "Falador" },
  { name: "Long Way Home", url: "Long_Way_Home.ogg", location: "Rimmington" },

  // Port Sarim, Karamja & Brimhaven
  { name: "Sea Shanty", url: "Sea_Shanty.ogg", location: "Musa Point (Karamja)" },
  { name: "Sea Shanty 2", url: "Sea_Shanty_2.ogg", location: "Port Sarim" },
  { name: "Jolly-R", url: "Jolly_R.ogg", location: "Brimhaven" },
  { name: "Landlubber", url: "Landlubber.ogg", location: "Brimhaven" },
  { name: "High Seas", url: "High_Seas.ogg", location: "Brimhaven" },
  { name: "Jungle Island", url: "Jungle_Island.ogg", location: "Karamja" },
  { name: "The Wild Isle", url: "Wild_Isle.ogg", location: "Karamja" },
  { name: "Reggae", url: "Reggae.ogg", location: "Karamja" },
  { name: "Reggae 2", url: "Reggae_2.ogg", location: "Karamja" },
  { name: "Tribal", url: "Tribal.ogg", location: "Karamja" },
  { name: "Scape Hunter", url: "Scape_Hunter.ogg", location: "Karamja" },

  // Gnome Stronghold
  { name: "Brimstail's Scales", url: "Brimstail%27s_Scales.ogg", location: "Gnome Stronghold (Brimstail's Cave)" },

  // Al Kharid & Desert
  { name: "Al Kharid", url: "Al_Kharid.ogg", location: "Al Kharid" },
  { name: "Arabian", url: "Arabian.ogg", location: "Emir's Arena (North)" },
  { name: "Arabian 2", url: "Arabian_2.ogg", location: "Al Kharid Mine" },
  { name: "Arabian 3", url: "Arabian_3.ogg", location: "Kalphite Hive Entrance" },
  { name: "The Desert", url: "The_Desert.ogg", location: "Kharidian Desert" },
  { name: "Desert Heat", url: "Desert_Heat.ogg", location: "Kharidian Desert" },
  { name: "Shine", url: "Shine.ogg", location: "Emir's Arena" },

  // Zanaris (Fairy City)
  { name: "Crystal Cave", url: "Crystal_Cave.ogg", location: "Zanaris" },

  // Ardougne & Kandarin
  { name: "Baroque", url: "Baroque.ogg", location: "Ardougne Market" },
  { name: "Distant Land", url: "Distant_Land.ogg", location: "Ardougne" },
  { name: "Magic Dance", url: "Magic_Dance.ogg", location: "Yanille" },
  { name: "Camelot", url: "Camelot.ogg", location: "Camelot" },
  { name: "Knightly", url: "Knightly.ogg", location: "East Ardougne Castle" },
  { name: "Knightmare", url: "Knightmare.ogg", location: "Edgeville Monastery" },
  { name: "Fishing", url: "Fishing.ogg", location: "Catherby" },

  // Morytania
  { name: "Spooky 2", url: "Spooky_2.ogg", location: "Morytania" },
  { name: "Village", url: "Village.ogg", location: "Canifis" },
  { name: "The Tower", url: "The_Tower.ogg", location: "Slayer Tower" },
  { name: "Grotesque Guardians", url: "Tempest.ogg", location: "Slayer Tower" },
  { name: "Of Ice and Fire", url: "Ice_and_Fire.ogg", location: "Slayer Tower (Roof)" },
  { name: "Alone", url: "Alone.ogg", location: "Mort Myre Swamp" },
  { name: "Mausoleum", url: "Mausoleum.ogg", location: "Barrows" },
  { name: "Barrows", url: "Grave_Robber_(Barrows).ogg", location: "Barrows" },
  { name: "Dance of the Undead", url: "Dance_of_the_Undead.ogg", location: "Barrows" },
  { name: "Welcome to the Theatre", url: "Welcome_to_the_Theatre.ogg", location: "Theatre of Blood" },
  { name: "Malady", url: "Malady.ogg", location: "Theatre of Blood" },
  { name: "Harmony Island", url: "Zombiism.ogg", location: "Harmony Island" },

  // Fremennik
  { name: "Rellekka", url: "Rellekka.ogg", location: "Rellekka" },
  { name: "Norse Code", url: "Norse_Code.ogg", location: "Rellekka" },
  { name: "Lullaby", url: "Lullaby.ogg", location: "Southwest of Rellekka" },
  { name: "Etcetera", url: "Miscellania.ogg", location: "Miscellania" },
  { name: "Borderland", url: "Borderland.ogg", location: "Fremennik Province" },
  { name: "Lament", url: "Lament.ogg", location: "Fremennik Province" },
  { name: "Dagannoth Dawn", url: "Dagannoth_Dawn.ogg", location: "Fremennik Province" },

  // Tirannwn & Elves
  { name: "Elven Mist", url: "Elven_Mist.ogg", location: "Tirannwn" },
  { name: "Lasting", url: "Lasting.ogg", location: "Lletya" },
  { name: "Crystal Sword", url: "Crystal_Sword.ogg", location: ["Wilderness", "Ardougne"] },
  { name: "The Gauntlet", url: "The_Gauntlet.ogg", location: "The Gauntlet (Prifddinas)" },

  // Troll Country
  { name: "Troll Shuffle", url: "Troll_Shuffle.ogg", location: "Troll Stronghold" },
  { name: "Kingdom", url: "Kingdom.ogg", location: "Troll Country" },
  { name: "Ice Melody", url: "Ice_Melody.ogg", location: "Ice Path" },
  { name: "Cave of Beasts", url: "Cave_of_Beasts.ogg", location: "Troll Country" },

  // Kourend
  { name: "Arcane", url: "Arcane.ogg", location: "Arceuus" },
  { name: "Dwarven Domain", url: "Dwarven_Domain.ogg", location: "Lovakengj" },
  { name: "The Forests of Shayzien", url: "The_Forests_of_Shayzien.ogg", location: "Shayzien" },
  { name: "Down by the Docks", url: "Down_by_the_Docks.ogg", location: "Piscarilius" },
  { name: "Shayzien", url: "March_of_the_Shayzien.ogg", location: "Shayzien" },
  { name: "Tithe Farm", url: "The_Forlorn_Homestead.ogg", location: "Hosidius" },
  { name: "Country Jig", url: "Country_Jig.ogg", location: "Farming Guild" },
  { name: "Making Waves", url: "Making_Waves.ogg", location: "Piscatoris Fishing Colony" },

  // Varlamore
  { name: "Civitas illa Fortis", url: "The_City_of_Sun.ogg", location: "Civitas illa Fortis" },
  { name: "The Hunter's Call", url: "Ready_for_the_Hunt.ogg", location: "Hunter Guild" },
  { name: "Colosseum", url: "Glorious_Champion_(Fortis_Colosseum).ogg", location: "Varlamore" },

  // Mos Le'Harmless
  { name: "Yo-Ho-Ho", url: "Yo_Ho_Ho!.ogg", location: "Mos Le'Harmless" },
  { name: "Life's a Beach!", url: "Life%27s_a_Beach!.ogg", location: "Mos Le'Harmless" },
  { name: "In the Brine", url: "In_the_Brine.ogg", location: "Mos Le'Harmless" },
  { name: "Distillery Hilarity", url: "Distillery_Hilarity.ogg", location: "Trouble Brewing" },
  { name: "Cabin Fever", url: "Cabin_Fever.ogg", location: "Mos Le'Harmless" },

  // Fossil Island
  { name: "Fossil Island", url: "Preservation.ogg", location: "Fossil Island" },
  { name: "Fossil Island 2", url: "Preserved.ogg", location: "Fossil Island" },
  { name: "Fossil Island Underground", url: "Fossilised.ogg", location: "Wyvern Cave" },
  { name: "Museum Medley", url: "Museum_Medley.ogg", location: "Museum Camp" },
  { name: "Fossil Island Volcano", url: "Lava_is_Mine.ogg", location: "Volcanic Mine" },

  // Raids
  { name: "Upper Depths", url: "Upper_Depths.ogg", location: "Chambers of Xeric" },
  { name: "Fire in the Deep", url: "Fire_in_the_Deep.ogg", location: "Chambers of Xeric" },
  { name: "Lower Depths", url: "Lower_Depths.ogg", location: "Chambers of Xeric" },
  { name: "The Maiden's Anger", url: "The_Maiden%27s_Anger.ogg", location: "Theatre of Blood" },
  { name: "The Nightmare Continues", url: "The_Nightmare_Continues.ogg", location: "Theatre of Blood" },
  { name: "Arachnids of Vampyrium", url: "Arachnids_of_Vampyrium.ogg", location: "Theatre of Blood" },
  { name: "Power of the Shadow Realm", url: "Power_of_the_Shadow_Realm.ogg", location: "Theatre of Blood" },
  { name: "Last King of the Yarasa", url: "Last_King_of_the_Yarasa.ogg", location: "Theatre of Blood" },
  { name: "The Fat Lady Sings", url: "The_Fat_Lady_Sings.ogg", location: "Theatre of Blood" },
  { name: "Amascut's Promise", url: "Amascut%27s_Promise.ogg", location: "Tombs of Amascut" },
  { name: "Jaws of Gluttony", url: "Jaws_of_Gluttony.ogg", location: "Tombs of Amascut" },
  { name: "A Mother's Curse", url: "A_Mother%27s_Curse.ogg", location: "Tombs of Amascut" },
  { name: "Ape-ex Predator", url: "Ape-ex_Predator.ogg", location: "Tombs of Amascut" },
  { name: "Sands of Time", url: "Sands_of_Time.ogg", location: "Tombs of Amascut" },

  // Bosses
  { name: "Bane", url: "Bane.ogg", location: "Corporeal Beast" },
  { name: "Coil", url: "Coil.ogg", location: "Zulrah" },
  { name: "On Thin Ice", url: "On_Thin_Ice.ogg", location: "Vorkath" },
  { name: "The Bane of Ashihama", url: "The_Bane_of_Ashihama.ogg", location: "The Nightmare" },
  { name: "Inferno", url: "Inferno.ogg", location: "The Inferno" },
  { name: "The Leviathan", url: "Colossus_of_the_Deep.ogg", location: "Desert Treasure II" },
  { name: "Blood Rush", url: "Blood_Rush.ogg", location: "Desert Treasure II" },
  { name: "Eye See You", url: "Eye_See_You.ogg", location: "Desert Treasure II" },
  { name: "Song of the Silent Choir", url: "Song_of_the_Silent_Choir.ogg", location: "Desert Treasure II" },
  { name: "More Than Meets the Eye", url: "More_Than_Meets_the_Eye.ogg", location: "Phantom Muspah" },
  { name: "The Spurned Demon", url: "The_Spurned_Demon.ogg", location: "Zalcano" },
  { name: "Darkly Altared", url: "Darkly_Altared.ogg", location: "Skotizo" },
  { name: "Sarachnis", url: "Sarachnis.ogg", location: "Sarachnis" },
  { name: "Oh Rats!", url: "Oh_Rats!.ogg", location: "Scurrius" },
  { name: "Insect Queen", url: "Insect_Queen.ogg", location: "Kalphite Queen" },
  { name: "The Mad Mole", url: "The_Mad_Mole.ogg", location: "Giant Mole" },
  { name: "Xenophobe", url: "Xenophobe.ogg", location: "Dagannoth Kings" },
  { name: "A Thorn in My Side", url: "A_Thorn_in_My_Side.ogg", location: "Hespori" },
  { name: "Box of Delights", url: "Box_of_Delights.ogg", location: "The Mimic" },
  { name: "Roots and Flutes", url: "Roots_and_Flutes.ogg", location: "Bryophyta" },
  { name: "The Moons of Ruin", url: "The_Moons_of_Ruin.ogg", location: "Perilous Moons" },
  { name: "Are You Not Entertained", url: "Are_You_Not_Entertained.ogg", location: "Fortis Colosseum" },

  // Slayer Bosses
  { name: "Invader", url: "Invader.ogg", location: "Abyssal Sire" },
  { name: "Maws Jaws & Claws", url: "Maws_Jaws_%26_Claws.ogg", location: "Cerberus" },
  { name: "Troubled Waters", url: "Troubled_Waters.ogg", location: "Kraken" },
  { name: "Devils May Care", url: "Devils_May_Care.ogg", location: "Thermonuclear Smoke Devil" },
  { name: "Alchemical Attack!", url: "Alchemical_Attack!.ogg", location: "Alchemical Hydra" },
  { name: "Noxious Awakening", url: "Noxious_Awakening.ogg", location: "Araxxor" },
  { name: "Lair of the Basilisk", url: "Lair_of_the_Basilisk.ogg", location: "Basilisk Knights" },

  // Wilderness Bosses
  { name: "A Dangerous Game", url: "A_Dangerous_Game.ogg", location: ["Callisto", "Vet'ion", "Venenatis"] },
  { name: "Attack 5", url: "Attack_5.ogg", location: "King Black Dragon" },
  { name: "Scorpia Dances", url: "Scorpia_Dances.ogg", location: "Scorpia" },
  { name: "Regal", url: "Regal.ogg", location: "Chaos Elemental" },
  { name: "Deep Wildy", url: "Deep_Wildy.ogg", location: "Chaos Fanatic" },
  { name: "Troubled", url: "Troubled.ogg", location: "Crazy Archaeologist" },

  // God Wars Dungeon
  { name: "Armageddon", url: "Armageddon.ogg", location: "God Wars Dungeon" },
  { name: "Armadyl Alliance", url: "Armadyl_Alliance.ogg", location: "God Wars Dungeon" },
  { name: "Bandos Battalion", url: "Bandos_Battalion.ogg", location: "God Wars Dungeon" },
  { name: "Zamorak Zoo", url: "Zamorak_Zoo.ogg", location: "God Wars Dungeon" },
  { name: "Saradomin Strings", url: "Strength_of_Saradomin.ogg", location: "God Wars Dungeon" },
  { name: "Zaros Stirs", url: "The_Ancient_Prison.ogg", location: "God Wars Dungeon" },
  { name: "Nex", url: "The_Angel%27s_Fury.ogg", location: "God Wars Dungeon" },
  { name: "Eye of the Storm", url: "Eye_of_the_Storm.ogg", location: "God Wars Dungeon" },

  // Quests
  { name: "Monkey Madness", url: "Monkey_Madness.ogg", location: "Ape Atoll" },
  { name: "Monkey Badness", url: "Monkey_Badness.ogg", location: "Ape Atoll" },
  { name: "The Dragon Slayer", url: "The_Dragon_Slayer.ogg", location: "Galvek" },
  { name: "The Fragment", url: "The_Fragment.ogg", location: "Fragment of Seren" },
  { name: "Upir Likhyi", url: "Upir_Likhyi.ogg", location: "Vanstrom Klause" },
  { name: "Attack 2", url: "Attack_2.ogg", location: "Elvarg" },
  { name: "My Arm's Journey", url: "My_Arm%27s_Journey.ogg", location: "Weiss" },

  // Minigames
  { name: "Pest Control", url: "Pest_Control.ogg", location: "Pest Control" },
  { name: "TzHaar!", url: "TzHaar!.ogg", location: "Fight Caves" },
  { name: "Assault and Battery", url: "Assault_and_Battery.ogg", location: "Barbarian Assault" },
  { name: "Barb Wire", url: "Barb_Wire.ogg", location: "Barbarian Assault" },
  { name: "Castle Wars", url: "Castle_Wars.ogg", location: "Castle Wars" },
  { name: "Trouble Brewing", url: "Trouble_Brewing.ogg", location: "Trouble Brewing" },
  { name: "The Doors of Dinh", url: "The_Doors_of_Dinh.ogg", location: "Wintertodt" },
  { name: "The Last Stand", url: "Last_Stand.ogg", location: "Wintertodt" },
  { name: "Tempor of the Storm", url: "Tempor_of_the_Storm.ogg", location: "Tempoross" },
  { name: "Soul Wars", url: "Soul_Wars.ogg", location: "Soul Wars" },
  { name: "Guardians of the Rift", url: "Guardians_of_the_Rift.ogg", location: "Guardians of the Rift" },

  // Iconic & Login Themes
  { name: "Scape Main", url: "Scape_Main.ogg", location: "Login screen" },
  { name: "Scape Original", url: "Scape_Original.ogg", location: "Login screen" },
  { name: "Start", url: "Start.ogg", location: "Starting areas" },
  { name: "Home Sweet Home", url: "Home_Sweet_Home.ogg", location: "Player-owned house" },
];

// Identical item filtering logic to App.js
// deno-lint-ignore no-explicit-any
function filterTradeable(itemData: any, prices: any, volumes: any): any[] {
  return Object.values(itemData)
    // deno-lint-ignore no-explicit-any
    .filter((item: any) =>
      item.tradeable_on_ge && item.name && !item.noted && !item.placeholder
    )
    // deno-lint-ignore no-explicit-any
    .map((item: any) => ({
      ...item,
      ge_price: prices[item.id]?.high ?? null,
      volume: volumes[item.id] ?? 0,
    }))
    // deno-lint-ignore no-explicit-any
    .filter((item: any) => {
      const hasVolume = item.volume >= 400;
      const isExpensive = item.ge_price >= 100000;
      if (!hasVolume && !isExpensive) return false;
      if (item.volume < 500 && item.ge_price <= 5000000) return false;
      if (item.ge_price < 500 && item.volume < 750000) return false;
      if (/\([1-3]\)$/.test(item.name)) return false;
      if (item.name.includes(" 0")) return false;
      if (/page [1-4]$/i.test(item.name)) return false;
      return true;
    });
}

Deno.serve(async (_req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const db = createClient(supabaseUrl, serviceKey);

    // Fetch OSRS item data
    const wikiHeaders = { "User-Agent": "Scapedle" };
    const [itemData, priceData, volumeData] = await Promise.all([
      fetch(
        "https://raw.githubusercontent.com/0xNeffarion/osrsreboxed-db/master/docs/items-complete.json",
      ).then((r) => r.json()),
      fetch("https://prices.runescape.wiki/api/v1/osrs/latest", {
        headers: wikiHeaders,
      }).then((r) => r.json()),
      fetch("https://prices.runescape.wiki/api/v1/osrs/volumes", {
        headers: wikiHeaders,
      }).then((r) => r.json()),
    ]);

    const tradeable = filterTradeable(itemData, priceData.data, volumeData.data);
    const shuffled = shuffleWithSeed(tradeable, "scapedle-v1");

    // Generate entries for today + next 6 days
    const results = [];
    for (let dayOffset = 0; dayOffset <= 6; dayOffset++) {
      const dateStr = getDateString(dayOffset);

      const itemIndex = seededRandom(dateStr) % shuffled.length;
      const item = shuffled[itemIndex];

      const songIndex = seededRandom(dateStr + "-song") % MUSIC_TRACKS.length;
      const song = MUSIC_TRACKS[songIndex];

      // Upsert word — overwrites existing row so NULL rows can be healed on re-run
      if (!item || !item.id || !item.name) {
        results.push({ date: dateStr, item: null, song: song.name, wordError: `No valid item (tradeable count: ${shuffled.length})`, songError: null });
        continue;
      }
      const { error: wordError } = await db.from("daily_words").upsert(
        { date: dateStr, item_id: item.id, item_name: item.name },
        { onConflict: "date", ignoreDuplicates: false },
      );

      const { error: songError } = await db.from("daily_songs").upsert(
        {
          date: dateStr,
          song_name: song.name,
          song_url: song.url,
          location: Array.isArray(song.location) ? JSON.stringify(song.location) : song.location,
        },
        { onConflict: "date", ignoreDuplicates: true },
      );

      results.push({
        date: dateStr,
        item: item.name,
        song: song.name,
        wordError: wordError?.message ?? null,
        songError: songError?.message ?? null,
      });
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
