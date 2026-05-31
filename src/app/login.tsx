/**
 * EcoPoint - Tela de Login
 * Autenticação para moradores, motoristas, agentes e administradores.
 * Fluxo de estados: idle → validating → authenticated | error
 */
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import db from '@/data/db';
import { validateEmail } from '@/utils/validators';
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

type LoginState = 'idle' | 'loading' | 'error';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginState, setLoginState] = useState<LoginState>('idle');
  const [emailError, setEmailError] = useState('');
  const router = useRouter();

  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError('');
    if (loginState === 'error') setLoginState('idle');
  };

  const handleLogin = () => {
    // Validação com expressão regular
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setEmailError(emailValidation.message);
      return;
    }
    if (!password) {
      Alert.alert('Atenção', 'Informe sua senha.');
      return;
    }

    setLoginState('loading');

    // Simula latência de rede
    setTimeout(() => {
      const user = db.findUserByEmail(email);

      if (user && user.password === password) {
        setLoginState('idle');
        // Redireciona conforme perfil (máquina de estados)
        switch (user.role) {
          case 'driver':
            router.push('/route-selection');
            break;
          case 'admin':
            router.push('/discount-control');
            break;
          case 'agent':
            router.push('/residence-registration');
            break;
          case 'resident':
            router.push('/home-user');
            break;
        }
      } else {
        setLoginState('error');
      }
    }, 500);
  };

  const isLoading = loginState === 'loading';

  return (
    <ThemedView style={[styles.container, { backgroundColor: '#F0FFF4' }]}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">

            {/* Logo e título */}
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <Ionicons name="leaf" size={48} color="white" />
              </View>
              <ThemedText type="title" style={styles.appTitle}>EcoPoint</ThemedText>
              <ThemedText style={styles.appSubtitle}>
                Descarte consciente, cidade sustentável
              </ThemedText>
            </View>

            {/* Card de login */}
            <View style={[styles.card, { backgroundColor: colors.background }]}>
              <ThemedText style={styles.cardTitle}>
                Acesse sua conta
              </ThemedText>

              {/* Campo email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={[
                  styles.inputWrapper,
                  emailError ? styles.inputError : null,
                  loginState === 'error' ? styles.inputError : null,
                ]}>
                  <Ionicons name="mail-outline" size={20} color="gray" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="seu@email.com"
                    placeholderTextColor="gray"
                    value={email}
                    onChangeText={handleEmailChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                    accessibilityLabel="Campo de email"
                  />
                </View>
                {emailError ? (
                  <Text style={styles.errorText}>{emailError}</Text>
                ) : null}
              </View>

              {/* Campo senha */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Senha</Text>
                <View style={[
                  styles.inputWrapper,
                  loginState === 'error' ? styles.inputError : null,
                ]}>
                  <Ionicons name="lock-closed-outline" size={20} color="gray" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="gray"
                    value={password}
                    onChangeText={(t) => {
                      setPassword(t);
                      if (loginState === 'error') setLoginState('idle');
                    }}
                    secureTextEntry={!showPassword}
                    editable={!isLoading}
                    accessibilityLabel="Campo de senha"
                  />
                  <Pressable
                    onPress={() => setShowPassword(v => !v)}
                    accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="gray"
                    />
                  </Pressable>
                </View>
              </View>

              {/* Mensagem de erro de login */}
              {loginState === 'error' && (
                <View style={styles.errorBanner}>
                  <Ionicons name="alert-circle-outline" size={16} color="#D9534F" />
                  <Text style={styles.errorBannerText}>Email ou senha incorretos.</Text>
                </View>
              )}

              {/* Botão entrar */}
              <Pressable
                onPress={handleLogin}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.button,
                  { opacity: pressed || isLoading ? 0.7 : 1 },
                ]}
                accessibilityLabel="Entrar no aplicativo"
                accessibilityRole="button">
                {isLoading ? (
                  <ThemedText style={styles.buttonText}>Entrando...</ThemedText>
                ) : (
                  <>
                    <Ionicons name="log-in-outline" size={22} color="white" />
                    <Text style={styles.buttonText}>Entrar</Text>
                  </>
                )}
              </Pressable>

              {/* Link para cadastro */}
              <Pressable
                onPress={() => router.push('/cadastro')}
                accessibilityLabel="Criar nova conta">
                <Text style={styles.registerLink}>
                  Não tem conta?{' '}
                  <Text style={styles.registerLinkBold}>Cadastre-se</Text>
                </Text>
              </Pressable>
            </View>

            {/* Dicas de acesso */}
            <View style={styles.hintsContainer}>
              <Text style={styles.hintsTitle}>Acessos de demonstração:</Text>
              <Text style={styles.hintItem}>🏠 Morador: maria@email.com / morador123</Text>
              <Text style={styles.hintItem}>🚛 Motorista: motorista@ecoleta.mga.br / senha123</Text>
              <Text style={styles.hintItem}>⚙️ Admin: admin@ecoleta.mga.br / admin123</Text>
              <Text style={styles.hintItem}>👤 Agente: agente@ecoleta.mga.br / agente123</Text>
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
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.four,
  },
  logoContainer: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#4A7C59',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A7C59',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  appTitle: {
    color: '#2D5A3D',
    fontSize: 36,
    fontWeight: '700',
  },
  appSubtitle: {
    color: '#5A7A65',
    textAlign: 'center',
    fontSize: 14,
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.one,
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
  inputError: {
    borderColor: '#D9534F',
  },
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: '#FFF0F0',
    borderRadius: Spacing.two,
    padding: Spacing.two,
    borderWidth: 1,
    borderColor: '#FFCCCC',
  },
  errorBannerText: {
    color: '#D9534F',
    fontSize: 14,
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
  registerLink: {
    textAlign: 'center',
    color: 'gray',
    fontSize: 14,
  },
  registerLinkBold: {
    color: '#4A7C59',
    fontWeight: 'bold',
  },
  hintsContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  hintsTitle: {
    fontWeight: 'bold',
    color: '#2D5A3D',
    marginBottom: Spacing.one,
    fontSize: 13,
  },
  hintItem: {
    color: '#3D6B4A',
    fontSize: 12,
  },
});
