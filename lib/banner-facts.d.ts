export interface ChangelogEntry {
    readonly version: string;
    readonly bullets: readonly string[];
}
export interface BannerFacts {
    readonly version?: string;
    readonly latest?: ChangelogEntry;
}
export declare function parseLatestChangelogEntry(markdown: string): ChangelogEntry | undefined;
export declare function readBannerFacts(packageRoot?: string): Promise<BannerFacts>;
//# sourceMappingURL=banner-facts.d.ts.map