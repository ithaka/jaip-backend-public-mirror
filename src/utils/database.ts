export const get_db_pagination = (page: number, limit: number) => ({
  skip: (page - 1) * limit,
  take: limit,
});
