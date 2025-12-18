export type Variant = 'elegant' | 'playful' | 'outline' | 'letter' | 'sign' | 'minimal' | 'glass' | 'empty'; 

export interface RendererNotification {
	title: string;
	description: string;
	data: any;
	trigger(): void;
}
