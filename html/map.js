// ========== DATA ==========
const TERRAIN_DATA = [
    {name: "forest", slope: 3, rise: 1, rain: 3, color: '#2d5a1e', darkColor: '#1e3d14'},
    {name: "desert", slope: 2, rise: 1, rain: 1, color: '#c8a84a', darkColor: '#9a7a30'},
    {name: "dunes", slope: 3, rise: 1, rain: 2, color: '#d4b86a', darkColor: '#b0904a'},
    {name: "planes", slope: 1, rise: 1, rain: 2, color: '#6a9a3a', darkColor: '#4a7020'},
    {name: "fields", slope: 1, rise: 1, rain: 2, color: '#8ab84a', darkColor: '#6a9030'},
    {name: "sea", slope: 0, rise: 0, rain: 3, color: '#1a4a7a', darkColor: '#0d2a4a'},
    {name: "lake", slope: 0, rise: 0, rain: 2, color: '#2a6a9a', darkColor: '#1a4a7a'},
    {name: "hills", slope: 4, rise: 2, rain: 2, color: '#7a6a4a', darkColor: '#5a4a30'},
    {name: "mountains", slope: 6, rise: 3, rain: 3, color: '#8a8a8a', darkColor: '#6a6a6a'}
];

const TERRAIN_BY_NAME = {};
TERRAIN_DATA.forEach(t => TERRAIN_BY_NAME[t.name] = t);

const LANDMARKS = [
    {name: "fortress", symbol: "🏰"},
    {name: "city", symbol: "🏛️"},
    {name: "town", symbol: "🏘️"},
    {name: "ruin", symbol: "🏚️"},
    {name: "tower", symbol: "🗼"},
    {name: "cave entrance", symbol: "🕳️"},
    {name: "bridge", symbol: "🌉"},
    {name: "mine", symbol: "⛏️"},
    {name: "fort", symbol: "🏯"}
];

// Direction indices: 0=NE, 1=E, 2=SE, 3=SW, 4=W, 5=NW
const DIR_NAMES = ['NE', 'E', 'SE', 'SW', 'W', 'NW'];

// ========== STATE ==========
let cols = 20, rows = 15;
let tiles = [];
let selectedTerrain = 0;
let brushSize = 1;
let mode = 'terrain';
let selectedTile = null;
let waterFlowCalc = false;
let heightsCalc = false;
let currentView = '2d';
let camAngle = 0.5;
let camTilt = 0.6;
let camDist = 800;

// Road pathfinding state
let roadStart = null;
let roadPreview = null; // array of path nodes {tile, dir} or null

const ROAD_OPPOSITE = [3, 4, 5, 0, 1, 2];

// Hex geometry
const HEX_SIZE = 36;

function hexWidth() {
    return Math.sqrt(3) * HEX_SIZE;
}

function hexHeight() {
    return 2 * HEX_SIZE;
}

function hexCenter(col, row) {
    const w = hexWidth();
    const h = hexHeight();
    const x = col * w + (row % 2 === 1 ? w / 2 : 0) + w;
    const y = row * h * 0.75 + HEX_SIZE;
    return {x, y};
}

function hexCorners(cx, cy, size) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
        const a = Math.PI / 180 * (60 * i - 30);
        pts.push({x: cx + size * Math.cos(a), y: cy + size * Math.sin(a)});
    }
    return pts;
}

// Flat-top neighbor offsets: [col_offset, row_offset] for even/odd rows
function getNeighbors(col, row) {
    const evenOffsets = [[1, 0], [-1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1]];
    const oddOffsets = [[1, 0], [-1, 0], [0, -1], [0, 1], [1, -1], [1, 1]];
    const offsets = row % 2 === 0 ? evenOffsets : oddOffsets;
    const result = [];
    for (let d = 0; d < 6; d++) {
        const [dc, dr] = offsets[d];
        const nc = col + dc, nr = row + dr;
        if (nc >= 0 && nc < cols && nr >= 0 && nr < rows) {
            result.push({col: nc, row: nr, dir: d, tile: getTile(nc, nr)});
        } else {
            result.push(null);
        }
    }
    return result;
}

function tileIdx(col, row) {
    return row * cols + col;
}

function getTile(col, row) {
    if (col < 0 || col >= cols || row < 0 || row >= rows) return null;
    return tiles[tileIdx(col, row)];
}

function initTiles() {
    tiles = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            tiles.push({
                col: c, row: r,
                terrain: 'planes',
                landmark: null,
                landmarkName: '',
                landmarkDesc: '',
                placeId: null,
                roads: [false, false, false, false, false, false],
                waterDir: -1,
                waterIn: 0,
                waterTotal: 0,
                height: null,
                flowVisited: false
            });
        }
    }
    waterFlowCalc = false;
    heightsCalc = false;
}

// ========== INIT ==========
function buildTerrainButtons() {
    const grid = document.getElementById('terrain-grid');
    grid.innerHTML = '';
    TERRAIN_DATA.forEach((t, i) => {
        const btn = document.createElement('button');
        btn.className = 'terrain-btn' + (i === 0 ? ' active' : '');
        btn.style.borderLeftColor = t.color;
        btn.style.borderLeftWidth = '3px';
        btn.textContent = t.name;
        btn.onclick = () => selectTerrain(i);
        grid.appendChild(btn);
    });
}

function buildLandmarkButtons() {
    const grid = document.getElementById('landmark-grid');
    grid.innerHTML = '';
    LANDMARKS.forEach((lm, i) => {
        const btn = document.createElement('button');
        btn.className = 'lm-btn';
        btn.textContent = lm.symbol + ' ' + lm.name;
        btn.onclick = () => selectLandmark(i);
        grid.appendChild(btn);
    });
}

function selectTerrain(i) {
    selectedTerrain = i;
    document.querySelectorAll('.terrain-btn').forEach((b, j) => {
        b.classList.toggle('active', i === j);
    });
}

export function setBrush(size) {
    brushSize = size;
    document.getElementById('brush1').classList.toggle('active', size === 1);
    document.getElementById('brush7').classList.toggle('active', size === 7);
}

