
import { PrismaClient } from "@prisma/client/extension";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding started...");

  // Hash password
  const hashedPassword = await bcrypt.hash("123456", 10);

  // =========================
  // ADMIN
  // =========================
  const adminExists = await prisma.user.findUnique({
    where: { email: "admin@gmail.com" },
  });

  if (!adminExists) {
    await prisma.user.create({
      data: {
        name: "Admin",
        email: "admin@gmail.com",
        password: hashedPassword,
        role: "ADMIN",
        phone: "01700000000",
      },
    });
    console.log("✅ Admin created");
  } else {
    console.log("⚠️ Admin already exists");
  }

  // =========================
  //  USERS
  // =========================
  const users: Awaited<ReturnType<typeof prisma.user.create>>[] = [];

  for (let i = 1; i <= 10; i++) {
    const email = `user${i}@test.com`;

    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: `User ${i}`,
          email,
          password: hashedPassword,
          role: "USER",
          phone: `0170000000${i}`,
        },
      });
    }

    users.push(user);
  }

  console.log("✅ Users ready");

  // =========================
  // EVENTS
  // =========================
  const events: Awaited<ReturnType<typeof prisma.event.create>>[] = [];

  for (let i = 1; i <= 10; i++) {
    const event = await prisma.event.create({
      data: {
        title: `Event ${i}`,
        description: `This is event ${i}`,
        date: new Date(2026, 3, i),
        time: `${10 + i}:00 AM`,
        venue: ["Dhaka", "Sylhet", "Chittagong"][i % 3],
        isPublic: i % 2 === 0,
        isPaid: i % 3 === 0,
        fee: i % 3 === 0 ? i * 10 : null,
        organizerId: users[i % users.length].id,
      },
    });

    events.push(event);
  }

  console.log("✅ Events created");

  // =========================
  // REGISTRATIONS
  // =========================
  for (let i = 0; i < events.length; i++) {
    await prisma.registration.create({
      data: {
        userId: users[i % users.length].id,
        eventId: events[i].id,
        status: "PENDING",
      },
    });
  }

  console.log("✅ Registrations created");

  // =========================
  // ⭐ REVIEWS
  // =========================
  for (let i = 0; i < events.length; i++) {
    await prisma.review.create({
      data: {
        userId: users[i % users.length].id,
        eventId: events[i].id,
        rating: (i % 5) + 1,
        comment: `This is review for event ${i + 1}`,
      },
    });
  }

  console.log("✅ Reviews created");

  console.log("🎉 Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });