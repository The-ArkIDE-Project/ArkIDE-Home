const token = ":disgust2:";

function t(count) {
  return Array(count).fill(token).join('');
}

const apiCache = new Map();


function normalize(text) {
  return text.toLowerCase().slice(0, 400);
}

async function apiCensor(text) {
  
  const cacheKey = normalize(text);
  if (apiCache.has(cacheKey)) return apiCache.get(cacheKey);

  try {
    const encoded = encodeURIComponent(text.slice(0, 1900));

    const url = `https://www.purgomalum.com/service/plain?text=${encoded}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("API error");

    const cleaned = await res.text();

    const result = cleaned.replace(/\*+/g, (stars) =>
      t(Math.max(1, Math.ceil(stars.length / 4)))
    );

    apiCache.set(cacheKey, result);
    return result;
  } catch {
    return text;
  }
}

export default async function censor(text) {
  const str = String(text).trim();
  if (!str) return "";
  return await apiCensor(str);
}