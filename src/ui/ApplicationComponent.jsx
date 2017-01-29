// @flow
import React from 'react';
import { observer } from 'mobx-react';
import { Button, Dialog, Intent } from '@blueprintjs/core';
import { application_state } from '../store';
import { current_area_id_changed, load_file, save_current_quest_to_file } from '../actions';
import { Style } from './utils';
import { Area3DComponent } from './Area3DComponent';
import { EntityInfoComponent } from './EntityInfoComponent';
import { QuestInfoComponent } from './QuestInfoComponent';

@observer
export class ApplicationComponent extends React.Component {
    state = {
        filename: (null: string | null),
        save_dialog_open: false,
        save_dialog_filename: 'Untitled'
    };

    _main_container_style = Object.assign(Style.fill(), {
        display: 'flex',
        flexDirection: 'column'
    });
    _heading_style = {
        fontSize: '22px'
    };
    _beta_style = {
        color: '#f55656',
        fontWeight: 'bold',
        marginLeft: 2
    };
    _file_upload_style = {
        display: 'inline-block',
        width: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        wordWrap: 'normal'
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
        const model = application_state.current_model;
        const areas = quest ? Array.from(quest.area_variants).map(a => a.area) : null;
        const area = application_state.current_area;
        const area_id = area && area.id;

        return (
            <div className="pt-app pt-dark" style={this._main_container_style}>
                <nav className="pt-navbar">
                    <div className="pt-navbar-group">
                        <div className="pt-navbar-heading" style={this._heading_style}>
                            Phantasmal Quest Editor
                            <sup style={this._beta_style}>BETA</sup>
                        </div>
                        <label className="pt-file-upload">
                            <input
                                type="file"
                                accept=".qst, .nj"
                                onChange={this._on_file_change} />
                            <span className="pt-file-upload-input">
                                <span style={this._file_upload_style}>
                                    {this.state.filename || 'Choose file...'}
                                </span>
                            </span>
                        </label>
                        {areas
                            ? (
                                <div className="pt-select" style={{ marginLeft: 10 }}>
                                    <select
                                        onChange={this._on_area_select_change}
                                        defaultValue={area_id}>
                                        {areas.map(area =>
                                            <option key={area.id} value={area.id}>{area.name}</option>)}
                                    </select>
                                </div>)
                            : null}
                        {quest
                            ? <Button
                                text="Save as..."
                                iconName="floppy-disk"
                                style={{ marginLeft: 10 }}
                                onClick={this._on_save_as_click} />
                            : null}
                    </div>
                </nav>
                <div style={this._main_style}>
                    <QuestInfoComponent
                        quest={quest} />
                    <Area3DComponent
                        style={this._area_3d_style}
                        quest={quest}
                        area={area}
                        model={model} />
                    <EntityInfoComponent entity={application_state.selected_entity} />
                </div>
                <Dialog
                    title="Save as..."
                    iconName="floppy-disk"
                    className="pt-dark"
                    style={{ width: 360 }}
                    isOpen={this.state.save_dialog_open}
                    onClose={this._on_save_dialog_close}>
                    <div className="pt-dialog-body">
                        <label className="pt-label pt-inline">
                            Name:
                            <input
                                autoFocus="true"
                                className="pt-input"
                                style={{ width: 200, margin: '0 10px 0 10px' }}
                                value={this.state.save_dialog_filename}
                                onChange={this._on_save_dialog_name_change}
                                onKeyUp={this._on_save_dialog_name_key_up} />
                            (.qst)
                        </label>
                    </div>
                    <div className="pt-dialog-footer">
                        <div className="pt-dialog-footer-actions">
                            <Button
                                text="Save"
                                style={{ marginLeft: 10 }}
                                onClick={this._on_save_dialog_save_click}
                                intent={Intent.PRIMARY} />
                        </div>
                    </div>
                </Dialog>
            </div>
        );
    }

    _on_file_change = (e: Event) => {
        if (e.currentTarget instanceof HTMLInputElement) {
            const file = e.currentTarget.files[0];

            if (file) {
                this.setState({
                    filename: file.name
                });
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

    _on_save_as_click = () => {
        let name = this.state.filename || 'Untitled';
        name = name.endsWith('.qst') ? name.slice(0, -4) : name;

        this.setState({
            save_dialog_open: true,
            save_dialog_filename: name
        });
    }

    _on_save_dialog_name_change = (e: Event) => {
        if (e.currentTarget instanceof HTMLInputElement) {
            this.setState({ save_dialog_filename: e.currentTarget.value });
        }
    }

    _on_save_dialog_name_key_up = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            this._on_save_dialog_save_click();
        }
    }

    _on_save_dialog_save_click = () => {
        save_current_quest_to_file(this.state.save_dialog_filename);
        this.setState({ save_dialog_open: false });
    }

    _on_save_dialog_close = () => {
        this.setState({ save_dialog_open: false });
    }
}
