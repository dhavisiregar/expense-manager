"use client";

// Maps legacy Lucide icon name strings (stored in DB from seed data)
// to their emoji equivalents used by the new UI
const LUCIDE_TO_EMOJI: Record<string, string> = {
  utensils: "🍔",
  car: "🚗",
  "shopping-bag": "🛍️",
  film: "🎬",
  heart: "❤️",
  home: "🏠",
  plane: "✈️",
  book: "📚",
  zap: "⚡",
  "more-horizontal": "📦",
  tag: "🏷️",
  pill: "💊",
  coffee: "☕",
  gamepad: "🎮",
  briefcase: "💼",
  music: "🎵",
  "shopping-cart": "🛒",
  globe: "🌍",
  tool: "🔧",
  "dollar-sign": "💰",
};

// Returns true if the string is a single emoji character (or emoji sequence)
function isEmoji(str: string): boolean {
  // Emoji codepoints are > 0xFF, or multi-char sequences
  return str.length <= 4 && /\p{Emoji}/u.test(str);
}

export function CategoryIcon({
  icon,
  size = 22,
}: {
  icon: string;
  size?: number;
}) {
  const resolved = isEmoji(icon) ? icon : (LUCIDE_TO_EMOJI[icon] ?? "🏷️");
  return (
    <span style={{ fontSize: size, lineHeight: 1 }} role="img">
      {resolved}
    </span>
  );
}
