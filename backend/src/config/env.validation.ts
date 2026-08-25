const NODE_ENVS = ['development', 'production', 'test'] as const;

export type NodeEnv = (typeof NODE_ENVS)[number];

export interface EnvironmentVariables {
  NODE_ENV: NodeEnv;
  PORT: number;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const errors: string[] = [];

  // Values coming from process.env / .env files are always strings.
  const nodeEnv =
    typeof config.NODE_ENV === 'string' && config.NODE_ENV.length > 0
      ? config.NODE_ENV
      : 'development';
  if (!NODE_ENVS.includes(nodeEnv as NodeEnv)) {
    errors.push(
      `NODE_ENV must be one of: ${NODE_ENVS.join(', ')} (got "${nodeEnv}")`,
    );
  }

  const rawPort = typeof config.PORT === 'string' ? config.PORT : undefined;
  const port = rawPort === undefined || rawPort === '' ? 3000 : Number(rawPort);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errors.push(
      `PORT must be an integer between 1 and 65535 (got "${rawPort ?? ''}")`,
    );
  }

  const databaseUrl = config.DATABASE_URL;
  if (typeof databaseUrl !== 'string' || databaseUrl.length === 0) {
    errors.push('DATABASE_URL is required');
  } else if (!/^postgres(ql)?:\/\//.test(databaseUrl)) {
    errors.push(
      'DATABASE_URL must be a PostgreSQL connection string (postgresql://user:password@host:port/database)',
    );
  }

  const jwtSecret = config.JWT_SECRET;
  if (typeof jwtSecret !== 'string' || jwtSecret.length === 0) {
    errors.push('JWT_SECRET is required');
  } else if (jwtSecret.length < 16) {
    errors.push('JWT_SECRET must be at least 16 characters long');
  }

  const jwtExpiresIn =
    typeof config.JWT_EXPIRES_IN === 'string' &&
    config.JWT_EXPIRES_IN.length > 0
      ? config.JWT_EXPIRES_IN
      : '1h';

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n- ${errors.join('\n- ')}`);
  }

  return {
    NODE_ENV: nodeEnv as NodeEnv,
    PORT: port,
    DATABASE_URL: databaseUrl as string,
    JWT_SECRET: jwtSecret as string,
    JWT_EXPIRES_IN: jwtExpiresIn,
  };
}
