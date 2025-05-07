import IoRedis from 'ioredis';
import {Config} from '../../utils/types';

export class RedisClient extends IoRedis {
    constructor(config: Config) {
        super({
            host: config.bullmqWorkerConfig.redisConfig.host,
            port: config.bullmqWorkerConfig.redisConfig.port,
            maxRetriesPerRequest: null,
        });
    }
}
