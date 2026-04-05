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

const createUser = async (data: CreateUserInput) => {
  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser)
     throw { statusCode: 409, message: "User already exists" };

  const hashedPassword = await bcrypt.hash(data.password, 10);

  return prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
      role: data.role ?? "USER"
    },
  });
};

const getAllUsers = async () => {
  return prisma.user.findMany({
    select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true, 
        createdAt: true 
    },
  });
};

const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true, 
        createdAt: true 
    },
  });
  if (!user) 
    throw { statusCode: 404, message: "User not found" };
  return user;
};

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
        createdAt: true 
    },
  });
};

const deleteUser = async (id: string) => {
    const user = await prisma.user.findUnique({
        where: { id },
    }); 
    if (!user) {
        throw new Error("User not found");
    }
    
  await prisma.user.delete(
    { where: { id } });
  return { message: "User deleted successfully" };
};

export const userService = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};