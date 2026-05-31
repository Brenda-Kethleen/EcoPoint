
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import db from '@/data/db';
import { formatCPF, validateAddress, validateCPF, validateName } from '@/utils/validators';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FormErrors {
  address?: string;
  residentName?: string;
  cpf?: string;
  routeName?: string;
}

const ROUTES = ['Rota Alpha', 'Rota Beta', 'Rota Gamma', 'Rota Delta'];

export default function ResidenceRegistrationScreen() {
  const [address, setAddress] = useState('');
  const [residentName, setResidentName] = useState('');
  const [cpf, setCpf] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [recentRegistrations, setRecentRegistrations] = useState<string[]>([]);

  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const handleCpfChange = (text: string) => {
    setCpf(formatCPF(text));
    if (errors.cpf) setErrors(e => ({ ...e, cpf: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const addressResult = validateAddress(address);
    if (!addressResult.valid) newErrors.address = addressResult.message;

    const nameResult = validateName(residentName);
    if (!nameResult.valid) newErrors.residentName = nameResult.message;

    const cpfResult = validateCPF(cpf);
    if (!cpfResult.valid) newErrors.cpf = cpfResult.message;

    if (!selectedRoute) newErrors.routeName = 'Selecione uma rota.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = () => {
    if (!validateForm()) return;

    setIsLoading(true);

    setTimeout(() => {
      
      const existing = db.getResidenceByAddress(address.trim());
      if (existing) {
        Alert.alert('Atenção', 'Este endereço já está cadastrado no programa.');
        setIsLoading(false);
        return;
      }

      db.addResidence({
        address: address.trim(),
        residentName: residentName.trim(),
        cpf,
        status: 'Pendente',
        routeName: selectedRoute,
      });

      db.addParticipant({
        address: address.trim(),
        residentName: residentName.trim(),
      });

      setRecentRegistrations(prev => [address.trim(), ...prev.slice(0, 4)]);

      Alert.alert(
        'Cadastro realizado!',
        `Residência de ${residentName.trim().split(' ')[0]} cadastrada na ${selectedRoute}.`,
        [{ text: 'OK' }]
      );

      setAddress('');
      setResidentName('');
      setCpf('');
      setSelectedRoute('');
      setIsLoading(false);
    }, 500);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, Agente 👤</Text>
            <Text style={styles.headerSubtitle}>Cadastro de Residências</Text>
          </View>
          <Pressable onPress={() => router.push('/login')} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={20} color="#4A7C59" />
          </Pressable>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}>
          <ScrollView
            style={styles.scrollView}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>

            <ThemedText style={styles.subtitle}>
              Cadastre residências participantes do programa de descarte consciente.
              Todos os campos são validados automaticamente.
            </ThemedText>

            
            <View style={[styles.card, { backgroundColor: colors.background }]}>

            
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Endereço completo *</Text>
                <View style={[styles.inputWrapper, errors.address ? styles.inputError : null]}>
                  <Ionicons name="home-outline" size={20} color="gray" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Rua, número, bairro"
                    placeholderTextColor="gray"
                    value={address}
                    onChangeText={(t) => {
                      setAddress(t);
                      if (errors.address) setErrors(e => ({ ...e, address: undefined }));
                    }}
                    editable={!isLoading}
                    accessibilityLabel="Endereço da residência"
                  />
                </View>
                {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
              </View>

             
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nome do morador responsável *</Text>
                <View style={[styles.inputWrapper, errors.residentName ? styles.inputError : null]}>
                  <Ionicons name="person-outline" size={20} color="gray" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nome completo"
                    placeholderTextColor="gray"
                    value={residentName}
                    onChangeText={(t) => {
                      setResidentName(t);
                      if (errors.residentName) setErrors(e => ({ ...e, residentName: undefined }));
                    }}
                    autoCapitalize="words"
                    editable={!isLoading}
                    accessibilityLabel="Nome do morador"
                  />
                </View>
                {errors.residentName && <Text style={styles.errorText}>{errors.residentName}</Text>}
              </View>

             
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>CPF *</Text>
                <View style={[styles.inputWrapper, errors.cpf ? styles.inputError : null]}>
                  <Ionicons name="card-outline" size={20} color="gray" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="000.000.000-00"
                    placeholderTextColor="gray"
                    value={cpf}
                    onChangeText={handleCpfChange}
                    keyboardType="numeric"
                    editable={!isLoading}
                    accessibilityLabel="CPF do morador"
                  />
                </View>
                {errors.cpf && <Text style={styles.errorText}>{errors.cpf}</Text>}
              </View>

             
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Rota de coleta *</Text>
                <View style={styles.routeOptions}>
                  {ROUTES.map((route) => (
                    <Pressable
                      key={route}
                      style={[
                        styles.routeOption,
                        selectedRoute === route && styles.routeOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedRoute(route);
                        if (errors.routeName) setErrors(e => ({ ...e, routeName: undefined }));
                      }}
                      accessibilityLabel={`Selecionar ${route}`}
                      accessibilityState={{ selected: selectedRoute === route }}>
                      <Ionicons
                        name="location-outline"
                        size={16}
                        color={selectedRoute === route ? 'white' : '#4A7C59'}
                      />
                      <Text style={[
                        styles.routeOptionText,
                        selectedRoute === route && styles.routeOptionTextSelected,
                      ]}>
                        {route}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {errors.routeName && <Text style={styles.errorText}>{errors.routeName}</Text>}
              </View>

              <Pressable
                onPress={handleRegister}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.button,
                  { opacity: pressed || isLoading ? 0.7 : 1 },
                ]}
                accessibilityLabel="Cadastrar residência"
                accessibilityRole="button">
                {isLoading ? (
                  <Text style={styles.buttonText}>Cadastrando...</Text>
                ) : (
                  <>
                    <Ionicons name="add-circle-outline" size={22} color="white" />
                    <Text style={styles.buttonText}>Cadastrar Residência</Text>
                  </>
                )}
              </Pressable>
            </View>

            
            {recentRegistrations.length > 0 && (
              <View style={styles.recentSection}>
                <Text style={styles.recentTitle}>Cadastros desta sessão:</Text>
                {recentRegistrations.map((addr, i) => (
                  <View key={i} style={styles.recentItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#4A7C59" />
                    <Text style={styles.recentItemText}>{addr}</Text>
                  </View>
                ))}
              </View>
            )}

           
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Programa EcoPoint</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{db.residences.length}</Text>
                  <Text style={styles.statLabel}>Residências</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{db.routes.length}</Text>
                  <Text style={styles.statLabel}>Rotas</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {db.residences.filter(r => r.status === 'Descarte Consciente').length}
                  </Text>
                  <Text style={styles.statLabel}>Ativos</Text>
                </View>
              </View>
            </View>

            <View style={{ height: Spacing.four }} />
          </ScrollView>
        </KeyboardAvoidingView>
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
  subtitle: {
    color: '#5A7A65',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: Spacing.three,
  },
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: Spacing.three,
  },
  inputGroup: { gap: Spacing.one },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#444',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: Spacing.three,
    height: 50,
  },
  inputError: { borderColor: '#D9534F' },
  inputIcon: { marginRight: Spacing.two },
  input: {
    flex: 1,
    fontSize: 16,
    height: '100%',
    color: '#111111',
  },
  errorText: {
    color: '#D9534F',
    fontSize: 12,
    marginTop: 2,
  },
  routeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  routeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1.5,
    borderColor: '#4A7C59',
    backgroundColor: 'white',
  },
  routeOptionSelected: {
    backgroundColor: '#4A7C59',
    borderColor: '#4A7C59',
  },
  routeOptionText: {
    fontSize: 13,
    color: '#4A7C59',
    fontWeight: '600',
  },
  routeOptionTextSelected: {
    color: 'white',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A7C59',
    borderRadius: Spacing.two,
    paddingVertical: Spacing.three,
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
  },
  recentSection: {
    backgroundColor: '#E8F5E9',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2D5A3D',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  recentItemText: {
    fontSize: 13,
    color: '#3D6B4A',
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A3A2A',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A7C59',
  },
  statLabel: {
    fontSize: 12,
    color: 'gray',
  },
});
