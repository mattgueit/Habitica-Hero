import { HabiticaUser } from "@/types/habitica";

const HABITICA_API_BASE = "https://habitica.com/api/v3";

export type HabiticaChatMessage = {
  id?: string;
  _id?: string;
  text?: string;
  timestamp?: string;
  user?: string;
};

function getStoredCredentials() {
  const id = sessionStorage.getItem("habitica_user_id");
  const apiToken = sessionStorage.getItem("habitica_api_token");
  return { id, apiToken } as { id: string | null; apiToken: string | null };
}

function buildHeaders() {
  const { id, apiToken } = getStoredCredentials();
  return {
    "x-client": (id || "UNKNOWN") + "-WEB-APP",
    "x-api-user": id || "",
    "x-api-key": apiToken || "",
    "Content-Type": "application/json",
  } as Record<string, string>;
}

export const fetchUserDetails = async (): Promise<HabiticaUser> => {
  const url = `${HABITICA_API_BASE}/user`;

  const response = await fetch(url, { headers: buildHeaders() });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  const data = await response.json();
  const userData = data.data;
  
  // Cache the username when user data is fetched
  if (userData?.auth?.local?.username) {
    setCachedUsername(userData.auth.local.username);
  }
  
  return userData;
};

export async function login(username: string, password: string): Promise<{ id: string; apiToken: string }> {
  const url = `${HABITICA_API_BASE}/user/auth/local/login`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Login failed: ${response.status} ${text}`);
  }
  const data = await response.json();
  const { id, apiToken } = data.data || {};
  if (!id || !apiToken) {
    throw new Error("Login response missing credentials");
  }
  return { id, apiToken };
}

export function isAuthenticated(): boolean {
  const { id, apiToken } = getStoredCredentials();
  return Boolean(id && apiToken);
}

let cachedTargetTaskId: string | null = null;
const CACHED_TASK_KEY = "habitica_cached_task_id";

function getCachedTaskId(): string | null {
  if (cachedTargetTaskId) return cachedTargetTaskId;
  const fromStorage = sessionStorage.getItem(CACHED_TASK_KEY);
  cachedTargetTaskId = fromStorage || null;
  return cachedTargetTaskId;
}

function setCachedTaskId(id: string | null) {
  cachedTargetTaskId = id;
  if (id) {
    sessionStorage.setItem(CACHED_TASK_KEY, id);
  } else {
    sessionStorage.removeItem(CACHED_TASK_KEY);
  }
}

const CACHED_PARTY_ID_KEY = "habitica_cached_party_id";
let cachedPartyId: string | null = null;

function getCachedPartyId(): string | null {
  if (cachedPartyId) return cachedPartyId;
  const v = sessionStorage.getItem(CACHED_PARTY_ID_KEY);
  cachedPartyId = v || null;
  return cachedPartyId;
}

function setCachedPartyId(id: string | null) {
  cachedPartyId = id;
  if (id) sessionStorage.setItem(CACHED_PARTY_ID_KEY, id);
  else sessionStorage.removeItem(CACHED_PARTY_ID_KEY);
}

const CACHED_USERNAME_KEY = "habitica_cached_username";
let cachedUsername: string | null = null;

function getCachedUsername(): string | null {
  if (cachedUsername) return cachedUsername;
  const v = sessionStorage.getItem(CACHED_USERNAME_KEY);
  cachedUsername = v || null;
  return cachedUsername;
}

function setCachedUsername(username: string | null) {
  cachedUsername = username;
  if (username) sessionStorage.setItem(CACHED_USERNAME_KEY, username);
  else sessionStorage.removeItem(CACHED_USERNAME_KEY);
}

export function logout(): void {
  sessionStorage.removeItem("habitica_user_id");
  sessionStorage.removeItem("habitica_api_token");
  setCachedTaskId(null);
  setCachedPartyId(null);
  setCachedUsername(null);
}

export const castAbility = async (endpoint: string): Promise<{ status: number; size: number; time: number }> => {
  const startTime = performance.now();
  
  const url = `${HABITICA_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(),
  });

  const endTime = performance.now();
  const data = await response.text();

  return {
    status: response.status,
    size: new Blob([data]).size / 1000, // KB
    time: Math.round(endTime - startTime),
  };
};

export const fetchTasks = async (): Promise<Array<{ id: string }>> => {
  const url = `${HABITICA_API_BASE}/tasks/user`;
  const response = await fetch(url, { headers: buildHeaders() });
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  const data = await response.json();
  // Only need IDs for now.
  return (data.data || []).map((t: { id: string }) => ({ id: t.id }));
};

