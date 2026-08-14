import type { CommandDescriptor } from '@deepseek-ai/dsh-commands';
import type { LocalCommandDefinition, TuiCommand } from './controller-types.js';
export declare function commandCatalog(harness: readonly CommandDescriptor[], terminal: readonly LocalCommandDefinition[], skills?: readonly LocalCommandDefinition[]): TuiCommand[];
export declare function filterCommands(commands: readonly TuiCommand[], input: string): TuiCommand[];
//# sourceMappingURL=command-catalog.d.ts.map