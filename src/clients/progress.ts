export type SplitAssignmentStatus = "upcoming" | "in-progress" | "completed";

export interface SplitProgress {
  percent: number; // 0-100
  status: SplitAssignmentStatus;
  weekLabel: string; // e.g. "Week 3 of 8"
  endDate: Date;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function splitProgress(
  startDate: string,
  durationWeeks: number,
  now: Date = new Date(),
): SplitProgress {
  const start = new Date(startDate);
  const totalDays = durationWeeks * 7;
  const endDate = new Date(start.getTime() + totalDays * MS_PER_DAY);
  const elapsedDays = Math.floor((now.getTime() - start.getTime()) / MS_PER_DAY);

  if (elapsedDays < 0) {
    return { percent: 0, status: "upcoming", weekLabel: `Starts in ${-elapsedDays}d`, endDate };
  }
  if (elapsedDays >= totalDays) {
    return {
      percent: 100,
      status: "completed",
      weekLabel: `${durationWeeks}/${durationWeeks} weeks`,
      endDate,
    };
  }

  const percent = totalDays > 0 ? Math.round((elapsedDays / totalDays) * 100) : 100;
  const currentWeek = Math.min(durationWeeks, Math.floor(elapsedDays / 7) + 1);
  return {
    percent,
    status: "in-progress",
    weekLabel: `Week ${currentWeek} of ${durationWeeks}`,
    endDate,
  };
}
