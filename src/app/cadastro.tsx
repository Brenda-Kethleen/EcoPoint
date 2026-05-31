/**
 * EcoPoint - Tela de Cadastro de Morador
 * Permite que novos moradores se registrem no programa.
 * Usa expressões regulares para validação de todos os campos.
 */
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import db from '@/data/db';
import {
    formatCPF,
    validateAddress,
    validateCPF,
    validateEmail,
    validateName,
    validatePassword,
} from '@/utils/validators';
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
  name?: string;
  email?: string;
  cpf?: string;
  address?: string;
  password?: string;
  confirmPassword?: string;
}

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const handleCpfChange = (text: string) => {
    setCpf(formatCPF(text));
    if (errors.cpf) setErrors(e => ({ ...e, cpf: undefined }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const nameResult = validateName(name);
    if (!nameResult.valid) newErrors.name = nameResult.message;

    const emailResult = validateEmail(email);
    if (!emailResult.valid) newErrors.email = emailResult.message;

    const cpfResult = validateCPF(cpf);
    if (!cpfResult.valid) newErrors.cpf = cpfResult.message;

    const addressResult = validateAddress(address);
    if (!addressResult.valid) newErrors.address = addressResult.message;

    const passwordResult = validatePassword(password);
    if (!passwordResult.valid) newErrors.password = passwordResult.message;

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirme sua senha.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = () => {
    if (!validateForm()) return;

    setIsLoading(true);

    setTimeout(() => {
      // Verifica se email já existe
      const existing = db.findUserByEmail(email);
      if (existing) {
        setErrors(e => ({ ...e, email: 'Este email já está cadastrado.' }));
        setIsLoading(false);
        return;
      }

      // Cria usuário morador
      const newUser = db.addUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: 'resident',
        cpf,
        address: address.trim(),
      });

      // Registra como participante do programa
      db.addParticipant({
        address: address.trim(),
        residentName: name.trim(),
      });

      setIsLoading(false);
      Alert.alert(
        'Cadastro realizado!',
        `Bem-vindo(a) ao EcoPoint, ${newUser.name.split(' ')[0]}! Faça login para acessar sua conta.`,
        [{ text: 'Fazer Login', onPress: () => router.push('/login') }]
      );
    }, 600);
  };

  const renderInput = (
    label: string,
    value: string,
    onChange: (t: string) => void,
    options: {
      placeholder?: string;
      icon: string;
      keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
      autoCapitalize?: 'none' | 'words' | 'sentences';
      secureTextEntry?: boolean;
      error?: string;
      rightElement?: React.ReactNode;
    }
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputWrapper, options.error ? styles.inputError : null]}>
        <Ionicons
          name={options.icon as any}
          size={20}
          color="gray"
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder={options.placeholder ?? label}
          placeholderTextColor="gray"
          value={value}
          onChangeText={onChange}
          keyboardType={options.keyboardType ?? 'default'}
          autoCapitalize={options.autoCapitalize ?? 'sentences'}
          secureTextEntry={options.secureTextEntry}
          editable={!isLoading}
          accessibilityLabel={label}
        />
        {options.rightElement}
      </View>
      {options.error ? (
        <Text style={styles.errorText}>{options.error}</Text>
      ) : null}
    </View>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: '#F0FFF4' }]}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">

            {/* Header */}
            <View style={styles.header}>
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back-outline" size={24} color="#4A7C59" />
              </Pressable>
              <View style={styles.headerTitleContainer}>
                <Ionicons name="person-add-outline" size={28} color="#4A7C59" />
                <ThemedText style={styles.headerTitle}>
                  Criar Conta
                </ThemedText>
              </View>
            </View>

            <ThemedText style={styles.subtitle}>
              Cadastre-se no programa EcoPoint e comece a ganhar descontos na conta de água
              pelo descarte correto de resíduos.
            </ThemedText>

            {/* Formulário */}
            <View style={[styles.card, { backgroundColor: colors.background }]}>

              {renderInput('Nome completo', name, (t) => {
                setName(t);
                if (errors.name) setErrors(e => ({ ...e, name: undefined }));
              }, {
                placeholder: 'Seu nome completo',
                icon: 'person-outline',
                autoCapitalize: 'words',
                error: errors.name,
              })}

              {renderInput('Email', email, (t) => {
                setEmail(t);
                if (errors.email) setErrors(e => ({ ...e, email: undefined }));
              }, {
                placeholder: 'seu@email.com',
                icon: 'mail-outline',
                keyboardType: 'email-address',
                autoCapitalize: 'none',
                error: errors.email,
              })}

              {renderInput('CPF', cpf, handleCpfChange, {
                placeholder: '000.000.000-00',
                icon: 'card-outline',
                keyboardType: 'numeric',
                error: errors.cpf,
              })}

              {renderInput('Endereço', address, (t) => {
                setAddress(t);
                if (errors.address) setErrors(e => ({ ...e, address: undefined }));
              }, {
                placeholder: 'Rua, número, bairro',
                icon: 'home-outline',
                error: errors.address,
              })}

              {renderInput('Senha', password, (t) => {
                setPassword(t);
                if (errors.password) setErrors(e => ({ ...e, password: undefined }));
              }, {
                placeholder: 'Mínimo 6 caracteres',
                icon: 'lock-closed-outline',
                secureTextEntry: !showPassword,
                error: errors.password,
                rightElement: (
                  <Pressable onPress={() => setShowPassword(v => !v)}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="gray"
                    />
                  </Pressable>
                ),
              })}

              {renderInput('Confirmar senha', confirmPassword, (t) => {
                setConfirmPassword(t);
                if (errors.confirmPassword) setErrors(e => ({ ...e, confirmPassword: undefined }));
              }, {
                placeholder: 'Repita a senha',
                icon: 'lock-closed-outline',
                secureTextEntry: !showPassword,
                error: errors.confirmPassword,
              })}

              <Pressable
                onPress={handleRegister}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.button,
                  { opacity: pressed || isLoading ? 0.7 : 1 },
                ]}
                accessibilityLabel="Criar conta"
                accessibilityRole="button">
                {isLoading ? (
                  <Text style={styles.buttonText}>Cadastrando...</Text>
                ) : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={22} color="white" />
                    <Text style={styles.buttonText}>Criar Conta</Text>
                  </>
                )}
              </Pressable>
            </View>

            {/* Info sobre o programa */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color="#4A7C59" />
              <Text style={styles.infoText}>
                Ao se cadastrar, você participa do programa de descarte consciente e pode
                obter até <Text style={styles.infoHighlight}>15% de desconto</Text> na conta de água.
              </Text>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  backButton: { padding: Spacing.one },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerTitle: {
    fontSize: 22,
    color: '#2D5A3D',
    fontWeight: '600',
  },
  subtitle: {
    color: '#5A7A65',
    fontSize: 14,
    lineHeight: 20,
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
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    backgroundColor: '#E8F5E9',
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  infoText: {
    flex: 1,
    color: '#3D6B4A',
    fontSize: 13,
    lineHeight: 18,
  },
  infoHighlight: {
    fontWeight: 'bold',
    color: '#2D5A3D',
  },
});
