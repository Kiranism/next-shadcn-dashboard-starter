/* oxlint-disable no-console -- CLI smoke script, output is the interface */
/**
 * Runtime smoke test for bindFieldComponent — run with:  bun scripts/smoke-form-binding.tsx
 *
 * The centralized cast in bindFieldComponent means tsc cannot see a dropped
 * prop forward, so this asserts the runtime contract directly:
 *
 * 1. SPY FORWARDING — a stub FormLike whose Field records received props;
 *    asserts every TypedFieldConfig key (name, validators, listeners,
 *    asyncDebounceMs, defaultValue) reaches form.Field, and that widget
 *    props (label, placeholder) do NOT leak into it.
 * 2. REAL RENDER, NO <form.AppForm> — bound fields re-provide form context
 *    themselves; SSR output must contain the default value.
 * 3. NESTED FORMS — a bound field of form B rendered inside form A's
 *    AppForm provider must read B (the old wrong-form hole).
 * 4. defaultValue actually takes effect for an absent optional path.
 */

import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { z } from 'zod';
import { useAppForm, useFormFields, type FormLike } from '@/components/ui/tanstack-form';

interface Values {
  title: string;
  urgent: boolean;
  nickname?: string;
}

const defaults: Values = { title: 'Hello-Title', urgent: true };

let failures = 0;
function check(label: string, cond: boolean, extra?: string) {
  if (cond) {
    console.log(`PASS ${label}`);
  } else {
    failures++;
    console.log(`FAIL ${label}${extra ? ` — ${extra}` : ''}`);
  }
}

// ---------------------------------------------------------------------------
// 1. Spy forwarding
// ---------------------------------------------------------------------------
const captured: any[] = [];
const listenerFn = ({ value }: any) => void value;
const changeValidator = ({ value }: { value: string }) =>
  value.length < 5 ? 'too short' : undefined;
const blurSchema = z.string().min(5);

function SpyProbe() {
  const spyForm: FormLike<Values> = {
    Field: (props: any) => {
      captured.push(props);
      return null;
    },
    state: { values: defaults }
  };
  const { FormTextField } = useFormFields(spyForm);
  return (
    <FormTextField
      name='title'
      label='Title'
      placeholder='p'
      validators={{
        onChange: changeValidator,
        onBlur: blurSchema,
        onChangeListenTo: ['nickname']
      }}
      listeners={{ onChange: listenerFn }}
      asyncDebounceMs={321}
      defaultValue='forwarded-default'
    />
  );
}

renderToString(<SpyProbe />);
const p = captured[0] ?? {};
check('spy: form.Field received exactly one render', captured.length === 1);
check('spy: name forwarded', p.name === 'title');
check(
  'spy: validators forwarded intact',
  p.validators?.onChange === changeValidator &&
    p.validators?.onBlur === blurSchema &&
    Array.isArray(p.validators?.onChangeListenTo) &&
    p.validators.onChangeListenTo[0] === 'nickname'
);
check('spy: listeners forwarded', p.listeners?.onChange === listenerFn);
check('spy: asyncDebounceMs forwarded', p.asyncDebounceMs === 321);
check('spy: defaultValue forwarded', p.defaultValue === 'forwarded-default');
check('spy: children render-prop provided', typeof p.children === 'function');
check(
  'spy: widget props do NOT leak into form.Field',
  !('label' in p) && !('placeholder' in p),
  JSON.stringify(Object.keys(p))
);

// ---------------------------------------------------------------------------
// 2. Real render without <form.AppForm>
// ---------------------------------------------------------------------------
function NoAppFormProbe() {
  const form = useAppForm({
    defaultValues: defaults,
    onSubmit: ({ value }) => void value
  });
  const { FormTextField, FormSwitchField } = useFormFields(form);
  return (
    <div>
      <FormTextField name='title' label='Title' />
      <FormSwitchField name='urgent' label='Urgent' />
    </div>
  );
}

let html2 = '';
let err2: unknown = null;
try {
  html2 = renderToString(<NoAppFormProbe />);
} catch (e) {
  err2 = e;
}
check('no-AppForm: renders without throwing', err2 === null, String(err2));
check('no-AppForm: input carries form value', html2.includes('Hello-Title'), html2.slice(0, 300));
check('no-AppForm: switch rendered checked', /aria-checked="true"|data-checked/.test(html2));

// ---------------------------------------------------------------------------
// 3. Nested forms — B's bound field inside A's provider reads B
// ---------------------------------------------------------------------------
function NestedProbe() {
  const formA = useAppForm({
    defaultValues: { title: 'FROM-FORM-A' } as { title: string },
    onSubmit: ({ value }) => void value
  });
  const formB = useAppForm({
    defaultValues: { title: 'FROM-FORM-B' } as { title: string },
    onSubmit: ({ value }) => void value
  });
  const B = useFormFields(formB);
  return (
    <formA.AppForm>
      {/* under form A's context, a B-bound field must still read B */}
      <B.FormTextField name='title' label='Nested' />
    </formA.AppForm>
  );
}

const html3 = renderToString(<NestedProbe />);
check(
  'nested: B-bound field reads form B, not ambient form A',
  html3.includes('FROM-FORM-B') && !html3.includes('FROM-FORM-A'),
  html3.slice(0, 300)
);

// ---------------------------------------------------------------------------
// 4. defaultValue takes effect for an absent optional path
// ---------------------------------------------------------------------------
function DefaultValueProbe() {
  const form = useAppForm({
    defaultValues: defaults,
    onSubmit: ({ value }) => void value
  });
  const { FormTextField } = useFormFields(form);
  return <FormTextField name='nickname' label='Nickname' defaultValue='nick-default' />;
}

