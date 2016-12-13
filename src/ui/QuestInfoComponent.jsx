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

function QuestInfoComponent({quest}) {
    if (quest) {
        return (
            <table style={style}>
                <tbody>
                    <tr><th>{quest.name}</th></tr>
                    <tr><td style={description_style}>{quest.short_description}</td></tr>
                    <tr><td style={description_style}>{quest.long_description}</td></tr>
                </tbody>
            </table>
        );
    } else {
        return <table style={style} />;
    }
}

export default connect(
    state => ({ quest: state.get('current_quest') })
)(QuestInfoComponent);
