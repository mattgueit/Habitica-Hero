import { HabiticaUser } from "@/types/habitica";

const HABITICA_API_BASE = "https://habitica.com/api/v3";

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
  return data.data;

  // return {
  //   auth: {
  //     local: {
  //       username: "HabiticaHero"
  //     }
  //   },
  //   stats: {
  //     hp: 42,
  //     maxHealth: 50,
  //     exp: 120,
  //     toNextLevel: 200,
  //     mp: 38,
  //     maxMP: 50,
  //   },
  //   party: {
  //     quest: {
  //       key: "dragon",
  //       progress: {
  //         up: 250,
  //       },
  //     },
  //   },
  // };
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

export function logout(): void {
  sessionStorage.removeItem("habitica_user_id");
  sessionStorage.removeItem("habitica_api_token");
  setCachedTaskId(null);
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

// Cast Brutal Smash against a cached task id.
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
