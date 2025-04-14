import React, { useState, useCallback, useEffect } from "react"; // Import useEffect
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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native"; // Import useNavigation

// Helper functions
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
};

const initialTransitionState = {
  time: "",
};

const initialFormData = {
  swim: { ...initialDisciplineState },
  t1: { ...initialTransitionState },
  bike: { ...initialDisciplineState },
  t2: { ...initialTransitionState },
  run: { ...initialDisciplineState },
};

function CalculatorScreen() {
  const navigation = useNavigation(); // Get navigation object
  const [formData, setFormData] = useState(initialFormData);
  const [startTime, setStartTime] = useState("");
  const [totalTime, setTotalTime] = useState("");
  const [totalTimeInSeconds, setTotalTimeInSeconds] = useState(0);
  const [saveName, setSaveName] = useState("");

  // Log when formData changes
  useEffect(() => {}, [formData]);

  const handleInputChange = useCallback((disciplineKey, field, value) => {
    setFormData((prevFormData) => {
      const disciplineData = prevFormData[disciplineKey];
      if (disciplineData[field] === value) {
        return prevFormData;
      }

      const newDisciplineData = { ...disciplineData, [field]: value };

      return {
        ...prevFormData,
        [disciplineKey]: newDisciplineData,
      };
    });
  }, []);

  const handleStartTimeChange = useCallback((value) => {
    if (/^[0-9:]*$/.test(value) && value.length <= 5) {
      setStartTime(value);
    }
  }, []);

  const calculate = () => {
    Keyboard.dismiss();
    let errorMessages = [];
    let tempFormData = JSON.parse(JSON.stringify(formData));

    const calculateSingleDiscipline = (disciplineKey) => {
      let data = tempFormData[disciplineKey];
      const disciplineName = disciplineKey;

      const distStr = data.distance || "";
      const timeStr = data.time || "";
      const paceOrSpeedStr = data.paceOrSpeed || "";

      const isValidDistance = /^[0-9]*\.?[0-9]*$/.test(distStr);
      const isValidTime = /^[0-9:]*$/.test(timeStr);
      const isValidPaceSpeed =
        disciplineName === "bike"
          ? /^[0-9]*\.?[0-9]*$/.test(paceOrSpeedStr)
          : /^[0-9:]*$/.test(paceOrSpeedStr);

      const dRaw = isValidDistance && distStr ? parseFloat(distStr) : 0;
      const tRaw = isValidTime ? parseTimeToSeconds(timeStr) : 0;
      const pRaw =
        disciplineName !== "bike" && isValidPaceSpeed
          ? parseTimeToSeconds(paceOrSpeedStr)
          : 0;
      const sRaw =
        disciplineName === "bike" && isValidPaceSpeed && paceOrSpeedStr
          ? parseFloat(paceOrSpeedStr)
          : 0;

      const d = dRaw > 0 && dRaw <= 1000000 ? dRaw : 0;
      const t = tRaw > 0 ? tRaw : 0;
      const p = pRaw > 0 ? pRaw : 0;
      const s = sRaw > 0 && sRaw <= 150 ? sRaw : 0;

      let filledFields = 0;
      if (d > 0) filledFields++;
      if (t > 0) filledFields++;
      if (disciplineName === "bike" && s > 0) filledFields++;
      if (disciplineName !== "bike" && p > 0) filledFields++;

      if (filledFields > 2) {
        errorMessages.push(`Zu viele Felder für ${disciplineName} ausgefüllt.`);
        return { calculatedTime: 0 };
      }
      if (filledFields < 2) {
        if (dRaw > 0 || tRaw > 0 || pRaw > 0 || sRaw > 0) {
          errorMessages.push(`Nicht genügend Daten für ${disciplineName}.`);
        }
        return { calculatedTime: 0 };
      }

      let calculatedTime = t;
      let updatedPaceOrSpeed = data.paceOrSpeed;
      let updatedTime = data.time;
      let updatedDistance = data.distance;

      try {
        if (disciplineName === "run") {
          if (d > 0 && t > 0) {
            const paceSecPerKm = (t / d) * 1000;
            updatedPaceOrSpeed = formatSecondsToPace(paceSecPerKm);
          } else if (d > 0 && p > 0) {
            calculatedTime = (p / 1000) * d;
            updatedTime = formatSecondsToTime(calculatedTime);
          } else if (t > 0 && p > 0) {
            const paceSecPerMeter = p / 1000;
            updatedDistance =
              paceSecPerMeter > 0 ? (t / paceSecPerMeter).toFixed(0) : "";
          }
        } else if (disciplineName === "swim") {
          if (d > 0 && t > 0) {
            const paceSecPer100m = (t / d) * 100;
            updatedPaceOrSpeed = formatSecondsToPace(paceSecPer100m);
          } else if (d > 0 && p > 0) {
            calculatedTime = (p / 100) * d;
            updatedTime = formatSecondsToTime(calculatedTime);
          } else if (t > 0 && p > 0) {
            const paceSecPerMeter = p / 100;
            updatedDistance =
              paceSecPerMeter > 0 ? (t / paceSecPerMeter).toFixed(0) : "";
          }
        } else if (disciplineName === "bike") {
          if (d > 0 && t > 0) {
            const timeHours = t / 3600;
            if (timeHours > 0) {
              const speed = d / 1000 / timeHours;
              updatedPaceOrSpeed = Math.min(speed, 150).toFixed(2);
            } else {
              updatedPaceOrSpeed = "";
            }
          } else if (d > 0 && s > 0) {
            const timeHours = d / 1000 / s;
            calculatedTime = timeHours * 3600;
            updatedTime = formatSecondsToTime(calculatedTime);
          } else if (t > 0 && s > 0) {
            const timeHours = t / 3600;
            updatedDistance = (s * timeHours * 1000).toFixed(0);
          }
        }

        tempFormData[disciplineKey] = {
          ...data,
          distance: updatedDistance,
          time: updatedTime,
          paceOrSpeed: updatedPaceOrSpeed,
        };

        return { calculatedTime: Math.round(calculatedTime) };
      } catch (error) {
        console.error(`Calculation error in ${disciplineName}:`, error);
        errorMessages.push(`Fehler bei der Berechnung für ${disciplineName}.`);
        return { calculatedTime: 0 };
      }
    };

    const swimResult = calculateSingleDiscipline("swim");
    const bikeResult = calculateSingleDiscipline("bike");
    const runResult = calculateSingleDiscipline("run");

    const t1Seconds = parseTimeToSeconds(tempFormData.t1.time);
    const t2Seconds = parseTimeToSeconds(tempFormData.t2.time);

    const totalSec =
      Math.max(0, swimResult.calculatedTime) +
      Math.max(0, t1Seconds) +
      Math.max(0, bikeResult.calculatedTime) +
      Math.max(0, t2Seconds) +
      Math.max(0, runResult.calculatedTime);

    setFormData(tempFormData);
    if (totalSec > 0) {
      setTotalTimeInSeconds(totalSec);
      setTotalTime(formatSecondsToTime(totalSec));
    } else {
      setTotalTimeInSeconds(0);
      setTotalTime("");
      if (errorMessages.length === 0) {
        const anyInputEntered = Object.values(formData).some(
          (discipline) =>
            discipline.distance || discipline.time || discipline.paceOrSpeed
        );
        if (anyInputEntered) {
          Alert.alert(
            "Information",
            "Berechnung nicht möglich. Bitte überprüfen Sie Ihre Eingaben (genau 2 Felder pro Disziplin)."
          );
        }
      }
    }

    if (errorMessages.length > 0) {
      Alert.alert("Hinweis zur Berechnung", errorMessages.join("\n"));
    }
  };

  const clearFields = useCallback(() => {
    Keyboard.dismiss();
    setFormData(initialFormData);
    setStartTime("");
    setTotalTime("");
    setTotalTimeInSeconds(0);
    setSaveName("");
  }, []);

  const savePaces = async () => {
    Keyboard.dismiss();
    if (!saveName.trim()) {
      Alert.alert("Fehler", "Bitte gib einen Namen für das Pace-Set ein.");
      return;
    }
    if (totalTimeInSeconds <= 0 && totalTime === "") {
      Alert.alert(
        "Fehler",
        "Es gibt keine berechneten Zeiten zum Speichern. Bitte zuerst berechnen."
      );
      return;
    }

    const paceSet = {
      id: Date.now().toString(),
      name: saveName.trim(),
      startTime,
      swim: { ...formData.swim },
      t1: { ...formData.t1 },
      bike: { ...formData.bike },
      t2: { ...formData.t2 },
      run: { ...formData.run },
      totalTime,
      totalTimeInSeconds,
      createdAt: new Date().toISOString(),
    };

    try {
      const existingSetsJSON = await AsyncStorage.getItem("@savedPaceSets");
      const existingSets = existingSetsJSON ? JSON.parse(existingSetsJSON) : [];
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
                    ? { ...paceSet, id: set.id }
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
                setSaveName("");
              },
            },
          ]
        );
        return;
      }
      const updatedSets = [...existingSets, paceSet];
      await AsyncStorage.setItem("@savedPaceSets", JSON.stringify(updatedSets));
      Alert.alert("Erfolg", `Pace-Set "${paceSet.name}" wurde gespeichert.`);
      setSaveName("");
    } catch (e) {
      console.error("Failed to save paces:", e);
      Alert.alert("Fehler", "Speichern des Pace-Sets fehlgeschlagen.");
    }
  };

  const getLabels = useCallback((disciplineKey) => {
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
  }, []);

  const InputRow = ({
    label,
    value,
    onChange,
    placeholder,
    keyboardType,
    disciplineKey,
    field,
  }) => {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
      if (value !== localValue) {
        setLocalValue(value);
      }
    }, [value]);

    const handleChange = useCallback((text) => {
      setLocalValue(text);
    }, []);

    const handleBlur = useCallback(() => {
      onChange(disciplineKey, field, localValue);
    }, [onChange, disciplineKey, field, localValue]);

    return (
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          style={styles.input}
          value={localValue}
          onChangeText={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          keyboardType={keyboardType}
        />
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      enabled
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="always"
        >
          <View style={styles.container}>
            <Text style={styles.title}>Triathlon Gesamtzeit</Text>

            <View
              key="start-time-group"
              style={[styles.inputContainer, styles.startTimeContainer]}
            >
              <Text style={styles.label}>Startzeit (HH:MM)</Text>
              <TextInput
                style={styles.input}
                value={startTime}
                onChangeText={handleStartTimeChange}
                keyboardType="numbers-and-punctuation"
                placeholder="z.B. 09:00"
              />
            </View>

            <View key="swim-section" style={styles.sectionContainer}>
              <Text style={styles.groupTitle}>
                {`${getLabels("swim").icon} Schwimmen`}
              </Text>
              <InputRow
                key="swim-distance"
                label={getLabels("swim").dist}
                value={formData.swim.distance}
                onChange={handleInputChange}
                disciplineKey="swim"
                field="distance"
                placeholder="z.B. 1500"
                keyboardType="numeric"
              />
              <InputRow
                key="swim-time"
                label={getLabels("swim").time}
                value={formData.swim.time}
                onChange={handleInputChange}
                disciplineKey="swim"
                field="time"
                placeholder="z.B. 25:00"
                keyboardType="numbers-and-punctuation"
              />
              <InputRow
                key="swim-pace"
                label={getLabels("swim").pace}
                value={formData.swim.paceOrSpeed}
                onChange={handleInputChange}
                disciplineKey="swim"
                field="paceOrSpeed"
                placeholder="z.B. 01:40"
                keyboardType="numbers-and-punctuation"
              />
            </View>

            <View key="t1-section" style={styles.sectionContainer}>
              <Text style={styles.groupTitle}>Wechselzone 1 (T1)</Text>
              <InputRow
                key="t1-time"
                label="Zeit (MM:SS)"
                value={formData.t1.time}
                onChange={handleInputChange}
                disciplineKey="t1"
                field="time"
                placeholder="z.B. 02:00"
                keyboardType="numbers-and-punctuation"
              />
            </View>

            <View key="bike-section" style={styles.sectionContainer}>
              <Text style={styles.groupTitle}>
                {`${getLabels("bike").icon} Radfahren`}
              </Text>
              <InputRow
                key="bike-distance"
                label={getLabels("bike").dist}
                value={formData.bike.distance}
                onChange={handleInputChange}
                disciplineKey="bike"
                field="distance"
                placeholder="z.B. 40000"
                keyboardType="numeric"
              />
              <InputRow
                key="bike-time"
                label={getLabels("bike").time}
                value={formData.bike.time}
                onChange={handleInputChange}
                disciplineKey="bike"
                field="time"
                placeholder="z.B. 01:05:00"
                keyboardType="numbers-and-punctuation"
              />
              <InputRow
                key="bike-pace"
                label={getLabels("bike").pace}
                value={formData.bike.paceOrSpeed}
                onChange={handleInputChange}
                disciplineKey="bike"
                field="paceOrSpeed"
                placeholder="z.B. 35.0"
                keyboardType="numeric"
              />
            </View>

            <View key="t2-section" style={styles.sectionContainer}>
              <Text style={styles.groupTitle}>Wechselzone 2 (T2)</Text>
              <InputRow
                key="t2-time"
                label="Zeit (MM:SS)"
                value={formData.t2.time}
                onChange={handleInputChange}
                disciplineKey="t2"
                field="time"
                placeholder="z.B. 01:30"
                keyboardType="numbers-and-punctuation"
              />
            </View>

            <View key="run-section" style={styles.sectionContainer}>
              <Text style={styles.groupTitle}>
                {`${getLabels("run").icon} Laufen`}
              </Text>
              <InputRow
                key="run-distance"
                label={getLabels("run").dist}
                value={formData.run.distance}
                onChange={handleInputChange}
                disciplineKey="run"
                field="distance"
                placeholder="z.B. 10000"
                keyboardType="numeric"
              />
              <InputRow
                key="run-time"
                label={getLabels("run").time}
                value={formData.run.time}
                onChange={handleInputChange}
                disciplineKey="run"
                field="time"
                placeholder="z.B. 50:00"
                keyboardType="numbers-and-punctuation"
              />
              <InputRow
                key="run-pace"
                label={getLabels("run").pace}
                value={formData.run.paceOrSpeed}
                onChange={handleInputChange}
                disciplineKey="run"
                field="paceOrSpeed"
                placeholder="z.B. 05:00"
                keyboardType="numbers-and-punctuation"
              />
            </View>

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
              <Button
                title="Gespeicherte Paces"
                onPress={() => navigation.navigate("SavedPaces")} // Navigate to SavedPaces screen
                color="#ff8c00" // Example color
              />
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

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
  sectionContainer: {
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
    flexWrap: "wrap", // Allow buttons to wrap
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
