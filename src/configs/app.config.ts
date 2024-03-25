import { registerAs } from '@nestjs/config';
import { version } from 'package.json';
import { ENUM_APP_ENVIRONMENT } from 'src/app/constants/app.enum.constant';
import { APP_TIMEZONE } from 'src/app/constants/app.constant';

export default registerAs(
    'app',
    (): Record<string, any> => ({
        maintenance: process.env.APP_MAINTENANCE === 'true' ?? false,

        name: process.env.APP_NAME ?? 'ack',
        env: process.env.APP_ENV ?? ENUM_APP_ENVIRONMENT.DEVELOPMENT,

        tz: process.env.APP_TZ ?? APP_TIMEZONE,

        repoVersion: version,
        versioning: {
            enable: process.env.HTTP_VERSIONING_ENABLE === 'true' ?? false,
            prefix: 'v',
            version: process.env.HTTP_VERSION ?? '1',
        },

        globalPrefix:
            process.env.APP_ENV === ENUM_APP_ENVIRONMENT.PRODUCTION
                ? ''
                : '/api',
        http: {
            enable: process.env.HTTP_ENABLE === 'true' ?? false,
            host: process.env.HTTP_HOST ?? 'localhost',
            port: process.env.HTTP_PORT
                ? Number.parseInt(process.env.HTTP_PORT)
                : 3000,
        },

        jobEnable: process.env.JOB_ENABLE === 'true' ?? false,
    })
);
