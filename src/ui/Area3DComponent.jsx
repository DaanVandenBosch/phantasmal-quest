// @flow
import React from 'react';
import { entity_selected } from '../actions';
import { QuestRenderer } from '../rendering/QuestRenderer';

export class Area3DComponent extends React.Component {
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
        entity_selected(entity);
    }
}
