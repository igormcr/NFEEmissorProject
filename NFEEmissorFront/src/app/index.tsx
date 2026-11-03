import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SectionCard } from '@/components/section-card';
import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { localCertificates } from '@/lib/certificate-catalog';
import { loadCertificateInfo } from '@/lib/certificate-storage';
import { CertificateInfo } from '@/types/nfe';

const quickActions = [
  { label: 'Clientes', href: '/clientes' },
  { label: 'Emitir NFe', href: '/emitir' },
  { label: 'Consultar NFe', href: '/consultar' },
  { label: 'Status de processamento', href: '/status' },
  { label: 'Ações NFe', href: '/acoes' },
] as const;

export default function HomeScreen() {
  const { signOut } = useAuth();
  const [certificates, setCertificates] = useState<CertificateInfo[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      loadCertificateInfo().then((config) => {
        if (active) {
          setCertificates(config);
        }
      });

      return () => {
        active = false;
      };
    }, []),
  );

  const background = Colors.light.background;
  const certificateReady = certificates.some((certificate) => certificate.status === 'active');
  const hasConfiguredCertificate = certificates.length > 0;
  const configuredLocalNames = new Set(
    certificates
      .filter((certificate) => certificate.localFileName)
      .map((certificate) => certificate.localFileName),
  );
  const customCertificates = certificates.filter(
    (certificate) =>
      !certificate.localFileName &&
      !localCertificates.some((localCertificate) => localCertificate.name === certificate.subject),
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <ThemedText type="title">NFe Emissor</ThemedText>
        <ThemedText type="default" style={styles.subtitle}>
          Integração com o backend para emissão, consulta e operações fiscais.
        </ThemedText>
        <Pressable onPress={signOut} style={styles.logoutButton}>
          <ThemedText type="linkPrimary">Sair</ThemedText>
        </Pressable>

        <SectionCard
          title="Certificado digital"
          subtitle={
            hasConfiguredCertificate
              ? 'Certificados carregados com senha configurada.'
              : 'Nenhum certificado com senha configurada.'
          }
          action={
            <Link href="/certificado" asChild>
              <Pressable style={styles.inlineButton}>
                <ThemedText type="linkPrimary">Configurar</ThemedText>
              </Pressable>
            </Link>
          }>
          <View style={styles.rowBetween}>
            <ThemedText type="small">Status</ThemedText>
            <ThemedText type="small" style={styles.statusPill}>
              {certificateReady ? 'Ativo' : 'Pendente'}
            </ThemedText>
          </View>
          <View style={styles.certificateList}>
            {localCertificates.map((certificate) => {
              const configured = configuredLocalNames.has(certificate.name);

              return (
                <View key={certificate.name} style={styles.certificateRow}>
                  <ThemedText type="smallBold" style={styles.certificateName}>
                    {certificate.name}
                  </ThemedText>
                  <ThemedText type="small" style={configured ? styles.configured : styles.notConfigured}>
                    {configured ? 'Senha configurada' : 'Senha não configurada'}
                  </ThemedText>
                </View>
              );
            })}
            {customCertificates.map((certificate) => (
              <View key={certificate.id} style={styles.certificateRow}>
                <ThemedText type="smallBold" style={styles.certificateName}>
                  {certificate.subject ?? 'Certificado personalizado'}
                </ThemedText>
                <ThemedText type="small" style={styles.configured}>
                  Senha configurada
                </ThemedText>
              </View>
            ))}
          </View>
        </SectionCard>

        <SectionCard title="Ações rápidas" subtitle="Principais operações do fluxo da NFe.">
          <View style={styles.grid}>
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href} asChild>
                <Pressable style={styles.actionButton}>
                  <ThemedText type="smallBold">{action.label}</ThemedText>
                </Pressable>
              </Link>
            ))}
          </View>
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    padding: 24,
    gap: 20,
  },
  subtitle: {
    opacity: 0.8,
    marginTop: -8,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#cde3ff',
    color: '#0b3d91',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#dfeafc',
    minWidth: 150,
    alignItems: 'center',
  },
  inlineButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  logoutButton: {
    alignSelf: 'flex-end',
    paddingVertical: 6,
  },
  certificateList: {
    gap: 10,
    marginTop: 16,
  },
  certificateRow: {
    gap: 2,
    paddingVertical: 4,
  },
  certificateName: {
    flexShrink: 1,
  },
  configured: {
    color: '#237a43',
  },
  notConfigured: {
    color: '#52627a',
  },
});
