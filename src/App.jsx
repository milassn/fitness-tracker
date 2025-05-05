import React, { useState, useEffect } from "react";
import ExerciseList from "./components/Exercises/ExerciseList";
import { Dumbbell, CalendarDays } from "lucide-react";
import WorkoutManagement from "./components/WorkoutManagement";
import MesocycleManagement from "./components/MesocycleManagement";
import TrainingGoals from "./components/TrainingGoals";
import Calendar from "./components/Calendar";
import LoginForm from "./components/Auth/LoginForm";
import SyncStatus from "./components/SyncStatus";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { saveData, loadData } from "./utils/storage";
import { syncService } from "./services/syncService"; // Import hinzugefügt

function AppContent() {
  // Separate Komponente, damit useAuth funktioniert
  const [activeMainTab, setActiveMainTab] = useState("dashboard");
  const [activeSettingsTab, setActiveSettingsTab] = useState("exercises");
  const [workoutTemplates, setWorkoutTemplates] = useState(() => {
    return loadData("workoutTemplates") || [];
  });
  const [exercises, setExercises] = useState(() => {
    return loadData("exercises") || [];
  });
  const [mesocycles, setMesocycles] = useState(() => {
    return loadData("mesocycles") || [];
  });

  const { user } = useAuth(); // useAuth muss innerhalb von AuthProvider sein

  // SyncService starten wenn User eingeloggt ist
  useEffect(() => {
    if (user) {
      console.log("User logged in - starting SyncService");
      syncService.startAutoSync();
      syncService.loadUserData();
    } else {
      console.log("User logged out - stopping SyncService");
      syncService.stopAutoSync();
    }

    return () => {
      syncService.stopAutoSync();
    };
  }, [user]);

  const handleSaveTemplate = (workout) => {
    let updatedTemplates;
    if (workoutTemplates.find((w) => w.id === workout.id)) {
      updatedTemplates = workoutTemplates.map((w) =>
        w.id === workout.id ? workout : w
      );
    } else {
      updatedTemplates = [...workoutTemplates, workout];
    }
    setWorkoutTemplates(updatedTemplates);
    saveData("workoutTemplates", updatedTemplates);
  };

  const handleDeleteTemplate = (id) => {
    const updatedTemplates = workoutTemplates.filter((w) => w.id !== id);
    setWorkoutTemplates(updatedTemplates);
    saveData("workoutTemplates", updatedTemplates);
  };

  const handleMesocyclesChange = (updatedMesocycles) => {
    setMesocycles(updatedMesocycles);
  };

  return (
    <div className="app">
      <header>
        <div className="container">
          <h1>Fitness Tracker</h1>
        </div>
      </header>

      <div className="container">
        <LoginForm />
        <SyncStatus />

        {/* Hauptnavigation */}
        <div className="tabs">
          <div
            className={`tab ${activeMainTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveMainTab("dashboard")}
          >
            Dashboard
          </div>
          <div
            className={`tab ${activeMainTab === "calendar" ? "active" : ""}`}
            onClick={() => setActiveMainTab("calendar")}
          >
            Kalender
          </div>
          <div
            className={`tab ${activeMainTab === "progress" ? "active" : ""}`}
            onClick={() => setActiveMainTab("progress")}
          >
            Fortschritt
          </div>
          <div
            className={`tab ${activeMainTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveMainTab("settings")}
          >
            Einstellungen
          </div>
        </div>

        {/* Inhaltsbereich */}
        <div className="tab-content">
          {activeMainTab === "dashboard" && (
            <div>
              <h2>Dashboard</h2>
              <p>Hier siehst du eine Übersicht deiner Aktivitäten und Ziele.</p>
            </div>
          )}

          {activeMainTab === "calendar" && <Calendar />}

          {activeMainTab === "progress" && (
            <div>
              <h2>Fortschritt</h2>
              <p>
                Hier siehst du deine Fortschritte in Diagrammen und Statistiken.
              </p>
            </div>
          )}

          {activeMainTab === "settings" && (
            <div>
              <h2>Einstellungen</h2>

              {/* Subnavigation innerhalb der Einstellungen */}
              <div className="sub-tabs">
                <div
                  className={`sub-tab ${
                    activeSettingsTab === "exercises" ? "active" : ""
                  }`}
                  onClick={() => setActiveSettingsTab("exercises")}
                >
                  Übungen verwalten
                </div>
                <div
                  className={`sub-tab ${
                    activeSettingsTab === "workouts" ? "active" : ""
                  }`}
                  onClick={() => setActiveSettingsTab("workouts")}
                >
                  Workouts verwalten
                </div>
                <div
                  className={`sub-tab ${
                    activeSettingsTab === "mesocycles" ? "active" : ""
                  }`}
                  onClick={() => setActiveSettingsTab("mesocycles")}
                >
                  Mesozyklen verwalten
                </div>
                <div
                  className={`sub-tab ${
                    activeSettingsTab === "goals" ? "active" : ""
                  }`}
                  onClick={() => setActiveSettingsTab("goals")}
                >
                  Trainingsziele verwalten
                </div>
              </div>

              {/* Sub-Tab-Inhalte */}
              <div className="sub-tab-content">
                {activeSettingsTab === "exercises" && (
                  <ExerciseList onExercisesChange={setExercises} />
                )}

                {activeSettingsTab === "workouts" && (
                  <WorkoutManagement
                    workoutTemplates={workoutTemplates}
                    onSaveTemplate={handleSaveTemplate}
                    onDeleteTemplate={handleDeleteTemplate}
                    exercises={exercises}
                  />
                )}

                {activeSettingsTab === "mesocycles" && (
                  <MesocycleManagement
                    workoutTemplates={workoutTemplates}
                    onMesocyclesChange={handleMesocyclesChange}
                  />
                )}

                {activeSettingsTab === "goals" && (
                  <TrainingGoals exercises={exercises} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