export function setMode(m) {
    mode = m;
    roadStart = null;
    roadPreview = null;
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('mode-' + m).classList.add('active');
    document.getElementById('terrain-section').style.display = m === 'terrain' ? '' : 'none';
    document.getElementById('landmark-section').style.display = m === 'landmark' ? '' : 'none';
    updateTileInfo();
    draw2D();
}

// ========== PATHFINDING ==========
function dijkstra(start, end) {
    const n = tiles.length;
    const startIdx = tileIdx(start.col, start.row);
    const endIdx   = tileIdx(end.col,   end.row);

    const dist    = new Float32Array(n).fill(Infinity);
    const prev    = new Array(n).fill(null);
    const visited = new Uint8Array(n);
    dist[startIdx] = 0;

    for (let iter = 0; iter < n; iter++) {
        // Find unvisited tile with minimum distance
        let u = -1;
        for (let i = 0; i < n; i++) {
            if (!visited[i] && (u === -1 || dist[i] < dist[u])) u = i;
        }
        if (u === -1 || dist[u] === Infinity) break;
        if (u === endIdx) break;
        visited[u] = 1;

        const cur  = tiles[u];
        const nbrs = getNeighbors(cur.col, cur.row);
        for (let d = 0; d < 6; d++) {
            const nb = nbrs[d];
            if (!nb) continue;
            const ni = tileIdx(nb.col, nb.row);
            if (visited[ni]) continue;
            // Cost = slope of the tile being entered (+1 so sea/flat is never free)
            const cost = TERRAIN_BY_NAME[nb.tile.terrain].slope + 1;
            const nd   = dist[u] + cost;
            if (nd < dist[ni]) {
                dist[ni] = nd;
                prev[ni] = { fromIdx: u, dir: d };
            }
        }
    }

    if (!prev[endIdx] && startIdx !== endIdx) return null;

    // Reconstruct: each node records the direction used to arrive
    const path = [];
    let cur = endIdx;
    while (cur !== startIdx) {
        const p = prev[cur];
        if (!p) return null;
        path.unshift({ tile: tiles[cur], dir: p.dir });
        cur = p.fromIdx;
    }
    path.unshift({ tile: start, dir: -1 });
    return path;
}

function applyRoadPath(path) {
    for (let i = 0; i < path.length - 1; i++) {
        const a   = path[i].tile;
        const dir = path[i + 1].dir;
        const b   = path[i + 1].tile;
        a.roads[dir] = true;
        b.roads[ROAD_OPPOSITE[dir]] = true;
    }
}

let selectedLandmark = 0;

function selectLandmark(i) {
    selectedLandmark = i;
    document.querySelectorAll('.lm-btn').forEach((b, j) => b.classList.toggle('active', i === j));
}

export function clearLandmark() {
    if (!selectedTile) return;
    // Unlink from DM place
    if (selectedTile.placeId) {
        const places = loadDMPlaces();
        const place = places.find(p => p.id === selectedTile.placeId);
        if (place) { delete place.mapTile; saveDMPlaces(places); }
        selectedTile.placeId = null;
    }
    selectedTile.landmark = null;
    selectedTile.landmarkName = '';
    selectedTile.landmarkDesc = '';
    updateTileInfo();
    draw2D();
}

export function saveLandmarkDetails() {
    if (!selectedTile || !selectedTile.landmark) return;
    selectedTile.landmarkName = document.getElementById('lm-name').value;
    selectedTile.landmarkDesc = document.getElementById('lm-desc').value;
}

function loadDMPlaces() {
    try {
        return JSON.parse(localStorage.getItem('moros-dm-places') || '[]');
    } catch (_) { return []; }
}

function saveDMPlaces(places) {
    localStorage.setItem('moros-dm-places', JSON.stringify(places));
}

export function linkPlace(placeId) {
    if (!selectedTile) return;
    const prev = selectedTile.placeId;

    // Clear mapTile from previously linked place
    if (prev) {
        const places = loadDMPlaces();
        const old = places.find(p => p.id === prev);
        if (old) {
            delete old.mapTile;
            saveDMPlaces(places);
        }
    }

    selectedTile.placeId = placeId || null;

    // Set mapTile on the newly linked place
    if (placeId) {
        const places = loadDMPlaces();
        const place = places.find(p => p.id === placeId);
        if (place) {
            place.mapTile = { col: selectedTile.col, row: selectedTile.row };
            saveDMPlaces(places);
            // Sync name if the landmark has no custom name yet
            if (!selectedTile.landmarkName) {
                selectedTile.landmarkName = place.name;
                document.getElementById('lm-name').value = place.name;
            }
        }
    }

    const link = document.getElementById('lm-place-link');
    link.style.display = placeId ? '' : 'none';
}

