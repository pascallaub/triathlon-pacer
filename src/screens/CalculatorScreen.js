import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Button,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage"; // Import AsyncStorage

// Helper function to parse time string (HH:MM:SS, MM:SS, or SS) into seconds
const parseTimeToSeconds = (timeStr) => {
  if (!timeStr) return 0;
  if (!/^[0-9:]+$/.test(timeStr)) return 0;
  const parts = timeStr.split(":").map(Number);
  let seconds = 0;
  if (parts.some(isNaN)) return 0;

  if (parts.length === 3) {
    seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    seconds = parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    seconds = parts[0];
  }
  return Math.max(0, Math.min(seconds, 24 * 3600));
};

// Helper function to format seconds into HH:MM:SS string (or MM:SS if hours are 0)
const formatSecondsToTime = (totalSeconds) => {
  if (isNaN(totalSeconds) || totalSeconds <= 0) return "";
  totalSeconds = Math.round(totalSeconds);
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
  totalSeconds = Math.round(totalSeconds);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0"
  )}`;
};

const initialDisciplineState = {
  distance: "",
  time: "",
  paceOrSpeed: "",
  timeInSeconds: 0,
  paceInSecondsPerUnit: 0,
  speedInKmh: 0,
};

const initialTransitionState = {
  time: "",
  timeInSeconds: 0,
};

function CalculatorScreen() {
  const [swimData, setSwimData] = useState({ ...initialDisciplineState });
  const [t1Data, setT1Data] = useState({ ...initialTransitionState });
  const [bikeData, setBikeData] = useState({ ...initialDisciplineState });
  const [t2Data, setT2Data] = useState({ ...initialTransitionState });
  const [runData, setRunData] = useState({ ...initialDisciplineState });
  const [startTime, setStartTime] = useState("");
  const [totalTime, setTotalTime] = useState("");
  const [totalTimeInSeconds, setTotalTimeInSeconds] = useState(0);
  const [saveName, setSaveName] = useState(""); // State for the save name

  const handleInputChange = useCallback((disciplineKey, field, value) => {
    const setData = (prevData) => {
      const newData = { ...prevData, [field]: value };

      if (field === "time") {
        newData.timeInSeconds = parseTimeToSeconds(value);
      } else if (field === "distance") {
        if (!/^[0-9]*\.?[0-9]*$/.test(value) && value !== "") return prevData;
        const numValue = parseFloat(value);
        if (numValue > 1000000) {
          newData.distance = "1000000";
        }
      } else if (field === "paceOrSpeed") {
        if (disciplineKey === "bike") {
          if (!/^[0-9]*\.?[0-9]*$/.test(value) && value !== "") return prevData;
          const speed = parseFloat(value);
          if (!isNaN(speed) && speed >= 0 && speed <= 100) {
            newData.speedInKmh = speed;
          } else if (speed > 100) {
            newData.speedInKmh = 100;
            newData.paceOrSpeed = "100";
          } else if (value === "") {
            newData.speedInKmh = 0;
          } else {
            return prevData;
          }
        } else {
          if (!/^[0-9:]*$/.test(value)) return prevData;
          newData.paceInSecondsPerUnit = parseTimeToSeconds(value);
        }
      }
      return newData;
    };

    switch (disciplineKey) {
      case "swim":
        setSwimData(setData);
        break;
      case "t1":
        setT1Data((prev) => ({
          ...prev,
          time: value,
          timeInSeconds: parseTimeToSeconds(value),
        }));
        break;
      case "bike":
        setBikeData(setData);
        break;
      case "t2":
        setT2Data((prev) => ({
          ...prev,
          time: value,
          timeInSeconds: parseTimeToSeconds(value),
        }));
        break;
      case "run":
        setRunData(setData);
        break;
    }
  }, [setSwimData, setT1Data, setBikeData, setT2Data, setRunData]);

  const handleStartTimeChange = (value) => {
    if (/^[0-9:]*$/.test(value) && value.length <= 5) {
      setStartTime(value);
    }
  };

  const calculate = () => {
    Keyboard.dismiss();

    let calculatedSwimTime = swimData.timeInSeconds;
    let calculatedBikeTime = bikeData.timeInSeconds;
    let calculatedRunTime = runData.timeInSeconds;
    let errorMessages = [];

    const calculateDiscipline = (data, setData, disciplineName) => {
      const distNum = parseFloat(data.distance);
      const d = distNum > 0 && distNum <= 1000000 ? distNum : 0;
      const t = data.timeInSeconds > 0 ? data.timeInSeconds : 0;
      const p = data.paceInSecondsPerUnit > 0 ? data.paceInSecondsPerUnit : 0;
      const s = data.speedInKmh > 0 && s <= 100 ? data.speedInKmh : 0;

      let filledFields = 0;
      if (d > 0) filledFields++;
      if (t > 0) filledFields++;
      if (disciplineName === "bike" && s > 0) filledFields++;
      if (disciplineName !== "bike" && p > 0) filledFields++;

      if (filledFields === 3) {
        errorMessages.push(`Zu viele Felder für ${disciplineName} ausgefüllt.`);
        return t;
      }
      if (filledFields < 2) {
        if (
          d > 0 ||
          t > 0 ||
          (disciplineName === "bike" && s > 0) ||
          (disciplineName !== "bike" && p > 0)
        ) {
          errorMessages.push(`Nicht genügend Daten für ${disciplineName}.`);
        }
        return t;
      }

      let calculatedTime = t;
      let updatedData = { ...data };

      try {
        if (disciplineName === "run") {
          if (d > 0 && t > 0) {
            const paceSecPerMeter = t / d;
            const paceSecPerKm = paceSecPerMeter * 1000;
            updatedData.paceInSecondsPerUnit = paceSecPerKm;
            updatedData.paceOrSpeed = formatSecondsToPace(paceSecPerKm);
          } else if (d > 0 && p > 0) {
            const paceSecPerMeter = p / 1000;
            calculatedTime = paceSecPerMeter * d;
            updatedData.timeInSeconds = calculatedTime;
            updatedData.time = formatSecondsToTime(calculatedTime);
          } else if (t > 0 && p > 0) {
            const paceSecPerMeter = p / 1000;
            if (paceSecPerMeter > 0) {
              const dist = t / paceSecPerMeter;
              updatedData.distance = dist.toFixed(0);
            } else {
              updatedData.distance = "";
            }
          }
        } else if (disciplineName === "swim") {
          if (d > 0 && t > 0) {
            const paceSecPerMeter = t / d;
            const paceSecPer100m = paceSecPerMeter * 100;
            updatedData.paceInSecondsPerUnit = paceSecPer100m;
            updatedData.paceOrSpeed = formatSecondsToPace(paceSecPer100m);
          } else if (d > 0 && p > 0) {
            const paceSecPerMeter = p / 100;
            calculatedTime = paceSecPerMeter * d;
            updatedData.timeInSeconds = calculatedTime;
            updatedData.time = formatSecondsToTime(calculatedTime);
          } else if (t > 0 && p > 0) {
            const paceSecPerMeter = p / 100;
            if (paceSecPerMeter > 0) {
              const dist = t / paceSecPerMeter;
              updatedData.distance = dist.toFixed(0);
            } else {
              updatedData.distance = "";
            }
          }
        } else if (disciplineName === "bike") {
          if (d > 0 && t > 0) {
            const distanceKm = d / 1000;
            const timeHours = t / 3600;
            if (timeHours > 0) {
              const speed = distanceKm / timeHours;
              updatedData.speedInKmh = speed;
              updatedData.paceOrSpeed = speed.toFixed(2);
            } else {
              updatedData.paceOrSpeed = "";
            }
          } else if (d > 0 && s > 0) {
            const distanceKm = d / 1000;
            const timeHours = distanceKm / s;
            calculatedTime = timeHours * 3600;
            updatedData.timeInSeconds = calculatedTime;
            updatedData.time = formatSecondsToTime(calculatedTime);
          } else if (t > 0 && s > 0) {
            const timeHours = t / 3600;
            const distanceKm = s * timeHours;
            const dist = distanceKm * 1000;
            updatedData.distance = dist.toFixed(0);
          }
        }
        setData(updatedData);
        return calculatedTime;
      } catch (error) {
        console.error(`Calculation error in ${disciplineName}:`, error);
        errorMessages.push(`Fehler bei der Berechnung für ${disciplineName}.`);
        return t;
      }
    };

    calculatedSwimTime = calculateDiscipline(swimData, setSwimData, "swim");
    calculatedBikeTime = calculateDiscipline(bikeData, setBikeData, "bike");
    calculatedRunTime = calculateDiscipline(runData, setRunData, "run");

    const t1Seconds = t1Data.timeInSeconds;
    const t2Seconds = t2Data.timeInSeconds;

    const totalSec =
      calculatedSwimTime +
      t1Seconds +
      calculatedBikeTime +
      t2Seconds +
      calculatedRunTime;

    if (totalSec > 0) {
      setTotalTimeInSeconds(totalSec);
      setTotalTime(formatSecondsToTime(totalSec));
    } else {
      setTotalTimeInSeconds(0);
      setTotalTime("");
    }

    if (errorMessages.length > 0) {
      Alert.alert("Berechnungsfehler", errorMessages.join("\n"));
    } else if (totalSec <= 0) {
      Alert.alert(
        "Information",
        "Keine Zeiten zum Berechnen der Gesamtzeit vorhanden."
      );
    }
  };

  const clearFields = () => {
    Keyboard.dismiss();
    setSwimData({ ...initialDisciplineState });
    setT1Data({ ...initialTransitionState });
    setBikeData({ ...initialDisciplineState });
    setT2Data({ ...initialTransitionState });
    setRunData({ ...initialDisciplineState });
    setTotalTime("");
    setTotalTimeInSeconds(0);
    setSaveName(""); // Clear save name as well
  };

  const savePaces = async () => {
    Keyboard.dismiss();
    if (!saveName.trim()) {
      Alert.alert("Fehler", "Bitte gib einen Namen für das Pace-Set ein.");
      return;
    }
    if (totalTimeInSeconds <= 0) {
      Alert.alert(
        "Fehler",
        "Es gibt keine berechneten Zeiten zum Speichern. Bitte zuerst berechnen."
      );
      return;
    }

    const paceSet = {
      id: Date.now().toString(), // Unique ID for the set
      name: saveName.trim(),
      startTime,
      swim: { ...swimData },
      t1: { ...t1Data },
      bike: { ...bikeData },
      t2: { ...t2Data },
      run: { ...runData },
      totalTime,
      totalTimeInSeconds,
      createdAt: new Date().toISOString(),
    };

    try {
      const existingSetsJSON = await AsyncStorage.getItem("@savedPaceSets");
      const existingSets = existingSetsJSON ? JSON.parse(existingSetsJSON) : [];

      // Optional: Check if name already exists
      const nameExists = existingSets.some(
        (set) => set.name.toLowerCase() === paceSet.name.toLowerCase()
      );
      if (nameExists) {
        Alert.alert(
          "Name existiert bereits",
          `Ein Set mit dem Namen "${paceSet.name}" existiert bereits. Überschreiben?`,
          [
            { text: "Abbrechen", style: "cancel" },
            {
              text: "Überschreiben",
              onPress: async () => {
                const updatedSets = existingSets.map((set) =>
                  set.name.toLowerCase() === paceSet.name.toLowerCase()
                    ? paceSet
                    : set
                );
                await AsyncStorage.setItem(
                  "@savedPaceSets",
                  JSON.stringify(updatedSets)
                );
                Alert.alert(
                  "Erfolg",
                  `Pace-Set "${paceSet.name}" wurde überschrieben.`
                );
                setSaveName(""); // Clear name after saving
              },
            },
          ]
        );
        return; // Stop here unless user chooses to overwrite
      }

      const updatedSets = [...existingSets, paceSet];
      await AsyncStorage.setItem("@savedPaceSets", JSON.stringify(updatedSets));
      Alert.alert("Erfolg", `Pace-Set "${paceSet.name}" wurde gespeichert.`);
      setSaveName(""); // Clear name after saving
    } catch (e) {
      console.error("Failed to save paces:", e);
      Alert.alert("Fehler", "Speichern des Pace-Sets fehlgeschlagen.");
    }
  };

  const getLabels = (disciplineKey) => {
    switch (disciplineKey) {
      case "swim":
        return {
          dist: "Distanz (m)",
          time: "Zeit (HH:MM:SS)",
          pace: "Pace (/100m)",
          icon: "🏊",
        };
      case "bike":
        return {
          dist: "Distanz (m)",
          time: "Zeit (HH:MM:SS)",
          pace: "Geschw. (km/h)",
          icon: "🚴",
        };
      case "run":
        return {
          dist: "Distanz (m)",
          time: "Zeit (HH:MM:SS)",
          pace: "Pace (/km)",
          icon: "🏃",
        };
      default:
        return {};
    }
  };

  const InputGroup = ({ title, children }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.groupTitle}>{title}</Text>
      {children}
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
          <Text style={styles.title}>Triathlon Gesamtzeit</Text>

          <View style={[styles.inputContainer, styles.startTimeContainer]}>
            <Text style={styles.label}>Startzeit (HH:MM)</Text>
            <TextInput
              style={styles.input}
              value={startTime}
              onChangeText={handleStartTimeChange}
              keyboardType="numbers-and-punctuation"
              placeholder="z.B. 09:00"
            />
          </View>

          <InputGroup title={`${getLabels("swim").icon} Schwimmen`}>
            <InputRow
              label={getLabels("swim").dist}
              value={swimData.distance}
              onChange={(val) => handleInputChange("swim", "distance", val)}
              placeholder="z.B. 1500"
              keyboardType="numeric"
            />
            <InputRow
              label={getLabels("swim").time}
              value={swimData.time}
              onChange={(val) => handleInputChange("swim", "time", val)}
              placeholder="z.B. 25:00"
              keyboardType="numbers-and-punctuation"
            />
            <InputRow
              label={getLabels("swim").pace}
              value={swimData.paceOrSpeed}
              onChange={(val) => handleInputChange("swim", "paceOrSpeed", val)}
              placeholder="z.B. 01:40"
              keyboardType="numbers-and-punctuation"
            />
          </InputGroup>

          <InputGroup title="Wechselzone 1 (T1)">
            <InputRow
              label="Zeit (MM:SS)"
              value={t1Data.time}
              onChange={(val) => handleInputChange("t1", "time", val)}
              placeholder="z.B. 02:00"
              keyboardType="numbers-and-punctuation"
            />
          </InputGroup>

          <InputGroup title={`${getLabels("bike").icon} Radfahren`}>
            <InputRow
              label={getLabels("bike").dist}
              value={bikeData.distance}
              onChange={(val) => handleInputChange("bike", "distance", val)}
              placeholder="z.B. 40000"
              keyboardType="numeric"
            />
            <InputRow
              label={getLabels("bike").time}
              value={bikeData.time}
              onChange={(val) => handleInputChange("bike", "time", val)}
              placeholder="z.B. 01:05:00"
              keyboardType="numbers-and-punctuation"
            />
            <InputRow
              label={getLabels("bike").pace}
              value={bikeData.paceOrSpeed}
              onChange={(val) => handleInputChange("bike", "paceOrSpeed", val)}
              placeholder="z.B. 35.0"
              keyboardType="numeric"
            />
          </InputGroup>

          <InputGroup title="Wechselzone 2 (T2)">
            <InputRow
              label="Zeit (MM:SS)"
              value={t2Data.time}
              onChange={(val) => handleInputChange("t2", "time", val)}
              placeholder="z.B. 01:30"
              keyboardType="numbers-and-punctuation"
            />
          </InputGroup>

          <InputGroup title={`${getLabels("run").icon} Laufen`}>
            <InputRow
              label={getLabels("run").dist}
              value={runData.distance}
              onChange={(val) => handleInputChange("run", "distance", val)}
              placeholder="z.B. 10000"
              keyboardType="numeric"
            />
            <InputRow
              label={getLabels("run").time}
              value={runData.time}
              onChange={(val) => handleInputChange("run", "time", val)}
              placeholder="z.B. 50:00"
              keyboardType="numbers-and-punctuation"
            />
            <InputRow
              label={getLabels("run").pace}
              value={runData.paceOrSpeed}
              onChange={(val) => handleInputChange("run", "paceOrSpeed", val)}
              placeholder="z.B. 05:00"
              keyboardType="numbers-and-punctuation"
            />
          </InputGroup>

          {totalTime ? (
            <View style={styles.totalTimeContainer}>
              <Text style={styles.totalTimeLabel}>Gesamtzeit:</Text>
              <Text style={styles.totalTimeValue}>{totalTime}</Text>
            </View>
          ) : null}

          {totalTimeInSeconds > 0 && (
            <View style={styles.saveContainer}>
              <Text style={styles.label}>Pace-Set speichern als:</Text>
              <TextInput
                style={styles.input}
                value={saveName}
                onChangeText={setSaveName}
                placeholder="Name für dieses Set (z.B. Wettkampfziel)"
              />
            </View>
          )}

          <View style={styles.buttonContainer}>
            <Button title="Berechnen" onPress={calculate} />
            {totalTimeInSeconds > 0 && (
              <Button title="Speichern" onPress={savePaces} color="green" />
            )}
            <Button title="Clear All" onPress={clearFields} color="grey" />
          </View>
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const InputRow = ({ label, value, onChange, placeholder, keyboardType }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder}
      keyboardType={keyboardType}
    />
  </View>
);

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 50,
  },
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 30,
    paddingHorizontal: 15,
    backgroundColor: "#f0f0f0",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
  },
  inputGroup: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  inputContainer: {
    marginBottom: 10,
    width: "100%",
  },
  startTimeContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  label: {
    fontSize: 15,
    marginBottom: 4,
    color: "#555",
  },
  input: {
    height: 42,
    borderColor: "#ccc",
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
    width: "100%",
    backgroundColor: "#fff",
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
    marginTop: 15,
    marginBottom: 20,
  },
  totalTimeContainer: {
    marginTop: 15,
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#d1e7dd",
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#badbcc",
  },
  totalTimeLabel: {
    fontSize: 16,
    color: "#0f5132",
    fontWeight: "500",
  },
  totalTimeValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0f5132",
    marginTop: 3,
  },
  saveContainer: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
});

export default CalculatorScreen;
