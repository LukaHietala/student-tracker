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

export const timeSchema = v.pipe(
		v.object({
				startDate: v.pipe(v.string(), v.isoDate()),
				endDate: v.pipe(v.string(), v.isoDate()),
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
		)
);

export const breakSchema = v.pipe(
		v.object({
				breakTime: v.pipe(v.any(), v.toNumber())
		})
);

export const scheduleSchema = v.pipe(
		v.object({
				schedule: v.array(v.nullable(timeslot))
		})
);

export const calendarSchema = v.pipe(
		v.object({
				schedule: v.array(v.nullable(timeslot)),
				excludedDays: v.array(v.pipe(v.string(), v.isoDate()))
		})
);
