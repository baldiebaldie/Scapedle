import { useState } from 'react';
import { MapContainer, TileLayer, Marker, CircleMarker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  getSpecialLocationsByCategory,
  getRegionById,
  getTemperatureColor,
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

// OSRS map bounds for regions (in Leaflet coordinates for CRS.Simple)
// Format: [[south, west], [north, east]] or [[minLat, minLng], [maxLat, maxLng]]
// Coordinates calibrated to overworld-only tileset
// Smaller/specific regions listed first so they take click priority over larger ones
const regionBounds = {
  // Small specific regions first
  tutorial_island: [[-55, 100], [-50, 107]],
  weiss: [[-16, 87], [-10, 94]],

  // Kourend sub-regions (northwest of main continent)
  lovakengj: [[-23, 14], [-15, 27]],
  arceuus: [[-23, 27], [-15, 42]],
  shayzien: [[-33, 18], [-23, 30]],
  hosidius: [[-35, 28], [-24, 40]],
  piscarilius: [[-25, 38], [-18, 48]],

  // Small mainland regions
  port_sarim: [[-50, 92], [-45, 100]],
  draynor: [[-50, 96], [-41, 103]],
  al_kharid: [[-50, 109], [-42, 116]],
  lumbridge: [[-50, 103], [-42, 109]],

  // Main cities
  falador: [[-45, 88], [-36, 96]],
  varrock: [[-42, 98], [-32, 112]],

  // Western areas
  camelot: [[-40, 68], [-32, 90]],
  ardougne: [[-48, 68], [-40, 82]],
  yanille: [[-57, 66], [-48, 80]],
  tirannwn: [[-55, 50], [-34, 68]],

  // Northern areas
  troll_country: [[-32, 84], [-24, 92]],
  fremennik: [[-30, 58], [-14, 78]],

  // Southern areas
  ape_atoll: [[-73, 82], [-66, 94]],
  karamja: [[-64, 80], [-48, 96]],

  // New small islands / specific regions (before large regions for click priority)
  fossil_island: [[-20, 120], [-10, 132]],
  mos_le_harmless: [[-64, 118], [-56, 130]],
  giant_conch: [[-72, 122], [-65, 130]],
  // Isle of Souls (west of main continent; resolves to soul_wars via alias)
  isle_of_souls: [[-40, 48], [-30, 58]],
  // Void Knights' Outpost south of Port Sarim (resolves to pest_control via alias)
  void_knights_outpost: [[-60, 90], [-54, 100]],

  // Large regions last (lowest click priority)
  morytania: [[-50, 114], [-30, 135]],
  desert: [[-75, 100], [-50, 120]],
  // Varlamore south of Kourend (large region, listed last)
  varlamore: [[-52, 12], [-36, 48]],
  wilderness: [[-32, 90], [-8, 118]]
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

// Click handler that places a pin on the map
function MapClickHandler({ onPinPlace, disabled }) {
  useMapEvents({
    click: (e) => {
      if (disabled) return;
      const { lat, lng } = e.latlng;
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

  const getLastGuessCategoryMatch = () => {
    if (guessHistory.length === 0) return null;
    const lastGuess = guessHistory[guessHistory.length - 1];
    return lastGuess.categoryMatch ? lastGuess.category : null;
  };

  const highlightedCategory = getLastGuessCategoryMatch();

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

            {/* Previous guess pins (colored by temperature) */}
            {guessHistory.map((guess, idx) => {
              if (!guess.pinLatLng) return null;
              return (
                <CircleMarker
                  key={idx}
                  center={[guess.pinLatLng.lat, guess.pinLatLng.lng]}
                  radius={6}
                  pathOptions={{
                    color: getTemperatureColor(guess.temperature),
                    fillColor: getTemperatureColor(guess.temperature),
                    fillOpacity: 0.8,
                    weight: 2
                  }}
                >
                  <Popup closeButton={false}>
                    <span className="region-popup">
                      {guess.regionName} - {guess.message}
                    </span>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
      </div>

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
          const isHighlighted = highlightedCategory === REGION_CATEGORIES[categoryKey];

          return (
            <div
              key={category}
              className={`special-category ${isHighlighted ? 'highlighted' : ''}`}
            >
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
                        className={`special-location-btn ${isGuessed ? `guessed ${status}` : ''} ${isCorrect ? 'correct' : ''} ${disabled ? 'disabled' : ''}`}
                        style={{
                          backgroundColor: isGuessed ? getTemperatureColor(status) : undefined
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
          {guessHistory.map((guess, idx) => (
            <div
              key={idx}
              className={`guess-row ${guess.temperature}`}
              style={{ borderLeftColor: getTemperatureColor(guess.temperature) }}
            >
              <span className="guess-region">{guess.regionName}</span>
              <span
                className="guess-temp"
                style={{ color: getTemperatureColor(guess.temperature) }}
              >
                {guess.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Temperature Legend */}
      <div className="temperature-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: getTemperatureColor(TEMPERATURE.HOT) }}></span>
          <span>Hot (Very close!)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: getTemperatureColor(TEMPERATURE.WARM) }}></span>
          <span>Warm (Right category)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: getTemperatureColor(TEMPERATURE.COLD) }}></span>
          <span>Cold (Wrong category)</span>
        </div>
      </div>
    </div>
  );
}

export default OSRSMap;
