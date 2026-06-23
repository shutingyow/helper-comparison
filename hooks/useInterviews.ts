"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { InterviewStatus, InterviewType } from "@/lib/types";
import type { Id } from "@/convex/_generated/dataModel";

export function useUpcomingInterviews() {
  return useQuery(api.candidates.listUpcomingInterviews, { now: Date.now() });
}

export function useScheduleInterview() {
  return useMutation(api.candidates.scheduleInterview);
}

export function useUpdateInterview() {
  return useMutation(api.candidates.updateInterview);
}

export function useCancelInterview() {
  return useMutation(api.candidates.cancelInterview);
}

export type ScheduleInterviewArgs = {
  candidateId: Id<"candidates">;
  interviewScheduledAt: number;
  interviewType: InterviewType;
  interviewLocationOrLink?: string;
  interviewNotes?: string;
};

export type UpdateInterviewArgs = {
  candidateId: Id<"candidates">;
  interviewScheduledAt?: number;
  interviewType?: InterviewType;
  interviewLocationOrLink?: string;
  interviewNotes?: string;
  interviewStatus?: InterviewStatus;
};
