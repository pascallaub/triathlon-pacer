import "react-native-gesture-handler"; // Muss ganz oben stehen
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "./src/screens/HomeScreen"; // Pfad anpassen, falls nötig
import CalculatorScreen from "./src/screens/CalculatorScreen"; // Pfad anpassen
import StatisticsScreen from "./src/screens/StatisticsScreen"; // Pfad anpassen

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
          name="Statistics"
          component={StatisticsScreen}
          options={{ title: "Statistiken" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
