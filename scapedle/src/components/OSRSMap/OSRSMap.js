import React, { useState, useCallback, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Rectangle, Tooltip, ZoomControl, useMapEvents, useMap } from 'react-leaflet';
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
const regionBounds = {
  tutorial_island:       [[-54.6, 97.7], [-50, 103.1]],
  weiss:                 [[-16, 87], [-10, 94]],
  stranglewood:          [[-41.2, 6.2], [-35.9, 22.6]],
  lovakengj:             [[-23, 14], [-15, 27]],
  arceuus: [
    [[-24.2, 27], [-15, 36.3]],
    [[-17.9, 36.4], [-11.6, 47.3]]
  ],
  shayzien:              [[-35.6, 8.8], [-23, 27.4]],
  hosidius:              [[-36, 28], [-27.1, 42.6]],
  piscarilius:           [[-25, 36.6], [-18.2, 48]],
  port_sarim:            [[-50, 92], [-45.2, 98.8]],
  draynor:               [[-50, 98.9], [-41.7, 102.9]],
  al_kharid:             [[-50.1, 108.3], [-41.9, 116.3]],
  lumbridge:             [[-50, 103], [-41.9, 108.2]],
  falador:               [[-44.8, 90.4], [-39.1, 98.7]],
  varrock:               [[-41.7, 102.2], [-33.1, 111.1]],
  camelot:               [[-38.7, 77.8], [-32.7, 89.6]],
  ardougne: [
    [[-47.8, 68], [-38.8, 84]],
    [[-51.9, 75.2], [-47.6, 79.9]]
  ],
  isle_of_souls:         [[-69.2, 51.4], [-56.5, 65.5]],
  feldip_hills:          [[-66, 67.1], [-54.7, 79.4]],
  yanille:               [[-54.6, 73.6], [-51.9, 81.2]],
  tirannwn:              [[-54.8, 50], [-33.9, 65.6]],
  fremennik:             [[-30.2, 49.3], [-5.5, 82.8]],
  burthorpe:             [[-32.9, 85.2], [-28.4, 92.4]],
  troll_country:         [[-28.4, 82.6], [-14.9, 92.3]],
  the_great_conch:       [[-90.3, 97.5], [-77.6, 113]],
  ape_atoll:             [[-73, 82], [-66, 94]],
  karamja:               [[-64, 80], [-48, 96]],
  fossil_island:         [[-29.2, 120], [-10, 139.5]],
  mos_le_harmless:       [[-64, 124.2], [-53.3, 138.6]],
  void_knights_outpost:  [[-78.2, 77.7], [-72.2, 81.1]],
  morytania: [
    [[-49.8, 116.5], [-30, 135]],
    [[-41.6, 114.5], [-29.4, 116.7]]
  ],
  desert:                [[-74.7, 102.6], [-50.7, 120]],
  varlamore:             [[-65.5, 10.9], [-41.8, 42]],
  wilderness:            [[-32.8, 92.5], [-11.9, 114]],
  edgeville:             [[-39, 94.7], [-33, 102.2]],
  draynor_manor:         [[-41.9, 98.7], [-39.1, 102.1]],
  taverley:              [[-38.7, 89.8], [-33, 94.6]],
  digsite:               [[-42.1, 111.3], [-33, 113.9]],
  entrana:               [[-42, 86.3], [-38.8, 90.1]],
  tree_gnome_village:    [[-51, 71.7], [-47.9, 75]],
  tree_gnome_stronghold: [[-38.6, 66.3], [-31.8, 77.8]],
  bounty_hunter:         [[-11, 111.2], [-3.6, 119.5]],
};

// Handles both single-box [[min],[max]] and multi-box [[[min],[max]], ...] formats
function resolveLatLngToRegion(lat, lng) {
  const toBoxArray = (value) =>
    typeof value[0][0] === 'number' ? [value] : value;

  const inBox = ([[minLat, minLng], [maxLat, maxLng]]) =>
    lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;

  for (const [regionId, value] of Object.entries(regionBounds)) {
    if (toBoxArray(value).some(inBox)) return regionId;
  }

  let nearestRegion = null;
  let nearestDistance = Infinity;
  for (const [regionId, value] of Object.entries(regionBounds)) {
    for (const [[minLat, minLng], [maxLat, maxLng]] of toBoxArray(value)) {
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      const distance = Math.sqrt((lat - centerLat) ** 2 + (lng - centerLng) ** 2);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestRegion = regionId;
      }
    }
  }
  return nearestRegion;
}

const isDevMode = window.location.pathname.includes('/dev');

