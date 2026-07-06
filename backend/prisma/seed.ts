import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });
const PASSWORD = process.env.SEED_USER_PASSWORD || 'password123';
const SALT_ROUNDS = 10;

const assert = (condition: boolean, message: string) => {
    if (!condition) throw new Error(`❌ ${message}`);
    console.log(`✅ ${message}`)
}

async function main() {

    await prisma.user.deleteMany();
    await prisma.usage.deleteMany();
    await prisma.transcript.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.processingJob.deleteMany();
    await prisma.video.deleteMany();

/// Create User /////////////////////////////////////////////////////////////////

    const hashPassword = await bcrypt.hash(PASSWORD, SALT_ROUNDS);
    const user = await prisma.user.create({
        data: {
            name: 'user 1',
            email: 'user1@example.com',
            password: hashPassword,
        }
    })

    assert(!!user.id, `User created with cuid: ${user.id}`)


}

main()
