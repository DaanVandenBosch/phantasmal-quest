// @flow
import { ArrayBufferCursor } from './data/ArrayBufferCursor';
import { application_state } from './store';
import { parse_quest } from './data/parsing/quest';
import { get_area_sections } from './area-data';
import { create_object_geometry, create_npc_geometry } from './rendering/entities';

export function entity_selected(entity: any) {
    application_state.selected_entity = entity;
}

export function load_file(file: File) {
    const reader = new FileReader();

    reader.addEventListener('loadend', () => {
        const quest = parse_quest(new ArrayBufferCursor(reader.result, true));

        // Reset application state, then set current quest and area in the correct order.
        // Might want to do this in a MobX transaction.
        application_state.current_area = null;
        application_state.selected_entity = null;
        application_state.current_quest = quest;

        if (quest.area_variants.length) {
            application_state.current_area = quest.area_variants[0].area;
        }

        // Load section data.
        for (const variant of quest.area_variants) {
            get_area_sections(quest.episode, variant.area.id, variant.id).then(sections => {
                variant.sections = sections;

                // Generate object geometry.
                for (const object of quest.objects.filter(o => o.area_id === variant.area.id)) {
                    object.object3d = create_object_geometry(object, sections);
                }

                // Generate NPC geometry.
                for (const npc of quest.npcs.filter(npc => npc.area_id === variant.area.id)) {
                    npc.object3d = create_npc_geometry(npc, sections);
                }
            });
        }
    });

    reader.readAsArrayBuffer(file);
}

export function current_area_id_changed(area_id: ?number) {
    application_state.selected_entity = null;

    if (area_id === null) {
        application_state.current_area = null;
    } else if (application_state.current_quest) {
        const area_variant = application_state.current_quest.area_variants.find(
            variant => variant.area.id === area_id);
        application_state.current_area = (area_variant && area_variant.area) || null;
    }
}
