import { observable } from 'mobx';
import { Area, Quest } from 'domain';

class ApplicationState {
    @observable current_quest: ?Quest = null;
    @observable current_area: ?Area = null;
    @observable selected_entity: any = null;
}

export const application_state = new ApplicationState();
