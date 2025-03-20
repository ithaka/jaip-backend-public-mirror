import { FastifyReply, FastifyRequest } from "fastify";

export const validate = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const bodyValidationFunction = request.getValidationFunction("body");
  const is_valid = bodyValidationFunction(request.body);
  if (!is_valid) {
    request.server.event_logger.pep_bad_request_error(request, reply, {
      event_description: "invalid request: body did not pass validation",
    });
  }
  return;
};
