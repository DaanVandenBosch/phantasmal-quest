// @flow
/*eslint default-case: ["off"]*/
import { ArrayBufferCursor } from './ArrayBufferCursor';
import { parse_qst } from './qst';
import { AreaVariant, QuestNpc, NpcType, QuestObject, Quest } from '../domain';
import { area_store } from '../store';

/**
 * High level parsing function that delegates to lower level parsing functions.
 * 
 * Always delegates to parse_qst at the moment.
 */
export function parse_quest(cursor: ArrayBufferCursor): Quest {
    const {dat, bin} = parse_qst(cursor);
    let episode = 1;
    let area_variants = [];

    if (bin.function_offsets.length) {
        const func_0_ops = get_func_operations(bin.instructions, bin.function_offsets[0]);

        if (func_0_ops) {
            episode = get_episode(func_0_ops);
            area_variants = get_area_variants(episode, func_0_ops);
        } else {
            console.warn(`Function 0 offset ${bin.function_offsets[0]} is invalid.`);
        }
    } else {
        console.warn('File contains no functions.');
    }

    return new Quest(
        bin.quest_name,
        bin.short_description,
        bin.long_description,
        episode,
        area_variants,
        parse_obj_data(episode, dat.objs),
        parse_npc_data(episode, dat.npcs)
    );
}

/**
 * Defaults to episode I.
 */
function get_episode(func_0_ops): number {
    const set_episode = func_0_ops.find(op => op.mnemonic === 'set_episode');

    if (set_episode) {
        switch (set_episode.args[0]) {
            default:
            case 0: return 1;
            case 1: return 2;
            case 2: return 4;
        }
    } else {
        console.warn('Function 0 has no set_episode instruction.');
        return 1;
    }
}

function get_area_variants(episode, func_0_ops): AreaVariant[] {
    const area_variants = new Map();
    const bb_maps = func_0_ops.filter(op => op.mnemonic === 'BB_Map_Designate');

    for (const bb_map of bb_maps) {
        const area_id = bb_map.args[0];
        const variant_id = bb_map.args[2];
        area_variants.set(area_id, variant_id);
    }

    // Sort by area order and then variant id.
    return (
        [...area_variants]
            .map(([area_id, variant_id]) =>
                area_store.get_variant(episode, area_id, variant_id))
            .sort((a, b) => a.area.order - b.area.order || a.id - b.id)
    );
}

function get_func_operations(operations: any[], func_offset: number) {
    let position = 0;
    let func_found = false;
    const func_ops = [];

    for (const operation of operations) {
        if (position === func_offset) {
            func_found = true;
        }

        if (func_found) {
            func_ops.push(operation);

            // Break when ret is encountered.
            if (operation.opcode === 1) {
                break;
            }
        }

        position += operation.size;
    }

    return func_found ? func_ops : null;
}

function parse_obj_data(episode: number, objs: any[]): QuestObject[] {
    return objs.map(
        obj_data => new QuestObject(
            obj_data.area_id,
            obj_data.section_id,
            obj_data.position
        )
    );
}

function parse_npc_data(episode: number, npcs: any[]): QuestNpc[] {
    return npcs.map(
        npc_data => new QuestNpc(
            get_npc_type(episode, npc_data),
            npc_data.area_id,
            npc_data.section_id,
            npc_data.position
        )
    );
}

