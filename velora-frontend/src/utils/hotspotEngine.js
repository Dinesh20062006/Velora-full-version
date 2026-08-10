/**
 * hotspotEngine.js
 * ---------------------------------------------------------------------------
 * Fully client-side, mock "safety hotspot" generator.
 *
 * This is intentionally NOT connected to any backend or real-world crime
 * data. It deterministically generates a set of red/yellow/green risk
 * hotspots around a given lat/lng "region", and derives a safety score for
 * any point from those hotspots.
 *
 * Determinism is the key design goal: the same region always produces the
 * same hotspots and the same score in the same session-less way, so the
 * map/score doesn't flicker or randomize every re-render, every route
 * search, or every page reload for the same location. Moving to a
 * meaningfully different location produces a different (but still
 * consistent) set of hotspots.
 * ---------------------------------------------------------------------------
 */

// ---- Seeded PRNG -----------------------------------------------------------

/** Mulberry32 - small, fast, deterministic PRNG from a 32-bit seed. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a style string hash -> 32-bit unsigned int, used as PRNG seed. */
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ---- Region identity ---------------------------------------------------

// ~0.01 deg ~= 1.1km at the equator. Any two coordinates that round to the
// same cell are treated as "the same region" and get the same hotspot set.
const GRID_SIZE_DEG = 0.01;

export function getRegionKey(lat, lng, gridSize = GRID_SIZE_DEG) {
  const cellLat = Math.round(lat / gridSize);
  const cellLng = Math.round(lng / gridSize);
  return `${cellLat}:${cellLng}`;
}

// ---- Zone classification ----------------------------------------------

// ---- Zone classification ----------------------------------------------

export const ZONE_BANDS = [
  { level: "red", max: 44, label: "High Risk Zone (0-44)", color: "#FF5252", fill: "#FF525233", recommendation: "High risk detected. Share live tracking with emergency contacts." },
  { level: "yellow", max: 74, label: "Moderate Risk Zone (45-74)", color: "#FFC107", fill: "#FFC10733", recommendation: "Exercise heightened awareness. Stay on well-lit main roads." },
  { level: "green", max: 100, label: "Safe Zone (75-100)", color: "#00E676", fill: "#00E67633", recommendation: "Location conditions are optimal for travel." },
];

export function classifyScore(score) {
  if (score >= 75) {
    return {
      level: "green",
      label: "Safe Zone (75-100)",
      color: "#00E676",
      fill: "#00E67633",
      recommendation: "Location conditions are optimal for travel."
    };
  } else if (score >= 45) {
    return {
      level: "yellow",
      label: "Moderate Risk Zone (45-74)",
      color: "#FFC107",
      fill: "#FFC10733",
      recommendation: "Exercise heightened awareness. Stay on well-lit main roads."
    };
  } else {
    return {
      level: "red",
      label: "High Risk Zone (0-44)",
      color: "#FF5252",
      fill: "#FF525233",
      recommendation: "High risk detected. Share live tracking with emergency contacts."
    };
  }
}

/**
 * Deterministically generate `count` hotspots scattered within `spreadKm`
 * of (centerLat, centerLng).
 */
export function generateHotspots(centerLat, centerLng, options = {}) {
  const { count = 10, spreadKm = 3 } = options;
  if (centerLat == null || centerLng == null || Number.isNaN(centerLat) || Number.isNaN(centerLng)) {
    return [];
  }
  const regionKey = getRegionKey(centerLat, centerLng);
  const rand = mulberry32(hashSeed(regionKey));
  const latKmFactor = 111.32;
  const lngKmFactor = 111.32 * Math.cos((centerLat * Math.PI) / 180) || 111.32;
  const hotspots = [];
  for (let i = 0; i < count; i += 1) {
    const angle = rand() * Math.PI * 2;
    const distanceKm = (0.15 + rand() * 0.85) * spreadKm;
    const dLat = (distanceKm * Math.sin(angle)) / latKmFactor;
    const dLng = (distanceKm * Math.cos(angle)) / lngKmFactor;
    const score = Math.round(rand() * 100);
    const zone = classifyScore(score);
    hotspots.push({
      id: `${regionKey}-${i}`,
      lat: centerLat + dLat,
      lng: centerLng + dLng,
      score,
      radiusMeters: Math.round(180 + rand() * 320),
      level: zone.level,
      label: zone.label,
      color: zone.color,
      fill: zone.fill,
    });
  }
  return hotspots;
}

