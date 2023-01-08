import { Dispatch as rDispatch, Reducer as rReducer, useRef } from 'react'
import useThunkReducer, { Thunk as rThunk } from './thunk-reducer'
import { v4 as uuidv4 } from 'uuid'

//State
export interface State {
    [key: string]: any
}

// NodeState
export type NodeState<S extends State> = {
    id: string,
    state: S
    _children?: NodeStateRelative | null
    _parent?: Node<any> | null
    _links?: NodeStateRelative | null
}

export type NodeStateMap<S extends State> = {
    [key: string]: NodeState<S>
}

// ClassState
export type ClassState<S extends State> = {
    myClass: string
    doMe: DispatchedAction<S>
    root?: string
    nodes: NodeStateMap<S>
}

// Thunk
export type Thunk<S extends State> = rThunk<ClassState<S>, Action<S>>

// Dispatch
export type Dispatch<S extends State> = rDispatch<Action<S>>

// Reducer
export type Reducer<S extends State> = rReducer<ClassState<S>, Action<S>>

// BaseAction
//
// BaseAction contains only {}-based actions, no thunk-based actions.
export interface BaseAction<S extends State> {
    myID: string
    type: string
    [key: string]: any
}

// Action
export type Action<S extends State> = Thunk<S> | BaseAction<S>

// DispatchedAction
export type DispatchedAction<S extends State> = { [key: string]: (...params: any[]) => void }

type DispatchedActionMap<S extends State> = { [key: string]: DispatchedAction<S> }

type RefDispatchedActionMap<S extends State> = { current: DispatchedActionMap<S> }

// ActionFunc
export type ActionFunc<S extends State> = (...params: any[]) => Action<S>

// ReduceFunc
export type ReduceFunc<S extends State> = (state: ClassState<S>, action: BaseAction<S>) => ClassState<S>

// Node
export type Node<S extends State> = { id: string, theClass: string, do: DispatchedAction<S> }

// NodeStateRelative
type NodeStateRelative = { [relativeClass: string]: { list: string[], do: DispatchedAction<any> } }

// UseReducerParams
export type UseReducerParams<S extends State> = {
    default: Reducer<S>
    defaultState?: () => S
    myClass: string
    [key: string]: ActionFunc<S> | Reducer<S> | (() => S) | string | undefined
}

// GetClassState
export type GetClassState<S extends State> = () => ClassState<S>

// InitParams
export type InitParams<S extends State> = {
    myID?: string
    parentID?: string
    doParent?: DispatchedAction<any>
    state?: S
}

/**********
 * useReducer
 **********/
export const useReducer = <S extends State>(theDo: UseReducerParams<S>): [ClassState<S>, DispatchedAction<S>] => {
    const dispatchedReducer: RefDispatchedActionMap<S> = useRef({})
    let currentDispatchedReducer = dispatchedReducer.current
    const { myClass } = theDo
    if (!currentDispatchedReducer[myClass]) {
        currentDispatchedReducer[myClass] = {}
    }
    let currentDispatched = currentDispatchedReducer[myClass]
    let nodes: NodeStateMap<S> = {}

    const [state, dispatch] = useThunkReducer<ClassState<S>, Action<S>>(theDo.default, { myClass, doMe: currentDispatched, nodes })

    Object.keys(theDo)
        .filter((each) => each !== 'default' && each !== 'defaultState' && each !== 'myClass')
        .reduce((val, each) => {
            // @ts-ignore because default and myClass are already filtered, the rest are ActionFunc<S>
            let action: ActionFunc<S> = theDo[each]
            val[each] = (...params: any[]) => dispatch(action(...params))
            return val
        }, currentDispatched)


    return [state, currentDispatched]
}

/*************
 * Reducer Default Functions
 *************/

/*****
 * init
 *****/
/***
 * init
 * params: myClass
 *         doMe
 *         parentID
 *         doParent
 *         links: [{id, myClass, do}]
 *         ...params
 */
