-- CreateTable
CREATE TABLE "Worklog" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "hours" DOUBLE PRECISION,

    CONSTRAINT "Worklog_pkey" PRIMARY KEY ("id")
);
