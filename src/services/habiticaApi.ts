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

export function logout(): void {
  sessionStorage.removeItem("habitica_user_id");
  sessionStorage.removeItem("habitica_api_token");
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

  // Mock response for testing
  //await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

  // return {
  //   status: 200,
  //   size: Math.floor(Math.random() * 1000) + 500,
  //   time: Math.round(endTime - startTime),
  // };
};
