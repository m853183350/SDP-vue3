import http from '@/http';

interface SinglePostsData {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}

export const getPostsById = (id: string) => {
  return http.get<SinglePostsData>({
    url: `/posts/${id}`,
    interceptors: {
      requestInterceptors(config) {
        console.log('接口请求');
        return config;
      },
      responseInterceptors(result) {
        console.log('接口响应');
        return result;
      },
    },
  });
};
interface Posts {
  userId: number;
  id: number;
  title: string;
  body: string;
}
export const getPosts = () => {
  return http.get<Posts[]>({ url: '/posts' });
};
export default {
  getPostsById,
  getPosts,
};
