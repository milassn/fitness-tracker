import React, { useState, useEffect } from "react";
import { RefreshCw, CheckCircle, AlertCircle, WifiOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { syncService } from "../services/syncService";

function SyncStatus() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { user } = useAuth();

  useEffect(() => {
    // Online/Offline Status überwachen
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (user && isOnline) {
      // Auto-Sync starten wenn eingeloggt und online
      syncService.startAutoSync();
      return () => {
        syncService.stopAutoSync();
      };
    }
  }, [user, isOnline]);

  const handleManualSync = async () => {
    if (!user || !isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      await syncService.syncAll();
      setLastSync(new Date());
    } catch (error) {
      console.error("Manual sync failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatLastSyncTime = () => {
    if (!lastSync) return "Nie";

    const diffMinutes = Math.floor((new Date() - lastSync) / 60000);
    if (diffMinutes < 1) return "Gerade eben";
    if (diffMinutes < 60)
      return `Vor ${diffMinutes} Minute${diffMinutes > 1 ? "n" : ""}`;

    const diffHours = Math.floor(diffMinutes / 60);
    return `Vor ${diffHours} Stunde${diffHours > 1 ? "n" : ""}`;
  };

  if (!user) return null;

  return (
    <div className="sync-status">
      <div className="sync-status-content">
        {!isOnline ? (
          <div className="sync-status-offline">
            <WifiOff size={18} />
            <span>Offline</span>
          </div>
        ) : isSyncing ? (
          <div className="sync-status-syncing">
            <RefreshCw size={18} className="animate-spin" />
            <span>Synchronisiere...</span>
          </div>
        ) : (
          <div className="sync-status-idle">
            <CheckCircle size={18} />
            <span>Letzte Synchronisation: {formatLastSyncTime()}</span>
          </div>
        )}
      </div>

      <button
        onClick={handleManualSync}
        disabled={!isOnline || isSyncing}
        className="btn btn-sm btn-secondary"
      >
        <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
      </button>
    </div>
  );
}

export default SyncStatus;
