import { EduApplicationWindow } from "../shell";
import { IInteractionInstance, InteractionConfig, InteractionOptions, ItemData } from "../shared";

export abstract class BaseInteraction<T extends ItemData> 
	implements IInteractionInstance {
	
	public readonly id: string;

	protected readonly mount: HTMLElement;
	protected readonly data: T;
	protected readonly config: InteractionConfig;
	protected shell: HTMLElement;

	constructor(options: InteractionOptions<T>) {

		this.id = crypto.randomUUID();
		this.mount = options.mount;
		this.data = options.data;
		this.config = options.config;

		this.shell = document.createElement("edu-window") as EduApplicationWindow;

		this.shell.setAttribute("variant", this.config.variant ?? 'outline');
		this.shell.setAttribute("heading", this.config.prompt ?? 'No prompt');
		this.shell.setAttribute("show-footer", this.config.checkButtonEnabled ? 'true' : 'false');
		this.shell.setAttribute("show-header", this.config.headerEnabled ? 'true': 'false');

	}

	abstract render(): void;
	abstract getCurrentState(): any;
	abstract isInteractionComplete(): boolean;

	protected submitForScoring(): void {}

	public destroy(): void {
		this.mount.innerHTML = '';
	}
	
}
