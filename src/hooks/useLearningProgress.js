import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import progressService from "../services/progressService";

export default function useLearningProgress({ user, topics = [], problems = [] }) {
  const userKey = useMemo(() => progressService.getUserKey(user), [user]);
  const catalog = useMemo(() => ({ topics, problems }), [topics, problems]);
  const [snapshot, setSnapshot] = useState(() =>
    progressService.getSnapshot(userKey, catalog),
  );

  // Track which DB-solved arrays we've already synced to avoid infinite loops
  const syncedRef = useRef(null);

  // Sync DB-solved problems into localStorage whenever the user's solvedProblems changes.
  // This ensures a logged-in user sees their solved history even on a new device.
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

  const recordAttempt = useCallback(
    async (problem) => {
      const nextSnapshot = await progressService.recordAttempt(userKey, problem, catalog);
      setSnapshot(nextSnapshot);
    },
    [catalog, userKey],
  );

  const setProblemSolved = useCallback(
    async (problem, solved) => {
      const nextSnapshot = await progressService.setProblemSolved(
        userKey,
        problem,
        solved,
        catalog,
      );
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
    recordAttempt,
    setProblemSolved,
    openTopic,
    toggleSubtopicCompleted,
    monthMatrix,
  };
}
