// Modul für die persistente Speicherung von Daten im LocalStorage und Supabase
import { getCurrentUser } from "../services/supabase";

const APP_PREFIX = "fitness_tracker_";

/**
 * Fügt automatisch user_id und updated_at zu Objekten hinzu
 * @param {any} data - Die zu speichernden Daten
 * @returns {any} Erweiterte Daten mit user_id und updated_at
 */
export async function addUserMetadata(data) {
  if (!data) return data;

  const user = await getCurrentUser();
  const userId = user?.id || "anonymous";
  const timestamp = new Date().toISOString();

  if (Array.isArray(data)) {
    return data.map((item) => ({
      ...item,
      user_id: userId,
      updated_at: timestamp,
    }));
  } else if (typeof data === "object") {
    return {
      ...data,
      user_id: userId,
      updated_at: timestamp,
    };
  }

  return data;
}

/**
 * Speichert Daten im LocalStorage
 * @param {string} key - Der Schlüssel zum Speichern der Daten
 * @param {any} data - Die zu speichernden Daten
 */
export function saveData(key, data) {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(APP_PREFIX + key, serializedData);
    return true;
  } catch (error) {
    console.error("Fehler beim Speichern der Daten:", error);
    return false;
  }
}

/**
 * Lädt Daten aus dem LocalStorage
 * @param {string} key - Der Schlüssel, unter dem die Daten gespeichert sind
 * @returns {any|null} Die geladenen Daten oder null im Fehlerfall
 */
export function loadData(key) {
  try {
    const serializedData = localStorage.getItem(APP_PREFIX + key);
    if (serializedData === null) {
      return null;
    }
    return JSON.parse(serializedData);
  } catch (error) {
    console.error("Fehler beim Laden der Daten:", error);
    return null;
  }
}

/**
 * Löscht Daten aus dem LocalStorage
 * @param {string} key - Der zu löschende Schlüssel
 * @returns {boolean} True, wenn erfolgreich gelöscht
 */
export function removeData(key) {
  try {
    localStorage.removeItem(APP_PREFIX + key);
    return true;
  } catch (error) {
    console.error("Fehler beim Löschen der Daten:", error);
    return false;
  }
}

/**
 * Löscht alle Daten dieser App aus dem LocalStorage
 * @returns {boolean} True, wenn erfolgreich gelöscht
 */
export function clearAllData() {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(APP_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    return true;
  } catch (error) {
    console.error("Fehler beim Löschen aller Daten:", error);
    return false;
  }
}

/**
 * Migriert bestehende Local Storage Daten und fügt Benutzer-Metadaten hinzu
 */
export async function migrateLocalStorageData() {
  const tables = ["exercises", "workouts", "mesocycles", "trainingGoals"];

  for (const table of tables) {
    const data = loadData(table);
    if (data) {
      const migratedData = await addUserMetadata(data);
      saveData(table, migratedData);
    }
  }
}
