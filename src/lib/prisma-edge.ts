import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const poolConfig = { connectionString: process.env.DATABASE_URL };
const adapter = new PrismaNeon(poolConfig);

export const prisma = new PrismaClient({ adapter });
