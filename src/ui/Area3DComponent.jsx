// @flow
import React from 'react';
import { connect } from 'react-redux';
import QuestRenderer from '../rendering/QuestRenderer';

class Area3DComponent extends React.Component {
    _renderer = new QuestRenderer();

    render() {
        return <div style={this.props.style} ref={this._modify_dom} />;
    }

    componentWillReceiveProps({quest, area}) {
        this._renderer.quest = quest;
        this._renderer.area = area;
    }

    shouldComponentUpdate() {
        return false;
    }

    _modify_dom = div => {
        this._renderer.set_size(div.offsetWidth, div.offsetHeight);
        div.appendChild(this._renderer.dom_element);
    }
}

export default connect(
    state => ({
        quest: state.get('current_quest'),
        area: state.get('areas').get(state.get('current_area_id'))
    })
)(Area3DComponent);
