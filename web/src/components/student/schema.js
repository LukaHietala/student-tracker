import * as v from "valibot";

const timeslot = v.pipe(
	v.object({
		start: v.pipe(v.string(), v.isoTimeSecond()),
		end: v.pipe(v.string(), v.isoTimeSecond()),
	}),
	v.forward(
		v.partialCheck(
			[["start"], ["end"]],
			(input) => {
				return input.end > input.start;
			},
			"Aloitus ajan tulee olla ennen lopetus aikaa",
		),
		["end"],
	),
);

export const studentSchema = v.pipe(
	v.object({
		name: v.pipe(
			v.string(),
			v.minLength(3, "Nimessä tulee olla vähintään 3 merkkiä"),
			v.maxLength(50, "Nimissä voi olla enintään 50 merkkiä"),
		),
		uid: v.pipe(v.string()),
		status: v.picklist(["IN", "OUT"]),
		schedule: v.array(v.nullable(timeslot)),
		startDate: v.pipe(v.string(), v.isoDate()),
		endDate: v.pipe(v.string(), v.isoDate()),
		excludedDays: v.array(v.pipe(v.string(), v.isoDate())),
		breakTime: v.pipe(v.any(), v.toNumber()),
	}),
	v.forward(
		v.partialCheck(
			[["startDate"], ["endDate"]],
			(input) => {
				return input.endDate > input.startDate;
			},
			"Aloituspäivän tulee olla ennen lopetuspäivää",
		),
		["endDate"],
	),
);