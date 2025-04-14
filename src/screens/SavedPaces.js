import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native"; // Import useFocusEffect

function SavedPacesScreen({ navigation }) {
  const [savedPaces, setSavedPaces] = useState([]);

  const loadSavedPaces = useCallback(async () => {
    try {
      const existingSetsJSON = await AsyncStorage.getItem("@savedPaceSets");
      const existingSets = existingSetsJSON ? JSON.parse(existingSetsJSON) : [];
      // Sort by creation date, newest first
      existingSets.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setSavedPaces(existingSets);
    } catch (e) {
      console.error("Failed to load paces:", e);
      Alert.alert(
        "Fehler",
        "Laden der gespeicherten Pace-Sets fehlgeschlagen."
      );
    }
  }, []);

  // useFocusEffect runs the effect when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadSavedPaces();
      // Optional: Return a cleanup function if needed
      return () => {};
    }, [loadSavedPaces])
  );

  const deletePaceSet = async (idToDelete) => {
    try {
      const updatedSets = savedPaces.filter((set) => set.id !== idToDelete);
      await AsyncStorage.setItem("@savedPaceSets", JSON.stringify(updatedSets));
      setSavedPaces(updatedSets); // Update state to reflect deletion
      Alert.alert("Erfolg", "Pace-Set wurde gelöscht.");
    } catch (e) {
      console.error("Failed to delete pace set:", e);
      Alert.alert("Fehler", "Löschen des Pace-Sets fehlgeschlagen.");
    }
  };

  const handleDelete = (id, name) => {
    Alert.alert(
      "Löschen bestätigen",
      `Möchtest du das Pace-Set "${name}" wirklich löschen?`,
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Löschen",
          onPress: () => deletePaceSet(id),
          style: "destructive",
        },
      ],
      { cancelable: false }
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemTime}>
          Gesamtzeit: {item.totalTime || "N/A"}
        </Text>
        {/* Optional: Display more details like creation date */}
        {/* <Text style={styles.itemDate}>Gespeichert: {new Date(item.createdAt).toLocaleDateString()}</Text> */}
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDelete(item.id, item.name)}
      >
        <Text style={styles.deleteButtonText}>Löschen</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gespeicherte Pace-Sets</Text>
      {savedPaces.length === 0 ? (
        <Text style={styles.emptyText}>Noch keine Pace-Sets gespeichert.</Text>
      ) : (
        <FlatList
          data={savedPaces}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
        />
      )}
      <Button title="Zurück zum Rechner" onPress={() => navigation.goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f0f0f0",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  list: {
    flex: 1,
  },
  itemContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  itemTextContainer: {
    flex: 1, // Take available space
    marginRight: 10, // Add some space before the button
  },
  itemName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  itemTime: {
    fontSize: 16,
    color: "#555",
    marginTop: 4,
  },
  itemDate: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  deleteButton: {
    backgroundColor: "#ff4d4d", // Red color for delete
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
    color: "#666",
  },
});

export default SavedPacesScreen;
