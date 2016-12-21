import React from 'react';
import { observer } from 'mobx-react';
import { QuestNpc } from '../domain';

const container_style = {
    width: 200,
    padding: 10,
    display: 'flex',
    flexDirection: 'column'
};

const table_style = {
    borderCollapse: 'collapse'
};

export const EntityInfoComponent = observer(({entity}: { entity: QuestNpc }) => {
    if (entity) {
        const {x, y, z} = entity.position;

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
                        <tr>
                            <td>Position: </td><td>{Math.round(x)}, {Math.round(y)}, {Math.round(z)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    } else {
        return <div style={container_style} />;
    }
});
