import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import { act } from 'react-dom/test-utils'
import { init as _init, remove, setData, createReducer, addChild, removeChild, addLink, removeLink } from '../src/index'
import { useReducer, getRoot, genUUID, getChildIDs, getChildID } from '../src/index'

let container
beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
})

afterEach(() => {
  document.body.removeChild(container)
  container = null;
})

it('children (init and remove)', () => {
  // setup app
  const parentClass = 'test/parent'
  const childClass = 'test/child'

  const initParent = (myID, doMe) => {
    return (dispatch, _) => {
      dispatch(_init({ myID, myClass: parentClass, doMe }))
    }
  }

  const initChild = (doMe, parentID, doParent) => {
    return (dispatch, _) => {
      dispatch(_init({ myClass: childClass, doMe, parentID, doParent }))
    }
  }

  let DoParent = {
    init: initParent,
    addChild,
    addLink,
    removeChild,
    removeLink,
    default: createReducer(),
  }

  let DoChild = {
    init: initChild,
    addChild,
    addLink,
    removeChild,
    removeLink,
    remove,
    setData,
    default: createReducer(),
  }

  const App = (props) => {
    const [stateParent, doParent] = useReducer(DoParent)
    const [stateChild, doChild] = useReducer(DoChild)
    const [parentID, setParentID] = useState('')

    // init
    useEffect(() => {
      let parentID = genUUID()
      console.log('children (init and remove): parentID:', parentID)
      doParent.init(parentID, doParent)
      doChild.init(doChild, parentID, doParent)
      doChild.init(doChild, parentID, doParent)
      setParentID(parentID)
    }, [])

    let parent = getRoot(stateParent)

    console.log('children (init and remove): parent:', parent)

    if (!parent) {
      return (<div />)
    }

    let childIDs = getChildIDs(parent, childClass)
    let childID = getChildID(parent, childClass)

    console.log('children (init and remove): childIDs:', childIDs)

    return (
      <div>
        <p>{childIDs.length}</p>
        <span>{childID}</span>
        <label>{childIDs[0]}</label>
        <label>{parentID}</label>
        <label>{parent.id}</label>
        <button onClick={() => doChild.remove(childIDs[0])}></button>
      </div>
    )
  }

  // do act
  act(() => {
    ReactDOM.render(<App />, container)
  })

  const p = container.querySelector('p')
  const button = container.querySelector('button')
  const labels = container.querySelectorAll('label')
  const label = labels[0]
  const label1 = labels[1]
  const label2 = labels[2]
  const span = container.querySelector('span')

  expect(label1.textContent).toBe(label2.textContent)
  expect(p.textContent).toBe('2')
  expect(label.textContent).toBe(span.textContent)

  console.log('to click button (1st)')
  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })

  expect(p.textContent).toBe('1')

  console.log('to click button (2nd)')
  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })

  expect(p.textContent).toBe('0')
})

it('removeChild', () => {
  // setup app
  const parentClass = 'test/parent'
  const childClass = 'test/child'

  const initParent = (myID, doMe) => {
    return (dispatch, _) => {
      dispatch(_init({ myID, myClass: parentClass, doMe }))
    }
  }

  const initChild = (doMe, parentID, doParent) => {
    return (dispatch, _) => {
      dispatch(_init({ myClass: childClass, doMe, parentID, doParent }))
    }
  }

  let DoParent = {
    init: initParent,
    addChild,
    addLink,
    removeChild,
    removeLink,
    default: createReducer(),
  }

  let DoChild = {
    init: initChild,
    addChild,
    addLink,
    removeChild,
    removeLink,
    remove,
    setData,
    default: createReducer(),
  }

  const App = (props) => {
    const [stateParent, doParent] = useReducer(DoParent)
    const [stateChild, doChild] = useReducer(DoChild)

    // init
    useEffect(() => {
      let parentID = genUUID()
      doParent.init(parentID, doParent)
      doChild.init(doChild, parentID, doParent)
      doChild.init(doChild, parentID, doParent)
    }, [])

    let parent = getRoot(stateParent)

    if (!parent) {
      return (<div />)
    }

    let childIDs = getChildIDs(parent, childClass)
    let stateChildIDs = Object.keys(stateChild.nodes)

    console.log('childIDs:', childIDs, 'stateChildIDs:', stateChildIDs)

    return (
      <div>
        <p>{childIDs.length}</p>
        <label>{stateChildIDs.length}</label>
        <button onClick={() => doParent.removeChild(parent.id, childIDs[0], childClass, false)}></button>
      </div>
    )
  }

  // do act
  act(() => {
    ReactDOM.render(<App />, container)
  })

  const p = container.querySelector('p')
  const label = container.querySelector('label')
  const button = container.querySelector('button')

  expect(p.textContent).toBe('2')
  expect(label.textContent).toBe('2')

  // click button (1st)
  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })

  expect(p.textContent).toBe('1')
  expect(label.textContent).toBe('1')

  // click button (2nd)
  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })

  expect(p.textContent).toBe('0')
  expect(label.textContent).toBe('0')
})

it('removeParent', () => {
  // setup app
  const parentClass = 'test/parent'
  const childClass = 'test/child'

  const initParent = (myID, doMe) => {
    return (dispatch, _) => {
      dispatch(_init({ myID, myClass: parentClass, doMe }))
    }
  }

  const initChild = (doMe, parentID, doParent) => {
    return (dispatch, _) => {
      dispatch(_init({ myClass: childClass, doMe, parentID, doParent }))
    }
  }

  let DoParent = {
    init: initParent,
    addChild,
    addLink,
    removeChild,
    removeLink,
    remove,
    setData,
    default: createReducer(),
  }

  let DoChild = {
    init: initChild,
    addChild,
    addLink,
    removeChild,
    removeLink,
    remove,
    setData,
    default: createReducer(),
  }

  const App = (props) => {
    const [stateParent, doParent] = useReducer(DoParent)
    const [stateChild, doChild] = useReducer(DoChild)
    const [stateParentID, setParentID] = useState('')

    // init
    useEffect(() => {
      let parentID = genUUID()
      doParent.init(parentID, doParent)
      doChild.init(doChild, parentID, doParent)
      doChild.init(doChild, parentID, doParent)
      setParentID(parentID)
    }, [])

    console.log('removeParent: to getRoot: parentID:', stateParentID)
    let parent = getRoot(stateParent)

    let childIDs = parent ? getChildIDs(parent, childClass) : []
    let stateChildIDs = stateChild && stateChild.nodes ? Object.keys(stateChild.nodes) : '(undefined)'

    console.log('childIDs:', childIDs, 'stateChildIDs:', stateChildIDs)

    return (
      <div>
        <p>{childIDs ? childIDs.length : ''}</p>
        <label>{stateChildIDs.length}</label>
        <label>{stateChildIDs ? stateChildIDs[0] : ''}</label>
        <span>{stateParentID}</span>
        <button onClick={() => doParent ? doParent.remove(parent.id) : null}></button>
      </div>
    )
  }

  // do act
  act(() => {
    ReactDOM.render(<App />, container)
  })

  const p = container.querySelector('p')
  const labels = container.querySelectorAll('label')
  const label = labels[0]
  const label1 = labels[1]
  const button = container.querySelector('button')

  expect(p.textContent).toBe('2')
  expect(label.textContent).toBe('2')

  // click button (1st)
  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  })

  expect(p.textContent).toBe('0')
  expect(label.textContent).toBe('0')
  expect(label1.textContent).toBe('')

})
