import React, { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/theme';

type SectionCardProps = PropsWithChildren<{
    title: string;
    subtitle?: string;
    action?: ReactNode;
}>;

export function SectionCard({ title, subtitle, action, children }: SectionCardProps) {
    const scheme = useColorScheme();
    const palette = Colors[scheme === 'dark' ? 'dark' : 'light'];

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: palette.backgroundElement,
                    borderColor: palette.backgroundSelected,
                },
            ]}>
            <View style={styles.header}>
                <View style={styles.titleWrap}>
                    <ThemedText type="subtitle">{title}</ThemedText>
                    {!!subtitle && <ThemedText type="small">{subtitle}</ThemedText>}
                </View>
                {action}
            </View>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 18,
        borderWidth: 1,
        padding: 16,
        gap: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    titleWrap: {
        gap: 4,
        flex: 1,
    },
});
