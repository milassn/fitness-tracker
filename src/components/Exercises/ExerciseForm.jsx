import React, { useState, useEffect } from "react";
import { exerciseModel, MEASUREMENT_TYPES } from "../../models/exerciseModel";

function ExerciseForm({ exercise, onClose }) {
  // State für Formularfelder
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Brust");
  const [measurementType, setMeasurementType] = useState(
    MEASUREMENT_TYPES.WEIGHT_REPS
  );
  const [canBeDropset, setCanBeDropset] = useState(false);
  const [showDropsetOption, setShowDropsetOption] = useState(true);

  // Beim Laden der Komponente Daten setzen, wenn eine Übung zum Bearbeiten übergeben wurde
  useEffect(() => {
    if (exercise) {
      setName(exercise.name);
      setCategory(exercise.category);
      setMeasurementType(exercise.measurementType);
      setCanBeDropset(exercise.canBeDropset);
      updateDropsetVisibility(exercise.measurementType);
    } else {
      // Standardwerte für neue Übung
      updateDropsetVisibility(MEASUREMENT_TYPES.WEIGHT_REPS);
    }
  }, [exercise]);

  // Prüfen, ob die Dropset-Option angezeigt werden soll
  const updateDropsetVisibility = (type) => {
    setShowDropsetOption(type === MEASUREMENT_TYPES.WEIGHT_REPS);

    // Bei nicht unterstützten Messtypen Dropset-Option deaktivieren
    if (type !== MEASUREMENT_TYPES.WEIGHT_REPS) {
      setCanBeDropset(false);
    }
  };

  // Handler für Messtyp-Änderung
  const handleMeasurementTypeChange = (e) => {
    const newType = e.target.value;
    setMeasurementType(newType);
    updateDropsetVisibility(newType);
  };

  // Formular absenden
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validierung
    if (!name.trim()) {
      alert("Bitte gib einen Namen für die Übung ein.");
      return;
    }

    try {
      if (exercise) {
        // Bestehende Übung aktualisieren
        exerciseModel.updateExercise(exercise.id, {
          name,
          category,
          measurementType,
          canBeDropset,
        });
      } else {
        // Neue Übung erstellen
        exerciseModel.createExercise(
          name,
          category,
          measurementType,
          canBeDropset
        );
      }

      // Formular schließen
      onClose();
    } catch (error) {
      alert(`Fehler beim Speichern der Übung: ${error.message}`);
    }
  };

  return (
    <div className="exercise-form">
      <h3>
        {exercise
          ? `Übung bearbeiten: ${exercise.name}`
          : "Neue Übung erstellen"}
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="exerciseName">Name</label>
          <input
            type="text"
            id="exerciseName"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Name der Übung"
          />
        </div>

        <div className="form-group">
          <label htmlFor="exerciseCategory">Kategorie</label>
          <select
            id="exerciseCategory"
            className="form-control"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="Brust">Brust</option>
            <option value="Rücken">Rücken</option>
            <option value="Beine">Beine</option>
            <option value="Schultern">Schultern</option>
            <option value="Arme">Arme</option>
            <option value="Core">Core</option>
            <option value="Kardio">Kardio</option>
            <option value="Sonstige">Sonstige</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="measurementType">Messtyp</label>
          <select
            id="measurementType"
            className="form-control"
            value={measurementType}
            onChange={handleMeasurementTypeChange}
          >
            <option value={MEASUREMENT_TYPES.WEIGHT_REPS}>
              Gewicht & Wiederholungen
            </option>
            <option value={MEASUREMENT_TYPES.REPS}>Nur Wiederholungen</option>
            <option value={MEASUREMENT_TYPES.TIME}>Zeit</option>
            <option value={MEASUREMENT_TYPES.DISTANCE}>Distanz</option>
          </select>
        </div>

        {showDropsetOption && (
          <div className="form-group">
            <div className="checkbox">
              <label>
                <input
                  type="checkbox"
                  id="canBeDropset"
                  checked={canBeDropset}
                  onChange={(e) => setCanBeDropset(e.target.checked)}
                />
                Als Dropset ausführbar
              </label>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Speichern
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  );
}

export default ExerciseForm;
