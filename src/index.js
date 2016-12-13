// @flow
import { Map } from 'immutable';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, applyMiddleware, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { AREA_LOADED, CURRENT_AREA_ID_CHANGED, NEW_QUEST } from './actions';
import ApplicationComponent from './ui/ApplicationComponent';

const compose_enhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
    (state: Map<string, any>, action) => {
        switch (action.type) {
            case AREA_LOADED:
                const area = action.payload;
                return state.setIn(['areas', area.id], area);
            case CURRENT_AREA_ID_CHANGED:
                return state.set('current_area_id', action.payload);
            case NEW_QUEST:
                const quest = action.payload;
                return state.merge({
                    current_quest: quest,
                    current_area_id: quest.area_ids.first()
                });
            default:
                return state;
        }
    },
    Map({
        current_quest: null,
        current_area_id: null,
        areas: Map()
    }),
    compose_enhancers(applyMiddleware(thunkMiddleware))
);

ReactDOM.render(
    <Provider store={store}>
        <ApplicationComponent />
    </Provider>,
    document.getElementById('phantq-root')
);
