// @flow
import { Object3D } from 'three';
import { observable } from 'mobx';
import { is_int } from '../utils';

type Vec3 = { x: number, y: number, z: number };

export { NpcType } from './NpcType';
export { ObjectType } from './ObjectType';

export class Quest {
    @observable name: string;
    @observable short_description: string;
    @observable long_description: string;
    @observable episode: number;
    @observable area_variants: AreaVariant[];
    @observable objects: QuestObject[];
    @observable npcs: QuestNpc[];

    constructor(
        name: string,
        short_description: string,
        long_description: string,
        episode: number,
        area_variants: AreaVariant[],
        objects: QuestObject[],
        npcs: QuestNpc[]
    ) {
        if (episode !== 1 && episode !== 2 && episode !== 4) throw new Error('episode should be 1, 2 or 4.');
        if (!objects) throw new Error('objs is required.');
        if (!npcs) throw new Error('npcs is required.');

        this.name = name;
        this.short_description = short_description;
        this.long_description = long_description;
        this.episode = episode;
        this.area_variants = area_variants;
        this.objects = objects;
        this.npcs = npcs;
    }
}

export interface VisibleQuestEntity {
    area_id: number;
    section_id: number;
    position: Vec3;
    object3d: Object3D
}

export class QuestObject implements VisibleQuestEntity {
    @observable area_id: number;
    @observable section_id: number;
    @observable position: Vec3;
    @observable type: ObjectType;

    constructor(
        area_id: number,
        section_id: number,
        position: Vec3,
        type: ObjectType
    ) {
        if (!is_int(area_id) || area_id < 0)
            throw new Error(`Expected area_id to be a non-negative integer, got ${area_id}.`);
        if (!is_int(section_id) || section_id < 0)
            throw new Error(`Expected section_id to be a non-negative integer, got ${section_id}.`);
        if (!position) throw new Error('position is required.');
        if (!type) throw new Error('type is required.');

        this.area_id = area_id;
        this.section_id = section_id;
        this.position = position;
        this.type = type;
    }
}

export class QuestNpc implements VisibleQuestEntity {
    @observable area_id: number;
    @observable section_id: number;
    @observable position: Vec3;
    @observable type: NpcType;

    constructor(
        area_id: number,
        section_id: number,
        position: Vec3,
        type: NpcType
    ) {
        if (!is_int(area_id) || area_id < 0)
            throw new Error(`Expected area_id to be a non-negative integer, got ${area_id}.`);
        if (!is_int(section_id) || section_id < 0)
            throw new Error(`Expected section_id to be a non-negative integer, got ${section_id}.`);
        if (!position) throw new Error('position is required.');
        if (!type) throw new Error('type is required.');

        this.area_id = area_id;
        this.section_id = section_id;
        this.position = position;
        this.type = type;
    }
}

export class Area {
    id: number;
    name: string;
    order: number;
    area_variants: AreaVariant[];

    constructor(id: number, name: string, order: number, area_variants: AreaVariant[]) {
        if (!is_int(id) || id < 0)
            throw new Error(`Expected id to be a non-negative integer, got ${id}.`);
        if (!name) throw new Error('name is required.');
        if (!area_variants) throw new Error('area_variants is required.');

        this.id = id;
        this.name = name;
        this.order = order;
        this.area_variants = area_variants;
    }
}

export class AreaVariant {
    id: number;
    area: Area = null;
    @observable sections: Section[] = [];

    constructor(id: number) {
        if (!is_int(id) || id < 0)
            throw new Error(`Expected id to be a non-negative integer, got ${id}.`);

        this.id = id;
    }
}

export class Section {
    id: number;
    position: [number, number, number];
    y_axis_rotation: number;

    constructor(
        id: number,
        position: [number, number, number],
        y_axis_rotation: number
    ) {
        if (!is_int(id) || id < -1)
            throw new Error(`Expected id to be an integer greater than or equal to -1, got ${id}.`);
        if (!position) throw new Error('position is required.');
        if (position.length !== 3) throw new Error('position should have 3 elements.');
        if (typeof y_axis_rotation !== 'number') throw new Error('y_axis_rotation is required.');

        this.id = id;
        this.position = position;
        this.y_axis_rotation = y_axis_rotation;
    }
}
