export type PetState = {
  emoji: string;
  label: string;
  message: string;
};

export function getPetState(healthScore: number): PetState {
  if (healthScore >= 90) {
    return {
      emoji: "👑✨",
      label: "Royalty Era",
      message: "The self-improvement arc is complete.",
    };
  }
  if (healthScore >= 75) {
    return {
      emoji: "😎🔥",
      label: "Thriving Blob",
      message: "Look at you making responsible decisions.",
    };
  }
  if (healthScore >= 50) {
    return {
      emoji: "😊",
      label: "Chill Blob",
      message: "We're surviving. Could be worse.",
    };
  }
  if (healthScore >= 25) {
    return {
      emoji: "🥺☕",
      label: "Struggling Blob",
      message: "Your blob is concerned. Drink some water?",
    };
  }
  return {
    emoji: "💀",
    label: "Disaster Blob",
    message: "Emergency cuddle protocol activated.",
  };
}