// ========== WATER FLOW ==========
export function calcWaterFlow() {
    // Reset
    tiles.forEach(t => {
        t.waterDir = -1;
        t.waterIn = 0;
        t.waterTotal = 0;
        t.flowVisited = false;
    });

    // ─── Phase 1: Assign flow directions via BFS outward from sea ───
    // Sea tiles are pre-settled. Each wave: frontier tiles pick a random
    // direction toward an already-settled neighbor (sea or prior wave).
    // Slope rule: can't flow toward a settled neighbor with higher slope
    // than the current tile, unless the current tile is a lake.

    const settled = new Set(
        tiles.filter(t => t.terrain === 'sea').map(t => tileIdx(t.col, t.row))
    );

    // First frontier: unsettled tiles adjacent to sea
    let frontier = new Set();
    for (const idx of settled) {
        getNeighbors(tiles[idx].col, tiles[idx].row).forEach(n => {
            if (n && !settled.has(tileIdx(n.col, n.row))) {
                frontier.add(tileIdx(n.col, n.row));
            }
        });
    }

    while (frontier.size > 0) {
        const nextFrontier = new Set();

        for (const idx of frontier) {
            const t = tiles[idx];
            const tInfo = TERRAIN_BY_NAME[t.terrain];
            const isLake = t.terrain === 'lake';
            const nbrs = getNeighbors(t.col, t.row);

            // Settled neighbors that satisfy the slope constraint
            let candidates = [];
            for (let d = 0; d < 6; d++) {
                const n = nbrs[d];
                if (!n || !settled.has(tileIdx(n.col, n.row))) continue;
                const nInfo = TERRAIN_BY_NAME[n.tile.terrain];
                // Block uphill flow unless this tile is a lake
                if (!isLake && nInfo.slope > tInfo.slope) continue;
                candidates.push(d);
            }

            // Fallback: relax slope constraint when no valid candidates exist
            if (candidates.length === 0) {
                for (let d = 0; d < 6; d++) {
                    const n = nbrs[d];
                    if (n && settled.has(tileIdx(n.col, n.row))) candidates.push(d);
                }
            }

            if (candidates.length > 0) {
                t.waterDir = candidates[Math.floor(Math.random() * candidates.length)];
            }

            // Collect unsettled neighbors for the next wave
            for (let d = 0; d < 6; d++) {
                const n = nbrs[d];
                if (!n) continue;
                const ni = tileIdx(n.col, n.row);
                if (!settled.has(ni) && !frontier.has(ni)) nextFrontier.add(ni);
            }
        }

        // Settle the current wave
        for (const idx of frontier) settled.add(idx);

        // Advance: only tiles not yet settled
        frontier = new Set([...nextFrontier].filter(idx => !settled.has(idx)));
    }

    // ─── Phase 2: Accumulate water totals (sources → sea) ───
    // Build per-tile inflow counts and reverse lookup
    const inflowCount = new Map(tiles.map(t => [tileIdx(t.col, t.row), 0]));
    const incomers   = new Map(tiles.map(t => [tileIdx(t.col, t.row), []]));

    tiles.forEach(t => {
        if (t.waterDir < 0) return;
        const nd = getNeighbors(t.col, t.row)[t.waterDir];
        if (!nd) return;
        const ni = tileIdx(nd.col, nd.row);
        inflowCount.set(ni, inflowCount.get(ni) + 1);
        incomers.get(ni).push(t);
    });

    // Start from tiles with no inflow (pure sources)
    const pending = new Map(inflowCount);
    let wave = tiles.filter(t => t.terrain !== 'sea' && pending.get(tileIdx(t.col, t.row)) === 0);

    while (wave.length > 0) {
        const next = [];
        for (const t of wave) {
            const tInfo = TERRAIN_BY_NAME[t.terrain];
            const inc   = incomers.get(tileIdx(t.col, t.row));
            t.waterTotal = tInfo.rain + inc.reduce((s, u) => s + u.waterTotal, 0);

            if (t.waterDir < 0) continue;
            const nd = getNeighbors(t.col, t.row)[t.waterDir];
            if (!nd || nd.tile.terrain === 'sea') continue;
            const ni  = tileIdx(nd.col, nd.row);
            const rem = pending.get(ni) - 1;
            pending.set(ni, rem);
            if (rem === 0) next.push(nd.tile);
        }
        wave = next;
    }

    waterFlowCalc = true;
    setStatus('Water flow calculated.');
    draw2D();
}

// ========== HEIGHT CALC ==========
export function calcHeights() {
    if (!waterFlowCalc) {
        alert('Calculate water flow first!');
        return;
    }

    // BFS from sea tiles
    tiles.forEach(t => t.height = null);
    tiles.filter(t => t.terrain === 'sea').forEach(t => t.height = 0);

    let queue = tiles.filter(t => t.terrain === 'sea');
    const visited = new Set(queue.map(t => t.col + ',' + t.row));

    while (queue.length > 0) {
        const next = [];
        for (const t of queue) {
            const nbrs = getNeighbors(t.col, t.row);
            for (const n of nbrs) {
                if (!n) continue;
                const key = n.col + ',' + n.row;
                if (visited.has(key)) continue;
                visited.add(key);
                const nt = n.tile;
                const tInfo = TERRAIN_BY_NAME[nt.terrain];
                // Water flow limits max slope
                let maxSlope = tInfo.slope;
                if (nt.waterTotal >= 30) maxSlope = Math.min(maxSlope, 1);
                else if (nt.waterTotal >= 20) maxSlope = Math.min(maxSlope, 2);
                else if (nt.waterTotal >= 10) maxSlope = Math.min(maxSlope, 3);
                nt.height = t.height + maxSlope;
                next.push(nt);
            }
        }
        queue = next;
    }

    // Unvisited tiles get reasonable default
    tiles.filter(t => t.height === null).forEach(t => {
        const tInfo = TERRAIN_BY_NAME[t.terrain];
        t.height = tInfo.rise * 5;
    });

    heightsCalc = true;
    setStatus('Heights calculated.');
}

// ========== CANVAS 2D ==========
const canvas2d = document.getElementById('map-canvas');
const ctx2d = canvas2d.getContext('2d');

function canvasSize() {
    const w = hexWidth();
    const h = hexHeight();
    return {
        width: Math.ceil(cols * w + w * 1.5),
        height: Math.ceil(rows * h * 0.75 + h)
    };
}

function draw2D() {
    const {width, height} = canvasSize();
    canvas2d.width = width;
    canvas2d.height = height;

    // Background
    ctx2d.fillStyle = '#07090c';
    ctx2d.fillRect(0, 0, width, height);

    tiles.forEach(t => drawTile2D(t));
    tiles.forEach(t => drawTileOverlay(t));
}

function terrainColor(t, dark = false) {
    const info = TERRAIN_BY_NAME[t.terrain];
    if (!dark) return info.color;
    // Check cliff coast: hills adjacent to sea
    if (t.terrain === 'hills') {
        const nbrs = getNeighbors(t.col, t.row);
        if (nbrs.some(n => n && n.tile.terrain === 'sea')) {
            return '#4a3a2a';
        }
    }
    return info.darkColor;
}

const SMOOTH_ORDER = ['lake', 'planes', 'fields', 'desert', 'forest', 'dunes', 'hills', 'mountains'];

function drawTile2D(t) {
    const {x, y} = hexCenter(t.col, t.row);
    const corners = hexCorners(x, y, HEX_SIZE - 1);

    ctx2d.beginPath();
    ctx2d.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < 6; i++) ctx2d.lineTo(corners[i].x, corners[i].y);
    ctx2d.closePath();

    const info = TERRAIN_BY_NAME[t.terrain];
    ctx2d.fillStyle = info.color;
    ctx2d.fill();

    // Border
    ctx2d.strokeStyle = terrainBorderColor(t);
    ctx2d.lineWidth = 0.5;
    ctx2d.stroke();
}