export const init = <S extends State>(params: InitParams<S>, myuuidv4?: () => string): Thunk<S> => {
    return async (dispatch, getClassState) => {

        let myID = params.myID || genUUID(myuuidv4)

        const { parentID, doParent, state } = params
        dispatch(initCore(myID, parentID, doParent, state))

        const { myClass, doMe } = getClassState()

        // parent or root
        if (parentID && doParent) {
            doParent.addChild(parentID, { id: myID, theClass: myClass, do: doMe })
        } else {
            dispatch(setRoot(myID))
        }
    }
}

const INIT = 'react-reducer-state/INIT'
const initCore = <S extends State>(myID: string, parentID?: string, doParent?: DispatchedAction<any>, state?: S): BaseAction<S> => {
    return {
        myID,
        type: INIT,
        parentID,
        doParent,
        state,
    }
}

const reduceInit = <S extends State>(state: ClassState<S>, action: BaseAction<S>): ClassState<S> => {
    let { myID, parentID, doParent, state: theState } = action

    theState = theState || {}

    let me: NodeState<S> = {
        id: myID,
        state: theState,
        _children: {},
        _links: {},
    }
    if (parentID) {
        me._parent = { id: parentID, do: doParent, theClass: '' }
    }

    let newNodes: NodeStateMap<S> = Object.assign({}, state.nodes, { [myID]: me })
    let newState: ClassState<S> = Object.assign({}, state, { nodes: newNodes })

    return newState
}

/***
 * setRoot
 */
const SET_ROOT = 'react-reducer-state/SET_ROOT'
const setRoot = <S extends State>(myID: string): BaseAction<S> => ({
    myID,
    type: SET_ROOT,
})

const reduceSetRoot = <S extends State>(state: ClassState<S>, action: BaseAction<S>): ClassState<S> => {
    const { myID } = action

    return Object.assign({}, state, { root: myID })
}

/***
 * addChild
 */
const ADD_CHILD = 'react-reducer-state/ADD_CHILD'
export const addChild = <S extends State>(myID: string, child: Node<any>): BaseAction<S> => ({
    myID,
    type: ADD_CHILD,
    relative: child,
})

const reduceAddChild = <S extends State>(state: ClassState<S>, action: BaseAction<S>): ClassState<S> => {
    return reduceAddRelative(state, action, '_children')
}

/***
 * addLink
 */
export const addLink = <S extends State>(myID: string, link: Node<any>, isFromLink = false): Thunk<S> => {
    return async (dispatch, getClassState) => {
        dispatch(addLinkCore(myID, link))

        if (!isFromLink) { // I connect to the other, would like the other to connect to me as well.
            const { doMe, myClass } = getClassState()
            link.do.addLink(link.id, { id: myID, theClass: myClass, do: doMe }, true)
        }
    }
}

const ADD_LINK = 'react-reducer-state/ADD_LINK'
const addLinkCore = <S extends State>(myID: string, link: Node<any>): BaseAction<S> => ({
    myID,
    type: ADD_LINK,
    relative: link,
})

const reduceAddLink = <S extends State>(state: ClassState<S>, action: BaseAction<S>): ClassState<S> => {
    return reduceAddRelative(state, action, '_links')
}

const reduceAddRelative = <S extends State>(state: ClassState<S>, action: BaseAction<S>, relativeName: '_links' | '_children'): ClassState<S> => {
    const { myID, relative } = action
    let me = state.nodes[myID]
    if (!me) {
        return state
    }

    const { theClass, id: theID, do: theDo } = relative

    let relatives = me[relativeName] || {}
    let relativesByClass = relatives[theClass] || {}
    let relativeIDs = relativesByClass.list || []
    let newIDs = theID ? relativeIDs.concat([theID]) : relativeIDs

    let newRelatives = Object.assign({}, me[relativeName], { [theClass]: { list: newIDs, do: theDo } })
    let newMe = Object.assign({}, me, { [relativeName]: newRelatives })
    let newNodes = Object.assign({}, state.nodes, { [myID]: newMe })
    let newState = Object.assign({}, state, { nodes: newNodes })

    return newState
}

