// app/seances/create/step1.tsx
import { useState } from 'react';
import { View, Text, Pressable, Image, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { sportsMeta, SportKey } from '../../../../constantes/sport';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function Step1() {
    const router = useRouter();
    const [selected, setSelected] = useState<SportKey | null>(null);

    return (
        <SafeAreaView className="w-full flex-col flex-1 bg-white px-6 py-8 justify-center">
            <Pressable onPress={() => router.push('/workout')} className="p-2 rounded-full bg-gray-100 absolute top-16 left-4">
                <Ionicons name="arrow-back" size={20} color="#111827" />
            </Pressable>
            <Text className="text-center px-4 text-2xl font-semibold text-indigo-900 mb-6">Choisis ton sport</Text>

            <View className="flex-row flex-wrap justify-between gap-4 px-4">
                {(Object.keys(sportsMeta) as SportKey[]).map((key) => {
                    const meta = sportsMeta[key];
                    const active = selected === key;
                    return (
                        <Pressable
                            key={key}
                            onPress={() => setSelected(key)}
                            className={`w-[45%] rounded-2xl border p-4 items-center ${active ? 'bg-indigo-50 border-indigo-300' : 'border-gray-200'
                                }`}
                        >
                            <Image source={meta.image} className="w-16 h-16 mb-2" resizeMode="contain" />
                            <Text className={active ? 'text-indigo-600 font-semibold' : 'text-gray-700'}>
                                {meta.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            <Pressable
                disabled={!selected}
                onPress={() => router.push({ pathname: '/seances/create/step2', params: { sport: selected! } })}
                className="px-4 mt-10" // place le bouton
            >
                <View className={`rounded-2xl py-4 px-6 ${selected ? 'bg-indigo-600' : 'bg-indigo-300'}`}>
                    <Text className="text-center text-white font-semibold">Continuer</Text>
                </View>
            </Pressable>
        </SafeAreaView>
    );
}
