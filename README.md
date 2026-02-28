# 🌌 Mind Magic: Your Celestial AI Companion  

Mind Magic is a premium, AI-powered emotional and lifestyle guidance platform.  
It delivers personalized, multi-persona support ranging from therapeutic medical-style guidance to cosmic astrological readings — all wrapped inside a stunning, interactive glassmorphic interface.

---

## 👥 Team Members  

**Team Name:** Tech Magic  

- Yadneshwar Thorat  
- Shaunak Mulay  
- Anant Sali  
- Om Raundal  

---

## 🧠 Problem Statement  

Modern digital communication often lacks emotional depth and personalized context.  

Traditional chatbots are:
- Rigid  
- Impersonal  
- Context-unaware  
- Unable to interpret visual cues  
- Incapable of adapting to personal backgrounds (e.g., mood states, astrology profiles)  

This makes digital mental wellness and lifestyle guidance feel robotic instead of supportive.

There is a need for an emotionally intelligent, context-aware, and visually adaptive AI companion.

---

## 💡 Solution Approach  

Mind Magic introduces a **Multi-layered Persona System** that blends emotional intelligence, visual understanding, and celestial personalization.

### 🌈 1. Contextual Awareness
- AI understands user mood & emotional vibe  
- Adapts tone dynamically  
- UI color palette shifts based on persona & emotional state  

### 🖼️ 2. Multimodal Intelligence – *Soul Lens*
- Powered by Vision AI  
- Understands images shared by users  
- Interprets objects, environments, and visual context  
- Responds intelligently to visual inputs  

### 🎭 3. Specialized Persona System
Five distinct personas with unique tone and expertise:

- 👨‍⚕️ **Doctor** – Structured, practical guidance  
- 🎓 **Mentor** – Growth-focused, motivational advice  
- 🧠 **Counsellor** – Deep, empathetic emotional support  
- 🤝 **Friend** – Casual, relatable companionship  
- 🔮 **Astrologer** – Cosmic insights using Sun, Moon & Rising signs  

### 🌌 4. Celestial Personalization
- Visual zodiac sign picker  
- Collects Sun, Moon, and Rising signs  
- Generates authentic, persona-driven astrological readings  

---

## 🛠️ Tech Stack  

### 🔹 Frontend
- React.js  
- Vite  
- Framer Motion (Animations)  
- Lucide React (Icons)  

### 🎨 Styling
- Vanilla CSS  
- Custom Glassmorphic Design System  

### 🔹 Backend
- Node.js  
- Express.js  

### 🗄 Database
- MongoDB Atlas  

### 🤖 AI Engine
- Google Gemini API (Pro Model)  
- Google Gemini Vision Model  

### 🔐 Authentication
- JWT-based secure sessions  

---

## ⚙️ Installation Steps  

### 1️⃣ Clone Repository

```bash
git clone https://github.com/yadnesh-thorat/mindmagic_chatbot.git
cd mindmagic_chatbot

🔧 Setup Server
cd server
npm install

Create a .env file inside the server/ folder:


PORT=5000

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_gemini_api_key
💻 Setup Client
cd ../client
npm install

Create a .env file inside the client/ folder:

VITE_API_URL=http://localhost:5000
🚀 How to Run
▶ Start Backend
cd server
npm start

Backend runs at:

http://localhost:5000
▶ Start Frontend
cd client
npm run dev

Open in browser:

http://localhost:5173
