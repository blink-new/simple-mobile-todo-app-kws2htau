
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Pressable,
  SafeAreaView,
  StatusBar,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Check, Plus, Trash2, Pencil } from "lucide-react-native";
import { useFonts, Raleway_700Bold, Raleway_400Regular } from "@expo-google-fonts/raleway";

const STORAGE_KEY = "BLINK_TODO_LIST_V1";

type Todo = {
  id: string;
  text: string;
  completed: boolean;
};

const ACCENT = "#6C63FF";
const BG = "#F6F7FB";
const CARD = "#fff";
const CARD_SHADOW = "#E0E3EB";
const TEXT = "#22223B";
const TEXT_FADED = "#9A9CB4";
const DANGER = "#FF6B6B";
const PLACEHOLDER = "#BDBDD7";

function uuid() {
  return Math.random().toString(36).substring(2, 10) + Date.now();
}

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fontsLoaded] = useFonts({
    Raleway_700Bold,
    Raleway_400Regular,
  });

  // Animation for FAB
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadTodos();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  }, [todos]);

  const loadTodos = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) setTodos(JSON.parse(data));
    } catch (e) {}
  };

  const openAddModal = () => {
    setEditingId(null);
    setInput("");
    setModalVisible(true);
  };

  const openEditModal = (todo: Todo) => {
    setEditingId(todo.id);
    setInput(todo.text);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (input.trim() === "") return;
    if (editingId) {
      setTodos((prev) =>
        prev.map((t) =>
          t.id === editingId ? { ...t, text: input.trim() } : t
        )
      );
    } else {
      setTodos((prev) => [
        { id: uuid(), text: input.trim(), completed: false },
        ...prev,
      ]);
    }
    setModalVisible(false);
    setInput("");
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const handleToggle = (id: string) => {
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      )
    );
  };

  const animateFab = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.15,
        duration: 120,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }),
    ]).start();
  };

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: BG }} />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={BG} />
      <View style={styles.container}>
        <Text style={styles.title}>My Todos</Text>
        {todos.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No todos yet!</Text>
            <Text style={styles.emptySub}>
              Tap the <Text style={{ color: ACCENT }}>+</Text> to add your first task.
            </Text>
          </View>
        ) : (
          <FlatList
            data={todos}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 120 }}
            renderItem={({ item }) => (
              <TodoCard
                todo={item}
                onToggle={() => handleToggle(item.id)}
                onDelete={() => handleDelete(item.id)}
                onEdit={() => openEditModal(item)}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Floating Action Button */}
        <Animated.View
          style={[
            styles.fabContainer,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.fab}
            onPress={() => {
              animateFab();
              openAddModal();
            }}
            accessibilityLabel="Add Todo"
          >
            <Plus color="#fff" size={28} />
          </TouchableOpacity>
        </Animated.View>

        {/* Add/Edit Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalOverlay}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {editingId ? "Edit Todo" : "Add Todo"}
              </Text>
              <TextInput
                style={styles.input}
                placeholder="What needs to be done?"
                placeholderTextColor={PLACEHOLDER}
                value={input}
                onChangeText={setInput}
                autoFocus
                maxLength={80}
                onSubmitEditing={handleSave}
                returnKeyType="done"
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.saveBtn,
                    { opacity: input.trim() ? 1 : 0.5 },
                  ]}
                  onPress={handleSave}
                  disabled={!input.trim()}
                >
                  <Text style={styles.saveText}>
                    {editingId ? "Save" : "Add"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

function TodoCard({
  todo,
  onToggle,
  onDelete,
  onEdit,
}: {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
      <Pressable
        style={styles.cardContent}
        onPress={onToggle}
        accessibilityLabel={
          todo.completed ? "Mark as incomplete" : "Mark as complete"
        }
      >
        <View
          style={[
            styles.checkbox,
            todo.completed && { backgroundColor: ACCENT, borderColor: ACCENT },
          ]}
        >
          {todo.completed && <Check color="#fff" size={18} />}
        </View>
        <Text
          style={[
            styles.cardText,
            todo.completed && styles.cardTextCompleted,
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {todo.text}
        </Text>
      </Pressable>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={onEdit}
          accessibilityLabel="Edit Todo"
        >
          <Pencil color={ACCENT} size={20} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={onDelete}
          accessibilityLabel="Delete Todo"
        >
          <Trash2 color={DANGER} size={20} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  title: {
    fontFamily: "Raleway_700Bold",
    fontSize: 32,
    color: TEXT,
    marginBottom: 18,
    letterSpacing: 0.5,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    marginTop: 80,
  },
  emptyText: {
    fontFamily: "Raleway_700Bold",
    fontSize: 22,
    color: TEXT_FADED,
    marginBottom: 8,
  },
  emptySub: {
    fontFamily: "Raleway_400Regular",
    fontSize: 16,
    color: TEXT_FADED,
  },
  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: CARD_SHADOW,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.13,
    shadowRadius: 6,
    elevation: 2,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: ACCENT,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    transition: "background-color 0.2s",
  },
  cardText: {
    fontFamily: "Raleway_400Regular",
    fontSize: 18,
    color: TEXT,
    flex: 1,
  },
  cardTextCompleted: {
    color: TEXT_FADED,
    textDecorationLine: "line-through",
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  iconBtn: {
    padding: 6,
    marginLeft: 2,
  },
  fabContainer: {
    position: "absolute",
    right: 28,
    bottom: 38,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  fab: {
    backgroundColor: ACCENT,
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(34,34,59,0.13)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    width: "88%",
    backgroundColor: CARD,
    borderRadius: 18,
    padding: 24,
    shadowColor: "#22223B",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  modalTitle: {
    fontFamily: "Raleway_700Bold",
    fontSize: 22,
    color: TEXT,
    marginBottom: 18,
    textAlign: "center",
  },
  input: {
    fontFamily: "Raleway_400Regular",
    fontSize: 18,
    color: TEXT,
    backgroundColor: BG,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 22,
    borderWidth: 1.5,
    borderColor: "#E0E3EB",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  cancelText: {
    fontFamily: "Raleway_400Regular",
    fontSize: 16,
    color: TEXT_FADED,
  },
  saveBtn: {
    backgroundColor: ACCENT,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 22,
  },
  saveText: {
    fontFamily: "Raleway_700Bold",
    fontSize: 16,
    color: "#fff",
    letterSpacing: 0.5,
  },
});