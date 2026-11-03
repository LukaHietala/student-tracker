import { setInput, getInput } from "@formisch/solid";
import { createSignal, createEffect } from "solid-js";

function Calendar(props) {
	const [year, setYear] = createSignal(new Date().getFullYear());
	const [month, setMonth] = createSignal(new Date().getMonth() + 1);

	const days = ["Ma", "Ti", "Ke", "To", "Pe", "La", "Su"];
	const [rows, setRows] = createSignal([]);
	const [startDay, setStartDay] = createSignal(0);

	const daysInMonth = (year, month) => new Date(year, month, 0).getDate();
	const pad = (d) => (d.toString().length == 1 ? `0${d}` : d);

	function updateStats() {
		const sd = new Date(year(), month() - 1, 0).getDay();
		const x = Math.ceil((daysInMonth(year(), month()) + sd) / 7);
		setRows([...new Array(x).keys()]);
		setStartDay(sd);
	}

	createEffect(() => {
		updateStats();
	});

	return (
		<div class="calendar">
			<div class="calendar-title">
				{year()} - {month()}
				<div>
					<button
						onClick={() => {
							setMonth(month() - 1);
							if (month() <= 0) {
								setYear(year() - 1);
								setMonth(12);
							}
							updateStats();
						}}
						type="button"
					>
						←
					</button>
					<button
						onClick={() => {
							setMonth(month() + 1);
							if (month() >= 13) {
								setYear(year() + 1);
								setMonth(1);
							}
							updateStats();
						}}
						type="button"
					>
						→
					</button>
				</div>
			</div>
			<table class="calendar-table">
				<tr>
					<For each={days}>{(day, _) => <th>{day()}</th>}</For>
				</tr>
				<For each={rows()}>
					{(_, i) => (
						<tr>
							<For each={[...days.keys()]}>
								{(_, j) => (
									<td class="calendar-box">
										<Show
											when={
												(i() > 0 || j() > startDay() - 1) &&
												i() * 7 + j() + 1 - startDay() <=
													daysInMonth(year(), month())
											}
										>
											<button
												type="button"
												classList={{
													"calendar-box-button": true,
													"calendar-active":
														getInput(props.studentForm, {
															path: ["schedule", j()],
														}) != null &&
														(getInput(props.studentForm, {
															path: ["excludedDays"],
														}) == undefined ||
															!getInput(props.studentForm, {
																path: ["excludedDays"],
															}).includes(
																`${year()}-${month()}-${pad(i() * 7 + j() + 1 - startDay())}`,
															))
															? false
															: true,
												}}

												onClick={() => {
													const xs = getInput(props.studentForm, {
														path: ["excludedDays"],
													});
													const x = `${year()}-${month()}-${pad(i() * 7 + j() + 1 - startDay())}`;
													if (xs.includes(x)) {
														const index = xs.indexOf(x);
														xs.splice(index, 1);
													} else {
														xs.push(x);
													}
													setInput(props.studentForm, {
														path: ["excludedDays"],
														input: xs,
													});
												}}
											>
												{i() * 7 + j() + 1 - startDay()}
											</button>
										</Show>
									</td>
								)}
							</For>
						</tr>
					)}
				</For>
			</table>
		</div>
	);
}

export default Calendar;