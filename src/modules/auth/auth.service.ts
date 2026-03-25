/* eslint-disable @typescript-eslint/no-unused-vars */
import bcrypt from "bcrypt";
import generateToken from "../../utils/jwt";
import { prisma } from "../../app/lib/prisma";



interface RegisterInput {
    name: string;
    email: string;
    password: string;
    role?: "USER" | "ADMIN";
}

interface LoginInput {
    email: string;
    password: string;
}


const registerUser = async (data: RegisterInput) => {

    const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
    });

    if (existingUser) {
        throw { statusCode: 409, message: "User already exists" };
    }
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: hashedPassword,
            role: data.role ?? "USER",
        },
    });


    const token = generateToken({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    })

    const { password, ...safeUser } = user;

    return { token, user: safeUser };
};

const loginUser = async (data: LoginInput) => {
    const user = await prisma.user.findUnique({
        where: { email: data.email }
    })

    if (!user) {
        throw { statusCode: 404, message: "User not found" };
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
        throw { statusCode: 401, message: "Invalid email or password" };
    }

    const token = generateToken({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    })

    const { password, ...safeUser } = user;

    return { token, user: safeUser };
}

const currentUser = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
        },
    });

    if (!user) {
        throw new Error("User not found");
    }

    return user;
};

export const authService = {
    loginUser,
    registerUser,
    currentUser
}