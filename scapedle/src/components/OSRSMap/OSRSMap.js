import React, { useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Rectangle, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  getSpecialLocationsByCategory,
  getRegionById,
  getCategoryDisplayName,
  regionAliases,
  TEMPERATURE,
  REGION_CATEGORIES
} from '../../data/mapRegions';
import './OSRSMap.css';

// Custom pin icon using DivIcon to avoid Leaflet's default icon webpack bundling issues
const createPinIcon = (color = '#e53935') => L.divIcon({
  className: 'custom-map-pin',
  html: `<svg width="24" height="36" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}" stroke="#000" stroke-width="1"/>
    <circle cx="12" cy="12" r="5" fill="white" opacity="0.8"/>
  </svg>`,
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36]
});

// Smaller, semi-transparent pin for confirmed past guesses
const createHistoryPinIcon = (color = '#888888') => L.divIcon({
  className: 'custom-map-pin',
  html: `<svg width="18" height="27" viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}" stroke="#000" stroke-width="1.5" opacity="0.8"/>
    <circle cx="12" cy="12" r="5" fill="white" opacity="0.55"/>
  </svg>`,
  iconSize: [18, 27],
  iconAnchor: [9, 27],
  popupAnchor: [0, -27]
});

// OSRS map bounds for regions (in Leaflet coordinates for CRS.Simple)
// Format: [[south, west], [north, east]] or [[minLat, minLng], [maxLat, maxLng]]
// Coordinates calibrated to overworld-only tileset
// Smaller/specific regions listed first so they take click priority over larger ones
const regionBounds = {
  // Small specific regions first
  tutorial_island: [[-55, 100], [-50, 107]],
  weiss: [[-16, 87], [-10, 94]],

  // Kourend sub-regions (northwest of main continent)
  // Stranglewood listed before Shayzien so it takes click priority in the overlapping area
  // (resolves to varlamore via regionAliases)
  stranglewood: [[-41.2, 6.2], [-35.9, 22.6]],
  lovakengj: [[-23, 14], [-15, 27]],
  arceuus: [[-23, 27], [-15, 42]],
  shayzien: [[-35.6, 8.8], [-23, 27.4]],
  hosidius: [[-36, 28], [-24, 42.8]],
  piscarilius: [[-25, 38], [-18, 48]],

  // Small mainland regions
  port_sarim: [[-50, 92], [-45, 100]],
  draynor: [[-50, 93], [-40, 103]],
  al_kharid: [[-50, 109], [-42, 116]],
  lumbridge: [[-50, 103], [-42, 109]],

  // Main cities
  falador: [[-45, 88], [-36, 96]],
  varrock: [[-42, 98], [-32, 112]],

  // Western areas
  camelot: [[-40, 68], [-32, 90]],
  ardougne: [[-48, 68], [-40, 82]],
  // Isle of Souls — resolves to soul_wars via regionAliases
  isle_of_souls: [[-69.2, 51.4], [-56.5, 65.5]],
  feldip_hills: [[-66, 67.1], [-54.7, 79.4]],
  yanille: [[-53, 66], [-47, 80]],
  tirannwn: [[-55, 50], [-34, 68]],

  // Northern areas — fremennik BEFORE troll_country so Rellekka (east fremennik) wins
  fremennik: [[-30.2, 49.3], [-5.5, 82.8]],
  troll_country: [[-32, 82.6], [-14.9, 89.8]],

  // Southern areas
  giant_conch: [[-89.6, 97.5], [-77.6, 111.1]],
  ape_atoll: [[-73, 82], [-66, 94]],
  karamja: [[-64, 80], [-48, 96]],

  // New small islands / specific regions (before large regions for click priority)
  fossil_island: [[-29.2, 120], [-10, 139.5]],
  mos_le_harmless: [[-64, 124.2], [-53.3, 138.6]],
  // Void Knights' Outpost south of Port Sarim (resolves to pest_control via alias)
  void_knights_outpost: [[-60, 90], [-54, 100]],

  // Large regions last (lowest click priority)
  morytania: [[-50, 114], [-30, 135]],
  desert: [[-75, 100], [-50, 120]],
  varlamore: [[-65.5, 10.9], [-41.8, 42]],
  wilderness: [[-32, 90], [-13.3, 118.3]],
};

