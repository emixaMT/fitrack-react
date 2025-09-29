import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import { auth, db } from "../../../config/firebaseConfig";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import React from "react";

type Note = {
  id: string;
  content: string;
  createdAt?: any;
  id_user: string;
};

export default function NotesScreen() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "Notes"),
      where("id_user", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<Note, "id">),
      }));
      setNotes(items);
      setLoading(false);
    });

    return unsub;
  }, []);

  const formatDate = (ts?: any) => {
    if (!ts) return "";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const openNote = (note: Note) => {
    setSelectedNote(note);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedNote(null);
  };

  const handleDelete = (noteId: string) => {
    Alert.alert("Supprimer la note", "Cette action est définitive.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "Notes", noteId));
          } catch (e) {
            Alert.alert("Erreur", "Impossible de supprimer la note.");
          }
        },
      },
    ]);
  };

  return (
    <>
      <ScrollView className="flex h-full relative bg-white">
        {/* Bannière */}
        <View className="flex relative justify-center items-center">
          <LinearGradient
            colors={["#818cf8", "#4f46e5"]}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 200,
              zIndex: 0,
            }}
          />
        </View>
        <Text className="text-white top-32 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl absolute z-20 font-bold">
          Notes
        </Text>

        {/* Contenu */}
        <View className="flex h-full pt-12 px-6 bg-white mt-48 flex-col gap-4 pb-20">
          {loading && (
            <View className="flex-1 items-center justify-center py-10">
              <ActivityIndicator size="large" color="#4f46e5" />
            </View>
          )}

          {!loading && notes.length === 0 && (
            <View className="py-10 flex-1 justify-center">
              <Text className="text-gray-500 text-center">
                Aucune note pour le moment.
              </Text>
            </View>
          )}

          {!loading &&
            notes.length > 0 &&
            notes.map((n) => (
              <Pressable
                key={n.id}
                className="bg-white rounded-2xl shadow-md shadow-indigo-200 p-4 active:opacity-90"
                onPress={() => openNote(n)}
                onLongPress={() => handleDelete(n.id)}
                delayLongPress={300}
              >
                <Text className="text-xs text-indigo-500 mb-1">
                  {formatDate(n.createdAt)}
                </Text>
                <Text className="text-gray-800 font-medium" numberOfLines={3}>
                  {n.content}
                </Text>
              </Pressable>
            ))}
        </View>
      </ScrollView>

      {/* FAB */}
      <Pressable onPress={() => router.push("/notes/create")}>
        <View className="absolute bottom-8 right-8 bg-indigo-600 rounded-full p-4 shadow-lg shadow-indigo-500">
          <Ionicons name="add" size={24} color="white" />
        </View>
      </Pressable>

      {/* Modal de lecture */}
      <Modal
        transparent
        animationType="fade"
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-center px-6"
          onPress={closeModal}
        >
          <Pressable
            className="bg-white rounded-2xl p-5 max-h-[70%]"
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-xs text-indigo-500">
                {selectedNote ? formatDate(selectedNote.createdAt) : ""}
              </Text>
              <Pressable onPress={closeModal} className="p-1">
                <Ionicons name="close" size={22} color="#6b7280" />
              </Pressable>
            </View>

            <ScrollView>
              <Text className="text-gray-900 leading-6">
                {selectedNote?.content}
              </Text>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
