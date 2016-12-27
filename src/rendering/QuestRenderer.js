// @flow
import * as THREE from 'three';
import {
    Color,
    HemisphereLight,
    Object3D,
    PerspectiveCamera,
    Raycaster,
    Scene,
    Vector2,
    Vector3,
    WebGLRenderer
} from 'three';
import OrbitControlsCreator from 'three-orbit-controls';
import { Vec3, Area, Quest, VisibleQuestEntity, QuestObject, QuestNpc } from '../domain';
import { get_area_collision_geometry } from '../area-data';
import {
    OBJECT_COLOR,
    OBJECT_HOVER_COLOR,
    OBJECT_SELECTED_COLOR,
    NPC_COLOR,
    NPC_HOVER_COLOR,
    NPC_SELECTED_COLOR
} from './entities';

const OrbitControls = OrbitControlsCreator(THREE);

/**
 * Renders one quest area at a time.
 */
export class QuestRenderer {
    _renderer = new WebGLRenderer({ antialias: true });
    _camera: PerspectiveCamera;
    _controls: OrbitControls;
    _raycaster = new Raycaster();
    _pointer_position = new Vector2(0, 0);
    _scene = new Scene();
    _quest: ?Quest = null;
    _quest_entities_loaded = false;
    _area: Area = null;
    _objs: Map<number, QuestObject[]> = new Map(); // Objs grouped by area id
    _npcs: Map<number, QuestNpc[]> = new Map(); // Npcs grouped by area id
    _collision_geometry = null;
    _obj_geometry = new Object3D();
    _npc_geometry = new Object3D();
    _on_select = null;
    _hovered_data = null;
    _selected_data = null;

