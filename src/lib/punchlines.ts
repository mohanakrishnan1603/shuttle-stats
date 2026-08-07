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

const TOP_DETAILED = [
  "Sitting at the top of the table, and it shows in every rally. This is what consistent, high-quality badminton looks like — keep setting the pace! 🏆",
  "The player everyone else is chasing right now. Sharp on the smashes, sharper on the reads — pure class from first serve to last point. 👑",
  "Leading the standings and making it look effortless. Every match brings the same calm, controlled game that's become the bar for the whole group. 🌟",
  "Top of the table, and deservedly so. The footwork, the timing, the finishing — it's all clicking, and it's a joy to watch from the sidelines. 🥇",
];

const SECOND_DETAILED = [
  "Right on the leader's heels and closing the gap fast. The rallies between these two are must-watch — this rivalry is pushing everyone's level up. 🥈",
  "Consistently excellent, match after match, week after week. That kind of reliability is rare, and it's exactly what makes this player so dangerous. ⭐",
  "A genuine threat to anyone on court, no exceptions. Smart shot selection and steady nerves under pressure — the read on this player rarely misses. 💪",
  "So close to the top spot, and the chase is far from over. Every session adds another layer to an already impressive game. 🔥",
];

const UPPER_MID_DETAILED = [
  "A really solid stretch on court lately — sharp decision-making and dependable form match after match. Quietly building real momentum here. 🎯",
  "Building great momentum with every match played. The consistency is starting to add up into one of the stronger games in the group. 📈",
  "A fantastic partner to have on your side of the net — reads the game well and backs it up with steady execution. Reliable in all the right ways. 🤝",
  "Quietly having a really strong run right now. The kind of composed, steady play that doesn't always grab headlines but wins matches. ⚡",
];

const LOWER_MID_DETAILED = [
  "Bringing great energy to every single match, and it's paying off in small, steady improvements. The effort on court is impossible to miss. 🔥",
  "Every match is another step forward, and that's exactly the right way to build a game. Keep showing up — the progress is real. 🌱",
  "Full effort, every match, no exceptions. That kind of commitment is what turns solid fundamentals into a genuinely strong all-around game. 💯",
  "The rallies with this player are always entertaining, and the game keeps getting sharper session by session. Fun to watch, fun to play against. 🎉",
];

const LAST_DETAILED = [
  "Big things are brewing here — the momentum has been building steadily, and it shows in how much sharper each match looks. Keep stacking those reps. 🚀",
  "Never misses a match, rain or shine — that kind of dedication is the real foundation of getting better, and the improvement is already showing. 🙌",
  "Brings the best energy and sportsmanship to every single game. That attitude is contagious, and it's exactly what makes this group fun to play in. 😄",
  "The heart of the group — always up for a match, always ready to learn. Every rally is a step forward, and the effort never goes unnoticed. ❤️",
];

const RESTING_DETAILED = [
  "Taking a well-earned break for this period. The group's looking forward to having that energy back on court soon. 🌤️",
  "Recharging for now, but every comeback from this player has been worth the wait — excited for the next appearance. 🔋",
  "Sitting this period out, but always part of the team no matter what the schedule says. The door's open whenever the return happens. 🤝",
];

export function getDetailedPunchline(player: PlayerStats, rank: number, totalActive: number): string {
  if (player.played === 0) {
    return pick(RESTING_DETAILED, player.playerId);
  }
  if (rank === 1) return pick(TOP_DETAILED, player.playerId);
  if (rank === 2 && totalActive > 2) return pick(SECOND_DETAILED, player.playerId);
  if (rank === totalActive && totalActive > 2) return pick(LAST_DETAILED, player.playerId);
  if (rank <= Math.ceil(totalActive / 2)) return pick(UPPER_MID_DETAILED, player.playerId);
  return pick(LOWER_MID_DETAILED, player.playerId);
}

export function mostActiveBadge(played: number): string {
  return `Most Active — ${played} matches played`;
}

export function mostImprovedBadge(delta: number): string {
  return `Most Improved — up ${delta}% from last period`;
}

const STREAK_ON_FIRE = [
  "On an absolute tear — showing up every single time! 🔥",
  "This streak is legendary status at this point! 🏆",
  "Can't stop, won't stop — a true attendance machine! ⚡",
  "Setting the bar for commitment right now! 🌟",
];

const STREAK_BUILDING = [
  "Nice momentum going here — keep the streak alive! 📈",
  "A couple of solid sessions in a row — love the consistency! 💪",
  "Building something good — don't break it now! 🎯",
];

const STREAK_STARTED = [
  "Fresh streak, day one — every legend starts somewhere! 🌱",
  "Back in the game — let's make it a habit! 🙌",
];

const STREAK_BROKEN = [
  "Missed the last one — the comeback starts now! 🌤️",
  "Sat out last time, but the door's always open! 🤝",
  "Taking a breather — see you on court soon! 🔋",
];

export function getAttendancePunchline(player: { playerId: string; streak: number; presentToday: boolean }): string {
  if (player.streak >= 5) return pick(STREAK_ON_FIRE, player.playerId);
  if (player.streak >= 2) return pick(STREAK_BUILDING, player.playerId);
  if (player.streak === 1) return pick(STREAK_STARTED, player.playerId);
  return pick(STREAK_BROKEN, player.playerId);
}

export function streakBadgeLabel(streak: number): string | null {
  if (streak >= 3) return `🔥 ${streak}-day streak`;
  if (streak >= 1) return "🌱 New streak";
  return null;
}