const cornerHandleIcon = L.divIcon({
  className: '',
  html: '<div style="width:10px;height:10px;background:#fff;border:2px solid #111;border-radius:2px;cursor:crosshair;box-shadow:0 0 3px rgba(0,0,0,0.8);"></div>',
  iconSize: [10, 10],
  iconAnchor: [5, 5]
});

const centerDotIcon = L.divIcon({
  className: '',
  html: '<div style="width:8px;height:8px;background:#fff;border:1.5px solid #000;border-radius:50%;cursor:pointer;opacity:0.7;"></div>',
  iconSize: [8, 8],
  iconAnchor: [4, 4],
  popupAnchor: [0, -8]
});

const DEV_COLORS = [
  '#ff4444','#ff8c00','#ffd700','#7fff00','#00e5ff',
  '#1e90ff','#bf00ff','#ff69b4','#00fa9a','#ff6347',
  '#adff2f','#00bfff','#da70d6','#ffa500','#40e0d0',
  '#ff1493','#7cfc00','#4169e1','#ff4500','#00ced1',
  '#9400d3','#32cd32','#dc143c','#00ff7f','#8a2be2',
  '#ff8c00','#20b2aa','#ff00ff','#6495ed','#f08080'
];

// Initialise dev boxes from the static regionBounds.
// Multi-polygon entries (array of boxes) are expanded into one box each, all sharing the same label.
function initDevBoxes() {
  const isMulti = (v) => typeof v[0][0] !== 'number';
  const boxes = [];
  Object.entries(regionBounds).forEach(([label, value]) => {
    const polys = isMulti(value) ? value : [value];
    polys.forEach((bounds, i) => {
      boxes.push({
        id: `${label}_${i}`,
        label,
        bounds: bounds.map(pt => [...pt]),
      });
    });
  });
  return boxes;
}

// Popup content for a dev box — uses local state so typing doesn't lose focus
function DevBoxPopupContent({ initialLabel, onLabelChange, onDelete }) {
  const [label, setLabel] = useState(initialLabel);

  useEffect(() => {
    setLabel(initialLabel);
  }, [initialLabel]);

  return (
    <div className="dev-box-popup">
      <label className="dev-box-popup-label">Region label</label>
      <input
        className="dev-box-popup-input"
        type="text"
        value={label}
        onChange={e => setLabel(e.target.value)}
        onBlur={() => onLabelChange(label)}
        placeholder="e.g. varrock"
        autoFocus
      />
      <button className="dev-box-popup-delete" onClick={onDelete}>
        Delete box
      </button>
    </div>
  );
}

function DevBoxOverlay({ devBoxes, setDevBoxes, drawMode }) {
  const updateCorner = useCallback((id, corner, lat, lng) => {
    setDevBoxes(prev => prev.map(box => {
      if (box.id !== id) return box;
      const [[minLat, minLng], [maxLat, maxLng]] = box.bounds;
      const updated = {
        SW: [[lat, lng], [maxLat, maxLng]],
        NW: [[minLat, lng], [lat, maxLng]],
        NE: [[minLat, minLng], [lat, lng]],
        SE: [[lat, minLng], [maxLat, lng]],
      }[corner] ?? box.bounds;
      return { ...box, bounds: updated };
    }));
  }, [setDevBoxes]);

  const updateLabel = useCallback((id, label) => {
    setDevBoxes(prev => prev.map(box => box.id === id ? { ...box, label } : box));
  }, [setDevBoxes]);

  const deleteBox = useCallback((id) => {
    setDevBoxes(prev => prev.filter(box => box.id !== id));
  }, [setDevBoxes]);

  // Assign colours by label — boxes sharing the same label get the same colour
  const labelColorMap = {};
  let colorCounter = 0;
  devBoxes.forEach(box => {
    const key = box.label || `__unlabeled_${box.id}`;
    if (!(key in labelColorMap)) {
      labelColorMap[key] = DEV_COLORS[colorCounter % DEV_COLORS.length];
      colorCounter++;
    }
  });

  return (
    <>
      {devBoxes.map((box) => {
        const [[minLat, minLng], [maxLat, maxLng]] = box.bounds;
        const colorKey = box.label || `__unlabeled_${box.id}`;
        const color = labelColorMap[colorKey];
        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;
        return (
          <React.Fragment key={box.id}>
            <Rectangle
              bounds={box.bounds}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.15, weight: 2 }}
            >
              <Tooltip permanent direction="center" className="dev-region-label" offset={[0, 0]}>
                {box.label || '(unlabeled)'}
              </Tooltip>
            </Rectangle>

            <Marker position={[minLat, minLng]} icon={cornerHandleIcon} draggable={!drawMode}
              eventHandlers={{ dragend: e => { const p = e.target.getLatLng(); updateCorner(box.id, 'SW', p.lat, p.lng); } }}
            />
            <Marker position={[maxLat, minLng]} icon={cornerHandleIcon} draggable={!drawMode}
              eventHandlers={{ dragend: e => { const p = e.target.getLatLng(); updateCorner(box.id, 'NW', p.lat, p.lng); } }}
            />
            <Marker position={[maxLat, maxLng]} icon={cornerHandleIcon} draggable={!drawMode}
              eventHandlers={{ dragend: e => { const p = e.target.getLatLng(); updateCorner(box.id, 'NE', p.lat, p.lng); } }}
            />
            <Marker position={[minLat, maxLng]} icon={cornerHandleIcon} draggable={!drawMode}
              eventHandlers={{ dragend: e => { const p = e.target.getLatLng(); updateCorner(box.id, 'SE', p.lat, p.lng); } }}
            />

            <Marker position={[centerLat, centerLng]} icon={centerDotIcon}>
              <Popup closeButton={true} autoClose={false} closeOnClick={false}>
                <DevBoxPopupContent
                  initialLabel={box.label}
                  onLabelChange={label => updateLabel(box.id, label)}
                  onDelete={() => deleteBox(box.id)}
                />
              </Popup>
            </Marker>
          </React.Fragment>
        );
      })}
    </>
  );
}

