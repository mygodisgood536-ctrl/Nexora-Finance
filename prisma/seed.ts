import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = process.env.NEXORA_OWNER_USERNAME || "owner";
  const password = process.env.NEXORA_OWNER_PASSWORD || "Shellybr@123";

  const existing = await prisma.platformOwner.findUnique({ where: { username } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.platformOwner.create({
      data: { username, passwordHash },
    });
    console.log("Platform Owner created:", username);
  } else {
    console.log("Platform Owner already exists");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
