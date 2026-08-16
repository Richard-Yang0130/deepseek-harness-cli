import { isEnvTruthy } from './envUtils.js'

/**
 * Whether mouse click handling is disabled for the ported Ink core. dsh-cli
 * reads its own env flag (`DSH_CLI_DISABLE_MOUSE`); the original module
 * consulted Claude Code's fullscreen state.
 * @returns True when DSH_CLI_DISABLE_MOUSE is set to a truthy value.
 */
export function isMouseClicksDisabled(): boolean {
  return isEnvTruthy(process.env.DSH_CLI_DISABLE_MOUSE)
}
