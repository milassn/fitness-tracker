import { createClient } from "@supabase/supabase-js";

// Lade Konfiguration aus Umgebungsvariablen
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Validierung: Prüfe ob Umgebungsvariablen gesetzt sind
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Supabase URL and Anon Key must be set as environment variables"
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Hilfsfunktionen für Datenbank-Operationen
export const getDatabaseTable = (tableName) => {
  return supabase.from(tableName);
};

// Hilfsfunktion zum Abrufen aktueller Benutzer
export const getCurrentUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
};

// Hilfsfunktion zum Abonnieren von Authentifizierungsänderungen
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};
