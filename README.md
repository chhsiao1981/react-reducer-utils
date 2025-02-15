react-reducer-utils
==========

[![codecov](https://codecov.io/gh/chhsiao1981/react-reducer-utils/branch/main/graph/badge.svg)](https://codecov.io/gh/chhsiao1981/react-reducer-utils)

Utilities to help construct "normalized" states when using useReducer in react-hook.

Adopting concept of [redux-duck](https://github.com/PlatziDev/redux-duck)

`React-Reducer-Utils` is with the following additional features:

1. The development of the reducers follows the concept of redux-duck.
2. Similar to mapDispatchToProps, the bound-dispatched-actions are generated through useReducer().

Starting from `5.0.1`, this library supports only [typescript](https://www.typescriptlang.org/).

Install
-----

    npm install react-reducer-utils

Example
-----

Reducer able to do increment (reducers/increment.ts):

```
    import {init as _init, setData, createReducer, Thunk, getState} from 'react-reducer-utils'

    export const myClass = 'demo/Increment'

    interface Me extends State {
        count: number
    }

    export const init = (): Thunk<Me> => {
      return async (dispatch, getClassState) => {
        dispatch(_init({state: {count: 0}}))
      }
    }

    export const increment = (myID: string): Thunk<Me> => {
      return async (dispatch, getClassState) => {
        let classState = getClassState()
        let me = getState(classState, myID)
        if(!me) {
            return
        }

        dispatch(setData(myID, { count: me.count + 1 }))
      }
    }

    export default createReducer()
```

App.ts:

```
    import * as DoIncrement from './reducers/increment'
    import {useReducer, getRoot} from 'react-reducer-utils'

    type Props = {

    }

    export default (props: Props) => {
      const [stateIncrement, doIncrement] = useReducer<Me>(DoIncrement)

      //init
      useEffect(() => {
        doIncrement.init()
      }, [])

      // to render
      let increment = getRoot(stateIncrement)
      if(!increment) {
        return (<div></div>)
      }

      return (
        <div>
          <p>count: {increment.count}</p>
          <button onClick={() => doIncrement.increment(increment.id)}>increase</button>
        </div>
      )
    }
```

Normalized State
-----

The general concept of normalized state can be found in [Normalizing State Shape](https://redux.js.org/recipes/structuring-reducers/normalizing-state-shape)
with the following features:

1. ClassState: the state of the class, including the nodes and the root of the class.
2. NodeState: the state of a node, including the id, children, parent, links of the node, and the content (state) of the node.
3. State: the content of the node, represented as a state.
4. The concept of "parent" and "children" and "links" is embedded in the NodeState.
    * remove (me):
        - initiate "remove" for all the children.
        - remove from the parent.
        - remove from all the links.
    * remove child:
        - the child initiate "remove".
    * remove link:
        - the link initiate "remove link" on me.
4. To avoid complication, currently there is only 1 parent.

For example, the example [in the redux link](https://redux.js.org/recipes/structuring-reducers/normalizing-state-shape) is represented as:

```
    statePost = {
        myClass: 'post',
        doMe: (DispatchedAction<Post>),
        nodes: {
            [uuid-post1] : {
                id: uuid-post1,
                state: {
                    author : uuid-user1,
                    body : "......",
                },
                _parent: {
                    id: uuid-user1,
                    do: doUser
                },
                _links: {
                    comment : {
                        list: [uuid-comment1, uuid-comment2],
                        do: doComment
                    }
                }
            },
            [uuid-post2] : {
                id : uuid-post2,
                state: {
                    author : uuid-user2,
                    body : "......",
                },
                _parent: {
                    id: uuid-user2,
                    do: doUser
                },
                _links: {
                    comment : {
                        list: [uuid-comment3, uuid-comment4, uuid-comment5],
                        do: doComment
                    }
                }
            }
        }
    }
```

and:

```
    stateComment = {
        myClass: 'comment',
        doMe: (DispatchedAction<Comment>),
        nodes: {
            [uuid-comment1] : {
                id: uuid-comment1,
                state: {
                    author : uuid-user2,
                    comment : ".....",
                },
                _parent: {
                    id: uuid-user2,
                    do: doUser
                },
                _links: {
                    post: {
                        list: [uuid-post1],
                        do: doPost
                    }
                }
            },
            [uuid-comment2] : {
                id : uuid-comment2,
                state: {
                    author : uuid-user3,
                    comment : ".....",
                },
                _parent: {
                    id: uuid-user3,
                    do: doUser
                },
                _links: {
                    post: {
                        list: [uuid-post1],
                        do: doPost
                    }
                }
            },
            [uuid-comment3] : {
                id : uuid-comment3,
                state: {
                    author : uuid-user3,
                    comment : ".....",
                },
                _parent: {
                    id: uuid-user3,
                    do: doUser
                },
                _links: {
                    post: {
                        list: [uuid-post2],
                        do: doPost
                    }
                }
            },
            [uuid-comment4] : {
                id : uuid-comment4,
                state: {
                    author : uuid-user1,
                    comment : ".....",
                },
                _parent: {
                    id: uuid-user1,
                    do: doUser
                },
                _links: {
                    post: {
                        list: [uuid-post2],
                        do: doPost
                    }
                }
            },
            [uuid-comment5] : {
                id : uuid-comment5,
                state: {
                    author : uuid-user3,
                    comment : ".....",
                },
                _parent: {
                    id: uuid-user3,
                    do: doUser
                },
                _links: {
                    post: {
                        list: [uuid-post2],
                        do: doPost
                    }
                }
            },
        }
    }
```

and:
```
    stateUser = {
        myClass: 'user',
        doMe: (DispatchedAction<User>),
        nodes: {
            [uuid-user1] : {
                id: uuid-user1,
                state: {
                    username : "user1",
                    name : "User 1",
                },
                _children: {
                    post: {
                        list: [uuid-post1],
                        do: doPost,
                    },
                    comment: {
                        list: [uuid-comment4],
                        do: doComment,
                    }
                }
            },
            [uuid-user2] : {
                id: uuid-user2,
                state: {
                    username : "user2",
                    name : "User 2",
                },
                _children: {
                    post: {
                        list: [uuid-post2],
                        do: doPost,
                    },
                    comment: {
                        list: [uuid-comment1],
                        do: doComment,
                    }
                }
            },
            [uuid-user3] : {
                id: uuid-user3,
                state: {
                    username : "user3",
                    name : "User 3",
                },
                _children: {
                    post: {
                        list: [uuid-post1],
                        do: doPost,
                    },
                    comment: {
                        list: [uuid-comment2, uuid-comment3, uuid-comment5],
                        do: doComment,
                    }
                }
            }
        }
    }
```

[APIs](https://github.com/chhsiao1981/react-reducer-utils/blob/main/types/src/index.d.ts)
-----


`useReducer(theDo: UseReducerParams): [ClassState, DispatchedAction]`
---

Similar to React.useReducer, but we use useThunkReducer, and we also bind the actions with dispatch (similar concept as mapDispatchToProps).

return: `[ClassState<S>, DispatchedAction<S>]`


`init({myID, parentID, doParent, state}, myuuidv4)`
---

initializing the react-object.


`addChild(myID, child)`
---

params:
* child: `{id, theClass, do}`


`addLink(myID, link, isFromLink=false)`
---

params:
* link: `{id, theClass, do}`


`remove(myID, isFromParent=false)`
---

remove the react-object.


`removeChild(myID, childID, childClass, isFromChild=false)`
---

remove the child (and delete the child) from myID.


`removeLink(myID, linkID, linkClass, isFromLink=false)`
---

remove the link from myID (and remove the link from linkID).


`setData(myID, data)`
---

set the data to myID.


`createReducer(reduceMap): Reducer`
---

params:
* reduceMap: `{}` representing the mapping of the additional reduce-map. referring to [theReduceMap](https://github.com/chhsiao1981/react-reducer-utils/blob/master/src/index.js#L323).


`getRootNode(state: ClassState): NodeState`
---

get the root node.


`getRootID(state: ClassState): string`
---

get the root id.


`getRoot(state: ClassState): State`
---

get the root-object in the state.


`getNode(state: ClassState, myID: string): NodeState`
---

get the object in the state.


`getState(state: ClassState, myID: string): State`
---

get the object in the state.


`getChildIDs(me: NodeState, childClass): string[]`
---
get the child-ids from the childClass in me.


`getChildID(me: NodeState, childClass): string`
---

get the only child-id (childIDs[0]) from the childClass in me.


`getLinkIDs(me: NodeState, linkClass): string[]`
---

get the link-ids from the linkClass in me.


`getLinkID(me: NodeState, linkClass): string`
---

get the only link-id (linkIDs[0]) from the linkClass in me.


`genUUID(myuuidv4?: () => string): string`
---

generate uuid for react-object.
