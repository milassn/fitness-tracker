import { supabase, getCurrentUser } from "./supabase";
import { loadData, saveData, addUserMetadata } from "../utils/storage";

const SYNC_INTERVAL = 60000; // 1 Minute

class SyncService {
  constructor() {
    this.isSyncing = false;
    this.tables = ["exercises", "workouts", "mesocycles", "trainingGoals"];
    this.syncInterval = null;
  }

  // Startet automatische Synchronisation
  startAutoSync() {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(() => {
      this.syncAll();
    }, SYNC_INTERVAL);

    // Initiale Synchronisation
    this.syncAll();
  }

  // Stoppt automatische Synchronisation
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Synchronisiert alle Tabellen
  async syncAll() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const user = await getCurrentUser();
      if (!user) return;

      for (const tableName of this.tables) {
        await this.syncTable(tableName);
      }
    } catch (error) {
      console.error("Sync Error:", error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Synchronisiert eine einzelne Tabelle
  async syncTable(tableName) {
    const localData = loadData(tableName) || [];
    const { data: remoteData } = await supabase.from(tableName).select("*");

    // Lokale Daten nach Supabase hochladen
    await this.uploadLocalChanges(tableName, localData, remoteData || []);

    // Remote-Daten nach lokal herunterladen
    await this.downloadRemoteChanges(tableName, remoteData || []);
  }

  // Lädt lokale Änderungen zu Supabase hoch
  async uploadLocalChanges(tableName, localData, remoteData) {
    const remoteMap = new Map(remoteData.map((item) => [item.id, item]));

    for (const item of localData) {
      const remoteItem = remoteMap.get(item.id);

      // Neues Item oder aktualisiertes Item uploadhen
      if (
        !remoteItem ||
        new Date(item.updated_at) > new Date(remoteItem.updated_at)
      ) {
        const { error } = await supabase
          .from(tableName)
          .upsert([item], { onConflict: "id" });

        if (error) {
          console.error(`Upload error for ${tableName}:`, error);
        }
      }
    }
  }

  // Lädt Remote-Änderungen nach lokal herunter
  async downloadRemoteChanges(tableName, remoteData) {
    const localData = loadData(tableName) || [];
    const localMap = new Map(localData.map((item) => [item.id, item]));

    let hasChanges = false;
    const updatedLocalData = [...localData];

    for (const remoteItem of remoteData) {
      const localItem = localMap.get(remoteItem.id);

      if (!localItem) {
        // Neues Item von Remote
        updatedLocalData.push(remoteItem);
        hasChanges = true;
      } else if (
        new Date(remoteItem.updated_at) > new Date(localItem.updated_at)
      ) {
        // Aktualisiertes Item von Remote
        const index = updatedLocalData.findIndex(
          (item) => item.id === remoteItem.id
        );
        if (index !== -1) {
          updatedLocalData[index] = remoteItem;
          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      saveData(tableName, updatedLocalData);
    }
  }

  // Lädt die Daten eines Users beim Login herunter
  async loadUserData() {
    const user = await getCurrentUser();
    if (!user) return;

    for (const tableName of this.tables) {
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .eq("user_id", user.id);

      if (!error && data) {
        saveData(tableName, data);
      }
    }
  }
}

// Exportiere eine singleton Instanz
export const syncService = new SyncService();
