import { createSlice, PayloadAction, Reducer } from "@reduxjs/toolkit"
import { RootState } from "../../app/store"


interface IInitialState {
    user: string | null
    token: string | null
}

const initialState: IInitialState = { user: null, token: null }

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setCredentials: (state, action: PayloadAction<IInitialState>) => {
            const { user, token } = action.payload
            state.user = user
            state.token = token
        },
        logOut: (state) => {
            state.user = null
            state.token = null
        }
    },
})

export const { setCredentials, logOut } = authSlice.actions
export default authSlice.reducer as Reducer
export const selectCurrentUser = (state: RootState) => state.auth.user
export const selectCurrentToken = (state: RootState) => state.auth.token
