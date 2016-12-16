import React from 'react';
import { connect } from 'react-redux';

const style = {
    minWidth: 200,
    margin: 10
};

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
                    <tr><th colSpan="2">{quest.name}</th></tr>
                    <tr><td colSpan="2" style={description_style}>{quest.short_description}</td></tr>
                    <tr><td colSpan="2" style={description_style}>{quest.long_description}</td></tr>
                    <tr><td>Episode:</td><td>{episode}</td></tr>
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
