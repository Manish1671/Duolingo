export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": "1",
      ...(init?.headers || {}),
    },
    signal: init?.signal ?? AbortSignal.timeout(12000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data.detail;
    const message =
      typeof detail === "string"
        ? detail
        : data.error || res.statusText || "Request failed";
    throw new ApiError(res.status, message);
  }
  return data as T;
}

export const api = {
  me: (simulateDate?: string) => {
    const q = simulateDate ? `?simulateDate=${encodeURIComponent(simulateDate)}` : "";
    return request<Me>(`/api/me${q}`);
  },
  path: () => request<PathResponse>("/api/path"),
  profile: () => request<ProfileResponse>("/api/profile"),
  leaderboard: () => request<LeaderboardResponse>("/api/leaderboard"),
  lesson: (id: number) => request<LessonResponse>(`/api/lessons/${id}`),
  startLesson: (id: number) =>
    request<{ attemptId: number; hearts: number; isPractice: boolean }>(
      `/api/lessons/${id}/start`,
      { method: "POST" },
    ),
  check: (attemptId: number, body: CheckBody) =>
    request<CheckResponse>(`/api/attempts/${attemptId}/check`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  complete: (attemptId: number, simulateDate?: string) => {
    const q = simulateDate ? `?simulateDate=${simulateDate}` : "";
    return request<CompleteResponse>(`/api/attempts/${attemptId}/complete${q}`, {
      method: "POST",
    });
  },
  practiceRefill: () =>
    request<{ lessonId: number | null; hearts: number }>("/api/practice/refill", {
      method: "POST",
    }),
  setGoal: (dailyGoalXp: number) =>
    request<{ dailyGoalXp: number }>("/api/me/goal", {
      method: "PATCH",
      body: JSON.stringify({ dailyGoalXp }),
    }),
};

export type Me = {
  id: number;
  displayName: string;
  avatarColor: string;
  xp: number;
  gems: number;
  hearts: number;
  streak: number;
  lastActiveDate: string | null;
  dailyGoalXp: number;
  xpToday: number;
  heartsUpdatedAt: string | null;
  nextHeartInSeconds?: number | null;
  simulatedDate?: string;
};

export type PathNode = {
  id: number;
  position: number;
  type: "lesson" | "practice" | string;
  title: string;
  color: string;
  status: "locked" | "active" | "complete" | string;
  crownLevel: number;
  lessonsCompleted: number;
  lessonsTotal: number;
  nextLessonId: number | null;
  progress: number;
};

export type PathUnit = {
  id: number;
  position: number;
  title: string;
  description: string;
  color: string;
  nodes: PathNode[];
};

export type PathResponse = {
  course: {
    id: number;
    title: string;
    flag: string;
    fromLanguage: string;
    toLanguage: string;
  };
  units: PathUnit[];
  hearts: number;
  xp: number;
  streak: number;
  gems: number;
};

export type Exercise = {
  id: number;
  position: number;
  type:
    | "multiple_choice"
    | "translate_tap"
    | "match_pairs"
    | "fill_blank"
    | "type_answer"
    | string;
  prompt: string;
  payload: Record<string, unknown>;
};

export type LessonResponse = {
  id: number;
  title: string;
  xpReward: number;
  pathNodeId: number;
  exercises: Exercise[];
};

export type CheckBody = {
  exerciseId: number;
  answer?: Record<string, unknown>;
  leftId?: string;
  rightId?: string;
};

export type CheckResponse = {
  correct: boolean;
  expected: unknown;
  hearts: number;
  failed: boolean;
  pairCorrect?: boolean;
};

export type CompleteResponse = {
  alreadyCompleted: boolean;
  xpAwarded: number;
  streak: number;
  xp: number;
  hearts: number;
  gems?: number;
  streak_incremented?: boolean;
  xp_today?: number;
  daily_goal_xp?: number;
  daily_goal_met?: boolean;
  dailyGoalMet?: boolean;
  unlockedAchievements?: string[];
};

export type ProfileResponse = {
  user: Me;
  skillsCompleted: number;
  league?: string;
  achievements: {
    code: string;
    title: string;
    description: string;
    unlockedAt: string;
  }[];
};

export type LeaderboardResponse = {
  league?: string;
  yourRank?: number | null;
  entries: {
    rank: number;
    userId: number;
    displayName: string;
    avatarColor: string;
    xp: number;
    isYou: boolean;
  }[];
};
