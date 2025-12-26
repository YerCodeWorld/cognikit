import { Module } from "../../shared";
import { classificationParser, classificationValidator } from "./implementation";
import { OpenClassification, ClassificationMatrix } from "./interactions";

export const classificationModule: Module = {

	id: 'class-001',
	process: 'classification',

	implementation: {
		parser: classificationParser,
		validator: classificationValidator,
		interactions: {
			'openClassification': OpenClassification,
			'classificationMatrix': ClassificationMatrix,
			'closedCardSorting': '',
			'OpenCardSorting': '',
		}
	},

	help: './doc/classification.md',
}

export { OpenClassification, ClassificationMatrix };
