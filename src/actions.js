// @flow
import { ArrayBufferCursor } from './parsing/ArrayBufferCursor';
import { Area } from './domain';
import { application_state } from './store';
import { parse_quest } from './parsing/quest';
import { get_area_sections } from './area-data';

export function entity_selected(entity: any) {
    application_state.selected_entity = entity;
}

export function load_file(file: File) {
    const reader = new FileReader();

    reader.addEventListener('loadend', () => {
        const quest = parse_quest(new ArrayBufferCursor(reader.result, true));
        application_state.current_area = null;
        application_state.current_quest = quest;

        const area_promises = [...quest.area_variants.entries()].map(([id, variant]) => {
            return get_area_sections(quest.episode, id, variant).then(
                sections => new Area(id, sections));
        });

        Promise.all(area_promises).then(areas => {
            for (const area of areas) {
                quest.areas.push(area);
            }

            if (areas.length) {
                application_state.current_area = areas[0];
            }
        });
    });

    reader.readAsArrayBuffer(file);
}

export function current_area_id_changed(area_id: ?number) {
    if (area_id === null) {
        application_state.current_area = null;
    } else if (application_state.current_quest) {
        application_state.current_area = application_state.current_quest.areas.find(
            area => area.id === area_id) || null;
    }
}
