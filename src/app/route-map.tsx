/**
 * EcoPoint - Mapa da Rota (Motorista) — Maringá/PR
 * Mapa real com Leaflet. Status atualiza imediatamente na lista e no mapa.
 */
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import db, { Residence, ResidenceStatus } from '@/data/db';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Modal,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type FilterStatus = 'all' | 'Pendente' | 'Descarte Consciente' | 'Não participou';

const STATUS_CONFIG: Record<ResidenceStatus, { color: string; icon: string; label: string }> = {
  'Pendente':            { color: '#F5A623', icon: 'time-outline',             label: 'Pendente'     },
  'Descarte Consciente': { color: '#4A7C59', icon: 'checkmark-circle',         label: 'Coletado'     },
  'Não participou':      { color: '#D9534F', icon: 'close-circle',             label: 'Não coletado' },
  'Validado':            { color: '#5B9BD5', icon: 'shield-checkmark-outline', label: 'Validado'     },
};

// ─── HTML do mapa Leaflet ─────────────────────────────────────────────────────

function buildRouteMapHtml(residences: Residence[]): string {
  const withCoords = residences.filter(r => r.latitude && r.longitude);

  const markersJs = withCoords.map((r) => {
    const cfg = STATUS_CONFIG[r.status];
    const popup =
      `<b>${r.residentName}</b><br>` +
      `${r.address}<br>` +
      `<span style="color:${cfg.color};font-weight:bold">${cfg.label}</span>`;
    return `
      L.circleMarker([${r.latitude}, ${r.longitude}], {
        radius: 12,
        fillColor: '${cfg.color}',
        color: '#fff',
        weight: 2.5,
        fillOpacity: 0.93
      }).addTo(map).bindPopup('${popup.replace(/'/g, "\\'")}');
    `;
  }).join('\n');

  const lineCoords = withCoords.map(r => `[${r.latitude},${r.longitude}]`).join(',');
  const polylineJs = withCoords.length > 1
    ? `L.polyline([${lineCoords}], {color:'#4A7C59', weight:3, opacity:0.65, dashArray:'7,5'}).addTo(map);`
    : '';

  const legendJs = `
    var legend = L.control({position:'bottomright'});
    legend.onAdd = function() {
      var d = L.DomUtil.create('div');
      d.style.cssText = 'background:#fff;padding:8px 10px;border-radius:8px;font-size:12px;line-height:2;box-shadow:0 1px 5px rgba(0,0,0,.25)';
      d.innerHTML = '<b style="font-size:13px">Legenda</b><br>'
        + '<span style="color:#4A7C59;font-size:16px">●</span> Coletado<br>'
        + '<span style="color:#D9534F;font-size:16px">●</span> Não coletado<br>'
        + '<span style="color:#F5A623;font-size:16px">●</span> Pendente';
      return d;
    };
    legend.addTo(map);
  `;

  const centerLat = withCoords.length
    ? withCoords.reduce((s, r) => s + r.latitude!, 0) / withCoords.length
    : -23.4205;
  const centerLng = withCoords.length
    ? withCoords.reduce((s, r) => s + r.longitude!, 0) / withCoords.length
    : -51.9333;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>*{margin:0;padding:0;box-sizing:border-box}html,body,#map{width:100%;height:100%}</style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map').setView([${centerLat},${centerLng}],15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
      attribution:'© OpenStreetMap contributors',maxZoom:19
    }).addTo(map);
    ${polylineJs}
    ${markersJs}
    ${legendJs}
  </script>
