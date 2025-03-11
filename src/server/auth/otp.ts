import { db } from "@/server/db";

export async function generateOtp(name: string) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-stelliger Code
  await db.verificationToken.create({
    data: {
      identifier: name,
      token: otp,
      expires: new Date(Date.now() + 15 * 60 * 1000), // Gültig für 15 Minuten
    },
  });
  return otp;
}

export async function verifyOtp(name: string, otp: string) {
    const otpRecord = await db.verificationToken.findUnique({
        where: {
            identifier: name,
            token: otp
        }
    });

    if(!otpRecord || otpRecord.expires < new Date()) {
        return false;
    }

    await db.verificationToken.delete({
        where: {
           id: otpRecord.id 
        }
    });

    return otpRecord.token === otp;
}