import { useState, useEffect, useRef } from 'react';
import './App.css';
import { supabase } from './supabase';
import { musicTracks } from './musicTracks';
import MusicGame from './MusicGame';
import { seededRandom, getTodayString, getYesterdayString, getIndicator, getYear, hasMatchingWord, calculateScore } from './utils';
const gtag = (...args) => { if (typeof window.gtag === 'function') window.gtag(...args); };

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

  // Daily scores (null = not yet won today)
  const [dailyItemsScore, setDailyItemsScore] = useState(null);
  const [dailyMusicScore, setDailyMusicScore] = useState(null);

  // Main game type: 'items' or 'music'
  const [gameType, setGameType] = useState('items');

  // Flash feedback via an overlay child div — never touches game-container's own animation
  const gameContainerRef = useRef(null);
  const flashOverlayRef = useRef(null);

  const handleGuessResult = (result) => {
    const el = flashOverlayRef.current;
    if (!el) return;
    const cls = result === 'correct' ? 'flash-correct' : 'flash-wrong';
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), 800);
  };

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

          const savedItemsScore = localStorage.getItem('scapedle-daily-items-score');
          if (savedItemsScore !== null) setDailyItemsScore(Number(savedItemsScore));
          const savedMusicScore = localStorage.getItem('scapedle-daily-music-score');
          if (savedMusicScore !== null) setDailyMusicScore(Number(savedMusicScore));
        } else {
          // New day - clear old data
          localStorage.setItem('scapedle-daily-date', today);
          localStorage.setItem('scapedle-daily-guesses', '[]');
          localStorage.setItem('scapedle-daily-won', 'false');
          localStorage.removeItem('scapedle-daily-items-score');
          localStorage.removeItem('scapedle-daily-music-score');
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
            const findItemById = (id) =>
              tradeable.find(item => item.id === id) ||
              Object.values(itemData)
                .filter(item => item.tradeable_on_ge && item.name && !item.noted && !item.placeholder)
                .map(item => ({ ...item, ge_price: prices[item.id]?.high ?? null, volume: volumes[item.id] ?? 0 }))
                .find(item => item.id === id);

            const todayData = await fetchDailyWord(today);
            if (todayData) {
              const supabaseItem = findItemById(todayData.item_id);
              if (supabaseItem) setDailyTarget(supabaseItem);
            }

            const yesterdayData = await fetchDailyWord(yesterday);
            if (yesterdayData) {
              const yesterdayWord = findItemById(yesterdayData.item_id);
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

    const isCorrect = item.id === targetItem.id;
    handleGuessResult(isCorrect ? 'correct' : 'wrong');

    if (gameMode === 'daily') {
      const newGuesses = [...dailyGuesses, item];
      setDailyGuesses(newGuesses);
      localStorage.setItem('scapedle-daily-guesses', JSON.stringify(newGuesses.map(g => g.id)));

      if (item.id === dailyTarget.id) {
        const score = calculateScore(newGuesses.length);
        setDailyWon(true);
        setDailyItemsScore(score);
        localStorage.setItem('scapedle-daily-won', 'true');
        localStorage.setItem('scapedle-daily-items-score', String(score));
        gtag('event', 'game_won', { game_type: 'items', mode: 'daily', guesses: newGuesses.length, score });
      } else {
        gtag('event', 'item_guess', { mode: 'daily', guess_number: newGuesses.length });
      }
    } else {
      const newGuesses = [...unlimitedGuesses, item];
      setUnlimitedGuesses(newGuesses);

      if (item.id === unlimitedTarget.id) {
        setUnlimitedWon(true);
        gtag('event', 'game_won', { game_type: 'items', mode: 'unlimited', guesses: newGuesses.length });
      } else {
        gtag('event', 'item_guess', { mode: 'unlimited', guess_number: newGuesses.length });
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
      slotClass = guessSlot === targetSlot ? 'correct' : 'wrong';
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
        <div ref={gameContainerRef} className="game-container">
          <div ref={flashOverlayRef} className="flash-overlay" />
          <div className="help-button" onClick={() => setShowHelp(!showHelp)}>
            ?
          </div>
          {showHelp && (
            <div className="help-panel">
              {gameType === 'items' ? (
                <>
                  <h3>How to Play — Items</h3>
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
                  </ul>
                  <h4>Red hints explained:</h4>
                  <ul>
                    <li><strong>Item slot:</strong> Red means the slot doesn't match — even if both items are equippable, they go in different slots.</li>
                  </ul>
                  <h4>Arrows:</h4>
                  <p>↑ means the target value is higher. ↓ means the target value is lower.</p>
                  <h4>Scoring:</h4>
                  <p>Guess on your first try for <strong>1,000 pts</strong>. Each wrong guess halves your potential score — 500, 250, 125... down to a minimum of 50. Only your daily game counts toward today's total.</p>
                </>
              ) : (
                <>
                  <h3>How to Play — Music</h3>
                  <p>A random OSRS music track is playing. Guess where in the game it unlocks!</p>
                  <ol style={{ paddingLeft: '18px', color: '#ccc', margin: '8px 0' }}>
                    <li>Press ▶ to listen to the track.</li>
                    <li>Click a region on the map, or pick one from the Special Locations panel.</li>
                    <li>Press <strong>Confirm Guess</strong> to submit.</li>
                  </ol>
                  <h4>Special Locations:</h4>
                  <p>Use the panel beside the map for instanced areas like raids, bosses, and minigames that don't appear on the main map.</p>
                  <h4>Scoring:</h4>
                  <p>Guess on your first try for <strong>1,000 pts</strong>. Each wrong guess halves your potential score — 500, 250, 125... down to a minimum of 50. Only your daily game counts toward today's total.</p>
                </>
              )}
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
              onClick={() => { setGameType('items'); gtag('event', 'game_type_switch', { game_type: 'items' }); }}
            >
              Items
            </button>
            <button
              className={`game-type-tab ${gameType === 'music' ? 'active' : ''}`}
              onClick={() => { setGameType('music'); gtag('event', 'game_type_switch', { game_type: 'music' }); }}
            >
              Music
            </button>
          </div>

          {/* Daily Score Panel */}
          <div className="daily-score-panel">
            <span className="daily-badge">DAILY</span>
            <span>Items <strong>{dailyItemsScore !== null ? `${dailyItemsScore} pts` : '—'}</strong></span>
            <span className="score-sep">·</span>
            <span>Music <strong>{dailyMusicScore !== null ? `${dailyMusicScore} pts` : '—'}</strong></span>
            <span className="score-sep">·</span>
            <span className="score-total">Total <strong>{(dailyItemsScore !== null || dailyMusicScore !== null) ? `${(dailyItemsScore ?? 0) + (dailyMusicScore ?? 0)} pts` : '—'}</strong></span>
          </div>

          {gameType === 'items' ? (
            <>
              <div className="tab-container">
                <button
                  className={`tab ${gameMode === 'daily' ? 'active' : ''}`}
                  onClick={() => { setGameMode('daily'); gtag('event', 'mode_switch', { mode: 'daily' }); }}
                >
                  Daily
                </button>
                <button
                  className={`tab ${gameMode === 'unlimited' ? 'active' : ''}`}
                  onClick={() => { setGameMode('unlimited'); gtag('event', 'mode_switch', { mode: 'unlimited' }); }}
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
                  <p className={`score-display ${gameMode === 'unlimited' ? 'score-practice' : ''}`}>
                    {gameMode === 'daily' ? 'Daily score' : 'Practice score'}: {calculateScore(guesses.length)} pts
                  </p>
                  {gameMode === 'unlimited' && (
                    <button className="play-again-btn" onClick={handlePlayAgain}>
                      Play Again
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className={`score-counter ${gameMode === 'unlimited' ? 'score-counter-practice' : ''}`}>
                    {gameMode === 'daily' ? 'Daily' : 'Practice'} — guess now: <strong>{calculateScore(guesses.length + 1)} pts</strong>
                  </div>
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
                </>
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
              onDailySongWon={(score) => { setDailyMusicScore(score); setInitialSongWon(true); }}
              onGuessResult={handleGuessResult}
            />
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
