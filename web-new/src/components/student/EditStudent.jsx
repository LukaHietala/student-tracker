import { createForm, Field, Form } from "@formisch/solid";
import { createResource, createSignal } from "solid-js";
import { studentService } from "../../services";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate } from "@solidjs/router";
import * as v from 'valibot';

