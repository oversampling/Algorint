import { BaseQueryApi, createApi, FetchArgs, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { setCredentials, logOut } from '../../features/auth/authSlice'
import { RootState } from '../store'
import { env } from '../../../env'

const baseQuery = fetchBaseQuery({
    baseUrl: env.SERVER_URL || '',
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
        const token = (getState() as RootState).auth.token
        if (token) {
            headers.set("authorization", `Bearer ${token}`)
        }
        return headers
    }
})

const baseQueryWithReauth = async (args: string | FetchArgs, api: BaseQueryApi, extraOptions: {}) => {
    let result = await baseQuery(args, api, extraOptions)

    if (result?.error?.status === 403) {
        console.log('sending refresh token')
        // send refresh token to get new access token
        const refreshResult: any = await baseQuery('/auth/google/refresh-token', api, extraOptions)
        console.log(refreshResult)
        if (refreshResult?.data) {
            const user = (api.getState() as RootState).auth.user
            // store the new token
            api.dispatch(setCredentials({ token: refreshResult.data.tokens as string, user }))
            // retry the original query with new access token
            result = await baseQuery(args, api, extraOptions)
            console.log(result)
            return result
        } else {
            api.dispatch(logOut())
        }
    }

    return result
}

export const apiSlice = createApi({
    baseQuery: baseQueryWithReauth,
    endpoints: builder => ({})
})
