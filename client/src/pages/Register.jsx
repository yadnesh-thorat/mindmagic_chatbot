import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState("English");
  const [contentPreference, setContentPreference] = useState("Wellness");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const passedMBTI = location.state?.mbti || "";
  const [mbti, setMbti] = useState(passedMBTI);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/register", { email, password, language, contentPreference, mbti });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.msg || "Registration failed. Try a different email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="auth-card"
      >
        <div className="auth-logo">
          <div className="auth-logo-icon">🌿</div>
        </div>

        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem' }}>Begin Journey</h2>
        <p className="subtitle">Start your soul's growth with Calmra</p>

        <form onSubmit={handleRegister}>
          <div className="input-group">
            <label className="input-label">Email address</label>
            <input
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Preferred language</label>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              <option>English</option>
              <option>Marathi</option>
              <option>Hindi</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Chat style I prefer</label>
            <select value={contentPreference} onChange={(e) => setContentPreference(e.target.value)}>
              <option value="Wellness">🌱 Wellness &amp; Support</option>
              <option value="Motivation">🔥 Motivation</option>
              <option value="Philosophy">🌀 Philosophy</option>
              <option value="Jokes">😄 Light Humor / Jokes</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">My MBTI Type</label>
            <select value={mbti} onChange={(e) => setMbti(e.target.value)}>
              <option value="">Select...</option>
              <option value="INTJ">INTJ (Architect)</option>
              <option value="INTP">INTP (Logician)</option>
              <option value="ENTJ">ENTJ (Commander)</option>
              <option value="ENTP">ENTP (Debater)</option>
              <option value="INFJ">INFJ (Advocate)</option>
              <option value="INFP">INFP (Mediator)</option>
              <option value="ENFJ">ENFJ (Protagonist)</option>
              <option value="ENFP">ENFP (Campaigner)</option>
              <option value="ISTJ">ISTJ (Logistician)</option>
              <option value="ISFJ">ISFJ (Defender)</option>
              <option value="ESTJ">ESTJ (Executive)</option>
              <option value="ESFJ">ESFJ (Consul)</option>
              <option value="ISTP">ISTP (Virtuoso)</option>
              <option value="ISFP">ISFP (Adventurer)</option>
              <option value="ESTP">ESTP (Entrepreneur)</option>
              <option value="ESFP">ESFP (Entertainer)</option>
              <option value="Unknown">I don't know my type</option>
            </select>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" disabled={loading} style={{ marginTop: "1.25rem" }}>
            {loading ? "Creating account..." : "Get Started →"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{" "}
          <span onClick={() => navigate("/login")}>Sign in</span>
        </div>
      </motion.div>
    </div>
  );
}