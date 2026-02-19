import { Logger } from "./console.mts";

Deno.test("Logger#", () => {
  const log = new Logger("test");
  const message = "Message here!";
  const extended = [
    "Extended here!",
    undefined,
    {
      class: Logger,
      log: "logloglogloglogloglogloglogloglogloglogloglogloglogloglogloghidden"
    },
    null
  ];

  log.debug(message);
  log.debug(extended, ...extended);
  log.info(message);
  log.info(extended, ...extended);
  log.warn(message);
  log.warn(extended, ...extended);
  log.error(message);
  log.error(extended, ...extended);
});
