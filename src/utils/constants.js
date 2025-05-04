// Konstanten für die Fitnessapp

export const ACTIVITY_TYPES = {
  TRAINING_A: "A",
  TRAINING_B: "B",
  PAUSE: "PAUSE",
  SICK: "KRANK",
  OTHER: "ACTIVITY",
  UNKNOWN: "UNKNOWN",
};

export const ACTIVITY_LABELS = {
  [ACTIVITY_TYPES.TRAINING_A]: "Training A",
  [ACTIVITY_TYPES.TRAINING_B]: "Training B",
  [ACTIVITY_TYPES.PAUSE]: "Pausentag",
  [ACTIVITY_TYPES.SICK]: "Krank",
  [ACTIVITY_TYPES.OTHER]: "Andere Aktivität",
  [ACTIVITY_TYPES.UNKNOWN]: "Unbekannt",
};

export const ACTIVITY_COLORS = {
  [ACTIVITY_TYPES.TRAINING_A]: "#3498db", // Blau
  [ACTIVITY_TYPES.TRAINING_B]: "#2ecc71", // Grün
  [ACTIVITY_TYPES.PAUSE]: "#f39c12", // Orange
  [ACTIVITY_TYPES.SICK]: "#e74c3c", // Rot
  [ACTIVITY_TYPES.OTHER]: "#9b59b6", // Violett
  [ACTIVITY_TYPES.UNKNOWN]: "#95a5a6", // Grau
};
