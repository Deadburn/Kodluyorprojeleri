import { GraphQLServer, withFilter } from "graphql-yoga";
import { users, posts, comments } from "./data.js";
//add nanoid package
import { nanoid } from "nanoid";
import pubsub from "./pubsub.js";

const typeDefs = `
  # User type definition
  type User {
    id: ID!
    fullName: String!
    age: Int!
    posts: [Post!]!
    comments: [Comment!]!
  }

  input CreateUserInput {
    fullName: String!
    age: Int!
  }

  input UpdateUserInput {
    fullName: String
    age: Int
  }

  # Post type definition
  type Post {
    id: ID!
    title: String!
    user_id: ID!
    user: User!
    comments: [Comment!]!
  }

  input CreatePostInput {
    title: String!
    user_id: ID!
  }

  input UpdatePostInput {
    title: String
    user_id: ID
  }

  # Comment type definition
  type Comment {
    id: ID!
    text: String!
    post_id: ID!
    user_id: ID!
    user: User!
    post: Post!
  }

  input CreateCommentInput {
    text: String!
    post_id: ID!
    user_id: ID!
  }

  input UpdateCommentInput {
    text: String
    post_id: ID
    user_id: ID
  }

  type DeleteAllOutput {
    count: Int!
  }

  type Query {
    # User
    users: [User!]!
    user(id: ID!): User!

    # Post
    posts: [Post!]!
    post(id: ID!): Post!

    # Comment
    comments: [Comment!]!
    comment(id: ID!): Comment!
  }

  type Mutation {
    # User
    createUser(data: CreateUserInput!): User!
    updateUser(id: ID!, data: UpdateUserInput!): User!
    deleteUser(id: ID!): User!
    deleteAllUsers: DeleteAllOutput!

    # Post
    createPost(data: CreatePostInput!): Post!
    updatePost(id: ID!, data: UpdatePostInput!): Post!
    deletePost(id: ID!): Post!
    deleteAllPosts: DeleteAllOutput!

    # Comment
    createComment(data: CreateCommentInput!): Comment!
    updateComment(id: ID!, data: UpdateCommentInput!): Comment!
    deleteComment(id: ID!): Comment!
    deleteAllComments: DeleteAllOutput!
  }

  type Subscription {
    userCreated: User!
    userUpdated: User!
    userDeleted: User!

    postCreated(user_id: ID): Post!
    postUpdated: Post!
    postDeleted: Post!
    postCount: Int!

    commentCreated(post_id: ID): Comment!
    commentUpdated: Comment!
    commentDeleted: Comment!
  }

`;

