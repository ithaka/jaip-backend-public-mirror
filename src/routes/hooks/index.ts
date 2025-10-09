import { User } from "../../types/entities.js";
import { Session } from "../../types/sessions.js";

declare module "fastify" {
  interface FastifyRequest {
    user: User;
    session: Session;
    subdomain: string;
    is_authenticated_admin: boolean;
    is_authenticated_student: boolean;
  }
}

export * from "./requirements_guard.js";
export * from "./validate.js";
export * from "./route_guard.js";
