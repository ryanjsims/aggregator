import {ContainerModule} from 'inversify';
import ServiceInterface, {SERVICE} from '../../interfaces/ServiceInterface';
import config from '../../config';
import CensusStreamService from './CensusStreamService';
import {Client, EventStreamManagerConfig, rest} from 'ps2census';
import Census from '../../config/census';
import CensusCacheDriver from '../../drivers/CensusCacheDriver';
import {TYPES} from '../../constants/types';
import {RedisConnection} from '../redis/RedisConnection';

export default new ContainerModule((bind) => {
    bind<ServiceInterface>(SERVICE).to(CensusStreamService);

    const streamManagerConfig: EventStreamManagerConfig = config.census.streamManagerConfig;

    bind<Census>('censusConfig').toConstantValue(config.census);

    bind<CensusCacheDriver>(TYPES.censusCharacterCacheDriver)
        .toDynamicValue(({container}) => new CensusCacheDriver(
            'character',
            86400,
            container.get(RedisConnection),
        ));

    bind(Client)
        .toDynamicValue(({container}) => new Client({
            serviceId: config.census.serviceID,
            streamManagerConfig,
            characterManager: {
                cache: container.get(TYPES.censusCharacterCacheDriver),

                // TODO: Remove defaults when Microwave fixes package / resolves show
                request: rest.resolve.default(
                    rest.hide.default(
                        rest.character.default,
                        [
                            'head_id',
                            'times',
                            'certs',
                            'profile_id',
                            'title_id',
                            'daily_ribbon',
                        ],
                    ),
                    [
                        'world',
                        ['outfit_member_extended', ['outfit_id', 'name', 'alias', 'leader_character_id']],
                    ],
                ),
            },
        }))
        .inSingletonScope();
});
