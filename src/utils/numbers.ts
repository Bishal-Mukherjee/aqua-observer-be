/**
 * Generates a 6-digit One-Time Password (OTP)
 * @returns A string containing a 6-digit numeric OTP
 */
export const generateOTP = (): string => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);

  const otp = array[0] % 1000000;
  return otp.toString().padStart(6, "0");
};
