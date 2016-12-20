// @flow
import { OrderedMap } from 'immutable';
import React from 'react';
import { connect } from 'react-redux';
import { current_area_id_changed, new_file } from '../actions';
import { Style } from './utils';
import { Area3DComponent } from './Area3DComponent';
import { EntityInfoComponent } from './EntityInfoComponent';
import { QuestInfoComponent } from './QuestInfoComponent';

class ApplicationComponentRaw extends React.Component {
    _main_container_style = Object.assign(Style.fill(), {
        display: 'flex',
        flexDirection: 'column'
    });
    _header_style = {
        padding: '0 20px',
        display: 'flex',
    };
    _controls = {
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
        return (
            <div style={this._main_container_style}>
                <div style={this._header_style}>
                    <h1>Phantasmal Quest Viewer</h1>
                    <div style={this._controls}>
                        <input type="file" accept=".qst" onChange={this._on_file_change} />
                        {this.props.area_ids.isEmpty() ? null : (
                            <select
                                style={this._area_select}
                                onChange={this._on_area_select_change}
                                defaultValue={this.props.current_area_id}>
                                {this.props.area_ids.map(area_id =>
                                    <option key={area_id} value={area_id}>Area {area_id}</option>)}
                            </select>)}
                    </div>
                </div>
                <div style={this._main_style}>
                    <QuestInfoComponent />
                    <Area3DComponent style={this._area_3d_style} />
                    <EntityInfoComponent />
                </div>
            </div>
        );
    }

    _on_file_change = (e: Event) => {
        if (e.currentTarget instanceof HTMLInputElement) {
            const file = e.currentTarget.files[0];

            if (file) {
                this.props.dispatch(new_file(file));
            }
        }
    }

    _on_area_select_change = (e: Event) => {
        if (e.currentTarget instanceof HTMLSelectElement) {
            const area_id = parseInt(e.currentTarget.value, 10);
            this.props.dispatch(current_area_id_changed(area_id));
        }
    }
}

export const ApplicationComponent = connect(
    state => ({
        current_area_id: state.get('current_area_id'),
        area_ids: state.getIn(['current_quest', 'areas'], OrderedMap()).keySeq()
    })
)(ApplicationComponentRaw);
