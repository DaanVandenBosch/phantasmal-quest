// @flow
/*eslint default-case: ["off"]*/
import { ArrayBufferCursor } from './ArrayBufferCursor';
import { parse_qst } from './qst';
import { AreaVariant, QuestNpc, QuestObject, Quest, ObjectType, NpcType } from '../domain';
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
            obj_data.position,
            get_object_type(obj_data.type_id)
        )
    );
}

function parse_npc_data(episode: number, npcs: any[]): QuestNpc[] {
    return npcs.map(
        npc_data => new QuestNpc(
            npc_data.area_id,
            npc_data.section_id,
            npc_data.position,
            get_npc_type(episode, npc_data)
        )
    );
}

function get_object_type(type_id: number): ObjectType {
    switch (type_id) {
        case 0: return ObjectType.PlayerSet;
        case 1: return ObjectType.Particle;
        case 2: return ObjectType.Teleporter;
        case 3: return ObjectType.Warp;
        case 4: return ObjectType.LightCollision;
        case 5: return ObjectType.Item;
        case 6: return ObjectType.EnvSound;
        case 7: return ObjectType.FogCollision;
        case 8: return ObjectType.EventCollision;
        case 9: return ObjectType.CharaCollision;
        case 10: return ObjectType.ElementalTrap;
        case 11: return ObjectType.StatusTrap;
        case 12: return ObjectType.HealTrap;
        case 13: return ObjectType.LargeElementalTrap;
        case 14: return ObjectType.ObjRoomID;
        case 15: return ObjectType.Sensor;
        case 16: return ObjectType.UnknownItem16;
        case 17: return ObjectType.Lensflare;
        case 18: return ObjectType.ScriptCollision;
        case 19: return ObjectType.HealRing;
        case 20: return ObjectType.MapCollision;
        case 21: return ObjectType.ScriptCollisionA;
        case 22: return ObjectType.ItemLight;
        case 23: return ObjectType.RadarCollision;
        case 24: return ObjectType.FogCollisionSW;
        case 25: return ObjectType.BossTeleporter;
        case 26: return ObjectType.ImageBoard;
        case 27: return ObjectType.QuestWarp;
        case 28: return ObjectType.Epilogue;
        case 29: return ObjectType.UnknownItem29;
        case 30: return ObjectType.UnknownItem30;
        case 31: return ObjectType.UnknownItem31;
        case 32: return ObjectType.BoxDetectObject;
        case 33: return ObjectType.SymbolChatObject;
        case 34: return ObjectType.TouchPlateObject;
        case 35: return ObjectType.TargetableObject;
        case 36: return ObjectType.EffectObject;
        case 37: return ObjectType.CountDownObject;
        case 38: return ObjectType.UnknownItem38;
        case 39: return ObjectType.UnknownItem39;
        case 40: return ObjectType.UnknownItem40;
        case 41: return ObjectType.UnknownItem41;
        case 64: return ObjectType.MenuActivation;
        case 65: return ObjectType.TelepipeLocation;
        case 66: return ObjectType.BGMCollision;
        case 67: return ObjectType.MainRagolTeleporter;
        case 68: return ObjectType.LobbyTeleporter;
        case 69: return ObjectType.PrincipalWarp;
        case 70: return ObjectType.ShopDoor;
        case 71: return ObjectType.HuntersGuildDoor;
        case 72: return ObjectType.TeleporterDoor;
        case 73: return ObjectType.MedicalCenterDoor;
        case 74: return ObjectType.Elevator;
        case 75: return ObjectType.EasterEgg;
        case 76: return ObjectType.ValentinesHeart;
        case 77: return ObjectType.ChristmasTree;
        case 78: return ObjectType.ChristmasWreath;
        case 79: return ObjectType.HalloweenPumpkin;
        case 80: return ObjectType.TwentyFirstCentury;
        case 81: return ObjectType.Sonic;
        case 82: return ObjectType.WelcomeBoard;
        case 83: return ObjectType.Firework;
        case 84: return ObjectType.LobbyScreenDoor;
        case 85: return ObjectType.MainRagolTeleporterBattleInNextArea;
        case 86: return ObjectType.LabTeleporterDoor;
        case 87: return ObjectType.Pioneer2InvisibleTouchplate;
        case 128: return ObjectType.ForestDoor;
        case 129: return ObjectType.ForestSwitch;
        case 130: return ObjectType.LaserFence;
        case 131: return ObjectType.LaserSquareFence;
        case 132: return ObjectType.ForestLaserFenceSwitch;
        case 133: return ObjectType.LightRays;
        case 134: return ObjectType.BlueButterfly;
        case 135: return ObjectType.Probe;
        case 136: return ObjectType.RandomTypeBox1;
        case 137: return ObjectType.ForestWeatherStation;
        case 138: return ObjectType.Battery;
        case 139: return ObjectType.ForestConsole;
        case 140: return ObjectType.BlackSlidingDoor;
        case 141: return ObjectType.RicoMessagePod;
        case 142: return ObjectType.EnergyBarrier;
        case 143: return ObjectType.ForestRisingBridge;
        case 144: return ObjectType.SwitchNoneDoor;
        case 145: return ObjectType.EnemyBoxGrey;
        case 146: return ObjectType.FixedTypeBox;
        case 147: return ObjectType.EnemyBoxBrown;
        case 149: return ObjectType.EmptyTypeBox;
        case 150: return ObjectType.LaserFenseEx;
        case 151: return ObjectType.LaserSquareFenceEx;
        case 192: return ObjectType.FloorPanel1;
        case 193: return ObjectType.Caves4ButtonDoor;
        case 194: return ObjectType.CavesNormalDoor;
        case 195: return ObjectType.CavesSmashingPillar;
        case 196: return ObjectType.CavesSign1;
        case 197: return ObjectType.CavesSign2;
        case 198: return ObjectType.CavesSign3;
        case 199: return ObjectType.HexagalTank;
        case 200: return ObjectType.BrownPlatform;
        case 201: return ObjectType.WarningLightObject;
        case 203: return ObjectType.Rainbow;
        case 204: return ObjectType.FloatingJelifish;
        case 205: return ObjectType.FloatingDragonfly;
        case 206: return ObjectType.CavesSwitchDoor;
        case 207: return ObjectType.RobotRechargeStation;
        case 208: return ObjectType.CavesCakeShop;
        case 209: return ObjectType.Caves1SmallRedRock;
        case 210: return ObjectType.Caves1MediumRedRock;
        case 211: return ObjectType.Caves1LargeRedRock;
        case 212: return ObjectType.Caves2SmallRock1;
        case 213: return ObjectType.Caves2MediumRock1;
        case 214: return ObjectType.Caves2LargeRock1;
        case 215: return ObjectType.Caves2SmallRock2;
        case 216: return ObjectType.Caves2MediumRock2;
        case 217: return ObjectType.Caves2LargeRock2;
        case 218: return ObjectType.Caves3SmallRock;
        case 219: return ObjectType.Caves3MediumRock;
        case 220: return ObjectType.Caves3LargeRock;
        case 222: return ObjectType.FloorPanel2;
        case 223: return ObjectType.DestructableRockCaves1;
        case 224: return ObjectType.DestructableRockCaves2;
        case 225: return ObjectType.DestructableRockCaves3;
        case 256: return ObjectType.MinesDoor;
        case 257: return ObjectType.FloorPanel3;
        case 258: return ObjectType.MinesSwitchDoor;
        case 259: return ObjectType.LargeCryoTube;
        case 260: return ObjectType.ComputerLikeCalus;
        case 261: return ObjectType.GreenScreenOpeningAndClosing;
        case 262: return ObjectType.FloatingRobot;
        case 263: return ObjectType.FloatingBlueLight;
        case 264: return ObjectType.SelfDestructingObject1;
        case 265: return ObjectType.SelfDestructingObject2;
        case 266: return ObjectType.SelfDestructingObject3;
        case 267: return ObjectType.SparkMachine;
        case 268: return ObjectType.MinesLargeFlashingCrate;
        case 304: return ObjectType.RuinsSeal;
        case 320: return ObjectType.RuinsTeleporter;
        case 321: return ObjectType.RuinsWarpSiteToSite;
        case 322: return ObjectType.RuinsSwitch;
        case 323: return ObjectType.FloorPanel4;
        case 324: return ObjectType.Ruins1Door;
        case 325: return ObjectType.Ruins3Door;
        case 326: return ObjectType.Ruins2Door;
        case 327: return ObjectType.Ruins11ButtonDoor;
        case 328: return ObjectType.Ruins21ButtonDoor;
        case 329: return ObjectType.Ruins31ButtonDoor;
        case 330: return ObjectType.Ruins4ButtonDoor;
        case 331: return ObjectType.Ruins2ButtonDoor;
        case 332: return ObjectType.RuinsSensor;
        case 333: return ObjectType.RuinsFenceSwitch;
        case 334: return ObjectType.RuinsLaserFence4x2;
        case 335: return ObjectType.RuinsLaserFence6x2;
        case 336: return ObjectType.RuinsLaserFence4x4;
        case 337: return ObjectType.RuinsLaserFence6x4;
        case 338: return ObjectType.RuinsPoisonBlob;
        case 339: return ObjectType.RuinsPilarTrap;
        case 340: return ObjectType.PopupTrapNoTech;
        case 341: return ObjectType.RuinsCrystal;
        case 342: return ObjectType.Monument;
        case 345: return ObjectType.RuinsRock1;
        case 346: return ObjectType.RuinsRock2;
        case 347: return ObjectType.RuinsRock3;
        case 348: return ObjectType.RuinsRock4;
        case 349: return ObjectType.RuinsRock5;
        case 350: return ObjectType.RuinsRock6;
        case 351: return ObjectType.RuinsRock7;
        case 352: return ObjectType.Poison;
        case 353: return ObjectType.FixedBoxTypeRuins;
        case 354: return ObjectType.RandomBoxTypeRuins;
        case 355: return ObjectType.EnemyTypeBoxYellow;
        case 356: return ObjectType.EnemyTypeBoxBlue;
        case 357: return ObjectType.EmptyTypeBoxBlue;
        case 358: return ObjectType.DestructableRock;
        case 359: return ObjectType.PopupTrapsTechs;
        case 368: return ObjectType.FlyingWhiteBird;
        case 369: return ObjectType.Tower;
        case 370: return ObjectType.FloatingRocks;
        case 371: return ObjectType.FloatingSoul;
        case 372: return ObjectType.Butterfly;
        case 384: return ObjectType.LobbyGameMenu;
        case 385: return ObjectType.LobbyWarpObject;
        case 386: return ObjectType.Lobby1EventObjectDefaultTree;
        case 387: return ObjectType.UnknownItem387;
        case 388: return ObjectType.UnknownItem388;
        case 389: return ObjectType.UnknownItem389;
        case 390: return ObjectType.LobbyEventObjectStaticPumpkin;
        case 391: return ObjectType.LobbyEventObject3ChristmasWindows;
        case 392: return ObjectType.LobbyEventObjectRedAndWhiteCurtain;
        case 393: return ObjectType.UnknownItem393;
        case 394: return ObjectType.UnknownItem394;
        case 395: return ObjectType.LobbyFishTank;
        case 396: return ObjectType.LobbyEventObjectButterflies;
        case 400: return ObjectType.UnknownItem400;
        case 401: return ObjectType.GreyWallLow;
        case 402: return ObjectType.SpaceshipDoor;
        case 403: return ObjectType.GreyWallHigh;
        case 416: return ObjectType.TempleNormalDoor;
        case 417: return ObjectType.BreakableWallWallButUnbreakable;
        case 418: return ObjectType.BrokenCilinderAndRubble;
        case 419: return ObjectType.ThreeBrokenWallPiecesOnFloor;
        case 420: return ObjectType.HighBrickCilinder;
        case 421: return ObjectType.LyingCilinder;
        case 422: return ObjectType.BrickConeWithFlatTop;
        case 423: return ObjectType.BreakableTempleWall;
        case 424: return ObjectType.TempleMapDetect;
        case 425: return ObjectType.SmallBrownBrickRisingBridge;
        case 426: return ObjectType.LongRisingBridgeWithPinkHighEdges;
        case 427: return ObjectType.FourSwitchTempleDoor;
        case 448: return ObjectType.FourButtonSpaceshipDoor;
        case 512: return ObjectType.ItemBoxCca;
        case 513: return ObjectType.TeleporterEp2;
        case 514: return ObjectType.CCADoor;
        case 515: return ObjectType.SpecialBoxCCA;
        case 516: return ObjectType.BigCCADoor;
        case 517: return ObjectType.BigCCADoorSwitch;
        case 518: return ObjectType.LittleRock;
        case 519: return ObjectType.Little3StoneWall;
        case 520: return ObjectType.Medium3StoneWall;
        case 521: return ObjectType.SpiderPlant;
        case 522: return ObjectType.CCAAreaTeleporter;
        case 523: return ObjectType.UnknownItem523;
        case 524: return ObjectType.WhiteBird;
        case 525: return ObjectType.OrangeBird;
        case 527: return ObjectType.Saw;
        case 528: return ObjectType.LaserDetect;
        case 529: return ObjectType.UnknownItem529;
        case 530: return ObjectType.UnknownItem530;
        case 531: return ObjectType.Seagull;
        case 544: return ObjectType.Fish;
        case 545: return ObjectType.SeabedDoorWithBlueEdges;
        case 546: return ObjectType.SeabedDoorAlwaysOpenNonTriggerable;
        case 547: return ObjectType.LittleCryotube;
        case 548: return ObjectType.WideGlassWallBreakable;
        case 549: return ObjectType.BlueFloatingRobot;
        case 550: return ObjectType.RedFloatingRobot;
        case 551: return ObjectType.Dolphin;
        case 552: return ObjectType.CaptureTrap;
        case 553: return ObjectType.VRLink;
        case 576: return ObjectType.UnknownItem576;
        case 640: return ObjectType.WarpInBarbaRayRoom;
        case 672: return ObjectType.UnknownItem672;
        case 688: return ObjectType.GeeNest;
        case 689: return ObjectType.LabComputerConsole;
        case 690: return ObjectType.LabComputerConsoleGreenScreen;
        case 691: return ObjectType.ChairYelllowPillow;
        case 692: return ObjectType.OrangeWallWithHoleInMiddle;
        case 693: return ObjectType.GreyWallWithHoleInMiddle;
        case 694: return ObjectType.LongTable;
        case 695: return ObjectType.GBAStation;
        case 696: return ObjectType.TalkLinkToSupport;
        case 697: return ObjectType.InstaWarp;
        case 698: return ObjectType.LabInvisibleObject;
        case 699: return ObjectType.LabGlassWindowDoor;
        case 700: return ObjectType.UnknownItem700;
        case 701: return ObjectType.LabCelingWarp;
        case 768: return ObjectType.Ep4LightSource;
        case 769: return ObjectType.Cacti;
        case 770: return ObjectType.BigBrownRock;
        case 771: return ObjectType.BreakableBrownRock;
        case 832: return ObjectType.UnknownItem832;
        case 833: return ObjectType.UnknownItem833;
        case 896: return ObjectType.PoisonPlant;
        case 897: return ObjectType.UnknownItem897;
        case 898: return ObjectType.UnknownItem898;
        case 899: return ObjectType.OozingDesertPlant;
        case 901: return ObjectType.UnknownItem901;
        case 902: return ObjectType.BigBlackRocks;
        case 903: return ObjectType.UnknownItem903;
        case 904: return ObjectType.UnknownItem904;
        case 905: return ObjectType.UnknownItem905;
        case 906: return ObjectType.UnknownItem906;
        case 907: return ObjectType.FallingRock;
        case 908: return ObjectType.DesertPlantHasCollision;
        case 909: return ObjectType.DesertFixedTypeBoxBreakableCrystals;
        case 910: return ObjectType.UnknownItem910;
        case 911: return ObjectType.BeeHive;
        case 912: return ObjectType.UnknownItem912;
        case 913: return ObjectType.Heat;
        case 960: return ObjectType.TopOfSaintMillionEgg;
        case 961: return ObjectType.UnknownItem961;

        default: return ObjectType.Unknown;
    }
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
        case `${0x119}, 0, 4`: return regular ? NpcType.SaintMillion : NpcType.Kondrieu;
        case `${0x119}, 1, 4`: return regular ? NpcType.Shambertin : NpcType.Kondrieu;
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
