// app/seances/create/step1.tsx
import { useState } from 'react';
import { View, Text, Pressable, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { sportsMeta, SportKey } from '../../../../constants/sport';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../../../contexts/ThemeContext';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export default function Step1() {
    const router = useRouter();
    const { colors } = useTheme();
    const [selected, setSelected] = useState<SportKey | null>(null);

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, paddingHorizontal: 24, paddingVertical: 32, justifyContent: 'center' }}>
            <Pressable onPress={() => router.push('/workout')} style={{ position: 'absolute', top: 60, left: 16, padding: 8, borderRadius: 12, backgroundColor: colors.divider }}>
                <Ionicons name="arrow-back" size={20} color={colors.text} />
            </Pressable>
            <Text style={{ textAlign: 'center', fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 24 }}>Choisis ton sport</Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16, paddingHorizontal: 8 }}>
                {(Object.keys(sportsMeta) as SportKey[]).map((key) => {
                    const meta = sportsMeta[key];
                    const active = selected === key;
                    return (
                        <Pressable
                            key={key}
                            onPress={() => setSelected(key)}
                            style={{
                                width: '47%', borderRadius: 16, padding: 20, alignItems: 'center',
                                backgroundColor: active ? colors.divider : colors.card,
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

            <Pressable
                disabled={!selected}
                onPress={() => router.push({ pathname: '/seances/create/step2', params: { sport: selected! } })}
                style={{ paddingHorizontal: 16, marginTop: 40 }}
            >
                <View style={{
                    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
                    backgroundColor: selected ? colors.primary : colors.divider,
                }}>
                    <Text style={{ color: selected ? '#fff' : colors.textTertiary, fontWeight: '700', fontSize: 16 }}>Continuer</Text>
                </View>
            </Pressable>
        </SafeAreaView>
    );
}
