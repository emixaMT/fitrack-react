// app/seances/create/step1.tsx
import { useState } from 'react';
import { View, Text, Pressable, SafeAreaView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { sportsMeta, SportKey } from '../../../../constants/sport';
import { getTemplatesByCategory, WorkoutTemplate } from '../../../../constants/workoutTemplates';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../../../../contexts/ThemeContext';
import * as Haptics from 'expo-haptics';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const DIFFICULTY_COLORS: Record<string, string> = {
  'Débutant': '#10B981',
  'Intermédiaire': '#F59E0B',
  'Avancé': '#EF4444',
};

export default function Step1() {
    const router = useRouter();
    const { colors } = useTheme();
    const [selected, setSelected] = useState<SportKey | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<WorkoutTemplate | null>(null);

    const templates = selected ? getTemplatesByCategory(selected) : [];

    const handleSelectSport = (key: SportKey) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelected(key);
        setSelectedTemplate(null);
    };

    const handleSelectTemplate = (template: WorkoutTemplate) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedTemplate(template);
    };

    const handleContinue = () => {
        if (!selected) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const params: Record<string, string> = { sport: selected };
        if (selectedTemplate) {
            params.templateId = selectedTemplate.id;
        }
        router.push({ pathname: '/seances/create/step2', params });
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

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                <Text style={{ textAlign: 'center', fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 24 }}>
                    Choisis ton sport
                </Text>

                {/* Grille des sports */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16, marginBottom: 32 }}>
                    {(Object.keys(sportsMeta) as SportKey[]).map((key) => {
                        const meta = sportsMeta[key];
                        const active = selected === key;
                        return (
                            <Pressable
                                key={key}
                                onPress={() => handleSelectSport(key)}
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

                {/* Templates du sport sélectionné */}
                {selected && templates.length > 0 && (
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text }}>
                                Templates
                            </Text>
                            <Pressable
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setSelectedTemplate(null);
                                }}
                                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: selectedTemplate ? colors.divider : 'transparent' }}
                            >
                                <Text style={{ fontSize: 13, color: selectedTemplate ? colors.textSecondary : colors.textTertiary, fontWeight: '500' }}>
                                    Séance libre
                                </Text>
                            </Pressable>
                        </View>

                        {templates.map((template) => {
                            const active = selectedTemplate?.id === template.id;
                            const diffColor = DIFFICULTY_COLORS[template.difficulty] ?? colors.textTertiary;
                            return (
                                <Pressable
                                    key={template.id}
                                    onPress={() => handleSelectTemplate(template)}
                                    style={{
                                        borderRadius: 16, padding: 16, marginBottom: 10,
                                        backgroundColor: active ? colors.primary + '12' : colors.card,
                                        borderWidth: 1,
                                        borderColor: active ? colors.primary + '40' : 'transparent',
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
                                                {template.name}
                                            </Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                                <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: colors.primary + '18' }}>
                                                    <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '600' }}>
                                                        {template.type}
                                                    </Text>
                                                </View>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                                    <Ionicons name="time-outline" size={12} color={colors.textTertiary} />
                                                    <Text style={{ fontSize: 11, color: colors.textTertiary }}>{template.duration}</Text>
                                                </View>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: diffColor }} />
                                                    <Text style={{ fontSize: 11, color: colors.textTertiary }}>{template.difficulty}</Text>
                                                </View>
                                            </View>
                                        </View>
                                        {active && (
                                            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                                                <Ionicons name="checkmark" size={16} color="#fff" />
                                            </View>
                                        )}
                                    </View>
                                    <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18 }}>
                                        {template.description}
                                    </Text>
                                    {template.exercices && (
                                        <Text style={{ fontSize: 12, color: colors.textTertiary, marginTop: 8 }}>
                                            {template.exercices.length} exercices
                                        </Text>
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>
                )}
            </ScrollView>

            {/* Barre sticky en bas */}
            <View style={{ paddingHorizontal: 24, paddingBottom: 16, paddingTop: 8, backgroundColor: colors.background }}>
                <Pressable
                    disabled={!selected}
                    onPress={handleContinue}
                    style={{
                        borderRadius: 14, paddingVertical: 16, alignItems: 'center',
                        backgroundColor: selected ? colors.primary : colors.divider,
                    }}
                >
                    <Text style={{ color: selected ? '#fff' : colors.textTertiary, fontWeight: '700', fontSize: 16 }}>
                        {selectedTemplate ? 'Utiliser ce template' : 'Continuer'}
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}
