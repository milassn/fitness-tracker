import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { LogIn, UserPlus, LogOut } from "lucide-react";

function LoginForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, signIn, signUp, signOut } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error } = isLogin
        ? await signIn(email, password)
        : await signUp(email, password);

      if (error) {
        setError(error.message);
      } else if (!isLogin) {
        setError(
          "Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mail."
        );
      }
    } catch (error) {
      setError("Ein Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (user) {
    return (
      <div className="exercise-form mb-6">
        <div className="header">
          <div>
            <h3 className="text-lg font-medium">Angemeldet als:</h3>
            <p className="text-gray-600">{user.email}</p>
          </div>
          <button onClick={handleSignOut} className="btn btn-secondary">
            <LogOut size={18} className="mr-1" /> Abmelden
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="exercise-form mb-6">
      <h2 className="text-xl font-semibold mb-4">
        {isLogin ? "Anmelden" : "Registrieren"}
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>E-Mail:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-control"
            required
          />
        </div>

        <div className="form-group">
          <label>Passwort:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-control"
            required
          />
        </div>

        {error && <div className="text-red-500 mb-4">{error}</div>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              "Wird geladen..."
            ) : isLogin ? (
              <>
                <LogIn size={18} className="mr-1" /> Anmelden
              </>
            ) : (
              <>
                <UserPlus size={18} className="mr-1" /> Registrieren
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="btn btn-secondary"
          >
            {isLogin ? "Neue Registrierung" : "Schon registriert? Anmelden"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default LoginForm;
