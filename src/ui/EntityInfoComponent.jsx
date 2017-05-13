import React from 'react';
import { observer } from 'mobx-react';
import { NumericInput } from '@blueprintjs/core';
import { VisibleQuestEntity, QuestObject, QuestNpc } from '../domain';
import './QuestInfoComponent.css';

const container_style = {
    width: 200,
    padding: 10,
    display: 'flex',
    flexDirection: 'column'
};

const table_style = {
    borderCollapse: 'collapse'
};

@observer
export class EntityInfoComponent extends React.Component {
    state = {
        position: {
            x: null,
            y: null,
            z: null,
        },
        section_position: {
            x: null,
            y: null,
            z: null,
        }
    };

    componentWillReceiveProps({ entity }: { entity: VisibleQuestEntity }) {
        if (this.props.entity !== entity) {
            this._clear_position_state();
        }
    }

    render() {
        const entity: ?VisibleQuestEntity = this.props.entity;

        if (entity) {
            const section_id = entity.section ? entity.section.id : entity.section_id;
            let name = null;

            if (entity instanceof QuestObject) {
                name = (
                    <tr>
                        <td>Object: </td><td colSpan="2">{entity.type.name}</td>
                    </tr>
                );
            } else if (entity instanceof QuestNpc) {
                name = (
                    <tr>
                        <td>NPC: </td><td>{entity.type.name}</td>
                    </tr>
                );
            }

            return (
                <div style={container_style}>
                    <table style={table_style}>
                        {name}
                        <tr>
                            <td>Section: </td><td>{section_id}</td>
                        </tr>
                        <tr>
                            <td colSpan="2">World position: </td>
                        </tr>
                        <tr>
                            <td colSpan="2">
                                <table>
                                    {this._coord_row('position', 'x')}
                                    {this._coord_row('position', 'y')}
                                    {this._coord_row('position', 'z')}
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="2">Section position: </td>
                        </tr>
                        <tr>
                            <td colSpan="2">
                                <table>
                                    {this._coord_row('section_position', 'x')}
                                    {this._coord_row('section_position', 'y')}
                                    {this._coord_row('section_position', 'z')}
                                </table>
                            </td>
                        </tr>
                    </table>
                </div>
            );
        } else {
            return <div style={container_style} />;
        }
    }

    _coord_row(pos_type: string, coord: string) {
        if (this.props.entity) {
            const entity = this.props.entity;
            const value_str = this.state[pos_type][coord];
            const value = value_str
                ? value_str
                // Do multiplication, rounding, division and || with zero to avoid numbers close to zero flickering between 0 and -0.
                : (Math.round(entity[pos_type][coord] * 10000) / 10000 || 0).toFixed(4);
            return (
                <tr>
                    <td>{coord.toUpperCase()}: </td>
                    <td>
                        <NumericInput
                            value={value}
                            className="pt-fill phantq-quest-info-component-coord"
                            buttonPosition="none"
                            onValueChange={this._pos_change[pos_type][coord]}
                            onBlur={this._coord_input_blurred} />
                    </td>
                </tr>
            );
        } else {
            return null;
        }
    }

    _pos_change = {
        position: {
            x: (value: number, value_str: string) => {
                this._pos_changed('position', 'x', value, value_str);
            },
            y: (value: number, value_str: string) => {
                this._pos_changed('position', 'y', value, value_str);
            },
            z: (value: number, value_str: string) => {
                this._pos_changed('position', 'z', value, value_str);
            }
        },
        section_position: {
            x: (value: number, value_str: string) => {
                this._pos_changed('section_position', 'x', value, value_str);
            },
            y: (value: number, value_str: string) => {
                this._pos_changed('section_position', 'y', value, value_str);
            },
            z: (value: number, value_str: string) => {
                this._pos_changed('section_position', 'z', value, value_str);
            }
        }
    };

    _pos_changed(pos_type: string, coord: string, value: number, value_str: string) {
        if (!isNaN(value)) {
            const entity = this.props.entity;

            if (entity) {
                const v = entity[pos_type].clone();
                v[coord] = value;
                entity[pos_type] = v;
            }
        }

        this.setState({
            [pos_type]: {
                [coord]: value_str
            }
        });
    }

    _coord_input_blurred = () => {
        this._clear_position_state();
    }

    _clear_position_state() {
        this.setState({
            position: {
                x: null,
                y: null,
                z: null,
            },
            section_position: {
                x: null,
                y: null,
                z: null,
            }
        });
    }
}
