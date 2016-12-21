// @flow
import { CylinderGeometry, Mesh, MeshLambertMaterial, Object3D } from 'three';
import { autorun } from 'mobx';
import { VisibleQuestEntity, QuestNpc, QuestObject, Section } from '../domain';

export function create_object_geometry(object: QuestObject, sections: Section[]): Object3D {
    return create_geometry(object, sections, 0xffff00, 'Object');
}

export function create_npc_geometry(npc: QuestNpc, sections: Section[]): Object3D {
    return create_geometry(npc, sections, 0xff0000, 'NPC');
}

function create_geometry(
    entity: VisibleQuestEntity,
    sections: Section[],
    color: number,
    type: string
): Object3D {
    let {x, y, z} = entity.position;

    const section = sections.find(s => s.id === entity.section_id);

    if (section) {
        const [sec_x, sec_y, sec_z] = section.position;
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
    cylinder_mesh.entity = entity;

    // TODO: dispose autorun?
    autorun(() => {
        const {x, y, z} = entity.position;
        cylinder_mesh.position.set(x, y, z);
    });

    entity.position = { x, y, z };

    return cylinder_mesh;
}