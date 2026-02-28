import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList, Lightbulb, BarChart2, BookOpen, Wand2,
  Sun, Moon, Trash2, Camera, CalendarDays, MoreHorizontal,
  LogOut, Sparkles, X, Loader2, Pencil, ArrowRight, Image
} from "lucide-react";
import api from "../api";

// These will be moved to a shared local file in client/src/utils/constants.js
// for now, I'll just keep them but clean up the file structure.
// I'll create constants.js in the client as well for better separation.
import {
  PREFERENCE_META,
  EMOTION_VIBES,
  MAGIC_TASKS,
  RECOMMENDATIONS,
  QUICK_PROMPTS
} from "../utils/constants";
import { useTheme } from "../context/ThemeContext";

export default function Chat() {
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [aura, setAura] = useState("Water");
  const [typing, setTyping] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showRecs, setShowRecs] = useState(false);
  const [showMagic, setShowMagic] = useState(false);
  const [showLens, setShowLens] = useState(false);
  const [showSparks, setShowSparks] = useState(true);
  const [sparks, setSparks] = useState([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [vibe, setVibe] = useState("Neutral");
  const [magicTask, setMagicTask] = useState("");
  const [magicShaking, setMagicShaking] = useState(false);
  const [magicGame, setMagicGame] = useState(false);
  const [magicScore, setMagicScore] = useState(0);
  const [magicTimer, setMagicTimer] = useState(60);
  const [magicParticles, setMagicParticles] = useState([]);
  const [lensReading, setLensReading] = useState("");
  const [capturedImage, setCapturedImage] = useState(null);
  const [loadingWeekly, setLoadingWeekly] = useState(false);
  const [loadingLens, setLoadingLens] = useState(false);
  const [showJournal, setShowJournal] = useState(false);
  const [journalEntries, setJournalEntries] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showSignPicker, setShowSignPicker] = useState(false);
  const [selectedSigns, setSelectedSigns] = useState({ sun: "", moon: "", rising: "" });
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const imageInputRef = useRef(null);
  const prevPreferenceRef = useRef(null);
  const [attachedImage, setAttachedImage] = useState(null); // { base64, file }

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userLanguage = user.language || "English";
  const [contentPreference, setContentPreference] = useState(user.contentPreference || "Wellness");

  const meta = PREFERENCE_META[contentPreference] || PREFERENCE_META.Wellness;
  const quickPrompts = QUICK_PROMPTS[contentPreference] || QUICK_PROMPTS.Wellness;

  useEffect(() => {
    if (location.state?.pref) {
      const prefMap = { wellness: "Wellness", philosophy: "Philosophy", motivation: "Motivation", joke: "Jokes", astrology: "Astrology" };
      const choice = location.state.pref.toLowerCase();
      if (prefMap[choice]) {
        setContentPreference(prefMap[choice]);
      }
    }
  }, [location.state]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get("/history");
        setMessages(res.data);
      } catch (err) {
        console.error("Failed to load history", err);
      }
    };
    fetchHistory();
  }, []);

  // Helper: check if zodiac signs are already mentioned in messages
  const hasAstrologySignsInHistory = (msgs) => {
    const signs = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];
    const combined = msgs.map(m => m.text || "").join(" ").toLowerCase();
    return signs.some(s => combined.includes(s));
  };

  // Inject Shaunak's greeting when switching TO Astrology
  useEffect(() => {
    if (contentPreference === "Astrology" && prevPreferenceRef.current !== "Astrology") {
      if (!hasAstrologySignsInHistory(messages)) {
        const shaunakGreeting = {
          sender: "bot",
          text: `🔮 Namaste! I'm Shaunak, your cosmic guide. Before I can read the stars for you, I need to know your three core placements — these form your complete celestial blueprint. Please select your signs below 🌌`,
        };
        setMessages(prev => [...prev, shaunakGreeting]);
        setShowSignPicker(true);
        setSelectedSigns({ sun: "", moon: "", rising: "" });
      }
    }
    prevPreferenceRef.current = contentPreference;
  }, [contentPreference]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing]);

  const ZODIAC_SIGNS = [
    { label: "Aries", glyph: "♈" }, { label: "Taurus", glyph: "♉" },
    { label: "Gemini", glyph: "♊" }, { label: "Cancer", glyph: "♋" },
    { label: "Leo", glyph: "♌" }, { label: "Virgo", glyph: "♍" },
    { label: "Libra", glyph: "♎" }, { label: "Scorpio", glyph: "♏" },
    { label: "Sagittarius", glyph: "♐" }, { label: "Capricorn", glyph: "♑" },
    { label: "Aquarius", glyph: "♒" }, { label: "Pisces", glyph: "♓" },
  ];

  const handleSignSubmit = () => {
    const { sun, moon, rising } = selectedSigns;
    if (!sun || !moon || !rising) return;
    const msg = `My Sun sign is ${sun}, Moon sign is ${moon}, and Rising (Ascendant) sign is ${rising}.`;
    setShowSignPicker(false);
    sendMessage(null, msg);
  };

  const handleChatImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachedImage({ base64: reader.result, name: file.name });
    };
    reader.readAsDataURL(file);
    // reset input so same file can be picked again
    e.target.value = "";
  };

  const unsendMessage = async (index) => {
    const msg = messages[index];
    if (!msg || msg.sender !== "user") return;

    // Optimistically remove from UI: user msg + following bot reply
    setMessages(prev => {
      const next = [...prev];
      // Remove the bot reply right after (if exists)
      if (next[index + 1]?.sender === "bot") next.splice(index + 1, 1);
      next.splice(index, 1);
      return next;
    });

    // Persist deletion to DB if we have an entryId
    if (msg.entryId) {
      try {
        await api.delete(`/entry/${msg.entryId}`);
      } catch (err) {
        console.warn("Unsend DB delete failed:", err.message);
      }
    }
  };

  const sendMessage = async (e, customText = null) => {
    if (e) e.preventDefault();
    if (typing) return;
    const finalText = customText || text;
    const hasImage = !!attachedImage;
    if (!finalText.trim() && !hasImage) return;

    const imageSnapshot = attachedImage;
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: finalText || "", image: imageSnapshot?.base64 || null },
    ]);
    setText("");
    setAttachedImage(null);
    setTyping(true);
    inputRef.current?.focus();

    try {
      // If there's an image, send it to vision for a contextual reply
      if (imageSnapshot) {
        try {
          const vRes = await api.post("/vision", {
            base64Image: imageSnapshot.base64,
            caption: finalText.trim(),
            contentPreference,
          });
          if (vRes.data.reading) {
            setMessages((prev) => [
              ...prev,
              { sender: "bot", text: vRes.data.reading },
            ]);
            return; // image handled — skip /entry to avoid duplicate reply
          }
        } catch (visionErr) {
          console.warn("Vision failed, falling back to text reply:", visionErr.message);
        }
      }

      // Send text entry if there's text (and no image was the primary payload)
      if (finalText.trim()) {
        const res = await api.post("/entry", {
          text: finalText,
          aura: aura,
          language: userLanguage,
          contentPreference,
        });
        setMessages((prev) => [...prev, { sender: "bot", text: res.data.reply }]);
        if (res.data.emotion) setVibe(res.data.emotion);
      }
    } catch (err) {
      const errData = err.response?.data;
      let errMsg;
      if (errData?.rateLimited) {
        errMsg = "⏳ I'm a bit overloaded right now! Give me a few seconds and try again.";
      } else if (errData?.aiError) {
        errMsg = "⚠️ My thinking engine is temporarily down. Please try again shortly.";
      } else if (err.code === "ERR_NETWORK" || !err.response) {
        errMsg = "⚠️ Can't reach the server. Please make sure it's running on port 5000.";
      } else {
        errMsg = `⚠️ ${errData?.msg || "Something went wrong. Please try again."}`;
      }
      setMessages((prev) => [...prev, { sender: "bot", text: errMsg, isError: true }]);
    } finally {
      if (showSparks) {
        addSparks(5);
      }
      setTyping(false);
      setShowForm(false);
    }
  };

  const generateWeeklyReport = async () => {
    setLoadingWeekly(true);
    try {
      const res = await api.post("/weekly", { language: userLanguage });
      if (res.data.summary) {
        setMessages((prev) => [...prev, { sender: "bot", text: `📅 **Weekly Insight**\n\n${res.data.summary}`, isReport: true }]);
      } else {
        setMessages((prev) => [...prev, { sender: "bot", text: "You need at least 3 entries to generate a weekly report. Keep sharing your feelings!" }]);
      }
    } catch {
      setMessages((prev) => [...prev, { sender: "bot", text: "Couldn't generate the report right now. Try again in a moment." }]);
    } finally {
      setLoadingWeekly(false);
    }
  };

  const clearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear all chat history? This cannot be undone.")) return;
    try {
      await api.delete("/history");
      setMessages([]);
    } catch (err) {
      console.error("Failed to clear history", err);
      alert("Failed to clear chat history. Please try again.");
    }
  };

  const openMagicJar = () => {
    setShowMagic(true);
    setMagicShaking(true);
    setMagicTask("");
    setMagicGame(false);
    setTimeout(() => {
      const isGame = Math.random() > 0.5;
      if (isGame) {
        setMagicGame(true);
        setMagicScore(0);
        setMagicTimer(60);
        generateGameParticles();
      } else {
        const randomTask = MAGIC_TASKS[Math.floor(Math.random() * MAGIC_TASKS.length)];
        setMagicTask(randomTask);
      }
      setMagicShaking(false);
    }, 1500);
  };

  const generateGameParticles = () => {
    const emojis = ["✨", "💫", "🧿", "💎", "🦋", "🌈"];
    const pts = Array.from({ length: 8 }).map(() => ({
      id: Math.random(),
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
      duration: Math.random() * 3 + 2
    }));
    setMagicParticles(pts);
  };

  const catchParticle = (id) => {
    setMagicScore(prev => prev + 1);
    setMagicParticles(prev => prev.filter(p => p.id !== id));
    if (magicParticles.length <= 1) generateGameParticles();
  };

  useEffect(() => {
    let interval;
    if (magicGame && magicTimer > 0) {
      interval = setInterval(() => setMagicTimer(t => t - 1), 1000);
    } else if (magicTimer === 0) {
      setMagicGame(false);
      setMagicTask(`Soul Catching Mastery! You caught ${magicScore} echoes of energy in 1 minute. ✨ You feel lighter and more focused now.`);
    }
    return () => clearInterval(interval);
  }, [magicGame, magicTimer]);

  const handleVisionUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      setCapturedImage(base64);
      setLensReading("");
      setLoadingLens(true);
      setShowLens(true);
      try {
        const res = await api.post("/vision", { base64Image: base64 });
        setLensReading(res.data.reading);
      } catch {
        setLensReading("The Soul Lens is a bit hazy right now. Try another point of view! ✨");
      } finally {
        setLoadingLens(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const fetchJournal = async () => {
    try {
      const res = await api.get("/journal");
      setJournalEntries(res.data);
      setShowJournal(true);
    } catch (err) {
      console.error("Fetch journal error:", err);
      alert("Could not fetch your magical journal. Try again later.");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  };

  const handleMouseMove = (e) => {
    if (!showSparks || Math.random() > 0.3) return;
    const newSpark = {
      id: Date.now() + Math.random(),
      x: e.clientX,
      y: e.clientY,
      size: Math.random() * 4 + 2
    };
    setSparks(prev => [...prev.slice(-15), newSpark]);
  };

  const addSparks = (count) => {
    const newSparks = Array.from({ length: count }).map(() => ({
      id: Math.random() + Date.now(),
      x: Math.random() * window.innerWidth,
      y: window.innerHeight - 80,
      size: Math.random() * 6 + 4
    }));
    setSparks(prev => [...prev.slice(-20), ...newSparks]);
  };

  useEffect(() => {
    if (sparks.length > 0) {
      const timer = setTimeout(() => {
        setSparks(prev => prev.slice(1));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [sparks]);

  const handlePrefChange = (newPref) => {
    setContentPreference(newPref);
    const updatedUser = { ...user, contentPreference: newPref };
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const userInitial = (user.email || "U")[0].toUpperCase();

  return (
    <div
      className={`cw ${theme === 'light' ? 'theme-light' : 'theme-dark'}`}
      onMouseMove={handleMouseMove}
      style={{
        '--vibe-bg': EMOTION_VIBES[vibe] || EMOTION_VIBES.Neutral,
        '--meta-color': meta.color
      }}
    >
      {/* ── Background ── */}
      <div className="vibe-glow" />

      {/* ── Profile Modal ── */}
      <AnimatePresence>
        {showProfile && (() => {
          const displayName = user.email?.split("@")[0] || "User";
          const emailDomain = user.email?.split("@")[1] || "";
          const memberSince = user.createdAt
            ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
            : "Recently";
          const msgCount = messages.filter(m => m.sender === "user").length;
          const avatarColors = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];
          const avatarColor = avatarColors[displayName.charCodeAt(0) % avatarColors.length];
          const initials = displayName.slice(0, 2).toUpperCase();
          return (
            <>
              {/* Backdrop */}
              <motion.div
                className="profile-backdrop"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowProfile(false)}
              />
              {/* Panel */}
              <motion.div
                className="profile-panel"
                initial={{ x: -320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -320, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {/* Close */}
                <button className="profile-close" onClick={() => setShowProfile(false)}>
                  <X size={18} />
                </button>

                {/* Avatar */}
                <div className="profile-avatar-wrap">
                  <div className="profile-avatar" style={{ background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}99)` }}>
                    <span>{initials}</span>
                  </div>
                  <div className="profile-avatar-ring" style={{ borderColor: avatarColor }} />
                </div>

                {/* Name & Email */}
                <h2 className="profile-name">{displayName}</h2>
                <p className="profile-email">
                  <span>{displayName}</span>
                  <span className="profile-email-at">@</span>
                  <span>{emailDomain}</span>
                </p>

                <div className="profile-divider" />

                {/* Stats */}
                <div className="profile-stats">
                  <div className="profile-stat">
                    <span className="pstat-value">{msgCount}</span>
                    <span className="pstat-label">Messages</span>
                  </div>
                  <div className="profile-stat-sep" />
                  <div className="profile-stat">
                    <span className="pstat-value">{user.mbti || "—"}</span>
                    <span className="pstat-label">MBTI</span>
                  </div>
                  <div className="profile-stat-sep" />
                  <div className="profile-stat">
                    <span className="pstat-value">{user.language || "EN"}</span>
                    <span className="pstat-label">Language</span>
                  </div>
                </div>

                <div className="profile-divider" />

                {/* Details */}
                <div className="profile-details">
                  <div className="profile-detail-row">
                    <span className="pdr-label">Current Journey</span>
                    <span className="pdr-value" style={{ color: meta.color }}>
                      {meta.emoji} {meta.label} with {meta.bot}
                    </span>
                  </div>
                  <div className="profile-detail-row">
                    <span className="pdr-label">Member Since</span>
                    <span className="pdr-value">{memberSince}</span>
                  </div>
                  <div className="profile-detail-row">
                    <span className="pdr-label">Full Email</span>
                    <span className="pdr-value">{user.email}</span>
                  </div>
                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

      <div className="chat-layout">
        {/* ── Sidebar ── */}
        <aside className="chat-sidebar">
          <div className="sidebar-header">
            <button className="sidebar-logo" onClick={() => setShowProfile(true)} title="View Profile">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 3.5 2 8 0 6-4 10-10 10zM11 20v-5a4 4 0 0 1 4-4" /></svg>
              <span>Mind Magic</span>
            </button>
          </div>

          <div className="sidebar-nav">
            <p className="sidebar-label">Choose Your Journey</p>
            <div className="journey-cards">
              {Object.entries(PREFERENCE_META).map(([key, m]) => (
                <motion.button
                  key={key}
                  whileHover={{ x: 6, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setContentPreference(key)}
                  className={`journey-card ${contentPreference === key ? "active" : ""}`}
                  style={{ '--accent': m.color }}
                >
                  <div className="j-visual">{m.emoji}</div>
                  <div className="j-content">
                    <span className="j-name">{m.label}</span>
                    <span className="j-subtitle">{m.bot} · Companion</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="sidebar-footer">
            <button className="footer-btn" onClick={logout}>
              <LogOut size={15} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
              Logout
            </button>
          </div>
        </aside>

        <main className="chat-viewport">
          {/* ── Live Animated Background ── */}
          <div className="chat-bg-canvas" style={{ '--orb-color': meta.color }}>
            <div className="bg-orb orb-1" />
            <div className="bg-orb orb-2" />
            <div className="bg-orb orb-3" />
            <div className="bg-orb orb-4" />
            <div className="bg-mesh" />
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-particle" style={{
                left: `${10 + i * 11}%`,
                top: `${15 + (i % 3) * 25}%`,
                animationDelay: `${i * 0.7}s`,
                animationDuration: `${4 + i * 0.5}s`,
                width: `${4 + (i % 3) * 3}px`,
                height: `${4 + (i % 3) * 3}px`,
              }} />
            ))}
          </div>
          {/* ── Header ── */}
          <header className="ch">
            <div className="ch-left">
              <div className="bot-avatar" style={{ background: meta.color }}>
                <span style={{ fontSize: "1rem" }}>{meta.emoji}</span>
              </div>
              <div>
                <h1 className="ch-title">{meta.bot}</h1>
                <p className="ch-sub"><span className="online-dot" /> Your {meta.label} Guide</p>
              </div>
            </div>

            <div className="ch-controls">
              <button className="hdr-btn" onClick={() => setShowForm(!showForm)} title="Aura Assessment">
                {showForm ? <X size={20} /> : <ClipboardList size={20} />}
              </button>
              <button className="hdr-btn" onClick={() => setShowRecs(!showRecs)} title="Recommendations">
                <Lightbulb size={20} />
              </button>
              <button className="hdr-btn" onClick={generateWeeklyReport} disabled={loadingWeekly} title="Weekly Report">
                {loadingWeekly ? <Loader2 size={20} className="spin-icon" /> : <BarChart2 size={20} />}
              </button>
              <button className="hdr-btn" onClick={fetchJournal} title="Soul Journal">
                <BookOpen size={20} />
              </button>
              <button className="hdr-btn magic-btn" onClick={openMagicJar} title="The Magic Jar">
                <Wand2 size={20} />
              </button>
              <button className="hdr-btn theme-btn" onClick={toggleTheme} title="Toggle Theme">
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button className="hdr-btn delete-btn" onClick={clearHistory} title="Clear Chat">
                <Trash2 size={20} />
              </button>
            </div>
          </header>

          {/* ── Mobile Bottom Nav ── */}
          <div className="mobile-nav">
            <button className={`nav-item ${showForm ? 'active' : ''}`} onClick={() => setShowForm(!showForm)}>
              <span className="nav-icon"><ClipboardList size={22} /></span>
              <span className="nav-text">Aura</span>
            </button>
            <button className="nav-item" onClick={() => document.getElementById('lens-input').click()}>
              <span className="nav-icon"><Camera size={22} /></span>
              <span className="nav-text">Lens</span>
            </button>
            <button className="nav-item main" onClick={openMagicJar}>
              <div className="main-nav-inner"><Wand2 size={26} /></div>
            </button>
            <button className="nav-item" onClick={generateWeeklyReport} disabled={loadingWeekly}>
              <span className="nav-icon">{loadingWeekly ? <Loader2 size={22} className="spin-icon" /> : <CalendarDays size={22} />}</span>
              <span className="nav-text">Insights</span>
            </button>
            <button className={`nav-item ${showMobileMenu ? 'active' : ''}`} onClick={() => setShowMobileMenu(!showMobileMenu)}>
              <span className="nav-icon"><MoreHorizontal size={22} /></span>
              <span className="nav-text">More</span>
            </button>
          </div>

          {/* ── Mobile More Menu ── */}
          <AnimatePresence>
            {showMobileMenu && (
              <div className="mobile-menu-overlay" onClick={() => setShowMobileMenu(false)}>
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="mobile-menu-content"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="menu-handle" />
                  <div className="menu-header">
                    <h3>Magical Settings</h3>
                    <p>Customize your experience</p>
                  </div>
                  <div className="menu-grid">
                    <button className="menu-item" onClick={() => { toggleTheme(); setShowMobileMenu(false); }}>
                      <span className="menu-icon">{theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}</span>
                      <div className="menu-info">
                        <span className="menu-label">{theme === 'dark' ? "Ethereal Light" : "Mystic Dark"}</span>
                        <span className="menu-desc">Switch to {theme === 'dark' ? "light" : "dark"} theme</span>
                      </div>
                    </button>
                    <button className="menu-item" onClick={() => { setShowSparks(!showSparks); setShowMobileMenu(false); }}>
                      <span className="menu-icon"><Sparkles size={22} /></span>
                      <div className="menu-info">
                        <span className="menu-label">Aura Sparks</span>
                        <span className="menu-desc">{showSparks ? "Active" : "Hidden"} magic trail</span>
                      </div>
                    </button>
                    <button className="menu-item" onClick={() => { setShowRecs(!showRecs); setShowMobileMenu(false); }}>
                      <span className="menu-icon"><Lightbulb size={22} /></span>
                      <div className="menu-info">
                        <span className="menu-label">Recommendations</span>
                        <span className="menu-desc">Get soulful ideas</span>
                      </div>
                    </button>
                    <button className="menu-item" onClick={() => { fetchJournal(); setShowMobileMenu(false); }}>
                      <span className="menu-icon"><BookOpen size={22} /></span>
                      <div className="menu-info">
                        <span className="menu-label">Soul Journal</span>
                        <span className="menu-desc">Review your magical history</span>
                      </div>
                    </button>
                    <button className="menu-item delete" onClick={() => { clearHistory(); setShowMobileMenu(false); }}>
                      <span className="menu-icon"><Trash2 size={22} /></span>
                      <div className="menu-info">
                        <span className="menu-label">Clear Heart</span>
                        <span className="menu-desc">Wipe all messages</span>
                      </div>
                    </button>
                    <button className="menu-item logout" onClick={logout}>
                      <span className="menu-icon"><LogOut size={22} /></span>
                      <div className="menu-info">
                        <span className="menu-label">Say Goodbye</span>
                        <span className="menu-desc">Logout of session</span>
                      </div>
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* ── Assessment Panel ── */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="assessment-panel"
              >
                <h3 style={{ marginBottom: "1.25rem", fontSize: "0.95rem", color: "#f8fafc", fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <span style={{ background: 'rgba(99,102,241,0.2)', padding: '0.4rem', borderRadius: '8px', display: 'flex', alignItems: 'center' }}><Wand2 size={16} color="#818cf8" /></span>
                  Sync Your Magic Aura
                </h3>

                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>How does your soul feel right now? Pick an element:</p>

                <div className="aura-grid">
                  {[
                    { id: "Water", label: "Serene Water", emoji: "🌊", color: "#3b82f6", desc: "Calm & Fluid" },
                    { id: "Fire", label: "Radiant Fire", emoji: "🔥", color: "#ef4444", desc: "Strong & Driven" },
                    { id: "Earth", label: "Solid Earth", emoji: "⛰️", color: "#10b981", desc: "Steady & Safe" },
                    { id: "Air", label: "Free Wind", emoji: "🌀", color: "#8b5cf6", desc: "Light & Curious" },
                  ].map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setAura(a.id)}
                      className={`aura-card ${aura === a.id ? 'active' : ''}`}
                      style={{ '--aura-color': a.color }}
                    >
                      <span className="aura-emoji">{a.emoji}</span>
                      <div className="aura-info">
                        <span className="aura-label">{a.label}</span>
                        <span className="aura-desc">{a.desc}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.6rem', fontWeight: 600, textTransform: 'uppercase' }}><Pencil size={12} /> Pour your heart here</label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Share your thoughts, feelings, or just a little bit of your magic..."
                    className="assessment-textarea"
                  />
                </div>
                <button className="submit-btn" onClick={(e) => sendMessage(e)}>
                  <Sparkles size={14} style={{ marginRight: '0.4rem', verticalAlign: 'middle' }} />
                  Ignite My Session
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Recommendations Panel ── */}
          <AnimatePresence>
            {showRecs && (
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                className="recs-panel"
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
              >
                <div className="recs-header">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                    <Lightbulb size={18} />
                    Suggested for You
                  </h3>
                  <button className="close-recs" onClick={() => setShowRecs(false)}><X size={16} /></button>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.5rem 0 1rem' }}>
                  Based on your <b>{meta.label}</b> mode
                </p>
                <div className="recs-list">
                  {(RECOMMENDATIONS[contentPreference] || RECOMMENDATIONS.Wellness).map((rec, i) => (
                    <button
                      key={i}
                      className="rec-item"
                      onClick={() => { sendMessage(null, rec.prompt); setShowRecs(false); }}
                      style={{ borderLeft: `3px solid ${meta.color}` }}
                    >
                      <div className="rec-text">
                        <span className="rec-title">{rec.title}</span>
                        <span className="rec-prompt">"{rec.prompt.substring(0, 45)}..."</span>
                      </div>
                      <span className="rec-arrow" style={{ color: meta.color }}>→</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Magic Jar Modal ── */}
          <AnimatePresence>
            {showMagic && (
              <div className="magic-overlay" onClick={() => !magicShaking && setShowMagic(false)}>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0, rotateY: 180 }}
                  animate={magicShaking ? {
                    scale: 1, opacity: 1, rotateY: 0,
                    x: [0, -10, 10, -10, 10, 0],
                    rotate: [0, -5, 5, -5, 5, 0]
                  } : { scale: 1, opacity: 1, rotateY: 0 }}
                  exit={{ scale: 0.8, opacity: 0, rotateY: 180 }}
                  transition={{
                    x: { duration: 0.3, repeat: Infinity },
                    rotate: { duration: 0.3, repeat: Infinity },
                    default: { duration: 0.5 }
                  }}
                  className="magic-card"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="magic-card-inner">
                    {magicShaking ? (
                      <div className="magic-shaking-view">
                        <div className="magic-jar-icon">🏺</div>
                        <div className="magic-glitter">✨✨✨</div>
                        <p className="magic-label" style={{ marginTop: '1rem' }}>UNLEASHING CHAOS...</p>
                      </div>
                    ) : magicGame ? (
                      <div className="magic-game-view">
                        <div className="game-status">
                          <span>⏱️ {magicTimer}s</span>
                          <span>✨ {magicScore}</span>
                        </div>
                        <p className="magic-label">SOUL CATCHER: TAP THE ECHOES</p>
                        <div className="particles-arena">
                          {magicParticles.map(p => (
                            <motion.button
                              key={p.id}
                              className="game-particle"
                              initial={{ scale: 0 }}
                              animate={{
                                scale: 1.2,
                                x: [0, 20, -20, 0],
                                y: [0, -30, 30, 0]
                              }}
                              transition={{ duration: p.duration, repeat: Infinity }}
                              onClick={() => catchParticle(p.id)}
                              style={{ left: `${p.x}%`, top: `${p.y}%` }}
                            >
                              {p.emoji}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="magic-sparkles">🌱🍃🌳</div>
                        <h2 className="magic-card-title" style={{ fontFamily: 'var(--font-heading)' }}>Calmra Wisdom</h2>
                        <div className="magic-divider" />
                        <p className="magic-label">{magicTimer === 0 ? "GAME OVER" : "YOUR SOUL CHALLENGE"}</p>
                        <p className="magic-task-text">{magicTask || "Mindful Moment: Reconnect with the nature around you..."}</p>
                        <div className="magic-divider" />
                        <button className="magic-close-btn" onClick={() => setShowMagic(false)}>
                          {magicTimer === 0 ? "Wonderful! ✨" : "I will! 🌿"}
                        </button>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* ── Soul Journal Modal ── */}
          <AnimatePresence>
            {showJournal && (
              <div className="journal-overlay" onClick={() => setShowJournal(false)}>
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  className="journal-panel"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="journal-header">
                    <h3><BookOpen size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />Soul Journal</h3>
                    <button onClick={() => setShowJournal(false)}><X size={20} /></button>
                  </div>
                  <div className="journal-list">
                    {journalEntries.length === 0 ? (
                      <p className="no-entries">Your journal is currently blank. Start sharing your thoughts! ✨</p>
                    ) : (
                      journalEntries.map(e => (
                        <div key={e._id} className="journal-entry">
                          <div className="entry-meta">
                            <span className="entry-date">{new Date(e.createdAt).toLocaleDateString()}</span>
                            <span className="entry-emotion" style={{ background: `${meta.color}22`, color: meta.color }}>{e.emotion || "Neutral"}</span>
                          </div>
                          <p className="entry-text">{e.text}</p>
                          {e.botReply && (
                            <div className="entry-reply">
                              <span className="reply-label">{meta.bot}'s Wisdom</span>
                              <p>{e.botReply}</p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
          {/* ── Soul Lens Modal ── */}
          <AnimatePresence>
            {showLens && (
              <div className="lens-overlay" onClick={() => setShowLens(false)}>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0, y: 20 }}
                  className="lens-card"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="lens-header">
                    <h3><Camera size={16} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />Soul Lens</h3>
                    <button onClick={() => setShowLens(false)}><X size={18} /></button>
                  </div>

                  <div className="lens-preview-container">
                    {capturedImage && <img src={capturedImage} alt="Soul Captured" className="lens-preview" />}
                    <div className="lens-shimmer-overlay" />
                  </div>

                  <div className="lens-analysis">
                    {loadingLens ? (
                      <div className="lens-loading">
                        <div className="lens-spinner" />
                        <p>Scanning your magical energy...</p>
                      </div>
                    ) : (
                      <div className="lens-result">
                        <p className="lens-text">{lensReading}</p>
                        <div className="lens-tags">
                          <span className="lens-tag">✨ Energy Sync</span>
                          <span className="lens-tag">🪐 Aura Found</span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
          <div className="cb">
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="welcome"
              >
                <div className="welcome-emoji">{meta.emoji}</div>
                <h2 className="welcome-title">Hey {user.email?.split("@")[0] || "there"}! 👋</h2>
                <div className="welcome-chat">
                  <div className="bubble bot">
                    <p>Welcome to <strong>Mind Magic</strong>! ✨</p>
                    <p>I'm <strong>{meta.bot}</strong>, your {meta.label} companion.</p>
                    {contentPreference === "Astrology" ? (
                      <p>🔮 The cosmos has brought you here. To give you a truly personal reading, I'll need to know your <b>Sun sign</b>, <b>Moon sign</b>, and <b>Rising (Ascendant) sign</b>. These three together reveal your complete celestial blueprint. Ready to begin?</p>
                    ) : (
                      <p><b>How are you feeling today?</b> What did you do today?</p>
                    )}
                  </div>
                </div>
                <div className="quick-chips">
                  {quickPrompts.map((q, i) => (
                    <button key={i} onClick={() => sendMessage(null, q)} className="chip">
                      {q}
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: msg.sender === "user" ? 60 : -60, scale: 0.92 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className={`msg-row ${msg.sender}`}
                  >
                    {msg.sender === "bot" && (
                      <div className="msg-avatar bot-av" style={{ background: `linear-gradient(135deg, ${meta.color}55, ${meta.color}22)`, border: `1.5px solid ${meta.color}44` }}>
                        <span style={{ fontSize: "0.9rem" }}>{meta.emoji}</span>
                      </div>
                    )}
                    <div className={`bubble ${msg.sender} ${msg.isReport ? "report-bubble" : ""} ${msg.isError ? "error-bubble" : ""}`}>
                      {msg.image && (
                        <div className="msg-image-wrap">
                          <img src={msg.image} alt="Attached" className="msg-image" />
                        </div>
                      )}
                      {msg.text && msg.text.split("\n").filter(l => l !== "").map((line, j) => (
                        <p key={j}>{line}</p>
                      ))}
                      <span className="msg-time">
                        {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {msg.sender === "user" && (
                      <>
                        <button
                          className="unsend-btn"
                          onClick={() => unsendMessage(i)}
                          title="Unsend message"
                          type="button"
                        >
                          <Trash2 size={13} />
                          <span>Unsend</span>
                        </button>
                        <div className="msg-avatar user-av">{userInitial}</div>
                      </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}

            {/* Typing indicator */}
            {typing && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="msg-row bot"
              >
                <div className="msg-avatar bot-av" style={{ background: `linear-gradient(135deg, ${meta.color}55, ${meta.color}22)`, border: `1.5px solid ${meta.color}44` }}>
                  <span style={{ fontSize: "0.9rem" }}>{meta.emoji}</span>
                </div>
                <div className="bubble bot typing-bubble">
                  <div className="dots">
                    <span /><span /><span />
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "#64748b", marginLeft: "0.5rem" }}>{meta.bot} is typing...</span>
                </div>
              </motion.div>
            )}

            {/* Sign Picker — injected when Shaunak needs birth chart info */}
            {showSignPicker && contentPreference === "Astrology" && (
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="sign-picker-card"
              >
                <div className="sign-picker-header">
                  <span className="sign-picker-icon">🌌</span>
                  <div>
                    <p className="sign-picker-title">Select Your Three Signs</p>
                    <p className="sign-picker-sub">Sun · Moon · Rising</p>
                  </div>
                </div>

                <div className="sign-picker-rows">
                  {[
                    { key: "sun", label: "Sun Sign", glyph: "☀️", desc: "Your core identity" },
                    { key: "moon", label: "Moon Sign", glyph: "🌙", desc: "Your emotional self" },
                    { key: "rising", label: "Rising Sign", glyph: "⬆️", desc: "How the world sees you" },
                  ].map(({ key, label, glyph, desc }) => (
                    <div key={key} className="sign-picker-row">
                      <div className="sign-picker-row-label">
                        <span>{glyph}</span>
                        <div>
                          <p className="sprl-name">{label}</p>
                          <p className="sprl-desc">{desc}</p>
                        </div>
                      </div>
                      <div className="sign-grid">
                        {ZODIAC_SIGNS.map(({ label: sign, glyph: sg }) => (
                          <button
                            key={sign}
                            type="button"
                            className={`sign-btn ${selectedSigns[key] === sign ? 'active' : ''}`}
                            onClick={() => setSelectedSigns(prev => ({ ...prev, [key]: sign }))}
                            title={sign}
                          >
                            <span className="sign-btn-glyph">{sg}</span>
                            <span className="sign-btn-label">{sign}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="sign-picker-submit"
                  onClick={handleSignSubmit}
                  disabled={!selectedSigns.sun || !selectedSigns.moon || !selectedSigns.rising}
                  style={{ background: (!selectedSigns.sun || !selectedSigns.moon || !selectedSigns.rising) ? 'rgba(255,255,255,0.06)' : '#6366f1' }}
                >
                  {(!selectedSigns.sun || !selectedSigns.moon || !selectedSigns.rising)
                    ? `Select all three signs (${[selectedSigns.sun, selectedSigns.moon, selectedSigns.rising].filter(Boolean).length}/3)`
                    : `🔮 Reveal My Cosmic Chart`
                  }
                </button>
              </motion.div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* ── Input Area ── */}
          {!showForm && (
            <section className="ci-wrapper">
              {/* Hidden file input for chat image attachment */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleChatImageUpload}
                id="chat-image-input"
              />

              {/* Image preview strip */}
              {attachedImage && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="img-preview-strip"
                >
                  <div className="img-preview-thumb-wrap">
                    <img src={attachedImage.base64} alt="Preview" className="img-preview-thumb" />
                    <button
                      type="button"
                      className="img-preview-remove"
                      onClick={() => setAttachedImage(null)}
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                  <span className="img-preview-name">{attachedImage.name}</span>
                </motion.div>
              )}

              <form className="ci" onSubmit={sendMessage}>
                <div className="ci-container">
                  <div className="ci-inner">
                    <div className="ci-aura-badge" title="User Initial">
                      {userInitial}
                    </div>
                    <input
                      ref={inputRef}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder={attachedImage ? `Add a caption or just send the image...` : `Tell ${meta.bot} what's on your mind...`}
                      className="ci-input"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage(e);
                        }
                      }}
                    />
                    {/* Attach image button */}
                    <motion.button
                      type="button"
                      className={`ci-attach ${attachedImage ? 'has-image' : ''}`}
                      onClick={() => imageInputRef.current?.click()}
                      title="Attach an image"
                      whileHover={{ scale: 1.08, translateY: -1 }}
                      whileTap={{ scale: 0.92 }}
                      style={{
                        background: `${meta.color}28`,
                        borderColor: `${meta.color}88`,
                        color: meta.color
                      }}
                    >
                      <Image size={22} strokeWidth={2} />
                    </motion.button>
                    <motion.button
                      type="submit"
                      disabled={(!text.trim() && !attachedImage) || typing}
                      className="ci-send"
                      style={{
                        background: (text.trim() || attachedImage) ? meta.color : "rgba(255,255,255,0.05)",
                        boxShadow: (text.trim() || attachedImage) ? `0 0 15px ${meta.color}44` : "none"
                      }}
                      whileHover={(text.trim() || attachedImage) ? { scale: 1.05 } : {}}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                      </svg>
                    </motion.button>
                  </div>
                  <p className="ci-hint">Press Enter to send · <Image size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> Attach images</p>
                </div>
              </form>
            </section>
          )}
        </main>
      </div >

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        /* Layout System */
        .chat-layout {
          display: flex; height: 100vh; width: 100vw; overflow: hidden;
          background: var(--cw-bg);
        }

        /* Sidebar - Vision Pro Cards */
        .chat-sidebar {
          width: 320px; flex-shrink: 0;
          background: var(--sidebar-bg, rgba(15, 23, 42, 0.45));
          backdrop-filter: blur(40px) saturate(150%);
          border-right: 1px solid var(--sidebar-border, rgba(255,255,255,0.07));
          display: flex; flex-direction: column; padding: 2rem 1.5rem;
          transition: background 0.3s ease, border-color 0.3s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .sidebar-logo {
          display: flex; align-items: center; gap: 0.75rem; 
          font-weight: 800; font-size: 1.25rem; color: var(--text-main);
          letter-spacing: -0.02em; margin-bottom: 3rem;
        }
        .sidebar-logo svg { color: var(--primary); }
        .sidebar-label {
          font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
          color: var(--text-sub); letter-spacing: 0.1em; margin-bottom: 1.5rem;
        }
        .journey-cards { display: flex; flex-direction: column; gap: 1rem; flex: 1; }
        .journey-card {
          display: flex; align-items: center; gap: 1.25rem; padding: 1.25rem;
          border-radius: 20px;
          background: var(--sidebar-card-bg, rgba(255,255,255,0.04));
          border: 1px solid var(--sidebar-card-border, rgba(255,255,255,0.07));
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: left; position: relative; overflow: hidden;
        }
        .journey-card::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, transparent, rgba(var(--accent-rgb), 0.1));
          opacity: 0; transition: opacity 0.3s;
        }
        .journey-card:hover {
          background: var(--sidebar-card-hover-bg, rgba(255,255,255,0.09));
          transform: translateX(8px);
          border-color: var(--sidebar-card-hover-border, rgba(255,255,255,0.16));
        }
        .journey-card.active {
          background: var(--sidebar-card-hover-bg, rgba(255,255,255,0.1));
          border-color: var(--accent);
          box-shadow: 0 12px 30px -10px rgba(0,0,0,0.15);
        }
        .journey-card.active .j-visual { transform: scale(1.1); filter: drop-shadow(0 0 8px var(--accent)); }
        
        .j-visual { font-size: 1.5rem; transition: transform 0.3s; }
        .j-content { display: flex; flex-direction: column; gap: 0.1rem; }
        .j-name { font-weight: 700; font-size: 1rem; color: var(--text-main); }
        .j-subtitle { font-size: 0.75rem; color: var(--text-sub); }

        .chat-viewport { flex: 1; display: flex; flex-direction: column; position: relative; overflow: hidden; }

        .sidebar-footer { margin-top: auto; padding-top: 2rem; }
        .footer-btn {
          width: 100%; padding: 1rem; border-radius: 12px;
          background: var(--sidebar-footer-bg, rgba(255,255,255,0.05));
          border: 1px solid var(--sidebar-footer-border, rgba(255,255,255,0.1));
          color: var(--text-main); font-weight: 600; cursor: pointer;
          transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
        }
        .footer-btn:hover { background: rgba(239,68,68,0.12); color: #ef4444; border-color: rgba(239,68,68,0.25); }

        /* Modified Existing Styles */
        .ch { padding: 1rem 2rem; position: relative; border-bottom: 1px solid rgba(255,255,255,0.08); background: transparent; z-index: 2; }
        .cb { flex: 1; overflow-y: auto; padding: 2.5rem; display: flex; flex-direction: column; gap: 2rem; position: relative; z-index: 2; }
        .ci-wrapper { padding: 1.5rem 2rem 2rem; background: transparent; position: relative; z-index: 2; }
        .ci { background: rgba(255,255,255,0.04); border-radius: 24px; padding: 0.4rem; border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(12px); }
        
        .ch-title { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.1rem; color: var(--text-main); }

        /* ── Animated Background Canvas ── */
        .chat-bg-canvas {
          position: absolute; inset: 0; overflow: hidden;
          pointer-events: none; z-index: 0;
        }

        /* Gradient Orbs */
        .bg-orb {
          position: absolute; border-radius: 50%;
          filter: blur(70px);
          opacity: 0; 
          transition: background 2s ease;
        }
        .theme-dark .bg-orb, .cw:not(.theme-light) .bg-orb { opacity: 0.18; }
        .theme-light .bg-orb { opacity: 0.12; filter: blur(80px); }

        .orb-1 {
          width: 500px; height: 500px;
          background: var(--orb-color, #6366f1);
          top: -150px; left: -100px;
          animation: orb-float-1 12s ease-in-out infinite;
        }
        .orb-2 {
          width: 400px; height: 400px;
          background: var(--vibe-bg, #8b5cf6);
          bottom: -100px; right: -80px;
          animation: orb-float-2 15s ease-in-out infinite;
        }
        .orb-3 {
          width: 300px; height: 300px;
          background: var(--orb-color, #6366f1);
          top: 40%; left: 30%;
          animation: orb-float-3 10s ease-in-out infinite;
          opacity: 0.08 !important;
        }
        .orb-4 {
          width: 250px; height: 250px;
          background: var(--vibe-bg, #a855f7);
          top: 20%; right: 10%;
          animation: orb-float-4 13s ease-in-out infinite;
          opacity: 0.1 !important;
        }

        @keyframes orb-float-1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(60px, 80px) scale(1.15); }
          66%       { transform: translate(-40px, 40px) scale(0.9); }
        }
        @keyframes orb-float-2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(-80px, -60px) scale(1.2); }
        }
        @keyframes orb-float-3 {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.08; }
          50%       { transform: translate(50px, -50px) scale(1.3); opacity: 0.14; }
        }
        @keyframes orb-float-4 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33%       { transform: translate(-30px, 40px) rotate(90deg); }
          66%       { transform: translate(50px, -20px) rotate(180deg); }
        }

        /* Mesh grid overlay */
        .bg-mesh {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 48px 48px;
          animation: mesh-drift 20s linear infinite;
        }
        .theme-light .bg-mesh {
          background-image:
            linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px);
        }
        @keyframes mesh-drift {
          0%   { background-position: 0 0; }
          100% { background-position: 48px 48px; }
        }

        /* Floating particles */
        .bg-particle {
          position: absolute;
          border-radius: 50%;
          background: var(--orb-color, #6366f1);
          opacity: 0;
          animation: particle-rise linear infinite;
        }
        .theme-dark .bg-particle, .cw:not(.theme-light) .bg-particle { opacity: 0; }
        .theme-light .bg-particle { background: var(--orb-color, #6366f1); }
        @keyframes particle-rise {
          0%   { transform: translateY(0) scale(0); opacity: 0; }
          15%  { opacity: 0.5; transform: translateY(-20px) scale(1); }
          85%  { opacity: 0.3; }
          100% { transform: translateY(-180px) scale(0.3); opacity: 0; }
        }

        @media (max-width: 900px) {
          .chat-sidebar { display: none; }
        }

        /* Simplified Minimalist */

        .theme-light {
          --cw-bg: #f8fafc;
          --ch-bg: #ffffff;
          --text-main: #0f172a;
          --text-sub: #64748b;
          --border-color: #e2e8f0;
          --btn-bg: #f1f5f9;
          --input-bg: #ffffff;
          --bubble-bot: #f1f5f9;
          --card-bg: #ffffff;
          --chip-bg: #ffffff;
          --chip-text: #64748b;
          --nav-gradient: none;
          /* Sidebar theme vars */
          --sidebar-bg: #ffffff;
          --sidebar-border: #e2e8f0;
          --sidebar-card-bg: #f8fafc;
          --sidebar-card-border: #e2e8f0;
          --sidebar-card-hover-bg: #f1f5f9;
          --sidebar-card-hover-border: #cbd5e1;
          --sidebar-footer-bg: #f1f5f9;
          --sidebar-footer-border: #e2e8f0;
        }

        /* Dark mode sidebar vars (defaults) */
        .theme-dark, .cw:not(.theme-light) {
          --sidebar-bg: rgba(15, 23, 42, 0.45);
          --sidebar-border: rgba(255,255,255,0.07);
          --sidebar-card-bg: rgba(255,255,255,0.04);
          --sidebar-card-border: rgba(255,255,255,0.07);
          --sidebar-card-hover-bg: rgba(255,255,255,0.09);
          --sidebar-card-hover-border: rgba(255,255,255,0.16);
          --sidebar-footer-bg: rgba(255,255,255,0.05);
          --sidebar-footer-border: rgba(255,255,255,0.1);
        }

        /* Base Desktop Visibility */
        .mobile-nav, .mobile-menu-overlay, .mobile-menu-content { display: none; }
        .d-none-mobile { display: flex !important; }

        .cw {
          font-family: 'Inter', sans-serif;
          width: 100vw; height: 100vh;
          display: flex; flex-direction: column;
          background: var(--cw-bg);
          color: var(--text-main);
          position: relative; overflow: hidden;
          transition: background 0.3s ease;
        }
        .vibe-glow, .cw::after, .aura-spark { display: none; }

        /* Header */
        .ch {
          display: flex; align-items: center; justify-content: space-between;
          padding: 0.6rem 1.25rem;
          background: rgba(var(--bg-main-rgb), 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border-color);
          z-index: 10; flex-shrink: 0;
          position: sticky; top: 0;
        }
        .ch-left { display: flex; align-items: center; gap: 0.75rem; }
        .bot-avatar {
          width: 32px; height: 32px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; background: var(--primary) !important;
          transition: transform 0.2s;
        }
        .bot-avatar:hover { transform: scale(1.05); }
        .ch-title { font-size: 1rem; font-weight: 600; margin: 0; display: flex; align-items: center; }
        .ch-sub { font-size: 0.75rem; color: var(--text-sub); margin: 0; display: flex; align-items: center; gap: 0.25rem; }
        .online-dot {
          width: 6px; height: 6px; background: #10b981;
          border-radius: 50%; display: inline-block;
        }

        .ch-controls { display: flex; align-items: center; gap: 0.5rem; }
        .pref-picker { display: flex; gap: 0.25rem; }
        .pref-btn {
          padding: 0.25rem 0.5rem; border-radius: 6px; cursor: pointer;
          border: 1px solid transparent; background: transparent;
          color: var(--text-sub); font-size: 0.75rem;
          transition: all 0.2s;
        }
        .pref-btn:hover { background: var(--btn-bg); color: var(--text-main); }
        .pref-btn.active { color: var(--primary); font-weight: 600; }

        .hdr-btn {
          width: 44px; height: 44px; border-radius: 12px; cursor: pointer;
          border: 1.5px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.08);
          color: #e2e8f0;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
          stroke-width: 1.75;
        }
        .hdr-btn:hover {
          color: #ffffff;
          background: rgba(255,255,255,0.18);
          border-color: rgba(255,255,255,0.25);
          transform: translateY(-1px);
        }
        .hdr-btn svg {
          stroke: currentColor !important;
          fill: none !important;
          width: 22px !important;
          height: 22px !important;
          display: block;
          flex-shrink: 0;
        }
        .theme-light .hdr-btn {
          color: #334155;
          background: rgba(0,0,0,0.05);
          border-color: rgba(0,0,0,0.1);
        }
        .theme-light .hdr-btn:hover {
          color: #0f172a;
          background: rgba(0,0,0,0.1);
          border-color: rgba(0,0,0,0.2);
        }

        /* Chat Body */
        .cb {
          flex: 1; overflow-y: auto; padding: 2rem 1.5rem;
          display: flex; flex-direction: column; gap: 1.5rem;
        }

        /* Welcome Screen */
        .welcome { margin: auto; text-align: center; max-width: 400px; }
        .welcome-emoji { font-size: 3rem; margin-bottom: 0.5rem; }
        .welcome-sub { color: var(--text-sub); font-size: 0.875rem; margin-bottom: 1.5rem; }
        .chip {
          padding: 0.4rem 1rem; border-radius: 99px; cursor: pointer;
          border: 1px solid var(--border-color);
          background: var(--card-bg);
          color: var(--text-sub); font-size: 0.8rem;
          transition: 0.2s ease;
        }
        .chip:hover { border-color: var(--primary); color: var(--primary); }

        /* Messages */
        .msg-row { display: flex; gap: 0.75rem; max-width: 80%; position: relative; }
        .msg-row.user { align-self: flex-end; flex-direction: row-reverse; }
        .msg-avatar { display: none; } /* More minimalist without repeated avatars */

        .bubble {
          padding: 0.6rem 1rem; border-radius: 12px;
          font-size: 0.93rem; line-height: 1.5;
        }
        .bubble.user { background: var(--primary); color: white; }
        .bubble.bot { background: var(--bubble-bot); color: var(--text-main); }
        .msg-time { font-size: 0.7rem; color: var(--text-sub); margin-top: 0.25rem; opacity: 0.7; }

        /* Unsend button */
        .unsend-btn {
          display: flex; align-items: center; gap: 0.3rem;
          padding: 0.3rem 0.6rem; border-radius: 8px;
          border: 1px solid rgba(239,68,68,0.25);
          background: rgba(239,68,68,0.08);
          color: #f87171; font-size: 0.72rem; font-weight: 600;
          cursor: pointer; white-space: nowrap;
          opacity: 0; transform: translateX(6px);
          transition: opacity 0.18s ease, transform 0.18s ease, background 0.15s;
          align-self: center; flex-shrink: 0;
          width: auto;
        }
        .msg-row:hover .unsend-btn {
          opacity: 1; transform: translateX(0);
        }
        .unsend-btn:hover {
          background: rgba(239,68,68,0.18);
          border-color: rgba(239,68,68,0.5);
          transform: translateX(-2px) !important;
        }
        .theme-light .unsend-btn {
          background: rgba(239,68,68,0.06);
          border-color: rgba(239,68,68,0.2);
        }

        /* Input */
        .ci-wrapper { padding: 1.5rem 2rem 2rem; background: transparent; }
        .ci { 
          background: rgba(255, 255, 255, 0.04); 
          border-radius: 24px; 
          padding: 0.4rem; 
          border: 1px solid rgba(255, 255, 255, 0.08); 
          max-width: 800px;
          margin: 0 auto;
        }

        .ci-inner {
          display: flex; gap: 0.8rem; align-items: center;
          background: var(--input-bg);
          backdrop-filter: blur(16px);
          border: 1px solid var(--border-color);
          border-radius: 99px; padding: 0.5rem 0.6rem 0.5rem 1.25rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
        }

        .ci-inner:focus-within { 
          border-color: var(--meta-color, #6366f1); 
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1), 0 20px 40px -15px rgba(0,0,0,0.4);
          transform: translateY(-2px);
        }

        .ci-aura-badge {
          width: 32px; height: 32px; border-radius: 50%;
          background: rgba(var(--primary-rgb), 0.1);
          display: flex; align-items: center; justify-content: center;
          font-size: 1rem; border: 1px solid rgba(var(--primary-rgb), 0.2);
          flex-shrink: 0; color: var(--primary);
        }

        .ci-input {
          flex: 1; background: transparent; border: none;
          color: var(--text-main); font-size: 1rem; font-family: inherit;
          padding: 0.6rem 0.4rem; outline: none;
          letter-spacing: -0.01em;
        }
        .ci-input::placeholder { color: var(--text-sub); opacity: 0.5; }

        .ci-send {
          width: 42px; height: 42px; border-radius: 50%;
          border: none; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }
        .ci-send:disabled { cursor: not-allowed; opacity: 0.3; }

        .ci-attach {
          width: 44px; height: 44px; border-radius: 12px;
          border: 1.5px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.08);
          color: #e2e8f0;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.25s ease;
          flex-shrink: 0;
        }
        .ci-attach svg {
          width: 22px !important;
          height: 22px !important;
          stroke: currentColor !important;
          fill: none !important;
          display: block;
          flex-shrink: 0;
        }
        .ci-attach:hover {
          background: rgba(255,255,255,0.15);
          border-color: rgba(255,255,255,0.35);
          box-shadow: 0 4px 14px rgba(0,0,0,0.2);
          transform: translateY(-1px);
        }
        .ci-attach.has-image {
          color: #10b981;
          border-color: rgba(16,185,129,0.7);
          background: rgba(16,185,129,0.15);
          box-shadow: 0 0 12px rgba(16,185,129,0.3);
        }
        .spin-icon { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Image preview strip above input */
        .img-preview-strip {
          max-width: 800px; margin: 0 auto 0.75rem;
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.6rem 1rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px;
        }
        .img-preview-thumb-wrap {
          position: relative; flex-shrink: 0;
        }
        .img-preview-thumb {
          width: 52px; height: 52px; object-fit: cover;
          border-radius: 10px; display: block;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .img-preview-remove {
          position: absolute; top: -6px; right: -6px;
          width: 18px; height: 18px; border-radius: 50%;
          background: #ef4444; border: none; color: white;
          font-size: 0.55rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          line-height: 1;
        }
        .img-preview-name {
          font-size: 0.78rem; color: var(--text-sub);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          flex: 1;
        }

        /* Inline image in chat bubbles */
        .msg-image-wrap {
          margin-bottom: 0.5rem;
          border-radius: 10px; overflow: hidden;
          max-width: 220px;
        }
        .msg-image {
          width: 100%; height: auto; display: block;
          border-radius: 10px;
        }

        .ci-hint {
          text-align: center; margin-top: 0.75rem;
          font-size: 0.7rem; color: var(--text-sub); font-weight: 500;
          letter-spacing: 0.05em; text-transform: uppercase;
          opacity: 0.6;
        }

        /* 📱 Mobile Responsiveness */
        @media (max-width: 768px) {
          .ch { 
            padding: 1rem; 
            background: rgba(10,15,30,0.6);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255,255,255,0.05);
          }
          .d-none-mobile { display: none !important; }
          .ch-title { font-size: 1rem; }
          .ch-sub { font-size: 0.7rem; }
          .bot-avatar { width: 40px; height: 40px; }
          
          .pref-picker { 
            position: fixed; top: 76px; left: 1rem; right: 1rem;
            z-index: 50; padding: 0.5rem;
            background: rgba(30,41,59,0.5); backdrop-filter: blur(15px);
            border-radius: 99px; border: 1px solid rgba(255,255,255,0.05);
            justify-content: space-between;
          }
          .pref-btn { flex: 1; justify-content: center; border: none !important; padding: 0.5rem; }
          .pref-btn.active { background: rgba(255,255,255,0.1) !important; }

          .cb { padding: 5rem 1rem 8rem; } /* Added top padding for pref picker and bottom for nav */
          
          .mobile-nav {
            display: flex; position: fixed; bottom: 1.5rem; left: 1rem; right: 1rem;
            height: 70px; background: rgba(30,41,59,0.7);
            backdrop-filter: blur(20px); border-radius: 24px;
            border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
            z-index: 150; align-items: center; justify-content: space-around;
            padding: 0 0.5rem;
          }
          .nav-item {
            display: flex; flex-direction: column; align-items: center; gap: 4px;
            background: none; border: none; color: #94a3b8; padding: 0.5rem;
            flex: 1; transition: all 0.2s;
          }
          .nav-item.active { color: white; }
          .nav-icon { font-size: 1.25rem; }
          .nav-text { font-size: 0.65rem; font-weight: 500; }
          .nav-item.main {
            position: relative; top: -20px;
          }
          .main-nav-inner {
            width: 60px; height: 60px; border-radius: 50%;
            background: linear-gradient(135deg, #6366f1, #a855f7);
            display: flex; align-items: center; justify-content: center;
            font-size: 1.75rem; color: white;
            box-shadow: 0 10px 25px rgba(99,102,241,0.5);
            border: 4px solid #0a0f1e;
          }
          
          .mobile-menu-overlay {
            position: fixed; inset: 0; z-index: 200;
            background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
          }
          .mobile-menu-content {
            position: absolute; bottom: 0; left: 0; right: 0;
            background: var(--card-bg); border-radius: 32px 32px 0 0;
            padding: 1.5rem 1.5rem 3rem; border-top: 1px solid var(--border-color);
          }
          .menu-handle {
            width: 40px; height: 4px; background: rgba(255,255,255,0.2);
            border-radius: 2px; margin: 0 auto 1.5rem;
          }
          .menu-header { margin-bottom: 2rem; }
          .menu-header h3 { font-size: 1.25rem; color: var(--text-main); margin: 0 0 0.25rem; }
          .menu-header p { font-size: 0.85rem; color: var(--text-sub); margin: 0; }
          .menu-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
          .menu-item {
            display: flex; align-items: center; gap: 1rem;
            background: var(--btn-bg); border: 1px solid var(--border-color);
            border-radius: 16px; padding: 1rem; text-align: left;
            width: 100%; color: var(--text-main);
          }
          .menu-icon { font-size: 1.5rem; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); border-radius: 12px; }
          .menu-info { display: flex; flex-direction: column; }
          .menu-label { font-size: 0.95rem; font-weight: 600; }
          .menu-desc { font-size: 0.75rem; color: #64748b; }
          .menu-item.delete .menu-icon { color: #ef4444; }
          .menu-item.logout .menu-icon { color: #94a3b8; }

          .ci { padding: 1rem 1rem 7rem; } /* Extra bottom padding for mobile browsers and nav */
          .ci-inner { border-radius: 20px; }
          .ci-aura-badge { width: 28px; height: 28px; font-size: 0.9rem; }
        }

        @media (max-width: 480px) {
          .pref-label { display: none !important; }
          .assessment-grid { grid-template-columns: 1fr; }
          .ch-controls { gap: 0.35rem; }
          .ch-left { gap: 0.5rem; }
        }
        /* Magic Jar Styles */
        .magic-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; padding: 2rem;
        }
        .magic-card {
          width: 100%; max-width: 360px;
          background: linear-gradient(165deg, #1e1b4b, #0f172a);
          border: 1px solid rgba(139,92,246,0.3);
          border-radius: 2rem; padding: 2px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5), 0 0 20px rgba(99,102,241,0.2);
        }
        .magic-card-inner {
          background: #0f172a; border-radius: calc(2rem - 2px);
          padding: 2.5rem 2rem; text-align: center;
        }
        .magic-sparkles { font-size: 2.5rem; margin-bottom: 1rem; animation: float 3s infinite ease-in-out; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        .magic-card-title {
          font-size: 1.5rem; font-weight: 800; margin: 0;
          background: linear-gradient(135deg, #fff, #94a3b8);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .magic-divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent); margin: 1.5rem 0; }
        .magic-label { font-size: 0.65rem; color: #6366f1; font-weight: 700; letter-spacing: 0.2em; margin-bottom: 0.75rem; }
        .magic-task-text { font-size: 1.1rem; color: #e2e8f0; line-height: 1.6; font-weight: 500; min-height: 80px; display: flex; align-items: center; justify-content: center; }
        .magic-jar-icon { font-size: 5rem; line-height: 1; }
        .magic-glitter { font-size: 1.5rem; margin-top: -10px; animation: pulse 1s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        /* Game Styles */
        .magic-game-view { position: relative; height: 300px; display: flex; flex-direction: column; align-items: center; }
        .game-status { display: flex; justify-content: space-between; width: 100%; color: #94a3b8; font-weight: 700; font-family: monospace; font-size: 1.2rem; }
        .particles-arena { flex: 1; width: 100%; position: relative; overflow: hidden; }
        .game-particle {
          position: absolute; background: transparent; border: none; font-size: 2rem;
          cursor: pointer; user-select: none; padding: 0.5rem; filter: drop-shadow(0 0 10px rgba(255,255,255,0.3));
        }
        .magic-close-btn {
          width: 100%; padding: 1rem; border-radius: 1rem; border: none;
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: white; font-weight: 700; cursor: pointer;
          transition: transform 0.2s;
        }
        .magic-close-btn:hover { transform: scale(1.02); }
        .magic-btn:hover { color: #facc15 !important; border-color: rgba(250,204,21,0.4) !important; background: rgba(250,204,21,0.1) !important; }
        /* Soul Lens Styles */
        .lens-overlay {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(0,0,0,0.8); backdrop-filter: blur(15px);
          display: flex; align-items: center; justify-content: center; padding: 1.5rem;
        }
        .lens-card {
          width: 100%; max-width: 400px; background: var(--card-bg);
          border-radius: 2rem; border: 1px solid var(--border-color);
          overflow: hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.5);
        }
        .lens-header {
          padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between;
          border-bottom: 1px solid var(--border-color);
        }
        .lens-header h3 { margin: 0; font-size: 1.1rem; color: var(--text-main); font-weight: 700; letter-spacing: 0.05em; }
        .lens-header button { background: none; border: none; color: var(--text-sub); cursor: pointer; font-size: 1.1rem; transition: color 0.2s; }
        .lens-header button:hover { color: var(--text-main); }
        
        .lens-preview-container { position: relative; width: 100%; aspect-ratio: 4/3; background: #000; overflow: hidden; }
        .lens-preview { width: 100%; height: 100%; object-fit: cover; }
        .lens-shimmer-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.2) 50%, transparent 100%);
          height: 10px; width: 100%;
          animation: lens-sweep 3s infinite linear;
          box-shadow: 0 0 20px rgba(99,102,241,0.5);
        }
        @keyframes lens-sweep { 0% { top: -10%; } 100% { top: 110%; } }
        
        .lens-analysis { padding: 2rem; text-align: center; background: linear-gradient(180deg, rgba(99,102,241,0.05) 0%, transparent 100%); }
        .lens-loading { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
        .lens-spinner {
          width: 30px; height: 30px; border: 2px solid rgba(255,255,255,0.1);
          border-top-color: #6366f1; border-radius: 50%;
          animation: spin 0.8s infinite linear;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .lens-loading p { font-size: 0.85rem; color: #94a3b8; margin: 0; }
        
        .lens-result { animation: fadeUp 0.5s ease-out; }
        .lens-text { font-size: 1.15rem; color: #e2e8f0; line-height: 1.6; font-style: italic; margin-bottom: 1.5rem; }
        .lens-tags { display: flex; justify-content: center; gap: 0.75rem; }
        .lens-tag { 
          font-size: 0.65rem; padding: 0.35rem 0.75rem; border-radius: 99px;
          background: rgba(99,102,241,0.1); color: #818cf8; border: 1px solid rgba(99,102,241,0.2);
        }
        
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .lens-btn:hover { color: #818cf8 !important; border-color: rgba(129,140,248,0.4) !important; background: rgba(129,140,248,0.1) !important; }

        .no-entries { text-align: center; color: #64748b; margin-top: 4rem; font-style: italic; }

        /* Journal Styles */
        .journal-overlay { position: fixed; inset: 0; z-index: 150; background: rgba(0,0,0,0.5); backdrop-filter: blur(8px); display: flex; justify-content: flex-end; }
        .journal-panel { 
          width: 100%; max-width: 500px; height: 100%; 
          background: #0f172a; border-left: 1px solid rgba(255,255,255,0.1);
          padding: 2rem; display: flex; flex-direction: column; gap: 1.5rem;
          box-shadow: -20px 0 50px rgba(0,0,0,0.5);
        }
        .journal-header { display: flex; align-items: center; justify-content: space-between; }
        .journal-header h3 { margin: 0; font-size: 1.25rem; color: #f8fafc; }
        .journal-header button { background: none; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer; }
        .journal-list { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; padding-right: 0.5rem; }
        .journal-list::-webkit-scrollbar { width: 4px; }
        .journal-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        
        .journal-entry { 
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); 
          border-radius: 16px; padding: 1.25rem; transition: all 0.3s;
        }
        .journal-entry:hover { transform: translateY(-2px); border-color: rgba(255,255,255,0.2); }
        .entry-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
        .entry-date { font-size: 0.75rem; color: #64748b; font-weight: 600; }
        .entry-emotion { font-size: 0.65rem; padding: 0.2rem 0.6rem; border-radius: 99px; font-weight: 700; text-transform: uppercase; }
        .entry-text { font-size: 0.95rem; line-height: 1.5; color: #e2e8f0; margin-bottom: 1rem; }
        .entry-reply { 
          background: rgba(255,255,255,0.05); border-radius: 12px; padding: 0.75rem 1rem;
          border-left: 3px solid #6366f1;
        }
        .reply-label { display: block; font-size: 0.65rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 0.25rem; }
        .entry-reply p { margin: 0; font-size: 0.85rem; line-height: 1.5; color: #94a3b8; font-style: italic; }

        /* Zen Pulse Styles */
        .zen-pulse-container {
          position: fixed; inset: 0; z-index: -1;
          display: flex; align-items: center; justify-content: center;
          pointer-events: none; overflow: hidden;
        }
        .zen-pulse {
          width: 80vh; height: 80vh; border-radius: 50%;
          filter: blur(80px); opacity: 0.12;
          animation: breath-pulse 8s infinite ease-in-out;
          transition: background-color 2s ease;
        }
        @keyframes breath-pulse {
          0%, 100% { transform: scale(0.8); opacity: 0.05; }
          50% { transform: scale(1.2); opacity: 0.18; }
        }
        .pulse-btn.active { color: #5eead4 !important; border-color: rgba(94,234,212,0.4) !important; background: rgba(94,234,212,0.1) !important; }

        /* ── Zodiac Sign Picker ── */
        .sign-picker-card {
          max-width: 680px; margin: 0 auto 1.5rem;
          background: rgba(99,102,241,0.08);
          border: 1px solid rgba(99,102,241,0.25);
          border-radius: 24px; padding: 1.75rem;
          backdrop-filter: blur(16px);
        }
        .theme-light .sign-picker-card {
          background: rgba(99,102,241,0.06);
          border-color: rgba(99,102,241,0.2);
        }
        .sign-picker-header {
          display: flex; align-items: center; gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .sign-picker-icon { font-size: 2rem; }
        .sign-picker-title {
          font-weight: 700; font-size: 1.05rem;
          color: var(--text-main); margin: 0;
        }
        .sign-picker-sub {
          font-size: 0.75rem; color: var(--text-sub);
          margin: 0.15rem 0 0; letter-spacing: 0.05em;
        }
        .sign-picker-rows { display: flex; flex-direction: column; gap: 1.25rem; }
        .sign-picker-row {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px; padding: 1rem 1.25rem;
        }
        .theme-light .sign-picker-row {
          background: rgba(0,0,0,0.03);
          border-color: rgba(0,0,0,0.08);
        }
        .sign-picker-row-label {
          display: flex; align-items: center; gap: 0.75rem;
          margin-bottom: 0.9rem; font-size: 1.1rem;
        }
        .sprl-name {
          font-weight: 600; font-size: 0.9rem;
          color: var(--text-main); margin: 0;
        }
        .sprl-desc {
          font-size: 0.72rem; color: var(--text-sub);
          margin: 0.1rem 0 0;
        }
        .sign-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 0.4rem;
        }
        @media (max-width: 600px) {
          .sign-grid { grid-template-columns: repeat(4, 1fr); }
        }
        .sign-btn {
          display: flex; flex-direction: column; align-items: center;
          padding: 0.4rem 0.2rem; border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          cursor: pointer; transition: all 0.18s ease;
          color: var(--text-sub);
          width: 100%; gap: 0.1rem;
        }
        .theme-light .sign-btn {
          background: rgba(0,0,0,0.03);
          border-color: rgba(0,0,0,0.08);
        }
        .sign-btn:hover {
          background: rgba(99,102,241,0.15);
          border-color: rgba(99,102,241,0.35);
          color: var(--text-main);
          transform: translateY(-1px);
        }
        .sign-btn.active {
          background: rgba(99,102,241,0.25) !important;
          border-color: #6366f1 !important;
          color: #a5b4fc !important;
          box-shadow: 0 0 12px rgba(99,102,241,0.3);
        }
        .sign-btn-glyph { font-size: 1.05rem; line-height: 1; }
        .sign-btn-label {
          font-size: 0.58rem; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.03em;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          max-width: 100%;
        }
        .sign-picker-submit {
          width: 100%; margin-top: 1.5rem;
          padding: 0.85rem; border-radius: 14px;
          border: none; color: #fff; font-weight: 700;
          font-size: 0.95rem; cursor: pointer;
          transition: all 0.3s ease; letter-spacing: 0.01em;
        }
        .sign-picker-submit:not(:disabled):hover {
          filter: brightness(1.15);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(99,102,241,0.4);
        }
        .sign-picker-submit:disabled {
          cursor: not-allowed; color: var(--text-sub);
        }

        /* ── Sidebar Logo as Button ── */
        button.sidebar-logo {
          background: none; border: none; cursor: pointer;
          display: flex; align-items: center; gap: 0.6rem;
          color: inherit; font: inherit; padding: 0.5rem 0.75rem;
          border-radius: 10px; width: 100%; text-align: left;
          transition: background 0.18s, transform 0.15s;
        }
        button.sidebar-logo:hover {
          background: rgba(255,255,255,0.07);
          transform: scale(1.02);
        }
        .theme-light button.sidebar-logo:hover {
          background: rgba(0,0,0,0.05);
        }

        /* ── Profile Panel ── */
        .profile-backdrop {
          position: fixed; inset: 0; z-index: 200;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(4px);
        }
        .profile-panel {
          position: fixed; top: 0; left: 0; bottom: 0;
          width: 300px; z-index: 201;
          background: var(--sidebar-bg, rgba(15,23,42,0.97));
          border-right: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(24px);
          padding: 2rem 1.5rem 1.5rem;
          display: flex; flex-direction: column;
          align-items: center; gap: 0;
          overflow-y: auto;
        }
        .theme-light .profile-panel {
          background: rgba(255,255,255,0.97);
          border-right-color: rgba(0,0,0,0.1);
        }
        .profile-close {
          position: absolute; top: 1rem; right: 1rem;
          background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
          color: var(--text-sub); border-radius: 8px;
          width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: background 0.15s;
        }
        .profile-close:hover { background: rgba(255,255,255,0.12); color: var(--text-main); }
        .theme-light .profile-close { background: rgba(0,0,0,0.05); border-color: rgba(0,0,0,0.1); }

        .profile-avatar-wrap {
          position: relative; margin: 1.5rem 0 1rem;
          width: 88px; height: 88px;
        }
        .profile-avatar {
          width: 88px; height: 88px; border-radius: 28px;
          display: flex; align-items: center; justify-content: center;
          font-size: 2rem; font-weight: 800; color: #fff;
          letter-spacing: -0.02em;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        .profile-avatar-ring {
          position: absolute; inset: -5px;
          border-radius: 33px; border: 2px solid;
          opacity: 0.5;
          animation: ring-pulse 2.5s ease-in-out infinite;
        }
        @keyframes ring-pulse {
          0%,100% { transform: scale(1); opacity: 0.4; }
          50%      { transform: scale(1.06); opacity: 0.7; }
        }

        .profile-name {
          font-size: 1.25rem; font-weight: 800;
          color: var(--text-main); margin: 0 0 0.25rem;
          text-align: center; text-transform: capitalize;
        }
        .profile-email {
          font-size: 0.82rem; color: var(--text-sub);
          margin: 0; text-align: center;
        }
        .profile-email-at { color: var(--text-sub); margin: 0 0.05rem; opacity: 0.6; }

        .profile-divider {
          width: 100%; height: 1px;
          background: rgba(255,255,255,0.08);
          margin: 1.25rem 0;
        }
        .theme-light .profile-divider { background: rgba(0,0,0,0.08); }

        .profile-stats {
          display: flex; align-items: center; gap: 0;
          width: 100%; justify-content: center;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 16px; padding: 1rem;
        }
        .theme-light .profile-stats {
          background: rgba(0,0,0,0.03);
          border-color: rgba(0,0,0,0.08);
        }
        .profile-stat {
          display: flex; flex-direction: column; align-items: center;
          flex: 1; gap: 0.25rem;
        }
        .pstat-value {
          font-size: 1.2rem; font-weight: 800; color: var(--text-main);
        }
        .pstat-label {
          font-size: 0.65rem; font-weight: 600; color: var(--text-sub);
          text-transform: uppercase; letter-spacing: 0.06em;
        }
        .profile-stat-sep {
          width: 1px; height: 36px;
          background: rgba(255,255,255,0.1);
          flex-shrink: 0;
        }
        .theme-light .profile-stat-sep { background: rgba(0,0,0,0.1); }

        .profile-details {
          width: 100%; display: flex; flex-direction: column; gap: 0.75rem;
        }
        .profile-detail-row {
          display: flex; flex-direction: column; gap: 0.2rem;
          padding: 0.75rem 1rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
        }
        .theme-light .profile-detail-row {
          background: rgba(0,0,0,0.03);
          border-color: rgba(0,0,0,0.07);
        }
        .pdr-label {
          font-size: 0.65rem; font-weight: 700;
          color: var(--text-sub); text-transform: uppercase; letter-spacing: 0.06em;
        }
        .pdr-value {
          font-size: 0.88rem; font-weight: 600;
          color: var(--text-main); word-break: break-all;
        }
      `}</style>


    </div >
  );
}