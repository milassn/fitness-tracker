import React, { useState } from "react";
import { Plus, Edit2, Trash2, X, Save } from "lucide-react";
import { saveData, loadData, removeData } from "../../utils/storage";

function ExerciseList({ onExercisesChange }) {
  const [exercises, setExercises] = useState(() => {
    return loadData("exercises") || [];
  });
  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    muscleGroup: "",
    movement: "",
    weightIncrementType: "standard", // "standard" oder "specific"
    weightIncrements: "2.5",
    specificWeights: ["", "", "", "", ""],
    allowsDropset: false,
  });

  const saveExercise = () => {
    if (!formData.name) {
      alert("Bitte gib einen Namen für die Übung ein.");
      return;
    }

    let updatedExercises;
    if (editingExercise) {
      updatedExercises = exercises.map((exercise) =>
        exercise.id === editingExercise.id
          ? { ...formData, id: editingExercise.id }
          : exercise
      );
    } else {
      const newExercise = {
        ...formData,
        id: `exercise-${Date.now()}`,
      };
      updatedExercises = [...exercises, newExercise];
    }

    setExercises(updatedExercises);
    saveData("exercises", updatedExercises);
    onExercisesChange?.(updatedExercises); // Optional chaining für den Fall, dass die Prop nicht übergeben wird
    setShowForm(false);
    setEditingExercise(null);
    resetForm();
  };

  const deleteExercise = (id) => {
    const updatedExercises = exercises.filter((exercise) => exercise.id !== id);
    setExercises(updatedExercises);
    saveData("exercises", updatedExercises);
    onExercisesChange?.(updatedExercises);
  };

  const startEdit = (exercise) => {
    setEditingExercise(exercise);
    setFormData(exercise);
    setShowForm(true);
  };

  const startNew = () => {
    setEditingExercise(null);
    resetForm();
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      muscleGroup: "",
      movement: "",
      weightIncrementType: "standard",
      weightIncrements: "2.5",
      specificWeights: ["", "", "", "", ""],
      allowsDropset: false,
    });
  };

  return (
    <div className="exercise-manager">
      <div className="header">
        <h1>Übungen verwalten</h1>
        {!showForm && (
          <button onClick={startNew} className="btn btn-primary">
            <Plus size={18} className="mr-1" /> Neue Übung hinzufügen
          </button>
        )}
      </div>

      {showForm && (
        <div className="exercise-form">
          <div className="header">
            <h2>
              {editingExercise ? "Übung bearbeiten" : "Neue Übung hinzufügen"}
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          <div className="form-group">
            <label>Name der Übung:</label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="z.B. Bankdrücken"
            />
          </div>

          <div className="form-group">
            <label>Muskelgruppe:</label>
            <select
              className="form-control"
              value={formData.muscleGroup}
              onChange={(e) =>
                setFormData({ ...formData, muscleGroup: e.target.value })
              }
            >
              <option value="">Bitte auswählen...</option>
              <option value="Beine">Beine</option>
              <option value="Brust">Brust</option>
              <option value="Rücken">Rücken</option>
              <option value="Schultern">Schultern</option>
              <option value="Arme">Arme</option>
              <option value="Bauch">Bauch</option>
            </select>
          </div>

          <div className="form-group">
            <label>Bewegungstyp:</label>
            <select
              className="form-control"
              value={formData.movement}
              onChange={(e) =>
                setFormData({ ...formData, movement: e.target.value })
              }
            >
              <option value="">Bitte auswählen...</option>
              <option value="Push">Push</option>
              <option value="Pull">Pull</option>
              <option value="Squat">Squat</option>
              <option value="Hip Hinge">Hip Hinge</option>
              <option value="Isolation">Isolation</option>
              <option value="Core">Core</option>
            </select>
          </div>

          <div className="form-group">
            <label>Gewichtsoptionen:</label>
            <select
              className="form-control"
              value={formData.weightIncrementType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  weightIncrementType: e.target.value,
                })
              }
            >
              <option value="standard">Standardsprünge</option>
              <option value="specific">Verfügbare Gewichte</option>
            </select>
          </div>

          {formData.weightIncrementType === "standard" ? (
            <div className="form-group">
              <label>Mindestgewichtssprung (kg):</label>
              <select
                className="form-control"
                value={formData.weightIncrements}
                onChange={(e) =>
                  setFormData({ ...formData, weightIncrements: e.target.value })
                }
              >
                <option value="0.5">0.5 kg</option>
                <option value="1">1 kg</option>
                <option value="1.25">1.25 kg</option>
                <option value="2.5">2.5 kg</option>
                <option value="5">5 kg</option>
              </select>
            </div>
          ) : (
            <div className="form-group">
              <label>Verfügbare Gewichte (kg):</label>
              <div className="grid grid-cols-5 gap-2">
                {formData.specificWeights.map((weight, index) => (
                  <input
                    key={index}
                    type="number"
                    value={weight}
                    onChange={(e) => {
                      const newWeights = [...formData.specificWeights];
                      newWeights[index] = e.target.value;
                      setFormData({ ...formData, specificWeights: newWeights });
                    }}
                    className="form-control"
                    placeholder={`Gewicht ${index + 1}`}
                    step="0.5"
                  />
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <div className="checkbox">
              <input
                type="checkbox"
                checked={formData.allowsDropset}
                onChange={(e) =>
                  setFormData({ ...formData, allowsDropset: e.target.checked })
                }
              />
              <label>Dropset möglich</label>
            </div>
          </div>

          <div className="form-actions">
            <button onClick={saveExercise} className="btn btn-primary">
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
      )}

      <div className="exercise-list-container">
        {exercises.length === 0 ? (
          <p className="no-data">Keine Übungen erstellt</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Muskelgruppe</th>
                <th>Bewegungstyp</th>
                <th>Gewichte</th>
                <th>Dropset</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {exercises.map((exercise) => (
                <tr key={exercise.id}>
                  <td>{exercise.name}</td>
                  <td>{exercise.muscleGroup}</td>
                  <td>{exercise.movement}</td>
                  <td>
                    {exercise.weightIncrementType === "standard"
                      ? `${exercise.weightIncrements} kg Sprünge`
                      : `${(exercise.specificWeights || [])
                          .filter((w) => w !== "")
                          .join(", ")} kg`}
                  </td>
                  <td>{exercise.allowsDropset ? "Ja" : "Nein"}</td>
                  <td>
                    <div className="actions">
                      <button
                        onClick={() => startEdit(exercise)}
                        className="btn btn-edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => deleteExercise(exercise.id)}
                        className="btn btn-delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ExerciseList;
