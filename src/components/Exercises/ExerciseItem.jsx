import React from "react";
import { MEASUREMENT_TYPES } from "../../models/exerciseModel";

// Komponente für einen einzelnen Eintrag in der Übungsliste
function ExerciseItem({ exercise, onEdit, onDelete }) {
  // Messtypen für die Anzeige menschenlesbar machen
  const getMeasurementTypeLabel = (type) => {
    const labels = {
      [MEASUREMENT_TYPES.WEIGHT_REPS]: "Gewicht & Wiederholungen",
      [MEASUREMENT_TYPES.REPS]: "Nur Wiederholungen",
      [MEASUREMENT_TYPES.TIME]: "Zeit",
      [MEASUREMENT_TYPES.DISTANCE]: "Distanz",
    };
    return labels[type] || type;
  };

  return (
    <tr>
      <td>{exercise.name}</td>
      <td>{exercise.category}</td>
      <td>{getMeasurementTypeLabel(exercise.measurementType)}</td>
      <td>{exercise.canBeDropset ? "Ja" : "Nein"}</td>
      <td className="actions">
        <button className="btn btn-edit" onClick={onEdit}>
          Bearbeiten
        </button>
        <button className="btn btn-delete" onClick={onDelete}>
          Löschen
        </button>
      </td>
    </tr>
  );
}

export default ExerciseItem;
