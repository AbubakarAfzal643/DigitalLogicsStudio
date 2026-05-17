import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import progressService from "../services/progressService";

export default function useLearningProgress({ user, topics = [], problems = [] }) {
  const userKey = useMemo(() => progressService.getUserKey(user), [user]);
  const catalog = useMemo(() => ({ topics, problems }), [topics, problems]);

  const [snapshot, setSnapshot] = useState(() =>
    progressService.getSnapshot(userKey, catalog),
  );

  // Track whether we've loaded from DB for this userKey
  const loadedFromDBRef = useRef(null);

  // On mount (or when userKey changes), load the full progress state from MongoDB.
  // This replaces the old localStorage hydration.
  useEffect(() => {
    if (!user || userKey === "guest") return;
    if (loadedFromDBRef.current === userKey) return;
    loadedFromDBRef.current = userKey;

    progressService.loadFromDB(userKey).then(() => {
      setSnapshot(progressService.getSnapshot(userKey, catalog));
    });
  }, [userKey, user, catalog]);

  // Track which DB-solved arrays we've already synced to avoid infinite loops.
  // This is a fallback for the legacy solvedProblems array on the user object.
  const syncedRef = useRef(null);

  useEffect(() => {
    const dbSolved = user?.solvedProblems;
    if (!Array.isArray(dbSolved) || dbSolved.length === 0) return;

    const key = `${userKey}:${dbSolved.join(",")}`;
    if (syncedRef.current === key) return;
    syncedRef.current = key;

    progressService.syncSolvedFromDB(userKey, dbSolved, problems);
    setSnapshot(progressService.getSnapshot(userKey, catalog));
  }, [user?.solvedProblems, userKey, problems, catalog]);

  useEffect(() => {
    setSnapshot(progressService.getSnapshot(userKey, catalog));
  }, [catalog, userKey]);

  const refresh = useCallback(() => {
    setSnapshot(progressService.getSnapshot(userKey, catalog));
  }, [catalog, userKey]);

  const refreshFromDB = useCallback(async () => {
    await progressService.loadFromDB(userKey);
    setSnapshot(progressService.getSnapshot(userKey, catalog));
  }, [catalog, userKey]);

  const recordAttempt = useCallback(
    async (problem) => {
      const nextSnapshot = await progressService.recordAttempt(userKey, problem, catalog);
      setSnapshot(nextSnapshot);
    },
    [catalog, userKey],
  );

  const setProblemSolved = useCallback(
    async (problem, solved) => {
      const nextSnapshot = await progressService.setProblemSolved(userKey, problem, solved, catalog);
      setSnapshot(nextSnapshot);
    },
    [catalog, userKey],
  );

  const openTopic = useCallback(
    async (topic) => {
      const nextSnapshot = await progressService.openTopic(userKey, topic, catalog);
      setSnapshot(nextSnapshot);
    },
    [catalog, userKey],
  );

  const toggleSubtopicCompleted = useCallback(
    async (topic, subtopicId) => {
      const nextSnapshot = await progressService.toggleSubtopicCompleted(
        userKey,
        topic,
        subtopicId,
        catalog,
      );
      setSnapshot(nextSnapshot);
    },
    [catalog, userKey],
  );

  const monthMatrix = useCallback(
    (monthInput) => progressService.getMonthMatrix(userKey, monthInput),
    [userKey],
  );

  return {
    userKey,
    snapshot,
    refresh,
    refreshFromDB,
    recordAttempt,
    setProblemSolved,
    openTopic,
    toggleSubtopicCompleted,
    monthMatrix,
  };
}
