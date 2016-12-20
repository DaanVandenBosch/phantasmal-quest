// @flow
import { is, Map } from 'immutable';
import * as THREE from 'three';
import {
    HemisphereLight,
    PerspectiveCamera,
    Raycaster,
    Scene,
    Vector2,
    Vector3,
    WebGLRenderer
} from 'three';
import OrbitControlsCreator from 'three-orbit-controls';
import { Quest } from '../domain';
import { get_area_collision_geometry } from '../area-data';
import { create_obj_geometry, create_npc_geometry } from './entities';

const OrbitControls = OrbitControlsCreator(THREE);

/**
 * Renders one quest area at a time.
 */
export class QuestRenderer {
    _renderer = new WebGLRenderer({ antialias: true, alpha: true });
    _camera: PerspectiveCamera;
    _controls: OrbitControls;
    _raycaster = new Raycaster();
    _pointer_position = new Vector2(0, 0);
    _scene = new Scene();
    _quest: ?Quest = null;
    _area = null;
    _objs = new Map();
    _npcs = new Map();
    _collision_geometry = null;
    _obj_geometry = null;
    _npc_geometry = null;
    _picking_data = null;

    constructor() {
        this._renderer.domElement.addEventListener(
            'mousedown', this._on_mouse_down);
        this._renderer.domElement.addEventListener(
            'mouseup', this._on_mouse_up);
        this._renderer.domElement.addEventListener(
            'mousemove', this._on_mouse_move);
        this._camera = new PerspectiveCamera(75, 1, 0.1, 5000);
        this._controls = new OrbitControls(
            this._camera, this._renderer.domElement);
        this._scene.add(new HemisphereLight(0xffffff, 0x505050, 1));
        requestAnimationFrame(this._render_loop);
    }

    get dom_element(): HTMLElement {
        return this._renderer.domElement;
    }

    set_size(width: number, height: number) {
        this._renderer.setSize(width, height);
        this._camera.aspect = width / height;
        this._camera.updateProjectionMatrix();
    }

    set_quest_and_area(quest: Quest, area: any) {
        let update = false;

        if (!is(this._quest, quest)) {
            this._quest = quest;
            this._objs = quest.objs
                .groupBy(obj => obj.area_id)
                .sortBy(obj => obj.area_id)
                .toOrderedMap();
            this._npcs = quest.npcs
                .groupBy(npc => npc.area_id)
                .sortBy(npc => npc.area_id)
                .toOrderedMap();
            update = true;
        }

        if (!is(this._area, area)) {
            this._area = area;
            update = true;
        }

        if (update) {
            this._update_geometry();
        }
    }

    _update_geometry() {
        this._scene.remove(this._collision_geometry);
        this._scene.remove(this._obj_geometry);
        this._scene.remove(this._npc_geometry);

        if (this._quest && this._area) {
            const episode = this._quest.episode;
            const area_id = this._area.id;
            const variant = this._quest.areas.get(this._area.id) || 0;

            get_area_collision_geometry(episode, area_id, variant).then(geometry => {
                if (this._quest && this._area) {
                    this._scene.remove(this._collision_geometry);
                    this._scene.remove(this._obj_geometry);
                    this._scene.remove(this._npc_geometry);

                    this._reset_camera();

                    this._collision_geometry = geometry;
                    this._scene.add(geometry);

                    const objs = this._objs.get(this._area.id);

                    if (objs) {
                        this._obj_geometry = create_obj_geometry(
                            objs, this._area.sections);
                        this._scene.add(this._obj_geometry);
                    }

                    const npcs = this._npcs.get(this._area.id);

                    if (npcs) {
                        this._npc_geometry = create_npc_geometry(
                            npcs, this._area.sections);
                        this._scene.add(this._npc_geometry);
                    }
                }
            });
        }
    }

    _reset_camera() {
        this._controls.reset();
        this._camera.position.set(0, 800, 700);
        this._camera.lookAt(new Vector3(0, 0, 0));
    }

