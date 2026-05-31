
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import {
  ClassificationResult,
  classifyWasteDetailed,
  CONTAMINATION_LABELS,
  ContaminationLevel,
  MATERIAL_LABELS,
  MaterialType,
} from '@/utils/naive-bayes';
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

const MATERIALS: MaterialType[] = ['plastico', 'papel', 'metal', 'vidro', 'organico', 'eletronico'];
const CONTAMINATIONS: ContaminationLevel[] = ['limpo', 'contaminado'];

const MATERIAL_ICONS: Record<MaterialType, string> = {
  plastico: 'cube-outline',
  papel: 'document-outline',
  metal: 'hardware-chip-outline',
  vidro: 'wine-outline',
  organico: 'leaf-outline',
  eletronico: 'phone-portrait-outline',
};

export default function WasteClassifierScreen() {
  const router = useRouter();
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType | null>(null);
  const [selectedContamination, setSelectedContamination] = useState<ContaminationLevel | null>(null);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [allProbs, setAllProbs] = useState<Record<string, number> | null>(null);
  const [classified, setClassified] = useState(false);

  const handleClassify = () => {
    if (!selectedMaterial || !selectedContamination) return;

    const { result: classResult, allProbabilities } = classifyWasteDetailed({
      material: selectedMaterial,
      contamination: selectedContamination,
    });

    setResult(classResult);
    setAllProbs(allProbabilities);
    setClassified(true);
  };

  const handleReset = () => {
    setSelectedMaterial(null);
    setSelectedContamination(null);
    setResult(null);
    setAllProbs(null);
    setClassified(false);
  };

  const canClassify = selectedMaterial !== null && selectedContamination !== null;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={24} color="#4A7C59" />
          </Pressable>
          <View style={styles.headerTitle}>
            <Ionicons name="flask-outline" size={22} color="#4A7C59" />
            <Text style={styles.headerTitleText}>Classificador de Resíduos</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        
          <View style={styles.descriptionCard}>
            <Ionicons name="information-circle-outline" size={20} color="#1976D2" />
            <Text style={styles.descriptionText}>
              Informe o tipo de material e o nível de contaminação. A IA (Naive Bayes)
              calculará a probabilidade de classificação e indicará o descarte correto.
            </Text>
          </View>

          {!classified ? (
            <>
              
              <Text style={styles.sectionTitle}>Tipo de Material</Text>
              <View style={styles.optionsGrid}>
                {MATERIALS.map((material) => (
                  <Pressable
                    key={material}
                    style={({ pressed }) => [
                      styles.optionCard,
                      selectedMaterial === material && styles.optionCardSelected,
                      { opacity: pressed ? 0.8 : 1 },
                    ]}
                    onPress={() => setSelectedMaterial(material)}
                    accessibilityLabel={`Selecionar ${MATERIAL_LABELS[material]}`}
                    accessibilityState={{ selected: selectedMaterial === material }}>
                    <Ionicons
                      name={MATERIAL_ICONS[material] as any}
                      size={24}
                      color={selectedMaterial === material ? 'white' : '#4A7C59'}
                    />
                    <Text style={[
                      styles.optionText,
                      selectedMaterial === material && styles.optionTextSelected,
                    ]}>
                      {MATERIAL_LABELS[material]}
                    </Text>
                  </Pressable>
                ))}
              </View>

            
              <Text style={styles.sectionTitle}>Nível de Contaminação</Text>
              <View style={styles.contaminationOptions}>
                {CONTAMINATIONS.map((level) => (
                  <Pressable
                    key={level}
                    style={({ pressed }) => [
                      styles.contaminationCard,
                      selectedContamination === level && styles.contaminationCardSelected,
                      { opacity: pressed ? 0.8 : 1 },
                    ]}
                    onPress={() => setSelectedContamination(level)}
                    accessibilityLabel={CONTAMINATION_LABELS[level]}
                    accessibilityState={{ selected: selectedContamination === level }}>
                    <Ionicons
                      name={level === 'limpo' ? 'checkmark-circle-outline' : 'warning-outline'}
                      size={24}
                      color={
                        selectedContamination === level
                          ? 'white'
                          : level === 'limpo' ? '#4A7C59' : '#E65100'
                      }
                    />
                    <Text style={[
                      styles.contaminationText,
                      selectedContamination === level && styles.contaminationTextSelected,
                    ]}>
                      {CONTAMINATION_LABELS[level]}
                    </Text>
                  </Pressable>
                ))}
              </View>

             
              <Pressable
                onPress={handleClassify}
                disabled={!canClassify}
                style={({ pressed }) => [
                  styles.classifyButton,
                  !canClassify && styles.classifyButtonDisabled,
                  { opacity: pressed ? 0.8 : 1 },
                ]}
                accessibilityLabel="Classificar resíduo"
                accessibilityRole="button">
                <Ionicons name="analytics-outline" size={22} color="white" />
                <Text style={styles.classifyButtonText}>Classificar com IA</Text>
              </Pressable>
            </>
          ) : (
            <>
          
              {result && (
                <View style={[styles.resultCard, { borderColor: result.color }]}>
                  <View style={[styles.resultHeader, { backgroundColor: result.color }]}>
                    <Ionicons name={result.icon as any} size={32} color="white" />
                    <View style={styles.resultHeaderText}>
                      <Text style={styles.resultClass}>{result.label}</Text>
                      <Text style={styles.resultProbability}>
                        Confiança: {(result.probability * 100).toFixed(1)}%
                      </Text>
                    </View>
                  </View>

                 
                  <View style={styles.resultInputSummary}>
                    <Text style={styles.resultInputLabel}>Material:</Text>
                    <Text style={styles.resultInputValue}>
                      {selectedMaterial ? MATERIAL_LABELS[selectedMaterial] : ''}
                    </Text>
                  </View>
                  <View style={styles.resultInputSummary}>
                    <Text style={styles.resultInputLabel}>Contaminação:</Text>
                    <Text style={styles.resultInputValue}>
                      {selectedContamination ? CONTAMINATION_LABELS[selectedContamination] : ''}
                    </Text>
                  </View>

                
                  <View style={styles.instructionsBox}>
                    <Text style={styles.instructionsTitle}>Como descartar:</Text>
                    <Text style={styles.instructionsText}>{result.disposalInstructions}</Text>
                  </View>

             
                  <View style={styles.tipBox}>
                    <Ionicons name="bulb-outline" size={18} color="#F5A623" />
                    <Text style={styles.tipText}>{result.tip}</Text>
                  </View>

                 
                  {allProbs && (
                    <View style={styles.probsSection}>
                      <Text style={styles.probsTitle}>Probabilidades calculadas (Naive Bayes):</Text>
                      {Object.entries(allProbs)
                        .sort(([, a], [, b]) => b - a)
                        .map(([cls, prob]) => {
                          const labels: Record<string, string> = {
                            reciclavel: 'Reciclável',
                            organico: 'Orgânico',
                            rejeito: 'Rejeito',
                          };
                          const barColors: Record<string, string> = {
                            reciclavel: '#4A7C59',
                            organico: '#8B6914',
                            rejeito: '#D9534F',
                          };
                          return (
                            <View key={cls} style={styles.probRow}>
                              <Text style={styles.probLabel}>{labels[cls]}</Text>
                              <View style={styles.probBarContainer}>
                                <View
                                  style={[
                                    styles.probBar,
                                    {
                                      width: `${(prob * 100).toFixed(0)}%` as any,
                                      backgroundColor: barColors[cls],
                                    },
                                  ]}
                                />
                              </View>
                              <Text style={styles.probValue}>{(prob * 100).toFixed(1)}%</Text>
                            </View>
                          );
                        })}
                    </View>
                  )}
                </View>
              )}

             
              <Pressable
                onPress={handleReset}
                style={({ pressed }) => [styles.resetButton, { opacity: pressed ? 0.8 : 1 }]}
                accessibilityLabel="Classificar outro resíduo">
                <Ionicons name="refresh-outline" size={20} color="#4A7C59" />
                <Text style={styles.resetButtonText}>Classificar outro resíduo</Text>
              </Pressable>
            </>
          )}

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
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.three,
  },
  backButton: { padding: Spacing.one },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A3A2A',
  },
  scrollView: {
    paddingHorizontal: Spacing.four,
  },
  descriptionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    backgroundColor: '#E3F2FD',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  descriptionText: {
    flex: 1,
    fontSize: 13,
    color: '#1565C0',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1A3A2A',
    marginBottom: Spacing.two,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  optionCard: {
    width: '47%',
    backgroundColor: 'white',
    borderRadius: Spacing.two,
    padding: Spacing.three,
    alignItems: 'center',
    gap: Spacing.one,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optionCardSelected: {
    backgroundColor: '#4A7C59',
    borderColor: '#4A7C59',
  },
  optionText: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    fontWeight: '500',
  },
  optionTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  contaminationOptions: {
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  contaminationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: 'white',
    borderRadius: Spacing.two,
    padding: Spacing.three,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  contaminationCardSelected: {
    backgroundColor: '#4A7C59',
    borderColor: '#4A7C59',
  },
  contaminationText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  contaminationTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  classifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A7C59',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  classifyButtonDisabled: {
    backgroundColor: '#A0A0A0',
  },
  classifyButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: Spacing.three,
    overflow: 'hidden',
    borderWidth: 2,
    marginBottom: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  resultHeaderText: { gap: 2 },
  resultClass: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  resultProbability: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
  },
  resultInputSummary: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  resultInputLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#555',
    width: 100,
  },
  resultInputValue: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  instructionsBox: {
    margin: Spacing.three,
    backgroundColor: '#F5F5F5',
    borderRadius: Spacing.two,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  instructionsText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.three,
    backgroundColor: '#FFFDE7',
    borderRadius: Spacing.two,
    padding: Spacing.two,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#795548',
    lineHeight: 17,
  },
  probsSection: {
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.three,
    gap: Spacing.two,
  },
  probsTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: Spacing.one,
  },
  probRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  probLabel: {
    width: 80,
    fontSize: 12,
    color: '#555',
  },
  probBarContainer: {
    flex: 1,
    height: 10,
    backgroundColor: '#EEEEEE',
    borderRadius: 5,
    overflow: 'hidden',
  },
  probBar: {
    height: '100%',
    borderRadius: 5,
  },
  probValue: {
    width: 45,
    fontSize: 12,
    color: '#333',
    textAlign: 'right',
    fontWeight: 'bold',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#4A7C59',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  resetButtonText: {
    color: '#4A7C59',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
