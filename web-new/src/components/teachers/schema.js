import * as v from "valibot";

export const teacherSchema = v.pipe(
	v.object({
		name: v.pipe(
			v.string(),
			v.minLength(3, "Name must have at least 3 characters"),
			v.maxLength(50, "Name can have at most 50 characters"),
		),
		password: v.pipe(
			v.string(),
			v.minLength(3, "Name must have at least 3 characters"),
			v.maxLength(50, "Name can have at most 50 characters"),
		),
	})
);