/*****
 * remove
 *****/
/***
 * remove
 * params: myID
 *         isFromParent
 */
export const remove = <S extends State>(myID: string, isFromParent = false): Thunk<S> => {
    return async (dispatch, getClassState) => {
        let state = getClassState()
        const { myClass, nodes: { [myID]: me } } = state
        if (!me) {
            return
        }

        // parent removes me
        let parent = me._parent
        if (!isFromParent && parent) {
            const { id: parentID, do: doParent } = parent
            if (parentID) {
                doParent.removeChild(parentID, myID, myClass, true)
            }
        }

        // remove children
        let children = me._children
        if (children) {
            let realChildren = children
            Object.keys(realChildren).map((eachClass) => {
                let child = realChildren[eachClass]
                child.list.map((eachID) => dispatch(removeChild(myID, eachID, eachClass, false)))
            })
        }

        // remove links
        let links = me._links || {}
        Object.keys(links).map((eachClass) => {
            let link = links[eachClass]
            link.list.map((eachID) => dispatch(removeLink(myID, eachID, eachClass, false)))
        })

        // remove me from myClass list
        dispatch(removeCore(myID))
    }
}

const REMOVE = 'react-reducer-state/REMOVE'
const removeCore = <S extends State>(myID: string): BaseAction<S> => ({
    myID,
    type: REMOVE,
})

const reduceRemove = <S extends State>(state: ClassState<S>, action: BaseAction<S>): ClassState<S> => {
    const { myID } = action

    let me = state.nodes[myID]
    if (!me) {
        return state
    }

    let newNodes = Object.keys(state.nodes)
        .filter((each) => each !== myID)
        .reduce((r: NodeStateMap<S>, x) => {
            r[x] = state.nodes[x]
            return r
        }, {})

    // root
    let newState = Object.assign({}, state, { nodes: newNodes })
    if (newState.root === myID) {
        delete newState.root
    }

    return newState
}

/***
 * remove-child
 */
export const removeChild = <S extends State>(myID: string, childID: string, childClass: string, isFromChild = false): Thunk<S> => {
    return async (dispatch, getClassState) => {
        let relationRemove = (theDo: DispatchedAction<S>) => theDo.remove(childID, true)
        removeRelation(dispatch, getClassState, myID, childID, childClass, isFromChild, relationRemove, removeChildCore, '_children')
    }
}

const REMOVE_CHILD = 'react-reducer-state/REMOVE_CHILD'
const removeChildCore = <S extends State>(myID: string, childID: string, childClass: string): BaseAction<S> => ({
    myID,
    type: REMOVE_CHILD,
    childID,
    childClass,
})

const reduceRemoveChild = <S extends State>(state: ClassState<S>, action: BaseAction<S>): ClassState<S> => {
    const { myID, childID, childClass } = action

    return reduceRemoveRelation(state, myID, childID, childClass, '_children')
}

/***
 * remove-link
 */
export const removeLink = <S extends State>(myID: string, linkID: string, linkClass: string, isFromLink = false): Thunk<S> => {
    return async (dispatch, getClassState) => {
        let myClass = getClassState().myClass
        let relationRemove = (theDo: DispatchedAction<S>) => theDo.removeLink(linkID, myID, myClass, true)
        removeRelation(dispatch, getClassState, myID, linkID, linkClass, isFromLink, relationRemove, removeLinkCore, '_links')
    }
}

const REMOVE_LINK = 'react-reducer-state/REMOVE_LINK'
const removeLinkCore = <S extends State>(myID: string, linkID: string, linkClass: string): BaseAction<S> => ({
    myID,
    type: REMOVE_LINK,
    linkID,
    linkClass,
})

