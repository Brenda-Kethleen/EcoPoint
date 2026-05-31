
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import db, { Route } from '@/data/db';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


interface RouteStats {
  route: Route;
  total: number;
  collected: number;
  notCollected: number;
  pending: number;
  progress: number;        
  completedToday: boolean; 
}

type DayFilter = 'all' | 'pending' | 'done';



export default function RouteSelectionScreen() {
  const router = useRouter();
  const [routeStats, setRouteStats] = useState<RouteStats[]>([]);
  const [filter, setFilter] = useState<DayFilter>('all');


  useFocusEffect(
    useCallback(() => {
      const stats: RouteStats[] = db.routes.map((route) => {
        const residences = db.getResidencesByRoute(route.name);
        const collected    = residences.filter(r => r.status === 'Descarte Consciente').length;
        const notCollected = residences.filter(r => r.status === 'Não participou').length;
        const pending      = residences.filter(r => r.status === 'Pendente').length;
        const total        = residences.length;
        const visited      = collected + notCollected;
        const progress     = total > 0 ? Math.round((visited / total) * 100) : 0;
        const completedToday = db.isRouteCompletedToday(route.name);

        return { route, total, collected, notCollected, pending, progress, completedToday };
      });
      setRouteStats(stats);
    }, [])
  );

  const today = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  });

  const totalRoutes    = routeStats.length;
  const doneRoutes     = routeStats.filter(s => s.completedToday).length;
  const pendingRoutes  = totalRoutes - doneRoutes;

  const filtered = routeStats.filter(s => {
    if (filter === 'pending') return !s.completedToday;
    if (filter === 'done')    return s.completedToday;
    return true;
  });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>

        
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, Motorista 🚛</Text>
            <Text style={styles.headerSubtitle}>Maringá / PR</Text>
          </View>
          <Pressable onPress={() => router.push('/login')} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={20} color="#4A7C59" />
          </Pressable>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        
          <View style={styles.dayCard}>
            <View style={styles.dayCardHeader}>
              <Ionicons name="calendar-outline" size={18} color="white" />
              <Text style={styles.dayCardDate}>{today}</Text>
            </View>
            <View style={styles.dayCardStats}>
              <View style={styles.dayStatItem}>
                <Text style={styles.dayStatValue}>{totalRoutes}</Text>
                <Text style={styles.dayStatLabel}>Rotas do dia</Text>
              </View>
              <View style={styles.dayStatDivider} />
              <View style={styles.dayStatItem}>
                <Text style={[styles.dayStatValue, { color: '#A8E6CF' }]}>{doneRoutes}</Text>
                <Text style={styles.dayStatLabel}>Concluídas</Text>
              </View>
              <View style={styles.dayStatDivider} />
              <View style={styles.dayStatItem}>
                <Text style={[styles.dayStatValue, { color: '#FFD580' }]}>{pendingRoutes}</Text>
                <Text style={styles.dayStatLabel}>Pendentes</Text>
              </View>
            </View>

            
            <View style={styles.dayProgressBar}>
              <View style={[
                styles.dayProgressFill,
                { width: totalRoutes > 0 ? `${Math.round((doneRoutes / totalRoutes) * 100)}%` as any : '0%' },
              ]} />
            </View>
            <Text style={styles.dayProgressLabel}>
              {totalRoutes > 0
                ? `${Math.round((doneRoutes / totalRoutes) * 100)}% das rotas concluídas hoje`
                : 'Nenhuma rota cadastrada'}
            </Text>
          </View>

          
          <View style={styles.filterRow}>
            {([
              { key: 'all',     label: `Todas (${totalRoutes})` },
              { key: 'pending', label: `Pendentes (${pendingRoutes})` },
              { key: 'done',    label: `Concluídas (${doneRoutes})` },
            ] as { key: DayFilter; label: string }[]).map(({ key, label }) => (
              <Pressable
                key={key}
                style={[styles.filterChip, filter === key && styles.filterChipActive]}
                onPress={() => setFilter(key)}>
                <Text style={[styles.filterChipText, filter === key && styles.filterChipTextActive]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          
          {filtered.map((s) => (
            <RouteCard
              key={s.route.id}
              stats={s}
              onStart={() => router.push(`/route-map?routeName=${encodeURIComponent(s.route.name)}`)}
            />
          ))}

          {filtered.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-circle-outline" size={48} color="#4A7C59" />
              <Text style={styles.emptyStateText}>
                {filter === 'done'
                  ? 'Nenhuma rota concluída ainda hoje.'
                  : 'Todas as rotas foram concluídas!'}
              </Text>
            </View>
          )}

          <View style={{ height: Spacing.four }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}


function RouteCard({ stats: s, onStart }: { stats: RouteStats; onStart: () => void }) {
  const isDone = s.completedToday;

  return (
    <View style={[styles.card, isDone && styles.cardDone]}>

      
      <View style={styles.cardTopRow}>
        <View style={[styles.routeIconContainer, isDone && { backgroundColor: '#D4EDDA' }]}>
          <Ionicons
            name={isDone ? 'checkmark-circle' : 'navigate-outline'}
            size={24}
            color={isDone ? '#28A745' : '#4A7C59'}
          />
        </View>
        <View style={styles.cardHeaderInfo}>
          <Text style={styles.routeName}>{s.route.name}</Text>
          <Text style={styles.cardDescription}>{s.route.description}</Text>
        </View>
        <View style={[styles.statusBadge, isDone ? styles.statusBadgeDone : styles.statusBadgePending]}>
          <Ionicons
            name={isDone ? 'checkmark-circle' : 'time-outline'}
            size={12}
            color={isDone ? '#28A745' : '#E65100'}
          />
          <Text style={[styles.statusBadgeText, { color: isDone ? '#28A745' : '#E65100' }]}>
            {isDone ? 'Concluída' : 'Pendente'}
          </Text>
        </View>
      </View>

     
      <View style={styles.neighborhoodsRow}>
        {s.route.neighborhoods.map((n) => (
          <View key={n} style={styles.neighborhoodTag}>
            <Text style={styles.neighborhoodTagText}>{n}</Text>
          </View>
        ))}
      </View>

     
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="home-outline" size={13} color="gray" />
          <Text style={styles.statText}>{s.total} residências</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="checkmark-circle-outline" size={13} color="#4A7C59" />
          <Text style={[styles.statText, { color: '#4A7C59' }]}>{s.collected} coletadas</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="close-circle-outline" size={13} color="#D9534F" />
          <Text style={[styles.statText, { color: '#D9534F' }]}>{s.notCollected} não coletadas</Text>
        </View>
        {s.pending > 0 && (
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={13} color="#F5A623" />
            <Text style={[styles.statText, { color: '#F5A623' }]}>{s.pending} pendentes</Text>
          </View>
        )}
      </View>

     
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>
            {isDone ? 'Rota finalizada hoje' : 'Progresso da rota'}
          </Text>
          <Text style={[styles.progressValue, isDone && { color: '#28A745' }]}>
            {s.progress}%
          </Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[
            styles.progressFill,
            { width: `${s.progress}%` as any },
            isDone && { backgroundColor: '#28A745' },
          ]} />
        </View>
      </View>

     
      <Pressable
        onPress={onStart}
        style={({ pressed }) => [
          styles.button,
          isDone && styles.buttonDone,
          { opacity: pressed ? 0.8 : 1 },
        ]}
        accessibilityLabel={`${isDone ? 'Revisar' : 'Iniciar'} coleta na ${s.route.name}`}
        accessibilityRole="button">
        <Ionicons
          name={isDone ? 'eye-outline' : 'play-circle-outline'}
          size={20}
          color="white"
        />
        <Text style={styles.buttonText}>
          {isDone ? 'Revisar Rota' : 'Iniciar Coleta'}
        </Text>
        <Ionicons name="arrow-forward-outline" size={16} color="white" />
      </Pressable>
    </View>
  );
}



const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9F3' },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  greeting: { fontSize: 20, fontWeight: 'bold', color: '#1A3A2A' },
  headerSubtitle: { fontSize: 13, color: '#5A7A65' },
  logoutButton: {
    padding: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#4A7C59',
  },
  scrollView: { paddingHorizontal: Spacing.four },

  
  dayCard: {
    backgroundColor: '#2D5A3D',
    borderRadius: 16,
    padding: Spacing.four,
    marginBottom: Spacing.three,
    gap: Spacing.two,
    shadowColor: '#2D5A3D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  dayCardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  dayCardDate: { color: 'rgba(255,255,255,0.85)', fontSize: 13, textTransform: 'capitalize' },
  dayCardStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  dayStatItem: { alignItems: 'center', gap: 2 },
  dayStatValue: { color: 'white', fontSize: 32, fontWeight: 'bold', lineHeight: 36 },
  dayStatLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  dayStatDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)' },
  dayProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  dayProgressFill: { height: '100%', backgroundColor: '#A8E6CF', borderRadius: 3 },
  dayProgressLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, textAlign: 'center' },


  filterRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
    flexWrap: 'wrap',
  },
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

 
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    marginBottom: Spacing.three,
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cardDone: {
    borderWidth: 1.5,
    borderColor: '#28A745',
    backgroundColor: '#F8FFF9',
  },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  routeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderInfo: { flex: 1 },
  routeName: { fontSize: 16, fontWeight: 'bold', color: '#1A3A2A' },
  cardDescription: { color: 'gray', fontSize: 12, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeDone: { backgroundColor: '#D4EDDA' },
  statusBadgePending: { backgroundColor: '#FFF3E0' },
  statusBadgeText: { fontSize: 11, fontWeight: 'bold' },
  neighborhoodsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  neighborhoodTag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: 12,
  },
  neighborhoodTagText: { fontSize: 11, color: '#2D5A3D', fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, color: 'gray' },
  progressContainer: { gap: Spacing.one },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 12, color: '#555' },
  progressValue: { fontSize: 12, fontWeight: 'bold', color: '#4A7C59' },
  progressBar: { height: 6, backgroundColor: '#E8F5E9', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#4A7C59', borderRadius: 3 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: '#4A7C59',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  buttonDone: { backgroundColor: '#5A8A6A' },
  buttonText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
  emptyState: { alignItems: 'center', padding: Spacing.six, gap: Spacing.two },
  emptyStateText: { color: 'gray', textAlign: 'center', fontSize: 14 },
});
