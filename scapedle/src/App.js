import { useState, useEffect } from 'react';
import './App.css';
import { supabase } from './supabase';
import { musicTracks } from './musicTracks';
import MusicGame from './MusicGame';
import { seededRandom, getTodayString, getYesterdayString, getIndicator, getYear, hasMatchingWord } from './utils';

const fetchDailyWord = async (dateString) => {
  const { data, error } = await supabase
    .from('daily_words')
    .select('item_id, item_name')
    .eq('date', dateString)
    .maybeSingle();

  if (error) {
    console.error('Error fetching daily word:', error);
  }
  return data;
};

const fetchDailySong = async (dateString) => {
  const { data, error } = await supabase
    .from('daily_songs')
    .select('song_name, song_url, location')
    .eq('date', dateString)
    .maybeSingle();

  if (error) {
    console.error('Error fetching daily song:', error);
  }
  return data;
};

const saveDailySong = async (dateString, song) => {
  const { error } = await supabase
    .from('daily_songs')
    .upsert({
      date: dateString,
      song_name: song.name,
      song_url: song.url,
      location: song.location
    }, { onConflict: 'date' });

  if (error) {
    console.error('Error saving daily song:', error);
  }
};

function App() {
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [gameMode, setGameMode] = useState('daily');

  // Daily mode state
  const [dailyTarget, setDailyTarget] = useState(null);
  const [dailyGuesses, setDailyGuesses] = useState([]);
  const [dailyWon, setDailyWon] = useState(false);

  // Unlimited mode state
  const [unlimitedTarget, setUnlimitedTarget] = useState(null);
  const [unlimitedGuesses, setUnlimitedGuesses] = useState([]);
  const [unlimitedWon, setUnlimitedWon] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [yesterdayItem, setYesterdayItem] = useState(null);

  // Main game type: 'items' or 'music'
  const [gameType, setGameType] = useState('items');

  // Music mode state (passed to MusicGame component)
  const [dailySong, setDailySong] = useState(null);
  const [unlimitedSong, setUnlimitedSong] = useState(null);
  const [yesterdaySong, setYesterdaySong] = useState(null);
  const [initialSongWon, setInitialSongWon] = useState(false);

  useEffect(() => {
    // Randomly select a background class
    const backgroundClasses = [
      'bg-old', 'bg-farming', 'bg-construction', 'bg-hunter', 'bg-halloween',
      'bg-halloween-2019', 'bg-christmas-old', 'bg-monkey-madness', 'bg-chambers',
      'bg-inferno', 'bg-fossil-island', 'bg-dragon-slayer', 'bg-tob', 'bg-kebos',
      'bg-sote', 'bg-sins', 'bg-kingdom-divided', 'bg-nex', 'bg-shattered-relics',
      'bg-toa', 'bg-dt2', 'bg-varlamore', 'bg-wgs', 'bg-varlamore-rising',
      'bg-yama', 'bg-varlamore-final', 'bg-sailing'
    ];
    const randomClass = backgroundClasses[Math.floor(Math.random() * backgroundClasses.length)];
    document.querySelector('.App-header').classList.add(randomClass);

    const wikiHeaders = { headers: { 'User-Agent': 'Scapedle' } };
    Promise.all([
      fetch('https://raw.githubusercontent.com/0xNeffarion/osrsreboxed-db/master/docs/items-complete.json').then(r => r.json()),
      fetch('https://prices.runescape.wiki/api/v1/osrs/latest', wikiHeaders).then(r => r.json()),
      fetch('https://prices.runescape.wiki/api/v1/osrs/volumes', wikiHeaders).then(r => r.json())
    ])
      .then(([itemData, priceData, volumeData]) => {
        const prices = priceData.data;
        const volumes = volumeData.data;
        // Filter to tradeable items and merge with live GE prices
        const tradeable = Object.values(itemData)
          .filter(item => item.tradeable_on_ge && item.name && !item.noted && !item.placeholder)
          .map(item => ({
            ...item,
            ge_price: prices[item.id]?.high ?? null,
            volume: volumes[item.id] ?? 0
          }))
          .filter(item => {
            // Keep if volume >= 400 OR price >= 100k (expensive rare items)
            const hasVolume = item.volume >= 400;
            const isExpensive = item.ge_price >= 100000;
            if (!hasVolume && !isExpensive) return false;

            // Remove low volume items unless they're very expensive (over 5M)
            if (item.volume < 500 && item.ge_price <= 5000000) return false;

            // Remove cheap items (under 500 gp) unless they have high volume (750k+)
            if (item.ge_price < 500 && item.volume < 750000) return false;

            // Remove potion doses under 4: "(1)", "(2)", "(3)"
            if (/\([1-3]\)$/.test(item.name)) return false;

            // Remove broken Barrows items
            if (item.name.includes(' 0')) return false;

            // Remove god book pages (e.g., "Ancient page 1", "Bandos page 2")
            if (/page [1-4]$/i.test(item.name)) return false;

            return true;
          });

        setAllItems(tradeable);

        const today = getTodayString();
        const yesterday = getYesterdayString();

        // Set unlimited target randomly
        const unlimitedIndex = Math.floor(Math.random() * tradeable.length);
        setUnlimitedTarget(tradeable[unlimitedIndex]);

        // Load daily progress from localStorage
        const savedDate = localStorage.getItem('scapedle-daily-date');
        if (savedDate === today) {
          const savedGuessIds = JSON.parse(localStorage.getItem('scapedle-daily-guesses') || '[]');
          const savedWon = localStorage.getItem('scapedle-daily-won') === 'true';
          const restoredGuesses = savedGuessIds
            .map(id => tradeable.find(item => item.id === id))
            .filter(Boolean);
          setDailyGuesses(restoredGuesses);
          setDailyWon(savedWon);
        } else {
          // New day - clear old data
          localStorage.setItem('scapedle-daily-date', today);
          localStorage.setItem('scapedle-daily-guesses', '[]');
          localStorage.setItem('scapedle-daily-won', 'false');
        }

        // Generate daily song locally using seeded random
        const songIndex = seededRandom(today + '-song') % musicTracks.length;
        setDailySong(musicTracks[songIndex]);

        // Generate yesterday's song locally
        const yesterdaySongIndex = seededRandom(yesterday + '-song') % musicTracks.length;
        setYesterdaySong(musicTracks[yesterdaySongIndex]);

        // Set unlimited song randomly
        const unlimitedSongIndex = Math.floor(Math.random() * musicTracks.length);
        setUnlimitedSong(musicTracks[unlimitedSongIndex]);

        // Load daily song progress from localStorage
        if (savedDate === today) {
          const savedSongWon = localStorage.getItem('scapedle-daily-song-won') === 'true';
          setInitialSongWon(savedSongWon);
        } else {
          localStorage.setItem('scapedle-daily-region-guesses', '[]');
          localStorage.setItem('scapedle-daily-song-won', 'false');
        }

        (async () => {
          try {
            const todayData = await fetchDailyWord(today);
            if (todayData) {
              const supabaseItem = tradeable.find(item => item.id === todayData.item_id);
              if (supabaseItem) {
                setDailyTarget(supabaseItem);
              }
            }

            const yesterdayData = await fetchDailyWord(yesterday);
            if (yesterdayData) {
              const yesterdayWord = tradeable.find(item => item.id === yesterdayData.item_id);
              if (yesterdayWord) setYesterdayItem(yesterdayWord);
            }

            const todaySongData = await fetchDailySong(today);
            if (!todaySongData) {
              await saveDailySong(today, musicTracks[songIndex]);
            } else {
              const song = musicTracks.find(s => s.name === todaySongData.song_name);
              if (song) {
                setDailySong(song);
              }
            }

            const yesterdaySongData = await fetchDailySong(yesterday);
            if (yesterdaySongData) {
              const song = musicTracks.find(s => s.name === yesterdaySongData.song_name);
              if (song) setYesterdaySong(song);
            } else {
              await saveDailySong(yesterday, musicTracks[yesterdaySongIndex]);
            }
          } catch (err) {
            console.warn('Supabase sync failed:', err);
          } finally {
            setLoading(false);
          }
        })();
      })
      .catch(err => {
        console.error('Error:', err);
        setLoading(false);
      });
  }, []);

  // Get current mode's state
  const targetItem = gameMode === 'daily' ? dailyTarget : unlimitedTarget;
  const guesses = gameMode === 'daily' ? dailyGuesses : unlimitedGuesses;
  const gameWon = gameMode === 'daily' ? dailyWon : unlimitedWon;

  const suggestions = inputValue.length > 1
    ? allItems.filter(item =>
        item.name.toLowerCase().includes(inputValue.toLowerCase()) &&
        !guesses.find(g => g.id === item.id)
      ).slice(0, 8)
    : [];

  const handleGuess = (item) => {
    if (guesses.find(g => g.id === item.id)) return;

    if (gameMode === 'daily') {
      const newGuesses = [...dailyGuesses, item];
      setDailyGuesses(newGuesses);
      localStorage.setItem('scapedle-daily-guesses', JSON.stringify(newGuesses.map(g => g.id)));

      if (item.id === dailyTarget.id) {
        setDailyWon(true);
        localStorage.setItem('scapedle-daily-won', 'true');
      }
    } else {
      const newGuesses = [...unlimitedGuesses, item];
      setUnlimitedGuesses(newGuesses);

      if (item.id === unlimitedTarget.id) {
        setUnlimitedWon(true);
      }
    }

    setInputValue('');
  };

  const handlePlayAgain = () => {
    const randomIndex = Math.floor(Math.random() * allItems.length);
    setUnlimitedTarget(allItems[randomIndex]);
    setUnlimitedGuesses([]);
    setUnlimitedWon(false);
  };

  const renderGuessRow = (guess) => {
    const geValue = getIndicator(guess.ge_price, targetItem.ge_price);
    const volume = getIndicator(guess.volume, targetItem.volume);
    const buyLimit = getIndicator(guess.buy_limit, targetItem.buy_limit);
    const releaseYear = getIndicator(getYear(guess.release_date), getYear(targetItem.release_date));

    const guessEquippable = !!guess.equipment?.slot;
    const targetEquippable = !!targetItem.equipment?.slot;
    const equippableMatch = guessEquippable === targetEquippable;

    const guessSlot = guess.equipment?.slot || null;
    const targetSlot = targetItem.equipment?.slot || null;
    let slotClass, slotText;
    if (guessSlot && targetSlot) {
      slotClass = guessSlot === targetSlot ? 'correct' : 'partial';
      slotText = guessSlot;
    } else if (!guessSlot && !targetSlot) {
      slotClass = 'correct';
      slotText = '-';
    } else {
      slotClass = 'wrong';
      slotText = guessSlot || '-';
    }

    return (
      <div key={guess.id} className="guess-row">
        <div className={`cell item-cell ${guess.id === targetItem.id ? 'correct' : hasMatchingWord(guess.name, targetItem.name) ? 'partial' : ''}`}>
          <img
            src={`data:image/png;base64,${guess.icon}`}
            alt={guess.name}
            className="item-icon"
          />
          {guess.name}
        </div>
        <div className={`cell ${geValue.match ? 'correct' : 'wrong'}`}>
          {guess.ge_price?.toLocaleString()} gp {!geValue.match && geValue.arrow}
        </div>
        <div className={`cell ${volume.match ? 'correct' : 'wrong'}`}>
          {guess.volume?.toLocaleString()} {!volume.match && volume.arrow}
        </div>
        <div className={`cell ${equippableMatch ? 'correct' : 'wrong'}`}>
          {guessEquippable ? 'Yes' : 'No'}
        </div>
        <div className={`cell ${slotClass}`}>
          {slotText}
        </div>
        <div className={`cell ${buyLimit.match ? 'correct' : 'wrong'}`}>
          {guess.buy_limit} {!buyLimit.match && buyLimit.arrow}
        </div>
        <div className={`cell ${releaseYear.match ? 'correct' : 'wrong'}`}>
          {getYear(guess.release_date)} {!releaseYear.match && releaseYear.arrow}
        </div>
      </div>
    );
  };

  if (loading) return <div className="App"><header className="App-header"><p>Loading items...</p></header></div>;

  return (
    <div className="App">
      <header className="App-header">
        <div className="game-container">
          <div className="help-button" onClick={() => setShowHelp(!showHelp)}>
            ?
          </div>
          {showHelp && (
            <div className="help-panel">
              <h3>How to Play</h3>
              <p>Guess the random Old School RuneScape item!</p>
              <p>Type an item name and pick from the list. After each guess, you'll see hints about the target item.</p>
              <h4>What the colors mean:</h4>
              <ul>
                <li><span className="color-box green"></span> <strong>Green</strong> = Correct - This value matches exactly.</li>
                <li><span className="color-box orange"></span> <strong>Orange</strong> = Close - You're on the right track.</li>
                <li><span className="color-box red"></span> <strong>Red</strong> = Wrong - This value doesn't match.</li>
              </ul>
              <h4>Orange hints explained:</h4>
              <ul>
                <li><strong>Item name:</strong> Your guess shares a word with the answer (like "Rune scimitar" and "Rune platebody").</li>
                <li><strong>Item slot:</strong> Both items are equippable, but in different slots.</li>
              </ul>
              <h4>Arrows:</h4>
              <p>↑ means the target value is higher. ↓ means the target value is lower.</p>
            </div>
          )}
          <h1>
            <img
              src="https://oldschool.runescape.wiki/images/Soul_rune.png"
              alt="Soul rune"
              className="title-rune"
            />
            Scapedle
            <img
              src="https://oldschool.runescape.wiki/images/Soul_rune.png"
              alt="Soul rune"
              className="title-rune"
            />
          </h1>

          <div className="game-type-tabs">
            <button
              className={`game-type-tab ${gameType === 'items' ? 'active' : ''}`}
              onClick={() => setGameType('items')}
            >
              Items
            </button>
            <button
              className={`game-type-tab ${gameType === 'music' ? 'active' : ''}`}
              onClick={() => setGameType('music')}
            >
              Music
            </button>
          </div>

          {gameType === 'items' ? (
            <>
              <div className="tab-container">
                <button
                  className={`tab ${gameMode === 'daily' ? 'active' : ''}`}
                  onClick={() => setGameMode('daily')}
                >
                  Daily
                </button>
                <button
                  className={`tab ${gameMode === 'unlimited' ? 'active' : ''}`}
                  onClick={() => setGameMode('unlimited')}
                >
                  Unlimited
                </button>
              </div>

              {gameMode === 'daily' && yesterdayItem && (
                <div className="yesterday-word">
                  <span>Yesterday's item:</span>
                  <img
                    src={`data:image/png;base64,${yesterdayItem.icon}`}
                    alt={yesterdayItem.name}
                    className="item-icon small"
                  />
                  <span>{yesterdayItem.name}</span>
                </div>
              )}

              {gameMode === 'daily' && !dailyTarget ? (
                <div className="no-daily-message">
                  <p>Today's item hasn't been generated yet. Check back soon!</p>
                  <button className="play-again-btn" onClick={() => window.location.reload()}>Refresh</button>
                </div>
              ) : gameWon ? (
                <div className="win-message">
                  <h2>
                    {' '}
                    <img
                      src={`data:image/png;base64,${targetItem.icon}`}
                      alt={targetItem.name}
                      className="item-icon"
                    />
                    {targetItem.name}
                  </h2>
                  <p>Guesses: {guesses.length}</p>
                  {gameMode === 'unlimited' && (
                    <button className="play-again-btn" onClick={handlePlayAgain}>
                      Play Again
                    </button>
                  )}
                </div>
              ) : (
                <div className="search-container">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Guess an item..."
                  />
                  {suggestions.length > 0 && (
                    <div className="suggestions">
                      {suggestions.map(item => (
                        <div key={item.id} className="suggestion" onClick={() => handleGuess(item)}>
                          {item.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {guesses.length > 0 && targetItem && (
                <div className="guess-table">
                  <div className="guess-row header">
                    <div className="cell item-cell">Item</div>
                    <div className="cell">GE Value</div>
                    <div className="cell">Daily Trade Volume</div>
                    <div className="cell">Equippable</div>
                    <div className="cell">Item Slot</div>
                    <div className="cell">Buy Limit</div>
                    <div className="cell">Release Date</div>
                  </div>
                  {guesses.map(renderGuessRow)}
                </div>
              )}
            </>
          ) : (
            <MusicGame
              dailySong={dailySong}
              unlimitedSong={unlimitedSong}
              yesterdaySong={yesterdaySong}
              setUnlimitedSong={setUnlimitedSong}
              initialDailyWon={initialSongWon}
            />
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
