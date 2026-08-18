const OPT_OUT = /^(stop|unsubscribe|cancel|opt[-\s]?out|stopall)$/i;

export function isOptOutMessage(body: string) {
  return OPT_OUT.test(body.trim());
}
