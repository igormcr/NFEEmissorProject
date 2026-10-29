import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    setBusy(true);
    try {
      if (isRegistering) await signUp(name, email, password);
      else await signIn(email, password);
    } catch (requestError) {
      const message = (requestError as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(message ?? 'Não foi possível concluir a autenticação.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ThemedText type="title">NFe Emissor</ThemedText>
        <ThemedText style={styles.subtitle}>{isRegistering ? 'Crie sua conta' : 'Entre na sua conta'}</ThemedText>
        {isRegistering && <TextInput value={name} onChangeText={setName} placeholder="Nome" style={styles.input} />}
        <TextInput value={email} onChangeText={setEmail} placeholder="E-mail" autoCapitalize="none" keyboardType="email-address" style={styles.input} />
        <TextInput value={password} onChangeText={setPassword} placeholder="Senha (mínimo 8 caracteres)" secureTextEntry style={styles.input} />
        {!!error && <ThemedText style={styles.error}>{error}</ThemedText>}
        <Pressable disabled={busy} onPress={submit} style={styles.button}>
          <ThemedText style={styles.buttonText}>{busy ? 'Aguarde...' : isRegistering ? 'Criar conta' : 'Entrar'}</ThemedText>
        </Pressable>
        <Pressable onPress={() => setIsRegistering((current) => !current)} style={styles.linkButton}>
          <ThemedText type="linkPrimary">{isRegistering ? 'Já tenho uma conta' : 'Criar uma conta'}</ThemedText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 16, maxWidth: 480, width: '100%', alignSelf: 'center' },
  subtitle: { opacity: 0.75 },
  input: { borderWidth: 1, borderColor: '#bdc8d8', borderRadius: 10, padding: 14, backgroundColor: '#fff' },
  button: { backgroundColor: '#1e5cad', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700' },
  linkButton: { alignItems: 'center', padding: 8 },
  error: { color: '#b42318' },
});
