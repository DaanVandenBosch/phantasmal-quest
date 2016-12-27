import React from 'react';
import { observer } from 'mobx-react';
import { VisibleQuestEntity, QuestObject, QuestNpc } from '../domain';

const container_style = {
    width: 200,
    padding: 10,
    display: 'flex',
    flexDirection: 'column'
};

const table_style = {
    borderCollapse: 'collapse'
};

export const EntityInfoComponent = observer(({entity}: { entity: VisibleQuestEntity }) => {
    if (entity) {
        const pos = entity.position;
        const sect_pos = entity.section_position;
        let name = null;
        let type_specifics = null;

        if (entity instanceof QuestObject) {
            name = (
                <tr>
                    <td colSpan="2">{entity.type.name}</td>
                </tr>
            );
        }

        if (entity instanceof QuestNpc) {
            name = (
                <tr>
                    <td colSpan="2">{entity.type.name}</td>
                </tr>
            );
        }

        return (
            <div style={container_style}>
                <table style={table_style}>
                    <tbody>
                        {name}
                        <tr>
                            <td>Section: </td><td>{entity.section_id}</td>
                        </tr>
                        <tr>
                            <td colSpan="2">World position: </td>
                        </tr>
                        <tr>
                            <td>X: </td><td>{Math.round(pos.x)}</td>
                        </tr>
                        <tr>
                            <td>Y: </td><td>{Math.round(pos.y)}</td>
                        </tr>
                        <tr>
                            <td>Z: </td><td>{Math.round(pos.z)}</td>
                        </tr>
                        <tr>
                            <td colSpan="2">Section position: </td>
                        </tr>
                        <tr>
                            <td>X: </td><td>{Math.round(sect_pos.x)}</td>
                        </tr>
                        <tr>
                            <td>Y: </td><td>{Math.round(sect_pos.y)}</td>
                        </tr>
                        <tr>
                            <td>Z: </td><td>{Math.round(sect_pos.z)}</td>
                        </tr>
                        {type_specifics}
                    </tbody>
                </table>
            </div>
        );
    } else {
        return <div style={container_style} />;
    }
});