const resolvers = {
  Subscription: {
    // User
    userCreated: {
      subscribe: (_, __, {pubsub}) =>  pubsub.asyncIterator('userCreated')
    },
    userUpdated: {
      subscribe: (_, __, {pubsub}) =>  pubsub.asyncIterator('userUpdated')
    },
    userDeleted: {
      subscribe: (_, __, {pubsub}) =>  pubsub.asyncIterator('userDeleted')
    },

    // Post
    postCreated: {
      subscribe: withFilter(
        (_, __, {pubsub}) => pubsub.asyncIterator('postCreated'),
        (payload, variables) => {
          // console.log("payload", payload);
          // console.log("variables", variables);

          return variables.user_id ? (payload.postCreated.user_id === variables.user_id) : true;

        },
      ),
    },
    postUpdated: {
      subscribe: (_, __, {pubsub}) => pubsub.asyncIterator('postUpdated')
    },
    postDeleted: {
      subscribe: (_, __, {pubsub}) => pubsub.asyncIterator('postDeleted')
    },
    postCount: {
      subscribe: (_, __, {pubsub}) => {
        setTimeout(() => {
          pubsub.publish('postCount', { postCount: posts.length});
        })

        return pubsub.asyncIterator('postCount')

      }
    },
    
    // Comment
    commentCreated: {
      subscribe: withFilter(
        (_, __, {pubsub}) => pubsub.asyncIterator('commentCreated'),
        (payload, variables) => {

          return variables.post_id ? (payload.commentCreated.post_id === variables.post_id) : true
        }
      )
    },
    commentUpdated: {
      subscribe: (_, __, {pubsub}) => pubsub.asyncIterator('commentUpdated')
    },
    commentDeleted: {
      subscribe: (_, __, {pubsub}) => pubsub.asyncIterator('commentDeleted')
    }
  },
  Mutation: {
    // User
    // Parent'ı kullanmadıgımız için _ diye bir değişken oluşturduk
    createUser: (_, { data }, { pubsub }) => {
      const user = {
        id: nanoid(),
        ...data,
      };

      users.push(user);
      pubsub.publish('userCreated', { userCreated: user })

      return user;
    },
    updateUser: (_, { id, data }, { pubsub}) => {
      const user_index = users.findIndex((user) => user.id === id);

      if (user_index === -1) {
        throw new Error("User not found");
      }

      const updated_user = (users[user_index] = {
        ...users[user_index],
        ...data,
      });
      pubsub.publish('userUpdated', { userUpdated: updated_user });

      return updated_user;
    },
    deleteUser: (_, { id }, { pubsub}) => {
      const user_index = users.findIndex((user) => user.id === id);

      if (user_index === -1) {
        throw new Error("User not found");
      }

      const deleted_user = users[user_index];
      users.splice(user_index, 1);

      pubsub.publish('userDeleted', { userDeleted: deleted_user });

      return deleted_user;
    },
    deleteAllUsers: () => {
      const length = users.length;
      users.splice(0, length);

      return {
        count: length,
      };
    },

    // Post
    createPost: (_, { data }, { pubsub }) => {
      const post = {
        id: nanoid(),
        ...data,
      };

      posts.push(post);
      pubsub.publish('postCreated', { postCreated: post});
      pubsub.publish('postCount', { postCount: posts.length });

      return post;
    },
    updatePost: (_, { id, data }, { pubsub }) => {
      const post_index = posts.findIndex((post) => post.id === id);

      if (post_index === -1) {
        throw new Error("Post not found");
      }

      const updated_post = (posts[post_index] = {
        ...posts[post_index],
        ...data,
      });
      pubsub.publish('postUpdated', { postUpdated: updated_post });

      return updated_post;
    },
    deletePost: (_, { id }, {pubsub}) => {
      const post_index = posts.findIndex((post) => post.id === id);

      if (post_index === -1) {
        throw new Error("Post not found");
      }

      const deleted_post = posts[post_index];
      posts.splice(post_index, 1);
      pubsub.publish('postDeleted', { postDeleted: deleted_post });
      pubsub.publish('postCount', { postCount: posts.length });

      return deleted_post;
    },
    deleteAllPosts: () => {
      const length = posts.length;
      posts.splice(0, length);

      pubsub.publish('postCount', { postCount: posts.length });

      return {
        count: length,
      };
    },

    // Comment
    createComment: (_, { data }, { pubsub}) => {
      const comment = {
        id: nanoid(),
        ...data,
      };

      comments.push(comment);
      pubsub.publish('commentCreated', { commentCreated: comment });

      return comment;
    },
    updateComment: (_, { id, data }, { pubsub }) => {
      const comment_index = comments.findIndex((comment) => comment.id === id);

      if (comment_index === -1) {
        throw new Error("Comment not found");
      }

      const updated_comment = (comments[comment_index] = {
        ...comments[comment_index],
        ...data,
      });
      pubsub.publish('commentUpdated', { commentUpdated: updated_comment });

      return updated_comment;
    },
    deleteComment: (_, { id }, { pubsub}) => {
      const comment_index = comments.findIndex((comment) => comment.id === id);

      if (comment_index === -1) {
        throw new Error("Comment not found");
      }

      const deleted_comment = comments[comment_index];
      comments.splice(comment_index, 1);
      pubsub.publish('commentDeleted', { commentDeleted: deleted_comment });

      return deleted_comment;
    },
    deleteAllComments: () => {
      const length = comments.length;
      comments.splice(0, length);

      return {
        count: length,
      };
    },
  },
  Query: {
    // user
    users: () => users,
    user: (parent, args) => users.find((user) => user.id === args.id),

    // post
    posts: () => posts,
    post: (parent, args) => posts.find((post) => post.id === args.id),

    // comment
    comments: () => comments,
    comment: (parent, args) =>
      comments.find((comment) => comment.id === args.id),
  },
  User: {
    posts: (parent, args) => posts.filter((post) => post.user_id === parent.id),
    comments: (parent) =>
      comments.filter((comment) => comment.user_id === parent.id),
  },
  Post: {
    user: (parent) => users.find((user) => user.id === parent.user_id),
    comments: (parent) =>
      comments.filter((comment) => comment.post_id === parent.id),
  },
  Comment: {
    user: (parent) => users.find((user) => user.id === parent.user_id),
    post: (parent) => posts.find((post) => post.id === parent.post_id),
  },
};


const server = new GraphQLServer({
  typeDefs,
  resolvers,
  context: {
    pubsub,
  },
});

server.start(() => console.log("Server is running on localhost:4000"));
