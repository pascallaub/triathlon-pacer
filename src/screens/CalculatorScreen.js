import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Button,
  TouchableOpacity,
  ScrollView,
} from "react-native";

// Helper function to parse time string (HH:MM:SS, MM:SS, or SS) into seconds
const parseTimeToSeconds = (timeStr) => {
  if (!timeStr) return 0;
  // Basic validation: Allow only digits and colons
  if (!/^[0-9:]+$/.test(timeStr)) return 0;
  const parts = timeStr.split(":").map(Number);
  let seconds = 0;
  if (parts.some(isNaN)) return 0; // Check if any part is not a number

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
  // Add basic upper limit check (e.g., 24 hours)
  return Math.max(0, Math.min(seconds, 24 * 3600));
};

// Helper function to format seconds into HH:MM:SS string (or MM:SS if hours are 0)
const formatSecondsToTime = (totalSeconds) => {
  if (isNaN(totalSeconds) || totalSeconds <= 0) return "";
  totalSeconds = Math.round(totalSeconds); // Round to nearest second
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  } else {
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  }
};

// Helper function to format seconds into MM:SS string (used for pace display)
const formatSecondsToPace = (totalSeconds) => {
  if (isNaN(totalSeconds) || totalSeconds <= 0) return "";
  totalSeconds = Math.round(totalSeconds); // Round to nearest second
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
};