    constructor({on_select}) {
        this._on_select = on_select;

        this._renderer.domElement.addEventListener(
            'mousedown', this._on_mouse_down);
        this._renderer.domElement.addEventListener(
            'mouseup', this._on_mouse_up);
        this._renderer.domElement.addEventListener(
            'mousemove', this._on_mouse_move);

        this._camera = new PerspectiveCamera(75, 1, 0.1, 5000);
        this._controls = new OrbitControls(
            this._camera, this._renderer.domElement);

        this._scene.background = new Color(0x080808);
        this._scene.add(new HemisphereLight(0xffffff, 0x505050, 1));
        this._scene.add(this._obj_geometry);
        this._scene.add(this._npc_geometry);

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

    set_quest_and_area(quest: Quest, area: Area) {
        let update = false;

        if (this._area !== area) {
            this._area = area;
            update = true;
        }

        if (this._quest !== quest) {
            this._quest = quest;

            this._objs.clear();
            this._npcs.clear();

            if (quest) {
                for (const obj of quest.objects) {
                    const array = this._objs.get(obj.area_id) || [];
                    array.push(obj);
                    this._objs.set(obj.area_id, array);
                }

                for (const npc of quest.npcs) {
                    const array = this._npcs.get(npc.area_id) || [];
                    array.push(npc);
                    this._npcs.set(npc.area_id, array);
                }
            }

            update = true;
        }

        if (update) {
            this._update_geometry();
        }
    }

    _update_geometry() {
        this._scene.remove(this._obj_geometry);
        this._scene.remove(this._npc_geometry);
        this._obj_geometry = new Object3D();
        this._npc_geometry = new Object3D();
        this._scene.add(this._obj_geometry);
        this._scene.add(this._npc_geometry);
        this._quest_entities_loaded = false;

        this._scene.remove(this._collision_geometry);

        if (this._quest && this._area) {
            const episode = this._quest.episode;
            const area_id = this._area.id;
            const variant = this._quest.area_variants.find(v => v.area.id === area_id);
            const variant_id = (variant && variant.id) || 0;

            get_area_collision_geometry(episode, area_id, variant_id).then(geometry => {
                if (this._quest && this._area) {
                    this._scene.remove(this._collision_geometry);

                    this._reset_camera();

                    this._collision_geometry = geometry;
                    this._scene.add(geometry);
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
        this._add_loaded_entities();
        this._renderer.render(this._scene, this._camera);
        requestAnimationFrame(this._render_loop);
    }

    _add_loaded_entities() {
        if (this._quest && this._area && !this._quest_entities_loaded) {
            let loaded = true;

            for (const object of this._quest.objects) {
                if (object.area_id === this._area.id) {
                    if (object.object3d) {
                        this._obj_geometry.add(object.object3d);
                    } else {
                        loaded = false;
                    }
                }
            }

            for (const npc of this._quest.npcs) {
                if (npc.area_id === this._area.id) {
                    if (npc.object3d) {
                        this._npc_geometry.add(npc.object3d);
                    } else {
                        loaded = false;
                    }
                }
            }

            this._quest_entities_loaded = loaded;
        }
    }

    _on_mouse_down = (e: MouseEvent) => {
        const old_selected_data = this._selected_data;
        const data = this._pick_entity(
            this._pointer_pos_to_device_coords(e));

        // Did we pick a different object than the previously hovered over 3D object?
        if (this._hovered_data && (!data || data.object !== this._hovered_data.object)) {
            this._hovered_data.object.material.color.set(
                this._get_color(this._hovered_data.entity, 'normal'));
            this._hovered_data.object.material.transparent = true;
        }

        // Did we pick a different object than the previously selected 3D object?
        if (this._selected_data && (!data || data.object !== this._selected_data.object)) {
            this._selected_data.object.material.color.set(
                this._get_color(this._selected_data.entity, 'normal'));
            this._selected_data.object.material.transparent = true;
            this._selected_data.manipulating = false;
        }

        if (data) {
            // User selected an entity.
            data.object.material.color.set(this._get_color(data.entity, 'selected'));
            data.object.material.transparent = false;
            data.manipulating = true;
            this._hovered_data = data;
            this._selected_data = data;
            this._controls.enabled = false;
        } else {
            // User clicked on terrain or outside of area.
            this._hovered_data = null;
            this._selected_data = null;
            this._controls.enabled = true;
        }

        const selection_changed = old_selected_data && data
            ? old_selected_data.object !== data.object
            : old_selected_data !== data;

        if (selection_changed && this._on_select) {
            this._on_select(data && data.entity);
        }
    }

    _on_mouse_up = (e: MouseEvent) => {
        if (this._selected_data) {
            this._selected_data.manipulating = false;
            this._controls.enabled = true;
        }
    }

    _on_mouse_move = (e: MouseEvent) => {
        const pointer_pos = this._pointer_pos_to_device_coords(e);

        if (this._selected_data && this._selected_data.manipulating) {
            // User is dragging a selected entity.
            const data = this._selected_data;
            // Cast ray adjusted for dragging entities.
            const terrain = this._pick_terrain(pointer_pos, data);

            if (terrain) {
                data.entity.position = new Vec3(
                    terrain.point.x,
                    terrain.point.y + data.drag_y,
                    terrain.point.z
                );
            }
        } else {
            // User is hovering.
            const old_data = this._hovered_data;
            const data = this._pick_entity(pointer_pos);

            if (old_data && (!data || data.object !== old_data.object)) {
                if (!this._selected_data || old_data.object !== this._selected_data.object) {
                    old_data.object.material.color.set(
                        this._get_color(old_data.entity, 'normal'));
                    old_data.object.material.transparent = true;
                }

                this._hovered_data = null;
            }

            if (data && (!old_data || data.object !== old_data.object)) {
                if (!this._selected_data || data.object !== this._selected_data.object) {
                    data.object.material.color.set(
                        this._get_color(data.entity, 'hover'));
                    data.object.material.transparent = true;
                }

                this._hovered_data = data;
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
    _pick_entity(pointer_pos: Vector2): VisibleQuestEntity {
        // Find the nearest object and NPC under the pointer.
        this._raycaster.setFromCamera(pointer_pos, this._camera);
        const [nearest_object] = this._raycaster.intersectObjects(
            this._obj_geometry.children);
        const [nearest_npc] = this._raycaster.intersectObjects(
            this._npc_geometry.children);

        if (!nearest_object && !nearest_npc) {
            return null;
        }

        const object_dist = nearest_object ? nearest_object.distance : Infinity;
        const npc_dist = nearest_npc ? nearest_npc.distance : Infinity;
        const nearest_data = object_dist < npc_dist ? nearest_object : nearest_npc;

        nearest_data.entity = nearest_data.object.userData.entity;
        nearest_data.drag_adjust = nearest_data.object.position
            .clone()
            .sub(nearest_data.point);
        nearest_data.drag_y = 0;

        // Find vertical distance to terrain.
        this._raycaster.set(
            nearest_data.object.position, new Vector3(0, -1, 0));
        const [terrain] = this._raycaster.intersectObject(
            this._collision_geometry.children[0], true);

        if (terrain) {
            nearest_data.drag_adjust.sub(
                new Vector3(0, terrain.distance, 0));
            nearest_data.drag_y += terrain.distance;
        }

        return nearest_data;
    }

    /**
     * @param pointer_pos - pointer coordinates in normalized device space
     */
    _pick_terrain(pointer_pos: Vector2, data: any): * {
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

    _get_color(entity, type) {
        const is_npc = entity instanceof QuestNpc;

        switch (type) {
            default:
            case 'normal': return is_npc ? NPC_COLOR : OBJECT_COLOR;
            case 'hover': return is_npc ? NPC_HOVER_COLOR : OBJECT_HOVER_COLOR;
            case 'selected': return is_npc ? NPC_SELECTED_COLOR : OBJECT_SELECTED_COLOR;
        }
    }
}
