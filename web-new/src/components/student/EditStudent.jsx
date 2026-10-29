import { createForm, Field, FieldArray, Form, reset, setInput, getInput } from "@formisch/solid";
import { createResource, createSignal, createEffect } from "solid-js";
import { studentService } from "../../services"; // Turha?
import { useAuth } from "../../context/AuthContext.jsx";
import { useParams } from "@solidjs/router";
import { useNavigate } from "@solidjs/router";
import { studentSchema } from "./schema.js"
import Calendar from "../common/Calendar";
import { useWebSocket } from "../../context/WebsocketContext.jsx";

function EditStudent(props)
{
    // Asiatonta
    const student = props.student;
    const cancel = () => props.cancel

    const handleSubmit = async (data) => {
        await props.onSubmit(data);
    }

    const studentEditForm = createForm({
        schema: studentSchema,
        validate: 'blur'
    });

    createEffect(() => {
        if (student) {
            reset(studentEditForm, {
                initialInput: student(),
            });
        }
    });

		const ws = useWebSocket();
		ws.addEventListener('message', event => {
				const uid = JSON.parse(event.data).payload.uid;
				if (uid)
						setInput(studentEditForm, { path: ["uid"], input: uid });
		});

    return (
        <Form
            of={studentEditForm}
            onSubmit={handleSubmit}
            class="form"
        >
            <div class="form-block">
								<span>Editing student: {getInput(studentEditForm, { path: ["name"]})}</span> 
            </div>
            <div class="form-block">
                <span>Basics</span><br />
                <small>Student&apos;s basic info</small>
            </div>
            <div class="form-block">
                <Field
                    of={studentEditForm}
                    path={["name"]}
                >
                    {(field) => (
                        <div>
                            <label for={field.props.name}>Name:</label><br />
                            <input
                                {...field.props}
                                id={field.props.name}
                                value={field.input}
                                type="text"
                                required
                            />
                            {field.errors && <small class="form-error">{field.errors[0]}</small>}
                        </div>
                    )}
                </Field>
                <Field
                    of={studentEditForm}
                    path={["uid"]}
                >
                    {(field) => (
                        <div>
                            <label for={field.props.name}>UID:</label><br />
                            <input
                                {...field.props}
                                id={field.props.name}
                                value={field.input}
                                type="text"
                                required
                                disabled
                            />
                            {field.errors && <small class="form-error">{field.errors[0]}</small>}
                        </div>
                    )}
                </Field>
                <Field
                    of={studentEditForm}
                    path={["status"]}
                >
                    {(field) => (
                        <div>
                            <label for={field.props.name}>Status:</label><br />
                            <select {...field.props}>
                                <For
                                    each={[
                                        { label: 'In', value: 'IN' },
                                        { label: 'Out', value: 'OUT' },
                                    ]}
                                >
                                    {({ label, value }) => (
                                        <option value={value} selected={field.input === value}>
                                            {label}
                                        </option>
                                    )}
                                </For>
                            </select>
                            {field.errors && <small class="form-error">{field.errors[0]}</small>}
                        </div>
                    )}
                </Field>
            </div>
            <div class="form-block">
                <span>Basics</span><br />
                <small>Student&apos;s basic info</small>
            </div>
            <div class="form-block">
                <Field
                    of={studentEditForm}
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
                    of={studentEditForm}
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
                <span>Basics</span><br />
                <small>Student&apos;s basic info</small>
            </div>
            <div class="form-block">
                <Field
                    of={studentEditForm}
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
                <span>Basics</span><br />
                <small>Student&apos;s basic info</small>
            </div>
            <div class="form-block schedule">
                <FieldArray of={studentEditForm} path={['schedule']}>
                    {(fieldArray) => (
                        <>
                            {fieldArray.items.map((item, index) => (
                                <Show when={item}>
                                    <div key={index} class="schedule-item">
                                        <Show when={getInput(studentEditForm, { path: ["schedule", index] }) != null}
                                              fallback={
                                                  <div>
                                                      Free day
                                                  </div>
                                              }>
                                            <Field of={studentEditForm} path={['schedule', index, 'start']}>
                                                {(field) => (
                                                    <>
                                                        <input {...field.props} value={field.input} type="time" />
                                                        {field.errors && <div>{field.errors[0]}</div>}
                                                    </>
                                                )}
                                            </Field>

                                            <Field of={studentEditForm} path={['schedule', index, 'end']}>
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
                                            checked={getInput(studentEditForm, { path: ["schedule", index] }) != null}
                                            onClick={(e) => {
                                                if (e.target.checked) {
                                                    setInput(studentEditForm, { path: ["schedule", index],
                                                                                input: {
                                                                                    start: "08:00:00",
                                                                                    end: "16:00:00"
                                                                                }});
                                                } else {
                                                    setInput(studentEditForm, { path: ["schedule", index],
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
                <span>Basics</span><br/>
                <small>Student&apos;s basic info</small>
            </div>
            <div class="form-block">
								<Show when={getInput(studentEditForm)}>
										<Calendar studentForm={studentEditForm}/>
								</Show>
            </div>
            <div class="form-block">
                <div style="display: inline-flex; gap: 4px;">
                    <button class="btn-secondary" type="button" onClick={() => cancel()}>Peruuta</button>
                    <button class="btn-primary" type="submit">Tallenna</button>
                </div>
            </div>
        </Form>
    )
}

export default EditStudent