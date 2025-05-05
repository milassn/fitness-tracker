import React, { useState, useEffect } from "react";
import { BarChart2, TrendingUp, Calendar, Award } from "lucide-react";
import { loadData } from "../../utils/storage";

function StatCard({ icon: Icon, title, value, subtitle }) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <Icon size={24} className="stat-icon" />
        <h3 className="stat-title">{title}</h3>
      </div>
      <p className="stat-value">{value}</p>
      {subtitle && <p className="stat-subtitle">{subtitle}</p>}
    </div>
  );
}

function ProgressBar({ percentage }) {
  return (
    <div className="progress-bar">
      <div className="progress-bar-fill" style={{ width: `${percentage}%` }}>
        <span className="progress-text">{percentage}%</span>
      </div>
    </div>
  );
}

function TrainingStats({ mesocycles, activeMeso }) {
  const [completedTrainings, setCompletedTrainings] = useState([]);
  const [weeklyVolume, setWeeklyVolume] = useState(0);
  const [weeklyRPE, setWeeklyRPE] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const loadCompletedTrainings = () => {
      const completed = loadData("completedTrainings") || [];
      setCompletedTrainings(completed);
      calculateStats(completed);
    };
    loadCompletedTrainings();
  }, [mesocycles, activeMeso]);

  const calculateStats = (completed) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Wöchentliches Volumen
    const recentTrainings = completed.filter(
      (t) => new Date(t.completedAt) > weekAgo
    );

    let totalVolume = 0;
    let totalRPE = 0;

    recentTrainings.forEach((training) => {
      Object.values(training.results || {}).forEach((exercise) => {
        exercise.sets?.forEach((set) => {
          if (set.completed) {
            totalVolume += set.actualReps * (exercise.weight || 0);
          }
        });
      });
      if (training.overallRPE) {
        totalRPE += parseInt(training.overallRPE);
      }
    });

    setWeeklyVolume(totalVolume);
    setWeeklyRPE(
      recentTrainings.length > 0
        ? Math.round(totalRPE / recentTrainings.length)
        : 0
    );

    // Streak berechnen
    calculateStreak(completed);
  };

  const calculateStreak = (completed) => {
    if (completed.length === 0) {
      setStreak(0);
      return;
    }

    const sortedTrainings = [...completed].sort(
      (a, b) => new Date(b.completedAt) - new Date(a.completedAt)
    );

    let currentStreak = 0;
    const today = new Date();
    let currentDate = new Date(today);

    for (let i = 0; i < sortedTrainings.length; i++) {
      const trainingDate = new Date(sortedTrainings[i].completedAt);
      const daysDiff = Math.floor(
        (currentDate - trainingDate) / (24 * 60 * 60 * 1000)
      );

      if (daysDiff <= 1) {
        currentStreak++;
        currentDate = trainingDate;
      } else {
        break;
      }
    }

    setStreak(currentStreak);
  };

  const getMesocycleProgress = () => {
    if (!activeMeso) return 0;

    const totalTrainings = activeMeso.generatedTrainings?.length || 0;
    const completedMesoTrainings =
      activeMeso.generatedTrainings?.filter((t) => t.completed).length || 0;

    return totalTrainings > 0
      ? Math.round((completedMesoTrainings / totalTrainings) * 100)
      : 0;
  };

  const getUpcomingTrainings = () => {
    if (!activeMeso) return [];

    const today = new Date().toISOString().split("T")[0];
    return (
      activeMeso.generatedTrainings
        ?.filter((t) => t.date >= today && !t.completed)
        ?.sort((a, b) => new Date(a.date) - new Date(b.date))
        ?.slice(0, 3) || []
    );
  };

  const getBestLifts = () => {
    const lifts = {};

    completedTrainings.forEach((training) => {
      Object.values(training.results || {}).forEach((exercise) => {
        const exerciseName = exercise.name;
        if (!lifts[exerciseName]) {
          lifts[exerciseName] = [];
        }

        exercise.sets?.forEach((set) => {
          if (set.completed) {
            const weight = exercise.weight || 0;
            const reps = set.actualReps;
            const estMax = weight * (1 + reps / 30); // Epley formula approximation
            lifts[exerciseName].push({ weight, reps, estMax });
          }
        });
      });
    });

    // Get top 3 lifts by estimated max
    const topLifts = [];
    Object.entries(lifts).forEach(([name, values]) => {
      const bestSet = values.reduce(
        (best, current) => (current.estMax > best.estMax ? current : best),
        { estMax: 0 }
      );

      if (bestSet.estMax > 0) {
        topLifts.push({ name, ...bestSet });
      }
    });

    return topLifts.sort((a, b) => b.estMax - a.estMax).slice(0, 3);
  };

  const upcomingTrainings = getUpcomingTrainings();
  const bestLifts = getBestLifts();

  return (
    <div className="training-stats">
      <div className="stats-row">
        <StatCard
          icon={TrendingUp}
          title="Wochenvolumen"
          value={`${weeklyVolume} kg`}
          subtitle="Letzten 7 Tage"
        />
        <StatCard
          icon={BarChart2}
          title="Durchschnitt RPE"
          value={weeklyRPE || "--"}
          subtitle="Letzten 7 Tage"
        />
        <StatCard
          icon={Award}
          title="Training Streak"
          value={`${streak} ${streak === 1 ? "Tag" : "Tage"}`}
          subtitle={streak > 5 ? "Großartig!" : "Weiter so!"}
        />
      </div>

      <div className="meso-progress-card">
        <h3 className="text-lg font-bold mb-2">Mesozyklus Fortschritt</h3>
        {activeMeso ? (
          <>
            <div className="meso-info">
              <p>Mesozyklus #{activeMeso.number}</p>
              <p>
                Fortschritt: {completedTrainings.length} /{" "}
                {activeMeso.generatedTrainings?.length || 0} Trainings
              </p>
            </div>
            <ProgressBar percentage={getMesocycleProgress()} />
          </>
        ) : (
          <p className="text-gray-600">Kein aktiver Mesozyklus</p>
        )}
      </div>

      <div className="stats-row">
        <div className="upcoming-trainings">
          <h3 className="text-lg font-bold mb-3">Kommende Trainings</h3>
          {upcomingTrainings.length > 0 ? (
            <ul className="training-list">
              {upcomingTrainings.map((training, index) => (
                <li key={index} className="training-item">
                  <div className="training-date">
                    {new Date(training.date).toLocaleDateString("de-DE", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                  <div className="training-details">
                    <span className={`training-type-badge ${training.type}`}>
                      {training.type}
                    </span>
                    <span className="training-name">
                      {training.workout?.name}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">Keine Trainings geplant</p>
          )}
        </div>

        <div className="best-lifts">
          <h3 className="text-lg font-bold mb-3">Top Lifts</h3>
          {bestLifts.length > 0 ? (
            <ul className="lift-list">
              {bestLifts.map((lift, index) => (
                <li key={index} className="lift-item">
                  <div className="lift-name">{lift.name}</div>
                  <div className="lift-stats">
                    <span className="lift-weight">{lift.weight}kg</span>
                    <span className="lift-reps">× {lift.reps}</span>
                    <span className="lift-est">
                      ≈ {Math.round(lift.estMax)}kg Est. 1RM
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">Noch keine Lifts aufgezeichnet</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default TrainingStats;