const reduceRemoveLink = <S extends State>(state: ClassState<S>, action: BaseAction<S>): ClassState<S> => {
    const { myID, linkID, linkClass } = action

    return reduceRemoveRelation(state, myID, linkID, linkClass, '_links')
}

/***
 * remove-relation
 */
type RelationRemove<S extends State> = (theDo: DispatchedAction<S>) => void
type RemoveRelationCore<S extends State> = (myID: string, relationID: string, relationClass: string) => BaseAction<S>

const removeRelation = <S extends State>(dispatch: Dispatch<S>, getClassState: GetClassState<S>, myID: string, relationID: string, relationClass: string, isFromRelation: boolean, relationRemove: RelationRemove<any>, removeRelationCore: RemoveRelationCore<S>, relationName: '_links' | '_children') => {
    let state = getClassState()

    let me = state.nodes[myID]
    if (!me) {
        return
    }

    let relation = me[relationName]
    if (!relation) {
        return
    }
    let relationByClass = relation[relationClass]
    if (!relationByClass) {
        return
    }

    let newIDs = relationByClass.list.filter((eachID: string) => eachID !== relationID)
    if (relationByClass.list.length === newIDs.length) return

    if (!isFromRelation) {
        relationRemove(relationByClass.do)
    }

    dispatch(removeRelationCore(myID, relationID, relationClass))
}

const reduceRemoveRelation = <S extends State>(state: ClassState<S>, myID: string, relationID: string, relationClass: string, relationName: '_links' | '_children'): ClassState<S> => {
    let me = state.nodes[myID]
    if (!me) return state

    let relation = me[relationName]
    if (!relation) return state

    let relationByClass = relation[relationClass]
    if (!relationByClass) return state

    let relationIDs = relationByClass.list || []
    let newIDs = relationIDs.filter((eachID: string) => eachID !== relationID)
    if (relationIDs.length === newIDs.length) return state

    let newRelation = Object.assign({}, relation)
    if (newIDs.length == 0) {
        delete newRelation[relationClass]
    } else {
        let newRelationByClass = Object.assign({}, relationByClass, { list: newIDs })
        newRelation[relationClass] = newRelationByClass
    }

    let newMe = Object.assign({}, me, { [relationName]: newRelation })
    let newNodes = Object.assign({}, state.nodes, { [myID]: newMe })
    let newState = Object.assign({}, state, { nodes: newNodes })

    return newState
}

/*****
 * set data
 *****/
/***
 * setData
 * params: myID
 *         data
 */
const SET_DATA = 'react-reducer-state/SET_DATA'
export const setData = <S extends State>(myID: string, data: S): BaseAction<S> => ({
    myID,
    type: SET_DATA,
    data,
})

const reduceSetData = <S extends State>(state: ClassState<S>, action: BaseAction<S>): ClassState<S> => {
    const { myID, data } = action

    let me = state.nodes[myID]
    if (!me) return state

    let newMyState = Object.assign({}, me.state, data)
    let newMe = Object.assign({}, me, { state: newMyState })
    let newNodes = Object.assign({}, state.nodes, { [myID]: newMe })
    let newState = Object.assign({}, state, { nodes: newNodes })

    return newState
}


/*****
 * createReducer
 *****/

export type ReduceMap<S extends State> = { [key: string]: ReduceFunc<S> }

// theReduceMap
const defaultReduceMap_f = <S extends State>(): ReduceMap<S> => ({
    [INIT]: reduceInit,
    [ADD_CHILD]: reduceAddChild,
    [ADD_LINK]: reduceAddLink,
    [REMOVE]: reduceRemove,
    [REMOVE_CHILD]: reduceRemoveChild,
    [REMOVE_LINK]: reduceRemoveLink,
    [SET_DATA]: reduceSetData,
    [SET_ROOT]: reduceSetRoot,
})

