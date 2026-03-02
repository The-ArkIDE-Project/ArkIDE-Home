const token = ":disgust2:";

function t(count) {
  return Array(count).fill(token).join('');
}

const LEET = { "@": "a", "4": "a", "3": "e", "1": "i", "!": "i", "0": "o", "$": "s", "5": "s", "7": "t", "+": "t", "(": "c" };

function buildPattern(word) {
  const sep = "[*_.\\- ]*";
  const chars = word.split("").map((c) => {
    const variants = [c];
    for (const [leet, normal] of Object.entries(LEET)) {
      if (normal === c) variants.push(leet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
    }
    const group = variants.length > 1 ? `[${variants.join("")}]` : c;
    return group;
  });
  return new RegExp(chars.join(sep), "gi");
}

const RULES = [
  ["motherfucker",  10],
  ["motherfucking",  10],
  ["bullshit",       8],
  ["shitting",       8],
  ["asshole",        7],
  ["douchebag",      7],
  ["dipshit",        7],
  ["jackass",        7],
  ["dumbass",        7],
  ["bastard",        7],
  ["faggot",         6],
  ["fucker",         6],
  ["fucking",        6],
  ["fuckoff",        6],
  ["pissoff",        6],
  ["retard",         6],
  ["whore",          5],
  ["bitch",          5],
  ["pussy",          5],
  ["prick",          5],
  ["twat",           5],
  ["wank",           5],
  ["tosser",         5],
  ["cunt",           4],
  ["fuck",           4],
  ["shit",           4],
  ["dick",           4],
  ["cock",           4],
  ["slut",           4],
  ["fag",            3],
  ["ass",            3],
  ["sex",            3],
  ["arse",           3],
  ["damn",           3],
  ["crap",           3],
  ["piss",           3],
  ["wtf",            3],
  ["stfu",           3],
  ["gtfo",           3],
].map(([word, len]) => [buildPattern(word), len]);

const apiCache = new Map();


function normalize(text) {
  let t = text.toLowerCase();
  t = t.replace(/[@431!$57+(]/g, (c) => LEET[c] || c);
  t = t.replace(/([a-z])[*.\-_]+([a-z])/g, "$1$2");
  t = t.replace(/\b([a-z])(?: ([a-z]))+\b/g, (m) => m.replace(/ /g, ""));
  return t;
}

async function apiCensor(text) {
  const cacheKey = normalize(text).slice(0, 400);
  if (apiCache.has(cacheKey)) return apiCache.get(cacheKey);

  try {
    const encoded = encodeURIComponent(text.slice(0, 1900));

    const url = `https://www.purgomalum.com/service/plain?text=${encoded}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("API error");

    const cleaned = await res.text();

    const result = cleaned.replace(/\*+/g, (stars) => t(Math.max(1, Math.ceil(stars.length / 4))));

    apiCache.set(cacheKey, result);
    return result;
  } catch {
    apiCache.set(cacheKey, text);
    return text;
  }
}

function censorSync(text) {
  let result = String(text);
  for (const [pattern, len] of RULES) {
    result = result.replace(pattern, t(len));
  }
  return result;
}

async function censor(text) {
  const localResult = censorSync(String(text));
  return await apiCensor(localResult);
}

export default censor;