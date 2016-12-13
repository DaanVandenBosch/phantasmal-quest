// @flow

export function get_area_render_data(area_id: number): Promise<ArrayBuffer> {
    return get_area_asset(area_id, 'render');
}

export function get_area_collision_data(area_id: number): Promise<ArrayBuffer> {
    return get_area_asset(area_id, 'collision');
}

/**
 * Cache for the binary data.
 */
const buffer_cache: { [string]: ArrayBuffer } = {};

function get_asset(url: string) {
    const asset = buffer_cache[url];

    if (asset) {
        return Promise.resolve(asset);
    } else {
        return fetch(url)
            .then(r => r.arrayBuffer())
            .then(ab => buffer_cache[url] = ab);
    }
}

function area_id_to_base_url(area_id: number): string {
    const base_names = [
        'city00_00',
        'forest01',
        'forest02',
        'cave01_00',
        'cave02_00',
        'cave03_00'
    ];

    if (area_id < base_names.length) {
        const base_url: string = ((process.env.PUBLIC_URL): any);
        return `${base_url}/maps/map_${base_names[area_id]}`;
    } else {
        throw new Error(`Unknown area ${area_id}.`);
    }
}

type AreaAssetType = 'render' | 'collision';

function get_area_asset(area_id: number, type: AreaAssetType): Promise<ArrayBuffer> {
    try {
        const base_url = area_id_to_base_url(area_id);
        const suffix = type === 'render' ? 'n.rel' : 'c.rel';
        return get_asset(base_url + suffix);
    } catch (e) {
        return Promise.reject(e);
    }
}
