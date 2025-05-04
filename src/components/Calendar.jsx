import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Calendar as CalendarIcon,
} from "lucide-react";
import { loadData, saveData } from "../utils/storage";
import { ACTIVITY_TYPES } from "./MesocycleManagement";

function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [mesocycles, setMesocycles] = useState(() => {
    return loadData("mesocycles") || [];
  });
  const [activeMeso, setActiveMeso] = useState(null);
  const [draggedTraining, setDraggedTraining] = useState(null);

  useEffect(() => {
    // Finde den aktiven Mesozyklus
    const active = mesocycles.find((m) => m.status === "aktiv");
    setActiveMeso(active);
  }, [mesocycles]);

  // Navigation im Kalender
  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Hilfsfunktionen für den Kalender
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    const firstDay = new Date(year, month, 1).getDay();
    return firstDay === 0 ? 6 : firstDay - 1; // Montag als erster Tag
  };

  const formatDate = (date) => {
    return date.toISOString().split("T")[0];
  };

  // Training-Suche für ein bestimmtes Datum
  const getTrainingForDate = (dateString) => {
    if (!activeMeso || !activeMeso.generatedTrainings) return null;
    return activeMeso.generatedTrainings.find(
      (training) => training.date === dateString
    );
  };

  // Aktivität für ein bestimmtes Datum holen
  const getActivityForDate = (dateString) => {
    if (!activeMeso || !activeMeso.activities) return null;
    return activeMeso.activities[dateString];
  };

  // Tag klicken Handler
  const handleDayClick = (day) => {
    const dateString = formatDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    );
    setSelectedDay({
      date: dateString,
      day: day,
      training: getTrainingForDate(dateString),
      activity: getActivityForDate(dateString),
    });
    setShowDayModal(true);
  };

  // Drag & Drop Handler
  const handleDragStart = (e, training) => {
    setDraggedTraining(training);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, day) => {
    e.preventDefault();
    if (!draggedTraining || !activeMeso) return;

    const newDate = formatDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    );

    // Update Mesozyklus
    const updatedMeso = { ...activeMeso };
    updatedMeso.generatedTrainings = updatedMeso.generatedTrainings.map(
      (training) => {
        if (training.number === draggedTraining.number) {
          return { ...training, date: newDate };
        }
        return training;
      }
    );

    // Speichere Änderungen
    const updatedMesocycles = mesocycles.map((m) =>
      m.id === activeMeso.id ? updatedMeso : m
    );

    setMesocycles(updatedMesocycles);
    saveData("mesocycles", updatedMesocycles);
    setDraggedTraining(null);
  };

  // Kalender-Grid erstellen
  const renderCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Leere Zellen für den Anfang
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty" />);
    }

    // Tage des Monats
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = formatDate(new Date(year, month, day));
      const training = getTrainingForDate(dateString);
      const activity = getActivityForDate(dateString);
      const isToday = dateString === formatDate(new Date());

      days.push(
        <div
          key={day}
          className={`calendar-day ${isToday ? "today" : ""}`}
          onClick={() => handleDayClick(day)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, day)}
        >
          <div className="day-number">{day}</div>
          {training && (
            <div
              className={`training-badge ${training.type} ${
                training.completed ? "completed" : ""
              }`}
              draggable
              onDragStart={(e) => handleDragStart(e, training)}
            >
              {training.type}
            </div>
          )}
          {activity && !training && (
            <div className={`activity-badge ${activity.type.toLowerCase()}`}>
              {activity.type === ACTIVITY_TYPES.OTHER
                ? activity.activity
                : activity.type}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-navigation">
          <button onClick={previousMonth} className="btn btn-secondary">
            <ChevronLeft size={20} />
          </button>
          <button onClick={goToToday} className="btn btn-secondary">
            Heute
          </button>
          <button onClick={nextMonth} className="btn btn-secondary">
            <ChevronRight size={20} />
          </button>
        </div>
        <h2 className="calendar-title">
          {currentDate.toLocaleDateString("de-DE", {
            month: "long",
            year: "numeric",
          })}
        </h2>
        {activeMeso && (
          <div className="active-meso-info">
            Aktiver Mesozyklus #{activeMeso.number}
          </div>
        )}
      </div>

      <div className="calendar-weekdays">
        {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day) => (
          <div key={day} className="weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-grid">{renderCalendarGrid()}</div>

      {showDayModal && selectedDay && (
        <DayModal
          selectedDay={selectedDay}
          activeMeso={activeMeso}
          onClose={() => {
            setShowDayModal(false);
            setSelectedDay(null);
          }}
          onUpdate={(updatedMesocycles) => {
            setMesocycles(updatedMesocycles);
            saveData("mesocycles", updatedMesocycles);
          }}
        />
      )}
    </div>
  );
}

// Modal für Tagesdetails
function DayModal({ selectedDay, activeMeso, onClose, onUpdate }) {
  const [activityType, setActivityType] = useState(ACTIVITY_TYPES.PAUSE);
  const [activityName, setActivityName] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (selectedDay.activity) {
      setActivityType(selectedDay.activity.type);
      setActivityName(selectedDay.activity.activity || "");
      setNotes(selectedDay.activity.notes || "");
    }
  }, [selectedDay]);

  const handleSaveActivity = () => {
    if (!activeMeso) return;

    const updatedMeso = { ...activeMeso };
    if (!updatedMeso.activities) {
      updatedMeso.activities = {};
    }

    updatedMeso.activities[selectedDay.date] = {
      type: activityType,
      activity: activityType === ACTIVITY_TYPES.OTHER ? activityName : null,
      notes: notes,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const updatedMesocycles = activeMeso.mesocycles?.map((m) =>
      m.id === activeMeso.id ? updatedMeso : m
    ) || [updatedMeso];

    onUpdate(updatedMesocycles);
    onClose();
  };

  const markTrainingComplete = () => {
    if (!activeMeso || !selectedDay.training) return;

    const updatedMeso = { ...activeMeso };
    updatedMeso.generatedTrainings = updatedMeso.generatedTrainings.map(
      (training) => {
        if (training.number === selectedDay.training.number) {
          return { ...training, completed: !training.completed };
        }
        return training;
      }
    );

    const updatedMesocycles = activeMeso.mesocycles?.map((m) =>
      m.id === activeMeso.id ? updatedMeso : m
    ) || [updatedMeso];

    onUpdate(updatedMesocycles);
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>
            {new Date(selectedDay.date).toLocaleDateString("de-DE", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </h3>
          <button onClick={onClose} className="btn-close">
            <X size={24} />
          </button>
        </div>

        <div className="modal-content">
          {selectedDay.training && (
            <div className="training-section">
              <h4>Geplantes Training</h4>
              <div className="training-info">
                <p>Training {selectedDay.training.type}</p>
                <p>Workout: {selectedDay.training.workout?.name}</p>
                <p>Woche: {selectedDay.training.week}</p>
              </div>
              <button
                onClick={markTrainingComplete}
                className={`btn ${
                  selectedDay.training.completed
                    ? "btn-secondary"
                    : "btn-primary"
                }`}
              >
                {selectedDay.training.completed
                  ? "Als unvollständig markieren"
                  : "Als erledigt markieren"}
              </button>
            </div>
          )}

          {!selectedDay.training && !selectedDay.activity && (
            <div className="activity-section">
              <h4>Aktivität hinzufügen</h4>
              <div className="form-group">
                <label>Typ:</label>
                <select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                  className="form-control"
                >
                  <option value={ACTIVITY_TYPES.PAUSE}>Pausentag</option>
                  <option value={ACTIVITY_TYPES.SICK}>Krank</option>
                  <option value={ACTIVITY_TYPES.OTHER}>Andere Aktivität</option>
                </select>
              </div>

              {activityType === ACTIVITY_TYPES.OTHER && (
                <div className="form-group">
                  <label>Aktivität:</label>
                  <input
                    type="text"
                    value={activityName}
                    onChange={(e) => setActivityName(e.target.value)}
                    placeholder="z.B. Yoga, Tanzen"
                    className="form-control"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Notizen:</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Zusätzliche Notizen..."
                  className="form-control"
                  rows="3"
                />
              </div>

              <button onClick={handleSaveActivity} className="btn btn-primary">
                Speichern
              </button>
            </div>
          )}

          {selectedDay.activity && !selectedDay.training && (
            <div className="activity-display">
              <h4>Aktivität</h4>
              <p>Typ: {selectedDay.activity.type}</p>
              {selectedDay.activity.activity && (
                <p>Aktivität: {selectedDay.activity.activity}</p>
              )}
              {selectedDay.activity.notes && (
                <p>Notizen: {selectedDay.activity.notes}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Calendar;
