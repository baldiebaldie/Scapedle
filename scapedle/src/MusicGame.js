import { useState, useRef, useEffect } from 'react';
import { musicTracks, WIKI_AUDIO_BASE_URL } from './musicTracks';
import OSRSMap from './components/OSRSMap';
import {
  locationToRegion,
  getRegionById,
  calculateTemperature,
  TEMPERATURE
} from './data/mapRegions';
import { calculateScore } from './utils';

const gtag = (...args) => { if (typeof window.gtag === 'function') window.gtag(...args); };

const audioUrlCache = {};

async function resolveWikiAudioUrl(filename) {
  if (audioUrlCache[filename]) return audioUrlCache[filename];
  try {
    const apiUrl = `https://oldschool.runescape.wiki/api.php?action=query&prop=imageinfo&iiprop=url&titles=File:${filename}&format=json&origin=*`;
    const res = await fetch(apiUrl);
    const data = await res.json();
    const pages = data.query.pages;
    const page = Object.values(pages)[0];
    const url = page?.imageinfo?.[0]?.url;
    if (url) audioUrlCache[filename] = url;
    return url || null;
  } catch (err) {
    console.warn('Failed to resolve wiki audio URL:', err);
    return null;
  }
}

function MusicGame({ dailySong, unlimitedSong, yesterdaySong, setUnlimitedSong, initialDailyWon, onDailySongWon, onGuessResult, dailyItemsScore, dailyMusicScore, musicMode, setMusicMode, dailyGuessHistory, setDailyGuessHistory, unlimitedGuessHistory, setUnlimitedGuessHistory }) {
  const [dailySongWon, setDailySongWon] = useState(initialDailyWon || false);
  const [unlimitedSongWon, setUnlimitedSongWon] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioError, setAudioError] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef(null);

  // Sync won state when initialDailyWon changes (e.g. after Supabase fetch resolves)
  useEffect(() => {
    if (initialDailyWon !== undefined) setDailySongWon(initialDailyWon);
  }, [initialDailyWon]);

  // Stop audio when the component unmounts (e.g. user switches to Items tab)
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Stop and reset audio whenever the user switches between Daily and Unlimited
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setAudioProgress(0);
    setAudioError(false);
  }, [musicMode]);

  const currentSong = musicMode === 'daily' ? dailySong : unlimitedSong;
  const guessHistory = musicMode === 'daily' ? dailyGuessHistory : unlimitedGuessHistory;
  const songWon = musicMode === 'daily' ? dailySongWon : unlimitedSongWon;

  // Compute total score
  const totalScore = (dailyItemsScore !== null && dailyMusicScore !== null)
    ? (dailyItemsScore ?? 0) + (dailyMusicScore ?? 0)
    : null;

  // Get the correct region ID(s) for the current song
  const getCorrectRegionIds = () => {
    if (!currentSong) return [];
    const loc = currentSong.location;
    if (Array.isArray(loc)) {
      return loc.map(l => locationToRegion[l]).filter(Boolean);
    }
    return locationToRegion[loc] ? [locationToRegion[loc]] : [];
  };

  const handleRegionGuess = (regionId, pinLatLng) => {
    const correctRegionIds = getCorrectRegionIds();
    if (!correctRegionIds.length) return;

    // Check if already guessed this region
    if (guessHistory.some(g => g.regionId === regionId)) return;

    const region = getRegionById(regionId);
    // Use the best (hottest) temperature across all correct regions
    const tempResults = correctRegionIds.map(id => calculateTemperature(regionId, id));
    const tempOrder = [TEMPERATURE.CORRECT, TEMPERATURE.HOT, TEMPERATURE.WARM, TEMPERATURE.COLD, TEMPERATURE.FROZEN];
    const tempResult = tempResults.reduce((best, curr) =>
      tempOrder.indexOf(curr.temperature) < tempOrder.indexOf(best.temperature) ? curr : best
    );

    const newGuess = {
      regionId,
      regionName: region?.name || regionId,
      temperature: tempResult.temperature,
      message: tempResult.message,
      categoryMatch: tempResult.categoryMatch,
      category: region?.category,
      pinLatLng: pinLatLng || null
    };

    const isCorrect = tempResult.temperature === TEMPERATURE.CORRECT;
    if (onGuessResult) onGuessResult(isCorrect ? 'correct' : 'wrong');

    if (musicMode === 'daily') {
      const newHistory = [...dailyGuessHistory, newGuess];
      setDailyGuessHistory(newHistory);
      localStorage.setItem('scapedle-daily-region-guesses', JSON.stringify(newHistory));

      gtag('event', 'music_guess', { game_type: 'music', mode: 'daily', guess_number: newHistory.length, correct: isCorrect });

      if (isCorrect) {
        const score = calculateScore(newHistory.length);
        setDailySongWon(true);
        localStorage.setItem('scapedle-daily-song-won', 'true');
        localStorage.setItem('scapedle-daily-music-score', String(score));
        if (onDailySongWon) onDailySongWon(score);
        gtag('event', 'game_won', { game_type: 'music', mode: 'daily', guesses: newHistory.length, score });
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      }
    } else {
      const newHistory = [...unlimitedGuessHistory, newGuess];
      setUnlimitedGuessHistory(newHistory);

      gtag('event', 'music_guess', { game_type: 'music', mode: 'unlimited', guess_number: newHistory.length, correct: isCorrect });

      if (isCorrect) {
        const score = calculateScore(newHistory.length);
        setUnlimitedSongWon(true);
        gtag('event', 'game_won', { game_type: 'music', mode: 'unlimited', guesses: newHistory.length, score });
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      }
    }
  };

  const togglePlay = async () => {
    if (!currentSong) return;

    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current) {
          const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
          setAudioProgress(progress || 0);
        }
      });
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setAudioProgress(0);
      });
      audioRef.current.addEventListener('error', () => {
        setIsPlaying(false);
        setAudioLoading(false);
        setAudioError(true);
      });
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setAudioError(false);
      const resolvedUrl = await resolveWikiAudioUrl(currentSong.url);
      const audioUrl = resolvedUrl || (WIKI_AUDIO_BASE_URL + currentSong.url);
      if (audioRef.current.src !== audioUrl) {
        setAudioLoading(true);
        audioRef.current.src = audioUrl;
      }
      audioRef.current.play().then(() => {
        setAudioLoading(false);
        gtag('event', 'audio_play', { game_type: 'music', mode: musicMode });
      }).catch(err => {
        console.error('Audio play error:', err);
        setAudioError(true);
        setAudioLoading(false);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  const replayAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.error('Audio play error:', err));
      setIsPlaying(true);
    }
  };

  const handleSongPlayAgain = () => {
    const randomIndex = Math.floor(Math.random() * musicTracks.length);
    const newSong = musicTracks[randomIndex];
    setUnlimitedSong(newSong);
    setUnlimitedGuessHistory([]);
    setUnlimitedSongWon(false);
    setIsPlaying(false);
    setAudioProgress(0);
    setAudioError(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <div key={musicMode} className="game-animate">
      {/* Control row: mode tabs + score display */}
      <div className="control-row">
        <div className="mode-pill">
          <button
            className={`mode-btn${musicMode === 'daily' ? ' active' : ''}`}
            onClick={() => setMusicMode('daily')}
          >Daily</button>
          <button
            className={`mode-btn${musicMode === 'unlimited' ? ' active' : ''}`}
            onClick={() => setMusicMode('unlimited')}
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

      {/* Info row: yesterday's song + guess potential */}
      {(musicMode === 'daily' && yesterdaySong) || !songWon ? (
        <div className="info-row">
          {musicMode === 'daily' && yesterdaySong && (
            <div className="yesterday-pill">
              <span className="yday-label">Yesterday</span>
              <span className="yday-name">{yesterdaySong.name}</span>
            </div>
          )}
          {!songWon && (
            <div className="guess-potential">
              <span className="pot-label">Guess now</span>
              <span className="pot-val">{calculateScore(guessHistory.length + 1)} pts</span>
            </div>
          )}
        </div>
      ) : null}

      {/* Audio player */}
      <div className="audio-player">
        <button
          className={`play-btn${audioLoading ? ' loading' : ''}`}
          onClick={togglePlay}
          disabled={audioLoading}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {audioLoading ? (
            <span className="play-btn-spinner" />
          ) : isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="2" width="4.5" height="12" rx="1.5" />
              <rect x="10.5" y="2" width="4.5" height="12" rx="1.5" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 2.5l11 5.5-11 5.5V2.5z" />
            </svg>
          )}
        </button>
        <div className="audio-progress">
          <div className="progress-bar" style={{ width: `${audioProgress}%` }} />
        </div>
        <button className="replay-btn" onClick={replayAudio} aria-label="Replay">
          ↺
        </button>
      </div>

      {audioError && (
        <div className="audio-error-message">
          Failed to load audio. {musicMode === 'unlimited' && (
            <button className="play-again-btn" onClick={handleSongPlayAgain} style={{ marginLeft: 8, padding: '4px 12px', fontSize: 13 }}>
              Skip Song
            </button>
          )}
        </div>
      )}

      <div className="music-game-instructions">
        <p>Listen to the music, place a pin on the map, and confirm your guess!</p>
      </div>

      {songWon ? (
        <div className="win-panel">
          <div className="win-icon-wrap">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="16" cy="16" r="14" stroke="var(--gold)" strokeWidth="2" fill="none" opacity="0.4" />
              <path d="M10 16l4 4 8-8" stroke="var(--gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="win-item-name">{currentSong?.name}</div>
          <div className="win-stats">
            <div className="win-stat">
              <span className="win-stat-label">Unlocks</span>
              <span className="win-stat-val" style={{ fontSize: '12px' }}>
                {Array.isArray(currentSong?.location) ? currentSong.location.join(' / ') : currentSong?.location}
              </span>
            </div>
            <div className="win-stat">
              <span className="win-stat-label">Guesses</span>
              <span className="win-stat-val">{guessHistory.length}</span>
            </div>
            <div className="win-stat">
              <span className="win-stat-label">{musicMode === 'daily' ? 'Daily Score' : 'Score'}</span>
              <span className="win-stat-val score">{calculateScore(guessHistory.length)} pts</span>
            </div>
          </div>
          <div className="win-actions">
            {musicMode === 'unlimited' && (
              <button className="play-again-btn" onClick={handleSongPlayAgain}>Play Again</button>
            )}
          </div>
        </div>
      ) : (
        <OSRSMap
          onRegionSelect={handleRegionGuess}
          guessHistory={guessHistory}
          disabled={songWon}
        />
      )}
    </div>
  );
}

export default MusicGame;
