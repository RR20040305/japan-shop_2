const { Author, Book } = require('../utils/db-sql');

const resolvers = {
  Query: {
    books: async () => await Book.findAll({ include: Author }),
    book: async (_, { id }) => await Book.findByPk(id, { include: Author }),
    authors: async () => await Author.findAll({ include: Book }),
  },
  Mutation: {
    createAuthor: async (_, { name }) => {
      return await Author.create({ name });
    },
    createBook: async (_, { title, authorId }) => {
      return await Book.create({ title, authorId });
    },
  },
  Author: {
    books: async (author) => author.getBooks(),
  },
  Book: {
    author: async (book) => book.getAuthor(),
  },
};

module.exports = resolvers;