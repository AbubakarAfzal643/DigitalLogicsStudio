import apiClient from "./apiClient";

const STORAGE_PREFIX = "boolforge-learning-progress";
const guestKey = "guest";

const defaultState = () => ({
  problems: {},
  topics: {},
  activity: {},
  recentEvents: [],
});

const isBrowser = () => typeof window !== "undefined";

const normalizeUserKey = (userOrKey) => {
  if (typeof userOrKey === "string" && userOrKey.trim()) {
    return userOrKey.trim().toLowerCase();
  }

  if (!userOrKey) {
    return guestKey;
  }

  return String(
    userOrKey.id ||
      userOrKey._id ||
      userOrKey.email ||
      userOrKey.username ||
      guestKey,
  ).toLowerCase();
};

const storageKeyFor = (userOrKey) => `${STORAGE_PREFIX}:${normalizeUserKey(userOrKey)}`;

const clone = (value) => JSON.parse(JSON.stringify(value));

const safeRead = (userOrKey) => {
  if (!isBrowser()) {
    return defaultState();
  }

  try {
    const raw = window.localStorage.getItem(storageKeyFor(userOrKey));
    if (!raw) {
      return defaultState();
    }

    const parsed = JSON.parse(raw);
    return {
      ...defaultState(),
      ...parsed,
      problems: parsed?.problems || {},
      topics: parsed?.topics || {},
      activity: parsed?.activity || {},
      recentEvents: Array.isArray(parsed?.recentEvents) ? parsed.recentEvents : [],
    };
  } catch (error) {
    return defaultState();
  }
};

const safeWrite = (userOrKey, state) => {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(storageKeyFor(userOrKey), JSON.stringify(state));
};

const toDateKey = (value = new Date()) =>
  new Date(value).toISOString().slice(0, 10);

const formatMonthKey = (value = new Date()) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const pushRecentEvent = (state, event) => {
  state.recentEvents = [event, ...(state.recentEvents || [])].slice(0, 30);
};

const ensureActivityDay = (state, dateKey) => {
  if (!state.activity[dateKey]) {
    state.activity[dateKey] = {
      attempts: 0,
      solved: 0,
      topicsCompleted: 0,
      topicsOpened: 0,
    };
  }

  return state.activity[dateKey];
};

const mergeTopicState = (topic, currentState) => {
  const existing = currentState || {};
  return {
    openedAt: existing.openedAt || null,
    completedAt: existing.completedAt || null,
    completionPercentage: existing.completionPercentage || 0,
    status: existing.status || "not_started",
    completedSubtopics: Array.isArray(existing.completedSubtopics)
      ? existing.completedSubtopics
      : [],
    totalSubtopics: topic?.links?.length || existing.totalSubtopics || 0,
    title: topic?.title || existing.title || "",
  };
};

const calculateTopicCompletion = (topic, topicState) => {
  const totalSubtopics = Math.max(topic?.links?.length || topicState.totalSubtopics || 0, 1);
  const completedCount = topicState.completedSubtopics.length;
  const completionPercentage = Math.round((completedCount / totalSubtopics) * 100);

  return {
    totalSubtopics,
    completedCount,
    completionPercentage,
    status:
      completionPercentage >= 100
        ? "completed"
        : completionPercentage > 0 || topicState.openedAt
          ? "in_progress"
          : "not_started",
  };
};

