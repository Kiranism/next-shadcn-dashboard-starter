import { ApiResponse, Comment, Post, Todo, User } from './types';

const API_BASE_URL = 'https://jsonplaceholder.typicode.com';

async function fetchApi<T>(endpoint: string): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`);

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const postsApi = {
  getPosts: () => fetchApi<Post[]>('/posts'),
  getPost: (id: number) => fetchApi<Post>(`/posts/${id}`),
  getPostComments: (id: number) => fetchApi<Comment[]>(`/posts/${id}/comments`),
  createPost: async (post: Omit<Post, 'id'>) => {
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      body: JSON.stringify(post),
      headers: {
        'Content-type': 'application/json; charset=UTF-8'
      }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<Post>;
  },
  updatePost: async (id: number, post: Partial<Post>) => {
    const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(post),
      headers: {
        'Content-type': 'application/json; charset=UTF-8'
      }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<Post>;
  },
  deletePost: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<{}>;
  }
};

export const usersApi = {
  getUsers: () => fetchApi<User[]>('/users'),
  getUser: (id: number) => fetchApi<User>(`/users/${id}`),
  getUserPosts: (id: number) => fetchApi<Post[]>(`/users/${id}/posts`),
  getUserTodos: (id: number) => fetchApi<Todo[]>(`/users/${id}/todos`)
};

export const todosApi = {
  getTodos: () => fetchApi<Todo[]>('/todos'),
  getTodo: (id: number) => fetchApi<Todo>(`/todos/${id}`),
  createTodo: async (todo: Omit<Todo, 'id'>) => {
    const response = await fetch(`${API_BASE_URL}/todos`, {
      method: 'POST',
      body: JSON.stringify(todo),
      headers: {
        'Content-type': 'application/json; charset=UTF-8'
      }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<Todo>;
  },
  updateTodo: async (id: number, todo: Partial<Todo>) => {
    const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(todo),
      headers: {
        'Content-type': 'application/json; charset=UTF-8'
      }
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<Todo>;
  },
  deleteTodo: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<{}>;
  }
};
