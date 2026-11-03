import { createForm, Field, FieldArray, Form, reset, setInput, getInput } from "@formisch/solid";
import { createResource, createSignal, createEffect } from "solid-js";
import { useAuth } from "../../context/AuthContext.jsx";
import { deviceSchema } from "./schema.js";

function DeviceForm(props)
{
    const device = props.device;
    const cancel = () => props.cancel
    const title = props.title

    const handleSubmit = async (data) => {
        await props.onSubmit(data);
    }

    const deviceForm = createForm({
        schema: deviceSchema,
        validate: 'blur'
    });

    createEffect(() => {
        if (device) {
            reset(deviceForm, {
                initialInput: device(),
            });
        }
    });

    return (
        <Form
            of={deviceForm}
            onSubmit={handleSubmit}
            class="form"
        >
            <div class="form-block">
                {title}
            </div>
            <div class="form-block">
                <Field
                    of={deviceForm}
                    path={["name"]}
                >
                    {(field) => (
                        <div>
                            <label for={field.props.name}>Nimi:</label><br />
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

export default DeviceForm