import { Object3D } from 'three';
import { get_area_render_data, get_area_collision_data } from './assets';
import { parse_c_rel, parse_n_rel } from './parsing/geometry';

/*
 * Caches
 */
const sections_cache: Promise<any[]>[] = [];
const render_geometry_cache: Promise<Object3D>[] = [];
const collision_geometry_cache: Promise<Object3D>[] = [];

export function get_area_sections(area_id: number): Promise<any[]> {
    const sections = sections_cache[area_id];

    if (sections) {
        return sections;
    } else {
        return get_area_sections_and_render_geometry(area_id).then(({sections}) => sections);
    }
}

export function get_area_render_geometry(area_id: number): Promise<Object3D> {
    const object_3d = render_geometry_cache[area_id];

    if (object_3d) {
        return object_3d;
    } else {
        return get_area_sections_and_render_geometry(area_id).then(({object_3d}) => object_3d);
    }
}

export function get_area_collision_geometry(area_id: number): Promise<Object3D> {
    const object_3d = collision_geometry_cache[area_id];

    if (object_3d) {
        return object_3d;
    } else {
        return collision_geometry_cache[area_id] = get_area_collision_data(area_id).then(parse_c_rel);
    }
}

function get_area_sections_and_render_geometry(area_id: number): Promise<{ sections: any[], object_3d: Object3D }> {
    return get_area_render_data(area_id).then(data => {
        const r = parse_n_rel(data);
        sections_cache[area_id] = Promise.resolve(r.sections);
        render_geometry_cache[area_id] = Promise.resolve(r.object_3d);
        return r;
    }).catch(e => {
        sections_cache[area_id] = Promise.reject(e);
        render_geometry_cache[area_id] = Promise.reject(e);
        throw e;
    });
}
