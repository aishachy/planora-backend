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
            const token = req.cookies?.accessToken;
            if(!token) {
                return res.status(401).json({ message: "No token provided" });
            }
            // const header = req.headers?.authorization;
            // console.log("REQ HEADERS:", req.headers);

            // if (!header?.startsWith("Bearer ")) {
            //     return res.status(401).json({ message: "No token provided" });
            // }

            // const token = header.split(" ")[1];
            const decoded = jwt.verify(token!, process.env.JWT_SECRET!) as UserJwtPayload;

            req.user = { id: decoded.id, role: decoded.role, email: decoded.email, };

            console.log("REQ USER:", req.user);

            if (roles.length && !roles.includes(decoded.role)) {
                return res.status(403).json({ message: "Forbidden" });
            }

            next();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            return res.status(401).json({ message: err.message });
        }
    };
};

export default auth;