function terrainBorderColor(t) {
    if (t.terrain === 'sea') return '#0d2a4a';
    if (t.terrain === 'lake') return '#1a4a7a';
    return 'rgba(0,0,0,0.3)';
}

function drawTileOverlay(t) {
    const {x, y} = hexCenter(t.col, t.row);

    // Water flow rivers
    if (waterFlowCalc && t.waterTotal >= 10 && t.waterDir >= 0) {
        const nbrs = getNeighbors(t.col, t.row);
        const nd = nbrs[t.waterDir];
        if (nd) {
            const {x: nx, y: ny} = hexCenter(nd.col, nd.row);
            const riverWidth = Math.min(6, 1 + (t.waterTotal - 10) / 10);
            ctx2d.beginPath();
            ctx2d.moveTo(x, y);
            ctx2d.lineTo(nx, ny);
            ctx2d.strokeStyle = 'rgba(80,160,220,0.8)';
            ctx2d.lineWidth = riverWidth;
            ctx2d.lineCap = 'round';
            ctx2d.stroke();
        }
    }

    // Roads
    for (let d = 0; d < 6; d++) {
        if (!t.roads[d]) continue;
        const nbrs = getNeighbors(t.col, t.row);
        const nd = nbrs[d];
        if (!nd) continue;
        const {x: nx, y: ny} = hexCenter(nd.col, nd.row);
        const mx = (x + nx) / 2, my = (y + ny) / 2;
        ctx2d.beginPath();
        ctx2d.moveTo(x, y);
        ctx2d.lineTo(mx, my);
        ctx2d.strokeStyle = '#c8a050';
        ctx2d.lineWidth = 1.5;
        ctx2d.setLineDash([3, 2]);
        ctx2d.stroke();
        ctx2d.setLineDash([]);
    }

    // Landmark
    if (t.landmark) {
        const lm = LANDMARKS.find(l => l.name === t.landmark);
        if (lm) {
            ctx2d.font = '16px serif';
            ctx2d.textAlign = 'center';
            ctx2d.textBaseline = 'middle';
            ctx2d.fillText(lm.symbol, x, y);
        }
    }

    // Height label if calculated
    if (heightsCalc && t.height !== null) {
        ctx2d.fillStyle = 'rgba(255,255,255,0.7)';
        ctx2d.font = '9px monospace';
        ctx2d.textAlign = 'center';
        ctx2d.textBaseline = 'bottom';
        ctx2d.fillText(t.height, x, y + HEX_SIZE * 0.5);
    }

    // Road start highlight
    if (roadStart && roadStart.col === t.col && roadStart.row === t.row) {
        const corners = hexCorners(x, y, HEX_SIZE - 1);
        ctx2d.beginPath();
        ctx2d.moveTo(corners[0].x, corners[0].y);
        for (let i = 1; i < 6; i++) ctx2d.lineTo(corners[i].x, corners[i].y);
        ctx2d.closePath();
        ctx2d.strokeStyle = '#e8a020';
        ctx2d.lineWidth = 3;
        ctx2d.stroke();
    }

    // Road preview path highlight
    if (roadPreview) {
        const inPreview = roadPreview.some(n => n.tile.col === t.col && n.tile.row === t.row);
        if (inPreview) {
            const corners = hexCorners(x, y, HEX_SIZE - 1);
            ctx2d.beginPath();
            ctx2d.moveTo(corners[0].x, corners[0].y);
            for (let i = 1; i < 6; i++) ctx2d.lineTo(corners[i].x, corners[i].y);
            ctx2d.closePath();
            ctx2d.fillStyle = 'rgba(232,160,32,0.25)';
            ctx2d.fill();
        }
    }

    // Selection highlight
    if (selectedTile && selectedTile.col === t.col && selectedTile.row === t.row) {
        const corners = hexCorners(x, y, HEX_SIZE - 1);
        ctx2d.beginPath();
        ctx2d.moveTo(corners[0].x, corners[0].y);
        for (let i = 1; i < 6; i++) ctx2d.lineTo(corners[i].x, corners[i].y);
        ctx2d.closePath();
        ctx2d.strokeStyle = '#ffffff';
        ctx2d.lineWidth = 2;
        ctx2d.stroke();
    }
}

// ========== INTERACTION ==========
function getHexAt(px, py) {
    // Test all tiles for proximity
    let bestT = null, bestDist = Infinity;
    tiles.forEach(t => {
        const {x, y} = hexCenter(t.col, t.row);
        const d = Math.hypot(px - x, py - y);
        if (d < bestDist) {
            bestDist = d;
            bestT = t;
        }
    });
    if (bestDist < HEX_SIZE * 1.1) return bestT;
    return null;
}

canvas2d.addEventListener('click', e => {
    const rect = canvas2d.getBoundingClientRect();
    const px = e.clientX - rect.left, py = e.clientY - rect.top;
    const t = getHexAt(px, py);
    if (!t) return;

    if (mode === 'terrain') {
        applyTerrain(t);
    } else if (mode === 'road') {
        if (!roadStart) {
            // First click: set start
            roadStart = t;
            roadPreview = null;
            selectedTile = t;
            updateTileInfo();
            draw2D();
        } else if (roadStart === t) {
            // Clicking same tile cancels
            roadStart = null;
            roadPreview = null;
            updateTileInfo();
            draw2D();
        } else {
            // Second click: commit path
            const path = roadPreview || dijkstra(roadStart, t);
            if (path) applyRoadPath(path);
            roadStart = null;
            roadPreview = null;
            selectedTile = t;
            updateTileInfo();
            draw2D();
        }
    } else if (mode === 'landmark') {
        t.landmark = LANDMARKS[selectedLandmark].name;
        t.landmarkName = t.landmarkName || LANDMARKS[selectedLandmark].name;
        selectedTile = t;
        updateTileInfo();
        draw2D();
    } else if (mode === 'inspect') {
        selectedTile = t;
        updateTileInfo();
        draw2D();
    }
});

