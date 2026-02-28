import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [showMBTIModal, setShowMBTIModal] = useState(false);
  const [selectedMBTI, setSelectedMBTI] = useState("");
  const [currentSlide, setCurrentSlide] = useState(0);

  const images = [
    "/nature_wellness_abstract_1_1772257617674.png",
    "/nature_academic_abstract_2_1772257636111.png",
    "/nature_aesthetic_zen_3_1772257661376.png"
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [images.length]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) navigate("/chat");
  }, [navigate]);

  return (
    <div className="landing-page">
      <AnimatePresence>
        {showMBTIModal && (
          <div className="mbti-overlay" onClick={() => setShowMBTIModal(false)}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="mbti-modal"
              onClick={e => e.stopPropagation()}
            >
              <h3>Discover Your Type</h3>
              <p>Knowing your MBTI helps Anya and the team tailor their support to your personality.</p>

              <div className="mbti-selection">
                <select
                  value={selectedMBTI}
                  onChange={(e) => setSelectedMBTI(e.target.value)}
                  className="mbti-select"
                >
                  <option value="">Select your MBTI type...</option>
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

              {selectedMBTI === "Unknown" && (
                <div className="mbti-help">
                  <p>No worries! You can take a free test here:</p>
                  <a href="https://www.16personalities.com/free-personality-test" target="_blank" rel="noopener noreferrer" className="mbti-link">
                    16Personalities Test ↗
                  </a>
                </div>
              )}

              <div className="modal-actions">
                <button
                  onClick={() => navigate("/register", { state: { mbti: selectedMBTI || "Unknown" } })}
                  className="cta-primary full-width"
                >
                  Continue to Register
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <nav className={`landing-nav ${scrolled ? "scrolled" : ""}`}>
        <div className="nav-container">
          <div className="landing-logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="logo-svg">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 2 8 0 6-4 10-10 10zM11 20v-5a4 4 0 0 1 4-4" />
            </svg>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.01em' }}>Calmra</span>
          </div>

          <div className="nav-center">
            <button className="nav-pill" onClick={() => navigate("/chat", { state: { pref: "wellness" } })}>Wellness</button>
            <button className="nav-pill" onClick={() => navigate("/chat", { state: { pref: "philosophy" } })}>Philosophy</button>
            <button className="nav-pill" onClick={() => navigate("/chat", { state: { pref: "motivation" } })}>Motivation</button>
            <button className="nav-pill" onClick={() => navigate("/chat", { state: { pref: "joke" } })}>Joke</button>
          </div>

          <div className="nav-right">
            <button onClick={() => navigate("/login")} className="nav-btn-text">Login</button>
            <button onClick={() => setShowMBTIModal(true)} className="nav-btn-pill">Get Started</button>
          </div>
        </div>
      </nav>

      <main className="landing-hero">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="hero-content"
        >
          <div className="badge">Nature-Inspired Support</div>
          <h1 style={{ fontFamily: 'var(--font-heading)' }}>Embrace your inner peace</h1>
          <p>
            Experience a soulful way to track your wellness, get nature-inspired insights,
            and chat with companion personas designed to nurture your mental health.
          </p>
          <div className="hero-actions">
            <button onClick={() => setShowMBTIModal(true)} className="cta-primary">
              Begin Your Journey
            </button>
            <button onClick={() => navigate("/login")} className="cta-secondary">
              Sign In
            </button>
          </div>
        </motion.div>

        <motion.div
          className="hero-carousel-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 0.8, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="carousel-slide"
              style={{ backgroundImage: `url(${images[currentSlide]})` }}
            />
          </AnimatePresence>
          <div className="carousel-overlay" />
          <div className="carousel-dots">
            {images.map((_, i) => (
              <span
                key={i}
                className={`dot ${i === currentSlide ? "active" : ""}`}
                onClick={() => setCurrentSlide(i)}
              />
            ))}
          </div>
        </motion.div>
      </main>

      <section className="landing-features">
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" /><path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /></svg>
            </div>
            <h3>Daily Entries</h3>
            <p>Journal your thoughts and emotions. Anya and the team are here to listen and respond with care.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="M18 9l-5 5-2-2-4 4" /></svg>
            </div>
            <h3>Weekly Insights</h3>
            <p>Get a comprehensive AI-generated report of your emotional trends and wellness progress.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="4" /><path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z" /><polyline points="3 7 21 7" /></svg>
            </div>
            <h3>Soul Lens</h3>
            <p>Upload images to get unique AI interpretations of your surroundings and mood.</p>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <p>&copy; 2026 Calmra. Built for your mental well-being.</p>
      </footer>
    </div>
  );
}
