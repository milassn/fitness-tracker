import { createClient } from "@supabase/supabase-js";

// Diese Werte müssen Sie aus Ihrem Supabase-Projekt holen
const SUPABASE_URL = "https://dbjnxezlixrwphouxddr.supabase.co"; // z.B. https://xyz.supabase.co
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRiam54ZXpsaXhyd3Bob3V4ZGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMjA3MDgsImV4cCI6MjA2MTY5NjcwOH0.a6_FqnadkPChoJ_M-XlpIY476RxU3haRep8S2aPESMo";

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
