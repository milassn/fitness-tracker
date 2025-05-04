import React, { useState, useEffect } from "react";
import {
  Save,
  Copy,
  CheckSquare,
  Square,
  TrendingUp,
  Calculator,
} from "lucide-react";
import { saveData, loadData } from "../utils/storage";

function TrainingGoals({ exercises }) {
  const [mesocycles, setMesocycles] = useState(() => {
    return loadData("mesocycles") || [];
  });
  const [selectedExercise, setSelectedExercise] = useState("");
  const [trainingGoals, setTrainingGoals] = useState({});
  const [currentMeso, setCurrentMeso] = useState(null);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [selectedSets, setSelectedSets] = useState([]); // Ändere von selectedTrainings zu selectedSets
  const [setFilter, setSetFilter] = useState("all"); // "all", "1", "2", etc.
  const [selectedTrainings, setSelectedTrainings] = useState([]);
  const [bulkValues, setBulkValues] = useState({
    reps: "",
    weight: "",
    rpe: "",
    useDropset: false,
    dropsetReps: "",
    dropsetWeight: "",
  });

  const toggleSetSelection = (setKey) => {
    setSelectedSets((prev) => {
      if (prev.includes(setKey)) {
        return prev.filter((k) => k !== setKey);
      } else {
        return [...prev, setKey];
      }
    });
  };

  const selectAllVisibleSets = () => {
    const filteredSets = getFilteredSets();
    if (selectedSets.length === filteredSets.length) {
      setSelectedSets([]);
    } else {
      setSelectedSets(filteredSets);
    }
  };

  const getFilteredSets = () => {
    const allSets = [];
    getTrainingsForExercise().forEach((training) => {
      for (let i = 1; i <= training.exercise.sets; i++) {
        const setKey = `${training.key}-set${i}`;
        if (setFilter === "all" || setFilter === String(i)) {
          allSets.push(setKey);
        }
      }
    });
    return allSets;
  };
  // Neue States für Zielvorschläge
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionSettings, setSuggestionSettings] = useState({
    startWeight: "",
    endWeight: "",
    alternateIncrease: false,
    repsPattern: "constant", // constant, progressive, descending
    startReps: "",
    endReps: "",
  });

  useEffect(() => {
    // Finde den aktuellen (aktiven) Mesozyklus
    const active = mesocycles.find((m) => m.status === "aktiv");
    setCurrentMeso(active);
  }, [mesocycles]);

  useEffect(() => {
    // Lade gespeicherte Trainingsziele
    const savedGoals = loadData("trainingGoals") || {};
    setTrainingGoals(savedGoals);
  }, []);

  const getTrainingsForExercise = () => {
    if (!currentMeso || !selectedExercise) return [];

    const selectedExerciseObj = exercises.find(
      (e) => e.id === selectedExercise
    );
    if (!selectedExerciseObj) return [];

    const trainings = [];

    currentMeso.generatedTrainings.forEach((training) => {
      const workout = training.workout;
      if (!workout || !workout.exercises) return;

      workout.exercises.forEach((exercise, exerciseIndex) => {
        if (exercise.id === selectedExercise) {
          trainings.push({
            ...training,
            exerciseIndex,
            exercise,
            key: `${training.number}-${exerciseIndex}`,
          });
        }
      });
    });

    return trainings;
  };

  const updateGoal = (trainingKey, field, value) => {
    setTrainingGoals((prev) => ({
      ...prev,
      [trainingKey]: {
        ...prev[trainingKey],
        [field]: value,
      },
    }));
  };

  const saveAllGoals = () => {
    saveData("trainingGoals", trainingGoals);
    alert("Alle Ziele wurden gespeichert!");
  };

  const toggleBulkEditMode = () => {
    setBulkEditMode(!bulkEditMode);
    setSelectedTrainings([]);
  };

  const toggleTrainingSelection = (trainingKey) => {
    setSelectedTrainings((prev) => {
      if (prev.includes(trainingKey)) {
        return prev.filter((k) => k !== trainingKey);
      } else {
        return [...prev, trainingKey];
      }
    });
  };

  const selectAllTrainings = () => {
    const allTrainings = getTrainingsForExercise();
    if (selectedTrainings.length === allTrainings.length) {
      setSelectedTrainings([]);
    } else {
      setSelectedTrainings(allTrainings.map((t) => t.key));
    }
  };

  const applyBulkValues = () => {
    selectedSets.forEach((setKey) => {
      const [trainingKey, setIdentifier] = setKey.split("-set");
      const setNumber = parseInt(setIdentifier);

      if (bulkValues.reps) {
        updateGoal(trainingKey, `set${setNumber}_reps`, bulkValues.reps);
      }
      if (bulkValues.weight) {
        updateGoal(trainingKey, `set${setNumber}_weight`, bulkValues.weight);
      }
      if (bulkValues.rpe) {
        updateGoal(trainingKey, `set${setNumber}_rpe`, bulkValues.rpe);
      }

      if (selectedExerciseObj?.allowsDropset) {
        updateGoal(
          trainingKey,
          `set${setNumber}_dropset`,
          bulkValues.useDropset
        );
        if (bulkValues.useDropset) {
          if (bulkValues.dropsetReps) {
            updateGoal(
              trainingKey,
              `set${setNumber}_dropsetReps`,
              bulkValues.dropsetReps
            );
          }
          if (bulkValues.dropsetWeight) {
            updateGoal(
              trainingKey,
              `set${setNumber}_dropsetWeight`,
              bulkValues.dropsetWeight
            );
          }
        }
      }
    });

    alert(`Werte für ${selectedSets.length} Sätze übernommen!`);
    setBulkEditMode(false);
    setSelectedSets([]);
  };

  const getWeightDelta = (currentTraining, setNumber) => {
    const allTrainings = getTrainingsForExercise();
    const currentIndex = allTrainings.findIndex(
      (t) => t.key === currentTraining.key
    );

    if (currentIndex <= 0) return null;

    const previousTraining = allTrainings[currentIndex - 1];
    const currentWeight =
      trainingGoals[currentTraining.key]?.[`set${setNumber}_weight`];
    const previousWeight =
      trainingGoals[previousTraining.key]?.[`set${setNumber}_weight`];

    if (!currentWeight || !previousWeight) return null;

    const delta = parseFloat(currentWeight) - parseFloat(previousWeight);
    const percentage = (delta / parseFloat(previousWeight)) * 100;

    if (delta === 0) return null;

    return {
      absolute: delta,
      percentage: percentage.toFixed(1),
    };
  };

  const renderSetRow = (training, setInfo) => {
    const today = new Date().toISOString().split("T")[0];
    const isCompleted = training.date < today;
    const rowClass = isCompleted ? "bg-green-50" : "";
    const setKey = `${training.key}-set${setInfo.setNumber}`;
    const isSetSelected = selectedSets.includes(setKey);
    const isVisible =
      setFilter === "all" || setFilter === String(setInfo.setNumber);

    // Zeige Gewichtsdelta nur beim Hauptsatz, nicht bei Dropsets
    const showWeightDelta =
      setInfo.setNumber === 1 && typeof setInfo.setNumber === "number";
    const weightDelta = showWeightDelta
      ? getWeightDelta(training, setInfo.setNumber)
      : null;

    if (!isVisible) return null;

    return (
      <tr
        key={setKey}
        className={`border-b ${rowClass} ${
          bulkEditMode && isSetSelected ? "bg-blue-100" : bulkEditMode ? "" : ""
        }`}
      >
        {bulkEditMode && (
          <td className="p-2 text-center">
            <input
              type="checkbox"
              checked={isSetSelected}
              onChange={() => toggleSetSelection(setKey)}
              className="cursor-pointer"
            />
          </td>
        )}
        <td className="p-2">{training.number}</td>
        <td className="p-2">{training.week}</td>
        <td className="p-2">{training.date}</td>
        <td className="p-2 text-center">{training.type}</td>
        <td className="p-2">Satz {setInfo.setNumber}</td>
        <td className="p-2">
          <input
            type="text"
            value={setInfo.reps}
            onChange={(e) =>
              updateGoal(
                training.key,
                `set${setInfo.setNumber}_reps`,
                e.target.value
              )
            }
            className="form-control"
            style={{ width: "80px" }}
          />
        </td>
        <td className="p-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={setInfo.weight}
              onChange={(e) =>
                updateGoal(
                  training.key,
                  `set${setInfo.setNumber}_weight`,
                  e.target.value
                )
              }
              className="form-control"
              style={{ width: "80px" }}
              step="0.5"
            />
            {weightDelta !== null && (
              <span
                className={`text-sm ${
                  weightDelta.absolute > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {weightDelta.absolute > 0 ? "+" : ""}
                {weightDelta.absolute} kg
                <span className="ml-1">
                  ({weightDelta.absolute > 0 ? "+" : ""}
                  {weightDelta.percentage}%)
                </span>
              </span>
            )}
          </div>
        </td>
        <td className="p-2 text-center">
          {selectedExerciseObj?.allowsDropset && (
            <input
              type="checkbox"
              checked={setInfo.isDropset}
              onChange={(e) =>
                updateGoal(
                  training.key,
                  `set${setInfo.setNumber}_dropset`,
                  e.target.checked
                )
              }
              className="cursor-pointer"
            />
          )}
        </td>
        <td className="p-2 text-center">
          <select
            value={setInfo.rpe}
            onChange={(e) =>
              updateGoal(
                training.key,
                `set${setInfo.setNumber}_rpe`,
                e.target.value
              )
            }
            className="form-control"
            style={{ width: "60px", margin: "0 auto" }}
          >
            <option value="">-</option>
            {[...Array(10)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </td>
      </tr>
    );
  };

  const renderSetRows = (training) => {
    const goals = trainingGoals[training.key] || {};
    const rows = [];

    for (let i = 0; i < training.exercise.sets; i++) {
      const setNumber = i + 1;
      const isDropset = goals[`set${setNumber}_dropset`] || false;

      // Hauptsatz
      const setInfo = {
        setNumber,
        isDropset,
        weight: goals[`set${setNumber}_weight`] || "",
        reps: goals[`set${setNumber}_reps`] || training.exercise.reps,
        rpe: goals[`set${setNumber}_rpe`] || "",
      };

      rows.push(renderSetRow(training, setInfo));

      // Dropset falls aktiviert
      if (isDropset && selectedExerciseObj?.allowsDropset) {
        const dropsetInfo = {
          setNumber: `${setNumber}a`,
          isDropset: false,
          weight: goals[`set${setNumber}_dropsetWeight`] || "",
          reps: goals[`set${setNumber}_dropsetReps`] || "",
          rpe: "", // Dropset verwendet RPE vom Hauptsatz
        };

        const isCompleted =
          training.date < new Date().toISOString().split("T")[0];
        const isSelected = selectedTrainings.includes(training.key);
        const selectedClass = isSelected ? "bg-blue-50" : "";

        rows.push(
          <tr
            key={`${training.key}-set${setNumber}a`}
            className={`${isCompleted ? "bg-green-50" : ""} ${
              bulkEditMode ? selectedClass : ""
            }`}
            style={{
              backgroundColor: isSelected
                ? "rgba(219, 234, 254, 0.5)"
                : undefined,
            }}
          >
            {bulkEditMode && <td></td>}
            <td colSpan="5" className="p-2 pl-8 text-gray-600">
              → Dropset
            </td>
            <td className="p-2">
              <input
                type="text"
                value={dropsetInfo.reps}
                onChange={(e) =>
                  updateGoal(
                    training.key,
                    `set${setNumber}_dropsetReps`,
                    e.target.value
                  )
                }
                className="form-control"
                style={{ width: "80px" }}
              />
            </td>
            <td className="p-2">
              <input
                type="number"
                value={dropsetInfo.weight}
                onChange={(e) =>
                  updateGoal(
                    training.key,
                    `set${setNumber}_dropsetWeight`,
                    e.target.value
                  )
                }
                className="form-control"
                style={{ width: "80px" }}
                step="0.5"
              />
            </td>
            <td></td>
            <td></td>
          </tr>
        );
      }
    }

    return rows;
  };

  const calculateAutomaticSuggestions = () => {
    const trainings = getTrainingsForExercise();
    const exercise = exercises.find((e) => e.id === selectedExercise);

    if (!exercise || trainings.length === 0) return;

    const isSpecificWeights = exercise.weightIncrementType === "specific";
    const availableWeights = isSpecificWeights
      ? exercise.specificWeights
          .filter((w) => w !== "")
          .map(Number)
          .sort((a, b) => a - b)
      : [];

    const increment = isSpecificWeights
      ? null
      : Number(exercise.weightIncrements);
    const startWeight = Number(suggestionSettings.startWeight);
    const endWeight = Number(suggestionSettings.endWeight);

    // Berechne Trainings, die berücksichtigt werden sollen
    const relevantTrainings = trainings.filter(
      (training, index) =>
        !suggestionSettings.alternateIncrease || index % 2 === 0
    );

    // Gewichtsvorschläge
    let currentWeight = startWeight;
    let currentTrainingIndex = 0;

    trainings.forEach((training, index) => {
      if (suggestionSettings.alternateIncrease && index % 2 === 1) {
        // Keine Änderung bei alternierenden Trainings
        setWeightForTraining(training, currentWeight, exercise);
        return;
      }

      // SETZE GEWICHT BEVOR BERECHNUNG
      setWeightForTraining(training, currentWeight, exercise);

      if (currentTrainingIndex !== relevantTrainings.length - 1) {
        // Berechne nächstes Gewicht
        currentWeight = calculateNextWeight(
          currentWeight,
          endWeight,
          availableWeights,
          increment,
          currentTrainingIndex,
          relevantTrainings.length
        );
      } else {
        // Letztes relevantes Training
        currentWeight = endWeight;
      }

      currentTrainingIndex++;
    });

    alert("Zielvorschläge wurden übernommen!");
    setShowSuggestions(false);
  };

  const calculateNextWeight = (
    current,
    target,
    availableWeights,
    increment,
    step,
    totalSteps
  ) => {
    if (availableWeights.length > 0) {
      // Spezifische Gewichte
      const currentIndex = availableWeights.indexOf(current);
      const targetIndex = availableWeights.indexOf(target);

      if (currentIndex === -1 || targetIndex === -1) return current;

      const stepsToTarget = targetIndex - currentIndex;
      const stepsPerIncrement = Math.max(
        1,
        Math.floor(totalSteps / Math.abs(stepsToTarget))
      );

      if (
        (step + 1) % stepsPerIncrement === 0 &&
        currentIndex !== targetIndex
      ) {
        const direction = stepsToTarget > 0 ? 1 : -1;
        const nextIndex = currentIndex + direction;
        return availableWeights[nextIndex] || current;
      }

      return current;
    } else {
      // Standardsprünge
      const totalDelta = target - current;
      const incrementsNeeded = Math.round(totalDelta / increment);
      const stepsPerIncrement = Math.max(
        1,
        Math.floor(totalSteps / Math.abs(incrementsNeeded))
      );

      if ((step + 1) % stepsPerIncrement === 0) {
        const direction = totalDelta > 0 ? 1 : -1;
        return current + increment * direction;
      }

      return current;
    }
  };

  const setWeightForTraining = (training, weight, exercise) => {
    // Setze Gewicht für alle Sätze
    for (let i = 1; i <= training.exercise.sets; i++) {
      updateGoal(training.key, `set${i}_weight`, weight);

      // Bei spezifischen Gewichten prüfe, ob Dropset nötig ist
      if (
        exercise.weightIncrementType === "specific" &&
        exercise.allowsDropset
      ) {
        const availableWeights = exercise.specificWeights
          .filter((w) => w !== "")
          .map(Number);
        const currentIndex = availableWeights.indexOf(weight);

        if (currentIndex > 0 && currentIndex < availableWeights.length - 1) {
          // Schlage Dropset mit niedrigerem Gewicht vor
          const dropsetWeight = availableWeights[currentIndex - 1];
          updateGoal(training.key, `set${i}_dropset`, true);
          updateGoal(training.key, `set${i}_dropsetWeight`, dropsetWeight);
          updateGoal(
            training.key,
            `set${i}_dropsetReps`,
            training.exercise.reps
          );
        }
      }
    }
  };

  const selectedExerciseObj = exercises.find((e) => e.id === selectedExercise);
  const canUseDropset = selectedExerciseObj?.allowsDropset || false;

  return (
    <div className="exercise-manager">
      <h1 className="text-3xl font-bold mb-6">Trainingsziele verwalten</h1>

      {!currentMeso ? (
        <p className="no-data">Kein aktiver Mesozyklus gefunden</p>
      ) : (
        <>
          <div className="exercise-form mb-6">
            <h3 className="text-lg font-medium mb-2">Aktueller Mesozyklus</h3>
            <p className="text-gray-600">
              #{currentMeso.number} -{" "}
              {new Date(currentMeso.startDate).toLocaleDateString()} bis{" "}
              {new Date(currentMeso.endDate).toLocaleDateString()}
            </p>
          </div>

          <div className="exercise-form mb-6">
            <div className="form-group">
              <label>Übung auswählen:</label>
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="form-control"
              >
                <option value="">Übung auswählen...</option>
                {exercises.map((exercise) => (
                  <option key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedExercise && (
            <div className="exercise-list-container">
              {getTrainingsForExercise().length === 0 ? (
                <p className="no-data">
                  Diese Übung kommt in keinem Training vor
                </p>
              ) : (
                <>
                  <div className="exercise-form mb-6">
                    <div className="header">
                      <h3 className="text-lg font-medium">
                        {selectedExerciseObj?.name} - Trainingsziele
                      </h3>
                      <div className="flex gap-2">
                        {bulkEditMode ? (
                          <>
                            <button
                              onClick={applyBulkValues}
                              className="btn btn-primary"
                              disabled={selectedTrainings.length === 0}
                            >
                              <Copy size={18} className="mr-1" /> Werte
                              übernehmen ({selectedTrainings.length})
                            </button>
                            <button
                              onClick={toggleBulkEditMode}
                              className="btn btn-secondary"
                            >
                              Abbrechen
                            </button>
                          </>
                        ) : showSuggestions ? (
                          <>
                            <button
                              onClick={calculateAutomaticSuggestions}
                              className="btn btn-primary"
                            >
                              <Calculator size={18} className="mr-1" />{" "}
                              Berechnen
                            </button>
                            <button
                              onClick={() => setShowSuggestions(false)}
                              className="btn btn-secondary"
                            >
                              Abbrechen
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setShowSuggestions(true)}
                              className="btn btn-secondary mr-2"
                            >
                              <TrendingUp size={18} className="mr-1" />{" "}
                              Zielvorschläge
                            </button>
                            <button
                              onClick={toggleBulkEditMode}
                              className="btn btn-secondary mr-2"
                            >
                              <Copy size={18} className="mr-1" />{" "}
                              Mehrfachbearbeitung
                            </button>
                            <button
                              onClick={saveAllGoals}
                              className="btn btn-primary"
                            >
                              <Save size={18} className="mr-1" /> Alle Ziele
                              speichern
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {showSuggestions && (
                      <div className="bg-gray-50 p-4 mt-4 rounded border">
                        <h4 className="font-medium mb-2">
                          Automatische Zielvorschläge
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="text-sm">
                              Startgewicht (kg):
                            </label>
                            <input
                              type="number"
                              value={suggestionSettings.startWeight}
                              onChange={(e) =>
                                setSuggestionSettings({
                                  ...suggestionSettings,
                                  startWeight: e.target.value,
                                })
                              }
                              className="form-control"
                              step="0.5"
                            />
                          </div>
                          <div>
                            <label className="text-sm">Zielgewicht (kg):</label>
                            <input
                              type="number"
                              value={suggestionSettings.endWeight}
                              onChange={(e) =>
                                setSuggestionSettings({
                                  ...suggestionSettings,
                                  endWeight: e.target.value,
                                })
                              }
                              className="form-control"
                              step="0.5"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={suggestionSettings.alternateIncrease}
                                onChange={(e) =>
                                  setSuggestionSettings({
                                    ...suggestionSettings,
                                    alternateIncrease: e.target.checked,
                                  })
                                }
                              />
                              <span className="text-sm">
                                Nur jedes 2. Training gewicht erhöhen
                              </span>
                            </label>
                          </div>
                        </div>

                        {selectedExerciseObj?.weightIncrementType ===
                          "specific" && (
                          <div className="mt-4 p-3 bg-blue-50 rounded">
                            <h5 className="text-sm font-medium mb-1">
                              Hinweis: Spezifische Gewichte
                            </h5>
                            <p className="text-sm text-gray-600">
                              Verfügbare Gewichte:{" "}
                              {selectedExerciseObj.specificWeights
                                .filter((w) => w !== "")
                                .join(", ")}{" "}
                              kg
                              <br />
                              Dropsets werden automatisch vorgeschlagen, um
                              einen linearen Anstieg zu ermöglichen.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {bulkEditMode && (
                      <div className="bg-gray-50 p-4 mt-4 rounded border">
                        <h4 className="font-medium mb-2">
                          Werte für ausgewählte Trainings:
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="text-sm">Wiederholungen:</label>
                            <input
                              type="text"
                              value={bulkValues.reps}
                              onChange={(e) =>
                                setBulkValues({
                                  ...bulkValues,
                                  reps: e.target.value,
                                })
                              }
                              className="form-control"
                              placeholder="z.B. 8-12"
                            />
                          </div>
                          <div>
                            <label className="text-sm">Gewicht:</label>
                            <input
                              type="number"
                              value={bulkValues.weight}
                              onChange={(e) =>
                                setBulkValues({
                                  ...bulkValues,
                                  weight: e.target.value,
                                })
                              }
                              className="form-control"
                              step="0.5"
                            />
                          </div>
                          <div>
                            <label className="text-sm">RPE:</label>
                            <select
                              value={bulkValues.rpe}
                              onChange={(e) =>
                                setBulkValues({
                                  ...bulkValues,
                                  rpe: e.target.value,
                                })
                              }
                              className="form-control"
                            >
                              <option value="">-</option>
                              {[...Array(10)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>
                                  {i + 1}
                                </option>
                              ))}
                            </select>
                          </div>
                          {canUseDropset && (
                            <>
                              <div>
                                <label className="text-sm">Dropset:</label>
                                <select
                                  value={bulkValues.useDropset}
                                  onChange={(e) =>
                                    setBulkValues({
                                      ...bulkValues,
                                      useDropset: e.target.value === "true",
                                    })
                                  }
                                  className="form-control"
                                >
                                  <option value="false">Nein</option>
                                  <option value="true">Ja</option>
                                </select>
                              </div>
                              {bulkValues.useDropset && (
                                <>
                                  <div>
                                    <label className="text-sm">
                                      Dropset Wdh:
                                    </label>
                                    <input
                                      type="text"
                                      value={bulkValues.dropsetReps}
                                      onChange={(e) =>
                                        setBulkValues({
                                          ...bulkValues,
                                          dropsetReps: e.target.value,
                                        })
                                      }
                                      className="form-control"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm">
                                      Dropset Gewicht:
                                    </label>
                                    <input
                                      type="number"
                                      value={bulkValues.dropsetWeight}
                                      onChange={(e) =>
                                        setBulkValues({
                                          ...bulkValues,
                                          dropsetWeight: e.target.value,
                                        })
                                      }
                                      className="form-control"
                                      step="0.5"
                                    />
                                  </div>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 mb-4">
                      <label className="text-sm font-medium">
                        Sätze filtern:
                      </label>
                      <select
                        value={setFilter}
                        onChange={(e) => setSetFilter(e.target.value)}
                        className="form-control"
                        style={{ width: "150px" }}
                      >
                        <option value="all">Alle Sätze</option>
                        {[1, 2, 3, 4, 5].map((num) => (
                          <option key={num} value={String(num)}>
                            Nur {num}. Satz
                          </option>
                        ))}
                      </select>
                    </div>

                    <table className="min-w-full mt-4">
                      <thead>
                        <tr className="bg-gray-50">
                          {bulkEditMode && (
                            <th className="p-2 text-center">
                              <button
                                onClick={selectAllVisibleSets}
                                className="btn btn-sm"
                              >
                                {selectedSets.length ===
                                getFilteredSets().length ? (
                                  <CheckSquare size={16} />
                                ) : (
                                  <Square size={16} />
                                )}
                              </button>
                            </th>
                          )}
                          <th className="p-2 text-left">Training #</th>
                          <th className="p-2 text-left">Woche</th>
                          <th className="p-2 text-left">Datum</th>
                          <th className="p-2 text-center">Typ</th>
                          <th className="p-2 text-left">Satz</th>
                          <th className="p-2 text-left">Wiederholungen</th>
                          <th className="p-2 text-left">Gewicht</th>
                          {canUseDropset && (
                            <th className="p-2 text-center">Dropset</th>
                          )}
                          <th className="p-2 text-center">RPE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getTrainingsForExercise().map((training) => {
                          return renderSetRows(training);
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default TrainingGoals;
