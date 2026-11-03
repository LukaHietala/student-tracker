import * as v from "valibot";
import { teacherService } from "../../services";

export const teacherSchema = v.pipe(
	v.objectAsync({
		name: v.pipeAsync(
			v.string(),
			v.minLength(3, "Nimessä on oltava vähintään 3 merkkiä"),
			v.maxLength(50, "Nimessä saa olla enintään 50 merkkiä"),
			v.checkAsync(async (input) => {
				const res = await teacherService.isNameAvailable(input)
                return res.ok
			}, "Nimi on jo varattu"),
		),
		password: v.pipe(
			v.string(),
			v.minLength(3, "Salasanassa on oltava vähintään 3 merkkiä"),
			v.maxLength(50, "Salasanassa saa olla enintään 50 merkkiä"),
		),
	}),
);