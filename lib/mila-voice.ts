/** The existing Mila agent is the single source for her voice identity. */
export const DEFAULT_MILA_AGENT_ID = "agent_7601krc9gaf2eaxr811qgk01epzc";

export function getMilaAgentId() {
  return (process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID ?? DEFAULT_MILA_AGENT_ID).trim();
}
