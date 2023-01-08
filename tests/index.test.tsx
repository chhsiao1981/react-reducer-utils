import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { act } from 'react-dom/test-utils'
import { init as _init, setData, createReducer, State, UseReducerParams, getNode, getState, getRoot, genUUID, Thunk, getRootID } from '../src/index'
import { useReducer, getRootNode } from '../src/index'

const mockuuidv4 = jest.fn(() => '123')

let container: any
let root: any
beforeEach(() => {
    // @ts-ignore
    container = document.createElement('div')
    // @ts-ignore
    document.body.appendChild(container)

    root = ReactDOM.createRoot(container)

    // @ts-ignore
    global.IS_REACT_ACT_ENVIRONMENT = true
})

afterEach(() => {
    root = null

    // @ts-ignore
    document.body.removeChild(container)
    container = null
})

interface Me extends State {
    count: number
}

interface Parent extends State {

}

type Props = {

}

it('example in README.md', () => {
    // setup app
    const myClass = 'test/test'

    const init = (): Thunk<Me> => {
        return async (dispatch, _) => {
            dispatch(_init({ state: { count: 0 } }, mockuuidv4))
        }
    }

    const increment = (myID: string): Thunk<Me> => {
        return async (dispatch, getClassState) => {
            let me = getNode(getClassState(), myID)
            if (!me) {
                return
            }

            dispatch(setData(myID, { count: me.state.count + 1 }))
        }
    }

    const increment2 = (myID: string): Thunk<Me> => {
        return async (dispatch, getClassState) => {
            let myState = getState(getClassState(), myID)
            if (!myState) {
                return
            }

            dispatch(setData(myID, { count: myState.count + 1 }))
        }
    }

    let DoIncrement: UseReducerParams<Me> = {
        init,
        increment,
        increment2,
        default: createReducer(),
        myClass,
    }

    const App = (props: Props) => {
        const [stateIncrement, doIncrement] = useReducer(DoIncrement)

        // init
        useEffect(() => {
            doIncrement.init()
            genUUID(mockuuidv4)
        }, [])

        let increment_q = getRootNode(stateIncrement)
        if (!increment_q) {
            return (<div style={{ display: 'none' }}></div>)
        }
        let myID = getRootID(stateIncrement)

        let increment = increment_q

        let increment2_q = getRoot(stateIncrement) || DoIncrement.defaultState!()
        let increment2 = increment2_q

        return (
            <div>
                <p>count: {increment.state.count}</p>
                <p>count: {increment2.count}</p>
                <button onClick={() => doIncrement.increment(myID)}></button>
                <button onClick={() => doIncrement.increment2(myID)}></button>
            </div>
        )
    }

    // do act
    act(() => {
        root.render(<App />)
    })

    const ps = container.querySelectorAll('p')
    const p = ps[0]
    const p1 = ps[1]
    const buttons = container.querySelectorAll('button')
    const button = buttons[0]
    const button1 = buttons[1]

    expect(p.textContent).toBe('count: 0')
    expect(p1.textContent).toBe(p.textContent)

    act(() => {
        // @ts-ignore
        button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(p.textContent).toBe('count: 1')
    expect(p1.textContent).toBe(p.textContent)

    act(() => {
        // @ts-ignore
        button1.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    })

    expect(p.textContent).toBe('count: 2')
    expect(p1.textContent).toBe(p.textContent)
})
