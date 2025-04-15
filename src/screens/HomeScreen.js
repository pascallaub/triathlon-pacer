import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

// Structure for Pace Sets: { id: string, name: string, totalTime: string, swim: {...}, t1: {...}, ... }

function HomeScreen({ navigation }) {
  const [savedPaceSets, setSavedPaceSets] = useState([]);
  const [showSavedPaces, setShowSavedPaces] = useState(false);

  // Function to load pace sets
  const loadPaceSets = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem("@savedPaceSets");
      const loadedSets = jsonValue != null ? JSON.parse(jsonValue) : [];
      loadedSets.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setSavedPaceSets(loadedSets);
    } catch (e) {
      console.error("Failed to load pace sets.", e);
      Alert.alert(
        "Fehler",
        "Gespeicherte Pace-Sets konnten nicht geladen werden."
      );
    }
  };

  // Load pace sets when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadPaceSets();
    }, [])
  );

  const handleDeletePaceSet = async (idToDelete) => {
    try {
      const currentSetsJson = await AsyncStorage.getItem("@savedPaceSets");
      let currentSets = currentSetsJson ? JSON.parse(currentSetsJson) : [];
      const updatedSets = currentSets.filter((set) => set.id !== idToDelete);
      await AsyncStorage.setItem("@savedPaceSets", JSON.stringify(updatedSets));
      setSavedPaceSets(updatedSets);
      Alert.alert("Erfolg", "Pace-Set erfolgreich gelöscht.");
    } catch (e) {
      console.error("Failed to delete pace set.", e);
      Alert.alert("Fehler", "Pace-Set konnte nicht gelöscht werden.");
    }
  };

  const confirmDeletePaceSet = (item) => {
    Alert.alert(
      "Pace-Set löschen",
      `Möchtest du das Set "${item.name}" wirklich löschen?`,
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Löschen",
          onPress: () => handleDeletePaceSet(item.id),
          style: "destructive",
        },
      ]
    );
  };

  // Function to navigate and load the selected pace set into the calculator
  const handleLoadPaceSet = (paceSet) => {
    navigation.navigate("Calculator", { selectedPaceSet: paceSet });
  };

  const renderPaceSetItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleLoadPaceSet(item)}>
      <View style={styles.paceItem}>
        <Text style={styles.paceSetName}>{item.name}</Text>
        <Text style={styles.paceText}>
          Gesamtzeit: {item.totalTime || "N/A"}
        </Text>
        <Text style={styles.timestampText}>
          Gespeichert: {new Date(item.createdAt).toLocaleString()}
        </Text>
        <View style={styles.itemButtonContainer}>
          <Button
            title="Laden"
            onPress={() => handleLoadPaceSet(item)}
            color="#007bff"
          />
          <Button
            title="Löschen"
            onPress={() => confirmDeletePaceSet(item)}
            color="#ff6347"
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Triathlon Pacer</Text>
      <View style={styles.buttonContainer}>
        <Button
          title="Rechner"
          onPress={() => navigation.navigate("Calculator")}
        />
      </View>

      {/* Button to toggle saved paces visibility */}
      <View style={styles.buttonContainer}>
        <Button
          title={
            showSavedPaces
              ? "Gespeicherte Pace-Sets ausblenden"
              : "Gespeicherte Pace-Sets anzeigen"
          }
          onPress={() => setShowSavedPaces(!showSavedPaces)}
        />
      </View>

      {/* Conditionally render saved pace sets list */}
      {showSavedPaces && (
        <View style={styles.listContainer}>
          <Text style={styles.savedPacesTitle}>Gespeicherte Pace-Sets</Text>
          {savedPaceSets.length > 0 ? (
            <FlatList
              data={savedPaceSets}
              renderItem={renderPaceSetItem}
              keyExtractor={(item) => item.id}
              style={styles.list}
            />
          ) : (
            <Text style={styles.noPacesText}>
              Noch keine Pace-Sets gespeichert.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 40,
  },
  buttonContainer: {
    marginVertical: 10,
    width: "80%",
  },
  listContainer: {
    flex: 1,
    width: "100%",
    marginTop: 20,
  },
  savedPacesTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  list: {
    width: "100%",
  },
  paceItem: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    marginHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  paceSetName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  paceText: {
    fontSize: 16,
    marginBottom: 5,
  },
  timestampText: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
    marginBottom: 10,
  },
  itemButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  noPacesText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#666",
  },
});

export default HomeScreen;
