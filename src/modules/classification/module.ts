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
			'matrixClassification': '',
			'closedCardSorting': ''
		}
	},

	help: './doc/classification.md',
}

// Export the interaction for direct use
export { SimpleClassification, OpenClassification };
