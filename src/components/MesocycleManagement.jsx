import React, { useState } from "react";
import { Edit2, Trash2, Plus, X, Save } from "lucide-react";
import { saveData, loadData } from "../utils/storage";

// Aktivitätstypen Konstanten
export const ACTIVITY_TYPES = {
  TRAINING_A: "A",
  TRAINING_B: "B",
  PAUSE: "PAUSE",
  SICK: "KRANK",
  OTHER: "ACTIVITY",
};

function MesocycleManagement({ workoutTemplates, onMesocyclesChange }) {
  const [mesocycles, setMesocycles] = useState(() => {
    return loadData("mesocycles") || [];
  });
  const [showForm, setShowForm] = useState(false);
  const [editingMeso, setEditingMeso] = useState(null);
  const [mesoForm, setMesoForm] = useState({
    number: getNextMesoNumber(),
    startDate: "",
    endDate: "",
    pattern: "ABAB", // ABAB oder ABABAB
    trainingDays: {
      day1: "",
      day2: "",
      day3: "",
      day4: "",
      day5: "", // nur für ABABAB
      day6: "", // nur für ABABAB
    },
    workoutA: "",
    workoutB: "",
    generatedTrainings: [],
    activities: {}, // Neu: Für andere Aktivitäten
  });

  function getNextMesoNumber() {
    if (mesocycles.length === 0) return 6;
    const maxNumber = Math.max(...mesocycles.map((m) => m.number || 5));
    return maxNumber + 1;
  }

  const startNewMeso = () => {
    setEditingMeso(null);
    setMesoForm({
      number: getNextMesoNumber(),
      startDate: "",
      endDate: "",
      pattern: "ABAB",
      trainingDays: {
        day1: "",
        day2: "",
        day3: "",
        day4: "",
        day5: "",
        day6: "",
      },
      workoutA: "",
      workoutB: "",
      generatedTrainings: [],
      activities: {}, // Für neue Mesozyklen
    });
    setShowForm(true);
  };

  const startEditMeso = (meso) => {
    setEditingMeso(meso);
    setMesoForm({
      ...meso,
      activities: meso.activities || {}, // Stelle sicher, dass activities existiert
    });
    setShowForm(true);
  };

  const calculateWeeks = () => {
    if (!mesoForm.startDate || !mesoForm.endDate) return 0;
    const start = new Date(mesoForm.startDate);
    const end = new Date(mesoForm.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
  };

  const generateTrainings = () => {
    const start = new Date(mesoForm.startDate);
    const end = new Date(mesoForm.endDate);
    const trainings = [];
    let trainingNumber = 1;
    let currentDate = new Date(start);

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      let trainingType = null;
      let workoutId = null;

      // Prüfe ob der aktuelle Tag ein Trainingstag ist
      Object.entries(mesoForm.trainingDays).forEach(([key, value]) => {
        if (value && parseInt(value) === dayOfWeek) {
          const dayIndex = parseInt(key.replace("day", ""));
          if (mesoForm.pattern === "ABAB") {
            trainingType = dayIndex % 2 === 1 ? "A" : "B";
          } else {
            // ABABAB
            trainingType = dayIndex % 2 === 1 ? "A" : "B";
          }
          workoutId =
            trainingType === "A" ? mesoForm.workoutA : mesoForm.workoutB;
        }
      });

      if (trainingType && workoutId) {
        const weekNumber =
          Math.floor((currentDate - start) / (7 * 24 * 60 * 60 * 1000)) + 1;
        trainings.push({
          number: trainingNumber++,
          date: new Date(currentDate).toISOString().split("T")[0],
          week: weekNumber,
          type: trainingType,
          workoutId: workoutId,
          workout: workoutTemplates.find((w) => w.id === workoutId),
          completed: false,
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    setMesoForm((prev) => ({
      ...prev,
      generatedTrainings: trainings,
    }));
  };

  const saveMeso = () => {
    if (!mesoForm.startDate || !mesoForm.endDate) {
      alert("Bitte Start- und Enddatum auswählen.");
      return;
    }

    if (!mesoForm.workoutA || !mesoForm.workoutB) {
      alert("Bitte Workout A und B auswählen.");
      return;
    }

    const meso = {
      ...mesoForm,
      id: editingMeso ? editingMeso.id : `meso-${Date.now()}`,
      status: "aktiv",
      activities: editingMeso ? editingMeso.activities || {} : {}, // Erhalte existierende Aktivitäten
    };

    let updatedMesos;
    if (editingMeso) {
      updatedMesos = mesocycles.map((m) => (m.id === meso.id ? meso : m));
    } else {
      updatedMesos = [...mesocycles, meso];
    }

    setMesocycles(updatedMesos);
    saveData("mesocycles", updatedMesos);
    setShowForm(false);

    // Benachrichtige Parent-Komponente
    if (onMesocyclesChange) {
      onMesocyclesChange(updatedMesos);
    }
  };

  const deleteMeso = (id) => {
    const updatedMesos = mesocycles.filter((m) => m.id !== id);
    setMesocycles(updatedMesos);
    saveData("mesocycles", updatedMesos);

    if (onMesocyclesChange) {
      onMesocyclesChange(updatedMesos);
    }
  };

  // Neue Funktionen für den Kalender
  const addActivityToDate = (
    mesoId,
    date,
    activityType,
    activityName = null,
    notes = ""
  ) => {
    const updatedMesos = mesocycles.map((meso) => {
      if (meso.id === mesoId) {
        const activities = { ...meso.activities } || {};
        activities[date] = {
          type: activityType,
          activity: activityName,
          notes: notes,
          completed: false,
          createdAt: new Date().toISOString(),
        };
        return { ...meso, activities };
      }
      return meso;
    });
    setMesocycles(updatedMesos);
    saveData("mesocycles", updatedMesos);

    if (onMesocyclesChange) {
      onMesocyclesChange(updatedMesos);
    }
  };

  const markTrainingComplete = (mesoId, trainingNumber) => {
    const updatedMesos = mesocycles.map((meso) => {
      if (meso.id === mesoId) {
        const generatedTrainings = meso.generatedTrainings.map((training) => {
          if (training.number === trainingNumber) {
            return { ...training, completed: true };
          }
          return training;
        });
        return { ...meso, generatedTrainings };
      }
      return meso;
    });
    setMesocycles(updatedMesos);
    saveData("mesocycles", updatedMesos);

    if (onMesocyclesChange) {
      onMesocyclesChange(updatedMesos);
    }
  };

  const moveTraining = (mesoId, trainingNumber, newDate) => {
    const updatedMesos = mesocycles.map((meso) => {
      if (meso.id === mesoId) {
        const generatedTrainings = meso.generatedTrainings.map((training) => {
          if (training.number === trainingNumber) {
            return {
              ...training,
              date: newDate,
            };
          }
          return training;
        });
        return { ...meso, generatedTrainings };
      }
      return meso;
    });
    setMesocycles(updatedMesos);
    saveData("mesocycles", updatedMesos);

    if (onMesocyclesChange) {
      onMesocyclesChange(updatedMesos);
    }
  };

  const getActiveMesocycle = () => {
    return mesocycles.find((meso) => meso.status === "aktiv") || null;
  };

  return (
    <div className="exercise-manager">
      <h1 className="text-3xl font-bold mb-6">Mesozyklen verwalten</h1>

      {showForm ? (
        // Mesozyklus Formular
        <div className="exercise-form">
          <div className="header">
            <h2 className="text-xl font-semibold">
              {editingMeso
                ? "Mesozyklus bearbeiten"
                : "Neuen Mesozyklus erstellen"}
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          <div className="form-group">
            <label>Nummer:</label>
            <input
              type="number"
              value={mesoForm.number}
              disabled
              className="form-control bg-gray-100"
            />
          </div>

          <div className="flex gap-4">
            <div className="form-group flex-1">
              <label>Startdatum:</label>
              <input
                type="date"
                value={mesoForm.startDate}
                onChange={(e) =>
                  setMesoForm({ ...mesoForm, startDate: e.target.value })
                }
                className="form-control"
              />
            </div>
            <div className="form-group flex-1">
              <label>Enddatum:</label>
              <input
                type="date"
                value={mesoForm.endDate}
                onChange={(e) =>
                  setMesoForm({ ...mesoForm, endDate: e.target.value })
                }
                className="form-control"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Trainingsmuster:</label>
            <select
              value={mesoForm.pattern}
              onChange={(e) =>
                setMesoForm({ ...mesoForm, pattern: e.target.value })
              }
              className="form-control"
            >
              <option value="ABAB">ABAB (4× pro Woche)</option>
              <option value="ABABAB">ABABAB (6× pro Woche)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Trainingstage:</label>
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: mesoForm.pattern === "ABAB" ? 4 : 6 }).map(
                (_, i) => (
                  <div key={i}>
                    <label className="text-sm">Tag {i + 1}:</label>
                    <select
                      value={mesoForm.trainingDays[`day${i + 1}`]}
                      onChange={(e) =>
                        setMesoForm({
                          ...mesoForm,
                          trainingDays: {
                            ...mesoForm.trainingDays,
                            [`day${i + 1}`]: e.target.value,
                          },
                        })
                      }
                      className="form-control"
                    >
                      <option value="">Wählen...</option>
                      <option value="1">Montag</option>
                      <option value="2">Dienstag</option>
                      <option value="3">Mittwoch</option>
                      <option value="4">Donnerstag</option>
                      <option value="5">Freitag</option>
                      <option value="6">Samstag</option>
                      <option value="0">Sonntag</option>
                    </select>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Workout A:</label>
            <select
              value={mesoForm.workoutA}
              onChange={(e) =>
                setMesoForm({ ...mesoForm, workoutA: e.target.value })
              }
              className="form-control"
            >
              <option value="">Workout auswählen...</option>
              {workoutTemplates.map((workout) => (
                <option key={workout.id} value={workout.id}>
                  {workout.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Workout B:</label>
            <select
              value={mesoForm.workoutB}
              onChange={(e) =>
                setMesoForm({ ...mesoForm, workoutB: e.target.value })
              }
              className="form-control"
            >
              <option value="">Workout auswählen...</option>
              {workoutTemplates.map((workout) => (
                <option key={workout.id} value={workout.id}>
                  {workout.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button
              onClick={generateTrainings}
              className="btn btn-primary mr-2"
              disabled={
                !mesoForm.startDate ||
                !mesoForm.endDate ||
                !mesoForm.workoutA ||
                !mesoForm.workoutB
              }
            >
              Trainings generieren
            </button>
            {mesoForm.generatedTrainings.length > 0 && (
              <button onClick={saveMeso} className="btn btn-primary">
                <Save size={18} className="mr-1" /> Speichern
              </button>
            )}
            <button
              onClick={() => setShowForm(false)}
              className="btn btn-secondary ml-2"
            >
              Abbrechen
            </button>
          </div>

          {mesoForm.generatedTrainings.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">
                Generierte Trainings:
              </h3>
              <p className="text-sm text-gray-600 mb-2">
                Gesamt: {mesoForm.generatedTrainings.length} Trainings
              </p>
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="p-2 text-left">Training #</th>
                    <th className="p-2 text-left">Datum</th>
                    <th className="p-2 text-left">Woche</th>
                    <th className="p-2 text-left">Typ</th>
                    <th className="p-2 text-left">Workout</th>
                  </tr>
                </thead>
                <tbody>
                  {mesoForm.generatedTrainings.map((training, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2">{training.number}</td>
                      <td className="p-2">{training.date}</td>
                      <td className="p-2">{training.week}</td>
                      <td className="p-2">{training.type}</td>
                      <td className="p-2">
                        {training.workout?.name || "Unbekannt"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        // Mesozyklus Liste
        <>
          <button onClick={startNewMeso} className="btn btn-primary mb-6">
            <Plus size={18} className="mr-1" /> Neuen Mesozyklus erstellen
          </button>

          {mesocycles.length === 0 ? (
            <p className="no-data">Keine Mesozyklen erstellt</p>
          ) : (
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 text-left">Nummer</th>
                  <th className="p-2 text-left">Zeitraum</th>
                  <th className="p-2 text-left">Dauer</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {mesocycles.map((meso) => (
                  <tr key={meso.id} className="border-b">
                    <td className="p-2">{meso.number}</td>
                    <td className="p-2">
                      {new Date(meso.startDate).toLocaleDateString()} -{" "}
                      {new Date(meso.endDate).toLocaleDateString()}
                    </td>
                    <td className="p-2">
                      {Math.ceil(
                        (new Date(meso.endDate) - new Date(meso.startDate)) /
                          (7 * 24 * 60 * 60 * 1000)
                      )}{" "}
                      Wochen
                    </td>
                    <td className="p-2">{meso.status}</td>
                    <td className="p-2">
                      <div className="actions">
                        <button
                          onClick={() => startEditMeso(meso)}
                          className="btn btn-edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => deleteMeso(meso.id)}
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
        </>
      )}
    </div>
  );
}

export default MesocycleManagement;
