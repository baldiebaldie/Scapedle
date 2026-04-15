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

const saveDailyWord = async (dateString, item) => {
  const { error } = await supabase
    .from('daily_words')
    .upsert({
      date: dateString,
      item_id: item.id,
      item_name: item.name
    }, { onConflict: 'date' });

  if (error) {
    console.error('Error saving daily word:', error);
  }
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

  // Copy-result share button state
  const [copied, setCopied] = useState(false);

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

        // Generate daily item locally using seeded random (fallback if Supabase has no row)
        const dailyItemIndex = seededRandom(today + '-item') % tradeable.length;
        const localDailyItem = tradeable[dailyItemIndex];
        setDailyTarget(localDailyItem);

        // Generate yesterday's item locally
        const yesterdayItemIndex = seededRandom(yesterday + '-item') % tradeable.length;
        const localYesterdayItem = tradeable[yesterdayItemIndex];
        setYesterdayItem(localYesterdayItem);

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
            if (!todayData) {
              await saveDailyWord(today, localDailyItem);
            } else {
              const supabaseItem = findItemById(todayData.item_id);
              if (supabaseItem) setDailyTarget(supabaseItem);
            }

            const yesterdayData = await fetchDailyWord(yesterday);
            if (!yesterdayData) {
              await saveDailyWord(yesterday, localYesterdayItem);
            } else {
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

  const copyShareResult = () => {
    const emojiGrid = guesses.map((g) => {
      if (g.id === targetItem.id) return '🟩🟩🟩🟩🟩🟩';
      const gv = getIndicator(g.ge_price, targetItem.ge_price);
      const vv = getIndicator(g.volume, targetItem.volume);
      const eqM = (!!g.equipment?.slot) === (!!targetItem.equipment?.slot);
      const gS = g.equipment?.slot || null;
      const tS = targetItem.equipment?.slot || null;
      const slotM = (!gS && !tS) || (gS === tS);
      const blV = getIndicator(g.buy_limit, targetItem.buy_limit);
      const ryV = getIndicator(getYear(g.release_date), getYear(targetItem.release_date));
      return [gv.match, vv.match, eqM, slotM, blV.match, ryV.match]
        .map(m => m ? '🟩' : '🟥').join('');
    }).join('\n');
    const text = `Scapedle ${gameMode === 'daily' ? 'Daily' : 'Practice'}\n${guesses.length} guess${guesses.length !== 1 ? 'es' : ''}\n\n${emojiGrid}\nscapedle.com`;
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

    const isCorrect = guess.id === targetItem.id;
    const isPartial = !isCorrect && hasMatchingWord(guess.name, targetItem.name);

    return (
      <div key={guess.id} className="guess-card">
        <div className={`card-header${isCorrect ? ' correct' : isPartial ? ' partial' : ''}`}>
          <img
            src={`data:image/png;base64,${guess.icon}`}
            alt={guess.name}
            className="card-item-icon"
          />
          <span className="card-item-name">{guess.name}</span>
        </div>
        <div className="card-attrs">
          <div className={`attr-cell ${geValue.match ? 'correct' : 'wrong'}`}>
            <span className="attr-label">GE Value</span>
            <span className="attr-value">{guess.ge_price?.toLocaleString() ?? '?'} gp{!geValue.match && ` ${geValue.arrow}`}</span>
          </div>
          <div className={`attr-cell ${volume.match ? 'correct' : 'wrong'}`}>
            <span className="attr-label">Volume</span>
            <span className="attr-value">{guess.volume?.toLocaleString() ?? '?'}{!volume.match && ` ${volume.arrow}`}</span>
          </div>
          <div className={`attr-cell ${equippableMatch ? 'correct' : 'wrong'}`}>
            <span className="attr-label">Equippable</span>
            <span className="attr-value">{guessEquippable ? 'Yes' : 'No'}</span>
          </div>
          <div className={`attr-cell ${slotClass}`}>
            <span className="attr-label">Slot</span>
            <span className="attr-value">{slotText}</span>
          </div>
          <div className={`attr-cell ${buyLimit.match ? 'correct' : 'wrong'}`}>
            <span className="attr-label">Buy Limit</span>
            <span className="attr-value">{guess.buy_limit ?? '?'}{!buyLimit.match && ` ${buyLimit.arrow}`}</span>
          </div>
          <div className={`attr-cell ${releaseYear.match ? 'correct' : 'wrong'}`}>
            <span className="attr-label">Year</span>
            <span className="attr-value">{getYear(guess.release_date)}{!releaseYear.match && ` ${releaseYear.arrow}`}</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div className="App"><header className="App-header"><p style={{fontFamily:'Silkscreen,monospace',color:'#c9a227',fontSize:'12px'}}>Loading...</p></header></div>;

  const totalScore = (dailyItemsScore !== null || dailyMusicScore !== null)
    ? (dailyItemsScore ?? 0) + (dailyMusicScore ?? 0)
    : null;

  return (
    <div className="App">
      <header className="App-header">
        <div ref={gameContainerRef} className="game-container">
          <div ref={flashOverlayRef} className="flash-overlay" />

          {/* ── Title band ── */}
          <div className="title-band">
            <button className="help-button" onClick={() => setShowHelp(!showHelp)}>?</button>
            {showHelp && (
              <div className="help-panel">
                {gameType === 'items' ? (
                  <>
                    <h3>How to Play — Items</h3>
                    <p>Guess the random Old School RuneScape item!</p>
                    <p>Type an item name and pick from the list. After each guess you'll see hints about the target item.</p>
                    <h4>Colours</h4>
                    <ul>
                      <li><span className="color-box green"></span> Green — exact match.</li>
                      <li><span className="color-box orange"></span> Orange — close (name shares a word).</li>
                      <li><span className="color-box red"></span> Red — wrong.</li>
                    </ul>
                    <h4>Arrows</h4>
                    <p>↑ target is higher · ↓ target is lower</p>
                    <h4>Scoring</h4>
                    <p>1st guess = 1,000 pts. Each wrong guess halves the score down to 50 min. Daily only.</p>
                  </>
                ) : (
                  <>
                    <h3>How to Play — Music</h3>
                    <p>A random OSRS track is playing. Guess where it unlocks!</p>
                    <ol>
                      <li>Press Play to listen.</li>
                      <li>Click a region on the map or pick from Special Locations.</li>
                      <li>Press Confirm Guess.</li>
                    </ol>
                    <h4>Scoring</h4>
                    <p>1st guess = 1,000 pts. Each wrong guess halves the score down to 50 min. Daily only.</p>
                  </>
                )}
              </div>
            )}

            <div className="title-row">
              <img src="https://oldschool.runescape.wiki/images/Soul_rune.png" alt="Soul rune" className="title-rune" />
              <span className="title-text">SCAPEDLE</span>
              <img src="https://oldschool.runescape.wiki/images/Soul_rune.png" alt="Soul rune" className="title-rune" />
            </div>
            <div className="title-sep"><span className="title-sep-diamond" /></div>

            <div className="game-type-pill">
              <button
                className={`gt-btn${gameType === 'items' ? ' active' : ''}`}
                onClick={() => { setGameType('items'); gtag('event', 'game_type_switch', { game_type: 'items' }); }}
              >Items</button>
              <button
                className={`gt-btn${gameType === 'music' ? ' active' : ''}`}
                onClick={() => { setGameType('music'); gtag('event', 'game_type_switch', { game_type: 'music' }); }}
              >Music</button>
            </div>
          </div>

          {/* ── Game body ── */}
          <div className="game-body">

            {gameType === 'items' ? (
              <>
                {/* Control row: mode pill + daily scores */}
                <div className="control-row">
                  <div className="mode-pill">
                    <button
                      className={`mode-btn${gameMode === 'daily' ? ' active' : ''}`}
                      onClick={() => { setGameMode('daily'); gtag('event', 'mode_switch', { mode: 'daily' }); }}
                    >Daily</button>
                    <button
                      className={`mode-btn${gameMode === 'unlimited' ? ' active' : ''}`}
                      onClick={() => { setGameMode('unlimited'); gtag('event', 'mode_switch', { mode: 'unlimited' }); }}
                    >Unlimited</button>
                  </div>
                  <div className="score-display-row">
                    <div className="score-piece">
                      <span className="score-badge">Items</span>
                      <span className="score-val">{dailyItemsScore !== null ? `${dailyItemsScore}` : '—'}</span>
                    </div>
                    <span className="score-sep">·</span>
                    <div className="score-piece">
                      <span className="score-badge">Music</span>
                      <span className="score-val">{dailyMusicScore !== null ? `${dailyMusicScore}` : '—'}</span>
                    </div>
                    <span className="score-sep">·</span>
                    <div className="score-piece">
                      <span className="score-badge">Total</span>
                      <span className="score-val">{totalScore !== null ? totalScore : '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Info row: yesterday item + guess potential */}
                {(gameMode === 'daily' && yesterdayItem) || !gameWon ? (
                  <div className="info-row">
                    {gameMode === 'daily' && yesterdayItem && (
                      <div className="yesterday-pill">
                        <span className="yday-label">Yesterday</span>
                        <img
                          src={`data:image/png;base64,${yesterdayItem.icon}`}
                          alt={yesterdayItem.name}
                          className="item-icon-sm"
                        />
                        <span className="yday-name">{yesterdayItem.name}</span>
                      </div>
                    )}
                    {!gameWon && (
                      <div className="guess-potential">
                        <span className="pot-label">Guess now</span>
                        <span className="pot-val">{calculateScore(guesses.length + 1)} pts</span>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Main game area */}
                {gameMode === 'daily' && !dailyTarget ? (
                  <div className="no-daily-message">
                    <p>Today's item hasn't been generated yet. Check back soon!</p>
                    <button className="play-again-btn" onClick={() => window.location.reload()}>Refresh</button>
                  </div>
                ) : gameWon ? (
                  <div className="win-panel">
                    <div className="win-icon-wrap">
                      <img src={`data:image/png;base64,${targetItem.icon}`} alt={targetItem.name} className="win-icon" />
                    </div>
                    <div className="win-item-name">{targetItem.name}</div>
                    <div className="win-stats">
                      <div className="win-stat">
                        <span className="win-stat-label">Guesses</span>
                        <span className="win-stat-val">{guesses.length}</span>
                      </div>
                      <div className="win-stat">
                        <span className="win-stat-label">{gameMode === 'daily' ? 'Daily Score' : 'Score'}</span>
                        <span className="win-stat-val score">{calculateScore(guesses.length)} pts</span>
                      </div>
                    </div>
                    <div className="win-actions">
                      {gameMode === 'daily' && (
                        <button className={`btn-copy${copied ? ' copied' : ''}`} onClick={copyShareResult}>
                          {copied ? 'Copied!' : 'Copy Result'}
                        </button>
                      )}
                      {gameMode === 'unlimited' && (
                        <button className="play-again-btn" onClick={handlePlayAgain}>Play Again</button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="search-wrap">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Search for an item..."
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
                dailyItemsScore={dailyItemsScore}
                dailyMusicScore={dailyMusicScore}
              />
            )}

          </div>
        </div>

        <div className="side-links">
          <span className="side-links-label">Support the project</span>
          <div className="side-links-icons">
            <a href="https://github.com/baldiebaldie" target="_blank" rel="noopener noreferrer" className="side-link" aria-label="GitHub">
              <svg className="github-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            </a>
            <a href="https://ko-fi.com/baldiebaldie" target="_blank" rel="noopener noreferrer" className="side-link" aria-label="Ko-fi">
              <img src="/kofi_favion.png" alt="Ko-fi" className="kofi-icon" />
            </a>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
