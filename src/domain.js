// @flow
import { observable } from 'mobx';
import { is_int } from './utils';

export class Area {
    id: number;
    @observable sections: Section[];

    constructor(id: number, sections: Section[]) {
        if (!is_int(id) || id < 0)
            throw new Error(`Expected id to be a non-negative integer, got ${id}.`);
        if (!sections) throw new Error('sections is required.');

        this.id = id;
        this.sections = sections;
    }
}

export class Obj {
    @observable area_id: number;
    @observable section_id: number;
    @observable position: [number, number, number];

    constructor(
        area_id: number,
        section_id: number,
        position: [number, number, number]
    ) {
        if (!is_int(area_id) || area_id < 0)
            throw new Error(`Expected area_id to be a non-negative integer, got ${area_id}.`);
        if (!is_int(section_id) || section_id < 0)
            throw new Error(`Expected section_id to be a non-negative integer, got ${section_id}.`);
        if (!position) throw new Error('position is required.');
        if (position.length !== 3) throw new Error('position should have 3 elements.');

        this.area_id = area_id;
        this.section_id = section_id;
        this.position = position;
    }
}

export class NpcType {
    id: number;
    name: string;
    enemy: boolean;

    constructor(id: number, name: string, enemy: boolean) {
        if (!is_int(id) || id < 1)
            throw new Error(`Expected id to be an integer greater than or equal to 1, got ${id}.`);
        if (!name) throw new Error('name is required.');
        if (typeof enemy !== 'boolean') throw new Error('enemy is required.');

        this.id = id;
        this.name = name;
        this.enemy = enemy;
    }
}

