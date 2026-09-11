import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("Admin@12345", 12);

  const user = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      fullname: "System Administrator",
      username: "admin",
      email: "admin@example.com",
      password,
      position: "Administrator",
      role: "admin",
      avatarPath: null
    }
  });

  console.log("Seeded user:", user.username);
  console.log("Seed password: Admin@12345");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