function get_npc_type(episode: number, {type_id, regular, skin, area_id}): NpcType {
    switch (`${type_id}, ${skin % 3}, ${episode}`) {
        case `${0x044}, 0, 1`: return NpcType.Booma;
        case `${0x044}, 1, 1`: return NpcType.Gobooma;
        case `${0x044}, 2, 1`: return NpcType.Gigobooma;

        case `${0x063}, 0, 1`: return NpcType.EvilShark;
        case `${0x063}, 1, 1`: return NpcType.PalShark;
        case `${0x063}, 2, 1`: return NpcType.GuilShark;

        case `${0x0A6}, 0, 1`: return NpcType.Dimenian;
        case `${0x0A6}, 0, 2`: return NpcType.Dimenian2;
        case `${0x0A6}, 1, 1`: return NpcType.LaDimenian;
        case `${0x0A6}, 1, 2`: return NpcType.LaDimenian2;
        case `${0x0A6}, 2, 1`: return NpcType.SoDimenian;
        case `${0x0A6}, 2, 2`: return NpcType.SoDimenian2;

        case `${0x0D6}, 0, 2`: return NpcType.Mericarol;
        case `${0x0D6}, 1, 2`: return NpcType.Mericus;
        case `${0x0D6}, 2, 2`: return NpcType.Merikle;

        case `${0x115}, 0, 4`: return NpcType.Boota;
        case `${0x115}, 1, 4`: return NpcType.ZeBoota;
        case `${0x115}, 2, 4`: return NpcType.BaBoota;
        case `${0x117}, 0, 4`: return NpcType.Goran;
        case `${0x117}, 1, 4`: return NpcType.PyroGoran;
        case `${0x117}, 2, 4`: return NpcType.GoranDetonator;
    }

    switch (`${type_id}, ${skin % 2}, ${episode}`) {
        case `${0x040}, 0, 1`: return NpcType.Hildebear;
        case `${0x040}, 0, 2`: return NpcType.Hildebear2;
        case `${0x040}, 1, 1`: return NpcType.Hildeblue;
        case `${0x040}, 1, 2`: return NpcType.Hildeblue2;
        case `${0x041}, 0, 1`: return NpcType.RagRappy;
        case `${0x041}, 0, 2`: return NpcType.RagRappy2;
        case `${0x041}, 0, 4`: return NpcType.SandRappy;
        case `${0x041}, 1, 1`: return NpcType.AlRappy;
        case `${0x041}, 1, 2`: return NpcType.AlRappy2;
        case `${0x041}, 1, 4`: return NpcType.DelRappy;
        case `${0x043}, 0, 1`: return NpcType.SavageWolf;
        case `${0x043}, 0, 2`: return NpcType.SavageWolf2;
        case `${0x043}, 1, 1`: return NpcType.BarbarousWolf;
        case `${0x043}, 1, 2`: return NpcType.BarbarousWolf2;

        case `${0x061}, 0, 1`: return area_id > 15 ? NpcType.DelLily : NpcType.PoisonLily;
        case `${0x061}, 0, 2`: return area_id > 15 ? NpcType.DelLily : NpcType.PoisonLily2;
        case `${0x061}, 1, 1`: return area_id > 15 ? NpcType.DelLily : NpcType.NarLily;
        case `${0x061}, 1, 2`: return area_id > 15 ? NpcType.DelLily : NpcType.NarLily2;

        case `${0x080}, 0, 1`: return NpcType.Dubchic;
        case `${0x080}, 0, 2`: return NpcType.Dubchic2;
        case `${0x080}, 1, 1`: return NpcType.Gilchic;
        case `${0x080}, 1, 2`: return NpcType.Gilchic2;

        case `${0x0D4}, 0, 2`: return NpcType.SinowBerill;
        case `${0x0D4}, 1, 2`: return NpcType.SinowSpigell;
        case `${0x0D5}, 0, 2`: return NpcType.Merillia;
        case `${0x0D5}, 1, 2`: return NpcType.Meriltas;
        case `${0x0D7}, 0, 2`: return NpcType.UlGibbon;
        case `${0x0D7}, 1, 2`: return NpcType.ZolGibbon;

        case `${0x0DD}, 0, 2`: return NpcType.Dolmolm;
        case `${0x0DD}, 1, 2`: return NpcType.Dolmdarl;
        case `${0x0E0}, 0, 2`: return area_id > 15 ? NpcType.Epsilon : NpcType.SinowZoa;
        case `${0x0E0}, 1, 2`: return area_id > 15 ? NpcType.Epsilon : NpcType.SinowZele;

        case `${0x112}, 0, 4`: return NpcType.MerissaA;
        case `${0x112}, 1, 4`: return NpcType.MerissaAA;
        case `${0x114}, 0, 4`: return NpcType.Zu;
        case `${0x114}, 1, 4`: return NpcType.Pazuzu;
        case `${0x116}, 0, 4`: return NpcType.Dorphon;
        case `${0x116}, 1, 4`: return NpcType.DorphonEclair;
        case `${0x119}, 0, 4`: return NpcType.SaintMillion;
        case `${0x119}, 1, 4`: return NpcType.Shambertin;
    }

    switch (`${type_id}, ${episode}`) {
        case `${0x042}, 1`: return NpcType.Monest;
        case `${0x042}, 2`: return NpcType.Monest2;

        case `${0x060}, 1`: return NpcType.GrassAssassin;
        case `${0x060}, 2`: return NpcType.GrassAssassin2;
        case `${0x062}, 1`: return NpcType.NanoDragon;
        case `${0x064}, 1`: return regular ? NpcType.PofuillySlime : NpcType.PouillySlime;
        case `${0x065}, 1`: return NpcType.PanArms;
        case `${0x065}, 2`: return NpcType.PanArms2;

        case `${0x081}, 1`: return NpcType.Garanz;
        case `${0x081}, 2`: return NpcType.Garanz2;
        case `${0x082}, 1`: return regular ? NpcType.SinowBeat : NpcType.SinowGold;
        case `${0x083}, 1`: return NpcType.Canadine;
        case `${0x084}, 1`: return NpcType.Canane;
        case `${0x085}, 1`: return NpcType.Dubwitch;
        case `${0x085}, 2`: return NpcType.Dubwitch2;

        case `${0x0A0}, 1`: return NpcType.Delsaber;
        case `${0x0A0}, 2`: return NpcType.Delsaber2;
        case `${0x0A1}, 1`: return NpcType.ChaosSorcerer;
        case `${0x0A1}, 2`: return NpcType.ChaosSorcerer2;
        case `${0x0A2}, 1`: return NpcType.DarkGunner;
        case `${0x0A4}, 1`: return NpcType.ChaosBringer;
        case `${0x0A5}, 1`: return NpcType.DarkBelra;
        case `${0x0A5}, 2`: return NpcType.DarkBelra2;
        case `${0x0A7}, 1`: return NpcType.Bulclaw;
        case `${0x0A8}, 1`: return NpcType.Claw;

        case `${0x0C0}, 1`: return NpcType.Dragon;
        case `${0x0C0}, 2`: return NpcType.GalGryphon;
        case `${0x0C1}, 1`: return NpcType.DeRolLe;
        case `${0x0C5}, 1`: return NpcType.VolOpt;
        case `${0x0C8}, 1`: return NpcType.DarkFalz;
        case `${0x0CA}, 2`: return NpcType.OlgaFlow;
        case `${0x0CB}, 2`: return NpcType.BarbaRay;
        case `${0x0CC}, 2`: return NpcType.GolDragon;

        case `${0x0D8}, 2`: return NpcType.Gibbles;
        case `${0x0D9}, 2`: return NpcType.Gee;
        case `${0x0DA}, 2`: return NpcType.GiGue;

        case `${0x0DB}, 2`: return NpcType.Deldepth;
        case `${0x0DC}, 2`: return NpcType.Delbiter;
        case `${0x0DE}, 2`: return NpcType.Morfos;
        case `${0x0DF}, 2`: return NpcType.Recobox;
        case `${0x0E1}, 2`: return NpcType.IllGill;

        case `${0x110}, 4`: return NpcType.Astark;
        case `${0x111}, 4`: return regular ? NpcType.SatelliteLizard : NpcType.Yowie;
        case `${0x113}, 4`: return NpcType.Girtablulu;
    }

    switch (type_id) {
        case 0x004: return NpcType.FemaleFat;
        case 0x005: return NpcType.FemaleMacho;
        case 0x007: return NpcType.FemaleTall;
        case 0x00A: return NpcType.MaleDwarf;
        case 0x00B: return NpcType.MaleFat;
        case 0x00C: return NpcType.MaleMacho;
        case 0x00D: return NpcType.MaleOld;
        case 0x019: return NpcType.BlueSoldier;
        case 0x01A: return NpcType.RedSoldier;
        case 0x01B: return NpcType.Principal;
        case 0x01C: return NpcType.Tekker;
        case 0x01D: return NpcType.GuildLady;
        case 0x01E: return NpcType.Scientist;
        case 0x01F: return NpcType.Nurse;
        case 0x020: return NpcType.Irene;
    }

    return NpcType.Unknown;
}