(function () {
    let id = 1;

    NpcType.Unknown = new NpcType(id++, 'Unknown', false);

    NpcType.FemaleFat = new NpcType(id++, 'Female Fat', false);
    NpcType.FemaleMacho = new NpcType(id++, 'Female Macho', false);
    NpcType.FemaleTall = new NpcType(id++, 'Female Tall', false);
    NpcType.MaleDwarf = new NpcType(id++, 'Male Dwarf', false);
    NpcType.MaleFat = new NpcType(id++, 'Male Fat', false);
    NpcType.MaleMacho = new NpcType(id++, 'Male Macho', false);
    NpcType.MaleOld = new NpcType(id++, 'Male Old', false);
    NpcType.BlueSoldier = new NpcType(id++, 'Blue Soldier', false);
    NpcType.RedSoldier = new NpcType(id++, 'Red Soldier', false);
    NpcType.Principal = new NpcType(id++, 'Principal', false);
    NpcType.Tekker = new NpcType(id++, 'Tekker', false);
    NpcType.GuildLady = new NpcType(id++, 'Guild Lady', false);
    NpcType.Scientist = new NpcType(id++, 'Scientist', false);
    NpcType.Nurse = new NpcType(id++, 'Nurse', false);
    NpcType.Irene = new NpcType(id++, 'Irene', false);

    NpcType.Hildebear = new NpcType(id++, 'Hildebear', true);
    NpcType.Hildeblue = new NpcType(id++, 'Hildeblue', true);
    NpcType.RagRappy = new NpcType(id++, 'Rag Rappy', true);
    NpcType.AlRappy = new NpcType(id++, 'Al Rappy', true);
    NpcType.Monest = new NpcType(id++, 'Monest', true);
    NpcType.SavageWolf = new NpcType(id++, 'Savage Wolf', true);
    NpcType.BarbarousWolf = new NpcType(id++, 'Barbarous Wolf', true);
    NpcType.Booma = new NpcType(id++, 'Booma', true);
    NpcType.Gobooma = new NpcType(id++, 'Gobooma', true);
    NpcType.Gigobooma = new NpcType(id++, 'Gigobooma', true);
    NpcType.Dragon = new NpcType(id++, 'Dragon', true);

    NpcType.GrassAssassin = new NpcType(id++, 'Grass Assassin', true);
    NpcType.PoisonLily = new NpcType(id++, 'Poison Lily', true);
    NpcType.NarLily = new NpcType(id++, 'Nar Lily', true);
    NpcType.NanoDragon = new NpcType(id++, 'Nano Dragon', true);
    NpcType.EvilShark = new NpcType(id++, 'Evil Shark', true);
    NpcType.PalShark = new NpcType(id++, 'Pal Shark', true);
    NpcType.GuilShark = new NpcType(id++, 'Guil Shark', true);
    NpcType.PofuillySlime = new NpcType(id++, 'Pofuilly Slime', true);
    NpcType.PouillySlime = new NpcType(id++, 'Pouilly Slime', true);
    NpcType.PanArms = new NpcType(id++, 'Pan Arms', true);
    NpcType.DeRolLe = new NpcType(id++, 'De Rol Le', true);

    NpcType.Dubchic = new NpcType(id++, 'Dubchic', true);
    NpcType.Gilchic = new NpcType(id++, 'Gilchic', true);
    NpcType.Garanz = new NpcType(id++, 'Garanz', true);
    NpcType.SinowBeat = new NpcType(id++, 'Sinow Beat', true);
    NpcType.SinowGold = new NpcType(id++, 'Sinow Gold', true);
    NpcType.Canadine = new NpcType(id++, 'Canadine', true);
    NpcType.Canane = new NpcType(id++, 'Canane', true);
    NpcType.Dubwitch = new NpcType(id++, 'Dubwitch', true);
    NpcType.VolOpt = new NpcType(id++, 'Vol Opt', true);

    NpcType.Delsaber = new NpcType(id++, 'Delsaber', true);
    NpcType.ChaosSorcerer = new NpcType(id++, 'Chaos Sorcerer', true);
    NpcType.DarkGunner = new NpcType(id++, 'Dark Gunner', true);
    NpcType.ChaosBringer = new NpcType(id++, 'Chaos Bringer', true);
    NpcType.DarkBelra = new NpcType(id++, 'Dark Belra', true);
    NpcType.Dimenian = new NpcType(id++, 'Dimenian', true);
    NpcType.LaDimenian = new NpcType(id++, 'La Dimenian', true);
    NpcType.SoDimenian = new NpcType(id++, 'So Dimenian', true);
    NpcType.Bulclaw = new NpcType(id++, 'Bulclaw', true);
    NpcType.Claw = new NpcType(id++, 'Claw', true);
    NpcType.DarkFalz = new NpcType(id++, 'Dark Falz', true);

    NpcType.Hildebear2 = new NpcType(id++, 'Hildebear (Ep. II)', true);
    NpcType.Hildeblue2 = new NpcType(id++, 'Hildeblue (Ep. II)', true);
    NpcType.RagRappy2 = new NpcType(id++, 'Rag Rappy (Ep. II)', true);
    NpcType.AlRappy2 = new NpcType(id++, 'Al Rappy (Ep. II)', true);
    NpcType.Monest2 = new NpcType(id++, 'Monest (Ep. II)', true);
    NpcType.PoisonLily2 = new NpcType(id++, 'Poison Lily (Ep. II)', true);
    NpcType.NarLily2 = new NpcType(id++, 'Nar Lily (Ep. II)', true);
    NpcType.GrassAssassin2 = new NpcType(id++, 'Grass Assassin (Ep. II)', true);
    NpcType.Dimenian2 = new NpcType(id++, 'Dimenian (Ep. II)', true);
    NpcType.LaDimenian2 = new NpcType(id++, 'La Dimenian (Ep. II)', true);
    NpcType.SoDimenian2 = new NpcType(id++, 'So Dimenian (Ep. II)', true);
    NpcType.DarkBelra2 = new NpcType(id++, 'Dark Belra (Ep. II)', true);
    NpcType.BarbaRay = new NpcType(id++, 'Barba Ray', true);

    NpcType.SavageWolf2 = new NpcType(id++, 'Savage Wolf (Ep. II)', true);
    NpcType.BarbarousWolf2 = new NpcType(id++, 'Barbarous Wolf (Ep. II)', true);
    NpcType.PanArms2 = new NpcType(id++, 'Pan Arms (Ep. II)', true);
    NpcType.Dubchic2 = new NpcType(id++, 'Dubchic (Ep. II)', true);
    NpcType.Gilchic2 = new NpcType(id++, 'Gilchic (Ep. II)', true);
    NpcType.Garanz2 = new NpcType(id++, 'Garanz (Ep. II)', true);
    NpcType.Dubwitch2 = new NpcType(id++, 'Dubwitch (Ep. II)', true);
    NpcType.Delsaber2 = new NpcType(id++, 'Delsaber (Ep. II)', true);
    NpcType.ChaosSorcerer2 = new NpcType(id++, 'Chaos Sorcerer (Ep. II)', true);
    NpcType.GolDragon = new NpcType(id++, 'Gol Dragon', true);

    NpcType.SinowBerill = new NpcType(id++, 'Sinow Berill', true);
    NpcType.SinowSpigell = new NpcType(id++, 'Sinow Spigell', true);
    NpcType.Merillia = new NpcType(id++, 'Merillia', true);
    NpcType.Meriltas = new NpcType(id++, 'Meriltas', true);
    NpcType.Mericarol = new NpcType(id++, 'Mericarol', true);
    NpcType.Merikle = new NpcType(id++, 'Merikle', true);
    NpcType.Mericus = new NpcType(id++, 'Mericus', true);
    NpcType.UlGibbon = new NpcType(id++, 'Ul Gibbon', true);
    NpcType.ZolGibbon = new NpcType(id++, 'Zol Gibbon', true);
    NpcType.Gibbles = new NpcType(id++, 'Gibbles', true);
    NpcType.Gee = new NpcType(id++, 'Gee', true);
    NpcType.GiGue = new NpcType(id++, 'Gi Gue', true);
    NpcType.GalGryphon = new NpcType(id++, 'Gal Gryphon', true);

    NpcType.Deldepth = new NpcType(id++, 'Deldepth', true);
    NpcType.Delbiter = new NpcType(id++, 'Delbiter', true);
    NpcType.Dolmolm = new NpcType(id++, 'Dolmolm', true);
    NpcType.Dolmdarl = new NpcType(id++, 'Dolmdarl', true);
    NpcType.Morfos = new NpcType(id++, 'Morfos', true);
    NpcType.Recobox = new NpcType(id++, 'Recobox', true);
    NpcType.Epsilon = new NpcType(id++, 'Epsilon', true);
    NpcType.SinowZoa = new NpcType(id++, 'Sinow Zoa', true);
    NpcType.SinowZele = new NpcType(id++, 'Sinow Zele', true);
    NpcType.IllGill = new NpcType(id++, 'Ill Gill', true);
    NpcType.DelLily = new NpcType(id++, 'Del Lily', true);
    NpcType.OlgaFlow = new NpcType(id++, 'Olga Flow', true);

    NpcType.SandRappy = new NpcType(id++, 'Sand Rappy', true);
    NpcType.DelRappy = new NpcType(id++, 'Del Rappy', true);
    NpcType.Astark = new NpcType(id++, 'Astark', true);
    NpcType.SatelliteLizard = new NpcType(id++, 'Satellite Lizard', true);
    NpcType.Yowie = new NpcType(id++, 'Yowie', true);
    NpcType.MerissaA = new NpcType(id++, 'Merissa A', true);
    NpcType.MerissaAA = new NpcType(id++, 'Merissa AA', true);
    NpcType.Girtablulu = new NpcType(id++, 'Girtablulu', true);
    NpcType.Zu = new NpcType(id++, 'Zu', true);
    NpcType.Pazuzu = new NpcType(id++, 'Pazuzu', true);
    NpcType.Boota = new NpcType(id++, 'Boota', true);
    NpcType.ZaBoota = new NpcType(id++, 'Za Boota', true);
    NpcType.BaBoota = new NpcType(id++, 'Ba Boota', true);
    NpcType.Dorphon = new NpcType(id++, 'Dorphon', true);
    NpcType.DorphonEclair = new NpcType(id++, 'Dorphon Eclair', true);
    NpcType.Goran = new NpcType(id++, 'Goran', true);
    NpcType.PyroGoran = new NpcType(id++, 'Pyro Goran', true);
    NpcType.GoranDetonator = new NpcType(id++, 'Goran Detonator', true);
    NpcType.SaintMillion = new NpcType(id++, 'Saint Million', true);
    NpcType.Shambertin = new NpcType(id++, 'Shambertin', true);
} ());

