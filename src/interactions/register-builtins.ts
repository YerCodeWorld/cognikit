import { registerInteraction, type InteractionConstructor } from "./registry";

import { OpenClassification } from "./open-classification";
import { SequentialClassification } from "./sequential-classification";
import { MCQ } from "./mcq-mrq";
import { SimultaneousAssociation } from "./simultaneous-association";
import { ListRecall } from "./list-recall";
import { LookupTable } from "./lookup-table";
import { ClassificationMatrix } from "./classification-matrix";
import { NaryChoiceTable } from "./nary-choice-table";
import { AdjacencyTable } from "./adjacency-table";
import { MarkTheWords, SequentialMarkTheWords } from "./mark-the-words";
import { CategorizeTheWords, SequentialCategorizeTheWords } from "./categorize-the-words";
import { TextTransformation, SequentialTextTransformation } from "./text-transformation";
import { FillBlanks, SequentialFillBlanks } from "./fill-blanks";
import { RankOrder } from "./rank-order";

let builtinsRegistered = false;

export const registerBuiltInInteractions = (): void => {
	if (builtinsRegistered) return;
	builtinsRegistered = true;

	registerInteraction({
		id: "open-classification",
		label: "Open Classification",
		elementTag: "open-classification",
		cognitiveOp: "classification",
		mechanic: "static",
		engine: "direct",
		ctor: OpenClassification as unknown as InteractionConstructor,
		capabilities: {
			isSequential: false,
			implementsProgress: true,
			usesAssets: true,
			hasParser: true,
			hasValidator: true,
			hasGrader: true
		}
	});

	registerInteraction({
		id: "sequential-classification",
		label: "Sequential Classification",
		elementTag: "sequential-classification",
		cognitiveOp: "classification",
		mechanic: "automatic-sequencing",
		engine: "direct",
		ctor: SequentialClassification as unknown as InteractionConstructor,
		capabilities: {
			isSequential: true,
			implementsProgress: true,
			usesAssets: true,
			hasParser: true,
			hasValidator: true,
			hasGrader: true
		}
	});

	registerInteraction({
		id: "mcq",
		label: "Multiple Choice / Multiple Response",
		elementTag: "mcq-interaction",
		cognitiveOp: "recognition",
		mechanic: "sequential",
		engine: "direct",
		ctor: MCQ as unknown as InteractionConstructor,
		capabilities: {
			isSequential: true,
			implementsProgress: true,
			usesAssets: true,
			hasParser: true,
			hasValidator: true,
			hasGrader: true
		}
	});

	registerInteraction({
		id: "simultaneous-association",
		label: "Simultaneous Association",
		elementTag: "simultaneous-association",
		cognitiveOp: "association",
		mechanic: "static",
		engine: "direct",
		ctor: SimultaneousAssociation as unknown as InteractionConstructor,
		capabilities: {
			isSequential: false,
			implementsProgress: true,
			usesAssets: true,
			hasParser: true,
			hasValidator: true,
			hasGrader: true
		}
	});

	registerInteraction({
		id: "list-recall",
		label: "List Recall",
		elementTag: "list-recall",
		cognitiveOp: "freerecall",
		mechanic: "static",
		engine: "direct",
		ctor: ListRecall as unknown as InteractionConstructor,
		capabilities: {
			isSequential: false,
			implementsProgress: true,
			usesAssets: false,
			hasParser: true,
			hasValidator: true,
			hasGrader: true
		}
	});

	registerInteraction({
		id: "lookup-table",
		label: "Lookup Table",
		elementTag: "lookup-table",
		cognitiveOp: "production",
		mechanic: "static",
		engine: "tables",
		ctor: LookupTable as unknown as InteractionConstructor,
		capabilities: {
			isSequential: false,
			implementsProgress: true,
			usesAssets: false,
			hasParser: true,
			hasValidator: true,
			hasGrader: true
		}
	});

	registerInteraction({
		id: "classification-matrix",
		label: "Classification Matrix",
		elementTag: "classification-matrix",
		cognitiveOp: "classification",
		mechanic: "static",
		engine: "tables",
		ctor: ClassificationMatrix as unknown as InteractionConstructor,
		capabilities: {
			isSequential: false,
			implementsProgress: true,
			usesAssets: false,
			hasParser: true,
			hasValidator: true,
			hasGrader: true
		}
	});

	registerInteraction({
		id: "nary-choice-table",
		label: "N-ary Choice Table",
		elementTag: "nary-choice-table",
		cognitiveOp: "discrimination",
		mechanic: "static",
		engine: "tables",
		ctor: NaryChoiceTable as unknown as InteractionConstructor,
		capabilities: {
			isSequential: false,
			implementsProgress: true,
			usesAssets: false,
			hasParser: true,
			hasValidator: true,
			hasGrader: true
		}
	});

	registerInteraction({
		id: "adjacency-table",
		label: "Adjacency Table",
		elementTag: "adjacency-table",
		cognitiveOp: "association",
		mechanic: "static",
		engine: "tables",
		ctor: AdjacencyTable as unknown as InteractionConstructor,
		capabilities: {
			isSequential: false,
			implementsProgress: true,
			usesAssets: false,
			hasParser: true,
			hasValidator: true,
			hasGrader: true
		}
	});

	registerInteraction({
		id: "mark-the-words",
		label: "Mark The Words",
		elementTag: "mark-the-words",
		cognitiveOp: "recognition",
		mechanic: "static",
		engine: "text",
		ctor: MarkTheWords as unknown as InteractionConstructor,
		capabilities: {
			isSequential: false,
			implementsProgress: true,
			usesAssets: false,
			hasParser: false,
			hasValidator: true,
			hasGrader: true
		}
	});

	registerInteraction({
		id: "sequential-mark-the-words",
		label: "Sequential Mark The Words",
		elementTag: "sequential-mark-the-words",
		cognitiveOp: "recognition",
		mechanic: "sequential",
		engine: "text",
		ctor: SequentialMarkTheWords as unknown as InteractionConstructor,
		capabilities: {
			isSequential: true,
			implementsProgress: true,
			usesAssets: false,
			hasParser: false,
			hasValidator: true,
			hasGrader: true
		}
	});

	registerInteraction({
		id: "categorize-the-words",
		label: "Categorize The Words",
		elementTag: "categorize-the-words",
		cognitiveOp: "classification",
		mechanic: "static",
		engine: "text",
		ctor: CategorizeTheWords as unknown as InteractionConstructor,
		capabilities: {
			isSequential: false,
			implementsProgress: true,
			usesAssets: false,
			hasParser: false,
			hasValidator: true,
			hasGrader: true
		}
	});

	registerInteraction({
		id: "sequential-categorize-the-words",
		label: "Sequential Categorize The Words",
		elementTag: "sequential-categorize-the-words",
		cognitiveOp: "classification",
		mechanic: "sequential",
		engine: "text",
		ctor: SequentialCategorizeTheWords as unknown as InteractionConstructor,
		capabilities: {
			isSequential: true,
			implementsProgress: true,
			usesAssets: false,
			hasParser: false,
			hasValidator: true,
			hasGrader: true
		}
	});

	registerInteraction({
		id: "text-transformation",
		label: "Text Transformation",
		elementTag: "text-transformation",
		cognitiveOp: "transformation",
		mechanic: "static",
		engine: "text",
		ctor: TextTransformation as unknown as InteractionConstructor,
		capabilities: {
			isSequential: false,
			implementsProgress: true,
			usesAssets: false,
			hasParser: false,
			hasValidator: true,
			hasGrader: true
		}
	});

	registerInteraction({
		id: "sequential-text-transformation",
		label: "Sequential Text Transformation",
		elementTag: "sequential-text-transformation",
		cognitiveOp: "transformation",
		mechanic: "sequential",
		engine: "text",
		ctor: SequentialTextTransformation as unknown as InteractionConstructor,
		capabilities: {
			isSequential: true,
			implementsProgress: true,
			usesAssets: false,
			hasParser: false,
			hasValidator: true,
			hasGrader: true
		}
	});

	registerInteraction({
		id: "fill-blanks",
		label: "Fill Blanks",
		elementTag: "fill-blanks",
		cognitiveOp: "cuedrecall",
		mechanic: "static",
		engine: "text",
		ctor: FillBlanks as unknown as InteractionConstructor,
		capabilities: {
			isSequential: false,
			implementsProgress: true,
			usesAssets: false,
			hasParser: false,
			hasValidator: true,
			hasGrader: true
		}
	});

	registerInteraction({
		id: "sequential-fill-blanks",
		label: "Sequential Fill Blanks",
		elementTag: "sequential-fill-blanks",
		cognitiveOp: "cuedrecall",
		mechanic: "sequential",
		engine: "text",
		ctor: SequentialFillBlanks as unknown as InteractionConstructor,
		capabilities: {
			isSequential: true,
			implementsProgress: true,
			usesAssets: false,
			hasParser: false,
			hasValidator: true,
			hasGrader: true
		}
	});

	registerInteraction({
		id: "rank-order",
		label: "Rank Order",
		elementTag: "rank-order",
		cognitiveOp: "seriation",
		mechanic: "static",
		engine: "direct",
		ctor: RankOrder as unknown as InteractionConstructor,
		capabilities: {
			isSequential: false,
			implementsProgress: false,
			usesAssets: true,
			hasParser: true,
			hasValidator: true,
			hasGrader: true
		}
	});
};

registerBuiltInInteractions();
