import { hashString } from "@/lib/avatar";
import { PlayerStats } from "@/lib/stats";

function pick(templates: string[], seed: string): string {
  return templates[hashString(seed) % templates.length];
}

const TOP = [
  "Unstoppable right now! Setting the bar for everyone else. 🏆",
  "The player to beat — pure class on court! 👑",
  "Leading the pack with seriously smooth badminton! 🌟",
  "Top of the table and making it look easy! 🥇",
];

const SECOND = [
  "Right on the leader's heels — this rivalry is fun to watch! 🥈",
  "Consistently excellent, match after match! ⭐",
  "A dangerous opponent for absolutely anyone on court! 💪",
  "So close to the top — the chase continues! 🔥",
];

const UPPER_MID = [
  "Solid stretch on court — reliable and sharp! 🎯",
  "Building great momentum with every match! 📈",
  "A great partner to have on your side of the net! 🤝",
  "Quietly having a really strong run! ⚡",
];

const LOWER_MID = [
  "Bringing great energy to every single match! 🔥",
  "Every match is a step forward — keep it up! 🌱",
  "The rallies with this player are always entertaining! 🎉",
  "Full effort, every match, no exceptions! 💯",
];

const LAST = [
  "Big things coming — the momentum is building! 🚀",
  "Never misses a match — that's real dedication! 🙌",
  "Brings the best energy and sportsmanship to every game! 😄",
  "The heart of the group — always up for a match! ❤️",
];

const RESTING = [
  "Taking a well-earned break — good to have back soon! 🌤️",
  "Recharging for now — the comeback will be worth it! 🔋",
  "Sitting this one out, but always part of the team! 🤝",
];

export function getPunchline(player: PlayerStats, rank: number, totalActive: number): string {
  if (player.played === 0) {
    return pick(RESTING, player.playerId);
  }
  if (rank === 1) return pick(TOP, player.playerId);
  if (rank === 2 && totalActive > 2) return pick(SECOND, player.playerId);
  if (rank === totalActive && totalActive > 2) return pick(LAST, player.playerId);
  if (rank <= Math.ceil(totalActive / 2)) return pick(UPPER_MID, player.playerId);
  return pick(LOWER_MID, player.playerId);
}

export function mostActiveBadge(played: number): string {
  return `Most Active — ${played} matches played`;
}

export function mostImprovedBadge(delta: number): string {
  return `Most Improved — up ${delta}% from last period`;
}
