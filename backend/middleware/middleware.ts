import { verify } from "hono/jwt";
import { Context, Next } from "hono";


export const authmiddleware = async (c: Context, next: Next) => { 

    const bearer = c.req.header('Authorization');
    if (!bearer) {
      return c.json({ msg: "Invalid user request Not authorized" }, 401);
    }
    const words = bearer.split(" ");
    const jwtToken = words[1];
  
    const decodedvalue = await verify(jwtToken, c.env.JWT_SECRET) as { userId: string };
    if (!decodedvalue.userId) {
      return c.json({ msg: "Invalid user request not authorized" }, 401);
    } else {
      c.set('userId', decodedvalue.userId);
      await next();
    }
  }