let isDragging = false;
canvas2d.addEventListener('mousedown', e => {
    isDragging = true;
});
canvas2d.addEventListener('mouseup', e => {
    isDragging = false;
});
canvas2d.addEventListener('mousemove', e => {
    const rect = canvas2d.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    if (isDragging && mode === 'terrain') {
        const t = getHexAt(mx, my);
        if (t) applyTerrain(t);
        return;
    }
    if (mode === 'road' && roadStart) {
        const t = getHexAt(mx, my);
        if (t && t !== roadStart) {
            roadPreview = dijkstra(roadStart, t);
        } else {
            roadPreview = null;
        }
        draw2D();
    }
});

function applyTerrain(t) {
    const name = TERRAIN_DATA[selectedTerrain].name;
    t.terrain = name;
    if (brushSize === 7) {
        getNeighbors(t.col, t.row).forEach(n => {
            if (n) n.tile.terrain = name;
        });
    }
    waterFlowCalc = false;
    heightsCalc = false;
    draw2D();
}

function updateTileInfo() {
    const info = document.getElementById('tile-info');
    const details = document.getElementById('tile-details');
    const lmEdit = document.getElementById('landmark-edit-section');

    if (!selectedTile) {
        info.querySelector('.ti-name').textContent = 'No tile selected';
        lmEdit.style.display = 'none';
        if (mode === 'road') {
            details.innerHTML = '<div style="margin-top:6px;font-size:10px;color:var(--text-dim)">Click a tile to set road start</div>';
        } else {
            details.innerHTML = '';
        }
        return;
    }

    const t = selectedTile;
    const tInfo = TERRAIN_BY_NAME[t.terrain];
    info.querySelector('.ti-name').textContent = `[${t.col},${t.row}] ${t.terrain}`;

    let html = `<div class="info-row"><span class="info-key">Rise/Slope</span><span class="info-val">${tInfo.rise}/${tInfo.slope}</span></div>`;
    if (waterFlowCalc) {
        html += `<div class="info-row"><span class="info-key">Water total</span><span class="info-val">${t.waterTotal}</span></div>`;
        html += `<div class="info-row"><span class="info-key">Flow dir</span><span class="info-val">${t.waterDir >= 0 ? DIR_NAMES[t.waterDir] : 'none'}</span></div>`;
    }
    if (heightsCalc && t.height !== null) {
        html += `<div class="info-row"><span class="info-key">Height</span><span class="info-val">${t.height}</span></div>`;
    }
    if (t.landmark) {
        html += `<div class="info-row"><span class="info-key">Landmark</span><span class="info-val">${t.landmarkName || t.landmark}</span></div>`;
    }

    // Road mode status
    if (mode === 'road') {
        if (roadStart) {
            html += `<div style="margin-top:6px;font-size:10px;color:var(--accent)">Start: [${roadStart.col},${roadStart.row}] — click destination</div>`;
        } else {
            html += `<div style="margin-top:6px;font-size:10px;color:var(--text-dim)">Click a tile to set road start</div>`;
        }
    }

    details.innerHTML = html;

    // Landmark edit
    if (t.landmark) {
        lmEdit.style.display = '';
        document.getElementById('lm-name').value = t.landmarkName || '';
        document.getElementById('lm-desc').value = t.landmarkDesc || '';

        // Populate DM places dropdown
        const places = loadDMPlaces();
        const sel = document.getElementById('lm-place');
        sel.innerHTML = '<option value="">— none —</option>' +
            places.map(p => `<option value="${p.id}"${t.placeId === p.id ? ' selected' : ''}>${p.name}${p.type ? ' (' + p.type + ')' : ''}</option>`).join('');
        const link = document.getElementById('lm-place-link');
        link.style.display = t.placeId ? '' : 'none';
    } else {
        lmEdit.style.display = 'none';
    }
}

export function toggleRoad(d) {
    if (!selectedTile) return;
    const t = selectedTile;
    t.roads[d] = !t.roads[d];
    // Mirror on neighbor
    const nbrs = getNeighbors(t.col, t.row);
    if (nbrs[d]) {
        const opposite = [3, 4, 5, 0, 1, 2];
        nbrs[d].tile.roads[opposite[d]] = t.roads[d];
    }
    updateTileInfo();
    draw2D();
}

// ========== 3D VIEW ==========
const canvas3d = document.getElementById('map3d-canvas');
const ctx3d = canvas3d.getContext('2d');

export function switchView(v) {
    currentView = v;
    document.getElementById('view-2d').classList.toggle('active-view', v === '2d');
    document.getElementById('view-3d').classList.toggle('active-view', v === '3d');
    canvas2d.classList.toggle('canvas-hidden', v !== '2d');
    canvas3d.classList.toggle('canvas-hidden', v !== '3d');
    if (v === '3d') draw3D();
}

// Compute vertex positions (corners between hexes)
function getHexVertices() {
    // Build unique vertex positions and their associated tiles
    const vertexMap = new Map(); // key -> {x3d, y3d, height, tiles}

    tiles.forEach(t => {
        const {x, y} = hexCenter(t.col, t.row);
        const corners = hexCorners(x, y, HEX_SIZE);
        for (let i = 0; i < 6; i++) {
            const cx = Math.round(corners[i].x * 10) / 10;
            const cy = Math.round(corners[i].y * 10) / 10;
            const key = `${cx},${cy}`;
            if (!vertexMap.has(key)) vertexMap.set(key, {x: cx, y: cy, tiles: []});
            vertexMap.get(key).tiles.push(t);
        }
    });

    // Compute vertex heights
    vertexMap.forEach(v => {
        if (!heightsCalc) {
            v.height = 0;
            return;
        }
        const validTiles = v.tiles.filter(t => t.height !== null);
        if (validTiles.length === 0) {
            v.height = 0;
            return;
        }
        const avgH = validTiles.reduce((s, t) => s + t.height, 0) / validTiles.length;
        const avgSlope = validTiles.reduce((s, t) => s + TERRAIN_BY_NAME[t.terrain].slope, 0) / validTiles.length;
        v.height = avgH + avgSlope * 0.5;
    });

    return vertexMap;
}

