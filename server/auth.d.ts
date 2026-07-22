declare module "#auth-utils" {
  interface User {
    user: {
      slug: string;
      admin?: boolean;
    };
  }
}

export {};
