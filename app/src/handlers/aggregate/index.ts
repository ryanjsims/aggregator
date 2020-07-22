import {ContainerModule} from 'inversify';
import DeathEvent from '../census/events/DeathEvent';
import EventHandlerInterface from '../../interfaces/EventHandlerInterface';
import AlertFactionCombatAggregate from './alert/AlertFactionCombatAggregate';
import {TYPES} from '../../constants/types';
import AlertPlayerAggregate from './alert/AlertPlayerAggregate';

export default new ContainerModule((bind) => {
    // Aggregate handlers
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(AlertFactionCombatAggregate).inSingletonScope();
    bind<EventHandlerInterface<DeathEvent>>(TYPES.deathAggregates).to(AlertPlayerAggregate).inSingletonScope();
});
