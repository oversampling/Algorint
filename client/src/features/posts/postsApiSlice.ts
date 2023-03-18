import { apiSlice } from "../../app/api/apiSlice";

export const authApiSlice = apiSlice.injectEndpoints({
    endpoints: builder => ({
        getAllPosts: builder.query({
            query: () => ({
                url: '/api/posts',
            })
        })
    })
})

export const {
    useGetAllPostsQuery
} = authApiSlice