</body>
</html>`;
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function RouteMapScreen() {
  const router = useRouter();
  const { routeName: routeNameParam } = useLocalSearchParams();
  const routeName = Array.isArray(routeNameParam) ? routeNameParam[0] : routeNameParam;

  // Estado local com cópia das residências — garante re-render imediato
  const [residences, setResidences] = useState<Residence[]>([]);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [mapHtml, setMapHtml] = useState('');
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmLabel: string;
    confirmColor: string;
  }>({ visible: false, title: '', message: '', onConfirm: () => {}, confirmLabel: 'OK', confirmColor: '#4A7C59' });

  // Carrega e sincroniza residências do db
  const loadResidences = useCallback(() => {
    if (!routeName) return;
    // Cria cópia rasa para forçar novo array (React detecta mudança)
    const fresh = db.getResidencesByRoute(routeName).map(r => ({ ...r }));
    setResidences(fresh);
    setMapHtml(buildRouteMapHtml(fresh));
  }, [routeName]);

  useEffect(() => {
    loadResidences();
  }, [loadResidences]);

  // Atualiza status e recarrega imediatamente
  const handleStatusUpdate = useCallback(
    (residence: Residence, newStatus: 'Descarte Consciente' | 'Não participou') => {
      db.updateResidenceStatus(residence.address, newStatus);
      loadResidences(); // re-lê do db e atualiza estado + mapa
    },
    [loadResidences]
  );

  // Estatísticas derivadas do estado local
  const stats = {
    total:        residences.length,
    collected:    residences.filter(r => r.status === 'Descarte Consciente').length,
    notCollected: residences.filter(r => r.status === 'Não participou').length,
    pending:      residences.filter(r => r.status === 'Pendente').length,
  };

  const filtered = filterStatus === 'all'
    ? residences
    : residences.filter(r => r.status === filterStatus);

  const progress = stats.total > 0
    ? Math.round(((stats.collected + stats.notCollected) / stats.total) * 100)
    : 0;

  const handleFinishRoute = () => {
    if (stats.pending > 0) {
      setConfirmModal({
        visible: true,
        title: 'Rota incompleta',
        message: `Ainda há ${stats.pending} residência(s) pendente(s). Deseja finalizar mesmo assim?`,
        confirmLabel: 'Finalizar',
        confirmColor: '#D9534F',
        onConfirm: () => {
          setConfirmModal(m => ({ ...m, visible: false }));
          db.markRouteCompleted(routeName ?? '');
          router.push('/route-selection');
        },
      });
    } else {
      setConfirmModal({
        visible: true,
        title: 'Rota finalizada!',
        message: `Coleta concluída: ${stats.collected} de ${stats.total} residências participaram.`,
        confirmLabel: 'OK',
        confirmColor: '#4A7C59',
        onConfirm: () => {
          setConfirmModal(m => ({ ...m, visible: false }));
          db.markRouteCompleted(routeName ?? '');
          router.push('/route-selection');
        },
      });
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={24} color="#4A7C59" />
          </Pressable>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{routeName ?? 'Rota'}</Text>
            <Text style={styles.headerSubtitle}>Maringá / PR</Text>
          </View>
          <Pressable onPress={() => router.push('/login')} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={18} color="#4A7C59" />
          </Pressable>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

          {/* Mapa Leaflet — re-renderiza quando mapHtml muda */}
          {Platform.OS === 'web' ? (
            <View style={styles.mapContainer}>
              {mapHtml ? (
                <iframe
                  key={mapHtml.length + stats.collected} // força reload do iframe ao mudar
                  srcDoc={mapHtml}
                  style={{ width: '100%', height: '100%', border: 'none' } as any}
                  title={`Mapa da ${routeName}`}
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : null}
            </View>
          ) : (
            <View style={[styles.mapContainer, styles.mapPlaceholder]}>
              <Ionicons name="map" size={40} color="#4A7C59" />
              <Text style={styles.mapPlaceholderText}>Mapa disponível na versão web</Text>
            </View>
          )}

          {/* Progresso */}
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Progresso da coleta</Text>
              <Text style={styles.progressPercent}>{progress}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: '#4A7C59' }]} />
                <Text style={styles.statText}>{stats.collected} coletadas</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: '#D9534F' }]} />
                <Text style={styles.statText}>{stats.notCollected} não coletadas</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statDot, { backgroundColor: '#F5A623' }]} />
                <Text style={styles.statText}>{stats.pending} pendentes</Text>
              </View>
            </View>
          </View>

          {/* Filtros */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}>
            {(['all', 'Pendente', 'Descarte Consciente', 'Não participou'] as FilterStatus[]).map((s) => {
              const labels: Record<FilterStatus, string> = {
                all: 'Todas',
                Pendente: 'Pendentes',
                'Descarte Consciente': 'Coletadas',
                'Não participou': 'Não coletadas',
              };
              const count = s === 'all' ? stats.total : residences.filter(r => r.status === s).length;
              return (
                <Pressable
                  key={s}
                  style={[styles.filterChip, filterStatus === s && styles.filterChipActive]}
                  onPress={() => setFilterStatus(s)}>
                  <Text style={[styles.filterChipText, filterStatus === s && styles.filterChipTextActive]}>
                    {labels[s]} ({count})
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Lista */}
          <ThemedText style={styles.sectionTitle}>
            {filtered.length} residência{filtered.length !== 1 ? 's' : ''}
          </ThemedText>

          {filtered.map((residence) => {
            const cfg = STATUS_CONFIG[residence.status];
            const isCollected   = residence.status === 'Descarte Consciente';
            const isNotCollected = residence.status === 'Não participou';

            return (
              <View key={residence.id} style={[styles.card, { borderLeftWidth: 4, borderLeftColor: cfg.color }]}>

                {/* Cabeçalho do card */}
                <View style={styles.cardHeader}>
                  <Ionicons name={cfg.icon as any} size={22} color={cfg.color} />
                  <View style={styles.cardInfo}>
                    <Text style={styles.addressText}>{residence.address}</Text>
                    <Text style={styles.residentName}>{residence.residentName}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.color + '22' }]}>
                    <Text style={[styles.statusBadgeText, { color: cfg.color }]}>
                      {cfg.label}
                    </Text>
                  </View>
                </View>

                {/* Botões de ação */}
                <View style={styles.actionsRow}>
                  <Pressable
                    onPress={() => handleStatusUpdate(residence, 'Descarte Consciente')}
                    style={({ pressed }) => [
                      styles.actionButton,
                      isCollected ? styles.btnCollectedActive : styles.btnCollected,
                      { opacity: pressed ? 0.85 : 1 },
                    ]}
                    accessibilityLabel="Marcar como coletado"
                    accessibilityRole="button">
                    <Ionicons
                      name={isCollected ? 'checkmark-circle' : 'checkmark-outline'}
                      size={18}
                      color="white"
                    />
                    <Text style={styles.actionButtonText}>
                      {isCollected ? '✓ Coletado' : 'Coletado'}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleStatusUpdate(residence, 'Não participou')}
                    style={({ pressed }) => [
                      styles.actionButton,
                      isNotCollected ? styles.btnMissedActive : styles.btnMissed,
                      { opacity: pressed ? 0.85 : 1 },
                    ]}
                    accessibilityLabel="Marcar como não coletado"
                    accessibilityRole="button">
                    <Ionicons
                      name={isNotCollected ? 'close-circle' : 'close-outline'}
                      size={18}
                      color="white"
                    />
                    <Text style={styles.actionButtonText}>
                      {isNotCollected ? '✗ Não coletado' : 'Não coletado'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}

          {filtered.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-circle-outline" size={44} color="#4A7C59" />
              <Text style={styles.emptyStateText}>
                {filterStatus === 'all'
                  ? 'Nenhuma residência nesta rota.'
                  : 'Nenhuma residência com este status.'}
              </Text>
            </View>
          )}

          {/* Finalizar */}
          <Pressable
            onPress={handleFinishRoute}
            style={({ pressed }) => [styles.finishButton, { opacity: pressed ? 0.8 : 1 }]}
            accessibilityLabel="Finalizar rota"
            accessibilityRole="button">
            <Ionicons name="flag-outline" size={20} color="white" />
            <Text style={styles.finishButtonText}>Finalizar Rota</Text>
          </Pressable>

          <View style={{ height: Spacing.four }} />
        </ScrollView>
      </SafeAreaView>

      {/* Modal de confirmação — substitui Alert.alert (não funciona na web) */}
      <Modal
        visible={confirmModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModal(m => ({ ...m, visible: false }))}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Ionicons
              name={stats.pending > 0 ? 'warning-outline' : 'checkmark-circle-outline'}
              size={40}
              color={confirmModal.confirmColor}
            />
            <Text style={styles.modalTitle}>{confirmModal.title}</Text>
            <Text style={styles.modalMessage}>{confirmModal.message}</Text>
            <View style={styles.modalButtons}>
              {stats.pending > 0 && (
                <Pressable
                  onPress={() => setConfirmModal(m => ({ ...m, visible: false }))}
                  style={styles.modalCancelBtn}>
                  <Text style={styles.modalCancelText}>Continuar coletando</Text>
                </Pressable>
              )}
              <Pressable
                onPress={confirmModal.onConfirm}
                style={[styles.modalConfirmBtn, { backgroundColor: confirmModal.confirmColor }]}>
                <Text style={styles.modalConfirmText}>{confirmModal.confirmLabel}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9F3' },
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
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#1A3A2A' },
  headerSubtitle: { fontSize: 12, color: '#5A7A65' },
  logoutButton: {
    padding: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#4A7C59',
  },
  scrollView: { paddingHorizontal: Spacing.four },
  mapContainer: {
    height: 280,
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
  progressCard: {
    backgroundColor: 'white',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressTitle: { fontSize: 14, fontWeight: '600', color: '#333' },
  progressPercent: { fontSize: 16, fontWeight: 'bold', color: '#4A7C59' },
  progressBar: { height: 8, backgroundColor: '#E8F5E9', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#4A7C59', borderRadius: 4 },
  statsRow: { flexDirection: 'row', gap: Spacing.three, flexWrap: 'wrap' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statDot: { width: 8, height: 8, borderRadius: 4 },
  statText: { fontSize: 12, color: '#555' },
  filtersContent: { gap: Spacing.two, paddingBottom: Spacing.three, paddingRight: Spacing.two },
  filterChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: { backgroundColor: '#4A7C59', borderColor: '#4A7C59' },
  filterChipText: { fontSize: 13, color: '#555' },
  filterChipTextActive: { color: 'white', fontWeight: 'bold' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#1A3A2A', marginBottom: Spacing.two },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    marginBottom: Spacing.two,
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  cardInfo: { flex: 1 },
  addressText: { fontWeight: 'bold', fontSize: 13, color: '#1A3A2A' },
  residentName: { fontSize: 12, color: 'gray', marginTop: 2 },
  statusBadge: { paddingHorizontal: Spacing.two, paddingVertical: 3, borderRadius: 12 },
  statusBadgeText: { fontSize: 11, fontWeight: 'bold' },
  actionsRow: { flexDirection: 'row', gap: Spacing.two },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Spacing.two,
    gap: 6,
  },
  actionButtonText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  // Botão Coletado — inativo (verde claro) / ativo (verde escuro + borda)
  btnCollected:     { backgroundColor: '#5CB85C' },
  btnCollectedActive: {
    backgroundColor: '#2D6A3F',
    borderWidth: 2,
    borderColor: '#1A4A2A',
  },
  // Botão Não coletado — inativo (vermelho claro) / ativo (vermelho escuro + borda)
  btnMissed:       { backgroundColor: '#E57373' },
  btnMissedActive: {
    backgroundColor: '#B71C1C',
    borderWidth: 2,
    borderColor: '#7F0000',
  },
  emptyState: { alignItems: 'center', padding: Spacing.six, gap: Spacing.two },
  emptyStateText: { color: 'gray', textAlign: 'center', fontSize: 14 },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D5A3D',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
    marginTop: Spacing.two,
    marginBottom: Spacing.two,
  },
  finishButtonText: { color: 'white', fontSize: 17, fontWeight: 'bold' },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: Spacing.four,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A3A2A',
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#555',
    fontWeight: '600',
    fontSize: 14,
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
