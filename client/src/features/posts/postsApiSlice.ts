import { apiSlice } from "../../app/api/apiSlice";
import { IPosts_Requst_Params, Post } from "../../interface";

export const postsApiSlice = apiSlice.injectEndpoints({
    endpoints: (builder) => ({
        addNewPost: builder.mutation({
            query: (body: Post) => ({
                url: '/api/posts/new',
                method: 'POST',
                body: body
            })
        }),
        searchPosts: builder.query<Post[], IPosts_Requst_Params>({
            query: ({page, limit, stars, publishDate, search}) => ({
                url: '/api/posts',
                method: 'GET',
                params: {search: search, stars: stars, publishDate: publishDate, limit: limit, page: page}
            })
        }),
        viewPost: builder.query({
            query: (id: string) => ({
                url: `/api/posts/${id}`,
                method: 'GET'
            })
        })
    })
})

export const {
    /*useGetAllPostsQuery,*/ useAddNewPostMutation, useSearchPostsQuery, useViewPostQuery
} = postsApiSlice
