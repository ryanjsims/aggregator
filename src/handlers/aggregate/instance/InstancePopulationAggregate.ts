import CharacterPresenceHandlerInterface from '../../../interfaces/CharacterPresenceHandlerInterface';
import {inject, injectable} from 'inversify';
import {TYPES} from '../../../constants/types';
import {getLogger} from '../../../logger';
import AggregateHandlerInterface from '../../../interfaces/AggregateHandlerInterface';
import PopulationData from '../../../data/PopulationData';
import InstanceHandlerInterface from '../../../interfaces/InstanceHandlerInterface';
import ApiMQMessage from '../../../data/ApiMQMessage';
import {Ps2alertsApiMQEndpoints} from '../../../constants/ps2alertsApiMQEndpoints';
import ApiMQPublisher from '../../../services/rabbitmq/publishers/ApiMQPublisher';

@injectable()
export default class InstancePopulationAggregate implements AggregateHandlerInterface<PopulationData>{
    private static readonly logger = getLogger('InstancePopulationAggregate');
    private readonly playerHandler: CharacterPresenceHandlerInterface;
    private readonly instanceHandler: InstanceHandlerInterface;
    private readonly apiMQPublisher: ApiMQPublisher;

    constructor(
    @inject(TYPES.characterPresenceHandlerInterface) playerHandler: CharacterPresenceHandlerInterface,
        @inject(TYPES.instanceHandlerInterface) instanceHandler: InstanceHandlerInterface,
        @inject(TYPES.apiMQPublisher) apiMQPublisher: ApiMQPublisher,
    ) {
        this.playerHandler = playerHandler;
        this.instanceHandler = instanceHandler;
        this.apiMQPublisher = apiMQPublisher;
    }

    public async handle(event: PopulationData): Promise<boolean> {
        InstancePopulationAggregate.logger.silly('InstancePopulationAggregate.handle');

        // Figure out running instances and generate new InstancePopulationData object
        const activeInstances = this.instanceHandler.getAllInstances().filter((instance) => {
            return instance.match(event.world, event.zone);
        });

        // Whatever keeps you happy ESLint
        const documents: Array<{ instance: string, timestamp: Date, vs: number, nc: number, tr: number, nso: number, total: number }> = [];

        activeInstances.forEach((instance) => {
            // Check if instances match data
            documents.push({
                instance: instance.instanceId,
                timestamp: new Date(),
                vs: event.vs,
                nc: event.nc,
                tr: event.tr,
                nso: event.nso,
                total: event.total,
            });
        });

        try {
            await this.apiMQPublisher.send(new ApiMQMessage(
                Ps2alertsApiMQEndpoints.INSTANCE_POPULATION_AGGREGATE,
                documents,
            ));
        } catch (err) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-template-expressions
            InstancePopulationAggregate.logger.error(`Could not publish message to API! E: ${err.message}`);
        }

        return true;
    }
}
