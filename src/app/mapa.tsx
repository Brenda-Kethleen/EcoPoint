/**
 * EcoPoint - Mapa de Pontos de Coleta (Maringá/PR)
 * Mapa real com OpenStreetMap + Leaflet via iframe.
 */
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import db, { CollectionPoint } from '@/data/db';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const WASTE_TYPE_COLORS: Record<string, string> = {
  'plástico': '#1976D2',
  'papel':    '#388E3C',
  'metal':    '#757575',
  'vidro':    '#00ACC1',
  'orgânico': '#8D6E63',
  'eletrônico': '#E65100',
};

const WASTE_TYPE_ICONS: Record<string, string> = {
  'plástico':   'cube-outline',
  'papel':      'document-outline',
  'metal':      'hardware-chip-outline',
  'vidro':      'wine-outline',
  'orgânico':   'leaf-outline',
  'eletrônico': 'phone-portrait-outline',
};

// ─── Mapa Leaflet ─────────────────────────────────────────────────────────────

function buildMapHtml(points: CollectionPoint[], selectedId: string | null): string {
  const markersJs = points.map((p) => {
    const isSelected = p.id === selectedId;
    const color = isSelected ? '#D9534F' : '#4A7C59';
    const radius = isSelected ? 14 : 10;
    const types = p.types.join(', ');
    const popup = `<b>${p.name}</b><br>${p.address}<br><i>${types}</i><br><small>${p.schedule}</small>`;
    return `
      L.circleMarker([${p.latitude}, ${p.longitude}], {
        radius: ${radius},
        fillColor: '${color}',
        color: '#fff',
        weight: 2,
        fillOpacity: 0.92
      }).addTo(map).bindPopup('${popup.replace(/'/g, "\\'")}')${isSelected ? '.openPopup()' : ''};
    `;
  }).join('\n');

  // Centro de Maringá
  const centerLat = -23.4205;
  const centerLng = -51.9333;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>* {margin:0;padding:0;box-sizing:border-box} html,body,#map{width:100%;height:100%}</style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map').setView([${centerLat}, ${centerLng}], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors', maxZoom: 19
    }).addTo(map);
    ${markersJs}
  </script>
