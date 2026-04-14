import { musicTracks, WIKI_AUDIO_BASE_URL } from './musicTracks';
import { locationToRegion } from './data/mapRegions';

describe('musicTracks data integrity', () => {
  test('every track has name, url, and location', () => {
    musicTracks.forEach(track => {
      expect(typeof track.name).toBe('string');
      expect(track.name.length).toBeGreaterThan(0);
      expect(typeof track.url).toBe('string');
      expect(track.url.length).toBeGreaterThan(0);
      expect(track.location).toBeDefined();
    });
  });

  test('every track url ends with .ogg', () => {
    musicTracks.forEach(track => {
      const decodedUrl = decodeURIComponent(track.url);
      expect(decodedUrl.endsWith('.ogg')).toBe(true);
    });
  });

  test('track names are unique', () => {
    const names = musicTracks.map(t => t.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  test('track urls are unique', () => {
    const urls = musicTracks.map(t => t.url);
    const uniqueUrls = new Set(urls);
    expect(uniqueUrls.size).toBe(urls.length);
  });

  test('all location strings resolve to a region via locationToRegion', () => {
    const unresolved = [];
    musicTracks.forEach(track => {
      const locations = Array.isArray(track.location) ? track.location : [track.location];
      locations.forEach(loc => {
        if (!locationToRegion[loc]) {
          unresolved.push(`"${loc}" (track: ${track.name})`);
        }
      });
    });
    expect(unresolved).toEqual([]);
  });

  test('WIKI_AUDIO_BASE_URL is defined and non-empty', () => {
    expect(typeof WIKI_AUDIO_BASE_URL).toBe('string');
    expect(WIKI_AUDIO_BASE_URL.length).toBeGreaterThan(0);
  });

  test('there are at least 50 tracks', () => {
    expect(musicTracks.length).toBeGreaterThanOrEqual(50);
  });
});
