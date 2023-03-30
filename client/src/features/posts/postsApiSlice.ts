import { apiSlice } from "../../app/api/apiSlice";
import { ICode_Execution_Body, IPosts_Requst_Params, Post } from "../../interface";

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
        }),
        executeCode: builder.mutation({
            query: (body: ICode_Execution_Body) => ({
                url: '/api/posts/assignment/execute',
                method: 'POST',
                body: body
            })
        }),
        submitCode: builder.mutation({
            query: (body: ICode_Execution_Body) => ({
                url: '/api/posts/assignment/submit',
                method: 'POST',
                body: body
            })
        }),
        fetchExecutionResult: builder.mutation({
            query: (submission_token: string) => ({
                url: `/api/posts/assignment/fetch_result/${submission_token}`,
                method: 'GET'
            })
        }),
        fetchAccountPosts: builder.mutation({
            query: () => ({
                url: '/api/acccount/posts',
                method: 'GET'
            })
        }),
        deleteAccountPost: builder.mutation({
            query: (post_id: string) => ({
                url: `/api/posts`,
                method: 'DELETE',
                body: {post_id: post_id}
            })
        })
    })
})

export const {
    useAddNewPostMutation, useSearchPostsQuery, useViewPostQuery, useExecuteCodeMutation, useFetchExecutionResultMutation, useSubmitCodeMutation, useFetchAccountPostsMutation,
    useDeleteAccountPostMutation
} = postsApiSlice