function CalculatorScreen() {
  const [discipline, setDiscipline] = useState("Run"); // 'Run', 'Swim', 'Bike'
  const [distance, setDistance] = useState(""); // in meters
  const [time, setTime] = useState(""); // as HH:MM:SS or MM:SS string
  const [paceOrSpeed, setPaceOrSpeed] = useState(""); // Pace (MM:SS / unit) or Speed (km/h) string
  const [startTime, setStartTime] = useState(""); // e.g., "09:00"

  // Internal state for calculations
  const [timeInSeconds, setTimeInSeconds] = useState(0);
  const [paceInSecondsPerUnit, setPaceInSecondsPerUnit] = useState(0); // Pace per km (Run), per 100m (Swim)
  const [speedInKmh, setSpeedInKmh] = useState(0); // Speed for Bike

  // Reset fields when discipline changes
  useEffect(() => {
    clearFields();
  }, [discipline]);

  const handleDistanceChange = (value) => {
    // Basic validation: Allow only numbers (and potentially a decimal point)
    if (/^[0-9]*\.?[0-9]*$/.test(value)) {
      // Add max distance check (e.g., 1,000,000 meters = 1000 km)
      const numValue = parseFloat(value);
      if (numValue <= 1000000) {
        setDistance(value);
      } else {
        setDistance("1000000"); // Set to max if exceeded
      }
    } else if (value === "") {
      setDistance("");
    }
  };

  const handleTimeChange = (value) => {
    // Allow digits and colons
    if (/^[0-9:]*$/.test(value)) {
      setTime(value);
      const seconds = parseTimeToSeconds(value);
      setTimeInSeconds(seconds);
    }
  };

  const handlePaceOrSpeedChange = (value) => {
    setPaceOrSpeed(value);
    if (discipline === "Bike") {
      // Basic validation for speed (km/h)
      if (/^[0-9]*\.?[0-9]*$/.test(value)) {
        const speed = parseFloat(value);
        // Add max speed check (e.g., 100 km/h)
        if (!isNaN(speed) && speed >= 0 && speed <= 100) {
          setSpeedInKmh(speed);
        } else if (speed > 100) {
          setSpeedInKmh(100);
          setPaceOrSpeed("100");
        }
      } else if (value === "") {
        setSpeedInKmh(0);
      }
    } else {
      // Basic validation for pace (MM:SS format)
      if (/^[0-9:]*$/.test(value)) {
        const secondsPerUnit = parseTimeToSeconds(value);
        setPaceInSecondsPerUnit(secondsPerUnit);
      }
    }
  };

  const handleStartTimeChange = (value) => {
    // Basic validation HH:MM
    if (/^[0-9:]*$/.test(value) && value.length <= 5) {
      setStartTime(value);
      // TODO: Parse and store start time for potential split calculations
    }
  };

  const calculate = () => {
    // Input Validation & Security: Ensure inputs are valid numbers and within reasonable limits.
    // Prevent NaN, Infinity by checking divisors.
    const distNum = parseFloat(distance);
    const d = distNum > 0 && distNum <= 1000000 ? distNum : 0; // Max 1000km
    const t = timeInSeconds > 0 ? timeInSeconds : 0;
    const p = paceInSecondsPerUnit > 0 ? paceInSecondsPerUnit : 0;
    const s = speedInKmh > 0 && speedInKmh <= 100 ? speedInKmh : 0; // Max 100 km/h

    let filledFields = 0;
    if (d > 0) filledFields++;
    if (t > 0) filledFields++;
    if (discipline === "Bike" && s > 0) filledFields++;
    if (discipline !== "Bike" && p > 0) filledFields++;

    if (filledFields !== 2) {
      // TODO: Show an error message to the user
      console.log("Please fill exactly two fields");
      return;
    }

    // --- Calculations ---
    try {
      // Add try-catch for unexpected calculation errors
      if (discipline === "Run") {
        // Pace in MM:SS / km
        if (d > 0 && t > 0) {
          // Calculate Pace
          const paceSecPerMeter = t / d;
          const paceSecPerKm = paceSecPerMeter * 1000;
          setPaceInSecondsPerUnit(paceSecPerKm);
          setPaceOrSpeed(formatSecondsToPace(paceSecPerKm));
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
            setDistance(calculatedDistance.toFixed(0));
          } else {
            setDistance("");
          }
        }
      } else if (discipline === "Swim") {
        // Pace in MM:SS / 100m
        if (d > 0 && t > 0) {
          // Calculate Pace
          const paceSecPerMeter = t / d;
          const paceSecPer100m = paceSecPerMeter * 100;
          setPaceInSecondsPerUnit(paceSecPer100m);
          setPaceOrSpeed(formatSecondsToPace(paceSecPer100m));
        } else if (d > 0 && p > 0) {
          // Calculate Time
          const paceSecPerMeter = p / 100;
          const totalSeconds = paceSecPerMeter * d;
          setTimeInSeconds(totalSeconds);
          setTime(formatSecondsToTime(totalSeconds));
        } else if (t > 0 && p > 0) {
          // Calculate Distance
          const paceSecPerMeter = p / 100;
          if (paceSecPerMeter > 0) {
            const calculatedDistance = t / paceSecPerMeter;
            setDistance(calculatedDistance.toFixed(0));
          } else {
            setDistance("");
          }
        }
      } else if (discipline === "Bike") {
        // Speed in km/h
        if (d > 0 && t > 0) {
          // Calculate Speed
          const distanceKm = d / 1000;
          const timeHours = t / 3600;
          if (timeHours > 0) {
            const calculatedSpeed = distanceKm / timeHours;
            setSpeedInKmh(calculatedSpeed);
            setPaceOrSpeed(calculatedSpeed.toFixed(2)); // Format speed to 2 decimal places
          } else {
            setPaceOrSpeed("");
          }
        } else if (d > 0 && s > 0) {
          // Calculate Time
          const distanceKm = d / 1000;
          const timeHours = distanceKm / s;
          const totalSeconds = timeHours * 3600;
          setTimeInSeconds(totalSeconds);
          setTime(formatSecondsToTime(totalSeconds));
        } else if (t > 0 && s > 0) {
          // Calculate Distance
          const timeHours = t / 3600;
          const distanceKm = s * timeHours;
          const calculatedDistance = distanceKm * 1000;
          setDistance(calculatedDistance.toFixed(0));
        }
      }
    } catch (error) {
      console.error("Calculation error:", error);
      // TODO: Show user-friendly error message
    }
  };

  const clearFields = () => {
    setDistance("");
    setTime("");
    setPaceOrSpeed("");
    setTimeInSeconds(0);
    setPaceInSecondsPerUnit(0);
    setSpeedInKmh(0);
    // Note: Start time is not cleared here intentionally
  };

  // --- Dynamic Labels and Placeholders ---
  const getLabels = () => {
    switch (discipline) {
      case "Swim":
        return {
          distance: "Distanz (Meter)",
          distancePlaceholder: "z.B. 1500",
          time: "Zeit (HH:MM:SS)",
          timePlaceholder: "z.B. 25:00",
          paceSpeed: "Pace (MM:SS / 100m)",
          paceSpeedPlaceholder: "z.B. 01:40",
          icon: "🏊", // Placeholder for actual icon
        };
      case "Bike":
        return {
          distance: "Distanz (Meter)", // Could add toggle for km later
          distancePlaceholder: "z.B. 40000",
          time: "Zeit (HH:MM:SS)",
          timePlaceholder: "z.B. 01:05:00",
          paceSpeed: "Geschw. (km/h)",
          paceSpeedPlaceholder: "z.B. 35.0",
          icon: "🚴", // Placeholder for actual icon
        };
      case "Run":
      default:
        return {
          distance: "Distanz (Meter)", // Could add toggle for km later
          distancePlaceholder: "z.B. 10000",
          time: "Zeit (HH:MM:SS)",
          timePlaceholder: "z.B. 50:00",
          paceSpeed: "Pace (MM:SS / km)",
          paceSpeedPlaceholder: "z.B. 05:00",
          icon: "🏃", // Placeholder for actual icon
        };
    }
  };

  const labels = getLabels();

  return (
    // Wrap with ScrollView for smaller screens
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Triathlon Pacer</Text>

        {/* Discipline Selection */}
        <View style={styles.disciplineSelector}>
          {["Run", "Swim", "Bike"].map((disc) => (
            <TouchableOpacity
              key={disc}
              style={[
                styles.disciplineButton,
                discipline === disc && styles.disciplineButtonActive,
              ]}
              onPress={() => setDiscipline(disc)}
            >
              <Text style={styles.disciplineButtonText}>
                {/* Placeholder for Icon */}
                {disc === "Run" ? "🏃" : disc === "Swim" ? "🏊" : "🚴"} {disc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Start Time Input */}
        {/* TODO: Integrate start time with split calculations on a results screen */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Startzeit (HH:MM)</Text>
          <TextInput
            style={styles.input}
            value={startTime}
            onChangeText={handleStartTimeChange}
            keyboardType="numbers-and-punctuation"
            placeholder="z.B. 09:00"
          />
        </View>

        {/* Calculation Inputs */}
        <View style={styles.inputGroup}>
          <Text style={styles.groupTitle}>
            {labels.icon} {discipline} Details
          </Text>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{labels.distance}</Text>
            {/* TODO: Add Unit Toggle (m/km) */}
            <TextInput
              style={styles.input}
              value={distance}
              onChangeText={handleDistanceChange}
              keyboardType="numeric"
              placeholder={labels.distancePlaceholder}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{labels.time}</Text>
            <TextInput
              style={styles.input}
              value={time}
              onChangeText={handleTimeChange}
              keyboardType="numbers-and-punctuation"
              placeholder={labels.timePlaceholder}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{labels.paceSpeed}</Text>
            {/* TODO: Add Unit Toggle (e.g., min/km vs min/mile for Run) */}
            <TextInput
              style={styles.input}
              value={paceOrSpeed}
              onChangeText={handlePaceOrSpeedChange}
              // Use appropriate keyboard type based on discipline
              keyboardType={
                discipline === "Bike" ? "numeric" : "numbers-and-punctuation"
              }
              placeholder={labels.paceSpeedPlaceholder}
            />
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button title="Berechnen" onPress={calculate} />
          <Button title="Clear" onPress={clearFields} color="grey" />
        </View>

        {/* Placeholder Sections for Future Features */}
        {/*
            <View style={styles.placeholderSection}>
                <Text>Transition Times (T1/T2) - Requires separate input section/screen</Text>
            </View>
            <View style={styles.placeholderSection}>
                <Text>Split Configuration - Requires dedicated UI</Text>
            </View>
            <View style={styles.placeholderSection}>
                <Text>Results View / Split Table - Requires navigation to a new screen</Text>
                <Button title="Export/Share" onPress={() => {}} disabled /> // TODO: Implement sharing
            </View>
            <View style={styles.placeholderSection}>
                <Text style={styles.securityNotesTitle}>Security & Data Notes:</Text>
                <Text>- Input validation is basic. Enhance as needed.</Text>
                <Text>- Data is currently only in component state (lost on close).</Text>
                <Text>- For persistence: Use AsyncStorage or Expo SecureStore.</Text>
                <Text>- Request minimal permissions.</Text>
                <Text>- Use React Native's Share API for secure sharing.</Text>
            </View>
            */}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1, // Ensures content can scroll if it exceeds screen height
  },
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 30, // Reduced padding top
    paddingHorizontal: 20,
    backgroundColor: "#f0f0f0", // Lighter gray background
  },
  title: {
    fontSize: 28, // Slightly larger title
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  disciplineSelector: {
    flexDirection: "row",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    overflow: "hidden", // Clip children to rounded corners
  },
  disciplineButton: {
    flex: 1, // Each button takes equal space
    paddingVertical: 10,
    paddingHorizontal: 5,
    backgroundColor: "#e9e9e9",
    alignItems: "center", // Center text horizontally
  },
  disciplineButtonActive: {
    backgroundColor: "#007AFF", // Example active color (iOS blue)
  },
  disciplineButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333", // Default text color
    // Active text color should be handled conditionally if needed or set on active button style
  },
  // Style for active button text if needed
  // disciplineButtonTextActive: {
  //   color: '#fff',
  // },
  inputGroup: {
    width: "100%",
    backgroundColor: "#fff", // White background for input group
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: "#000", // Add subtle shadow
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 15,
    color: "#333",
  },
  inputContainer: {
    marginBottom: 15,
    width: "100%",
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: "#555", // Darker label color
  },
  input: {
    height: 45, // Slightly taller input
    borderColor: "#ccc", // Lighter border color
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
    width: "100%",
    backgroundColor: "#fff", // Ensure input background is white
    fontSize: 16, // Make input text slightly larger
    // Removed marginBottom: 10 as inputContainer handles spacing
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 10, // Reduced margin above buttons
    marginBottom: 20, // Add margin below buttons
  },
  // Placeholder styles for future feature sections
  placeholderSection: {
    width: "100%",
    marginTop: 20,
    padding: 10,
    backgroundColor: "#eee",
    borderRadius: 5,
    alignItems: "center",
  },
  securityNotesTitle: {
    fontWeight: "bold",
    marginBottom: 5,
  },
});

export default CalculatorScreen;
