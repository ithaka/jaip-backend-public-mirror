export function ensure_error(value: unknown): Error {
  if (value instanceof Error) return value;
  console.log("Error Thrown: ", value);
  let stringified = "[Unable to stringify the thrown value]";
  try {
    stringified = JSON.stringify(value);
  } catch {
    console.log("Unable to stringify the thrown value");
  }

  const error = new Error(
    `This value was thrown as is, not through an Error: ${stringified}`,
  );
  return error;
}
