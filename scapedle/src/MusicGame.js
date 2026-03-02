import { useState, useRef, useEffect } from 'react';
import { musicTracks, WIKI_AUDIO_BASE_URL } from './musicTracks';
import OSRSMap from './components/OSRSMap';
import {
  locationToRegion,
  getRegionById,
  calculateTemperature,
  TEMPERATURE
} from './data/mapRegions';

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

function MusicGame({ dailySong, unlimitedSong, yesterdaySong, setUnlimitedSong, initialDailyWon }) {
  const [musicMode, setMusicMode] = useState('daily');
  const [dailyGuessHistory, setDailyGuessHistory] = useState([]);
  const [unlimitedGuessHistory, setUnlimitedGuessHistory] = useState([]);
  const [dailySongWon, setDailySongWon] = useState(initialDailyWon || false);
  const [unlimitedSongWon, setUnlimitedSongWon] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioError, setAudioError] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef(null);

  // Load saved daily guess history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('scapedle-daily-region-guesses');
    if (savedHistory) {
      try {
        setDailyGuessHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Error parsing saved guess history:', e);
      }
    }
    if (initialDailyWon !== undefined) setDailySongWon(initialDailyWon);
  }, [initialDailyWon]);

  const currentSong = musicMode === 'daily' ? dailySong : unlimitedSong;
  const guessHistory = musicMode === 'daily' ? dailyGuessHistory : unlimitedGuessHistory;
  const songWon = musicMode === 'daily' ? dailySongWon : unlimitedSongWon;

  // Get the correct region ID for the current song
  const getCorrectRegionId = () => {
    if (!currentSong) return null;
    return locationToRegion[currentSong.location] || null;
  };

  const handleRegionGuess = (regionId, pinLatLng) => {
    const correctRegionId = getCorrectRegionId();
    if (!correctRegionId) return;

    // Check if already guessed this region
    if (guessHistory.some(g => g.regionId === regionId)) return;

    const region = getRegionById(regionId);
    const tempResult = calculateTemperature(regionId, correctRegionId);

    const newGuess = {
      regionId,
      regionName: region?.name || regionId,
      temperature: tempResult.temperature,
      message: tempResult.message,
      categoryMatch: tempResult.categoryMatch,
      category: region?.category,
      pinLatLng: pinLatLng || null
    };

    if (musicMode === 'daily') {
      const newHistory = [...dailyGuessHistory, newGuess];
      setDailyGuessHistory(newHistory);
      localStorage.setItem('scapedle-daily-region-guesses', JSON.stringify(newHistory));

      if (tempResult.temperature === TEMPERATURE.CORRECT) {
        setDailySongWon(true);
        localStorage.setItem('scapedle-daily-song-won', 'true');
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      }
    } else {
      const newHistory = [...unlimitedGuessHistory, newGuess];
      setUnlimitedGuessHistory(newHistory);

      if (tempResult.temperature === TEMPERATURE.CORRECT) {
        setUnlimitedSongWon(true);
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
    <>
      <div className="tab-container">
        <button
          className={`tab ${musicMode === 'daily' ? 'active' : ''}`}
          onClick={() => setMusicMode('daily')}
        >
          Daily
        </button>
        <button
          className={`tab ${musicMode === 'unlimited' ? 'active' : ''}`}
          onClick={() => setMusicMode('unlimited')}
        >
          Unlimited
        </button>
      </div>

      {musicMode === 'daily' && yesterdaySong && (
        <div className="yesterday-word">
          <span>Yesterday's song:</span>
          <span>{yesterdaySong.name}</span>
        </div>
      )}

      <div className="audio-player">
        <button className="play-btn" onClick={togglePlay} disabled={audioLoading}>
          {audioLoading ? '…' : isPlaying ? '⏸' : '▶'}
        </button>
        <div className="audio-progress">
          <div className="progress-bar" style={{ width: `${audioProgress}%` }} />
        </div>
        <button className="replay-btn" onClick={replayAudio}>
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
        <div className="win-message">
          <h2>{currentSong?.name}</h2>
          <p className="location-hint">Unlocks: {currentSong?.location}</p>
          <p>Guesses: {guessHistory.length}</p>
          {musicMode === 'unlimited' && (
            <button className="play-again-btn" onClick={handleSongPlayAgain}>
              Play Again
            </button>
          )}
        </div>
      ) : (
        <OSRSMap
          onRegionSelect={handleRegionGuess}
          guessHistory={guessHistory}
          disabled={songWon}
        />
      )}
    </>
  );
}

export default MusicGame;
