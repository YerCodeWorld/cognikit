import { Module } from "../../shared";
import { classificationParser, classificationValidator } from "./implementation.ts";

export const ClassificationModule: Module = {
	id: 'class-001';
	process: 'classification';

	implementation: {
		parser: classificationParser;
		validator: classificationValidator;
		interactions: {
			'matrixClassification': '',
			'closedCardSorting': ''
		}
	};

	help: './doc/classification.md';
}
