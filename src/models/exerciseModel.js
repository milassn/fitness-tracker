// Definiert die Datenstruktur und Operationen für Übungen

import { saveData, loadData } from "../utils/storage";

// Konstanten für Messtypen
export const MEASUREMENT_TYPES = {
  WEIGHT_REPS: "weight_reps",
  REPS: "reps",
  TIME: "time",
  DISTANCE: "distance",
};

class ExerciseModel {
  constructor() {
    this.exercises = this.loadExercises();
  }

  // Lädt alle Übungen aus dem LocalStorage
  loadExercises() {
    return loadData("exercises") || [];
  }

  // Speichert alle Übungen im LocalStorage
  saveExercises() {
    saveData("exercises", this.exercises);
  }

  // Generiert eine eindeutige ID
  generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 5);
  }

  // Erstellt eine neue Übung
  createExercise(
    name,
    category,
    measurementType = MEASUREMENT_TYPES.WEIGHT_REPS,
    canBeDropset = false
  ) {
    if (!name || name.trim() === "") {
      throw new Error("Der Name der Übung darf nicht leer sein");
    }

    const newExercise = {
      id: this.generateId(),
      name: name.trim(),
      category: category || "Sonstige",
      measurementType,
      canBeDropset,
      createdAt: new Date().toISOString(),
    };

    this.exercises.push(newExercise);
    this.saveExercises();
    return newExercise;
  }

  // Gibt eine bestimmte Übung zurück
  getExercise(exerciseId) {
    return this.exercises.find((e) => e.id === exerciseId) || null;
  }

  // Gibt alle Übungen zurück
  getAllExercises() {
    return [...this.exercises]; // Kopie zurückgeben, um direkte Änderungen zu vermeiden
  }

  // Gibt Übungen nach Kategorie zurück
  getExercisesByCategory(category) {
    if (!category) return [];
    return this.exercises.filter((e) => e.category === category);
  }

  // Aktualisiert eine Übung
  updateExercise(
    exerciseId,
    { name, category, measurementType, canBeDropset }
  ) {
    const exercise = this.getExercise(exerciseId);
    if (!exercise) {
      throw new Error("Übung nicht gefunden");
    }

    if (name !== undefined && name.trim() !== "") {
      exercise.name = name.trim();
    }

    if (category !== undefined) {
      exercise.category = category || "Sonstige";
    }

    if (measurementType !== undefined) {
      exercise.measurementType = measurementType;
    }

    if (canBeDropset !== undefined) {
      exercise.canBeDropset = !!canBeDropset;
    }

    this.saveExercises();
    return exercise;
  }

  // Löscht eine Übung
  deleteExercise(exerciseId) {
    const index = this.exercises.findIndex((e) => e.id === exerciseId);
    if (index === -1) {
      return false;
    }

    this.exercises.splice(index, 1);
    this.saveExercises();
    return true;
  }

  // Sucht Übungen anhand eines Suchbegriffs
  searchExercises(searchTerm) {
    if (!searchTerm || searchTerm.trim() === "") {
      return this.getAllExercises();
    }

    const term = searchTerm.toLowerCase().trim();
    return this.exercises.filter(
      (exercise) =>
        exercise.name.toLowerCase().includes(term) ||
        exercise.category.toLowerCase().includes(term)
    );
  }

  // Erstellt ein leeres Messwert-Objekt basierend auf dem Messtyp einer Übung
  createEmptyMeasurement(exerciseId) {
    const exercise = this.getExercise(exerciseId);
    if (!exercise) return null;

    switch (exercise.measurementType) {
      case MEASUREMENT_TYPES.WEIGHT_REPS:
        return {
          weight: 0,
          reps: 0,
          sets: 0,
          dropset: exercise.canBeDropset ? { weight: 0, reps: 0 } : null,
        };
      case MEASUREMENT_TYPES.REPS:
        return { reps: 0, sets: 0 };
      case MEASUREMENT_TYPES.TIME:
        return { minutes: 0, seconds: 0 };
      case MEASUREMENT_TYPES.DISTANCE:
        return { distance: 0, unit: "km" };
      default:
        return {};
    }
  }

  // Formatiert einen Messwert für die Anzeige
  formatMeasurement(exerciseId, value) {
    const exercise = this.getExercise(exerciseId);
    if (!exercise || !value) return "";

    switch (exercise.measurementType) {
      case MEASUREMENT_TYPES.WEIGHT_REPS:
        let output = `${value.sets}x${value.reps} @ ${value.weight}kg`;
        // Wenn es ein Dropset ist und Dropset-Werte existieren
        if (
          exercise.canBeDropset &&
          value.dropset &&
          value.dropset.weight &&
          value.dropset.reps
        ) {
          output += ` → ${value.dropset.reps} @ ${value.dropset.weight}kg`;
        }
        return output;
      case MEASUREMENT_TYPES.REPS:
        return `${value.sets}x${value.reps}`;
      case MEASUREMENT_TYPES.TIME:
        return `${value.minutes}:${value.seconds.toString().padStart(2, "0")}`;
      case MEASUREMENT_TYPES.DISTANCE:
        return `${value.distance}${value.unit}`;
      default:
        return JSON.stringify(value);
    }
  }

  // Erstellt einige Standardübungen, falls keine vorhanden sind
  createDefaultExercises() {
    if (this.exercises.length > 0) {
      return; // Nur ausführen, wenn noch keine Übungen existieren
    }

    const defaultExercises = [
      {
        name: "Beinpresse",
        category: "Beine",
        measurementType: MEASUREMENT_TYPES.WEIGHT_REPS,
        canBeDropset: true,
      },
      {
        name: "Brustpresse",
        category: "Brust",
        measurementType: MEASUREMENT_TYPES.WEIGHT_REPS,
        canBeDropset: true,
      },
      {
        name: "Kreuzheben",
        category: "Rücken",
        measurementType: MEASUREMENT_TYPES.WEIGHT_REPS,
        canBeDropset: true,
      },
      {
        name: "Latzug",
        category: "Rücken",
        measurementType: MEASUREMENT_TYPES.REPS,
        canBeDropset: false,
      },
      {
        name: "Schulterdrücken",
        category: "Schultern",
        measurementType: MEASUREMENT_TYPES.WEIGHT_REPS,
        canBeDropset: true,
      },
      {
        name: "Bizeps",
        category: "Arme",
        measurementType: MEASUREMENT_TYPES.WEIGHT_REPS,
        canBeDropset: true,
      },
      {
        name: "Trizeps",
        category: "Arme",
        measurementType: MEASUREMENT_TYPES.REPS,
        canBeDropset: false,
      },
      {
        name: "Rudern",
        category: "Beine",
        measurementType: MEASUREMENT_TYPES.WEIGHT_REPS,
        canBeDropset: true,
      },
    ];

    for (const exercise of defaultExercises) {
      this.createExercise(
        exercise.name,
        exercise.category,
        exercise.measurementType,
        exercise.canBeDropset
      );
    }
  }
}

// Exportiere eine Singleton-Instanz
export const exerciseModel = new ExerciseModel();
