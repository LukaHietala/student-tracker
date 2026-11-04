import * as v from "valibot";

export const deviceSchema = v.pipe(
	v.object({
		name: v.pipe(
			v.string(),
			v.minLength(3, "Nimessä on oltava vähintään 3 merkkiä"),
			v.maxLength(50, "Nimessä saa olla enintään 50 merkkiä"),
		),
	})
)