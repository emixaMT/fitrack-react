import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, TouchableOpacity } from 'react-native';
import { supabase } from '../config/supabaseConfig';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../contexts/ThemeContext';

interface ChallengeCalendarProps {
  userId: string | null;
}

interface CompletedChallenge {
  day_of_year: number;
  completed_at: string;
}

const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const DAYS_SHORT = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export const ChallengeCalendar: React.FC<ChallengeCalendarProps> = ({ userId }) => {
  const [completedDays, setCompletedDays] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()); // 0-11
  const currentYear = new Date().getFullYear();
  const { colors } = useTheme();

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchCompletedChallenges = async () => {
      const currentYear = new Date().getFullYear();

      const { data, error } = await supabase
        .from('completed_challenges')
        .select('day_of_year, completed_at')
        .eq('user_id', userId)
        .eq('year', currentYear);

      if (!error && data) {
        const days = new Set(data.map((item: CompletedChallenge) => item.day_of_year));
        setCompletedDays(days);
      }
      setLoading(false);
    };

    fetchCompletedChallenges();

    // S'abonner aux changements en temps réel
    const channel = supabase
      .channel(`challenges-calendar-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'completed_challenges',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchCompletedChallenges();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  const completedCount = completedDays.size;
  const percentage = Math.round((completedCount / 365) * 100);

  // Convertir une date en jour de l'année (méthode simple sans timestamps)
  const getDayOfYear = (date: Date): number => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    let dayCount = 0;
    
    // Jours dans chaque mois
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    
    // Ajuster pour année bissextile
    if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
      daysInMonth[1] = 29;
    }
    
    // Compter les jours des mois complets
    for (let i = 0; i < month; i++) {
      dayCount += daysInMonth[i];
    }
    
    // Ajouter les jours du mois actuel
    return dayCount + day;
  };

  // Générer le calendrier du mois
  const renderMonthCalendar = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Premier jour de la semaine (0 = dimanche, 1 = lundi, etc.)
    let firstDayOfWeek = firstDay.getDay();
    // Convertir dimanche (0) en 7 pour avoir lundi = 1
    firstDayOfWeek = firstDayOfWeek === 0 ? 7 : firstDayOfWeek;
    
    const weeks: (number | null)[][] = [];
    let currentWeek: (number | null)[] = [];
    
    // Remplir les jours vides avant le début du mois
    for (let i = 1; i < firstDayOfWeek; i++) {
      currentWeek.push(null);
    }
    
    // Remplir les jours du mois
    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      
      if (currentWeek.length === 7) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    }
    
    // Remplir les jours vides après la fin du mois
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normaliser à minuit pour éviter les problèmes d'heure
    const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;
    const todayDate = new Date().getDate(); // Date du jour sans normalisation pour la comparaison

    return (
      <View className="mt-4">
        {/* Navigation mois */}
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity
            onPress={() => setCurrentMonth(prev => (prev === 0 ? 11 : prev - 1))}
            className="p-2"
          >
            <Ionicons name="chevron-back" size={24} color="#4f46e5" />
          </TouchableOpacity>
          
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#4f46e5' }}>
            {MONTHS[currentMonth]} {currentYear}
          </Text>
          
          <TouchableOpacity
            onPress={() => setCurrentMonth(prev => (prev === 11 ? 0 : prev + 1))}
            className="p-2"
          >
            <Ionicons name="chevron-forward" size={24} color="#4f46e5" />
          </TouchableOpacity>
        </View>

        {/* En-têtes des jours */}
        <View className="flex-row mb-2">
          {DAYS_SHORT.map((day, index) => (
            <View key={index} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#4f46e5' }}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Grille du calendrier */}
        <View className="gap-1">
          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} className="flex-row gap-1">
              {week.map((day, dayIndex) => {
                if (day === null) {
                  return <View key={dayIndex} style={{ flex: 1, aspectRatio: 1 }} />;
                }

                const date = new Date(currentYear, currentMonth, day, 0, 0, 0, 0);
                const dayOfYear = getDayOfYear(date);
                const isCompleted = completedDays.has(dayOfYear);
                const isToday = isCurrentMonth && day === todayDate;
                const isPast = date < today && !isToday;

                return (
                  <View
                    key={dayIndex}
                    style={{
                      flex: 1,
                      aspectRatio: 1,
                      backgroundColor: isCompleted
                        ? '#4f46e5'
                        : isToday
                        ? '#fbbf24'
                        : isPast
                        ? '#c4b4ff'
                        : '#f3f4f6',
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: isToday ? 2 : 0,
                      borderColor: '#f59e0b',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: isToday ? '700' : '500',
                        color: isCompleted ? '#ffffff' : isToday ? '#ffffff' : '#1f2937',
                      }}
                    >
                      {day}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Légende */}
        <View className="flex-row gap-4 mt-4 flex-wrap">
          <View className="flex-row items-center gap-1">
            <View style={{ width: 16, height: 16, backgroundColor: '#4f46e5', borderRadius: 4 }} />
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Complété</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View style={{ width: 16, height: 16, backgroundColor: '#fbbf24', borderRadius: 4, borderWidth: 2, borderColor: '#f59e0b' }} />
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Aujourd'hui</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <View style={{ width: 16, height: 16, backgroundColor: '#c4b4ff', borderRadius: 4 }} />
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>Manqué</Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{ backgroundColor: colors.card, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, padding: 20 }}>
        <Text style={{ color: colors.textSecondary }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, padding: 20, marginVertical: 24 }}>
      {/* Header avec stats */}
      <View className="flex-row justify-between items-center mb-4">
        <View>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#4f46e5' }}>{completedCount} défis</Text>
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>sur 365 jours</Text>
        </View>
        <View className="items-center">
          <Text style={{ fontSize: 32, fontWeight: 'bold', color:'#4f46e5' }}>{percentage}%</Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>complété</Text>
        </View>
      </View>

      {/* Calendrier */}
      {renderMonthCalendar()}
    </View>
  );
};