// Resolve a lat/lng coordinate to the nearest region ID
// First checks if the point is inside any region bounds (smaller regions checked first).
// If not inside any bounds, finds the region whose center is closest.
function resolveLatLngToRegion(lat, lng) {
  for (const [regionId, bounds] of Object.entries(regionBounds)) {
    const [[minLat, minLng], [maxLat, maxLng]] = bounds;
    if (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) {
      return regionId;
    }
  }

  let nearestRegion = null;
  let nearestDistance = Infinity;

  for (const [regionId, bounds] of Object.entries(regionBounds)) {
    const [[minLat, minLng], [maxLat, maxLng]] = bounds;
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const distance = Math.sqrt((lat - centerLat) ** 2 + (lng - centerLng) ** 2);

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestRegion = regionId;
    }
  }

  return nearestRegion;
}

// Dev mode — detect /dev in the URL pathname
const isDevMode = window.location.pathname.includes('/dev');

// Small square handle icon for region corner resize handles
const cornerHandleIcon = L.divIcon({
  className: '',
  html: '<div style="width:10px;height:10px;background:#fff;border:2px solid #111;border-radius:2px;cursor:crosshair;box-shadow:0 0 3px rgba(0,0,0,0.8);"></div>',
  iconSize: [10, 10],
  iconAnchor: [5, 5]
});

// Distinct colours for each region rectangle
const DEV_COLORS = [
  '#ff4444','#ff8c00','#ffd700','#7fff00','#00e5ff',
  '#1e90ff','#bf00ff','#ff69b4','#00fa9a','#ff6347',
  '#adff2f','#00bfff','#da70d6','#ffa500','#40e0d0',
  '#ff1493','#7cfc00','#4169e1','#ff4500','#00ced1',
  '#9400d3','#32cd32','#dc143c','#00ff7f','#8a2be2',
  '#ff8c00','#20b2aa','#ff00ff','#6495ed','#f08080'
];

function DevRegionOverlay({ devBounds, setDevBounds }) {
  const regionList = Object.keys(devBounds);

  const updateCorner = useCallback((regionId, corner, lat, lng) => {
    setDevBounds(prev => {
      const [[minLat, minLng], [maxLat, maxLng]] = prev[regionId];
      const updated = {
        SW: [[lat, lng], [maxLat, maxLng]],
        NW: [[minLat, lng], [lat, maxLng]],
        NE: [[minLat, minLng], [lat, lng]],
        SE: [[lat, minLng], [maxLat, lng]],
      }[corner] ?? prev[regionId];
      return { ...prev, [regionId]: updated };
    });
  }, [setDevBounds]);

  return (
    <>
      {regionList.map((regionId, idx) => {
        const bounds = devBounds[regionId];
        const [[minLat, minLng], [maxLat, maxLng]] = bounds;
        const color = DEV_COLORS[idx % DEV_COLORS.length];
        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;

        return (
          <React.Fragment key={regionId}>
            <Rectangle
              bounds={bounds}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.15, weight: 2 }}
            >
              <Tooltip permanent direction="center" className="dev-region-label" offset={[0, 0]}>
                {regionId}
              </Tooltip>
            </Rectangle>

            {/* SW corner */}
            <Marker position={[minLat, minLng]} icon={cornerHandleIcon} draggable
              eventHandlers={{ dragend: e => { const p = e.target.getLatLng(); updateCorner(regionId, 'SW', p.lat, p.lng); } }}
            />
            {/* NW corner */}
            <Marker position={[maxLat, minLng]} icon={cornerHandleIcon} draggable
              eventHandlers={{ dragend: e => { const p = e.target.getLatLng(); updateCorner(regionId, 'NW', p.lat, p.lng); } }}
            />
            {/* NE corner */}
            <Marker position={[maxLat, maxLng]} icon={cornerHandleIcon} draggable
              eventHandlers={{ dragend: e => { const p = e.target.getLatLng(); updateCorner(regionId, 'NE', p.lat, p.lng); } }}
            />
            {/* SE corner */}
            <Marker position={[minLat, maxLng]} icon={cornerHandleIcon} draggable
              eventHandlers={{ dragend: e => { const p = e.target.getLatLng(); updateCorner(regionId, 'SE', p.lat, p.lng); } }}
            />
            {/* Center label marker (invisible, just for click-to-log) */}
            <Marker
              position={[centerLat, centerLng]}
              icon={L.divIcon({ className: '', html: '', iconSize: [0, 0] })}
              eventHandlers={{ click: () => console.log(`[DEV] ${regionId}: [[${minLat.toFixed(1)}, ${minLng.toFixed(1)}], [${maxLat.toFixed(1)}, ${maxLng.toFixed(1)}]]`) }}
            />
          </React.Fragment>
        );
      })}
    </>
  );
}

