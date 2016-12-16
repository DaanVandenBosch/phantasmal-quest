import React from 'react';
import { connect } from 'react-redux';

const style = {
    borderCollapse: 'collapse',
    width: 280,
    margin: 10
};

const header_style = {
    textAlign: 'left'
}

const description_style = {
    whiteSpace: 'pre',
    padding: '10px 0'
};

function QuestInfoComponentRaw({quest}) {
    if (quest) {
        const episode = quest.episode === 4 ? 'IV' : (quest.episode === 2 ? 'II' : 'I');

        return (
            <table style={style}>
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
        );
    } else {
        return <table style={style} />;
    }
}

export const QuestInfoComponent = connect(
    state => ({ quest: state.get('current_quest') })
)(QuestInfoComponentRaw);
