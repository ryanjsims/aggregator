import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import DeathEvent from '../../census/events/DeathEvent';
import {getLogger} from '../../../logger';
import {inject, injectable} from 'inversify';
import MongooseModelFactory from '../../../factories/MongooseModelFactory';
import {TYPES} from '../../../constants/types';
import {GlobalPlayerAggregateSchemaInterface} from '../../../models/aggregate/global/GlobalPlayerAggregateModel';
import ApplicationException from '../../../exceptions/ApplicationException';
import {Kill} from 'ps2census/dist/client/events/Death';

@injectable()
export default class GlobalPlayerAggregate implements AggregateHandlerInterface<DeathEvent> {
    private static readonly logger = getLogger('GlobalPlayerAggregate');

    private readonly factory: MongooseModelFactory<GlobalPlayerAggregateSchemaInterface>;

    constructor(@inject(TYPES.globalPlayerAggregateFactory) factory: MongooseModelFactory<GlobalPlayerAggregateSchemaInterface>) {
        this.factory = factory;
    }

    public async handle(event: DeathEvent): Promise<boolean> {
        GlobalPlayerAggregate.logger.debug('GlobalPlayerAggregate.handle');

        // Check both attacker and victim for existence
        const checks = [event.characterId, event.attackerCharacterId];

        for (const id of checks) {
            // Create initial record if doesn't exist
            if (!await this.factory.model.exists({
                player: id,
            })) {
                await this.insertInitial(event, id);
            }
        }

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

        if (event.killType === Kill.Suicide) {
            // Attacker and victim are the same here, so it doesn't matter which
            victimDocs.push({$inc: {suicides: 1}});
        }

        if (event.isHeadshot) {
            attackerDocs.push({$inc: {headshots: 1}});
        }

        // It's an old promise sir, but it checks out (tried Async, doesn't work with forEach)
        attackerDocs.forEach((doc) => {
            void this.factory.model.updateOne(
                {player: event.attackerCharacterId},
                doc,
            ).catch((err) => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                GlobalPlayerAggregate.logger.error(`Updating GlobalPlayerAggregate Attacker Error! ${err}`);
            });
        });

        victimDocs.forEach((doc) => {
            void this.factory.model.updateOne(
                {player: event.characterId},
                doc,
            ).catch((err) => {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                GlobalPlayerAggregate.logger.error(`Updating GlobalPlayerAggregate Victim Error! ${err}`);
            });
        });

        return true;
    }

    private async insertInitial(event: DeathEvent, characterId: string): Promise<boolean> {
        GlobalPlayerAggregate.logger.debug(`Adding Initial GlobalPlayerAggregate Record for Player: ${characterId}`);

        const player = {
            player: characterId,
            world: event.world,
            kills: 0,
            deaths: 0,
            teamKills: 0,
            suicides: 0,
            headshots: 0,
        };

        try {
            const row = await this.factory.model.create(player);
            GlobalPlayerAggregate.logger.debug(`Inserted initial GlobalPlayerAggregate record for Player: ${row.player} | World: ${row.world}`);
            return true;
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const error: Error = err;

            if (!error.message.includes('E11000')) {
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                throw new ApplicationException(`Unable to insert initial GlobalPlayerAggregate record into DB! ${err}`, 'GlobalPlayerAggregate');
            }
        }

        return false;
    }
}