function DrawBoxHandler({ drawMode, onBoxCreated }) {
  const map = useMap();
  const startRef = useRef(null);
  const draggingRef = useRef(false);
  const [previewBounds, setPreviewBounds] = useState(null);

  // Re-enable dragging if mouse leaves the map container while drawing
  useEffect(() => {
    if (!drawMode) return;
    const container = map.getContainer();
    const onLeave = () => {
      if (draggingRef.current) {
        draggingRef.current = false;
        startRef.current = null;
        setPreviewBounds(null);
        map.dragging.enable();
      }
    };
    container.addEventListener('mouseleave', onLeave);
    return () => container.removeEventListener('mouseleave', onLeave);
  }, [drawMode, map]);

  useMapEvents({
    mousedown(e) {
      if (!drawMode) return;
      map.dragging.disable();
      startRef.current = e.latlng;
      draggingRef.current = true;
      setPreviewBounds(null);
    },
    mousemove(e) {
      if (!drawMode || !draggingRef.current || !startRef.current) return;
      const { lat: lat1, lng: lng1 } = startRef.current;
      const { lat: lat2, lng: lng2 } = e.latlng;
      setPreviewBounds([
        [Math.min(lat1, lat2), Math.min(lng1, lng2)],
        [Math.max(lat1, lat2), Math.max(lng1, lng2)],
      ]);
    },
    mouseup(e) {
      if (!drawMode || !draggingRef.current || !startRef.current) return;
      draggingRef.current = false;
      map.dragging.enable();
      const { lat: lat1, lng: lng1 } = startRef.current;
      const { lat: lat2, lng: lng2 } = e.latlng;
      startRef.current = null;
      setPreviewBounds(null);
      const minLat = Math.min(lat1, lat2);
      const minLng = Math.min(lng1, lng2);
      const maxLat = Math.max(lat1, lat2);
      const maxLng = Math.max(lng1, lng2);
      // Ignore tiny accidental clicks
      if (Math.abs(maxLat - minLat) > 0.5 && Math.abs(maxLng - minLng) > 0.5) {
        onBoxCreated([[minLat, minLng], [maxLat, maxLng]]);
      }
    },
  });

  if (!previewBounds) return null;
  return (
    <Rectangle
      bounds={previewBounds}
      pathOptions={{ color: '#fff', fillColor: '#fff', fillOpacity: 0.1, weight: 2, dashArray: '6 4' }}
    />
  );
}

