// @flow
import { Record, List, OrderedSet } from 'immutable';

export const NPC = Record({
    id: null
});

export const Quest = Record({
    name: null,
    short_description: null,
    long_description: null,
    area_ids: OrderedSet(),
    npcs: List()
});

export const Section = Record({
    id: null,
    position: [0, 0, 0],
    y_axis_rotation: 0
});
