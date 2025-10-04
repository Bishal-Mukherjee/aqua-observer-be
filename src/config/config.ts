import dotenv from "dotenv";
dotenv.config({ quiet: true });

interface Config {
  port: number;
  nodeEnv: string;
  db: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  redis: {
    username: string;
    password: string;
    host: string;
    port: number;
  };
  twilio: {
    accountSid: string;
    authToken: string;
    serviceSid: string;
  };
  jwtSecret: string;
}

const dbConfig = () => {
  if (
    !process.env.DB_HOST ||
    !process.env.DB_PORT ||
    !process.env.DB_NAME ||
    !process.env.DB_USER ||
    !process.env.DB_PASSWORD
  ) {
    throw new Error("Missing database configuration");
  }

  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  };
};

const redisConfig = () => {
  if (
    !process.env.REDIS_USERNAME ||
    !process.env.REDIS_PASSWORD ||
    !process.env.REDIS_HOST ||
    !process.env.REDIS_PORT
  ) {
    throw new Error("Missing redis configuration");
  }

  return {
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  };
};

const twilioConfig = () => {
  if (
    !process.env.TWILIO_ACCOUNT_SID ||
    !process.env.TWILIO_AUTH_TOKEN ||
    !process.env.TWILIO_SERVICE_SID
  ) {
    throw new Error("Missing twilio configuration");
  }

  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    serviceSid: process.env.TWILIO_SERVICE_SID,
  };
};

export const config: Config = {
  port: Number(process.env.SERVER_PORT) || 8080,
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "secret",
  db: dbConfig(),
  redis: redisConfig(),
  twilio: twilioConfig(),
};
