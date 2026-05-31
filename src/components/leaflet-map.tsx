/**
 * EcoPoint - Componente de Mapa com Leaflet + OpenStreetMap
 *
 * Renderiza um mapa real via iframe com HTML/Leaflet.
 * Funciona na web sem dependências extras.
 * Suporta marcadores coloridos e linhas de rota.
 */
import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  color: string;   // hex, ex: '#4A7C59'
  title: string;
  popup: string;
}

export interface MapPolyline {
  points: Array<[number, number]>;
  color: string;
  weight?: number;
}

interface LeafletMapProps {
  markers: MapMarker[];
  polylines?: MapPolyline[];
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
  height?: number;
}

function buildHtml(
  markers: MapMarker[],
  polylines: MapPolyline[],
  centerLat: number,
  centerLng: number,
  zoom: number
): string {
  const markersJs = markers
    .map((m) => {
      const escaped = m.popup.replace(/'/g, "\\'").replace(/\n/g, '\\n');
      const title = m.title.replace(/'/g, "\\'");
      return `
        L.circleMarker([${m.lat}, ${m.lng}], {
          radius: 10,
          fillColor: '${m.color}',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9
        }).addTo(map).bindPopup('<b>${title}</b><br>${escaped}');
      `;
    })
    .join('\n');

  const polylinesJs = polylines
    .map((p) => {
      const coords = p.points.map(([lat, lng]) => `[${lat},${lng}]`).join(',');
      return `L.polyline([${coords}], {color:'${p.color}', weight:${p.weight ?? 4}, opacity:0.8}).addTo(map);`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map').setView([${centerLat}, ${centerLng}], ${zoom});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(map);
    ${markersJs}
    ${polylinesJs}
  </script>
</body>
</html>`;
}

export default function LeafletMap({
  markers,
  polylines = [],
  centerLat = -23.5505,
  centerLng = -46.6333,
  zoom = 14,
  height = 280,
}: LeafletMapProps) {
  const html = useMemo(
    () => buildHtml(markers, polylines, centerLat, centerLng, zoom),
    [markers, polylines, centerLat, centerLng, zoom]
  );

  if (Platform.OS !== 'web') {
    // Em mobile nativo, mostraria um placeholder (precisaria de react-native-webview)
    return <View style={[styles.placeholder, { height }]} />;
  }

  return (
    <View style={[styles.container, { height }]}>
      <iframe
        srcDoc={html}
        style={{ width: '100%', height: '100%', border: 'none' } as any}
        title="Mapa EcoPoint"
        sandbox="allow-scripts allow-same-origin"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D0E8D0',
  },
  placeholder: {
    width: '100%',
    backgroundColor: '#C8E6C9',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