// Fetch user, cache and return party id
export const fetchAndCachePartyId = async (): Promise<string | null> => {
  const cached = getCachedPartyId();
  if (cached) return cached;
  try {
    const user = await fetchUserDetails();
    const partyId = user?.party?._id || null;
    setCachedPartyId(partyId);
    return partyId;
  } catch {
    return null;
  }
};

// Fetch party chat messages
export const fetchPartyChat = async (groupId?: string): Promise<HabiticaChatMessage[]> => {
  const gid = groupId || (await fetchAndCachePartyId());
  if (!gid) return [];
  const url = `${HABITICA_API_BASE}/groups/${encodeURIComponent(gid)}/chat`;
  const response = await fetch(url, { headers: buildHeaders() });
  if (!response.ok) return [];
  const data = await response.json();
  return (data.data || []) as HabiticaChatMessage[];
};

// Cast Brutal Smash against a cached task id.
// Get next buff availability time by looking for latest buff cast in chat
export const getNextBuffTime = async (): Promise<Date | null> => {
  try {
    const chatMessages = await fetchPartyChat();
    if (!chatMessages || chatMessages.length === 0) return null;

    // Get username from cache, fetch if not cached
    let username = getCachedUsername();
    if (!username) {
      const userData = await fetchUserDetails();
      username = userData?.auth?.local?.username;
      if (!username) return null;
    }

    // Find the latest message that starts with "{username} casts"
    const buffCastPattern = `\`${username} casts`;
    let latestBuffCast: HabiticaChatMessage | null = null;

    for (const message of chatMessages) {
      if (message.text?.startsWith(buffCastPattern)) {
        if (!latestBuffCast || (message.timestamp && latestBuffCast.timestamp && 
            new Date(message.timestamp) > new Date(latestBuffCast.timestamp))) {
          latestBuffCast = message;
        }
      }
    }

    if (!latestBuffCast || !latestBuffCast.timestamp) return null;

    // Calculate next buff time (3 hours after the last cast)
    const lastCastTime = new Date(latestBuffCast.timestamp);
    const nextBuffTime = new Date(lastCastTime.getTime() + 3 * 60 * 60 * 1000); // 3 hours in milliseconds
    
    return nextBuffTime;
  } catch (error) {
    console.error('Error getting next buff time:', error);
    return null;
  }
};

export const castBrutalSmash = async (): Promise<{ status: number; size: number; time: number }> => {
  // Helper to ensure we have a target id, using cache when possible
  const resolveTargetId = async (): Promise<string> => {
    const cached = getCachedTaskId();
    if (cached) return cached;
    const tasks = await fetchTasks();
    if (!tasks || tasks.length === 0) {
      throw new Error("No tasks available to target with Brutal Smash");
    }
    const id = tasks[0].id;
    setCachedTaskId(id);
    return id;
  };

  // Attempt cast, invalidates cache and retries once if target is invalid
  const attemptCast = async (targetId: string): Promise<{ response: Response; startTime: number; endTime: number; data: string }> => {
    const startTime = performance.now();
    const url = `${HABITICA_API_BASE}/user/class/cast/smash?targetId=${encodeURIComponent(targetId)}`;
    const response = await fetch(url, { method: 'POST', headers: buildHeaders() });
    const endTime = performance.now();
    const data = await response.text();
    return { response, startTime, endTime, data };
  };

  // First try with cached or freshly fetched id
  let targetTaskId = await resolveTargetId();
  let { response, startTime, endTime, data } = await attemptCast(targetTaskId);

  // If we got a client error that could indicate an invalid target, refresh the cache once and retry
  if (response.status === 400 || response.status === 404) {
    // Invalidate and try again with a fresh task id
    setCachedTaskId(null);
    targetTaskId = await resolveTargetId();
    ({ response, startTime, endTime, data } = await attemptCast(targetTaskId));
  }

  // If successful (2xx), keep cache; if not, optionally invalidate (conservative: keep to avoid extra fetches)
  if (!response.ok && response.status >= 400 && response.status < 500) {
    // If repeatedly failing with client error, invalidate cache so next call can try anew
    setCachedTaskId(null);
  }

  return {
    status: response.status,
    size: new Blob([data]).size / 1000,
    time: Math.round(endTime - startTime),
  };
};
