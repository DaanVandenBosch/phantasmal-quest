// @flow
import { is, Map } from 'immutable';
import * as THREE from 'three';
import { HemisphereLight, PerspectiveCamera, Scene, Vector3, WebGLRenderer } from 'three';
import OrbitControlsCreator from 'three-orbit-controls';
import { Quest } from '../domain';
import { get_area_collision_geometry } from '../area-data';
import { create_npc_geometry } from './npcs';

const OrbitControls = OrbitControlsCreator(THREE);

/**
 * Renders one quest area at a time.
 */
export class QuestRenderer {
    _renderer = new WebGLRenderer({ antialias: true, alpha: true });
    _camera: PerspectiveCamera;
    _controls: OrbitControls;
    _scene = new Scene();
    _quest: ?Quest = null;
    _area = null;
    _npcs = Map();
    _collision_geometry = null;
    _npc_geometry = null;

    constructor() {
        this._camera = new PerspectiveCamera(75, 1, 0.1, 5000);
        this._controls = new OrbitControls(this._camera, this._renderer.domElement);
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
        this._scene.remove(this._npc_geometry);

        if (this._quest && this._area) {
            const episode = this._quest.episode;
            const area_id = this._area.id;
            const variant = this._quest.areas.get(this._area.id) || 0;

            get_area_collision_geometry(episode, area_id, variant).then(geometry => {
                if (this._quest && this._area) {
                    this._scene.remove(this._collision_geometry);
                    this._scene.remove(this._npc_geometry);

                    this._reset_camera();

                    this._collision_geometry = geometry;
                    this._scene.add(geometry);

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
}
