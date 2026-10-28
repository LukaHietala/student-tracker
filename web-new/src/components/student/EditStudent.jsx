import { createForm, Field, FieldArray, Form, reset, setInput, getInput } from "@formisch/solid";
import { createResource, createSignal, createEffect } from "solid-js";
import { studentService } from "../../services";
import { useAuth } from "../../context/AuthContext.jsx";
import { useParams } from "@solidjs/router";
import { useNavigate } from "@solidjs/router";
import { studentSchema } from "./schema.js"

function EditStudent(props)
{
    // Asiatonta
    const student = props.student;

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

    return (
        <Form
            of={studentEditForm}
            onSubmit={handleSubmit}
        >
            <Field
                of={studentEditForm}
                path={["name"]}
            >
                {(field) => (
                    <div>
                        <label for={field.props.name}>Name</label>
                        <input
                            {...field.props}
                            id={field.props.name}
                            value={field.input}
                            type="text"
                            required
                        />
                        {field.errors && <div>{field.errors[0]}</div>}
                    </div>
                )}
            </Field>
            <Field
                of={studentEditForm}
                path={["uid"]}
            >
                {(field) => (
                    <div>
                        <label for={field.props.name}>UID</label>
                        <input
                            {...field.props}
                            id={field.props.name}
                            value={field.input}
                            type="text"
                            required
                            disabled
                        />
                        {field.errors && <div>{field.errors[0]}</div>}
                    </div>
                )}
            </Field>
            <Field
                of={studentEditForm}
                path={["status"]}
            >
                {(field) => (
                    <div>
                        <label for={field.props.name}>Status</label>
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
                        {field.errors && <div>{field.errors[0]}</div>}
                    </div>
                )}
            </Field>
            <Field
                of={studentEditForm}
                path={["startDate"]}
            >
                {(field) => (
                    <div>
                        <label for={field.props.name}>Start date</label>
                        <input
                            {...field.props}
                            id={field.props.name}
                            value={field.input}
                            type="date"
                            required
                        />
                        {field.errors && <div>{field.errors[0]}</div>}
                    </div>
                )}
            </Field>
            <Field
                of={studentEditForm}
                path={["endDate"]}
            >
                {(field) => (
                    <div>
                        <label for={field.props.name}>End date</label>
                        <input
                            {...field.props}
                            id={field.props.name}
                            value={field.input}
                            type="date"
                            required
                        />
                        {field.errors && <div>{field.errors[0]}</div>}
                    </div>
                )}
            </Field>
            <Field
                of={studentEditForm}
                path={["breakTime"]}
            >
                {(field) => (
                    <div>
                        <label for={field.props.name}>Break time (in minutes)</label>
                        <input
                            {...field.props}
                            id={field.props.name}
                            value={field.input}
                            type="number"
                            required
                        />
                        {field.errors && <div>{field.errors[0]}</div>}
                    </div>
                )}
            </Field>
            <FieldArray of={studentEditForm} path={['schedule']}>
                {(fieldArray) => (
                    <div>
                        {fieldArray.items.map((item, index) => (
                            <Show when={item}>
                                <div key={index}>
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
                    </div>
                )}
            </FieldArray>
            <button type="submit">Submit</button>
        </Form>
    )
}

export default EditStudent