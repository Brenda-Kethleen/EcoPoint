
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import db from '@/data/db';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


const DEMO_USER_EMAIL = 'maria@email.com';

export default function HomeUserScreen() {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  const user = db.findUserByEmail(DEMO_USER_EMAIL);
  const participant = user?.address ? db.getParticipantByAddress(user.address) : null;

  const handleLogout = () => {
    router.push('/login');
  };

  const participationRate = participant
    ? Math.round((participant.participations / Math.max(participant.totalCollections, 1)) * 100)
    : 0;

  const nextDiscountThreshold = participant
    ? Math.ceil(participant.participations / 2) * 2 + 2
    : 2;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {user?.name.split(' ')[0] ?? 'Morador'} 👋</Text>
            <Text style={styles.headerSubtitle}>Programa EcoPoint</Text>
          </View>
          <Pressable onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={20} color="#4A7C59" />
          </Pressable>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

          
          <View style={styles.discountCard}>
            <View style={styles.discountCardLeft}>
              <Text style={styles.discountLabel}>Desconto na conta de água</Text>
              <Text style={styles.discountValue}>
                {participant?.discount ?? 0}%
              </Text>
              <Text style={styles.discountSub}>
                Próximo nível: {Math.min(15, (participant?.discount ?? 0) + 2)}%
              </Text>
            </View>
            <View style={styles.discountCardRight}>
              <Ionicons name="water" size={48} color="rgba(255,255,255,0.8)" />
            </View>
          </View>

         
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="star" size={24} color="#F5A623" />
              <Text style={styles.statValue}>{participant?.points ?? 0}</Text>
              <Text style={styles.statLabel}>Pontos</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={24} color="#4A7C59" />
              <Text style={styles.statValue}>{participant?.participations ?? 0}</Text>
              <Text style={styles.statLabel}>Coletas</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="trending-up" size={24} color="#5B9BD5" />
              <Text style={styles.statValue}>{participationRate}%</Text>
              <Text style={styles.statLabel}>Adesão</Text>
            </View>
          </View>

         
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Progresso para próximo desconto</Text>
              <Text style={styles.progressPercent}>{participationRate}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(100, participationRate)}%` }]} />
            </View>
            <Text style={styles.progressSub}>
              {participant?.participations ?? 0} de {nextDiscountThreshold} coletas para +2% de desconto
            </Text>
          </View>

          
          <Text style={styles.sectionTitle}>Ações</Text>
          <View style={styles.actionsGrid}>

            <Pressable
              style={({ pressed }) => [styles.actionCard, { opacity: pressed ? 0.8 : 1 }]}
              onPress={() => router.push('/waste-classifier')}
              accessibilityLabel="Classificar resíduo com IA">
              <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="flask-outline" size={28} color="#4A7C59" />
              </View>
              <Text style={styles.actionTitle}>Classificar Resíduo</Text>
              <Text style={styles.actionSub}>IA Naive Bayes</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.actionCard, { opacity: pressed ? 0.8 : 1 }]}
              onPress={() => router.push('/mapa')}
              accessibilityLabel="Ver mapa de pontos de coleta">
              <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="map-outline" size={28} color="#1976D2" />
              </View>
              <Text style={styles.actionTitle}>Pontos de Coleta</Text>
              <Text style={styles.actionSub}>Mapa interativo</Text>
            </Pressable>

          </View>

          
          <Text style={styles.sectionTitle}>Última atividade</Text>
          <View style={styles.lastCollectionCard}>
            <Ionicons name="time-outline" size={20} color="#4A7C59" />
            <View style={styles.lastCollectionInfo}>
              <Text style={styles.lastCollectionTitle}>Última coleta registrada</Text>
              <Text style={styles.lastCollectionDate}>
                {participant?.lastCollection ?? 'Nenhuma coleta registrada'}
              </Text>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: participant?.participations ? '#E8F5E9' : '#FFF3E0' },
            ]}>
              <Text style={[
                styles.statusBadgeText,
                { color: participant?.participations ? '#4A7C59' : '#E65100' },
              ]}>
                {participant?.participations ? 'Ativo' : 'Pendente'}
              </Text>
            </View>
          </View>

          
          <Text style={styles.sectionTitle}>Como funciona</Text>
          <View style={styles.howItWorksCard}>
            {[
              { icon: 'trash-outline', step: '1', text: 'Separe seus resíduos corretamente em casa' },
              { icon: 'car-outline', step: '2', text: 'O caminhão de coleta passa na sua rua' },
              { icon: 'checkmark-circle-outline', step: '3', text: 'O motorista registra sua participação' },
              { icon: 'water-outline', step: '4', text: 'Você recebe desconto na conta de água' },
            ].map((item) => (
              <View key={item.step} style={styles.howItWorksStep}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{item.step}</Text>
                </View>
                <Ionicons name={item.icon as any} size={20} color="#4A7C59" />
                <Text style={styles.stepText}>{item.text}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: Spacing.four }} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FFF4',
  },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A3A2A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#5A7A65',
  },
  logoutButton: {
    padding: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#4A7C59',
  },
  scrollView: {
    paddingHorizontal: Spacing.four,
  },
  discountCard: {
    backgroundColor: '#4A7C59',
    borderRadius: Spacing.four,
    padding: Spacing.four,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
    shadowColor: '#4A7C59',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  discountCardLeft: { gap: Spacing.one },
  discountCardRight: {},
  discountLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  discountValue: {
    color: 'white',
    fontSize: 48,
    fontWeight: 'bold',
    lineHeight: 52,
  },
  discountSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    alignItems: 'center',
    gap: Spacing.one,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A3A2A',
  },
  statLabel: {
    fontSize: 12,
    color: 'gray',
  },
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
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4A7C59',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A7C59',
    borderRadius: 4,
  },
  progressSub: {
    fontSize: 12,
    color: 'gray',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1A3A2A',
    marginBottom: Spacing.two,
    marginTop: Spacing.one,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    alignItems: 'center',
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1A3A2A',
    textAlign: 'center',
  },
  actionSub: {
    fontSize: 11,
    color: 'gray',
    textAlign: 'center',
  },
  lastCollectionCard: {
    backgroundColor: 'white',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  lastCollectionInfo: { flex: 1 },
  lastCollectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  lastCollectionDate: {
    fontSize: 13,
    color: 'gray',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  howItWorksCard: {
    backgroundColor: 'white',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.three,
    marginBottom: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  howItWorksStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4A7C59',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: '#444',
  },
});
