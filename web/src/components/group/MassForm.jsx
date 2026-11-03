import { createForm, Field, FieldArray, Form, reset, setInput, getInput } from "@formisch/solid";
import { createResource, createSignal, createEffect } from "solid-js";
import { useAuth } from "../../context/AuthContext.jsx";
import { timeSchema, breakSchema, scheduleSchema, calendarSchema } from "./schema.js"
import Calendar from "../common/Calendar";

function MassForm(props)
{
    const cancel = () => props.cancel;

    const handleReplace = async (data) => {
        await props.onReplace(data);
    }
		
    const handleAdd = async (data) => {
        await props.onAdd(data);
    }

    const timeForm = createForm({
        schema: timeSchema,
        validate: 'blur'
    });

		const breakForm = createForm({
        schema: breakSchema,
        validate: 'blur'
		});
		
		const scheduleForm = createForm({
        schema: scheduleSchema,
        validate: 'blur'
		});
		
		const calendarForm = createForm({
        schema: calendarSchema,
        validate: 'blur'
    });
		
    createEffect(() => {
        reset(timeForm, {
            initialInput: {
								startDate: "2026-09-21",
								endDate: "2026-09-25"
						}
				});
        reset(breakForm, {
            initialInput: 			{
								"breakTime": 120
						}
				});
				reset(scheduleForm, {
            initialInput: {
								"schedule": [
										{"start": "08:00:00", "end": "16:00:00"}, 
										{"start": "08:00:00", "end": "16:00:00"}, 
										{"start": "08:00:00", "end": "16:00:00"}, 
										{"start": "08:00:00", "end": "16:00:00"}, 
										{"start": "08:00:00", "end": "16:00:00"}, 
										null,
										null
								]
						}
				});
				reset(calendarForm, {
            initialInput: {
								"schedule": [
										{"start": "08:00:00", "end": "16:00:00"}, 
										{"start": "08:00:00", "end": "16:00:00"}, 
										{"start": "08:00:00", "end": "16:00:00"}, 
										{"start": "08:00:00", "end": "16:00:00"}, 
										{"start": "08:00:00", "end": "16:00:00"}, 
										null,
										null
								],
								"excludedDays": []
						}
				});
    });

    return (
				<div>
						<div class="form-block">
								<span>Massamuokkaus</span> 
						</div>
						<Form
								of={timeForm}
								onSubmit={handleReplace}
								class="form"
						>
								<div class="form-block">
										<span>Basics</span><br />
										<small>Student&apos;s basic info</small>
								</div>
								<div class="form-block">
										<Field
												of={timeForm}
												path={["startDate"]}
										>
												{(field) => (
														<div>
																<label for={field.props.name}>Start date:</label><br />
																<input
																		{...field.props}
																		id={field.props.name}
																		value={field.input}
																		type="date"
																		required
																/>
																{field.errors && <small class="form-error">{field.errors[0]}</small>}
														</div>
												)}
										</Field>
										<Field
												of={timeForm}
												path={["endDate"]}
										>
												{(field) => (
														<div>
																<label for={field.props.name}>End date:</label><br />
																<input
																		{...field.props}
																		id={field.props.name}
																		value={field.input}
																		type="date"
																		required
																/>
																{field.errors && <small class="form-error">{field.errors[0]}</small>}
														</div>
												)}
										</Field>
								</div>
								<div class="form-block">
										<div style="display: inline-flex; gap: 4px;">
												<button class="btn-primary" type="submit">Tallenna</button>
										</div>
								</div>
						</Form>

						<Form
								of={breakForm}
								onSubmit={handleReplace}
								class="form"
						>
								<div class="form-block">
										<span>Basics</span><br />
										<small>Student&apos;s basic info</small>
								</div>
								<div class="form-block">
										<Field
												of={breakForm}
												path={["breakTime"]}
										>
												{(field) => (
														<div>
																<label for={field.props.name}>Break time (in minutes):</label><br />
																<input
																		{...field.props}
																		id={field.props.name}
																		value={field.input}
																		type="number"
																		required
																/>
																{field.errors && <small class="form-error">{field.errors[0]}</small>}
														</div>
												)}
										</Field>
								</div>
								<div class="form-block">
										<div style="display: inline-flex; gap: 4px;">
												<button class="btn-primary" type="submit">Tallenna</button>
										</div>
								</div>
						</Form>

						<Form
								of={scheduleForm}
								onSubmit={handleReplace}
								class="form"
						>
								<div class="form-block">
										<span>skedule</span><br />
										<small>Student&apos;s basic info</small>
								</div>
								<div class="form-block schedule">
										<FieldArray of={scheduleForm} path={['schedule']}>
												{(fieldArray) => (
														<>
																{fieldArray.items.map((item, index) => (
																		<Show when={item}>
																				<div key={index} class="schedule-item">
																						<Show when={getInput(scheduleForm, { path: ["schedule", index] }) != null}
																									fallback={
																											<div>
																													Free day
																											</div>
																									}>
																								<Field of={scheduleForm} path={['schedule', index, 'start']}>
																										{(field) => (
																												<>
																														<input {...field.props} value={field.input} type="time" />
																														{field.errors && <div>{field.errors[0]}</div>}
																												</>
																										)}
																								</Field>

																								<Field of={scheduleForm} path={['schedule', index, 'end']}>
																										{(field) => (
																												<>
																														<input {...field.props} value={field.input} type="time" />
																														{field.errors && <div>{field.errors[0]}</div>}
																												</>
																										)}
																								</Field>
																						</Show>
																						<input
																								type="checkbox"
																								checked={getInput(scheduleForm, { path: ["schedule", index] }) != null}
																								onClick={(e) => {
																										if (e.target.checked) {
																												setInput(scheduleForm, { path: ["schedule", index],
																																								 input: {
																																										 start: "08:00:00",
																																										 end: "16:00:00"
																																								 }});
																										} else {
																												setInput(scheduleForm, { path: ["schedule", index],
																																								 input: null});
																										}
																								}}
																						/>
																				</div>
																		</Show>
																))}
																{fieldArray.errors && <div>{fieldArray.errors[0]}</div>}
														</>
												)}
										</FieldArray>
								</div>
								<div class="form-block">
										<div style="display: inline-flex; gap: 4px;">
												<button class="btn-primary" type="submit">Tallenna</button>
										</div>
								</div>
						</Form>

						<Form
								of={calendarForm}
								onSubmit={handleAdd}
								class="form"
						>
								<div class="form-block">
										<span>Basics</span><br/>
										<small>Additive</small>
								</div>
								<div class="form-block">
										<Show when={getInput(calendarForm)}>
												<Calendar studentForm={calendarForm}/>
										</Show>
								</div>
								<div class="form-block">
										<div style="display: inline-flex; gap: 4px;">
												<button class="btn-secondary" type="button" onClick={() => cancel()}>Peruuta</button>
												<button class="btn-primary" type="submit">Tallenna</button>
										</div>
								</div>
						</Form>
				</div>
    )
}

export default MassForm;