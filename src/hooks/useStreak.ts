"use client";

import { useState, useEffect } from "react";
import { localDb } from "@/db/localDb";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  todayCompleted: boolean;
}

export function useStreak(): StreakData {
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    todayCompleted: false,
  });

  useEffect(() => {
    async function calculateStreak() {
      try {
        const sessions = await localDb.sessions.toArray();
        if (sessions.length === 0) {
          setStreak({ currentStreak: 0, longestStreak: 0, todayCompleted: false });
          return;
        }

        // Get unique dates (YYYY-MM-DD) from sessions, sorted descending
        const uniqueDates = [...new Set(
          sessions
            .map(s => {
              try {
                return new Date(s.completedAt).toISOString().split('T')[0];
              } catch {
                return null;
              }
            })
            .filter(Boolean) as string[]
        )].sort((a, b) => b.localeCompare(a));

        if (uniqueDates.length === 0) {
          setStreak({ currentStreak: 0, longestStreak: 0, todayCompleted: false });
          return;
        }

        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const todayCompleted = uniqueDates[0] === today;

        // Calculate current streak
        let currentStreak = 0;
        let checkDate = todayCompleted ? today : yesterday;
        
        for (const date of uniqueDates) {
          if (date === checkDate) {
            currentStreak++;
            // Move to previous day
            const prev = new Date(checkDate);
            prev.setDate(prev.getDate() - 1);
            checkDate = prev.toISOString().split('T')[0];
          } else if (date < checkDate) {
            break; // Gap found, streak broken
          }
        }

        // If the most recent session is older than yesterday, streak is 0
        if (!todayCompleted && uniqueDates[0] !== yesterday) {
          currentStreak = 0;
        }

        // Calculate longest streak ever
        let longestStreak = 0;
        let tempStreak = 1;
        const sortedAsc = [...uniqueDates].sort();
        for (let i = 1; i < sortedAsc.length; i++) {
          const prevDate = new Date(sortedAsc[i - 1]);
          const currDate = new Date(sortedAsc[i]);
          const diffDays = (currDate.getTime() - prevDate.getTime()) / 86400000;
          if (diffDays === 1) {
            tempStreak++;
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            tempStreak = 1;
          }
        }
        longestStreak = Math.max(longestStreak, tempStreak);

        setStreak({ currentStreak, longestStreak, todayCompleted });
      } catch (err) {
        console.error('Error calculating streak:', err);
      }
    }

    calculateStreak();
  }, []);

  return streak;
}
