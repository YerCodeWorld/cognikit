import { Module } from "../../shared";
import { classificationParser, classificationValidator } from "./implementation";
import { SimpleClassification, OpenClassification } from "./interactions";

export const classificationModule: Module = {

	id: 'class-001',
	process: 'classification',

	implementation: {
		parser: classificationParser,
		validator: classificationValidator,
		interactions: {
			'simpleClassification': SimpleClassification,
			'openClassification': OpenClassification,
			'classificationMatrix': '',
			'closedCardSorting': '',
			'OpenCardSorting': '',
		}
	},

	help: './doc/classification.md',
}

export { SimpleClassification, OpenClassification };
