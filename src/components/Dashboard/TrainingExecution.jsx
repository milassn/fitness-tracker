import React from "react";
import { Plus, Minus, Save } from "lucide-react";
import { loadData } from "../../utils/storage";

function SetCircle({ set, exerciseIndex, setIndex, onComplete, onAdjustReps }) {
  const isProcessing = React.useRef(false);

  const handleClick = () => {
    if (!set.completed) {
      onComplete(exerciseIndex, setIndex);
    }
  };

  const handleAdjust = (delta) => {
    // Verhindere mehrfache Ausführung
    if (isProcessing.current) return;
    isProcessing.current = true;

    onAdjustReps(exerciseIndex, setIndex, delta);

    // Nach 100ms wieder freigeben
    setTimeout(() => {
      isProcessing.current = false;
    }, 100);
  };

  const repsToShow = set.completed ? set.actualReps : set.reps;

  return (
    <div className="mobile-set-container">
      <div
        className={`mobile-set-circle ${set.completed ? "completed" : ""}`}
        onClick={handleClick}
      >
        <span className="mobile-reps-number">{repsToShow}</span>
      </div>
      <div className="mobile-reps-controls">
        <button
          className="mobile-adjust-btn"
          onClick={() => handleAdjust(-1)}
          onMouseDown={(e) => e.preventDefault()}
          disabled={!set.completed}
        >
          <Minus size={24} />
        </button>
        <button
          className="mobile-adjust-btn"
          onClick={() => handleAdjust(1)}
          onMouseDown={(e) => e.preventDefault()}
          disabled={!set.completed}
        >
          <Plus size={24} />
        </button>
      </div>
    </div>
  );
}

function ExerciseCard({
  exercise,
  exerciseIndex,
  result,
  onSetComplete,
  onAdjustReps,
  onUpdateRPE,
  onUpdateComment,
  onUpdateWeight,
  trainingKey,
}) {
  const savedGoals = loadData("trainingGoals") || {};
  const trainingGoals = savedGoals[trainingKey] || {};

  const getTargetValue = (setIndex, field) => {
    return trainingGoals[`set${setIndex + 1}_${field}`] || "";
  };

  React.useEffect(() => {
    const targetWeight = getTargetValue(0, "weight");
    if (targetWeight && !result.weight) {
      onUpdateWeight(exerciseIndex, targetWeight);
    }
  }, []);

  return (
    <div className="mobile-exercise-card">
      <h3 className="mobile-exercise-name">{exercise.name}</h3>

      <div className="mobile-sets-grid">
        {result.sets.map((set, index) => (
          <div key={index} className="mobile-set-group">
            <div className="mobile-set-header">
              <span className="mobile-set-label">Satz {index + 1}</span>
            </div>

            <SetCircle
              set={set}
              exerciseIndex={exerciseIndex}
              setIndex={index}
              onComplete={onSetComplete}
              onAdjustReps={onAdjustReps}
            />
          </div>
        ))}
      </div>

      <div className="mobile-exercise-inputs">
        <div className="mobile-input-group">
          <label className="mobile-label">Gewicht (kg)</label>
          <input
            type="number"
            value={result.weight}
            placeholder={getTargetValue(0, "weight")}
            onChange={(e) => onUpdateWeight(exerciseIndex, e.target.value)}
            className="mobile-weight-input"
          />
        </div>

        <div className="mobile-input-group">
          <label className="mobile-label">RPE (1-10)</label>
          <select
            value={result.rpe}
            onChange={(e) => onUpdateRPE(exerciseIndex, e.target.value)}
            className="mobile-rpe-select"
          >
            <option value="">--</option>
            {[...Array(10)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mobile-input-group full-width">
        <label className="mobile-label">Kommentar</label>
        <input
          type="text"
          value={result.comment}
          onChange={(e) => onUpdateComment(exerciseIndex, e.target.value)}
          placeholder="z.B. zu leicht, Schulter schmerzt"
          className="mobile-comment-input"
        />
      </div>
    </div>
  );
}

function RestStopwatch({ onStart }) {
  const [time, setTime] = React.useState(0);
  const [isRunning, setIsRunning] = React.useState(false);

  React.useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isRunning]);

  React.useEffect(() => {
    if (onStart && !isRunning) {
      setIsRunning(true);
    }
  }, [onStart]);

  const handleStop = () => {
    setIsRunning(false);
    setTime(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (time === 0 && !isRunning) return null;

  return (
    <div className="persistent-timer">
      <div className="timer-display">
        <span className="timer-label">Pause:</span>
        <span className="timer-time">{formatTime(time)}</span>
      </div>
      <button className="timer-stop-btn" onClick={handleStop}>
        Stopp
      </button>
    </div>
  );
}

function TrainingTime({ startTime, endTime }) {
  const [elapsed, setElapsed] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (startTime && !endTime) {
        setElapsed(Date.now() - startTime);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, endTime]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const timeToShow = endTime ? endTime - startTime : elapsed;

  return (
    <div className="training-time">
      <span className="time-label">Trainingszeit:</span>
      <span className="time-value">{formatTime(timeToShow)}</span>
    </div>
  );
}

function TrainingExecution({
  training,
  results,
  onSetComplete,
  onAdjustReps,
  onUpdateRPE,
  onUpdateComment,
  onUpdateWeight,
  trainingRPE,
  setTrainingRPE,
  trainingComment,
  setTrainingComment,
  onComplete,
  restStopwatch,
  trainingStartTime,
  trainingEndTime,
}) {
  const isTrainingComplete = () => {
    return Object.values(results).every((exercise) =>
      exercise.sets.every((set) => set.completed)
    );
  };

  const trainingKey = training.number;

  return (
    <div className="mobile-training-execution">
      <div className="mobile-training-header">
        <h2 className="mobile-training-title">Training {training.type}</h2>
        <p className="mobile-training-date">
          {new Date(training.date).toLocaleDateString()}
        </p>
        <TrainingTime startTime={trainingStartTime} endTime={trainingEndTime} />
      </div>

      <RestStopwatch onStart={restStopwatch} />

      <div className="mobile-exercises-list">
        {training.workout?.exercises?.map((exercise, index) => (
          <ExerciseCard
            key={index}
            exercise={exercise}
            exerciseIndex={index}
            result={results[`exercise-${index}`]}
            onSetComplete={onSetComplete}
            onAdjustReps={onAdjustReps}
            onUpdateRPE={onUpdateRPE}
            onUpdateComment={onUpdateComment}
            onUpdateWeight={onUpdateWeight}
            trainingKey={trainingKey}
          />
        ))}
      </div>

      <div className="mobile-training-summary">
        <div className="mobile-input-group">
          <label className="mobile-label">Gesamt-RPE (1-10)</label>
          <select
            value={trainingRPE}
            onChange={(e) => setTrainingRPE(e.target.value)}
            className="mobile-training-rpe-select"
          >
            <option value="">--</option>
            {[...Array(10)].map((_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </div>

        <div className="mobile-input-group">
          <label className="mobile-label">Training Kommentar</label>
          <textarea
            value={trainingComment}
            onChange={(e) => setTrainingComment(e.target.value)}
            placeholder="Wie war das Training insgesamt?"
            className="mobile-training-comment"
            rows="3"
          />
        </div>

        <button
          onClick={onComplete}
          className={`mobile-complete-btn ${
            !isTrainingComplete() ? "disabled" : ""
          }`}
          disabled={!isTrainingComplete()}
        >
          Training abschließen
        </button>
      </div>
    </div>
  );
}

export default TrainingExecution;
