import { ClassificationData, ValidationResult } from "../../../shared";

export function classificationValidator(data: ClassificationData): ValidationResult {
	return { ok: false, errors: { 'none': '' } }
}

