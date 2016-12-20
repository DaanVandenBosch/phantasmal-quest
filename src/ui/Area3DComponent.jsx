// @flow
import React from 'react';
import { connect } from 'react-redux';
import { entity_selected } from '../actions';
import { QuestRenderer } from '../rendering/QuestRenderer';

class Area3DComponentRaw extends React.Component {
    _renderer = new QuestRenderer({
        on_select: this._on_select.bind(this)
    });

    render() {
        return <div style={this.props.style} ref={this._modify_dom} />;
    }

    componentWillReceiveProps({quest, area}) {
        this._renderer.set_quest_and_area(quest, area);
    }

    shouldComponentUpdate() {
        return false;
    }

    _modify_dom = div => {
        this._renderer.set_size(div.clientWidth, div.clientHeight);
        div.appendChild(this._renderer.dom_element);
    }

    _on_select(entity) {
        this.props.dispatch(entity_selected(entity));
    }
}

export const Area3DComponent = connect(
    state => ({
        quest: state.get('current_quest'),
        area: state.get('areas').get(state.get('current_area_id'))
    })
)(Area3DComponentRaw);
