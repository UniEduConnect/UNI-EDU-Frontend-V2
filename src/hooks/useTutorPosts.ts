import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as svc from "@/services/tutorPosts";
import type { AcceptApplicationRequest, CreateTutorPostRequest, TutorPostListQuery } from "@/types/api";

/** Open tutor posts a student can browse ("tutors looking for students"). */
export function useOpenTutorPosts(query: TutorPostListQuery = {}) {
  const result = useQuery({
    queryKey: ["tutor-posts-open", query],
    queryFn: () => svc.getOpenTutorPosts(query),
  });
  return { ...result, posts: result.data?.items ?? [] };
}

/** A tutor's own posts. */
export function useMyTutorPosts() {
  const result = useQuery({ queryKey: ["tutor-posts-mine"], queryFn: () => svc.getMyTutorPosts() });
  return { ...result, posts: result.data ?? [] };
}

export function useCreateTutorPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTutorPostRequest) => svc.createTutorPost(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tutor-posts-mine"] }),
  });
}

export function useCloseTutorPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => svc.closeTutorPost(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tutor-posts-mine"] });
      qc.invalidateQueries({ queryKey: ["tutor-posts-open"] });
    },
  });
}

/** Student registers on a tutor's post. */
export function useApplyTutorPost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => svc.applyTutorPost(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tutor-posts-open"] }),
  });
}

/** Tutor's pending applications. */
export function useTutorPostApplications() {
  const result = useQuery({
    queryKey: ["tutor-post-applications"],
    queryFn: () => svc.getTutorPostApplications(),
  });
  return { ...result, applications: result.data ?? [] };
}

/** Tutor accepts an application after passing an AI test. */
export function useAcceptTutorPostApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ appId, payload }: { appId: string; payload: AcceptApplicationRequest }) =>
      svc.acceptTutorPostApplication(appId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tutor-post-applications"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
