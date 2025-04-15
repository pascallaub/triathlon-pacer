import "react-native-gesture-handler"; // Muss ganz oben stehen
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "./src/screens/HomeScreen"; // Pfad anpassen, falls nötig
import CalculatorScreen from "./src/screens/CalculatorScreen"; // Pfad anpassen
import SavedPacesScreen from "./src/screens/SavedPaces"; // Importiere den neuen Screen

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Triathlon Pacer Home" }} // Optional: Titel für die Navigationsleiste
        />
        <Stack.Screen
          name="Calculator"
          component={CalculatorScreen}
          options={{ title: "Pace Rechner" }}
        />
        <Stack.Screen
          name="SavedPaces" // Dieser Name muss mit dem in navigation.navigate übereinstimmen
          component={SavedPacesScreen}
          options={{ title: "Gespeicherte Paces" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
