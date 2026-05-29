import 'dotenv/config';
import { z } from 'zod';

const EnvSchema = z
  .object({
    HOST: z.string().trim().min(1).default('0.0.0.0'),
    PORT: z.coerce.number().int().min(1).max(65535).default(8080),
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
  })
  .transform((env) => ({
    host: env.HOST,
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
  }));

export type RuntimeConfig = z.infer<typeof EnvSchema>;

export const loadConfig = (
  source: NodeJS.ProcessEnv = process.env,
): RuntimeConfig => {
  const parsed = EnvSchema.safeParse(source);

  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');

    throw new Error(`Invalid environment configuration: ${message}`);
  }

  return parsed.data;
};
