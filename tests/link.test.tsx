import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { act } from 'react'
import { beforeEach, afterEach, it, expect } from 'vitest'

import {
  init as _init,
  remove,
  setData,
  createReducer,
  addChild,
  removeChild,
  addLink,
  removeLink,
  type State,
  type Thunk,
} from '../src/index'
import { useReducer, getRootNode, getLinkIDs, getLinkID } from '../src/index'

let container: HTMLDivElement | null
let root: ReactDOM.Root | null
beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)

  root = ReactDOM.createRoot(container)

  // @ts-expect-error IS_REACT_ACT_ENVIRONMENT
  global.IS_REACT_ACT_ENVIRONMENT = true
})

afterEach(() => {
  root = null

  if (container === null) {
    return
  }
  document.body.removeChild(container)
  container = null
})

interface A extends State {}

interface B extends State {}

// biome-ignore lint/complexity/noBannedTypes: <explanation>
type Props = {}

it('link (init and remove)', () => {
  // setup app
  const aClass = 'test/a'
  const bClass = 'test/b'

  const initA = (myID: string): Thunk<A> => {
    return async (dispatch, _) => {
      dispatch(_init({ myID }))
    }
  }

  const initB = (myID: string): Thunk<B> => {
    return async (dispatch, _) => {
      dispatch(_init({ myID }))
    }
  }

  const DoA = {
    init: initA,
    remove,
    setData,
    addChild,
    addLink,
    removeChild,
    removeLink,
    default: createReducer(),
    myClass: aClass,
  }

  const DoB = {
    init: initB,
    remove,
    setData,
    addChild,
    addLink,
    removeChild,
    removeLink,
    default: createReducer(),
    myClass: bClass,
  }

  const App = (props: Props) => {
    const [stateA, doA] = useReducer(DoA)
    const [stateB, doB] = useReducer(DoB)

    console.log('doA:', doA)

    // init
    useEffect(() => {
      const aID = 'aID0'
      const bID0 = 'bID0'
      const bID1 = 'bID1'
      doA.init(aID)
      doB.init(bID0)
      doB.init(bID1)

      const link = { id: aID, do: doA, theClass: aClass }

      doB.addLink(bID0, link)
      doB.addLink(bID1, link)
    }, [])

    const a = getRootNode(stateA)
    console.log('link (init and remove): a:', a)
    if (!a) return <div />

    const bIDs = getLinkIDs(a, bClass)
    const bID = getLinkID(a, bClass)

    return (
      <div>
        <p>{bIDs.length}</p>
        <span>{bID}</span>
        {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
        <label>{bIDs[0]}</label>
        <button type='button' onClick={() => doB.remove(bIDs[0])} />
      </div>
    )
  }

  // do act
  act(() => {
    root?.render(<App />)
  })
  if (container === null) {
    return
  }

  const p = container.querySelector('p')
  const button = container.querySelector('button')
  const span = container.querySelector('span')
  const label = container.querySelector('label')

  expect(p).not.toBeNull()
  if (p === null) {
    return
  }
  expect(button).not.toBeNull()
  if (button === null) {
    return
  }
  expect(span).not.toBeNull()
  if (span === null) {
    return
  }
  expect(label).not.toBeNull()
  if (label === null) {
    return
  }

  expect(p.textContent).toBe('2')
  expect(span.textContent).toBe(label.textContent)
  expect(span.textContent).not.toBe('')

  // click button (1st)
  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })

  expect(p.textContent).toBe('1')
  expect(span.textContent).toBe(label.textContent)
  expect(span.textContent).not.toBe('')

  // click button (2nd)
  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })

  expect(p.textContent).toBe('0')
  expect(span.textContent).toBe('')
  expect(label.textContent).toBe('')
})

