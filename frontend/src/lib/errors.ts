import { ZodError } from "zod";
import { logServerError } from "@/lib/log";

export class AuthError extends Error {
  constructor(
    message: string,
    public status = 401,
  ) {
    super(message);
  }
}

export function toErrorMessage(error: unknown) {
  if (error instanceof AuthError) return error.message;
  if (error instanceof ZodError) return "Invalid input.";
  if (error instanceof Error) {
    const message = error.message;
    if (
      /prisma|P\d{4}|ECONNREFUSED|ENOTFOUND|EPERM|DATABASE_URL|passwordHash|node_modules|\\\\Users\\\\|\/home\/|\/var\/|secret key|api[_-]?key|unique constraint|foreign key|invalid `prisma|sqlite|postgres/i.test(
        message,
      ) ||
      message.length > 180
    ) {
      logServerError("action_error");
      return "Something went wrong.";
    }
    return message;
  }
  return "Something went wrong.";
}
