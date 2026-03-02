import { BaseInteraction } from "../core/BaseInteraction";
import { CognitiveOp } from "../shared/types";
import { InteractionData } from "../types/Data";
import { InteractionMechanic } from "../types/Interactions";

export type InteractionConstructor = new (...args: any[]) => BaseInteraction<InteractionData>;

export type InteractionCapabilities = {
	isSequential: boolean;
	implementsProgress: boolean;
	usesAssets: boolean;
	hasParser: boolean;
	hasValidator: boolean;
	hasGrader: boolean;
};

export type InteractionRegistryItem = {
	id: string;
	label: string;
	elementTag: string;
	cognitiveOp?: CognitiveOp;
	mechanic: InteractionMechanic;
	engine: "tables" | "text" | "direct" | "mixed";
	ctor: InteractionConstructor;
	capabilities: InteractionCapabilities;
};

const interactionsRegistry = new Map<string, InteractionRegistryItem>();

export const registerInteraction = (item: InteractionRegistryItem): void => {
	const current = interactionsRegistry.get(item.id);
	if (current) {
		if (current.ctor === item.ctor) return;
		throw new Error(`Duplicate interaction id: "${item.id}"`);
	}

	interactionsRegistry.set(item.id, item);
};

export const unregisterInteraction = (id: string): boolean => {
	return interactionsRegistry.delete(id);
};

export const clearInteractionRegistry = (): void => {
	interactionsRegistry.clear();
};

export const getInteractionRegistry = (): ReadonlyMap<string, InteractionRegistryItem> => {
	return interactionsRegistry;
};

export const listInteractions = (): InteractionRegistryItem[] => {
	return Array.from(interactionsRegistry.values());
};

export const getInteraction = (id: string): InteractionRegistryItem | null => {
	return interactionsRegistry.get(id) ?? null;
};

export const createInteraction = (id: string, ...args: any[]): BaseInteraction<InteractionData> => {
	const item = getInteraction(id);
	if (!item) {
		throw new Error(`Unknown interaction "${id}"`);
	}
	return new item.ctor(...args);
};
