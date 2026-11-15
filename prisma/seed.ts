import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = process.env.NEXORA_OWNER_USERNAME || "owner";
  const password = process.env.NEXORA_OWNER_PASSWORD || "Shellybr@123";

  let owner = await prisma.platformOwner.findUnique({ where: { username } });
  if (!owner) {
    const passwordHash = await bcrypt.hash(password, 12);
    owner = await prisma.platformOwner.create({
      data: { username, passwordHash },
    });
    console.log("Platform Owner created:", username);
  } else {
    console.log("Platform Owner already exists");
  }

  // Optional demo company for local testing
  const demoSlug = "demo-mfi";
  let company = await prisma.company.findUnique({ where: { slug: demoSlug } });
  if (!company) {
    const tempPass = "DemoTemp1!";
    const passwordHash = await bcrypt.hash(tempPass, 12);
    company = await prisma.company.create({
      data: {
        name: "Demo Microfinance",
        slug: demoSlug,
        gmail: "demo@gmail.com",
        address: "Lagos, Nigeria",
        passwordHash,
        tempPassword: tempPass,
        mustChangePassword: true,
        status: "ACTIVE",
      },
    });
    console.log("Demo company created:", demoSlug, "temp password:", tempPass);
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
