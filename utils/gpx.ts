// utils/gpx.ts
// Parser et générateur GPX (GPS Exchange Format)

export interface TrackPoint {
  lat: number;
  lng: number;
  ele?: number;
  time?: string; // ISO string
}

export interface GPXData {
  name?: string;
  points: TrackPoint[];
  distanceKm: number;
  durationSec: number;
  elevationGainM: number;
}

/**
 * Calcule la distance entre deux points GPS (formule de Haversine)
 */
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Parse un fichier GPX (XML) et extrait les points de trace
 */
export function parseGPX(gpxContent: string): GPXData | null {
  try {
    // Utiliser DOMParser sur web, ou regex sur mobile (React Native n'a pas de DOMParser natif)
    const points: TrackPoint[] = [];

    // Extraire le nom
    const nameMatch = gpxContent.match(/<name>([^<]*)<\/name>/i);
    const name = nameMatch?.[1]?.trim();

    // Parser les <trkpt> avec regex (compatible React Native sans DOMParser)
    const trkptRegex = /<trkpt[\s\S]*?<\/trkpt>|<trkpt[^>]*\/>/gi;
    const trkptMatches = gpxContent.match(trkptRegex) || [];

    for (const trkpt of trkptMatches) {
      const latMatch = trkpt.match(/lat=["']?([-\d.]+)["']?/i);
      const lngMatch = trkpt.match(/lon=["']?([-\d.]+)["']?/i);

      if (!latMatch || !lngMatch) continue;

      const lat = parseFloat(latMatch[1]);
      const lng = parseFloat(lngMatch[1]);

      if (Number.isNaN(lat) || Number.isNaN(lng)) continue;

      const eleMatch = trkpt.match(/<ele>([^<]*)<\/ele>/i);
      const timeMatch = trkpt.match(/<time>([^<]*)<\/time>/i);

      points.push({
        lat,
        lng,
        ele: eleMatch ? parseFloat(eleMatch[1]) : undefined,
        time: timeMatch?.[1]?.trim(),
      });
    }

    if (points.length === 0) return null;

    // Calculer statistiques
    let distanceKm = 0;
    let elevationGainM = 0;

    for (let i = 1; i < points.length; i++) {
      distanceKm += haversine(
        points[i - 1].lat, points[i - 1].lng,
        points[i].lat, points[i].lng
      );

      if (points[i].ele != null && points[i - 1].ele != null) {
        const diff = points[i]!.ele! - points[i - 1]!.ele!;
        if (diff > 0) elevationGainM += diff;
      }
    }

    let durationSec = 0;
    if (points.length >= 2 && points[0]?.time && points[points.length - 1]?.time) {
      const start = new Date(points[0]!.time!).getTime();
      const end = new Date(points[points.length - 1]!.time!).getTime();
      durationSec = Math.max(0, (end - start) / 1000);
    }

    return { name, points, distanceKm, durationSec, elevationGainM };
  } catch {
    return null;
  }
}

/**
 * Génère un fichier GPX à partir d'une liste de points
 */
export function generateGPX(points: TrackPoint[], name: string = 'Trace Fitrack'): {
  content: string;
  distanceKm: number;
  durationSec: number;
  elevationGainM: number;
} {
  let distanceKm = 0;
  let elevationGainM = 0;

  for (let i = 1; i < points.length; i++) {
    distanceKm += haversine(
      points[i - 1].lat, points[i - 1].lng,
      points[i].lat, points[i].lng
    );
    if (points[i].ele != null && points[i - 1].ele != null) {
      const diff = points[i]!.ele! - points[i - 1]!.ele!;
      if (diff > 0) elevationGainM += diff;
    }
  }

  let durationSec = 0;
  if (points.length >= 2 && points[0]?.time && points[points.length - 1]?.time) {
    const start = new Date(points[0]!.time!).getTime();
    const end = new Date(points[points.length - 1]!.time!).getTime();
    durationSec = Math.max(0, (end - start) / 1000);
  }

  const trkpts = points
    .map((p) => {
      let xml = `      <trkpt lat="${p.lat}" lon="${p.lng}">`;
      if (p.ele != null) xml += `\n        <ele>${p.ele}</ele>`;
      if (p.time) xml += `\n        <time>${p.time}</time>`;
      xml += `\n      </trkpt>`;
      return xml;
    })
    .join('\n');

  const content = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Fitrack" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${name}</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
  <trk>
    <name>${name}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;

  return { content, distanceKm, durationSec, elevationGainM };
}

/**
 * Formate une durée en secondes vers HH:MM:SS
 */
export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Formate une distance en km
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(2)} km`;
}
