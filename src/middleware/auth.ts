/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

interface UserJwtPayload extends JwtPayload {
    id: string;
    role: string;
    email: string;
}

const auth = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      let token;

      // From Header (Postman / frontend)
      const header = req.headers?.authorization;
      if (header?.startsWith("Bearer ")) {
        token = header.split(" ")[1];
      }

      // From Cookie (browser)
      else if (req.cookies?.accessToken) {
        token = req.cookies.accessToken;
      }

      if (!token) {
        return res.status(401).json({ message: "No token provided" });
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET!
      ) as UserJwtPayload;

      req.user = {
        id: decoded.id,
        role: decoded.role,
        email: decoded.email,
      };

      console.log("REQ USER:", req.user);

      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    } catch (err: any) {
      return res.status(401).json({ message: err.message });
    }
  };
};

export default auth;