function project3D(x, y, h, wW, wH) {
    // Simple isometric-ish projection
    const scale = 0.7;
    const hScale = 4;
    const cx = wW / 2, cy = wH * 0.4;

    // Center map
    const {width: mW, height: mH} = canvasSize();
    const mx = x - mW / 2, my = y - mH / 2;

    const rx = mx * Math.cos(camAngle) - my * Math.sin(camAngle);
    const ry = mx * Math.sin(camAngle) + my * Math.cos(camAngle);

    const px = cx + rx * scale;
    const py = cy + ry * scale * camTilt - h * hScale;

    return {px, py};
}

function draw3D() {
    const wW = canvas3d.parentElement.clientWidth;
    const wH = canvas3d.parentElement.clientHeight;
    canvas3d.width = wW;
    canvas3d.height = wH;

    ctx3d.fillStyle = '#070a10';
    ctx3d.fillRect(0, 0, wW, wH);

    // Sort tiles back-to-front
    const sortedTiles = [...tiles].sort((a, b) => {
        const ca = hexCenter(a.col, a.row);
        const cb = hexCenter(b.col, b.row);
        const pa = project3D(ca.x, ca.y, 0, wW, wH);
        const pb = project3D(cb.x, cb.y, 0, wW, wH);
        return pa.py - pb.py;
    });

    const vertexMap = getHexVertices();

    // Draw each tile
    sortedTiles.forEach(t => {
        const {x, y} = hexCenter(t.col, t.row);
        const corners = hexCorners(x, y, HEX_SIZE);
        const tInfo = TERRAIN_BY_NAME[t.terrain];
        const tH = heightsCalc && t.height !== null ? t.height : tInfo.rise * 3;

        // Get corner heights
        const projCorners = corners.map(c => {
            const cx = Math.round(c.x * 10) / 10;
            const cy = Math.round(c.y * 10) / 10;
            const key = `${cx},${cy}`;
            const v = vertexMap.get(key);
            const vh = v ? v.height : tH;
            return project3D(c.x, c.y, vh, wW, wH);
        });

        // Draw hex face
        ctx3d.beginPath();
        ctx3d.moveTo(projCorners[0].px, projCorners[0].py);
        for (let i = 1; i < 6; i++) ctx3d.lineTo(projCorners[i].px, projCorners[i].py);
        ctx3d.closePath();

        // Color with slight shading based on average height
        const baseColor = tInfo.color;
        ctx3d.fillStyle = baseColor;
        ctx3d.fill();
        ctx3d.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx3d.lineWidth = 0.5;
        ctx3d.stroke();

        // Draw side faces for elevated tiles (simple trick: south edges)
        if (tH > 1) {
            for (let i = 0; i < 6; i++) {
                const j = (i + 1) % 6;
                const p1 = projCorners[i], p2 = projCorners[j];
                // Only draw if this edge faces "toward viewer" (py is large)
                if (p1.py > wH * 0.3 || p2.py > wH * 0.3) {
                    const groundP1 = project3D(corners[i].x, corners[i].y, 0, wW, wH);
                    const groundP2 = project3D(corners[j].x, corners[j].y, 0, wW, wH);
                    if (groundP1.py > p1.py && groundP2.py > p2.py) {
                        ctx3d.beginPath();
                        ctx3d.moveTo(p1.px, p1.py);
                        ctx3d.lineTo(p2.px, p2.py);
                        ctx3d.lineTo(groundP2.px, groundP2.py);
                        ctx3d.lineTo(groundP1.px, groundP1.py);
                        ctx3d.closePath();
                        ctx3d.fillStyle = tInfo.darkColor;
                        ctx3d.fill();
                        ctx3d.strokeStyle = 'rgba(0,0,0,0.3)';
                        ctx3d.lineWidth = 0.5;
                        ctx3d.stroke();
                    }
                }
            }
        }
    });

    // Draw rivers
    if (waterFlowCalc) {
        sortedTiles.forEach(t => {
            if (t.waterTotal < 10 || t.waterDir < 0) return;
            const {x, y} = hexCenter(t.col, t.row);
            const tH = heightsCalc && t.height !== null ? t.height : 0;
            const nbrs = getNeighbors(t.col, t.row);
            const nd = nbrs[t.waterDir];
            if (!nd) return;
            const {x: nx, y: ny} = hexCenter(nd.col, nd.row);
            const nH = heightsCalc && nd.tile.height !== null ? nd.tile.height : 0;
            const p1 = project3D(x, y, tH + 0.5, wW, wH);
            const p2 = project3D(nx, ny, nH + 0.5, wW, wH);
            const w = Math.min(6, 1 + (t.waterTotal - 10) / 10);
            ctx3d.beginPath();
            ctx3d.moveTo(p1.px, p1.py);
            ctx3d.lineTo(p2.px, p2.py);
            ctx3d.strokeStyle = 'rgba(80,170,240,0.85)';
            ctx3d.lineWidth = w;
            ctx3d.lineCap = 'round';
            ctx3d.stroke();
        });
    }

    // Draw roads
    sortedTiles.forEach(t => {
        for (let d = 0; d < 6; d++) {
            if (!t.roads[d]) continue;
            const {x, y} = hexCenter(t.col, t.row);
            const tH = heightsCalc && t.height !== null ? t.height : 0;
            const nbrs = getNeighbors(t.col, t.row);
            if (!nbrs[d]) continue;
            const nd = nbrs[d];
            const {x: nx, y: ny} = hexCenter(nd.col, nd.row);
            const nH = heightsCalc && nd.tile.height !== null ? nd.tile.height : 0;
            const mx = (x + nx) / 2, my = (y + ny) / 2;
            const mH = (tH + nH) / 2 + 0.5;
            const p1 = project3D(x, y, tH + 0.5, wW, wH);
            const pm = project3D(mx, my, mH, wW, wH);
            ctx3d.beginPath();
            ctx3d.moveTo(p1.px, p1.py);
            ctx3d.lineTo(pm.px, pm.py);
            ctx3d.strokeStyle = '#c8a050';
            ctx3d.lineWidth = 2;
            ctx3d.setLineDash([3, 2]);
            ctx3d.stroke();
            ctx3d.setLineDash([]);
        }
    });

    // Draw landmarks
    sortedTiles.forEach(t => {
        if (!t.landmark) return;
        const {x, y} = hexCenter(t.col, t.row);
        const tH = heightsCalc && t.height !== null ? t.height : 0;
        const p = project3D(x, y, tH + 2, wW, wH);
        const lm = LANDMARKS.find(l => l.name === t.landmark);
        if (!lm) return;

        // Draw stylistic landmark
        drawLandmark3D(ctx3d, p.px, p.py, lm.name, t.landmarkName || lm.name);
    });

    // 3D rotation controls hint
    ctx3d.fillStyle = 'rgba(255,255,255,0.3)';
    ctx3d.font = '11px Crimson Pro, serif';
    ctx3d.textAlign = 'left';
    ctx3d.fillText('Drag to rotate | Scroll to zoom', 10, wH - 10);
}

