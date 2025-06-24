export const get_db_pagination = (page: number, limit: number) => ({
  skip: (page - 1) * limit,
  take: limit,
});

export const paginated_array = <T>(
  arr: T[],
  limit: number,
  offset: number,
): T[] => {
  if (!arr) return [];

  if (!arr.length) {
    return [];
  }
  if (offset > arr.length - 1) {
    return [];
  }

  return arr.slice(
    Math.min(arr.length - 1, offset),
    Math.min(arr.length, offset + limit),
  );
};
