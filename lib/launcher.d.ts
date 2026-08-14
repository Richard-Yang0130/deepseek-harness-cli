export declare const PROFILE_NAME = "dsh-cli";
export declare const BUNDLE_NAME = "deepseek-harness-cli";
export declare const DSH_VERSION_RANGE = ">=0.1.0-rc.6 <0.2.0";
export interface CommandResult {
    readonly code: number;
    readonly stdout: string;
    readonly stderr: string;
}
export interface LauncherOptions {
    readonly dshHome?: string;
    readonly packageRoot?: string;
    readonly runDsh?: (args: readonly string[], inherited: boolean) => Promise<CommandResult>;
    readonly write?: (text: string) => void;
}
export declare function isCompatibleDshVersion(output: string): boolean;
export declare function profileNeedsBootstrap(dshHome: string): Promise<boolean>;
export declare function runLauncher(args: readonly string[], options?: LauncherOptions): Promise<number>;
//# sourceMappingURL=launcher.d.ts.map