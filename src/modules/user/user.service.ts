import { prisma } from "../../app/lib/prisma.js";
import bcrypt from "bcrypt";

interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: "USER" | "ADMIN";
}

interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  role?: "USER" | "ADMIN";
}

/* =========================
   CREATE USER
========================= */
const createUser = async (data: CreateUserInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser)
    throw { statusCode: 409, message: "User already exists" };

  const hashedPassword = await bcrypt.hash(data.password, 10);

  return prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
      role: data.role ?? "USER",
    },
  });
};

/* =========================
   GET ALL USERS
========================= */
const getAllUsers = async () => {
  return prisma.user.findMany({
    where: {
      isDeleted: false,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      isBanned: true, // ✅ ADDED
    },
  });
};

/* =========================
   GET USER BY ID
========================= */
const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      isBanned: true, // ✅ ADDED
    },
  });

  if (!user) throw { statusCode: 404, message: "User not found" };

  return user;
};

/* =========================
   UPDATE USER
========================= */
const updateUser = async (id: string, data: UpdateUserInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new Error("User not found");
  }

  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }

  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      isBanned: true, // ✅ ADDED
    },
  });
};

/* =========================
   DELETE USER (SOFT DELETE FIX RECOMMENDED)
========================= */
const deleteUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // ⚠️ better: soft delete instead of hard delete
  return prisma.user.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
    },
  });
};

/* =========================
   BAN USER (NEW)
========================= */
const banUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw { statusCode: 404, message: "User not found" };
  }

  return prisma.user.update({
    where: { id },
    data: {
      isBanned: true,
      bannedAt: new Date(), // optional but recommended
    },
  });
};

/* =========================
   UNBAN USER (OPTIONAL BUT USEFUL)
========================= */
const unbanUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw { statusCode: 404, message: "User not found" };
  }

  return prisma.user.update({
    where: { id },
    data: {
      isBanned: false,
      bannedAt: null,
    },
  });
};

/* =========================
   EXPORT
========================= */
export const userService = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  banUser,     
  unbanUser,   
};