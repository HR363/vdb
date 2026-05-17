import dotenv from 'dotenv';

dotenv.config({ override: true });

export default {
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_IEBTupC1Qo9W@ep-plain-boat-alg7kbq7.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  },
  migrations: {
    seed: 'ts-node prisma/seed.ts',
  },
};
