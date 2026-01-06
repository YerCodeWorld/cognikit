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
	span?: { from: string; to: string }; 
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

export class AssetValidationError extends Error {
	issues: string[];
	constructor(issues: string[]) {
		super(`Asset  validation failed:n- ${issues.join("\n- ")}`);
		this.name = "AssetValidationError";
		this.issues = issues;
	};
}

export  function validateAndNormalizeAssets(input: unknown): NormalizedAssets {
	const issues: string[] = [];

	if (!isPlainObject(input)) {
		throw new AssetValidationError([
			`Top-level assets must be an object/map like { mango: {...}, trend: {...} }`,
		]);
	}

	const raw = input as AssetRegistryInput;
	const assetsById: Record<string, Asset> = {};

	for (const [id, value] of Object.entries(raw)) {

		if (!id || typeof id !== "string") {
			issues.push(`Asset key must be a non-empty string (got: ${String(id)})`);
			continue;
		}

		if (!/^[a-zA-Z0-9._-]+$/.test(id)) {
			issues.push(
				`Asset id "${id}" has invalid chars; use letters/numbers/._-`
			);
		}

		if (!isPlainObject(value)) {
			issues.push(`Asset "${id}" must be an object (got: ${typeOf(value)})`);
			continue;
		}

		const obj = value as Record<string, unknown>;
		const type = obj.type;
		const dialog = Boolean(obj.dialog);

		if (!isString(type)) {
			issues.push(`Asset "${id}" missing string field "type"`);
			continue;
		}

		if (!isAssetType(type)) {
			issues.push(
				`Asset "${id}" has unsupported type "${type}" (use image|video|audio|html)`
			);
			continue;
		}

		switch (type) {

			case "image": {
				const url = obj.url;
				if (!isString(url)) issues.push(`Asset "${id}" (image) missing "url"`);

				const size = obj.size;
				if (size !== undefined && !isString(size)) {
					issues.push(`Asset "${id}" (image) field "size" must be a string`);
				}

				if (isString(url)) {
					assetsById[id] = {
						id,
						type,
						dialog,
						url,
						...(isString(size) ? { size } : {}),
					};
				}
					
				break;
			}

			case "video": {
				const url = obj.url;
				if (!isString(url)) issues.push(`Asset "${id}" (video) missing "url"`);

				const span = obj.span;
				let normalizedSpan: VideoAsset["span"] | undefined;

				if (span !== undefined) {
					if (!isPlainObject(span)) {
						issues.push(`Asset "${id}" (video) field "span" must be an object`);
					} else {
						const from = (span as any).from;
						const to = (span as any).to;
						if (!isString(from) || !isString(to)) {
							issues.push(
							`Asset "${id}" (video) span requires string "from" and "to"`
							);
						} else {
							// Light format check: mm:ss or hh:mm:ss
							if (!looksLikeTime(from) || !looksLikeTime(to)) {
								issues.push(
									`Asset "${id}" (video) span times should look like "02:15" or "01:02:45"`
								);
							}
							normalizedSpan = { from, to };
						}
					}
				}

				if (isString(url)) {
					assetsById[id] = {
						id,
						type,
						dialog,
						url,
						...(normalizedSpan ? { span: normalizedSpan } : {}),
					};
				}

				break;
			}

			case "audio": {
				const url = obj.url;
				if (!isString(url)) issues.push(`Asset "${id}" (audio) missing "url"`);

				const volume = obj.volume;
				if (volume !== undefined) {
					if (!isNumber(volume) || !Number.isFinite(volume)) {
						issues.push(
							`Asset "${id}" (audio) field "volume" must be a number`
						);
					} else if (volume < 0 || volume > 100) {
						issues.push(
							`Asset "${id}" (audio) field "volume" must be between 0 and 100`
						);
					}
				}

				if (isString(url)) {
					assetsById[id] = {
						id,
						type,
						dialog,
						url,
						...(isNumber(volume) ? { volume } : {}),
					};
				}

				break;
			}

			case "html": {
				const content = obj.content;
				if (!isString(content)) {
					issues.push(`Asset "${id}" (html) missing string field "content"`);
					break;
				}
				assetsById[id] = { id, type, dialog, content };
					break;
			}

			case "tts": {
				const content = obj.content;
				if (!isString(content)) {
					issues.push(`Asset "${id}" (tts) missing string field "content"`);
					break;
				}

				assetsById[id] = { id, type, dialog, content };
					break;
			}
		}
	}
	
	if (issues.length) throw new AssetValidationError(issues);

	const assetsList = Object.keys(assetsById)
		.sort((a, b) => a.localeCompare(b))
		.map((id) => assetsById[id]);

	return { assetsById, assetsList };
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
	return (
		typeof v === "object" &&
		v !== null &&
		(Object.getPrototypeOf(v) === Object.prototype ||
		Object.getPrototypeOf(v) === null)
	);
}

function isString(v: unknown): v is string {
	return typeof v === "string";
}

function isNumber(v: unknown): v is number {
	return typeof v === "number";
}

function isAssetType(v: string): v is AssetType {
	return v === "image" || v === "video" || v === "audio" || v === "html";
}

function looksLikeTime(s: string): boolean {
	// Accept mm:ss or hh:mm:ss (not strict bounds validation)
	return /^(\d{1,2}:)?\d{1,2}:\d{2}$/.test(s);
}

function typeOf(v: unknown): string {
	if (v === null) return "null";
	if (Array.isArray(v)) return "array";
	return typeof v;
}
