import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool } from "@neondatabase/serverless";

const neon: any = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaNeon(neon);

//@ts-ignore
export const prisma = new PrismaClient({ adapter });
