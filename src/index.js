// @flow
import React from 'react';
import ReactDOM from 'react-dom';
// import { AREA_LOADED, CURRENT_AREA_ID_CHANGED, ENTITY_SELECTED, NEW_QUEST } from './actions';
import { ApplicationComponent } from './ui/ApplicationComponent';

// const store = createStore(
//     (state: Map<string, any>, action) => {
//         switch (action.type) {
//             case AREA_LOADED:
//                 const area = action.payload;
//                 return state.setIn(['areas', area.id], area);
//             case CURRENT_AREA_ID_CHANGED:
//                 return state.set('current_area_id', action.payload);
//             case ENTITY_SELECTED:
//                 return state.set('selected_entity', action.payload);
//             case NEW_QUEST:
//                 const quest = action.payload;
//                 const current_area_id = quest.areas.isEmpty()
//                     ? null
//                     : quest.areas.keySeq().first();
//                 return state.merge({
//                     current_quest: quest,
//                     current_area_id
//                 });
//             default:
//                 return state;
//         }
//     },
//     Map({
//         current_quest: null,
//         current_area_id: null,
//         areas: Map()
//     }),
//     compose_enhancers(applyMiddleware(thunkMiddleware))
// );

ReactDOM.render(
    <ApplicationComponent />,
    document.getElementById('phantq-root')
);
