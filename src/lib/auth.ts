import { Role } from "../generated/prisma/enums";


export const auth = {
  jwt: {
    secret: process.env.JWT_SECRET as string,
    expiresIn: "7d",
  },

  password: {
    saltRounds: 10,
  },

  cookie: {
    name: "accessToken",
    options: {
      httpOnly: true,
      secure: false,
      sameSite: "lax" as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  },

  roles: {
    USER: "USER" as Role,
    ADMIN: "ADMIN" as Role,
  },

  defaultUser: {
    role: "USER" as Role,
    isDeleted: false,
  },
};