</body>
</html>`;
}

// ─── Tela ─────────────────────────────────────────────────────────────────────

export default function MapaScreen() {
  const router = useRouter();
  const [selectedPoint, setSelectedPoint] = useState<CollectionPoint | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  const allTypes = useMemo(
    () => Array.from(new Set(db.collectionPoints.flatMap(p => p.types))).sort(),
    []
  );

  const filteredPoints = useMemo(
    () => filterType
      ? db.collectionPoints.filter(p => p.types.includes(filterType))
      : db.collectionPoints,
    [filterType]
  );

  const mapHtml = useMemo(
    () => buildMapHtml(filteredPoints, selectedPoint?.id ?? null),
    [filteredPoints, selectedPoint]
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={24} color="#4A7C59" />
          </Pressable>
          <View style={styles.headerTitle}>
            <Ionicons name="map-outline" size={22} color="#4A7C59" />
            <Text style={styles.headerTitleText}>Pontos de Coleta — Maringá/PR</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

          {/* Mapa Leaflet */}
          {Platform.OS === 'web' ? (
            <View style={styles.mapContainer}>
              <iframe
                srcDoc={mapHtml}
                style={{ width: '100%', height: '100%', border: 'none' } as any}
                title="Mapa de Ecopontos — Maringá/PR"
                sandbox="allow-scripts allow-same-origin"
              />
            </View>
          ) : (
            <View style={[styles.mapContainer, styles.mapPlaceholder]}>
              <Ionicons name="map" size={40} color="#4A7C59" />
              <Text style={styles.mapPlaceholderText}>Mapa disponível na versão web</Text>
            </View>
          )}

          {/* Filtros */}
          <Text style={styles.sectionTitle}>Filtrar por tipo de resíduo</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}>
            <Pressable
              style={[styles.filterChip, !filterType && styles.filterChipActive]}
              onPress={() => setFilterType(null)}>
              <Text style={[styles.filterChipText, !filterType && styles.filterChipTextActive]}>
                Todos
              </Text>
            </Pressable>
            {allTypes.map((type) => (
              <Pressable
                key={type}
                style={[
                  styles.filterChip,
                  filterType === type && { backgroundColor: WASTE_TYPE_COLORS[type] ?? '#4A7C59', borderColor: 'transparent' },
                ]}
                onPress={() => setFilterType(filterType === type ? null : type)}>
                <Ionicons
                  name={(WASTE_TYPE_ICONS[type] ?? 'trash-outline') as any}
                  size={13}
                  color={filterType === type ? 'white' : '#555'}
                />
                <Text style={[
                  styles.filterChipText,
                  filterType === type && styles.filterChipTextActive,
                ]}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Lista de ecopontos */}
          <Text style={styles.sectionTitle}>
            {filteredPoints.length} ecoponto{filteredPoints.length !== 1 ? 's' : ''} encontrado{filteredPoints.length !== 1 ? 's' : ''}
          </Text>

          {filteredPoints.map((point) => {
            const isSelected = selectedPoint?.id === point.id;
            return (
              <Pressable
                key={point.id}
                style={[styles.pointCard, isSelected && styles.pointCardSelected]}
                onPress={() => setSelectedPoint(isSelected ? null : point)}
                accessibilityLabel={`Ecoponto: ${point.name}`}>

                <View style={styles.pointCardHeader}>
                  <View style={[styles.pointIcon, isSelected && { backgroundColor: '#D9534F20' }]}>
                    <Ionicons name="location" size={22} color={isSelected ? '#D9534F' : '#4A7C59'} />
                  </View>
                  <View style={styles.pointCardInfo}>
                    <Text style={styles.pointCardName}>{point.name}</Text>
                    <Text style={styles.pointCardAddress}>{point.address}</Text>
                  </View>
                  <Ionicons
                    name={isSelected ? 'chevron-up' : 'chevron-down'}
                    size={18} color="gray" />
                </View>

                {isSelected && (
                  <View style={styles.pointCardDetails}>
                    <View style={styles.scheduleRow}>
                      <Ionicons name="time-outline" size={15} color="#4A7C59" />
                      <Text style={styles.scheduleText}>{point.schedule}</Text>
                    </View>
                    <Text style={styles.typesLabel}>Aceita:</Text>
                    <View style={styles.typesRow}>
                      {point.types.map((type) => (
                        <View
                          key={type}
                          style={[styles.typeTag, { backgroundColor: WASTE_TYPE_COLORS[type] ?? '#4A7C59' }]}>
                          <Ionicons
                            name={(WASTE_TYPE_ICONS[type] ?? 'trash-outline') as any}
                            size={11} color="white" />
                          <Text style={styles.typeTagText}>{type}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </Pressable>
            );
          })}

          {filteredPoints.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={36} color="gray" />
              <Text style={styles.emptyStateText}>Nenhum ecoponto aceita este tipo de resíduo.</Text>
            </View>
          )}

          <View style={{ height: Spacing.four }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0FFF4' },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
  },
  backButton: { padding: Spacing.one },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, flex: 1 },
  headerTitleText: { fontSize: 16, fontWeight: 'bold', color: '#1A3A2A', flexShrink: 1 },
  scrollView: { paddingHorizontal: Spacing.four },
  mapContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: Spacing.three,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  mapPlaceholder: {
    backgroundColor: '#C8E6C9',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  mapPlaceholderText: { color: '#2D5A3D', fontWeight: '600' },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A3A2A',
    marginBottom: Spacing.two,
    marginTop: Spacing.one,
  },
  filtersContent: { gap: Spacing.two, paddingBottom: Spacing.three, paddingRight: Spacing.two },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: { backgroundColor: '#4A7C59', borderColor: '#4A7C59' },
  filterChipText: { fontSize: 12, color: '#555' },
  filterChipTextActive: { color: 'white', fontWeight: 'bold' },
  pointCard: {
    backgroundColor: 'white',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    marginBottom: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  pointCardSelected: { borderWidth: 2, borderColor: '#4A7C59' },
  pointCardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  pointIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointCardInfo: { flex: 1 },
  pointCardName: { fontSize: 14, fontWeight: 'bold', color: '#1A3A2A' },
  pointCardAddress: { fontSize: 12, color: 'gray', marginTop: 2 },
  pointCardDetails: {
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: Spacing.two,
  },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scheduleText: { fontSize: 13, color: '#4A7C59' },
  typesLabel: { fontSize: 12, fontWeight: '600', color: '#555' },
  typesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: 12,
  },
  typeTagText: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', padding: Spacing.six, gap: Spacing.two },
  emptyStateText: { color: 'gray', textAlign: 'center', fontSize: 14 },
});