function drawLandmark3D(ctx, px, py, type, label) {
    ctx.save();
    ctx.translate(px, py);

    const s = 14;
    ctx.strokeStyle = '#fff';
    ctx.fillStyle = '#c8a050';

    switch (type) {
        case 'fortress':
        case 'fort':
            // Castle outline
            ctx.fillStyle = '#8a7a6a';
            ctx.fillRect(-s / 2, -s, s, s);
            ctx.fillRect(-s / 2 - 4, -s - 5, 5, 5);
            ctx.fillRect(s / 2 - 1, -s - 5, 5, 5);
            ctx.strokeStyle = '#5a4a3a';
            ctx.lineWidth = 1;
            ctx.strokeRect(-s / 2, -s, s, s);
            break;
        case 'city':
            // Multiple buildings
            ctx.fillStyle = '#9a8a7a';
            ctx.fillRect(-s, -s, 6, s);
            ctx.fillRect(-3, -s * 1.3, 6, s * 1.3);
            ctx.fillRect(s - 6, -s * 0.8, 6, s * 0.8);
            break;
        case 'town':
            // House shape
            ctx.fillStyle = '#c8a07a';
            ctx.beginPath();
            ctx.moveTo(0, -s);
            ctx.lineTo(-s * 0.6, -s * 0.4);
            ctx.lineTo(s * 0.6, -s * 0.4);
            ctx.closePath();
            ctx.fill();
            ctx.fillRect(-s * 0.4, -s * 0.4, s * 0.8, s * 0.4);
            break;
        case 'tower':
            // Tall cylinder
            ctx.fillStyle = '#7a8a9a';
            ctx.fillRect(-4, -s * 1.5, 8, s * 1.5);
            ctx.beginPath();
            ctx.moveTo(-6, -s * 1.5);
            ctx.lineTo(0, -s * 2);
            ctx.lineTo(6, -s * 1.5);
            ctx.closePath();
            ctx.fillStyle = '#c84a4a';
            ctx.fill();
            break;
        case 'ruin':
            // Broken walls
            ctx.fillStyle = '#7a7a6a';
            ctx.fillRect(-s / 2, -s * 0.7, 4, s * 0.7);
            ctx.fillRect(s / 2 - 4, -s * 0.4, 4, s * 0.4);
            ctx.fillRect(-s / 4, -s * 0.3, 8, s * 0.3);
            break;
        case 'cave entrance':
            // Arch
            ctx.fillStyle = '#1a1a1a';
            ctx.beginPath();
            ctx.arc(0, 0, s / 2, Math.PI, 0);
            ctx.fill();
            ctx.fillRect(-s / 2, 0, s, 5);
            break;
        case 'bridge':
            // Arch bridge
            ctx.strokeStyle = '#c8a07a';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 4, s * 0.7, Math.PI, 0);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-s, 4);
            ctx.lineTo(s, 4);
            ctx.stroke();
            break;
        case 'mine':
            // X marks
            ctx.strokeStyle = '#c8a050';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-s / 2, -s / 2);
            ctx.lineTo(s / 2, s / 2);
            ctx.moveTo(s / 2, -s / 2);
            ctx.lineTo(-s / 2, s / 2);
            ctx.stroke();
            ctx.fillStyle = '#5a4a30';
            ctx.fillRect(-4, -s * 0.8, 8, s * 0.8);
            break;
        default:
            ctx.fillStyle = '#c8a050';
            ctx.beginPath();
            ctx.arc(0, -s / 2, s / 2, 0, Math.PI * 2);
            ctx.fill();
    }

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px Crimson Pro, serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 3;
    ctx.fillText(label, 0, 8);
    ctx.shadowBlur = 0;

    ctx.restore();
}

// 3D Camera controls
let drag3d = {active: false, lx: 0, ly: 0};
canvas3d.addEventListener('mousedown', e => {
    drag3d.active = true;
    drag3d.lx = e.clientX;
    drag3d.ly = e.clientY;
});
canvas3d.addEventListener('mouseup', () => {
    drag3d.active = false;
});
canvas3d.addEventListener('mousemove', e => {
    if (!drag3d.active) return;
    const dx = e.clientX - drag3d.lx, dy = e.clientY - drag3d.ly;
    camAngle += dx * 0.005;
    camTilt = Math.max(0.2, Math.min(1, camTilt + dy * 0.003));
    drag3d.lx = e.clientX;
    drag3d.ly = e.clientY;
    draw3D();
});
canvas3d.addEventListener('wheel', e => {
    camDist = Math.max(200, Math.min(2000, camDist + e.deltaY));
    draw3D();
});

// ========== SAVE/LOAD ==========
function showSaveModal() {
    document.getElementById('modal-title').textContent = 'Save Map';
    document.getElementById('modal-content').innerHTML = `
    <label>Map Name</label>
    <input type="text" id="save-name" placeholder="My Realm...">
    <label>Description</label>
    <textarea id="save-desc" rows="3" placeholder="A land of..."></textarea>
    <button class="btn primary" style="margin-top:12px" onclick="saveMap()">Save</button>
    <button class="btn" onclick="closeModal()">Cancel</button>
  `;
    document.getElementById('modal-overlay').classList.add('show');
}