function formatBoundsCode(devBoxes) {
  const grouped = {};
  for (const box of devBoxes) {
    const key = box.label.trim() || `__unlabeled_${box.id}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(box.bounds);
  }
  const fmt = n => Number(n.toFixed(1));
  const fmtPair = ([[a, b], [c, d]]) => `[[${fmt(a)}, ${fmt(b)}], [${fmt(c)}, ${fmt(d)}]]`;
  const lines = Object.entries(grouped).map(([label, arr]) =>
    arr.length === 1
      ? `  ${label}: ${fmtPair(arr[0])},`
      : `  ${label}: [\n${arr.map(b => `    ${fmtPair(b)}`).join(',\n')}\n  ],`
  );
  return `const regionBounds = {\n${lines.join('\n')}\n};`;
}

function MapClickHandler({ onPinPlace, disabled }) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
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
  const [historyMinimized, setHistoryMinimized] = useState(false);
  const [specialMinimized, setSpecialMinimized] = useState(false);
  const autoMinimizeTimer = useRef(null);

  const specialCategories = getSpecialLocationsByCategory();
  const expandedLocationCount = expandedCategory ? (specialCategories[expandedCategory]?.length ?? 0) : 0;
  const isWidePanel = expandedLocationCount > 5;

  const resetAutoMinimizeTimer = useCallback(() => {
    if (autoMinimizeTimer.current) {
      clearTimeout(autoMinimizeTimer.current);
    }
    autoMinimizeTimer.current = setTimeout(() => {
      setHistoryMinimized(true);
      setSpecialMinimized(true);
    }, 5000);
  }, []);

  useEffect(() => {
    resetAutoMinimizeTimer();
    return () => {
      if (autoMinimizeTimer.current) {
        clearTimeout(autoMinimizeTimer.current);
      }
    };
  }, [resetAutoMinimizeTimer]);

  const handleInteraction = () => {
    resetAutoMinimizeTimer();
  };

  const [devBoxes, setDevBoxes] = useState(initDevBoxes);
  const [drawMode, setDrawMode] = useState(false);
  const [devCopied, setDevCopied] = useState(false);

  // Escape cancels draw mode
  useEffect(() => {
    if (!isDevMode) return;
    const onKey = (e) => { if (e.key === 'Escape') setDrawMode(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleBoxCreated = useCallback((bounds) => {
    setDevBoxes(prev => [...prev, { id: `box_${Date.now()}`, label: '', bounds }]);
    setDrawMode(false);
  }, []);

  const handleDevCopy = () => {
    navigator.clipboard.writeText(formatBoundsCode(devBoxes));
    setDevCopied(true);
    setTimeout(() => setDevCopied(false), 2000);
  };

  const handleDevReset = () => {
    setDevBoxes(initDevBoxes());
    setDrawMode(false);
  };

  const getRegionStatus = (regionId) => {
    const guess = guessHistory.find(g => g.regionId === regionId);
    if (!guess) return null;
    return guess.temperature;
  };

  const handleRegionGuess = (id, pos) => {
    onRegionSelect(id, pos);
    setHistoryMinimized(false);
    resetAutoMinimizeTimer();
  };

  const handlePinPlace = (latlng) => {
    setPinPosition(latlng);
    let regionId = resolveLatLngToRegion(latlng.lat, latlng.lng);
    if (regionAliases[regionId]) {
      regionId = regionAliases[regionId];
    }
    setResolvedRegion(regionId);
    resetAutoMinimizeTimer();
  };

  const handleConfirmGuess = () => {
    if (!resolvedRegion) return;
    if (guessHistory.some(g => g.regionId === resolvedRegion)) {
      setPinPosition(null);
      setResolvedRegion(null);
      return;
    }
    handleRegionGuess(resolvedRegion, { lat: pinPosition.lat, lng: pinPosition.lng });
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
    handleRegionGuess(regionId);
  };

  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
    handleInteraction();
  };

  const tileUrl = 'https://raw.githubusercontent.com/davsan56/OSRSGuesser/main/public/osrsmap/{z}/{x}/{y}.png';
  const mapBounds = L.latLngBounds(L.latLng(-102, 0), L.latLng(0, 144));

  return (
    <div className="osrs-map-wrapper" onMouseMove={handleInteraction} onClick={handleInteraction}>
      <div className="osrs-map-section">
        <div className={`guess-history ${historyMinimized ? 'minimized' : ''}`}>
          <div className="panel-header">
            <h4>Your Guesses</h4>
            <button
              className="minimize-btn"
              onClick={(e) => { e.stopPropagation(); setHistoryMinimized(!historyMinimized); }}
              title={historyMinimized ? "Expand history" : "Minimize history"}
            >
              {historyMinimized ? '▶' : '◀'}
            </button>
          </div>
          {!historyMinimized && (
            <div className="panel-content">
              {guessHistory.length === 0 ? (
                <div className="no-guesses-hint">No guesses yet</div>
              ) : (
                guessHistory.map((guess, idx) => {
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
                })
              )}
            </div>
          )}
        </div>

        <div className={`osrs-map-container${drawMode ? ' dev-draw-active' : ''}`}>
          <MapContainer
            center={[-51, 72]}
            zoom={5}
            minZoom={3}
            maxZoom={7}
            crs={L.CRS.Simple}
            maxBounds={mapBounds}
            maxBoundsViscosity={1.0}
            style={{ height: '100%', width: '100%', background: '#0e0e0e' }}
            zoomControl={false}
            attributionControl={false}
          >
            <ZoomControl position="bottomleft" />
            <TileLayer url={tileUrl} minZoom={3} maxZoom={7} noWrap={true} bounds={mapBounds} />
            <MapClickHandler onPinPlace={handlePinPlace} disabled={disabled || drawMode} />
            {isDevMode && (
              <>
                <DevBoxOverlay devBoxes={devBoxes} setDevBoxes={setDevBoxes} drawMode={drawMode} />
                <DrawBoxHandler drawMode={drawMode} onBoxCreated={handleBoxCreated} />
              </>
            )}
            {pinPosition && (
              <Marker position={[pinPosition.lat, pinPosition.lng]} icon={createPinIcon('#e53935')}>
                <Popup closeButton={false} autoClose={false} closeOnClick={false}>
                  <span className="region-popup">{resolvedRegion ? (getRegionById(resolvedRegion)?.name || resolvedRegion) : 'Unknown area'}</span>
                </Popup>
              </Marker>
            )}
            {guessHistory.map((guess, idx) => {
              if (!guess.pinLatLng) return null;
              const pinColor = guess.temperature === TEMPERATURE.CORRECT ? '#4caf50' : '#888888';
              return (
                <Marker key={idx} position={[guess.pinLatLng.lat, guess.pinLatLng.lng]} icon={createHistoryPinIcon(pinColor)}>
                  <Popup closeButton={false}><span className="region-popup">{guess.regionName}</span></Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        <div className={`special-locations-panel ${specialMinimized ? 'minimized' : ''} ${isWidePanel && !specialMinimized ? 'special-locations-panel--wide' : ''}`}>
          <div className="panel-header">
            {!specialMinimized && <h4>Special Locations</h4>}
            <button
              className="minimize-btn"
              onClick={(e) => { e.stopPropagation(); setSpecialMinimized(!specialMinimized); }}
              title={specialMinimized ? "Expand locations" : "Minimize locations"}
            >
              {specialMinimized ? '◀' : '▶'}
            </button>
          </div>
          {!specialMinimized && (
            <div className="panel-content">
              {Object.entries(specialCategories).map(([category, locations]) => {
                if (locations.length === 0) return null;
                const isExpanded = expandedCategory === category;
                const categoryKey = category.toUpperCase();
                return (
                  <div key={category} className="special-category">
                    <button className="category-header" onClick={() => toggleCategory(category)}>
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
                              style={{ backgroundColor: isCorrect ? '#4caf50' : isGuessed ? '#555' : undefined }}
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
          )}
        </div>
      </div>

      {isDevMode && (
        <div className="dev-bounds-panel">
          <div className="dev-bounds-header">
            <span className="dev-badge">DEV MODE</span>
            <span className="dev-hint">
              {drawMode
                ? 'Click and drag on the map to draw a new box. Esc or Cancel to exit.'
                : 'Drag corners to resize. Click centre dot to label or delete a box.'}
            </span>
            <div className="dev-bounds-actions">
              <button
                className={`dev-btn dev-btn-draw${drawMode ? ' dev-btn-draw--active' : ''}`}
                onClick={() => setDrawMode(m => !m)}
              >
                {drawMode ? 'Cancel Draw' : 'Draw Box'}
              </button>
              <button className="dev-btn dev-btn-copy" onClick={handleDevCopy}>
                {devCopied ? 'Copied!' : 'Copy Bounds'}
              </button>
              <button className="dev-btn dev-btn-reset" onClick={handleDevReset}>Reset</button>
            </div>
          </div>
          <pre className="dev-bounds-code">{formatBoundsCode(devBoxes)}</pre>
        </div>
      )}

      {pinPosition && !disabled && (
        <div className="pin-confirm-bar">
          <div className="pin-confirm-info">
            <span className="pin-region-label">{resolvedRegion ? getRegionById(resolvedRegion)?.name || resolvedRegion : 'Unknown area'}</span>
            {resolvedRegion && guessHistory.some(g => g.regionId === resolvedRegion) && (
              <span className="already-guessed-warning">Already guessed!</span>
            )}
          </div>
          <div className="pin-confirm-buttons">
            <button className="confirm-guess-btn" onClick={handleConfirmGuess} disabled={!resolvedRegion || guessHistory.some(g => g.regionId === resolvedRegion)}>Confirm Guess</button>
            <button className="clear-pin-btn" onClick={handleClearPin}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default OSRSMap;
