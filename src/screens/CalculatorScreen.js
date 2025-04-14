import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, Button } from "react-native";

// Helper function to parse time string (HH:MM:SS or MM:SS) into seconds
const parseTimeToSeconds = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.split(":").map(Number);
  let seconds = 0;
  if (parts.length === 3) {
    // HH:MM:SS
    seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS
    seconds = parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    // SS
    seconds = parts[0];
  }
  return seconds;
};

// Helper function to format seconds into MM:SS string
const formatSecondsToTime = (totalSeconds) => {
  if (isNaN(totalSeconds) || totalSeconds === 0) return "";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
};

function CalculatorScreen() {
  const [distance, setDistance] = useState(""); // in meters
  const [time, setTime] = useState(""); // as MM:SS string
  const [pace, setPace] = useState(""); // as MM:SS per km string

  // Internal state for calculations in seconds
  const [timeInSeconds, setTimeInSeconds] = useState(0);
  const [paceInSecondsPerKm, setPaceInSecondsPerKm] = useState(0);

  const handleDistanceChange = (value) => {
    setDistance(value);
  };

  const handleTimeChange = (value) => {
    setTime(value);
    const seconds = parseTimeToSeconds(value);
    setTimeInSeconds(seconds);
  };

  const handlePaceChange = (value) => {
    setPace(value);
    const secondsPerKm = parseTimeToSeconds(value);
    setPaceInSecondsPerKm(secondsPerKm);
  };

  const calculate = () => {
    const distNum = parseFloat(distance); // Assume distance is in meters

    // Ensure we have numbers to work with
    const d = distNum > 0 ? distNum : 0;
    const t = timeInSeconds > 0 ? timeInSeconds : 0;
    const p = paceInSecondsPerKm > 0 ? paceInSecondsPerKm : 0;

    // Count how many fields are filled
    const filledFields = [d, t, p].filter((val) => val > 0).length;

    if (filledFields === 2) {
      if (d > 0 && t > 0) {
        // Calculate Pace
        const paceSecPerMeter = t / d;
        const paceSecPerKm = paceSecPerMeter * 1000;
        setPaceInSecondsPerKm(paceSecPerKm);
        setPace(formatSecondsToTime(paceSecPerKm));
      } else if (d > 0 && p > 0) {
        // Calculate Time
        const paceSecPerMeter = p / 1000;
        const totalSeconds = paceSecPerMeter * d;
        setTimeInSeconds(totalSeconds);
        setTime(formatSecondsToTime(totalSeconds));
      } else if (t > 0 && p > 0) {
        // Calculate Distance
        const paceSecPerMeter = p / 1000;
        if (paceSecPerMeter > 0) {
          const calculatedDistance = t / paceSecPerMeter;
          setDistance(calculatedDistance.toFixed(0)); // Distance in meters, no decimals
        } else {
          setDistance(""); // Avoid division by zero
        }
      }
    }
  };

  const clearFields = () => {
    setDistance("");
    setTime("");
    setPace("");
    setTimeInSeconds(0);
    setPaceInSecondsPerKm(0);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Triathlon Pacer</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Distanz (Meter)</Text>
        <TextInput
          style={styles.input}
          value={distance}
          onChangeText={handleDistanceChange}
          keyboardType="numeric"
          placeholder="z.B. 10000"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Zeit (MM:SS)</Text>
        <TextInput
          style={styles.input}
          value={time}
          onChangeText={handleTimeChange}
          keyboardType="numbers-and-punctuation"
          placeholder="z.B. 50:00"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Pace (MM:SS / km)</Text>
        <TextInput
          style={styles.input}
          value={pace}
          onChangeText={handlePaceChange}
          keyboardType="numbers-and-punctuation"
          placeholder="z.B. 05:00"
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Berechnen" onPress={calculate} />
        <Button title="Clear" onPress={clearFields} color="grey" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 50, // Add padding top
    paddingHorizontal: 20, // Add horizontal padding
    backgroundColor: "lightgray",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
  },
  inputContainer: {
    marginBottom: 15,
    width: "100%", // Make container take full width
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
    width: "100%", // Make input take full width
    marginBottom: 10, // Add some margin below inputs
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 20, // Add margin above buttons
  },
});

export default CalculatorScreen;
