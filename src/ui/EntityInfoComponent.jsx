import React from 'react';
import { connect } from 'react-redux';
import { Npc } from '../domain';

const container_style = {
    width: 140,
    padding: 10,
    display: 'flex',
    flexDirection: 'column'
};

const table_style = {
    borderCollapse: 'collapse'
};

function EntityInfoComponentRaw({entity}: { entity: Npc }) {
    if (entity) {
        return (
            <div style={container_style}>
                <table style={table_style}>
                    <tbody>
                        <tr>
                            <td colSpan="2">{entity.type.name}</td>
                        </tr>
                        <tr>
                            <td>Section: </td><td>{entity.section_id}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    } else {
        return <div style={container_style} />;
    }
}

export const EntityInfoComponent = connect(
    state => ({ entity: state.get('selected_entity') })
)(EntityInfoComponentRaw);
