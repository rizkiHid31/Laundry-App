import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });

// Serializable isolation makes Postgres detect write-skew races (a check-then-act
// sequence read by two concurrent transactions before either commits) instead of
// letting both silently succeed. The loser aborts with P2034; retrying once lets it
// re-run the check against the now-committed state and surface the correct business
// error, instead of a raw constraint violation.
const SERIALIZATION_RETRIES = 1;

export const runSerializable = async <T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(fn, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      const isConflict = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';
      if (isConflict && attempt < SERIALIZATION_RETRIES) continue;
      throw error;
    }
  }
};
