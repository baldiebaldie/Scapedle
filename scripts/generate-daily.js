// Local runner: populates daily_words and daily_songs in Supabase for today + next 6 days.
// Requires the service role key (bypasses RLS).
//
// Usage:
//   SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/generate-daily.js
//
// Find your service role key at:
//   Supabase Dashboard → Project Settings → API → service_role

const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const SUPABASE_URL = 'https://gmguyrspjgsrehjqduxa.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required.');
  console.error('Run: SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/generate-daily.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Identical to utils.js seededRandom
function seededRandom(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Mulberry32 PRNG — good distribution for seeded shuffle
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher-Yates shuffle using a seeded PRNG so the order is stable but non-sequential
function shuffleWithSeed(arr, seedStr) {
  const rng = mulberry32(seededRandom(seedStr));
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getDateString(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fetchJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
  });
}

// Identical item filtering logic to App.js
function filterTradeable(itemData, prices, volumes) {
  return Object.values(itemData)
    .filter(item => item.tradeable_on_ge && item.name && !item.noted && !item.placeholder)
    .map(item => ({
      ...item,
      ge_price: prices[item.id]?.high ?? null,
      volume: volumes[item.id] ?? 0,
    }))
    .filter(item => {
      const hasVolume = item.volume >= 400;
      const isExpensive = item.ge_price >= 100000;
      if (!hasVolume && !isExpensive) return false;
      if (item.volume < 500 && item.ge_price <= 5000000) return false;
      if (item.ge_price < 500 && item.volume < 750000) return false;
      if (/\([1-3]\)$/.test(item.name)) return false;
      if (item.name.includes(' 0')) return false;
      if (/page [1-4]$/i.test(item.name)) return false;
      return true;
    });
}

// Mirrors musicTracks.js
const MUSIC_TRACKS = [
  { name: "Newbie Melody", url: "Newbie_Melody.ogg", location: "Tutorial Island" },
  { name: "Harmony", url: "Harmony.ogg", location: "Lumbridge" },
  { name: "Harmony 2", url: "Harmony_2.ogg", location: "Lumbridge" },
  { name: "Autumn Voyage", url: "Autumn_Voyage.ogg", location: "Lumbridge Swamp" },
  { name: "Dream", url: "Dream.ogg", location: "Lumbridge Castle" },
  { name: "Flute Salad", url: "Flute_Salad.ogg", location: "Lumbridge farms" },
  { name: "Yesteryear", url: "Yesteryear.ogg", location: "Draynor Manor" },
  { name: "Spooky", url: "Spooky.ogg", location: "Draynor Manor" },
  { name: "Spirit", url: "Spirit.ogg", location: "Varrock" },
  { name: "Garden", url: "Garden.ogg", location: "Varrock" },
  { name: "Adventure", url: "Adventure.ogg", location: "Varrock" },
  { name: "Medieval", url: "Medieval.ogg", location: "Varrock" },
  { name: "Unknown Land", url: "Unknown_Land.ogg", location: "Wilderness" },
  { name: "Wild Side", url: "Wild_Side.ogg", location: "Wilderness" },
  { name: "Wilderness", url: "Wilderness.ogg", location: "Deep Wilderness" },
  { name: "Dark", url: "Dark.ogg", location: "Wilderness" },
  { name: "Fanfare", url: "Fanfare.ogg", location: "Falador" },
  { name: "Fanfare 2", url: "Fanfare_2.ogg", location: "Falador" },
  { name: "Fanfare 3", url: "Fanfare_3.ogg", location: "Falador" },
  { name: "Scape Soft", url: "Scape_Soft.ogg", location: "Falador" },
  { name: "Principality", url: "Principality.ogg", location: "Falador" },
  { name: "Wander", url: "Wander.ogg", location: "Falador" },
  { name: "Sea Shanty", url: "Sea_Shanty.ogg", location: "Port Sarim" },
  { name: "Sea Shanty 2", url: "Sea_Shanty_2.ogg", location: "Port Sarim" },
  { name: "Jolly-R", url: "Jolly-R.ogg", location: "Port Sarim" },
  { name: "Jungle Island", url: "Jungle_Island.ogg", location: "Karamja" },
  { name: "Landlubber", url: "Landlubber.ogg", location: "Karamja" },
  { name: "High Seas", url: "High_Seas.ogg", location: "Ship to Karamja" },
  { name: "Brimstail's Scales", url: "Brimstail%27s_Scales.ogg", location: "Brimhaven" },
  { name: "Al Kharid", url: "Al_Kharid.ogg", location: "Al Kharid" },
  { name: "Arabian", url: "Arabian.ogg", location: "Al Kharid" },
  { name: "Arabian 2", url: "Arabian_2.ogg", location: "Al Kharid" },
  { name: "Arabian 3", url: "Arabian_3.ogg", location: "Al Kharid" },
  { name: "The Desert", url: "The_Desert.ogg", location: "Kharidian Desert" },
  { name: "Shine", url: "Shine.ogg", location: "Duel Arena" },
  { name: "Duel Arena", url: "Duel_Arena.ogg", location: "Duel Arena" },
  { name: "Baroque", url: "Baroque.ogg", location: "Ardougne" },
  { name: "Forthcoming", url: "Forthcoming.ogg", location: "Ardougne" },
  { name: "Expanse", url: "Expanse.ogg", location: "Ardougne" },
  { name: "Magic Dance", url: "Magic_Dance.ogg", location: "Yanille" },
  { name: "Camelot", url: "Camelot.ogg", location: "Camelot" },
  { name: "Knightly", url: "Knightly.ogg", location: "Camelot" },
  { name: "Fishing", url: "Fishing.ogg", location: "Catherby" },
  { name: "Still Night", url: "Still_Night.ogg", location: "Catherby" },
  { name: "Spooky 2", url: "Spooky_2.ogg", location: "Morytania" },
  { name: "Village", url: "Village.ogg", location: "Canifis" },
  { name: "The Tower", url: "The_Tower.ogg", location: "Slayer Tower" },
  { name: "Alone", url: "Alone.ogg", location: "Mort Myre Swamp" },
  { name: "Mausoleum", url: "Mausoleum.ogg", location: "Barrows" },
  { name: "Barrows", url: "Barrows.ogg", location: "Barrows" },
  { name: "Welcome to the Theatre", url: "Welcome_to_the_Theatre.ogg", location: "Theatre of Blood" },
  { name: "Rellekka", url: "Rellekka.ogg", location: "Rellekka" },
  { name: "Norse Code", url: "Norse_Code.ogg", location: "Rellekka" },
  { name: "Etcetera", url: "Etcetera.ogg", location: "Miscellania" },
  { name: "Borderland", url: "Borderland.ogg", location: "Fremennik Province" },
  { name: "Elven Mist", url: "Elven_Mist.ogg", location: "Tirannwn" },
  { name: "Lasting", url: "Lasting.ogg", location: "Lletya" },
  { name: "Crystal Cave", url: "Crystal_Cave.ogg", location: "Prifddinas" },
  { name: "The Gauntlet", url: "The_Gauntlet.ogg", location: "The Gauntlet" },
  { name: "Troll Shuffle", url: "Troll_Shuffle.ogg", location: "Troll Stronghold" },
  { name: "Kingdom", url: "Kingdom.ogg", location: "Troll Country" },
  { name: "Ice Melody", url: "Ice_Melody.ogg", location: "Ice Path" },
  { name: "Arcane", url: "Arcane.ogg", location: "Arceuus" },
  { name: "Dwarven Domain", url: "Dwarven_Domain.ogg", location: "Lovakengj" },
  { name: "The Forests of Shayzien", url: "The_Forests_of_Shayzien.ogg", location: "Shayzien" },
  { name: "Down by the Docks", url: "Down_by_the_Docks.ogg", location: "Piscarilius" },
  { name: "Civitas illa Fortis", url: "Civitas_illa_Fortis.ogg", location: "Civitas illa Fortis" },
  { name: "The Hunter's Call", url: "The_Hunter%27s_Call.ogg", location: "Hunter Guild" },
  { name: "Colosseum", url: "Colosseum.ogg", location: "Varlamore" },
  { name: "Yo-Ho-Ho", url: "Yo-Ho-Ho.ogg", location: "Mos Le'Harmless" },
  { name: "Pieces of Eight", url: "Pieces_of_Eight.ogg", location: "Mos Le'Harmless" },
  { name: "Shiver Me Timbers", url: "Shiver_Me_Timbers.ogg", location: "Mos Le'Harmless" },
  { name: "Fossil Island", url: "Fossil_Island.ogg", location: "Fossil Island" },
  { name: "Fossil Island 2", url: "Fossil_Island_2.ogg", location: "Mushroom Forest" },
  { name: "Fossil Island Underground", url: "Fossil_Island_Underground.ogg", location: "Wyvern Cave" },
  { name: "The Museum", url: "The_Museum.ogg", location: "Museum Camp" },
  { name: "Upper Depths", url: "Upper_Depths.ogg", location: "Chambers of Xeric" },
  { name: "Fire in the Deep", url: "Fire_in_the_Deep.ogg", location: "Chambers of Xeric" },
  { name: "Amascut's Promise", url: "Amascut%27s_Promise.ogg", location: "Tombs of Amascut" },
  { name: "Lair of the Basilisk", url: "Lair_of_the_Basilisk.ogg", location: "Basilisk Knights" },
  { name: "Inferno", url: "Inferno.ogg", location: "The Inferno" },
  { name: "The Bane of Ashihama", url: "The_Bane_of_Ashihama.ogg", location: "The Nightmare" },
  { name: "On Thin Ice", url: "On_Thin_Ice.ogg", location: "Vorkath" },
  { name: "Bane", url: "Bane.ogg", location: "Corporeal Beast" },
  { name: "Armageddon", url: "Armageddon.ogg", location: "God Wars Dungeon" },
  { name: "Armadyl Alliance", url: "Armadyl_Alliance.ogg", location: "God Wars Dungeon" },
  { name: "Bandos Battalion", url: "Bandos_Battalion.ogg", location: "God Wars Dungeon" },
  { name: "Zamorak Zoo", url: "Zamorak_Zoo.ogg", location: "God Wars Dungeon" },
  { name: "Saradomin Strings", url: "Saradomin_Strings.ogg", location: "God Wars Dungeon" },
  { name: "Monkey Madness", url: "Monkey_Madness.ogg", location: "Ape Atoll" },
  { name: "Monkey Badness", url: "Monkey_Badness.ogg", location: "Ape Atoll" },
  { name: "Pest Control", url: "Pest_Control.ogg", location: "Pest Control" },
  { name: "TzHaar!", url: "TzHaar!.ogg", location: "Fight Caves" },
  { name: "Assault and Battery", url: "Assault_and_Battery.ogg", location: "Barbarian Assault" },
  { name: "Castle Wars", url: "Castle_Wars.ogg", location: "Castle Wars" },
  { name: "Trouble Brewing", url: "Trouble_Brewing.ogg", location: "Trouble Brewing" },
  { name: "The Doors of Dinh", url: "The_Doors_of_Dinh.ogg", location: "Wintertodt" },
  { name: "Tempor of the Storm", url: "Tempor_of_the_Storm.ogg", location: "Tempoross" },
  { name: "Soul Wars", url: "Soul_Wars.ogg", location: "Soul Wars" },
  { name: "Guardians of the Rift", url: "Guardians_of_the_Rift.ogg", location: "Guardians of the Rift" },
  { name: "Country Jig", url: "Country_Jig.ogg", location: "Farming Guild" },
  { name: "Start", url: "Start.ogg", location: "Starting areas" },
  { name: "Home Sweet Home", url: "Home_Sweet_Home.ogg", location: "Player-owned house" },
  { name: "My Arm's Journey", url: "My_Arm%27s_Journey.ogg", location: "Weiss" },
  { name: "Scape Main", url: "Scape_Main.ogg", location: "Login screen" },
  { name: "Scape Original", url: "Scape_Original.ogg", location: "Login screen" },
  { name: "Scape Wild", url: "Scape_Wild.ogg", location: "Wilderness" },
  { name: "Coil", url: "Coil.ogg", location: "Zulrah" },
  { name: "Malady", url: "Malady.ogg", location: "Theatre of Blood" },
  { name: "Lower Depths", url: "Lower_Depths.ogg", location: "Chambers of Xeric" },
  { name: "Soundscape", url: "Soundscape.ogg", location: "Varrock" },
  { name: "Overture", url: "Overture.ogg", location: "Varrock" },
  { name: "Scape Summon", url: "Scape_Summon.ogg", location: "Varrock" },
  { name: "Edgeville", url: "Edgeville.ogg", location: "Wilderness" },
  { name: "March", url: "March.ogg", location: "Falador" },
  { name: "Lullaby", url: "Lullaby.ogg", location: "Falador" },
  { name: "Long Way Home", url: "Long_Way_Home.ogg", location: "Falador" },
  { name: "White Shark", url: "White_Shark.ogg", location: "Camelot" },
  { name: "Book of Spells", url: "Book_of_Spells.ogg", location: "Draynor Manor" },
  { name: "Newbie Melody 2", url: "Newbie_Melody_2.ogg", location: "Tutorial Island" },
  { name: "Crystal Sword", url: "Crystal_Sword.ogg", location: "Tirannwn" },
  { name: "The Wild Isle", url: "The_Wild_Isle.ogg", location: "Karamja" },
  { name: "Feldip Hills", url: "Feldip_Hills.ogg", location: "Karamja" },
  { name: "Reggae", url: "Reggae.ogg", location: "Karamja" },
  { name: "Reggae 2", url: "Reggae_2.ogg", location: "Karamja" },
  { name: "Shadows", url: "Shadows.ogg", location: "Morytania" },
  { name: "Distant Land", url: "Distant_Land.ogg", location: "Ardougne" },
  { name: "Flute Salad 2", url: "Flute_Salad_2.ogg", location: "Ardougne" },
  { name: "Knightmare", url: "Knightmare.ogg", location: "Camelot" },
  { name: "Witching", url: "Witching.ogg", location: "Ardougne" },
  { name: "Lament", url: "Lament.ogg", location: "Fremennik Province" },
  { name: "Dagannoth Dawn", url: "Dagannoth_Dawn.ogg", location: "Fremennik Province" },
  { name: "Shayzien", url: "Shayzien.ogg", location: "Shayzien" },
  { name: "Lovakite Mining", url: "Lovakite_Mining.ogg", location: "Lovakengj" },
  { name: "Piscatoris", url: "Piscatoris.ogg", location: "Piscarilius" },
  { name: "Tithe Farm", url: "Tithe_Farm.ogg", location: "Hosidius" },
  { name: "The Forsaken Tower", url: "The_Forsaken_Tower.ogg", location: "Lovakengj" },
  { name: "Zaros Stirs", url: "Zaros_Stirs.ogg", location: "God Wars Dungeon" },
  { name: "Eye of the Storm", url: "Eye_of_the_Storm.ogg", location: "God Wars Dungeon" },
  { name: "Nex", url: "Nex.ogg", location: "God Wars Dungeon" },
  { name: "Dance of the Undead", url: "Dance_of_the_Undead.ogg", location: "Barrows" },
  { name: "Grotesque Guardians", url: "Grotesque_Guardians.ogg", location: "Slayer Tower" },
  { name: "Dusk", url: "Dusk.ogg", location: "Corporeal Beast" },
  { name: "Of Ice and Fire", url: "Of_Ice_and_Fire.ogg", location: "Theatre of Blood" },
  { name: "Strangled", url: "Strangled.ogg", location: "Tombs of Amascut" },
  { name: "Bandstand", url: "Bandstand.ogg", location: "Wilderness" },
  { name: "The Terrible Caverns", url: "The_Terrible_Caverns.ogg", location: "Wilderness" },
  { name: "Wilderness 2", url: "Wilderness_2.ogg", location: "Deep Wilderness" },
  { name: "Wilderness 3", url: "Wilderness_3.ogg", location: "Deep Wilderness" },
  { name: "Ghosts", url: "Ghosts.ogg", location: "Morytania" },
  { name: "Werewolf", url: "Werewolf.ogg", location: "Canifis" },
  { name: "Harmony Island", url: "Harmony_Island.ogg", location: "Harmony Island" },
  { name: "Mos Le'Harmless", url: "Mos_Le%27Harmless.ogg", location: "Mos Le'Harmless" },
  { name: "Cabin Fever", url: "Cabin_Fever.ogg", location: "Mos Le'Harmless" },
  { name: "Fossil Island 3", url: "Fossil_Island_3.ogg", location: "Fossil Island" },
  { name: "Barb Wire", url: "Barb_Wire.ogg", location: "Barbarian Assault" },
  { name: "The Last Stand", url: "The_Last_Stand.ogg", location: "Wintertodt" },
  { name: "Alone in the Dark", url: "Alone_in_the_Dark.ogg", location: "Morytania" },
  { name: "Desert Heat", url: "Desert_Heat.ogg", location: "Kharidian Desert" },
  { name: "Cave of Beasts", url: "Cave_of_Beasts.ogg", location: "Troll Country" },
  { name: "Tribal", url: "Tribal.ogg", location: "Karamja" },
  { name: "Speakeasy", url: "Speakeasy.ogg", location: "Player-owned house" },
];

async function main() {
  console.log('Fetching OSRS item data...');
  const wikiHeaders = { 'User-Agent': 'Scapedle' };

  const [itemData, priceData, volumeData] = await Promise.all([
    fetchJson('https://raw.githubusercontent.com/0xNeffarion/osrsreboxed-db/master/docs/items-complete.json'),
    fetchJson('https://prices.runescape.wiki/api/v1/osrs/latest', wikiHeaders),
    fetchJson('https://prices.runescape.wiki/api/v1/osrs/volumes', wikiHeaders),
  ]);

  const tradeable = filterTradeable(itemData, priceData.data, volumeData.data);
  console.log(`Filtered to ${tradeable.length} tradeable items.\n`);

  // Shuffle with a fixed seed so the order is randomised but stable across runs.
  // This prevents consecutive dates from picking items with sequential wiki IDs.
  const shuffled = shuffleWithSeed(tradeable, 'scapedle-v1');

  for (let dayOffset = 0; dayOffset <= 6; dayOffset++) {
    const dateStr = getDateString(dayOffset);
    const itemIndex = seededRandom(dateStr) % shuffled.length;
    const item = shuffled[itemIndex];
    const songIndex = seededRandom(dateStr + '-song') % MUSIC_TRACKS.length;
    const song = MUSIC_TRACKS[songIndex];

    if (!item || !item.id || !item.name) {
      console.log(`${dateStr}  ERROR: no valid item selected (tradeable count: ${shuffled.length})`);
      continue;
    }
    const { error: wordError } = await supabase
      .from('daily_words')
      .upsert(
        { date: dateStr, item_id: item.id, item_name: item.name },
        { onConflict: 'date', ignoreDuplicates: false }
      );

    const { error: songError } = await supabase
      .from('daily_songs')
      .upsert(
        { date: dateStr, song_name: song.name, song_url: song.url, location: song.location },
        { onConflict: 'date', ignoreDuplicates: true }
      );

    const wordStatus = wordError ? `ERROR: ${wordError.message}` : 'ok';
    const songStatus = songError ? `ERROR: ${songError.message}` : 'ok';
    console.log(`${dateStr}  item="${item.name}"  song="${song.name}"  [word:${wordStatus}] [song:${songStatus}]`);
  }

  console.log('\nDone.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
