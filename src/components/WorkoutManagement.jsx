import React, { useState } from "react";
import { Edit2, Trash2, Plus, X, Save, MoveDown, MoveUp } from "lucide-react";
import { saveData, loadData } from "../utils/storage";

function WorkoutManagement({
  workoutTemplates,
  onSaveTemplate,
  onDeleteTemplate,
  exercises,
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);
  const [workoutForm, setWorkoutForm] = useState({
    name: "",
    exercises: [],
  });
  const [selectedExercise, setSelectedExercise] = useState("");
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Start neues Workout erstellen
  const startNewWorkout = () => {
    setEditingWorkout(null);
    setWorkoutForm({
      name: "",
      exercises: [],
    });
    setShowForm(true);
  };

  // Start Workout bearbeiten
  const startEditWorkout = (workout) => {
    setEditingWorkout(workout);
    setWorkoutForm(workout);
    setShowForm(true);
  };

  // Speichere Workout
  const saveWorkout = () => {
    if (!workoutForm.name) {
      alert("Bitte gib einen Namen für das Workout ein.");
      return;
    }

    if (workoutForm.exercises.length === 0) {
      alert("Füge mindestens eine Übung hinzu.");
      return;
    }

    const workout = {
      ...workoutForm,
      id: editingWorkout ? editingWorkout.id : `workout-${Date.now()}`,
    };

    onSaveTemplate(workout);
    setShowForm(false);
  };

  // Füge Übung hinzu
  const addExercise = () => {
    if (!selectedExercise) {
      alert("Bitte wähle eine Übung aus.");
      return;
    }

    const exercise = exercises.find((ex) => ex.id === selectedExercise);
    const newExercise = {
      id: exercise.id,
      name: exercise.name,
      sets: 3,
      reps: "8-12",
      useDropset: exercise.allowsDropset ? false : false, // Initial false
    };

    setWorkoutForm({
      ...workoutForm,
      exercises: [...workoutForm.exercises, newExercise],
    });
    setSelectedExercise("");
  };

  // Update Übung
  const updateExercise = (index, field, value) => {
    const updatedExercises = [...workoutForm.exercises];
    updatedExercises[index] = {
      ...updatedExercises[index],
      [field]: value,
    };
    setWorkoutForm({
      ...workoutForm,
      exercises: updatedExercises,
    });
  };

  // Entferne Übung
  const removeExercise = (index) => {
    const updatedExercises = [...workoutForm.exercises];
    updatedExercises.splice(index, 1);
    setWorkoutForm({
      ...workoutForm,
      exercises: updatedExercises,
    });
  };

  // Drag and Drop Funktionen
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();

    if (draggedIndex === null) return;

    const updatedExercises = [...workoutForm.exercises];
    const draggedItem = updatedExercises[draggedIndex];

    // Element entfernen
    updatedExercises.splice(draggedIndex, 1);
    // Element an neuer Position einfügen
    updatedExercises.splice(dropIndex, 0, draggedItem);

    setWorkoutForm({
      ...workoutForm,
      exercises: updatedExercises,
    });
    setDraggedIndex(null);
  };

  // Alternative: Pfeile zum Verschieben
  const moveExerciseUp = (index) => {
    if (index === 0) return;

    const updatedExercises = [...workoutForm.exercises];
    const temp = updatedExercises[index - 1];
    updatedExercises[index - 1] = updatedExercises[index];
    updatedExercises[index] = temp;

    setWorkoutForm({
      ...workoutForm,
      exercises: updatedExercises,
    });
  };

  const moveExerciseDown = (index) => {
    if (index === workoutForm.exercises.length - 1) return;

    const updatedExercises = [...workoutForm.exercises];
    const temp = updatedExercises[index + 1];
    updatedExercises[index + 1] = updatedExercises[index];
    updatedExercises[index] = temp;

    setWorkoutForm({
      ...workoutForm,
      exercises: updatedExercises,
    });
  };

  return (
    <div className="exercise-manager">
      <h1 className="text-3xl font-bold mb-6">Workout Verwaltung</h1>

      {showForm ? (
        // Workout Formular
        <div className="exercise-form">
          <div className="header">
            <h2 className="text-xl font-semibold">
              {editingWorkout
                ? "Workout bearbeiten"
                : "Neues Workout erstellen"}
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          <div className="form-group">
            <label>Workout Name:</label>
            <input
              type="text"
              value={workoutForm.name}
              onChange={(e) =>
                setWorkoutForm({ ...workoutForm, name: e.target.value })
              }
              placeholder="z.B. Ganzkörper Training, Push Day..."
              className="form-control"
            />
          </div>

          <h3 className="text-lg font-medium mb-3">Übungen</h3>

          {/* Übung hinzufügen */}
          <div className="flex gap-2 mb-6">
            {exercises.length === 0 ? (
              <p className="no-data">
                Bitte erstelle erst Übungen unter "Übungen verwalten"
              </p>
            ) : (
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
            )}
            <button
              onClick={addExercise}
              className="btn btn-primary"
              disabled={exercises.length === 0}
            >
              <Plus size={18} className="mr-1" /> Hinzufügen
            </button>
          </div>

          {/* Übungen Tabelle */}
          {workoutForm.exercises.length > 0 ? (
            <table className="mb-6">
              <thead>
                <tr className="bg-gray-50">
                  <th>Reihenfolge</th>
                  <th>Übung</th>
                  <th>Sätze</th>
                  <th>Wiederholungen</th>
                  <th>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {workoutForm.exercises.map((exercise, index) => {
                  const exerciseObj = exercises.find(
                    (ex) => ex.id === exercise.id
                  );
                  return (
                    <tr
                      key={`${exercise.id}-${index}`}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      className={draggedIndex === index ? "bg-gray-100" : ""}
                      style={{ opacity: draggedIndex === index ? 0.5 : 1 }}
                    >
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => moveExerciseUp(index)}
                            disabled={index === 0}
                            className={`btn btn-sm ${
                              index === 0
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-gray-200"
                            }`}
                            title="Nach oben"
                          >
                            <MoveUp size={14} />
                          </button>
                          <button
                            onClick={() => moveExerciseDown(index)}
                            disabled={
                              index === workoutForm.exercises.length - 1
                            }
                            className={`btn btn-sm ${
                              index === workoutForm.exercises.length - 1
                                ? "opacity-50 cursor-not-allowed"
                                : "hover:bg-gray-200"
                            }`}
                            title="Nach unten"
                          >
                            <MoveDown size={14} />
                          </button>
                        </div>
                      </td>
                      <td>{exercise.name}</td>
                      <td>
                        <input
                          type="number"
                          value={exercise.sets}
                          onChange={(e) =>
                            updateExercise(
                              index,
                              "sets",
                              parseInt(e.target.value)
                            )
                          }
                          className="form-control"
                          min="1"
                          style={{ width: "60px" }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={exercise.reps}
                          onChange={(e) =>
                            updateExercise(index, "reps", e.target.value)
                          }
                          placeholder="z.B. 8-12"
                          className="form-control"
                          style={{ width: "100px" }}
                        />
                      </td>
                      <td>
                        <button
                          onClick={() => removeExercise(index)}
                          className="btn btn-delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="no-data">Keine Übungen hinzugefügt</p>
          )}

          {/* Speichern/Abbrechen Buttons */}
          <div className="form-actions">
            <button onClick={saveWorkout} className="btn btn-primary">
              <Save size={18} className="mr-1" /> Speichern
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="btn btn-secondary"
            >
              Abbrechen
            </button>
          </div>
        </div>
      ) : (
        // Workout Liste mit detaillierter Übersicht
        <>
          <button onClick={startNewWorkout} className="btn btn-primary mb-6">
            <Plus size={18} className="mr-1" /> Neues Workout hinzufügen
          </button>

          {workoutTemplates.length === 0 ? (
            <p className="no-data">Keine Workouts erstellt</p>
          ) : (
            <div className="exercise-list-container">
              {workoutTemplates.map((workout) => (
                <div key={workout.id} className="exercise-form">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">
                        {workout.name}
                      </h3>
                      <div className="text-sm">
                        {workout.exercises && workout.exercises.length > 0 ? (
                          <table className="min-w-full">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="text-left p-2">Übung</th>
                                <th className="text-left p-2">Sätze</th>
                                <th className="text-left p-2">
                                  Wiederholungen
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {workout.exercises.map((exercise, idx) => (
                                <tr key={idx} className="border-b">
                                  <td className="p-2">{exercise.name}</td>
                                  <td className="p-2">{exercise.sets}</td>
                                  <td className="p-2">{exercise.reps}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <p className="text-gray-500">Keine Übungen</p>
                        )}
                      </div>
                    </div>
                    <div className="actions">
                      <button
                        onClick={() => startEditWorkout(workout)}
                        className="btn btn-edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => onDeleteTemplate(workout.id)}
                        className="btn btn-delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default WorkoutManagement;