// Formats devBounds as the JS literal you can paste into regionBounds
function formatBoundsCode(devBounds) {
  const lines = Object.entries(devBounds).map(([id, [[minLat, minLng], [maxLat, maxLng]]]) => {
    const fmt = (n) => Number(n.toFixed(1));
    return `  ${id}: [[${fmt(minLat)}, ${fmt(minLng)}], [${fmt(maxLat)}, ${fmt(maxLng)}]],`;
  });
  return `const regionBounds = {\n${lines.join('\n')}\n};`;
}

// Click handler that places a pin on the map
function MapClickHandler({ onPinPlace, disabled }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      // COORD DEBUG — remove when done calibrating bounds
      console.log(`[MAP CLICK] lat: ${lat.toFixed(2)}, lng: ${lng.toFixed(2)}  →  resolves to: ${resolveLatLngToRegion(lat, lng)}`);
      if (disabled) return;
      onPinPlace({ lat, lng });
    }
  });
  return null;
}

function OSRSMap({ onRegionSelect, guessHistory, disabled }) {
  const [pinPosition, setPinPosition] = useState(null);
  const [resolvedRegion, setResolvedRegion] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const specialCategories = getSpecialLocationsByCategory();

  // Dev mode — editable copy of regionBounds for live visual calibration
  const [devBounds, setDevBounds] = useState(() =>
    Object.fromEntries(
      Object.entries(regionBounds).map(([id, b]) => [id, b.map(pt => [...pt])])
    )
  );
  const [devCopied, setDevCopied] = useState(false);

  const handleDevCopy = () => {
    navigator.clipboard.writeText(formatBoundsCode(devBounds));
    setDevCopied(true);
    setTimeout(() => setDevCopied(false), 2000);
  };

  const handleDevReset = () => {
    setDevBounds(
      Object.fromEntries(
        Object.entries(regionBounds).map(([id, b]) => [id, b.map(pt => [...pt])])
      )
    );
  };

  // Get the temperature status for a region based on guess history
  const getRegionStatus = (regionId) => {
    const guess = guessHistory.find(g => g.regionId === regionId);
    if (!guess) return null;
    return guess.temperature;
  };

  const handlePinPlace = (latlng) => {
    setPinPosition(latlng);
    let regionId = resolveLatLngToRegion(latlng.lat, latlng.lng);
    // If this map region is an alias for a special location (e.g. Isle of Souls → soul_wars),
    // resolve to the canonical ID so map clicks and side-panel clicks are treated identically.
    if (regionAliases[regionId]) {
      regionId = regionAliases[regionId];
    }
    setResolvedRegion(regionId);
  };

  const handleConfirmGuess = () => {
    if (!resolvedRegion) return;
    if (guessHistory.some(g => g.regionId === resolvedRegion)) {
      setPinPosition(null);
      setResolvedRegion(null);
      return;
    }
    onRegionSelect(resolvedRegion, { lat: pinPosition.lat, lng: pinPosition.lng });
    setPinPosition(null);
    setResolvedRegion(null);
  };

  const handleClearPin = () => {
    setPinPosition(null);
    setResolvedRegion(null);
  };

  const handleRegionClick = (regionId) => {
    if (disabled) return;
    if (guessHistory.some(g => g.regionId === regionId)) return;
    onRegionSelect(regionId);
  };

  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  // Overworld-only OSRS map tiles (OSRSGuesser tileset, calibrated to regionBounds below)
  // TODO: switch to an updated tileset that includes Varlamore once one is verified
  const tileUrl = 'https://raw.githubusercontent.com/davsan56/OSRSGuesser/main/public/osrsmap/{z}/{x}/{y}.png';

  // Map bounds (prevents panning too far)
  const mapBounds = L.latLngBounds(
    L.latLng(-102, 0),
    L.latLng(0, 144)
  );

  return (
    <div className="osrs-map-wrapper">
      {/* Interactive Leaflet Map */}
      <div className="osrs-map-section">
        <div className="osrs-map-container">
          <MapContainer
            center={[-51, 72]}
            zoom={5}
            minZoom={3}
            maxZoom={7}
            crs={L.CRS.Simple}
            maxBounds={mapBounds}
            maxBoundsViscosity={1.0}
            style={{ height: '100%', width: '100%', background: '#0e0e0e' }}
            zoomControl={true}
            attributionControl={false}
          >
            <TileLayer
              url={tileUrl}
              minZoom={3}
              maxZoom={7}
              noWrap={true}
              bounds={mapBounds}
            />

            <MapClickHandler
              onPinPlace={handlePinPlace}
              disabled={disabled}
            />

            {/* Dev mode region overlays */}
            {isDevMode && (
              <DevRegionOverlay devBounds={devBounds} setDevBounds={setDevBounds} />
            )}

            {/* Active pin (user's current placement, before confirm) */}
            {pinPosition && (
              <Marker
                position={[pinPosition.lat, pinPosition.lng]}
                icon={createPinIcon('#e53935')}
              >
                <Popup closeButton={false} autoClose={false} closeOnClick={false}>
                  <span className="region-popup">
                    {resolvedRegion
                      ? (getRegionById(resolvedRegion)?.name || resolvedRegion)
                      : 'Unknown area'}
                  </span>
                </Popup>
              </Marker>
            )}

            {/* Previous guess pins */}
            {guessHistory.map((guess, idx) => {
              if (!guess.pinLatLng) return null;
              const pinColor = guess.temperature === TEMPERATURE.CORRECT ? '#4caf50' : '#888888';
              return (
                <Marker
                  key={idx}
                  position={[guess.pinLatLng.lat, guess.pinLatLng.lng]}
                  icon={createHistoryPinIcon(pinColor)}
                >
                  <Popup closeButton={false}>
                    <span className="region-popup">
                      {guess.regionName}
                    </span>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* Dev mode bounds panel */}
      {isDevMode && (
        <div className="dev-bounds-panel">
          <div className="dev-bounds-header">
            <span className="dev-badge">DEV MODE</span>
            <span className="dev-hint">Drag corner handles to resize regions. Copy when done.</span>
            <div className="dev-bounds-actions">
              <button className="dev-btn dev-btn-copy" onClick={handleDevCopy}>
                {devCopied ? 'Copied!' : 'Copy Bounds'}
              </button>
              <button className="dev-btn dev-btn-reset" onClick={handleDevReset}>
                Reset
              </button>
            </div>
          </div>
          <pre className="dev-bounds-code">{formatBoundsCode(devBounds)}</pre>
        </div>
      )}

      {/* Confirm button area - shown when pin is placed */}
      {pinPosition && !disabled && (
        <div className="pin-confirm-bar">
          <div className="pin-confirm-info">
            <span className="pin-region-label">
              {resolvedRegion
                ? getRegionById(resolvedRegion)?.name || resolvedRegion
                : 'Unknown area'}
            </span>
            {resolvedRegion && guessHistory.some(g => g.regionId === resolvedRegion) && (
              <span className="already-guessed-warning">Already guessed!</span>
            )}
          </div>
          <div className="pin-confirm-buttons">
            <button
              className="confirm-guess-btn"
              onClick={handleConfirmGuess}
              disabled={!resolvedRegion || guessHistory.some(g => g.regionId === resolvedRegion)}
            >
              Confirm Guess
            </button>
            <button className="clear-pin-btn" onClick={handleClearPin}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Special Locations Side Panel */}
      <div className="special-locations-panel">
        <h4>Special Locations</h4>

        {Object.entries(specialCategories).map(([category, locations]) => {
          if (locations.length === 0) return null;

          const isExpanded = expandedCategory === category;
          const categoryKey = category.toUpperCase();

          return (
            <div key={category} className="special-category">
              <button
                className="category-header"
                onClick={() => toggleCategory(category)}
              >
                <span>{getCategoryDisplayName(REGION_CATEGORIES[categoryKey])}</span>
                <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
              </button>

              {isExpanded && (
                <div className="category-locations">
                  {locations.map(loc => {
                    const status = getRegionStatus(loc.id);
                    const isGuessed = status !== null;
                    const isCorrect = status === TEMPERATURE.CORRECT;

                    return (
                      <button
                        key={loc.id}
                        className={`special-location-btn ${isGuessed ? 'guessed' : ''} ${isCorrect ? 'correct' : ''} ${disabled ? 'disabled' : ''}`}
                        style={{
                          backgroundColor: isCorrect ? '#4caf50' : isGuessed ? '#555' : undefined
                        }}
                        onClick={() => handleRegionClick(loc.id)}
                        disabled={disabled || isGuessed}
                      >
                        {loc.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Guess History */}
      {guessHistory.length > 0 && (
        <div className="guess-history">
          <h4>Your Guesses:</h4>
          {guessHistory.map((guess, idx) => {
            const isCorrect = guess.temperature === TEMPERATURE.CORRECT;
            return (
              <div
                key={idx}
                className="guess-row"
                style={{ borderLeftColor: isCorrect ? '#4caf50' : '#555' }}
              >
                <span className="guess-region">#{idx + 1} {guess.regionName}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default OSRSMap;
