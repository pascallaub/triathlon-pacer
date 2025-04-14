import React from "react";
import { View, Text, Button, StyleSheet } from "react-native";

function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Triathlon Pacer</Text>
      <View style={styles.buttonContainer}>
        <Button
          title="Rechner"
          onPress={() => navigation.navigate("Calculator")}
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title="Statistik"
          onPress={() => navigation.navigate("Statistics")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
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
});

export default HomeScreen;
