// @flow
import { observable } from 'mobx';
import { Area, AreaVariant, Quest } from './domain';

function area(id, name, variants) {
    const varis = Array(variants).fill().map((_, i) => new AreaVariant(i));
    const area = new Area(id, name, varis);

    for (const vari of varis) {
        vari.area = area;
    }

    return area;
}

class AreaStore {
    areas: Area[][];

    constructor() {
        // The IDs match the PSO IDs for areas.
        this.areas = [
            [
                area(0, 'Pioneer II', 1),
                area(1, 'Forest 1', 1),
                area(2, 'Forest 2', 1),
                area(3, 'Cave 1', 6),
                area(4, 'Cave 2', 5),
                area(5, 'Cave 3', 6),
                area(6, 'Mine 1', 6),
                area(7, 'Mine 2', 6),
                area(8, 'Ruins 1', 5),
                area(9, 'Ruins 2', 5),
                area(10, 'Ruins 3', 5),
                area(11, 'Dragon', 1),
                area(12, 'De Rol Le', 1),
                area(13, 'Vol Opt', 1),
                area(14, 'Dark Falz', 1)
            ],
            [
                area(0, 'Lab', 1),
                area(1, 'VR Temple Alpha', 3),
                area(2, 'VR Temple Beta', 3),
                area(3, 'VR Space Ship Alpha', 3),
                area(4, 'VR Space Ship Beta', 3),
                area(5, 'Jungle 1', 1),
                area(6, 'Jungle East', 1),
                area(7, 'Jungle 3', 1),
                area(8, 'Jungle 4', 3),
                area(9, 'Seaside', 1),
                area(10, 'Jungle 6', 1),
                area(16, 'Seabed Upper', 3),
                area(11, 'Seabed Lower', 3),
                area(17, 'Jungle 7', 5),
                area(14, 'Barba Ray', 1),
                area(15, 'Gol Dragon', 1),
                area(12, 'Gal Gryphon', 1),
                area(13, 'Olga Flow', 1)
            ],
            [
                // Don't remove, see usage below.
            ],
            [
                area(0, 'Pioneer II (Ep. IV)', 1),
                area(1, 'Crater Route 1', 1),
                area(2, 'Crater Route 2', 1),
                area(3, 'Crater Route 3', 1),
                area(4, 'Crater Route 4', 1),
                area(5, 'Crater Interior', 1),
                area(6, 'Subterranean Desert 1', 3),
                area(7, 'Subterranean Desert 2', 3),
                area(8, 'Subterranean Desert 3', 3),
                area(9, 'Saint-Milion', 1)
            ]
        ];
    }

    get_variant(episode: number, area_id: number, variant_id: number) {
        return this.areas[episode - 1].find(a => a.id === area_id).area_variants[variant_id];
    }
}

export const area_store = new AreaStore();

class ApplicationState {
    @observable current_quest: ?Quest = null;
    @observable current_area: ?Area = null;
    @observable selected_entity: any = null;
}

export const application_state = new ApplicationState();
