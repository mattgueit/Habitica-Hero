import { HabiticaUser } from "@/types/habitica";

// Stub API - replace with your actual Habitica credentials and endpoints
const HABITICA_API_BASE = "https://habitica.com/api/v3";
const API_USER = "YOUR_USER_ID"; // Replace with your user ID
const API_TOKEN = "YOUR_API_TOKEN"; // Replace with your API token

const headers = {
  "x-client": API_USER + "-WEB-APP",
  "x-api-user": API_USER,
  "x-api-key": API_TOKEN,
  "Content-Type": "application/json",
};

export const fetchUserDetails = async (): Promise<HabiticaUser> => {
  const url = `${HABITICA_API_BASE}/user`;

  const response = await fetch(url, { headers });
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

export const castAbility = async (endpoint: string): Promise<{ status: number; size: number; time: number }> => {
  const startTime = performance.now();
  
  const url = `${HABITICA_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    method: 'POST',
    headers,
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
