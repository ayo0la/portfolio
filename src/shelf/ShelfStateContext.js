import { createContext, useContext } from 'react'

// { state, dispatch } from shelfReducer. Task 10 renders the open panel from this.
export const ShelfStateContext = createContext({ state: { open: null, flipped: false, focus: null }, dispatch: () => {} })
export const useShelfState = () => useContext(ShelfStateContext)
