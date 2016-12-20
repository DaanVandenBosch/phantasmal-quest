// @flow
import { ArrayBufferCursor } from './parsing/ArrayBufferCursor';
import { parse_quest } from './parsing/quest';
import { get_area_sections } from './area-data';

/*
 * Action types
 * 
 * Action types are always represented as simple strings.
 * 
 */

export const AREA_LOADED = 'AREA_LOADED';
export const CURRENT_AREA_ID_CHANGED = 'CURRENT_AREA_ID_CHANGED';
export const ENTITY_SELECTED = 'ENTITY_SELECTED';
export const NEW_FILE = 'NEW_FILE';
export const NEW_QUEST = 'NEW_QUEST';

/*
 * Action creators
 * 
 * All action creators return either actions or thunks expecting a dispatch function.
 * Actions are in flux standard action format.
 * 
 */

export function area_loaded(area: any) {
    return { type: AREA_LOADED, payload: area };
}

export function entity_selected(entity: any) {
    return { type: ENTITY_SELECTED, payload: entity };
}

export function new_quest(quest: any) {
    return { type: NEW_QUEST, payload: quest };
}

export function new_file(file: File) {
    return (dispatch: any) => {
        dispatch({ type: NEW_FILE, payload: file });

        const reader = new FileReader();
        reader.addEventListener('loadend', () => {
            if (file.name.endsWith('.qst')) {
                const quest = parse_quest(new ArrayBufferCursor(reader.result, true));
                dispatch(new_quest(quest));

                for (const [id, variant] of quest.areas.entries()) {
                    get_area_sections(quest.episode, id, variant).then(sections =>
                        dispatch(area_loaded({ id, sections })));
                }
            }
        });
        reader.readAsArrayBuffer(file);
    }
}

export function current_area_id_changed(area_id: number) {
    return { type: CURRENT_AREA_ID_CHANGED, payload: area_id };
}