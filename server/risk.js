export function detectHighRisk(text) {
  const keywords = [
    "I want to die",
    "मला जगायचं नाही",
    "जीवन संपवायचं आहे",
    "suicide",
    "kill myself"
  ];

  return keywords.some(word => text.toLowerCase().includes(word.toLowerCase()));
}