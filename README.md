# 🌌 Mind Magic: Your Celestial AI Companion

Mind Magic is a premium, AI-powered emotional and lifestyle guidance platform. It provides personalized, multi-persona support ranging from therapeutic medical advice to cosmic astrological readings, all wrapped in a stunning, interactive glassmorphic interface.

## 👥 Team Members
* [Your Name/Team Name Here]

## 🧠 Problem Statement
Modern digital communication often lacks emotional depth and personalized context. Traditional chatbots are often rigid, impersonal, and unable to understand visual cues or specific personal backgrounds (like astrological signs or emotional states). This makes digital mental wellness and personal guidance feel "robotic" rather than supportive.

## 💡 Solution Approach
Mind Magic solves this by creating a **Multi-layered Persona System**:
1.  **Contextual Awareness**: The AI understands your current "vibe" and mood, adapting its language and the UI's color palette.
2.  **Multimodal Intelligence**: Equipped with "Soul Lens" (Vision AI), it doesn't just read text—it understands images you share, whether it's a fox in the wild or a photo of your dinner.
3.  **Specialized Guidance**: 5 distinct personas (Doctor, Mentor, Counsellor, Friend, Astrologer) each with specialized knowledge and tone.
4.  **Celestial Personalization**: A dedicated Astrology engine that gathers your Sun, Moon, and Rising signs through a visual picker to give authentic, persona-driven readings.

## 🛠️ Tech Stack
*   **Frontend**: React.js, Vite, Framer Motion (Animations), Lucide React (Icons).
*   **Styling**: Vanilla CSS with a custom Glassmorphic Design System.
*   **Backend**: Node.js, Express.js.
*   **Database**: MongoDB (Atlas).
*   **AI Engine**: Google Gemini API (Pro & Vision models).
*   **Authentication**: JWT-based secure sessions.

## ⚙️ Installation Steps

### 1. Clone the repository
```bash
git clone https://github.com/yadnesh-thorat/mindmagic_chatbot.git
cd mindmagic_chatbot
```

### 2. Setup Server
```bash
cd server
npm install
```
Create a `.env` file in the `server` folder with:
```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
GROQ_API_KEY=your_gemini_api_key
```

### 3. Setup Client
```bash
cd ../client
npm install
```
Create a `.env` file in the `client` folder with:
```env
VITE_API_URL=http://localhost:5000
```

## 🚀 How to Run

### Start the Backend
```bash
cd server
npm start
```

### Start the Frontend
```bash
cd client
npm run dev
```
Open `http://localhost:5173` in your browser.

## ✨ Features
*   **🔮 Shaunak the Astrologer**: Uses a visual 3-sign picker to build your cosmic profile.
*   **🖼️ Soul Lens Vision**: Upload images and get contextual responses based on what the AI "sees".
*   **🌈 Interactive UI**: Animated floating background orbs that change color based on your selected persona and mood.
*   **🗑️ Unsend Option**: Optimistic message deletion to keep your chat history clean.
*   **👤 Visual Profile**: View your stats, member since date, and message count in a slide-out panel.
*   **📔 AI Journaling**: Automatically summarizes your conversations into meaningful insights.

## 🔭 Future Scope
*   **🎙️ Voice Interaction**: Hands-free conversation for a more natural therapeutic experience.
*   **📈 Emotional Trending**: Visualizing mood patterns over weeks and months to identify mental health triggers.
*   **🤝 Collaborative Counseling**: Ability to anonymously share specific AI insights with real professionals.
*   **📱 Mobile App**: Dedicated iOS/Android versions for on-the-go celestial guidance.

---
*Created with ❤️ for the Hackathon.*
