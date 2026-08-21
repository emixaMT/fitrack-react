// app/seances/create/step1.tsx
import { useState } from 'react';
import { View, Text, Pressable, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { sportsMeta, SportKey } from '../../../../constants/sport';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../../../contexts/ThemeContext';
import * as Haptics from 'expo-haptics';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export default function Step1() {
    const router = useRouter();
    const { colors } = useTheme();
    const [selected, setSelected] = useState<SportKey | null>(null);

    const handleSelect = (key: SportKey) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelected(key);
    };

    const handleContinue = () => {
        if (!selected) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push({ pathname: '/seances/create/step2', params: { sport: selected } });
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            {/* Header avec retour + indicateur */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 }}>
                <Pressable
                    onPress={() => router.back()}
                    hitSlop={12}
                    style={{ padding: 8, borderRadius: 12, backgroundColor: colors.divider }}
                >
                    <Ionicons name="arrow-back" size={20} color={colors.text} />
                </Pressable>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 24, height: 4, borderRadius: 2, backgroundColor: colors.primary }} />
                    <View style={{ width: 24, height: 4, borderRadius: 2, backgroundColor: colors.divider }} />
                    <Text style={{ fontSize: 12, color: colors.textTertiary, marginLeft: 4 }}>1/2</Text>
                </View>
                <View style={{ width: 36 }} />
            </View>

            <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center' }}>
                <Text style={{ textAlign: 'center', fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 32 }}>
                    Choisis ton sport
                </Text>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 }}>
                    {(Object.keys(sportsMeta) as SportKey[]).map((key) => {
                        const meta = sportsMeta[key];
                        const active = selected === key;
                        return (
                            <Pressable
                                key={key}
                                onPress={() => handleSelect(key)}
                                style={{
                                    width: '47%', borderRadius: 16, padding: 20, alignItems: 'center',
                                    backgroundColor: active ? colors.primary + '15' : colors.card,
                                }}
                            >
                                <View style={{
                                    width: 56, height: 56, borderRadius: 16,
                                    backgroundColor: active ? colors.primary : colors.divider,
                                    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
                                }}>
                                    <Ionicons name={meta.icon as IoniconName} size={28} color={active ? '#fff' : colors.textSecondary} />
                                </View>
                                <Text style={{ fontSize: 15, fontWeight: active ? '700' : '500', color: active ? colors.primary : colors.textSecondary }}>
                                    {meta.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
            </View>

            {/* Barre sticky en bas */}
            <View style={{ paddingHorizontal: 24, paddingBottom: 16, paddingTop: 8 }}>
                <Pressable
                    disabled={!selected}
                    onPress={handleContinue}
                    style={{
                        borderRadius: 14, paddingVertical: 16, alignItems: 'center',
                        backgroundColor: selected ? colors.primary : colors.divider,
                    }}
                >
                    <Text style={{ color: selected ? '#fff' : colors.textTertiary, fontWeight: '700', fontSize: 16 }}>
                        Continuer
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}
