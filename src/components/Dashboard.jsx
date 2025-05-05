import React, { useState, useEffect } from "react";
import { Play } from "lucide-react";
import { loadData, saveData } from "../utils/storage";
import TrainingExecution from "./Dashboard/TrainingExecution";
import TrainingStats from "./Dashboard/TrainingStats";

function Dashboard() {
  const [mesocycles, setMesocycles] = useState(() => {
    return loadData("mesocycles") || [];
  });
  const [currentTraining, setCurrentTraining] = useState(null);
  const [isTrainingActive, setIsTrainingActive] = useState(false);
  const [restStopwatch, setRestStopwatch] = useState(null);
  const [trainingStartTime, setTrainingStartTime] = useState(null);
  const [trainingEndTime, setTrainingEndTime] = useState(null);
  const [activeMeso, setActiveMeso] = useState(null);
  const [upcomingTrainings, setUpcomingTrainings] = useState([]);
  const [trainingResults, setTrainingResults] = useState({});
  const [trainingRPE, setTrainingRPE] = useState("");
  const [trainingComment, setTrainingComment] = useState("");

  useEffect(() => {
    findActiveMesocycle();
    findUpcomingTrainings();
  }, [mesocycles]);

  const findActiveMesocycle = () => {
    const active = mesocycles.find((m) => m.status === "aktiv");
    setActiveMeso(active);
  };

  const findUpcomingTrainings = () => {
    const active = mesocycles.find((m) => m.status === "aktiv");
    if (!active) return;

    const today = new Date().toISOString().split("T")[0];
    const upcoming = active.generatedTrainings
      .filter((training) => training.date >= today && !training.completed)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 3);

    setUpcomingTrainings(upcoming);
  };

  const startNextTraining = () => {
    const active = mesocycles.find((m) => m.status === "aktiv");
    if (!active) return;

    const today = new Date().toISOString().split("T")[0];
    const nextTraining = active.generatedTrainings.find(
      (t) => t.date === today && !t.completed
    );

    if (nextTraining) {
      setCurrentTraining(nextTraining);
      setIsTrainingActive(true);
      setTrainingStartTime(Date.now());
      setTrainingEndTime(null);
      initializeTrainingResults(nextTraining);
    }
  };

  const initializeTrainingResults = (training) => {
    const results = {};
    training.workout?.exercises?.forEach((exercise, index) => {
      results[`exercise-${index}`] = {
        sets: [],
        rpe: "",
        comment: "",
        weight: "",
      };
      for (let i = 0; i < exercise.sets; i++) {
        results[`exercise-${index}`].sets.push({
          completed: false,
          reps: parseInt(exercise.reps) || 0,
          actualReps: 0,
          weight: 0,
        });
      }
    });
    setTrainingResults(results);
  };

  const handleSetComplete = (exerciseIndex, setIndex) => {
    setTrainingResults((prev) => {
      const updated = { ...prev };
      const exerciseKey = `exercise-${exerciseIndex}`;
      const set = updated[exerciseKey].sets[setIndex];

      if (!set.completed) {
        set.completed = true;
        set.actualReps = set.reps;
        setRestStopwatch(true);
      }

      return updated;
    });
  };

  const adjustReps = (exerciseIndex, setIndex, increment) => {
    setTrainingResults((prev) => {
      const updated = { ...prev };
      const exerciseKey = `exercise-${exerciseIndex}`;
      const set = { ...updated[exerciseKey].sets[setIndex] }; // Clone the set object

      // Only adjust actualReps for completed sets
      if (set.completed) {
        set.actualReps = Math.max(0, set.actualReps + increment);

        // Update the sets array properly
        const updatedSets = [...updated[exerciseKey].sets];
        updatedSets[setIndex] = set;

        updated[exerciseKey] = {
          ...updated[exerciseKey],
          sets: updatedSets,
        };
      }

      return updated;
    });
  };

  const updateExerciseRPE = (exerciseIndex, rpe) => {
    setTrainingResults((prev) => {
      const updated = { ...prev };
      updated[`exercise-${exerciseIndex}`].rpe = rpe;
      return updated;
    });
  };

  const updateExerciseComment = (exerciseIndex, comment) => {
    setTrainingResults((prev) => {
      const updated = { ...prev };
      updated[`exercise-${exerciseIndex}`].comment = comment;
      return updated;
    });
  };

  const updateExerciseWeight = (exerciseIndex, weight) => {
    setTrainingResults((prev) => {
      const updated = { ...prev };
      updated[`exercise-${exerciseIndex}`].weight = weight;
      return updated;
    });
  };

  const saveTrainingResult = () => {
    const endTime = Date.now();
    setTrainingEndTime(endTime);

    const trainingData = {
      ...currentTraining,
      completed: true,
      completedAt: new Date().toISOString(),
      startTime: trainingStartTime,
      endTime: endTime,
      duration: endTime - trainingStartTime,
      results: trainingResults,
      overallRPE: trainingRPE,
      comment: trainingComment,
    };

    const savedTrainings = loadData("completedTrainings") || [];
    saveData("completedTrainings", [...savedTrainings, trainingData]);

    const updatedMesocycles = mesocycles.map((meso) => {
      if (meso.id === activeMeso.id) {
        const updatedTrainings = meso.generatedTrainings.map((training) => {
          if (training.number === currentTraining.number) {
            return { ...training, completed: true };
          }
          return training;
        });
        return { ...meso, generatedTrainings: updatedTrainings };
      }
      return meso;
    });

    setMesocycles(updatedMesocycles);
    saveData("mesocycles", updatedMesocycles);
    setIsTrainingActive(false);
    setCurrentTraining(null);
    setTrainingStartTime(null);
    setTrainingEndTime(null);
  };

  return (
    <div className="mobile-dashboard">
      {!isTrainingActive ? (
        <div className="mobile-dashboard-overview">
          <div className="mobile-start-training-card">
            <h2 className="mobile-dashboard-title">Training starten</h2>
            {upcomingTrainings.length > 0 ? (
              <>
                <div className="mobile-next-training-info">
                  <h3 className="mobile-training-type">
                    Nächstes Training: {upcomingTrainings[0].type}
                  </h3>
                  <p className="mobile-training-date">
                    {new Date(upcomingTrainings[0].date).toLocaleDateString()}
                  </p>
                  <p className="mobile-training-workout">
                    {upcomingTrainings[0].workout?.name}
                  </p>
                </div>
                <button
                  onClick={startNextTraining}
                  className="mobile-start-btn"
                  disabled={
                    upcomingTrainings[0].date !==
                    new Date().toISOString().split("T")[0]
                  }
                >
                  <Play size={28} />
                  Training starten
                </button>
              </>
            ) : (
              <p className="mobile-no-training">Keine Trainings geplant</p>
            )}
          </div>

          <TrainingStats mesocycles={mesocycles} activeMeso={activeMeso} />
        </div>
      ) : (
        <TrainingExecution
          training={currentTraining}
          results={trainingResults}
          onSetComplete={handleSetComplete}
          onAdjustReps={adjustReps}
          onUpdateRPE={updateExerciseRPE}
          onUpdateComment={updateExerciseComment}
          onUpdateWeight={updateExerciseWeight}
          trainingRPE={trainingRPE}
          setTrainingRPE={setTrainingRPE}
          trainingComment={trainingComment}
          setTrainingComment={setTrainingComment}
          onComplete={saveTrainingResult}
          restStopwatch={restStopwatch}
          trainingStartTime={trainingStartTime}
          trainingEndTime={trainingEndTime}
        />
      )}
    </div>
  );
}

export default Dashboard;
