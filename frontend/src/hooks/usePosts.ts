import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query'
import { api, fetchPage } from '../lib/api'
import type { CursorPage, LikeResponse, Post } from '../lib/types'

export interface FeedFilters {
  feed?: 'following'
  author?: string
  search?: string
}

function feedPath(filters: FeedFilters): string {
  const params = new URLSearchParams()
  if (filters.feed) params.set('feed', filters.feed)
  if (filters.author) params.set('author', filters.author)
  if (filters.search) params.set('search', filters.search)
  const query = params.toString()
  return `/posts/${query ? `?${query}` : ''}`
}

export function usePostsFeed(filters: FeedFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['posts', filters],
    queryFn: ({ pageParam }) =>
      fetchPage<CursorPage<Post>>(pageParam ?? feedPath(filters)),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next,
  })
}

export function usePost(id: number) {
  return useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const { data } = await api.get<Post>(`/posts/${id}/`)
      return data
    },
  })
}

export interface PostInput {
  content: string
  image?: File | null
}

function postFormData({ content, image }: PostInput): FormData {
  const form = new FormData()
  form.append('content', content)
  if (image) form.append('image', image)
  return form
}

export function useCreatePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: PostInput) => {
      const { data } = await api.post<Post>('/posts/', postFormData(input))
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  })
}

export function useUpdatePost(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: PostInput) => {
      const { data } = await api.patch<Post>(`/posts/${id}/`, postFormData(input))
      return data
    },
    onSuccess: (post) => {
      updatePostEverywhere(queryClient, id, () => post)
    },
  })
}

export function useDeletePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/posts/${id}/`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  })
}

/** Apply an update to a post wherever it is cached (feeds + detail). */
export function updatePostEverywhere(
  queryClient: QueryClient,
  id: number,
  update: (post: Post) => Post,
) {
  queryClient.setQueriesData<InfiniteData<CursorPage<Post>>>(
    { queryKey: ['posts'] },
    (data) =>
      data && {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          results: page.results.map((post) => (post.id === id ? update(post) : post)),
        })),
      },
  )
  queryClient.setQueryData<Post>(['post', id], (post) => post && update(post))
}

export function useLikePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.post<LikeResponse>(`/posts/${id}/like/`)
      return data
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['posts'] })
      updatePostEverywhere(queryClient, id, (post) => ({
        ...post,
        is_liked: !post.is_liked,
        likes_count: post.likes_count + (post.is_liked ? -1 : 1),
      }))
    },
    onSuccess: (data, id) => {
      updatePostEverywhere(queryClient, id, (post) => ({
        ...post,
        is_liked: data.is_liked,
        likes_count: data.likes_count,
      }))
    },
    onError: (_error, id) => {
      updatePostEverywhere(queryClient, id, (post) => ({
        ...post,
        is_liked: !post.is_liked,
        likes_count: post.likes_count + (post.is_liked ? -1 : 1),
      }))
    },
  })
}
