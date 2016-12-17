// @flow
import { List, OrderedSet } from 'immutable';
import { CylinderGeometry, Mesh, MeshLambertMaterial, Object3D } from 'three';

export function create_npc_geometry(npcs: List<any>, sections: OrderedSet<any>): Object3D {
    const object = new Object3D();

    for (const npc of npcs) {
        let [x, y, z] = npc.position;

        const section = sections.find(s => s.id === npc.section_id);

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
            console.warn(`NPC section ${npc.section_id} not found.`);
        }

        const cylinder = new CylinderGeometry(6, 6, 30);
        cylinder.translate(x, y + 15, z);
        object.add(
            new Mesh(
                cylinder,
                new MeshLambertMaterial({
                    color: 0xff0000,
                    transparent: true,
                    opacity: 0.8,
                })
            )
        );
    }

    return object;
}
