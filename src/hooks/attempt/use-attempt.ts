import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getActiveAttempt,
  getAttemptResult,
  getAttemptReview,
  getAttemptSession,
  listAvailableExams,
  listMyAttempts,
  recordFullscreenViolation,
  saveAnswer,
  setFlag,
  startAttempt,
  submitAttempt,
  type SubmitReason,
} from "@/services/attempt";

export function useAvailableExams() {
  return useQuery({ queryKey: ["available-exams"], queryFn: listAvailableExams, staleTime: 30_000 });
}

export function useMyAttempts() {
  return useQuery({ queryKey: ["my-attempts"], queryFn: listMyAttempts, staleTime: 10_000 });
}

export function useActiveAttempt(examId: string) {
  return useQuery({
    queryKey: ["active-attempt", examId],
    queryFn: () => getActiveAttempt(examId),
    enabled: Boolean(examId),
  });
}

/** Sesi attempt lengkap (snapshot + jawaban). Sumber recovery setelah refresh. */
export function useAttemptSession(attemptId: string) {
  return useQuery({
    queryKey: ["attempt-session", attemptId],
    queryFn: () => getAttemptSession(attemptId),
    enabled: Boolean(attemptId),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export function useStartAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (examId: string) => startAttempt(examId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-attempts"] });
    },
  });
}

export function useSaveAnswer() {
  return useMutation({ mutationFn: saveAnswer });
}

export function useSetFlag() {
  return useMutation({ mutationFn: setFlag });
}

export function useRecordViolation() {
  return useMutation({ mutationFn: (attemptId: string) => recordFullscreenViolation(attemptId) });
}

export function useSubmitAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ attemptId, reason }: { attemptId: string; reason: SubmitReason }) =>
      submitAttempt(attemptId, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-attempts"] });
      void queryClient.invalidateQueries({ queryKey: ["attempt-session"] });
    },
  });
}
