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
import { useCallback, useEffect, useState } from "react";
import { neon } from "@neondatabase/serverless";

// Add Worklog type
type Worklog = {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
};

export default function Home() {
  const [, setToday] = useState("");
  const [date, setDate] = useState("");
  const [from, setFrom] = useState("18:00");
  const [to, setTo] = useState("19:00");
  const [submitting, setSubmitting] = useState(false);
  const [worklogs, setWorklogs] = useState<Worklog[]>([]);

  useEffect(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    setToday(`${yyyy}-${mm}-${dd}`);
    setDate(`${yyyy}-${mm}-${dd}`);
  }, []);

  // Fetch worklogs from DB
  const fetchWorklogs = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchWorklogs();
  }, [fetchWorklogs]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("Date:", date);
    console.log("From:", from);
    console.log("To:", to);

    setSubmitting(true);
    try {
      // Calculate hours
      const [fromH, fromM] = from.split(":").map(Number);
      const [toH, toM] = to.split(":").map(Number);
      const fromMinutes = fromH * 60 + fromM;
      const toMinutes = toH * 60 + toM;
      let hours = (toMinutes - fromMinutes) / 60;
      if (hours < 0) hours += 24; // handle overnight

      // Prepare values
      const id = uuidv4();
      const dateObj = new Date(date);

      // Combine date and time for startTime and endTime
      const startTime = new Date(`${date}T${from}:00`);
      const endTime = new Date(`${date}T${to}:00`);
      // If endTime is before startTime, add 1 day to endTime (overnight)
      if (endTime < startTime) {
        endTime.setDate(endTime.getDate() + 1);
      }

      if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL environment variable is not defined");
      }
      const sql = neon(process.env.DATABASE_URL as string);

      await sql`
        INSERT INTO "Worklog" ("id", "date", "startTime", "endTime", "hours")
        VALUES (${id}, ${dateObj}, ${startTime}, ${endTime}, ${hours})
      `;
      await fetchWorklogs();
      // Optionally reset form or show success
    } catch (err) {
      console.error("Failed to submit worklog", err);
    } finally {
      setSubmitting(false);
    }
  }

  // Delete worklog by id
  const handleDelete = async (id: string) => {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not defined");
    }
    const sql = neon(process.env.DATABASE_URL as string);
    await sql`DELETE FROM "Worklog" WHERE "id" = ${id}`;
    await fetchWorklogs();
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
          <table className="min-w-full border text-xs sm:text-sm">
            <thead>
              <tr>
                <th className="border px-1 py-1 sm:px-2">Date</th>
                <th className="border px-1 py-1 sm:px-2">Start</th>
                <th className="border px-1 py-1 sm:px-2">End</th>
                <th className="border px-1 py-1 sm:px-2">Hours</th>
                <th className="border px-1 py-1 sm:px-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {[...worklogs]
                .sort(
                  (a: Worklog, b: Worklog) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime(),
                ) // Sorts by date descending
                .map((log) => (
                  <tr key={log.id}>
                    <td className="border px-1 py-1 sm:px-2">
                      {(() => {
                        const date = new Date(log.date);
                        const day = String(date.getDate()).padStart(2, "0");
                        const month = String(date.getMonth() + 1).padStart(
                          2,
                          "0",
                        );
                        const year = date.getFullYear();
                        return `${day}/${month}/${year}`;
                      })()}
                    </td>
                    <td className="border px-1 py-1 sm:px-2">
                      {new Date(log.startTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="border px-1 py-1 sm:px-2">
                      {new Date(log.endTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="border px-1 py-1 sm:px-2">
                      {Number(log.hours).toFixed(2)} hrs
                    </td>
                    <td className="border px-1 py-1 sm:px-2">
                      <button
                        className="text-red-600 hover:underline"
                        onClick={() => handleDelete(log.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              {worklogs.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="border px-1 py-1 text-center text-gray-400 sm:px-2"
                  >
                    No data available
                  </td>
                </tr>
              )}
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
                  {worklogs
                    .reduce((sum, log) => sum + (Number(log.hours) || 0), 0)
                    .toFixed(2)}{" "}
                  hrs
                </td>
                <td className="border px-1 py-1 sm:px-2"></td>
              </tr>
              <tr>
                <td
                  className="border px-1 py-1 text-right font-bold sm:px-2"
                  colSpan={3}
                >
                  Total Amount
                </td>
                <td className="border px-1 py-1 font-bold sm:px-2">
                  {(
                    worklogs.reduce(
                      (sum, log) => sum + (Number(log.hours) || 0),
                      0,
                    ) * 6
                  ).toFixed(2)}{" "}
                  £
                </td>
                <td className="border px-1 py-1 sm:px-2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