const createActivityEvent = (type, payload = {}) => ({
  id: `${type}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
  type,
  createdAt: new Date().toISOString(),
  ...payload,
});

const getMonthMatrix = (activity, monthInput = new Date()) => {
  const monthDate = new Date(monthInput);
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthKey = formatMonthKey(monthDate);

  return Array.from({ length: daysInMonth }, (_, index) => {
    const dateKey = `${monthKey}-${String(index + 1).padStart(2, "0")}`;
    const day = activity[dateKey] || {
      attempts: 0,
      solved: 0,
      topicsCompleted: 0,
      topicsOpened: 0,
    };
    const intensity = Math.min(
      4,
      day.solved > 0
        ? day.solved
        : day.attempts > 0 || day.topicsCompleted > 0 || day.topicsOpened > 0
          ? 1
          : 0,
    );

    return {
      date: dateKey,
      ...day,
      intensity,
    };
  });
};

const calculateStreaks = (activity) => {
  const activeDays = Object.entries(activity)
    .filter(([, value]) => value.solved > 0 || value.attempts > 0 || value.topicsCompleted > 0)
    .map(([dateKey]) => dateKey)
    .sort();

  if (!activeDays.length) {
    return {
      current: 0,
      longest: 0,
      activeDays: 0,
    };
  }

  let longest = 1;
  let currentRun = 1;

  for (let index = 1; index < activeDays.length; index += 1) {
    const prev = new Date(activeDays[index - 1]);
    const next = new Date(activeDays[index]);
    const diffDays = Math.round((next - prev) / 86400000);

    if (diffDays === 1) {
      currentRun += 1;
      longest = Math.max(longest, currentRun);
    } else {
      currentRun = 1;
    }
  }

  let current = 0;
  let cursor = new Date();
  while (true) {
    const key = toDateKey(cursor);
    const day = activity[key];
    if (day && (day.solved > 0 || day.attempts > 0 || day.topicsCompleted > 0)) {
      current += 1;
      cursor = new Date(cursor.getTime() - 86400000);
    } else {
      break;
    }
  }

  return {
    current,
    longest,
    activeDays: activeDays.length,
  };
};

const calculateSummary = (state, topics = [], problems = []) => {
  const problemEntries = Object.values(state.problems || {});
  const topicEntries = Object.values(state.topics || {});
  const solvedProblems = problemEntries.filter((problem) => problem.status === "solved").length;
  const attemptedProblems = problemEntries.filter((problem) => problem.attempts > 0).length;
  const completedTopics = topicEntries.filter((topic) => topic.status === "completed").length;
  const streaks = calculateStreaks(state.activity || {});

  return {
    solvedProblems,
    attemptedProblems,
    completedTopics,
    totalProblems: problems.length,
    totalTopics: topics.length,
    completionRate: problems.length
      ? Math.round((solvedProblems / problems.length) * 100)
      : 0,
    streaks,
  };
};

const snapshotFor = (userOrKey, { topics = [], problems = [] } = {}) => {
  const state = safeRead(userOrKey);

  topics.forEach((topic) => {
    state.topics[topic.id] = mergeTopicState(topic, state.topics[topic.id]);
    const derived = calculateTopicCompletion(topic, state.topics[topic.id]);
    state.topics[topic.id] = {
      ...state.topics[topic.id],
      ...derived,
    };
  });

  return {
    state: clone(state),
    summary: calculateSummary(state, topics, problems),
    calendar: getMonthMatrix(state.activity || {}, new Date()),
    recentEvents: clone(state.recentEvents || []),
  };
};

const updateState = (userOrKey, updater) => {
  const state = safeRead(userOrKey);
  const nextState = updater(clone(state)) || state;
  safeWrite(userOrKey, nextState);
  return clone(nextState);
};

const recordProblemAttemptLocal = (userOrKey, problem) =>
  updateState(userOrKey, (state) => {
    const dateKey = toDateKey();
    const current = state.problems[problem.id] || {
      attempts: 0,
      status: "not_started",
      solvedAt: null,
      openedAt: null,
      title: problem.title,
      tags: problem.tags || [],
      topicId: problem.primaryTopicId || null,
    };

    current.attempts += 1;
    current.status = current.status === "solved" ? "solved" : "attempted";
    current.openedAt = current.openedAt || new Date().toISOString();
    current.lastAttemptAt = new Date().toISOString();
    current.title = problem.title;
    current.tags = problem.tags || [];
    current.topicId = problem.primaryTopicId || current.topicId || null;
    state.problems[problem.id] = current;

    const day = ensureActivityDay(state, dateKey);
    day.attempts += 1;

    pushRecentEvent(
      state,
      createActivityEvent("problem_attempted", {
        problemId: problem.id,
        title: problem.title,
      }),
    );

    return state;
  });

const setProblemSolvedLocal = (userOrKey, problem, solved) =>
  updateState(userOrKey, (state) => {
    const dateKey = toDateKey();
    const current = state.problems[problem.id] || {
      attempts: 0,
      status: "not_started",
      solvedAt: null,
      openedAt: null,
      title: problem.title,
      tags: problem.tags || [],
      topicId: problem.primaryTopicId || null,
    };

    const wasSolved = current.status === "solved";
    current.status = solved ? "solved" : current.attempts > 0 ? "attempted" : "not_started";
    current.solvedAt = solved ? current.solvedAt || new Date().toISOString() : null;
    current.title = problem.title;
    current.tags = problem.tags || [];
    current.topicId = problem.primaryTopicId || current.topicId || null;
    state.problems[problem.id] = current;

    if (solved && !wasSolved) {
      const day = ensureActivityDay(state, dateKey);
      day.solved += 1;

      pushRecentEvent(
        state,
        createActivityEvent("problem_solved", {
          problemId: problem.id,
          title: problem.title,
        }),
      );
    }

    return state;
  });

const markTopicOpenedLocal = (userOrKey, topic) =>
  updateState(userOrKey, (state) => {
    const dateKey = toDateKey();
    const current = mergeTopicState(topic, state.topics[topic.id]);
    current.openedAt = current.openedAt || new Date().toISOString();
    current.status = current.status === "completed" ? "completed" : "in_progress";
    state.topics[topic.id] = {
      ...current,
      ...calculateTopicCompletion(topic, current),
    };

    const day = ensureActivityDay(state, dateKey);
    day.topicsOpened += 1;

    pushRecentEvent(
      state,
      createActivityEvent("topic_opened", {
        topicId: topic.id,
        title: topic.title,
      }),
    );

    return state;
  });

const toggleSubtopicCompletedLocal = (userOrKey, topic, subtopicId) =>
  updateState(userOrKey, (state) => {
    const dateKey = toDateKey();
    const current = mergeTopicState(topic, state.topics[topic.id]);
    const completed = new Set(current.completedSubtopics);

    if (completed.has(subtopicId)) {
      completed.delete(subtopicId);
    } else {
      completed.add(subtopicId);
    }

    current.completedSubtopics = Array.from(completed);
    current.openedAt = current.openedAt || new Date().toISOString();

    const derived = calculateTopicCompletion(topic, current);
    const wasCompleted = state.topics[topic.id]?.status === "completed";
    const nextState = {
      ...current,
      ...derived,
      completedAt: derived.status === "completed" ? current.completedAt || new Date().toISOString() : null,
    };
    state.topics[topic.id] = nextState;

    if (!wasCompleted && derived.status === "completed") {
      const day = ensureActivityDay(state, dateKey);
      day.topicsCompleted += 1;

      pushRecentEvent(
        state,
        createActivityEvent("topic_completed", {
          topicId: topic.id,
          title: topic.title,
        }),
      );
    }

    return state;
  });

const tryRemotePost = async (path, payload) => {
  if (process.env.NODE_ENV === "test") {
    return null;
  }

  try {
    await apiClient.post(path, payload);
  } catch (error) {
    return null;
  }

  return true;
};

const syncSolvedFromDB = (userOrKey, dbSolvedIds, problemCatalog = []) => {
  if (!Array.isArray(dbSolvedIds) || !dbSolvedIds.length) return;

  updateState(userOrKey, (state) => {
    dbSolvedIds.forEach((problemId) => {
      const id = Number(problemId);
      if (!Number.isFinite(id)) return;

      const existing = state.problems[id] || {};
      if (existing.status === "solved") return;

      const meta = problemCatalog.find((p) => p.id === id);
      state.problems[id] = {
        attempts: existing.attempts || 1,
        openedAt: existing.openedAt || new Date().toISOString(),
        lastAttemptAt: existing.lastAttemptAt || new Date().toISOString(),
        title: meta?.title || existing.title || `Problem ${id}`,
        tags: meta?.tags || existing.tags || [],
        topicId: meta?.primaryTopicId || existing.topicId || null,
        ...existing,
        status: "solved",
        solvedAt: existing.solvedAt || new Date().toISOString(),
      };
    });
    return state;
  });
};

const progressService = {
  getUserKey: normalizeUserKey,
  syncSolvedFromDB,
  getSnapshot: snapshotFor,
  getMonthMatrix: (userOrKey, monthInput) =>
    getMonthMatrix(safeRead(userOrKey).activity || {}, monthInput),
  getStoredState: safeRead,
  completeProblem: async (problemId, payload = {}) => {
    await tryRemotePost(`/progress/problems/${problemId}/complete`, payload);
    if (payload?.userKey && payload?.problem) {
      setProblemSolvedLocal(payload.userKey, payload.problem, true);
    }
    return snapshotFor(payload?.userKey || guestKey, payload?.catalog || {});
  },
  recordAttempt: async (userOrKey, problem, catalog = {}) => {
    await tryRemotePost(`/progress/problems/${problem.id}/attempt`, {
      title: problem.title,
    });
    recordProblemAttemptLocal(userOrKey, problem);
    return snapshotFor(userOrKey, catalog);
  },
  setProblemSolved: async (userOrKey, problem, solved, catalog = {}) => {
    await tryRemotePost(
      solved
        ? `/progress/problems/${problem.id}/complete`
        : `/progress/problems/${problem.id}/uncomplete`,
      { title: problem.title },
    );
    setProblemSolvedLocal(userOrKey, problem, solved);
    return snapshotFor(userOrKey, catalog);
  },
  openTopic: async (userOrKey, topic, catalog = {}) => {
    await tryRemotePost(`/progress/topics/${topic.id}/open`, {
      title: topic.title,
    });
    markTopicOpenedLocal(userOrKey, topic);
    return snapshotFor(userOrKey, catalog);
  },
  toggleSubtopicCompleted: async (userOrKey, topic, subtopicId, catalog = {}) => {
    await tryRemotePost(`/progress/topics/${topic.id}/subtopics/${subtopicId}`, {
      title: topic.title,
      subtopicId,
    });
    toggleSubtopicCompletedLocal(userOrKey, topic, subtopicId);
    return snapshotFor(userOrKey, catalog);
  },
};

export const progressTestUtils = {
  storageKeyFor,
  safeRead,
  safeWrite,
  normalizeUserKey,
  getMonthMatrix,
  calculateSummary,
  calculateStreaks,
};

export default progressService;
