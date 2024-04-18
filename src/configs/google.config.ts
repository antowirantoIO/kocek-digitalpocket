import { registerAs } from '@nestjs/config';

// TODO: Test it
export default registerAs(
    'google',
    (): Record<string, any> => ({
        clientId: process.env.SSO_GOOGLE_CLIENT_ID,
        clientSecret: process.env.SSO_GOOGLE_CLIENT_SECRET,
    })
);
