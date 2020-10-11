import {get} from '../utils/env';
import {ClientConfig, rest} from 'ps2census';

export default class Census {
    public readonly serviceID: string = get('CENSUS_SERVICE_ID');

    /**
     * @type {ClientConfig} Configuration for PS2 Census aggregator client
     */
    public readonly clientConfig: ClientConfig = {
        environment: 'ps2',
        streamManagerConfig: {
            subscription: {
                eventNames: ['Death', 'FacilityControl', 'PlayerLogin', 'PlayerLogout', 'GainExperience', 'VehicleDestroy'],
                worlds: ['all'],
                characters: ['all'],
                logicalAndCharactersWithWorlds: true,
            },
        },
        characterManager: {
            request: rest.retry(rest.resolve(
                rest.hide(
                    rest.character,
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
            )),
        },
    };

    public readonly enableInjections = get('NODE_ENV', 'development') === 'development';
}