export function saveMap() {
    const name = document.getElementById('save-name').value.trim();
    if (!name) {
        alert('Please enter a map name.');
        return;
    }
    const desc = document.getElementById('save-desc').value.trim();
    const key = 'hexmap_' + name.toLowerCase().replace(/\s+/g, '_');

    const mapData = {
        name, desc, cols, rows,
        tiles: tiles.map(t => ({
            col: t.col, row: t.row, terrain: t.terrain,
            landmark: t.landmark, landmarkName: t.landmarkName, landmarkDesc: t.landmarkDesc,
            placeId: t.placeId || null,
            roads: t.roads
        })),
        saved: new Date().toISOString()
    };

    try {
        localStorage.setItem(key, JSON.stringify(mapData));
        // Save index
        const idx = JSON.parse(localStorage.getItem('hexmap_index') || '[]');
        if (!idx.includes(key)) idx.push(key);
        localStorage.setItem('hexmap_index', JSON.stringify(idx));
        setStatus('Map saved: ' + name);
        closeModal();
    } catch (e) {
        alert('Error saving: ' + e.message);
    }
}

export function showLoadModal() {
    const idx = JSON.parse(localStorage.getItem('hexmap_index') || '[]');
    let html = '';
    if (idx.length === 0) {
        html = '<p style="color:var(--text-dim);font-size:13px">No saved maps found.</p>';
    } else {
        idx.forEach(key => {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                if (!data) return;
                html += `<div class="saved-map-item" onclick="loadMap('${key}')">
          <div class="sm-name">${data.name}</div>
          <div class="sm-desc">${data.desc || ''} <em style="color:var(--text-dim)">(${data.cols}x${data.rows})</em></div>
          <button class="btn danger" style="margin-top:6px;width:auto;padding:2px 8px;font-size:10px" onclick="event.stopPropagation();deleteMap('${key}')">Delete</button>
        </div>`;
            } catch (e) {
            }
        });
    }
    document.getElementById('modal-title').textContent = 'Load Map';
    document.getElementById('modal-content').innerHTML = html + '<button class="btn" style="margin-top:8px" onclick="closeModal()">Cancel</button>';
    document.getElementById('modal-overlay').classList.add('show');
}

export function loadMap(key) {
    try {
        const data = JSON.parse(localStorage.getItem(key));
        if (!data) return;
        cols = data.cols;
        rows = data.rows;
        document.getElementById('map-w').value = cols;
        document.getElementById('map-h').value = rows;
        initTiles();
        data.tiles.forEach(td => {
            const t = getTile(td.col, td.row);
            if (!t) return;
            t.terrain = td.terrain;
            t.landmark = td.landmark || null;
            t.landmarkName = td.landmarkName || '';
            t.landmarkDesc = td.landmarkDesc || '';
            t.placeId = td.placeId || null;
            t.roads = td.roads || [false, false, false, false, false, false];
        });
        closeModal();
        draw2D();
        setStatus('Loaded: ' + data.name);
    } catch (e) {
        alert('Error loading: ' + e.message);
    }
}

function deleteMap(key) {
    if (!confirm('Delete this map?')) return;
    localStorage.removeItem(key);
    const idx = JSON.parse(localStorage.getItem('hexmap_index') || '[]');
    const newIdx = idx.filter(k => k !== key);
    localStorage.setItem('hexmap_index', JSON.stringify(newIdx));
    showLoadModal();
}

export function newMap() {
    if (!confirm('Create a new map? Unsaved changes will be lost.')) return;
    cols = parseInt(document.getElementById('map-w').value) || 20;
    rows = parseInt(document.getElementById('map-h').value) || 15;
    initTiles();
    selectedTile = null;
    updateTileInfo();
    draw2D();
}

export function resizeMap() {
    const newCols = parseInt(document.getElementById('map-w').value) || cols;
    const newRows = parseInt(document.getElementById('map-h').value) || rows;
    if (newCols === cols && newRows === rows) return;
    // Preserve existing tiles
    const oldTiles = tiles;
    const oldCols = cols, oldRows = rows;
    cols = newCols;
    rows = newRows;
    initTiles();
    oldTiles.forEach(ot => {
        if (ot.col < cols && ot.row < rows) {
            const t = getTile(ot.col, ot.row);
            if (t) Object.assign(t, ot);
        }
    });
    selectedTile = null;
    updateTileInfo();
    draw2D();
}

export function closeModal(e) {
    if (e && e.target !== document.getElementById('modal-overlay')) return;
    document.getElementById('modal-overlay').classList.remove('show');
}

function setStatus(msg) {
    document.getElementById('status').textContent = msg;
}

// ========== LEGEND ==========
function buildLegend() {
    const legend = document.getElementById('legend');
    legend.innerHTML = TERRAIN_DATA.map(t =>
        `<div class="leg-item"><div class="leg-swatch" style="background:${t.color}"></div><span style="color:var(--text-dim);font-size:10px">${t.name}</span></div>`
    ).join('');
}

// ========== INIT ==========
buildTerrainButtons();
buildLandmarkButtons();
buildLegend();
initTiles();

// Seed a nice default map
(function seedDefault() {
    // Sea border
    tiles.forEach(t => {
        if (t.col === 0 || t.col === cols - 1 || t.row === 0 || t.row === rows - 1) {
            t.terrain = 'sea';
        }
    });
    // Some random terrain
    const terrains = ['planes', 'fields', 'hills', 'forest', 'desert', 'mountains', 'lake'];
    for (let i = 0; i < 30; i++) {
        const c = 2 + Math.floor(Math.random() * (cols - 4));
        const r = 2 + Math.floor(Math.random() * (rows - 4));
        const terrain = terrains[Math.floor(Math.random() * terrains.length)];
        const t = getTile(c, r);
        if (t) {
            t.terrain = terrain;
            getNeighbors(c, r).forEach(n => {
                if (n && Math.random() > 0.4) n.tile.terrain = terrain;
            });
        }
    }
})();

draw2D();
setStatus('Map ready — click tiles to edit.');

window.newMap = newMap;
window.resizeMap = resizeMap;
window.setMode = setMode;
window.setBrush = setBrush;
window.clearLandmark = clearLandmark;
window.calcWaterFlow = calcWaterFlow;
window.showLoadModal = showLoadModal;
window.closeModal = closeModal;
window.showSaveModal = showSaveModal;
window.saveMap = saveMap;
window.loadMap = loadMap;
window.calcHeights = calcHeights;
window.switchView = switchView;
window.linkPlace = linkPlace;