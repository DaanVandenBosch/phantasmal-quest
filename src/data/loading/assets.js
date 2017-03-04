// @flow
import { NpcType } from '../../domain';

export function get_area_render_data(
    episode: number,
    area_id: number,
    area_version: number
): Promise<ArrayBuffer> {
    return get_area_asset(episode, area_id, area_version, 'render');
}

export function get_area_collision_data(
    episode: number,
    area_id: number,
    area_version: number
): Promise<ArrayBuffer> {
    return get_area_asset(episode, area_id, area_version, 'collision');
}

export function get_npc_data(npc_type: NpcType): Promise<ArrayBuffer> {
    try {
        return get_asset(npc_type_to_url(npc_type));
    } catch (e) {
        return Promise.reject(e);
    }
}

/**
 * Cache for the binary data.
 */
const buffer_cache: Map<string, Promise<ArrayBuffer>> = new Map();

function get_asset(url: string): Promise<ArrayBuffer> {
    const promise = buffer_cache.get(url);

    if (promise) {
        return promise;
    } else {
        const base_url: string = ((process.env.PUBLIC_URL): any);
        const promise = fetch(base_url + url).then(r => r.arrayBuffer());
        buffer_cache.set(url, promise);
        return promise;
    }
}

const area_base_names = [
    [
        ['city00_00', 1],
        ['forest01', 1],
        ['forest02', 1],
        ['cave01_', 6],
        ['cave02_', 5],
        ['cave03_', 6],
        ['machine01_', 6],
        ['machine02_', 6],
        ['ancient01_', 5],
        ['ancient02_', 5],
        ['ancient03_', 5],
        ['boss01', 1],
        ['boss02', 1],
        ['boss03', 1],
        ['darkfalz00', 1]
    ],
    [
        ['labo00_00', 1],
        ['ruins01_', 3],
        ['ruins02_', 3],
        ['space01_', 3],
        ['space02_', 3],
        ['jungle01_00', 1],
        ['jungle02_00', 1],
        ['jungle03_00', 1],
        ['jungle04_', 3],
        ['jungle05_00', 1],
        ['seabed01_', 3],
        ['seabed02_', 3],
        ['boss05', 1],
        ['boss06', 1],
        ['boss07', 1],
        ['boss08', 1],
        ['jungle06_00', 1],
        ['jungle07_', 5]
    ],
    [
        // Don't remove, see usage of area_base_names in area_version_to_base_url.
    ],
    [
        ['city02_00', 1],
        ['wilds01_00', 1],
        ['wilds01_01', 1],
        ['wilds01_02', 1],
        ['wilds01_03', 1],
        ['crater01_00', 1],
        ['desert01_', 3],
        ['desert02_', 3],
        ['desert03_', 3],
        ['boss09_00', 1]
    ]
];

function area_version_to_base_url(
    episode: number,
    area_id: number,
    area_variant: number
): string {
    const episode_base_names = area_base_names[episode - 1];

    if (0 <= area_id && area_id < episode_base_names.length) {
        const [base_name, variants] = episode_base_names[area_id];

        if (0 <= area_variant && area_variant < variants) {
            let variant: string;

            if (variants === 1) {
                variant = '';
            } else {
                variant = String(area_variant);
                while (variant.length < 2) variant = '0' + variant;
            }

            return `/maps/map_${base_name}${variant}`;
        } else {
            throw new Error(`Unknown variant ${area_variant} of area ${area_id} in episode ${episode}.`);
        }
    } else {
        throw new Error(`Unknown episode ${episode} area ${area_id}.`);
    }
}

type AreaAssetType = 'render' | 'collision';

function get_area_asset(
    episode: number,
    area_id: number,
    area_variant: number,
    type: AreaAssetType
): Promise<ArrayBuffer> {
    try {
        const base_url = area_version_to_base_url(episode, area_id, area_variant);
        const suffix = type === 'render' ? 'n.rel' : 'c.rel';
        return get_asset(base_url + suffix);
    } catch (e) {
        return Promise.reject(e);
    }
}

function npc_type_to_url(npc_type: NpcType): string {
    switch (npc_type) {
        case NpcType.Hildebear: return '/data/167_bm_ene_bm2_moja/bm2c_s_moj_body.nj';
        case NpcType.Hildeblue: return '/data/167_bm_ene_bm2_moja/bm2f_s_moj_body.nj';
        case NpcType.RagRappy: return '/data/206_bm_ene_lappy/re3_b_lappy_base.nj';
        case NpcType.AlRappy: return '/data/206_bm_ene_lappy/re3_s_lappy_base.nj';
        case NpcType.Monest: return '/data/169_bm_ene_bm3_fly/bm3_s_nest.nj';
        case NpcType.SavageWolf: return '/data/173_bm_ene_bm5_wolf/bm5_s_kem_body.nj';
        case NpcType.BarbarousWolf: return '/data/173_bm_ene_bm5_wolf/bm5_s_keml_body.nj';
        case NpcType.Booma: return '/data/239_bm_ene_re8_b_beast/re8_b_beast_wola_body.nj';
        case NpcType.Gobooma: return '/data/239_bm_ene_re8_b_beast/re8_b_srdbeast_wola_body.nj';
        case NpcType.Gigobooma: return '/data/239_bm_ene_re8_b_beast/re8_b_rdbeast_wola_body.nj';

        // case NpcType.SinowBerill: return '/data/.nj';
        // case NpcType.SinowSpigell: return '/data/.nj';
        case NpcType.Merillia: return '/data/241_bm_ene_re8_merill_lia/re8_b_beast_wola_body.nj';
        case NpcType.Meriltas: return '/data/241_bm_ene_re8_merill_lia/re8_b_srbeast_wola_body.nj';
        case NpcType.Mericarol: return '/data/175_bm_ene_bm9_s_mericarol/bm9_s_meri_body.nj';
        case NpcType.Mericus: return '/data/175_bm_ene_bm9_s_mericarol/bm9_s_meri_body.nj';
        case NpcType.Merikle: return '/data/175_bm_ene_bm9_s_mericarol/bm9_s_meri_body.nj';
        case NpcType.UlGibbon: return '/data/171_bm_ene_bm5_gibon_u/gibon.nj';
        case NpcType.ZolGibbon: return '/data/171_bm_ene_bm5_gibon_u/gibonb_gibon.nj';
        case NpcType.Gibbles: return '/data/197_bm_ene_gibbles/gibb_body.nj';
        // case NpcType.Gee: return '/data/.nj';
        // case NpcType.GiGue: return '/data/.nj';
        case NpcType.GalGryphon: return '/data/153_bm_boss5_gryphon/boss5_s_body.nj';

        default: throw new Error(`NPC type ${npc_type.name} cannot be mapped to a geometry file.`);
    }
}