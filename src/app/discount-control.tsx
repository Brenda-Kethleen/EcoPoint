
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import db, { Participant } from '@/data/db';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SortKey = 'discount' | 'participations' | 'points';

export default function DiscountControlScreen() {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);
  const [sortBy, setSortBy] = useState<SortKey>('discount');
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [newDiscount, setNewDiscount] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  const participants = [...db.participants].sort((a, b) => {
    if (sortBy === 'discount') return b.discount - a.discount;
    if (sortBy === 'participations') return b.participations - a.participations;
    return b.points - a.points;
  });

  const totalParticipants = participants.length;
  const avgDiscount = totalParticipants
    ? (participants.reduce((s, p) => s + p.discount, 0) / totalParticipants).toFixed(1)
    : '0';
  const activeParticipants = participants.filter(p => p.participations > 0).length;

  const handleOpenModal = (participant: Participant) => {
    setSelectedParticipant(participant);
    setNewDiscount(String(participant.discount));
    setModalVisible(true);
  };

  const handleApplyDiscount = () => {
    if (!selectedParticipant) return;
    const value = parseInt(newDiscount, 10);
    if (isNaN(value) || value < 0 || value > 15) {
      Alert.alert('Valor inválido', 'O desconto deve ser entre 0% e 15%.');
      return;
    }
    db.updateDiscount(selectedParticipant.address, value);
    setModalVisible(false);
    setRefreshKey(k => k + 1);
    Alert.alert('Desconto atualizado', `Desconto de ${value}% aplicado para ${selectedParticipant.residentName.split(' ')[0]}.`);
  };

  const getDiscountColor = (discount: number) => {
    if (discount >= 10) return '#4A7C59';
    if (discount >= 5) return '#F5A623';
    return '#D9534F';
  };

  const getParticipationRate = (p: Participant) =>
    p.totalCollections > 0
      ? Math.round((p.participations / p.totalCollections) * 100)
      : 0;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, Administrador ⚙️</Text>
            <Text style={styles.headerSubtitle}>Controle de Descontos</Text>
          </View>
          <Pressable onPress={() => router.push('/login')} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={20} color="#4A7C59" />
          </Pressable>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

          {/* Cards de resumo */}
          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Ionicons name="people-outline" size={24} color="#4A7C59" />
              <Text style={styles.summaryValue}>{totalParticipants}</Text>
              <Text style={styles.summaryLabel}>Participantes</Text>
            </View>
            <View style={styles.summaryCard}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#5B9BD5" />
              <Text style={styles.summaryValue}>{activeParticipants}</Text>
              <Text style={styles.summaryLabel}>Ativos</Text>
            </View>
            <View style={styles.summaryCard}>
              <Ionicons name="water-outline" size={24} color="#00ACC1" />
              <Text style={styles.summaryValue}>{avgDiscount}%</Text>
              <Text style={styles.summaryLabel}>Desconto médio</Text>
            </View>
          </View>

          
          <View style={styles.sortRow}>
            <Text style={styles.sortLabel}>Ordenar por:</Text>
            {(['discount', 'participations', 'points'] as SortKey[]).map((key) => {
              const labels: Record<SortKey, string> = {
                discount: 'Desconto',
                participations: 'Coletas',
                points: 'Pontos',
              };
              return (
                <Pressable
                  key={key}
                  style={[styles.sortChip, sortBy === key && styles.sortChipActive]}
                  onPress={() => setSortBy(key)}>
                  <Text style={[styles.sortChipText, sortBy === key && styles.sortChipTextActive]}>
                    {labels[key]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          
          <ThemedText style={styles.sectionTitle}>Moradores Participantes</ThemedText>

          {participants.map((participant) => {
            const rate = getParticipationRate(participant);
            return (
              <View key={participant.id} style={styles.participantCard}>
                <View style={styles.participantHeader}>
                  <View style={styles.participantAvatar}>
                    <Text style={styles.participantAvatarText}>
                      {participant.residentName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.participantInfo}>
                    <Text style={styles.participantName}>{participant.residentName}</Text>
                    <Text style={styles.participantAddress} numberOfLines={1}>
                      {participant.address}
                    </Text>
                  </View>
                  <View style={[
                    styles.discountBadge,
                    { backgroundColor: getDiscountColor(participant.discount) },
                  ]}>
                    <Text style={styles.discountBadgeText}>{participant.discount}%</Text>
                  </View>
                </View>

                
                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Taxa de participação</Text>
                  <Text style={styles.progressValue}>{rate}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[
                    styles.progressFill,
                    {
                      width: `${rate}%` as any,
                      backgroundColor: getDiscountColor(participant.discount),
                    },
                  ]} />
                </View>

                
                <View style={styles.participantDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="checkmark-circle-outline" size={14} color="#4A7C59" />
                    <Text style={styles.detailText}>{participant.participations} coletas</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="star-outline" size={14} color="#F5A623" />
                    <Text style={styles.detailText}>{participant.points} pts</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons name="time-outline" size={14} color="gray" />
                    <Text style={styles.detailText}>{participant.lastCollection}</Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => handleOpenModal(participant)}
                  style={({ pressed }) => [styles.updateButton, { opacity: pressed ? 0.8 : 1 }]}
                  accessibilityLabel={`Atualizar desconto de ${participant.residentName}`}>
                  <Ionicons name="pencil-outline" size={16} color="white" />
                  <Text style={styles.updateButtonText}>Atualizar Desconto</Text>
                </Pressable>
              </View>
            );
          })}

          <View style={{ height: Spacing.four }} />
        </ScrollView>

        
        <Modal
          visible={modalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Atualizar Desconto</Text>
              {selectedParticipant && (
                <Text style={styles.modalSubtitle}>
                  {selectedParticipant.residentName}
                </Text>
              )}

              <Text style={styles.modalLabel}>Novo desconto (0% a 15%):</Text>
              <TextInput
                style={styles.modalInput}
                value={newDiscount}
                onChangeText={setNewDiscount}
                keyboardType="numeric"
                maxLength={2}
                accessibilityLabel="Valor do desconto"
              />

              <View style={styles.modalButtons}>
                <Pressable
                  onPress={() => setModalVisible(false)}
                  style={styles.modalCancelButton}>
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={handleApplyDiscount}
                  style={styles.modalConfirmButton}>
                  <Text style={styles.modalConfirmText}>Aplicar</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
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
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  summaryCard: {
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
  summaryValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A3A2A',
  },
  summaryLabel: {
    fontSize: 11,
    color: 'gray',
    textAlign: 'center',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.three,
    flexWrap: 'wrap',
  },
  sortLabel: {
    fontSize: 13,
    color: '#555',
    fontWeight: '600',
  },
  sortChip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sortChipActive: {
    backgroundColor: '#4A7C59',
    borderColor: '#4A7C59',
  },
  sortChipText: {
    fontSize: 12,
    color: '#555',
  },
  sortChipTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1A3A2A',
    marginBottom: Spacing.two,
  },
  participantCard: {
    backgroundColor: 'white',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    marginBottom: Spacing.two,
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  participantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4A7C59',
    alignItems: 'center',
    justifyContent: 'center',
  },
  participantAvatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  participantInfo: { flex: 1 },
  participantName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A3A2A',
  },
  participantAddress: {
    fontSize: 12,
    color: 'gray',
    marginTop: 2,
  },
  discountBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.two,
    minWidth: 44,
    alignItems: 'center',
  },
  discountBadgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    color: '#555',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4A7C59',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#EEEEEE',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  participantDetails: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#555',
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A7C59',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    gap: Spacing.one,
  },
  updateButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: Spacing.four,
    padding: Spacing.four,
    width: '100%',
    maxWidth: 360,
    gap: Spacing.three,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A3A2A',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'gray',
    textAlign: 'center',
    marginTop: -Spacing.two,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  modalInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: '#F5F5F5',
    color: '#111111',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  modalCancelButton: {
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
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: '#4A7C59',
    alignItems: 'center',
  },
  modalConfirmText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
