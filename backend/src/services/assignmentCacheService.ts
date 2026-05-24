import { cacheClient } from "../config/redis.js";
import type { AssignmentStatus } from "../models/Assignment.js";

const ASSIGNMENT_LIST_TTL_SECONDS = 5 * 60;
const ASSIGNMENT_DETAIL_TTL_SECONDS = 10 * 60;
const ASSIGNMENT_STATUS_TTL_SECONDS = 60 * 60;
const CACHE_TIMEOUT_MS = 500;

export const assignmentListCacheKey = (teacherId: string) => `teacher:${teacherId}:assignments`;
export const assignmentDetailCacheKey = (assignmentId: string) => `assignment:${assignmentId}`;
export const assignmentStatusCacheKey = (assignmentId: string) => `assignment:${assignmentId}:status`;

const cacheTimeout = Symbol("cache-timeout");

const withCacheTimeout = async <T>(operation: Promise<T>, label: string): Promise<T | undefined> => {
  try {
    const result = await Promise.race<T | typeof cacheTimeout>([
      operation,
      new Promise<typeof cacheTimeout>((resolve) => {
        setTimeout(() => resolve(cacheTimeout), CACHE_TIMEOUT_MS);
      })
    ]);

    if (result === cacheTimeout) {
      console.warn(`Redis cache timed out during ${label}`);
      return undefined;
    }

    return result;
  } catch (error) {
    console.warn(`Redis cache failed during ${label}:`, error instanceof Error ? error.message : error);
    return undefined;
  }
};

export const getCachedJson = async <T>(key: string): Promise<T | null> => {
  const cached = await withCacheTimeout(cacheClient.get(key), `get ${key}`);
  if (!cached) {
    return null;
  }

  try {
    return JSON.parse(cached) as T;
  } catch (error) {
    console.warn(`Redis cache contained invalid JSON for ${key}:`, error instanceof Error ? error.message : error);
    void withCacheTimeout(cacheClient.del(key), `delete invalid ${key}`);
    return null;
  }
};

export const setCachedJson = async (key: string, value: unknown, ttlSeconds: number): Promise<void> => {
  await withCacheTimeout(cacheClient.set(key, JSON.stringify(value), "EX", ttlSeconds), `set ${key}`);
};

export const deleteCacheKeys = async (...keys: string[]): Promise<void> => {
  if (keys.length === 0) {
    return;
  }

  await withCacheTimeout(cacheClient.del(...keys), `delete ${keys.join(", ")}`);
};

export const getCachedAssignmentList = <T>(teacherId: string): Promise<T[] | null> =>
  getCachedJson<T[]>(assignmentListCacheKey(teacherId));

export const setCachedAssignmentList = (teacherId: string, assignments: unknown[]): Promise<void> =>
  setCachedJson(assignmentListCacheKey(teacherId), assignments, ASSIGNMENT_LIST_TTL_SECONDS);

export const getCachedAssignment = <T>(assignmentId: string): Promise<T | null> =>
  getCachedJson<T>(assignmentDetailCacheKey(assignmentId));

export const setCachedAssignment = (assignmentId: string, assignment: unknown): Promise<void> =>
  setCachedJson(assignmentDetailCacheKey(assignmentId), assignment, ASSIGNMENT_DETAIL_TTL_SECONDS);

export const setCachedAssignmentStatus = (assignmentId: string, status: AssignmentStatus): Promise<void> =>
  withCacheTimeout(
    cacheClient.set(assignmentStatusCacheKey(assignmentId), status, "EX", ASSIGNMENT_STATUS_TTL_SECONDS),
    `set ${assignmentStatusCacheKey(assignmentId)}`
  ).then(() => undefined);

export const invalidateAssignmentCaches = (teacherId: string, assignmentId?: string): Promise<void> => {
  const keys = [assignmentListCacheKey(teacherId)];
  if (assignmentId) {
    keys.push(assignmentDetailCacheKey(assignmentId), assignmentStatusCacheKey(assignmentId));
  }

  return deleteCacheKeys(...keys);
};