export class Npc {
    @observable type: NpcType;
    @observable area_id: number;
    @observable section_id: number;
    @observable position: [number, number, number];

    constructor(
        type: NpcType,
        area_id: number,
        section_id: number,
        position: [number, number, number]
    ) {
        if (!type) throw new Error('type is required.');
        if (!is_int(area_id) || area_id < 0)
            throw new Error(`Expected area_id to be a non-negative integer, got ${area_id}.`);
        if (!is_int(section_id) || section_id < 0)
            throw new Error(`Expected section_id to be a non-negative integer, got ${section_id}.`);
        if (!position) throw new Error('position is required.');
        if (position.length !== 3) throw new Error('position should have 3 elements.');

        this.type = type;
        this.area_id = area_id;
        this.section_id = section_id;
        this.position = position;
    }
}

export class Quest {
    @observable name: string;
    @observable short_description: string;
    @observable long_description: string;
    @observable episode: number;
    @observable areas: Area[] = [];
    @observable area_variants: Map<number, number>; // Maps area ids to area variant ids
    @observable objs: Obj[];
    @observable npcs: Npc[];

    constructor(
        name: string,
        short_description: string,
        long_description: string,
        episode: number,
        area_variants: Map<number, number>,
        objs: Obj[],
        npcs: Npc[]
    ) {
        if (episode !== 1 && episode !== 2 && episode !== 4) throw new Error('episode should be 1, 2 or 4.');
        if (!objs) throw new Error('objs is required.');
        if (!npcs) throw new Error('npcs is required.');

        this.name = name;
        this.short_description = short_description;
        this.long_description = long_description;
        this.episode = episode;
        this.area_variants = area_variants;
        this.objs = objs;
        this.npcs = npcs;
    }
}

export class Section {
    id: number;
    @observable position: [number, number, number];
    @observable y_axis_rotation: number;

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
        if (y_axis_rotation < 0 || y_axis_rotation > 65535)
            throw new Error(`Expected y_axis_rotation to be between 0 and 65535, got ${y_axis_rotation}.`);

        this.id = id;
        this.position = position;
        this.y_axis_rotation = y_axis_rotation;
    }
}
