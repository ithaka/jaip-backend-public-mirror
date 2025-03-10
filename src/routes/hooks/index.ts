import { User } from "../../types/entities";
import { Session } from "../../types/sessions";

declare module "fastify" {
  interface FastifyRequest {
    user: User;
    session: Session;
    subdomain: string;
    is_authenticated_admin: boolean;
    is_authenticated_student: boolean;
  }
}

export * from "./requirements_guard";
export * from "./validate";
export * from "./route_guard";
