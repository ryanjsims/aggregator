import MetagameTerritoryInstance from '../instances/MetagameTerritoryInstance';
import {getLogger} from '../logger';
import {ActionInterface} from '../interfaces/ActionInterface';
import MongooseModelFactory from '../factories/MongooseModelFactory';
import {InstanceMetagameTerritorySchemaInterface} from '../models/instance/InstanceMetagameTerritory';
import ApplicationException from '../exceptions/ApplicationException';
import FactionUtils from '../utils/FactionUtils';
import TerritoryCalculator from '../calculators/TerritoryCalculator';
import {jsonLogOutput} from '../utils/json';
import TerritoryCalculatorFactory from '../factories/TerritoryCalculatorFactory';
import GlobalVictoryAggregate from '../handlers/aggregate/global/GlobalVictoryAggregate';
import {CensusEnvironment} from '../types/CensusEnvironment';
import OutfitParticipantCacheHandler from '../handlers/OutfitParticipantCacheHandler';
import TerritoryResultInterface from '../interfaces/TerritoryResultInterface';

export default class MetagameTerritoryInstanceEndAction implements ActionInterface {
    private static readonly logger = getLogger('MetagameTerritoryInstanceEndAction');
    private readonly instance: MetagameTerritoryInstance;
    private readonly environment: CensusEnvironment;
    private readonly instanceMetagameFactory: MongooseModelFactory<InstanceMetagameTerritorySchemaInterface>;
    private readonly territoryCalculator: TerritoryCalculator;
    private readonly globalVictoryAggregate: GlobalVictoryAggregate;
    private readonly outfitParticipantCacheHandler: OutfitParticipantCacheHandler;

    constructor(
        instance: MetagameTerritoryInstance,
        environment: CensusEnvironment,
        instanceMetagameFactory: MongooseModelFactory<InstanceMetagameTerritorySchemaInterface>,
        territoryCalculatorFactory: TerritoryCalculatorFactory,
        globalVictoryAggregate: GlobalVictoryAggregate,
        outfitParticipantCacheHandler: OutfitParticipantCacheHandler,
    ) {
        this.instance = instance;
        this.environment = environment;
        this.instanceMetagameFactory = instanceMetagameFactory;
        this.territoryCalculator = territoryCalculatorFactory.build(instance, environment);
        this.globalVictoryAggregate = globalVictoryAggregate;
        this.outfitParticipantCacheHandler = outfitParticipantCacheHandler;
    }

    public async execute(): Promise<boolean> {
        MetagameTerritoryInstanceEndAction.logger.info(`[${this.instance.instanceId}] Running endAction`);

        this.instance.result = await this.calculateVictor();

        try {
            // Update database record with the victor of the Metagame (currently territory)
            await this.instanceMetagameFactory.model.updateOne(
                {instanceId: this.instance.instanceId},
                {result: this.instance.result},
            ).catch((err: Error) => {
                throw new ApplicationException(`[${this.instance.instanceId}] Unable to set victor! Err: ${err.message}`);
            });
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            MetagameTerritoryInstanceEndAction.logger.error(`[${this.instance.instanceId}] Unable to process endAction! Err: ${err.message}`);
        }

        // Update the world, zone and bracket aggregators
        await this.globalVictoryAggregate.handle(this.instance);

        // Remove the outfit participant set data from Redis
        await this.outfitParticipantCacheHandler.flushOutfits(this.instance.instanceId);

        return true;
    }

    public async calculateVictor(): Promise<TerritoryResultInterface> {
        const result = await this.territoryCalculator.calculate();

        MetagameTerritoryInstanceEndAction.logger.info(jsonLogOutput(result));

        if (result.draw) {
            MetagameTerritoryInstanceEndAction.logger.info(`[${this.instance.instanceId}] resulted in a DRAW!`);
        } else {
            MetagameTerritoryInstanceEndAction.logger.info(`[${this.instance.instanceId}] victor is: ${FactionUtils.parseFactionIdToShortName(result.victor).toUpperCase()}!`);
        }

        return result;
    }
}
