// @flow
import { CylinderGeometry, Mesh, MeshLambertMaterial, Object3D } from 'three';
import { autorun } from 'mobx';
import { Vec3, VisibleQuestEntity, QuestNpc, QuestObject, Section } from '../domain';

export const OBJECT_COLOR = 0xFFFF00;
export const OBJECT_HOVER_COLOR = 0xFFDF3F;
export const OBJECT_SELECTED_COLOR = 0xFFAA00;
export const NPC_COLOR = 0xFF0000;
export const NPC_HOVER_COLOR = 0xFF3F5F;
export const NPC_SELECTED_COLOR = 0xFF0054;

export function create_object_geometry(object: QuestObject, sections: Section[]): Object3D {
    return create_geometry(object, sections, OBJECT_COLOR, 'Object');
}

export function create_npc_geometry(npc: QuestNpc, sections: Section[]): Object3D {
    return create_geometry(npc, sections, NPC_COLOR, 'NPC');
}

function create_geometry(
    entity: VisibleQuestEntity,
    sections: Section[],
    color: number,
    type: string
): Object3D {
    let {x, y, z} = entity.position;

    const section = sections.find(s => s.id === entity.section_id);
    entity.section = section;

    if (section) {
        const {x: sec_x, y: sec_y, z: sec_z} = section.position;
        const sin_section_rotation = Math.sin(section.y_axis_rotation);
        const cos_section_rotation = Math.cos(section.y_axis_rotation);

        const rot_x = cos_section_rotation * x + sin_section_rotation * z;
        const rot_z = -sin_section_rotation * x + cos_section_rotation * z;
        x = rot_x + sec_x;
        y += sec_y;
        z = rot_z + sec_z;
    } else {
        console.warn(`Section ${entity.section_id} not found.`);
    }

    const cylinder = new CylinderGeometry(6, 6, 30);
    cylinder.translate(0, 15, 0);
    const cylinder_mesh = new Mesh(
        cylinder,
        new MeshLambertMaterial({
            color,
            transparent: true,
            opacity: 0.8,
        })
    );
    cylinder_mesh.name = type;
    cylinder_mesh.userData.entity = entity;

    // TODO: dispose autorun?
    autorun(() => {
        const {x, y, z} = entity.position;
        cylinder_mesh.position.set(x, y, z);
    });

    entity.position = new Vec3(x, y, z);

    return cylinder_mesh;
}