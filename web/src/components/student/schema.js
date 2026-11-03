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
			"End time must be after start time",
		),
		["end"],
	),
);

export const studentSchema = v.pipe(
	v.object({
		name: v.pipe(
			v.string(),
			v.minLength(3, "Name must have at least 3 characters"),
			v.maxLength(50, "Name can have at most 50 characters"),
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
			"End date must be after start date",
		),
		["endDate"],
	),
);