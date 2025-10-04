import axios from "axios";
import { config } from "@/config/config";

const twilioServiceUrl = `https://verify.twilio.com/v2/Services/${config.twilio.serviceSid}`;

export const sendCode = async (phoneNumber: string) => {
  if (!phoneNumber) throw new Error("Phone number is required");

  const url = `${twilioServiceUrl}/Verifications`;

  try {
    const response = await axios.post(
      url,
      new URLSearchParams({
        To: phoneNumber,
        Channel: "sms",
      }),
      {
        auth: {
          username: config.twilio.accountSid,
          password: config.twilio.authToken,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    return response.data;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

export const verifyCode = async (phoneNumber: string, code: string) => {
  if (!phoneNumber || !code)
    throw new Error("Phone number and code are required");

  const url = `${twilioServiceUrl}/VerificationCheck`;

  try {
    const response = await axios.post(
      url,
      new URLSearchParams({
        To: phoneNumber,
        Code: code,
      }),
      {
        auth: {
          username: config.twilio.accountSid,
          password: config.twilio.authToken,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    return response.data?.valid;
  } catch (err) {
    console.error(err);
    throw err;
  }
};
