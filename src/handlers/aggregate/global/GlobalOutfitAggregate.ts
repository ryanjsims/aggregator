import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import {TYPES} from '../../../constants/types';
import {Kill} from 'ps2census';
import ApiMQPublisher from '../../../services/rabbitmq/publishers/ApiMQPublisher';
import ApiMQMessage from '../../../data/ApiMQMessage';
import {Ps2alertsApiMQEndpoints} from '../../../constants/ps2alertsApiMQEndpoints';

@injectable()
export default class GlobalOutfitAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('GlobalOutfitAggregate');
    private readonly apiMQPublisher: ApiMQPublisher;

    constructor(@inject(TYPES.apiMQPublisher) apiMQPublisher: ApiMQPublisher) {
        this.apiMQPublisher = apiMQPublisher;
    }

    public async handle(event: DeathEvent): Promise<boolean> {
        GlobalOutfitAggregate.logger.silly('GlobalOutfitAggregate.handle');

        const attackerDocs = [];
        const victimDocs = [];

        // Victim deaths always counted in every case
        victimDocs.push({$inc: {deaths: 1}});

        if (event.killType === Kill.Normal) {
            attackerDocs.push({$inc: {kills: 1}});
        }

        if (event.killType === Kill.TeamKill) {
            attackerDocs.push({$inc: {teamKills: 1}});
        }

        if (event.killType === Kill.Suicide || event.killType === Kill.RestrictedArea) {
            // Attacker and victim are the same here, so it doesn't matter which
            victimDocs.push({$inc: {suicides: 1}});
        }

        if (event.isHeadshot) {
            attackerDocs.push({$inc: {headshots: 1}});
        }

        // Purpose for this is we can aggregate stats for "outfitless" characters, e.g. TR (-3) got X kills
        const attackerOutfitId = event.attackerCharacter.outfit ? event.attackerCharacter.outfit.id : `-${event.attackerCharacter.faction}`;
        const victimOutfitId = event.character.outfit ? event.character.outfit.id : `-${event.character.faction}`;

        if (attackerDocs.length > 0) {
            try {
                await this.apiMQPublisher.send(new ApiMQMessage(
                    Ps2alertsApiMQEndpoints.GLOBAL_OUTFIT_AGGREGATE,
                    attackerDocs,
                    [{
                        outfit: attackerOutfitId,
                        world: event.world,
                    }],
                ));
            } catch (err) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
                GlobalOutfitAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
            }
        }

        try {
            await this.apiMQPublisher.send(new ApiMQMessage(
                Ps2alertsApiMQEndpoints.GLOBAL_OUTFIT_AGGREGATE,
                victimDocs,
                [{
                    outfit: victimOutfitId,
                    world: event.world,
                }],
            ));
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            GlobalOutfitAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
        }

        return true;
    }
}
