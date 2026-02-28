export const MAGIC_TASKS = [
    "Crazy Quest: Dance like a chicken for 30 seconds. No one is watching! 🐔💃",
    "Soul Mirror: Stare at yourself in the mirror and say, 'I'm a magical genius' 5 times. 🪞🪄",
    "Gravity Defiance: Balance a spoon on your nose for as long as you can. 🥄👃",
    "Whimsical Whispers: Whisper a secret to a nearby plant. They are great listeners! 🌿🤫",
    "Cosmic High-Five: High-five the air to send positive vibes into the universe. ✋🌌",
    "Invisible Ink: Write your biggest dream on your palm with your finger. It's now part of you! ✍️",
    "Laughter Spark: Try to laugh out loud for no reason for exactly 15 seconds. It's contagious! 😂",
    "Time Traveler: Send a mental message to your 5-year-old self. What would you say? 👶🕰️",
    "Reverse Day: Eat your next meal starting with the dessert (if possible!). 🍮🍕",
    "Superhero Pose: Stand with hands on hips and chest out for 1 full minute. Feel the power! 🦸‍♂️✨",
    "Cloud Catcher: Look out the window and find 3 clouds that look like animals. ☁️🐾",
    "Gratitude Echo: Shout (or whisper) three things you're thankful for into a corner of the room. 🗣️💖"
];

export const RECOMMENDATIONS = {
    Wellness: [
        { title: "Deep Breathing 🧘", prompt: "Can you guide me through a simple deep breathing exercise?" },
        { title: "Sleep Habits 😴", prompt: "How can I improve my sleep tonight?" },
        { title: "Gratitude Journal ✍️", prompt: "Let's list three things I'm grateful for today." },
        { title: "Digital Detox 📱", prompt: "How can I reduce my screen time today?" },
    ],
    Motivation: [
        { title: "Goal Setting 🎯", prompt: "Help me set a small goal for tomorrow." },
        { title: "Overcoming Procrastination ⏱️", prompt: "I'm procrastinating on a task, can you help me start?" },
        { title: "Morning Routine 🌅", prompt: "Suggest a 5-minute morning routine to boost my energy." },
        { title: "Focus Sprits 🎯", prompt: "Explain the Pomodoro technique to me for better focus." },
    ],
    Philosophy: [
        { title: "Stoic Wisdom 🏛️", prompt: "What would a Stoic say about feeling overwhelmed?" },
        { title: "Living in the Now 🕰️", prompt: "How can I be more present in my daily life?" },
        { title: "Finding Purpose 🌀", prompt: "Let's talk about what makes a day feel meaningful." },
        { title: "Amor Fati 🦢", prompt: "Explain the concept of 'Amor Fati' and how it helps with acceptance." },
    ],
    Jokes: [
        { title: "Pun Party 🎈", prompt: "Give me your best (or worst) pun!" },
        { title: "Funny Observation 🧐", prompt: "Tell me something funny about everyday life." },
        { title: "Instant Cheer Up ✨", prompt: "Do something goofy to make me smile!" },
        { title: "Dad Jokes 🧔", prompt: "I need a classic dad joke right now." },
    ],
    Astrology: [
        { title: "Daily Horoscope 🌟", prompt: "Give me a cosmic forecast for my day based on my signs." },
        { title: "Love Compatibility 💞", prompt: "What do my signs say about my love life and compatibility?" },
        { title: "Career & Abundance 💫", prompt: "What planetary energy surrounds my career path right now?" },
        { title: "Shadow Work 🌑", prompt: "What does my rising sign reveal about my shadow self?" },
    ],
};

export const QUICK_PROMPTS = {
    Wellness: ["I'm feeling great! 😊", "Had a long day... 😴", "I just want to talk 💭", "Need some peace 🌊"],
    Motivation: ["Ready to crush it! 🔥", "Feeling a bit lazy 😴", "Need to focus 🎯", "What's my next move? 🚀"],
    Philosophy: ["Thinking about life 🌀", "Today feels a bit weird 🕰️", "Searching for peace 🌊", "Why is everything like this? 🌌"],
    Jokes: ["Tell me a joke! 😂", "Need a quick laugh 😅", "Make my day! ✨", "Surprise me with humor! 🎭"],
    Astrology: ["Read my stars ✨", "What's my week like? 🌙", "Love & relationships 💞", "Career forecast 🌟"],
};

export const PREFERENCE_META = {
    Wellness: { emoji: "🪷", color: "#10b981", label: "Doctor", bot: "Anya" },
    Motivation: { emoji: "🔥", color: "#f59e0b", label: "Mentor", bot: "Arjun" },
    Philosophy: { emoji: "🌀", color: "#8b5cf6", label: "Counsellor", bot: "Ishaan" },
    Jokes: { emoji: "😄", color: "#ec4899", label: "Friend", bot: "Kabir" },
    Astrology: { emoji: "🔮", color: "#6366f1", label: "Astrologer", bot: "Shaunak" },
};

export const EMOTION_VIBES = {
    Happy: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(250, 204, 21, 0.15) 0%, transparent 60%)",
    Sad: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(59, 130, 246, 0.15) 0%, transparent 60%)",
    Anxious: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(139, 92, 246, 0.15) 0%, transparent 60%)",
    Angry: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(239, 68, 68, 0.15) 0%, transparent 60%)",
    Neutral: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99, 102, 241, 0.15) 0%, transparent 60%)",
    Hopeful: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(16, 185, 129, 0.15) 0%, transparent 60%)",
    Frustrated: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(249, 115, 22, 0.15) 0%, transparent 60%)",
    Overwhelmed: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(100, 116, 139, 0.2) 0%, transparent 60%)",
    Lonely: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124, 58, 237, 0.15) 0%, transparent 60%)",
    Excited: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(236, 72, 153, 0.2) 0%, transparent 60%)",
    Mystical: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99, 102, 241, 0.25) 0%, transparent 60%)",
};
