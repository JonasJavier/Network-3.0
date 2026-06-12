import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { api, fetchPage } from '../lib/api'
import type { Comment, CountPage, LikeResponse } from '../lib/types'
import { updatePostEverywhere } from './usePosts'

export function useComments(postId: number, enabled = true) {
  return useInfiniteQuery({
    queryKey: ['comments', postId],
    enabled,
    queryFn: ({ pageParam }) =>
      fetchPage<CountPage<Comment>>(pageParam ?? `/posts/${postId}/comments/`),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next,
  })
}

export function useAddComment(postId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: { content: string; parent?: number }) => {
      const { data } = await api.post<Comment>(`/posts/${postId}/comments/`, input)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      updatePostEverywhere(queryClient, postId, (post) => ({
        ...post,
        comments_count: post.comments_count + 1,
      }))
    },
  })
}

export function useDeleteComment(postId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (commentId: number) => {
      await api.delete(`/comments/${commentId}/`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      updatePostEverywhere(queryClient, postId, (post) => ({
        ...post,
        comments_count: Math.max(0, post.comments_count - 1),
      }))
    },
  })
}

export function useLikeComment(postId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (commentId: number) => {
      const { data } = await api.post<LikeResponse>(`/comments/${commentId}/like/`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
    },
  })
}
