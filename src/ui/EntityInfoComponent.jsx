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
        const {x, y, z} = entity.position;
        let name = null;
        let type_specifics = null;

        if (entity instanceof QuestObject) {
            type_specifics = null;
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
                            <td>Position: </td>
                            <td>{Math.round(x)}, {Math.round(y)}, {Math.round(z)}</td>
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
