"use client";

export const runtime = "nodejs"; // Important for Prisma

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useMemo, useState } from "react";
import { neon } from "@neondatabase/serverless";
import { Copy, Send, Trash } from "lucide-react";

// Add Worklog type
type Worklog = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
};

// Constants
const HOURLY_RATE = 6;
const GBP = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

// Helpers
function toHoursAndMinutes(totalHoursNum: number) {
  const h = Math.trunc(totalHoursNum || 0);
  let m = Math.round(((totalHoursNum || 0) - h) * 60);
  let H = h;
  if (m === 60) {
    H += 1;
    m = 0;
  }
  return { hours: H, minutes: m };
}
function formatDateDisplay(isoDate: string) {
  const d = new Date(isoDate);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
function formatTimeDisplay(isoString: string) {
  return new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, // enforce 24-hour format
  });
}

export default function Home() {
  // State
  const [date, setDate] = useState("");
  const [from, setFrom] = useState("18:00");
  const [to, setTo] = useState("19:00");
  const [submitting, setSubmitting] = useState(false);
  const [worklogs, setWorklogs] = useState<Worklog[]>([]);
  const [loading, setLoading] = useState(false);

  // Set today's date on mount
  useEffect(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    setDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  // Fetch worklogs from DB
  const fetchWorklogs = useCallback(async () => {
    setLoading(true);
    try {
      if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL environment variable is not defined");
      }
      const sql = neon(process.env.DATABASE_URL as string);
      const logs = await sql`
        SELECT "id", "date", "startTime", "endTime", "hours"
        FROM "Worklog"
        ORDER BY "date" DESC, "startTime" DESC
      `;
      setWorklogs(
        logs.map((log) => ({
          id: log.id,
          date: log.date,
          startTime: log.startTime,
          endTime: log.endTime,
          hours: Number(log.hours),
        })),
      );
    } catch (err) {
      console.error("Failed to fetch worklogs", err);
      toast.error("Failed to load worklogs");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchWorklogs();
  }, [fetchWorklogs]);

  // Group worklogs by month
  const groupedByMonth = useMemo(() => {
    const grouped: Record<
      string,
      { logs: Worklog[]; totalHours: number; displayMonth: string }
    > = {};
    for (const log of worklogs) {
      const d = new Date(log.date);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const key = `${y}-${m}`;
      if (!grouped[key]) {
        const displayMonth = new Date(`${y}-${m}-01`).toLocaleString(
          "default",
          {
            month: "long",
            year: "numeric",
          },
        );
        grouped[key] = { logs: [], totalHours: 0, displayMonth };
      }
      grouped[key].logs.push(log);
      grouped[key].totalHours += Number(log.hours) || 0;
    }
    // Sort logs per month by date desc
    Object.values(grouped).forEach((g) =>
      g.logs.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    );
    return grouped;
  }, [worklogs]);

  // Sorted month keys
  const monthKeys = useMemo(
    () =>
      Object.keys(groupedByMonth).sort(
        (a, b) => new Date(b + "-01").getTime() - new Date(a + "-01").getTime(),
      ),
    [groupedByMonth],
  );

  // Handle form submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!date || !from || !to) {
      toast.error("Please fill in date and time");
      return;
    }
    const timeRe = /^\d{2}:\d{2}$/;
    if (!timeRe.test(from) || !timeRe.test(to)) {
      toast.error("Invalid time format");
      return;
    }

    // Calculate hours (including overnight)
    const [fromH, fromM] = from.split(":").map(Number);
    const [toH, toM] = to.split(":").map(Number);
    const fromMinutes = fromH * 60 + fromM;
    const toMinutes = toH * 60 + toM;
    let hours = (toMinutes - fromMinutes) / 60;
    if (hours < 0) hours += 24;
    if (hours === 0) {
      toast.error("Duration cannot be zero");
      return;
    }

    setSubmitting(true);
    try {
      const id = uuidv4();
      const dateObj = new Date(date);
      const startTime = new Date(`${date}T${from}:00`);
      const endTime = new Date(`${date}T${to}:00`);
      if (endTime < startTime) endTime.setDate(endTime.getDate() + 1);

      if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL environment variable is not defined");
      }
      const sql = neon(process.env.DATABASE_URL as string);

      await sql`
        INSERT INTO "Worklog" ("id", "date", "startTime", "endTime", "hours")
        VALUES (${id}, ${dateObj}, ${startTime}, ${endTime}, ${hours})
      `;
      await fetchWorklogs();
      toast.success("Worklog saved");
      // Optionally reset fields:
      // setFrom("18:00"); setTo("19:00");
    } catch (err) {
      console.error("Failed to submit worklog", err);
      toast.error("Failed to save worklog");
    } finally {
      setSubmitting(false);
    }
  }

  // Delete worklog by id (optimistic)
  const handleDelete = async (id: string) => {
    const prev = worklogs;
    setWorklogs((w) => w.filter((x) => x.id !== id));
    try {
      if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL environment variable is not defined");
      }
      const sql = neon(process.env.DATABASE_URL as string);
      await sql`DELETE FROM "Worklog" WHERE "id" = ${id}`;
      toast.success("Deleted");
    } catch (err) {
      console.error("Failed to delete worklog", err);
      setWorklogs(prev); // revert on failure
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="flex min-h-screen min-w-screen flex-col items-center justify-center gap-8 p-2 pb-20 align-middle font-sans sm:gap-16 sm:p-8">
      <Card className="w-full max-w-xs sm:max-w-sm md:max-w-md">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Time Logger</CardTitle>
            <CardDescription>Enter the work hours</CardDescription>
            {/* {data} */}
          </CardHeader>
          <CardContent>
            {/* Date Input */}
            <div className="mb-4">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full"
              />
            </div>
            {/* Time Inputs Row */}
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div className="flex w-full flex-col">
                <Label htmlFor="from">From</Label>
                <Input
                  id="from"
                  type="time"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex w-full flex-col">
                <Label htmlFor="to">To</Label>
                <Input
                  id="to"
                  type="time"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="mt-2 flex justify-end">
            <Button
              type="submit"
              disabled={submitting}
              aria-label="Submit worklog"
              className="w-full sm:w-auto"
            >
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </CardFooter>
        </form>
      </Card>
      <div className="mt-8 w-full max-w-xs sm:max-w-2xl">
        <h2 className="mb-2 text-center text-lg font-bold sm:text-left">
          Worklog Entries
        </h2>
        <div className="overflow-x-auto">
          {(() => {
            if (loading) {
              return (
                <div className="border px-1 py-2 text-center text-gray-400">
                  Loading...
                </div>
              );
            }
            if (monthKeys.length === 0) {
              return (
                <div className="border px-1 py-2 text-center text-gray-400">
                  No data available
                </div>
              );
            }
            return monthKeys.map((monthKey) => {
              const group = groupedByMonth[monthKey];
              const { hours: H, minutes: M } = toHoursAndMinutes(
                group.totalHours,
              );
              return (
                <div key={monthKey} className="mb-8">
                  <div className="mb-2 font-semibold">{group.displayMonth}</div>
                  <table className="mb-2 min-w-full border text-xs sm:text-sm">
                    <thead>
                      <tr>
                        <th className="border px-1 py-1 sm:px-2">Date</th>
                        <th className="border px-1 py-1 sm:px-2">Start</th>
                        <th className="border px-1 py-1 sm:px-2">End</th>
                        <th className="border px-1 py-1 sm:px-2">Hours</th>
                        <th className="border px-1 py-1 sm:px-2">Action</th>
                        <th className="border px-1 py-1 sm:px-2">Copy</th>
                        <th className="border px-1 py-1 sm:px-2">Send</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.logs.map((log) => {
                        const displayDate = formatDateDisplay(log.date);
                        const startTimeStr = formatTimeDisplay(log.startTime);
                        const endTimeStr = formatTimeDisplay(log.endTime);
                        const copyText = `${displayDate} ${startTimeStr} - ${endTimeStr}`;
                        const whatsappText = encodeURIComponent(copyText);
                        const hm = toHoursAndMinutes(Number(log.hours));
                        return (
                          <tr key={log.id}>
                            <td className="border px-1 py-1 sm:px-2">
                              {displayDate}
                            </td>
                            <td className="border px-1 py-1 sm:px-2">
                              {startTimeStr}
                            </td>
                            <td className="border px-1 py-1 sm:px-2">
                              {endTimeStr}
                            </td>
                            <td className="border px-1 py-1 sm:px-2">
                              {`${hm.hours} hrs ${hm.minutes} mins`}
                            </td>
                            <td className="border px-1 py-1 sm:px-2">
                              <Button
                                variant="outline"
                                size="sm"
                                type="button"
                                aria-label="Delete entry"
                                className="flex items-center gap-1 text-red-600 hover:text-red-800"
                                onClick={() => handleDelete(log.id)}
                              >
                                <Trash className="mr-1 h-4 w-4" />
                              </Button>
                            </td>
                            <td className="border px-1 py-1 sm:px-2">
                              <Button
                                variant="outline"
                                size="sm"
                                type="button"
                                aria-label="Copy entry"
                                className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(
                                      copyText,
                                    );
                                    toast("Copied to clipboard!");
                                  } catch {
                                    toast.error("Copy failed");
                                  }
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </td>
                            <td className="border px-1 py-1 sm:px-2">
                              <Button
                                className="text-green-600 hover:underline"
                                type="button"
                                aria-label="Send via WhatsApp"
                                onClick={() => {
                                  try {
                                    const url = `https://wa.me/?text=${whatsappText}`;
                                    window.open(url, "_blank");
                                    toast("Opened WhatsApp!");
                                  } catch {
                                    toast.error("Unable to open WhatsApp");
                                  }
                                }}
                              >
                                <Send className="mr-1 inline h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td
                          className="border px-1 py-1 text-right font-bold sm:px-2"
                          colSpan={3}
                        >
                          Total
                        </td>
                        <td className="border px-1 py-1 font-bold sm:px-2">
                          {`${H} hrs ${M} mins`}
                        </td>
                        <td className="border px-1 py-1 sm:px-2"></td>
                        <td className="border px-1 py-1 sm:px-2"></td>
                        <td className="border px-1 py-1 sm:px-2"></td>
                      </tr>
                      <tr>
                        <td
                          className="border px-1 py-1 text-right font-bold sm:px-2"
                          colSpan={3}
                        >
                          Amount
                        </td>
                        <td className="border px-1 py-1 font-bold sm:px-2">
                          {GBP.format(group.totalHours * HOURLY_RATE)}
                        </td>
                        <td className="border px-1 py-1 sm:px-2"></td>
                        <td className="border px-1 py-1 sm:px-2"></td>
                        <td className="border px-1 py-1 sm:px-2"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              );
            });
          })()}
        </div>
      </div>
      <div>Made with ❤️ by {"Roshan"}</div>
    </div>
  );
}
