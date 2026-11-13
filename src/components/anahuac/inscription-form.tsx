'use client';

import { useCallback, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import {
  anahuacProgram,
  formatMXN,
  inscriptionFields,
  type InscriptionField,
} from '@/data/anahuac';

/**
 * Inscription form rendered natively on the landing.
 *
 * It POSTs straight to the Google Form's `formResponse` endpoint targeting a
 * hidden iframe. That keeps responses flowing into the same spreadsheet without
 * an embedded Google iframe, and sidesteps CORS entirely — Google serves no CORS
 * headers, so a plain `fetch` could never read the response anyway.
 *
 * The trade-off: the browser cannot tell us whether Google accepted the payload,
 * so success here means "submitted", not "confirmed stored".
 */

const SINK = 'anahuac-gform-sink';

/** `entry.123` is a valid name but an awkward id — dots break CSS selectors. */
const fieldId = (entry: string) => entry.replace(/\./g, '-');

const inputClasses =
  'w-full rounded-lg border border-border bg-white px-4 py-3 text-navy transition-colors placeholder:text-muted-foreground focus:border-anahuac focus:outline-none focus:ring-2 focus:ring-anahuac/30';

const beca = anahuacProgram.pricing.scholarship;

const InscriptionForm = () => {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [birthDate, setBirthDate] = useState('');
  const [otherChoice, setOtherChoice] = useState<Record<string, boolean>>({});

  const dateField = inscriptionFields.find((f) => f.kind === 'date');
  const [year, month, day] = birthDate
    ? birthDate.split('-').map((part) => String(Number(part)))
    : ['', '', ''];

  const submitted = useRef(false);
  const settled = useRef(false);
  const fallback = useRef<number | undefined>(undefined);

  /**
   * Runs once the POST has landed — either because the sink iframe loaded
   * Google's response, or because we gave up waiting. Redirecting to Stripe
   * before that risks cancelling the in-flight request and losing the lead.
   */
  const finish = useCallback(() => {
    if (settled.current) return;
    settled.current = true;
    window.clearTimeout(fallback.current);

    setStatus('sent');
    if (anahuacProgram.checkoutUrl) {
      window.location.href = anahuacProgram.checkoutUrl;
    }
  }, []);

  const handleSubmit = (_event: FormEvent<HTMLFormElement>) => {
    // The browser performs the POST into the hidden iframe; we only drive the UI.
    setStatus('sending');
    submitted.current = true;
    // Don't strand anyone if the iframe never reports back.
    fallback.current = window.setTimeout(finish, 6000);
  };

  if (status === 'sent') {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border-2 border-anahuac bg-white p-10 text-center shadow-lg">
        <CheckCircle2
          size={48}
          className="mx-auto text-success"
          aria-hidden="true"
        />
        <h3 className="mt-4 font-heading text-navy">¡Recibimos tus datos!</h3>
        {anahuacProgram.checkoutUrl ? (
          <p className="text-muted-foreground">
            Te estamos llevando al pago seguro para confirmar tu lugar…
          </p>
        ) : (
          <p className="text-muted-foreground">
            En breve te contactamos con el enlace de pago para confirmar tu
            inscripción. Los lugares se asignan por orden de pago confirmado.
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <form
        action={anahuacProgram.formActionUrl}
        method="POST"
        target={SINK}
        onSubmit={handleSubmit}
        className="mx-auto max-w-3xl rounded-2xl border border-border bg-white p-6 shadow-lg md:p-10"
      >
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {inscriptionFields.map((field) => (
            <div
              key={field.entry}
              className={field.full ? 'md:col-span-2' : undefined}
            >
              <Field
                field={field}
                birthDate={birthDate}
                onBirthDateChange={setBirthDate}
                isOther={Boolean(otherChoice[field.entry])}
                onOtherChange={(value) =>
                  setOtherChoice((prev) => ({ ...prev, [field.entry]: value }))
                }
              />
            </div>
          ))}
        </div>

        {/* Google's date questions expect the parts, not an ISO string. */}
        {dateField && (
          <>
            <input type="hidden" name={`${dateField.entry}_year`} value={year} />
            <input
              type="hidden"
              name={`${dateField.entry}_month`}
              value={month}
            />
            <input type="hidden" name={`${dateField.entry}_day`} value={day} />
          </>
        )}
        <input type="hidden" name="fvv" value="1" />
        <input type="hidden" name="pageHistory" value="0" />

        <div className="mt-10 text-center">
          <button
            type="submit"
            disabled={status === 'sending'}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-anahuac px-8 py-4 font-heading text-base font-semibold tracking-wide text-white shadow-lg shadow-anahuac/30 transition-colors hover:bg-anahuac-600 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          >
            {status === 'sending' ? (
              <>
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                ENVIANDO…
              </>
            ) : (
              <>
                RESERVAR INSCRIPCIÓN
                <ArrowRight size={18} aria-hidden="true" />
              </>
            )}
          </button>

          {/*
            This sits directly above the payment step, so it states what the
            card is actually charged — the enrollment fee, not the program
            total. Quoting the total here reads as the amount due.
          */}
          <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
            Pagas la inscripción de{' '}
            <strong className="text-navy">{formatMXN(beca.enrollment)}</strong>{' '}
            para apartar tu lugar. El programa ({formatMXN(beca.tuition)} con
            beca) se paga por separado.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Beca vigente hasta el {beca.deadline}
          </p>
        </div>
      </form>

      {/*
        Receives Google's response so the page itself never navigates away.
        Its load event is our only signal that the POST completed — the response
        is opaque, so it tells us the request finished, not that Google stored
        it. The first load is the initial about:blank, hence the guard.
      */}
      <iframe
        name={SINK}
        title=""
        className="hidden"
        aria-hidden="true"
        onLoad={() => {
          if (submitted.current) finish();
        }}
      />
    </>
  );
};

interface FieldProps {
  field: InscriptionField;
  birthDate: string;
  onBirthDateChange: (value: string) => void;
  isOther: boolean;
  onOtherChange: (value: boolean) => void;
}

const Field = ({
  field,
  birthDate,
  onBirthDateChange,
  isOther,
  onOtherChange,
}: FieldProps) => {
  const id = fieldId(field.entry);

  const label = (
    <label
      htmlFor={field.kind === 'radio' ? undefined : id}
      className="block font-heading text-sm font-semibold text-navy"
    >
      {field.label} <span className="text-danger">*</span>
    </label>
  );

  const help = field.help ? (
    <p className="mb-0 mt-1 text-xs text-muted-foreground">{field.help}</p>
  ) : null;

  if (field.kind === 'radio') {
    return (
      <fieldset>
        <legend className="block font-heading text-sm font-semibold text-navy">
          {field.label} <span className="text-danger">*</span>
        </legend>
        {help}
        <div className="mt-3 flex flex-wrap gap-3">
          {field.options.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-3 transition-colors has-[:checked]:border-anahuac has-[:checked]:bg-anahuac-50"
            >
              <input
                type="radio"
                name={field.entry}
                value={option.value}
                required
                className="accent-anahuac"
              />
              <span className="text-navy">{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  if (field.kind === 'select') {
    return (
      <div>
        {label}
        {help}
        <select
          id={id}
          name={field.entry}
          required
          defaultValue=""
          onChange={(event) =>
            onOtherChange(event.target.value === '__other_option__')
          }
          className={`mt-2 ${inputClasses}`}
        >
          <option value="" disabled>
            Selecciona una opción
          </option>
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {field.allowOther && <option value="__other_option__">Otro</option>}
        </select>

        {field.allowOther && isOther && (
          <input
            type="text"
            name={`${field.entry}.other_option_response`}
            required
            placeholder="Cuéntanos cómo te enteraste"
            className={`mt-3 ${inputClasses}`}
          />
        )}
      </div>
    );
  }

  if (field.kind === 'textarea') {
    return (
      <div>
        {label}
        {help}
        <textarea
          id={id}
          name={field.entry}
          required
          rows={3}
          className={`mt-2 ${inputClasses}`}
        />
      </div>
    );
  }

  if (field.kind === 'date') {
    return (
      <div>
        {label}
        {help}
        {/* Unnamed on purpose: the value is submitted via the _year/_month/_day
            hidden inputs that Google's date questions expect. */}
        <input
          id={id}
          type="date"
          required
          value={birthDate}
          onChange={(event) => onBirthDateChange(event.target.value)}
          className={`mt-2 ${inputClasses}`}
        />
      </div>
    );
  }

  return (
    <div>
      {label}
      {help}
      <input
        id={id}
        type={field.kind}
        name={field.entry}
        required
        autoComplete={field.autoComplete}
        {...(field.kind === 'number' ? { min: 16, max: 99 } : {})}
        className={`mt-2 ${inputClasses}`}
      />
    </div>
  );
};

export default InscriptionForm;
