import { ValidationResult } from "../../../shared";
import { ClassificationData } from "../../../types/Data";

export function classificationValidator(data: ClassificationData): ValidationResult {
	return { ok: false, errors: { 'none': '' } }
}

