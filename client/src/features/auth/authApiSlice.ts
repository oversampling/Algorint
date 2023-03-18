import { apiSlice } from "../../app/api/apiSlice";

export const authApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        login: builder.mutation({ // this endpoint derive useLoginMutation hook
            query: credentials => ({
                url: '/auth',
                method: 'POST',
                body: { ...credentials }
            })
        }),
        googleLogin: builder.mutation({
            query: (code: string) => ({
                url: '/auth/google',
                method: 'POST',
                body: { "code": code}
            })
        }),
    })
})

export const {
    useLoginMutation, useGoogleLoginMutation
} = authApiSlice