export function mergeHotspotFields(...fields) {
  const seen = new Map();
  fields.flat().forEach((h) => {
    if (h && !seen.has(h.id)) seen.set(h.id, h);
  });
  return Array.from(seen.values());
}

export function getRegionSafety(lat, lng, options = {}) {
  const hotspots = generateHotspots(lat, lng, options);
  const current = scoreForLocation(lat, lng, hotspots);
  return { hotspots, current, regionKey: lat != null ? getRegionKey(lat, lng) : null };
}

/** Great-circle distance in km between two lat/lng points. */
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Derive a safety score for an exact point based on proximity to active DB & ML zones.
 */
export function scoreForLocation(lat, lng, hotspots = []) {
  return scoreForRoute({ lat, lng }, null, hotspots);
}

/**
 * Computes dynamic safety score across a route polyline path:
 * - If route does NOT cross any risk zone: Score stays in SAFE RANGE (90 - 100, Green 🟢).
 * - If route crosses a Yellow (Moderate Risk) zone circle: Score drops into MODERATE RANGE (70 - 89, Yellow 🟡).
 * - If route crosses a Red (High Risk / Unsafe) zone circle: Score drops into HIGH RISK RANGE (0 - 69, Red 🔴).
 */
export function scoreForRoute(origin, destination, hotspots = [], routePath = []) {
  if (!origin) return { score: 95, ...classifyScore(95) };

  let score = 95.0; // Default clean safe score (90-100 range)
  let crossedRed = false;
  let crossedYellow = false;
  let redCrossCount = 0;
  let yellowCrossCount = 0;

  // Build points array along polyline: use routePath if provided, or origin & destination
  const pointsToCheck = Array.isArray(routePath) && routePath.length > 0
    ? routePath
    : [origin, destination].filter(Boolean);

  if (Array.isArray(hotspots) && hotspots.length > 0 && pointsToCheck.length > 0) {
    hotspots.forEach((z) => {
      const zLat = parseFloat(z.lat || z.latitude || 0);
      const zLng = parseFloat(z.lng || z.longitude || 0);
      const radiusKm = parseFloat(z.radiusMeters || 400) / 1000.0;
      if (!zLat || !zLng) return;

      const cat = (z.level || z.zone || "").toLowerCase();
      const isRed = cat.includes("unsafe") || cat.includes("red") || cat.includes("high");
      const isYellow = cat.includes("moderate") || cat.includes("yellow") || cat.includes("medium");

      if (!isRed && !isYellow) return;

      // Check if any point along the polyline enters inside the zone circle radius
      for (let i = 0; i < pointsToCheck.length; i++) {
        const pt = pointsToCheck[i];
        const pLat = typeof pt.lat === "function" ? pt.lat() : pt.lat;
        const pLng = typeof pt.lng === "function" ? pt.lng() : pt.lng;

        const distKm = haversineKm(pLat, pLng, zLat, zLng);
        if (distKm <= radiusKm) {
          if (isRed) {
            crossedRed = true;
            redCrossCount++;
          } else if (isYellow) {
            crossedYellow = true;
            yellowCrossCount++;
          }
          break; // Polyline intersects this zone circle
        }
      }
    });
  }

  // Dynamic score computation based on actual zone crossing:
  if (crossedRed) {
    // Route crosses Red High Risk Zone -> Score drops to Red Range (0 - 44, e.g. 35)
    score = Math.max(10, 38 - (redCrossCount - 1) * 8);
  } else if (crossedYellow) {
    // Route crosses Yellow Moderate Risk Zone -> Score drops to Yellow Range (45 - 74, e.g. 62)
    score = Math.max(45, 68 - (yellowCrossCount - 1) * 5);
  } else {
    // Route does NOT cross any risk zone -> Score stays in Safe Green Range (75 - 100, e.g. 92)
    score = 92;
  }

  // Deduct 5 points if travelling late at night (10 PM - 5 AM)
  const hour = new Date().getHours();
  const isNight = hour >= 22 || hour < 5;
  if (isNight) {
    score = Math.max(15, score - 5);
  }

  const finalScore = Math.max(10, Math.min(100, Math.round(score)));
  const zone = classifyScore(finalScore);

  return {
    score: finalScore,
    ...zone,
    isNight,
    crossedRed,
    crossedYellow,
    redCrossCount,
    yellowCrossCount
  };
}

/**
 * Predicts ML Safety zones (Green, Yellow, Red circles) around a location using
 * multi-feature inputs (incident density, safe zone density, time of day, lighting).
 */
