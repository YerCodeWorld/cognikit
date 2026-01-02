import { Module, IInteraction } from "../../shared";
import { ClassificationData } from "../../types/Data";

import { 
	classificationParser, 
	classificationValidator, 
	classificationGrader 
} from "./utilities";

import { 
	OpenClassification, 
	ClassificationMatrix, 
	SequentialClassification 
} from "./interactions";

export const classificationModule: Module = {

	id: 'class-001',
	process: 'classification',

	implementation: {
		parser: classificationParser,
		validator: classificationValidator,
		interactions: {
			'openClassification': OpenClassification,
			'classificationMatrix': ClassificationMatrix,
			'sequentialClassification': SequentialClassification,
			'closedCardSorting': '',
			'OpenCardSorting': '',
		}
	},

	help: './doc/classification.md',
}

const openClassification: IInteraction = {
	id: 'OCLS-001',
	name: 'Open Classification',
	css: '',
	examples: {'001': 
`
America = DR | Venezuela | Ecuador;
Europe = Poland | France;
Asia = China | Pakistan | Thailand | India;
= Antartica | Madagascar;
`
	}	
}

export { OpenClassification, ClassificationMatrix, SequentialClassification };
