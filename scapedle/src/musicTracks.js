// Curated list of recognizable OSRS music tracks
// Each track has: name, url (wiki filename), location (unlock hint)
// All URLs verified against https://oldschool.runescape.wiki/images/ on 2026-03-03

export const musicTracks = [
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
  { name: "Crystal Sword", url: "Crystal_Sword.ogg", location: "Tirannwn" },
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

  // Raids & Bosses
  { name: "Upper Depths", url: "Upper_Depths.ogg", location: "Chambers of Xeric" },
  { name: "Fire in the Deep", url: "Fire_in_the_Deep.ogg", location: "Chambers of Xeric" },
  { name: "Lower Depths", url: "Lower_Depths.ogg", location: "Chambers of Xeric" },
  { name: "Amascut's Promise", url: "Amascut%27s_Promise.ogg", location: "Tombs of Amascut" },
  { name: "Strangled", url: "Strangled.ogg", location: "Stranglewood" },
  { name: "Lair of the Basilisk", url: "Lair_of_the_Basilisk.ogg", location: "Basilisk Knights" },
  { name: "Inferno", url: "Inferno.ogg", location: "The Inferno" },
  { name: "The Bane of Ashihama", url: "The_Bane_of_Ashihama.ogg", location: "The Nightmare" },
  { name: "On Thin Ice", url: "On_Thin_Ice.ogg", location: "Vorkath" },
  { name: "Bane", url: "Bane.ogg", location: "Corporeal Beast" },
  { name: "Coil", url: "Coil.ogg", location: "Zulrah" },
  { name: "The Leviathan", url: "Colossus_of_the_Deep.ogg", location: "Desert Treasure II" },

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

export const WIKI_AUDIO_BASE_URL = 'https://oldschool.runescape.wiki/images/';
