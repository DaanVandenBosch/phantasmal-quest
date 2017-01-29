// @flow
import React from 'react';
import { Object3D } from 'three';
import { entity_selected } from '../actions';
import { Renderer } from '../rendering/Renderer';
import { Area, Quest, VisibleQuestEntity } from '../domain';

export class Area3DComponent extends React.Component {
    _renderer = new Renderer({
        on_select: this._on_select.bind(this)
    });

    render() {
        return <div style={this.props.style} ref={this._modify_dom} />;
    }

    componentWillReceiveProps({quest, area, model}: { quest: ?Quest, area: ?Area, model: ?Object3D }) {
        if (model) {
            this._renderer.set_model(model);
        } else {
            this._renderer.set_quest_and_area(quest, area);
        }
    }

    shouldComponentUpdate() {
        return false;
    }

    _modify_dom = (div: HTMLDivElement) => {
        this._renderer.set_size(div.clientWidth, div.clientHeight);
        div.appendChild(this._renderer.dom_element);
    }

    _on_select(entity: ?VisibleQuestEntity) {
        entity_selected(entity);
    }
}