/***
 * createReducer
 * params: reduceMap
 */
export const createReducer = <S extends State>(reduceMap?: ReduceMap<S>): Reducer<S> => {
    return (state: ClassState<S>, action: Action<S>): ClassState<S> => {
        if (!action) {
            return state
        }

        // @ts-ignore because all the action in reduceMap are BaseAction
        let baseAction: BaseAction<S> = action

        if (reduceMap && reduceMap[baseAction.type]) {
            return reduceMap[baseAction.type](state, baseAction)
        }

        let defaultReduceMap = defaultReduceMap_f<S>()
        if (defaultReduceMap[baseAction.type]) {
            return defaultReduceMap[baseAction.type](state, baseAction)
        }

        return state
    }
}

/***
 * Retrieving state
 ***/

export const getRootNode = <S extends State>(state: ClassState<S>): NodeState<S> | null => {
    let root = state.root
    if (!root) {
        return null
    }
    return state.nodes[root] || null
}

export const getRootID = <S extends State>(state: ClassState<S>): string => {
    return state.root || ''
}

export const getRoot = <S extends State>(state: ClassState<S>): S | null => {
    let root = state.root
    if (!root) {
        return null
    }
    let me = state.nodes[root]
    if (!me) {
        return null
    }
    return me.state
}

export const getNode = <S extends State>(state: ClassState<S>, myID: string): NodeState<S> | null => {
    return state.nodes[myID] || null
}

export const getState = <S extends State>(state: ClassState<S>, myID: string): S | null => {
    let me = state.nodes[myID]
    if (!me) {
        return null
    }
    return me.state
}

export const getChildIDs = <S extends State>(me: NodeState<S>, childClass: string): string[] => {
    return getRelativeIDs(me, childClass, '_children')
}

const getRelativeIDs = <S extends State>(me: NodeState<S>, relativeClass: string, relativeName: '_links' | '_children'): string[] => {
    let relatives = me[relativeName]
    if (!relatives) {
        return []
    }
    let relativesByClass = relatives[relativeClass]
    if (!relativesByClass) {
        return []
    }

    return relativesByClass.list
}

export const getChildID = <S extends State>(me: NodeState<S>, childClass: string): string => {
    return getRelativeID(me, childClass, '_children')
}

const getRelativeID = <S extends State>(me: NodeState<S>, relativeClass: string, relativeName: '_links' | '_children'): string => {
    let ids = getRelativeIDs(me, relativeClass, relativeName)
    return ids.length ? ids[0] : ''
}

export const getLinkIDs = <S extends State>(me: NodeState<S>, linkClass: string): string[] => {
    return getRelativeIDs(me, linkClass, '_links')
}

export const getLinkID = <S extends State>(me: NodeState<S>, linkClass: string): string => {
    return getRelativeID(me, linkClass, '_links')
}

/***
 * Utils
 ***/
const _GLOBAL_IDS = new Set()

const _GEN_UUID_COUNT = 3

const _GEN_UUID_STATE = {
    iterate: 1
}

export const genUUID = (myuuidv4?: () => string): string => {
    let theID = ''
    let isAdd = false
    for (let i = 0; i < _GEN_UUID_COUNT; i++) {
        theID = genUUIDCore(myuuidv4)
        if (_GLOBAL_IDS.has(theID)) {
            continue
        }
        _GLOBAL_IDS.add(theID)
        isAdd = true
        break
    }
    if (isAdd) {
        return theID
    }
    _GEN_UUID_STATE.iterate += 1
    theID = genUUIDCore()
    return theID
}

const genUUIDCore = (myuuidv4?: () => string): string => {
    let theID = ''
    let myuuid = myuuidv4 ? myuuidv4 : uuidv4
    for (let j = 0; j < _GEN_UUID_STATE.iterate; j++) {
        theID += myuuid()
    }
    return theID
}
