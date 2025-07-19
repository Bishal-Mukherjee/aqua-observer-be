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

    return response.data;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

// const twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);

// export const sendCode = async (phoneNumber: string) => {
//   if (!phoneNumber) {
//     throw new Error("Phone number is required");
//   }

//   try {
//     const response = await twilioClient.verify.v2
//       .services(config.twilio.serviceSid)
//       .verifications.create({ to: phoneNumber, channel: "sms" });
//     return response;
//   } catch (err) {
//     console.log(err);
//     throw err;
//   }
// };

// export const verifyCode = async (phoneNumber: string, code: string) => {
//   if (!phoneNumber || !code) {
//     throw new Error("Phone number and code are required");
//   }

//   try {
//     const response = await twilioClient.verify.v2
//       .services(config.twilio.serviceSid)
//       .verificationChecks.create({ to: phoneNumber, code });
//     return response;
//   } catch (err) {
//     console.log(err);
//     throw err;
//   }
// };
