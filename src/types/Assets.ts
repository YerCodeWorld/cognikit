export type AssetType = "image" | "video" | "audio" | "html" | "tts";
export type AssetRegistryInput = Record<string, unknown>;

export interface BaseAsset {
	id: string;
	type: AssetType;
	dialog?: boolean; // If true, render in dialog only; if false/undefined, render inline with expand button
}

export interface ImageAsset extends BaseAsset {
	type: "image";
	url: string;
	size?: "small" | "medium" | "large" | string;
}

export interface AudioAsset extends BaseAsset {
	type: "audio";
	url: string;
	volume?: number;
}

export interface VideoAsset extends BaseAsset {
	type: "video";
	url: string;
	span?: { from: string; to: string }; // convert to 'list'?
	source?: 'general' | 'youtube';
}

export interface HtmlAsset extends BaseAsset {
	type: "html";
	content: string;
}

export interface TtsAsset extends BaseAsset {
	type: "tts";
	content: string;
	volume?: number;
}

export type Asset = ImageAsset | AudioAsset | VideoAsset | HtmlAsset | TtsAsset;

export interface NormalizedAssets {
	assetsById: Record<string, Asset>;
	assetsList: Asset[];
}


