// Modul für die persistente Speicherung von Daten im LocalStorage

const APP_PREFIX = "fitness_tracker_";

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