const html4 = renderToString(<DefaultValueProbe />);
check(
  'defaultValue: applied to absent optional path',
  html4.includes('nick-default'),
  html4.slice(0, 300)
);

// ---------------------------------------------------------------------------
// 5. Phase 2 anatomy: collision-free ids, name passthrough, disabled,
//    orientation, switch error slot wiring
// ---------------------------------------------------------------------------
function AnatomyProbe() {
  const form = useAppForm({
    defaultValues: defaults,
    onSubmit: ({ value }) => void value
  });
  const { FormTextField, FormSwitchField } = useFormFields(form);
  return (
    <div>
      <FormTextField name='title' label='Title' description='Desc here' disabled />
      <FormTextField name='nickname' label='Nick' orientation='responsive' />
      <FormSwitchField name='urgent' label='Urgent' description='Pages on-call' />
    </div>
  );
}

const html5 = renderToString(<AnatomyProbe />);
check('anatomy: input carries native name attribute', /name="title"/.test(html5));
check('anatomy: input disabled propagates', /name="title"[^>]*disabled|disabled[^>]*name="title"/.test(html5));
check(
  'anatomy: control id is useId-namespaced, not bare field name',
  !/id="title"/.test(html5) && /id="[^"]+-title"/.test(html5),
  html5.match(/id="[^"]*title[^"]*"/g)?.join(',')
);
check(
  'anatomy: description rendered with resolvable describedby id',
  (() => {
    const descId = html5.match(/aria-describedby="([^"]+)"/)?.[1];
    return !!descId && html5.includes(`id="${descId}"`);
  })()
);
check('anatomy: responsive orientation renders data-orientation', /data-orientation="responsive"/.test(html5));
check('anatomy: switch renders inside FieldContent', /data-slot="field-content"/.test(html5));

// Two forms, same field name → distinct control ids (the old collision bug)
function TwinForms() {
  const a = useAppForm({ defaultValues: { title: 'A' }, onSubmit: () => {} });
  const b = useAppForm({ defaultValues: { title: 'B' }, onSubmit: () => {} });
  const A = useFormFields(a);
  const B = useFormFields(b);
  return (
    <div>
      <A.FormTextField name='title' label='T1' />
      <B.FormTextField name='title' label='T2' />
    </div>
  );
}
const html6 = renderToString(<TwinForms />);
const titleIds = [...html6.matchAll(/<input[^>]*id="([^"]*title[^"]*)"/g)].map((m) => m[1]);
check(
  'anatomy: same field name in two forms gets distinct ids',
  titleIds.length === 2 && titleIds[0] !== titleIds[1],
  titleIds.join(' vs ')
);

// ---------------------------------------------------------------------------
// 6. Phase 3 fields: checkbox group + array text render and wire correctly
// ---------------------------------------------------------------------------
function Phase3Probe() {
  const form = useAppForm({
    defaultValues: { interests: ['a'], emails: ['x@y.z', ''] } as {
      interests: string[];
      emails: string[];
    },
    onSubmit: ({ value }) => void value
  });
  const { FormCheckboxGroupField, FormArrayTextField } = useFormFields(form);
  return (
    <div>
      <FormCheckboxGroupField
        name='interests'
        label='Interests'
        options={[
          { value: 'a', label: 'Alpha' },
          { value: 'b', label: 'Beta', disabled: true }
        ]}
        columns={2}
      />
      <FormArrayTextField name='emails' label='Emails' itemPlaceholder='name@example.com' addLabel='Add Email' />
    </div>
  );
}
const html7 = renderToString(<Phase3Probe />);
check('phase3: checkbox-group slot rendered', /data-slot="checkbox-group"/.test(html7));
check('phase3: checked state reflects array value', /aria-checked="true"|data-checked/.test(html7));
check('phase3: disabled option propagates', /disabled/.test(html7));
check(
  'phase3: array field renders one input per value',
  (html7.match(/name@example\.com/g) ?? []).length === 2,
  String((html7.match(/name@example\.com/g) ?? []).length)
);
check('phase3: array field renders inline remove button', /aria-label="Remove Emails 1"/.test(html7));
check('phase3: add button rendered', />Add Email</.test(html7));

// ---------------------------------------------------------------------------
// 7. Pattern 2 (AppField render prop) id scope — the withItemScope path.
//    Body-computed ids (control, describedby targets) and child-computed ids
//    (error/description elements) must agree even without bindFieldComponent.
// ---------------------------------------------------------------------------
function Pattern2Probe() {
  const form = useAppForm({
    defaultValues: defaults,
    onSubmit: ({ value }) => void value
  });
  return (
    <form.AppForm>
      <form.AppField name='title'>
        {(field) => <field.TextField label='Title' description='P2 description' />}
      </form.AppField>
    </form.AppForm>
  );
}
const html8 = renderToString(<Pattern2Probe />);
check(
  'pattern2: control id is scope-namespaced (withItemScope active)',
  !/id="title"/.test(html8) && /id="[^"]+-title"/.test(html8),
  html8.match(/id="[^"]*title[^"]*"/g)?.join(',')
);
check(
  'pattern2: every aria-describedby target id exists in the markup',
  (() => {
    const refs = [...html8.matchAll(/aria-describedby="([^"]+)"/g)].flatMap((m) =>
      m[1].split(' ')
    );
    return refs.length > 0 && refs.every((r) => html8.includes(`id="${r}"`));
  })(),
  [...html8.matchAll(/aria-describedby="([^"]+)"/g)].map((m) => m[1]).join(';')
);

console.log(failures === 0 ? 'SMOKE: ALL PASS' : `SMOKE: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