    _render_loop = () => {
        this._controls.update();
        this._renderer.render(this._scene, this._camera);
        requestAnimationFrame(this._render_loop);
    }

    _on_mouse_down = (e: MouseEvent) => {
        const old_data = this._picking_data;
        this._pick_npc(this._pointer_pos_to_device_coords(e));
        const data = this._picking_data;

        if (old_data && data !== old_data) {
            old_data.object.material.color.set(0xff0000);
            old_data.object.material.transparent = true;
            old_data.selected = false;
        }

        if (data) {
            // User selected an entity.
            data.object.material.color.set(0xff0000);
            data.object.material.transparent = false;
            data.selected = true;
            this._controls.enabled = false;
        } else {
            this._controls.enabled = true;
        }
    }

    _on_mouse_up = (e: MouseEvent) => {
        const data = this._picking_data;

        if (data) {
            data.object.material.color.set(0xff0000);
            data.object.material.transparent = true;
            data.selected = false;
        }
    }

    _on_mouse_move = (e: MouseEvent) => {
        const pointer_pos = this._pointer_pos_to_device_coords(e);
        let data = this._picking_data;

        if (data) {
            if (data.selected) {
                // User is dragging a selected entity.
                // Cast ray adjusted for dragging entities.
                const terrain = this._pick_terrain(pointer_pos);

                if (terrain) {
                    data.object.position.copy(terrain.point);
                    data.object.position.y += data.drag_y;
                }

                return;
            }
        }

        // User is hovering.
        const old_data = data;
        this._pick_npc(pointer_pos);
        data = this._picking_data;

        if (old_data !== data) {
            if (old_data) {
                old_data.object.material.color.set(0xff0000);
                old_data.object.material.transparent = true;
                old_data.selected = false;
            }

            if (data) {
                data.object.material.color.set(0xff5050);
                data.object.material.transparent = true;
                data.selected = false;
            }
        }
    }

    _pointer_pos_to_device_coords(e: MouseEvent) {
        const {width, height} = this._renderer.getSize();
        return new Vector2(
            e.offsetX / width * 2 - 1,
            e.offsetY / height * -2 + 1);
    }

    /**
     * @param pointer_pos - pointer coordinates in normalized device space
     */
    _pick_npc(pointer_pos: Vector2) {
        if (!this._npc_geometry) {
            this._picking_data = null;
            return;
        }

        // Find the nearest NPC under the pointer.
        this._raycaster.setFromCamera(pointer_pos, this._camera);
        const [nearest_npc] = this._raycaster.intersectObjects(
            this._npc_geometry.children);

        if (!nearest_npc) {
            this._picking_data = null;
            return;
        }

        if (this._picking_data
            && nearest_npc.object === this._picking_data.object
            && nearest_npc.distance === this._picking_data.distance
        ) {
            return;
        }

        this._picking_data = nearest_npc;
        this._picking_data.drag_adjust = nearest_npc.object.position
            .clone()
            .sub(nearest_npc.point);
        this._picking_data.drag_y = 0;

        // Find vertical distance to terrain.
        this._raycaster.set(
            nearest_npc.object.position, new Vector3(0, -1, 0));
        const [terrain] = this._raycaster.intersectObject(
            this._collision_geometry.children[0], true);

        if (terrain) {
            this._picking_data.drag_adjust.sub(
                new Vector3(0, terrain.distance, 0));
            this._picking_data.drag_y += terrain.distance;
        }
    }

    /**
     * @param pointer_pos - pointer coordinates in normalized device space
     */
    _pick_terrain(pointer_pos: Vector2) {
        let data = this._picking_data;

        this._raycaster.setFromCamera(pointer_pos, this._camera);
        this._raycaster.ray.origin.add(data.drag_adjust);
        const terrains = this._raycaster.intersectObject(
            this._collision_geometry.children[0], true);

        // Don't allow entities to be placed on very steep terrain.
        // E.g. walls.
        for (const terrain of terrains) {
            if (terrain.face.normal.y > 0.75) {
                return terrain;
            }
        }

        return null;
    }
}
