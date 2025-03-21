// Checks an object for empty strings and returns an array of the keys of the empty strings
export const check_trimmed_strings = (obj: {
  [key: string]: string;
}): string[] => {
  const empty_fields = [];
  for (const key in obj) {
    if (!obj[key].trim()) {
      empty_fields.push(key);
    }
  }
  return empty_fields;
};
