// @flow
import React from 'react';
import { observer } from 'mobx-react';
import { application_state } from '../store';
import { current_area_id_changed, load_file } from '../actions';
import { Style } from './utils';
import { Area3DComponent } from './Area3DComponent';
import { EntityInfoComponent } from './EntityInfoComponent';
import { QuestInfoComponent } from './QuestInfoComponent';

@observer
export class ApplicationComponent extends React.Component {
    _main_container_style = Object.assign(Style.fill(), {
        display: 'flex',
        flexDirection: 'column'
    });
    _header_style = {
        padding: '0 20px',
        display: 'flex',
    };
    _controls_style = {
        flex: 1,
        padding: '10px 30px',
        alignSelf: 'center'
    };
    _area_select = {
        margin: '0 10px',
    };
    _main_style = {
        flex: 1,
        display: 'flex',
        overflow: 'hidden'
    };
    _area_3d_style = {
        flex: 1
    };

    render() {
        const quest = application_state.current_quest;
        const area_ids = quest ? [...quest.areas].map(a => a.id) : null;
        const area = application_state.current_area
        const area_id = area && area.id;

        return (
            <div style={this._main_container_style}>
                <div style={this._header_style}>
                    <h1>Phantasmal Quest Viewer</h1>
                    <div style={this._controls_style}>
                        <input
                            type="file"
                            accept=".qst"
                            onChange={this._on_file_change} />
                        {area_ids ? (
                            <select
                                style={this._area_select}
                                onChange={this._on_area_select_change}
                                defaultValue={area_id}>
                                {area_ids.map(area_id =>
                                    <option key={area_id} value={area_id}>Area {area_id}</option>)}
                            </select>) : null}
                    </div>
                </div>
                <div style={this._main_style}>
                    <QuestInfoComponent
                        quest={quest} />
                    <Area3DComponent
                        style={this._area_3d_style}
                        quest={quest}
                        area={area} />
                    <EntityInfoComponent entity={application_state.selected_entity} />
                </div>
            </div>
        );
    }

    _on_file_change = (e: Event) => {
        if (e.currentTarget instanceof HTMLInputElement) {
            const file = e.currentTarget.files[0];

            if (file) {
                load_file(file);
            }
        }
    }

    _on_area_select_change = (e: Event) => {
        if (e.currentTarget instanceof HTMLSelectElement) {
            const area_id = parseInt(e.currentTarget.value, 10);
            current_area_id_changed(area_id);
        }
    }
}