it('addLink', () => {
  // setup app
  const aClass = 'test/a'
  const bClass = 'test/b'

  const initA = (myID: string): Thunk<A> => {
    return async (dispatch, _) => {
      dispatch(_init({ myID }))
    }
  }

  const initB = (myID: string): Thunk<B> => {
    return async (dispatch, _) => {
      dispatch(_init({ myID }))
    }
  }

  const DoA = {
    init: initA,
    remove,
    setData,
    addChild,
    addLink,
    removeChild,
    removeLink,
    default: createReducer(),
    myClass: aClass,
  }

  const DoB = {
    init: initB,
    remove,
    setData,
    addChild,
    addLink,
    removeChild,
    removeLink,
    default: createReducer(),
    myClass: bClass,
  }

  const App = (props: Props) => {
    const [stateA, doA] = useReducer(DoA)
    const [stateB, doB] = useReducer(DoB)

    // init
    useEffect(() => {
      const aID = 'aID'
      const bID1 = 'bID1'
      const bID2 = 'bID2'
      doA.init(aID)
      doB.init(bID1)
      doB.init(bID2)

      doB.addLink(bID1, { id: aID, do: doA, theClass: aClass })
      doB.addLink(bID2, { id: aID, do: doA, theClass: aClass })
    }, [])

    const a = getRootNode(stateA)

    if (!a) return <div />

    const bIDs = getLinkIDs(a, bClass)

    return (
      <div>
        <p>{bIDs.length}</p>
        <button type='button' onClick={() => doB.remove(bIDs[0])} />
      </div>
    )
  }

  // do act
  act(() => {
    root?.render(<App />)
  })
  if (container === null) {
    return
  }
  const p = container.querySelector('p')
  const button = container.querySelector('button')
  expect(p).not.toBeNull()
  if (p === null) {
    return
  }
  expect(button).not.toBeNull()
  if (button === null) {
    return
  }

  expect(p.textContent).toBe('2')

  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })

  expect(p.textContent).toBe('1')

  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })

  expect(p.textContent).toBe('0')
})

it('removeLink', () => {
  // setup app
  const aClass = 'test/a'
  const bClass = 'test/b'

  const initA = (myID: string): Thunk<A> => {
    return async (dispatch, _) => {
      dispatch(_init({ myID }))
    }
  }

  const initB = (myID: string): Thunk<B> => {
    return async (dispatch, _) => {
      dispatch(
        _init({
          myID,
        }),
      )
    }
  }

  const DoA = {
    init: initA,
    remove,
    setData,
    addChild,
    addLink,
    removeChild,
    removeLink,
    default: createReducer(),
    myClass: aClass,
  }

  const DoB = {
    init: initB,
    remove,
    setData,
    addChild,
    addLink,
    removeChild,
    removeLink,
    default: createReducer(),
    myClass: bClass,
  }

  const App = (props: Props) => {
    const [stateA, doA] = useReducer(DoA)
    const [stateB, doB] = useReducer(DoB)

    // init
    useEffect(() => {
      const aID = 'aID'
      const bID0 = 'bID0'
      const bID1 = 'bID1'
      doA.init(aID)
      doB.init(bID0)
      doB.init(bID1)

      const link = { id: aID, do: doA, theClass: aClass }

      doB.addLink(bID0, link)
      doB.addLink(bID1, link)
    }, [])

    const a_q = getRootNode(stateA)

    if (!a_q) {
      return <div />
    }
    const a = a_q

    const bIDs = getLinkIDs(a, bClass)
    const stateBIDs = Object.keys(stateB.nodes)

    return (
      <div>
        <p>{bIDs.length}</p>
        {/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
        <label>{stateBIDs.length}</label>
        <button type='button' onClick={() => doA.removeLink(a.id, bIDs[0], bClass, false)} />
      </div>
    )
  }

  // do act
  act(() => {
    root?.render(<App />)
  })
  if (container === null) {
    return
  }

  const p = container.querySelector('p')
  const label = container.querySelector('label')
  const button = container.querySelector('button')
  expect(p).not.toBeNull()
  if (p === null) {
    return
  }
  expect(label).not.toBeNull()
  if (label === null) {
    return
  }
  expect(button).not.toBeNull()
  if (button === null) {
    return
  }

  expect(p.textContent).toBe('2')
  expect(label.textContent).toBe('2')

  // click button (1st)
  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })

  expect(p.textContent).toBe('1')
  expect(label.textContent).toBe('2')

  // click button (2nd)
  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })

  expect(p.textContent).toBe('0')
  expect(label.textContent).toBe('2')
})
