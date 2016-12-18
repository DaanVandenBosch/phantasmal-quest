import React from 'react';
import { connect } from 'react-redux';
import { NpcType, Quest } from '../domain';

const container_style = {
    width: 280,
    padding: 10,
    display: 'flex',
    flexDirection: 'column'
};

const table_style = {
    borderCollapse: 'collapse'
};

const description_style = {
    whiteSpace: 'pre',
    padding: '10px 0'
};

const npc_counts_container_style = {
    overflow: 'auto'
};

function QuestInfoComponentRaw({quest}: { quest: ?Quest }) {
    if (quest) {
        const episode = quest.episode === 4 ? 'IV' : (quest.episode === 2 ? 'II' : 'I');
        const npc_counts: [NpcType, number][] = quest.npcs
            .groupBy(npc => npc.type)
            .toList()
            .sortBy(npcs => npcs.first().type.id)
            .map(npcs => [npcs.first().type, npcs.size])
            .toJS();
        const extra_canadines = npc_counts.filter(
            ([npc_type]) => npc_type === NpcType.Canane).length * 8;

        const npc_count_rows = npc_counts.map(([npc_type, count]) => {
            const extra = npc_type === NpcType.Canadine ? extra_canadines : 0;
            return (
                <tr key={npc_type.id}>
                    <td>{npc_type.name}:</td>
                    <td>{count + extra}</td>
                </tr>
            );
        });

        return (
            <div style={container_style}>
                <table style={table_style}>
                    <tbody>
                        <tr>
                            <td>Name:</td><td>{quest.name}</td>
                        </tr>
                        <tr>
                            <td>Episode:</td><td>{episode}</td>
                        </tr>
                        <tr>
                            <td colSpan="2" style={description_style}>{quest.short_description}</td>
                        </tr>
                        <tr>
                            <td colSpan="2" style={description_style}>{quest.long_description}</td>
                        </tr>
                    </tbody>
                </table>
                <div style={npc_counts_container_style}>
                    <table style={table_style}>
                        <thead>
                            <tr><th>NPC Counts</th></tr>
                        </thead>
                        <tbody>
                            {npc_count_rows}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    } else {
        return <div style={container_style} />;
    }
}

export const QuestInfoComponent = connect(
    state => ({ quest: state.get('current_quest') })
)(QuestInfoComponentRaw);