export function generatePredictiveMLZones(centerLat, centerLng, mlFeatures = []) {
  if (!centerLat || !centerLng) return [];

  const hour = new Date().getHours();
  const isNight = hour >= 22 || hour < 5;

  return mlFeatures.map((feat, idx) => {
    const nightPenalty = isNight ? 15 : 0;
    const incidentPenalty = (feat.incidentsCount || 0) * 12;
    const safeZoneBonus = (feat.safeZonesCount || 0) * 8;
    const lightingBonus = (feat.lightingScore || 50) * 0.3;

    let score = Math.round(85 - incidentPenalty + safeZoneBonus + lightingBonus - nightPenalty);
    score = Math.max(10, Math.min(99, score));

    const zone = classifyScore(score);

    return {
      id: `ml_zone_${idx}`,
      lat: feat.lat || centerLat + (Math.random() - 0.5) * 0.02,
      lng: feat.lng || centerLng + (Math.random() - 0.5) * 0.02,
      score,
      radiusMeters: feat.radiusMeters || 300,
      level: zone.level,
      label: zone.label,
      color: zone.color,
      fill: zone.fill,
    };
  });
}

/**
 * Normalizes admin / ML service marked zones into standardized map hotspots
 * with exact Red (#FF5252), Yellow (#FFC107), and Green (#00E676) styling.
 */
export function formatMLMarkedZonesForMap(markedZones = []) {
  if (!Array.isArray(markedZones)) return [];
  return markedZones.map((z, idx) => {
    const lat = parseFloat(z.latitude || z.lat || 0);
    const lng = parseFloat(z.longitude || z.lng || 0);
    const category = (z.zone || z.level || "safe").toLowerCase();
    
    let color = z.color || "#00E676";
    let score = z.score || z.safetyScore || 90;
    let label = z.label || z.name || "Safe Zone";
    let level = z.level || "SAFE";

    if (category.includes("unsafe") || category.includes("red") || category.includes("high")) {
      color = "#FF5252";
      score = z.score || 28;
      level = "HIGH_RISK";
      label = z.label || "High Risk Zone";
    } else if (category.includes("moderate") || category.includes("yellow") || category.includes("medium")) {
      color = "#FFC107";
      score = z.score || 62;
      level = "MODERATE_RISK";
      label = z.label || "Moderate Risk Zone";
    }

    return {
      id: z.id || `ml_marked_${idx}_${Date.now()}`,
      lat,
      lng,
      score,
      radiusMeters: z.radiusMeters || 400,
      level,
      label,
      color,
      fill: z.fill || color + "33",
      name: z.name || label,
      description: z.description || z.recommendation || ""
    };
  });
}

/**
 * Deterministically generates realistic sample safe zones around user location
 * whenever live backend safe zones are empty.
 */
export function generateSampleSafeZones(lat = 13.0827, lng = 80.2707) {
  const effectiveLat = lat ?? 13.0827;
  const effectiveLng = lng ?? 80.2707;

  return [
    {
      id: "sample_sz_1",
      name: "Central Metro Security Hub & Protection Desk",
      address: "Main Terminal Concourse, North Gate",
      latitude: effectiveLat + 0.003,
      longitude: effectiveLng + 0.002,
      distanceKm: 0.4,
      type: "SAFE_PLACE",
      zoneType: "SAFE_PLACE",
      contactNumber: "Emergency Hotline 112 / 100",
      open24Hours: true,
      isGreen: true
    },
    {
      id: "sample_sz_2",
      name: "Sector 4 City Police Station Post",
      address: "24/7 Police Patrol Station, Avenue Road",
      latitude: effectiveLat - 0.004,
      longitude: effectiveLng + 0.005,
      distanceKm: 0.9,
      type: "POLICE_STATION",
      zoneType: "POLICE_STATION",
      contactNumber: "Police Direct: 100",
      open24Hours: true,
      isGreen: true
    },
    {
      id: "sample_sz_3",
      name: "General Hospital Emergency Care Wing",
      address: "Trauma Care Building, Healthcare Cross Rd",
      latitude: effectiveLat + 0.006,
      longitude: effectiveLng - 0.004,
      distanceKm: 1.5,
      type: "HOSPITAL",
      zoneType: "HOSPITAL",
      contactNumber: "Hospital Helpline: 108",
      open24Hours: true,
      isGreen: true
    }
  ];
}




