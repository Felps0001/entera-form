import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { consentText, states, validateRegistration } from '@eucerin/shared/registration';
import './styles.css';

const initial = { fullName: '', crm: '', state: '', phone: '', email: '', consent: false };
function Icon({ type, ...props }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{type === 'arrow' ? <path d="M5 12h14m-5-5 5 5-5 5" /> : type === 'check' ? <path d="m5 12 4 4L19 6" /> : <><rect x="6" y="10" width="12" height="10" rx="2" /><path d="M9 10V7a3 3 0 0 1 6 0v3m-3 4v2" /></>}</svg>;
}
function App() {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const submitting = useRef(false);
  function change(event) {
    const { name, value, checked, type } = event.target;
    let next = type === 'checkbox' ? checked : value;
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 11);
      next = digits.length > 2 ? `(${digits.slice(0, 2)}) ${digits.slice(2)}` : digits;
      if (digits.length > 6) next = `${next.slice(0, -4)}-${next.slice(-4)}`;
    }
    setValues((old) => ({ ...old, [name]: next }));
    setErrors((old) => ({ ...old, [name]: undefined }));
    setMessage('');
  }
  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    const validation = validateRegistration(values);
    setErrors(validation.errors);
    if (!validation.valid) { document.getElementById(Object.keys(validation.errors)[0])?.focus(); return; }
    submitting.current = true;
    setStatus('sending'); setMessage('');
    try {
      const apiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
      const response = await fetch(`${apiUrl}/api/registrations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(validation.data), signal: AbortSignal.timeout(15000) });
      const result = await response.json();
      if (!response.ok) { setErrors(result.errors || {}); throw new Error(result.message || 'Não foi possível concluir o cadastro.'); }
      setStatus('success');
    } catch (error) {
      setStatus('idle');
      setMessage(error.name === 'TypeError' || error.name === 'TimeoutError' ? 'Não foi possível confirmar o envio. Verifique sua conexão e tente novamente.' : error.message);
    } finally { submitting.current = false; }
  }
  function field(name, label, placeholder, extra = {}) {
    return <div className="field"><label htmlFor={name}>{label} <span>*</span></label><input id={name} name={name} value={values[name]} onChange={change} placeholder={placeholder} required aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${name}-error` : undefined} {...extra} />{errors[name] && <small className="field-error" id={`${name}-error`}>{errors[name]}</small>}</div>;
  }
  return <div className="page">
    <header className="brand"><img src="/logo-eucerin.png" alt="Eucerin" width="481" height="178" /></header>
    <main>
      <section className="form-card" aria-label="Cadastro Eucerin">
        {status === 'success' ? <div className="success" role="status"><div className="success-icon"><Icon type="check" width="32" height="32" /></div><span className="eyebrow">TUDO CERTO</span><h1 id="form-title">É bom ter você por aqui.</h1><p>Seu cadastro foi realizado com sucesso.<br />Obrigado por se conectar com a Eucerin.</p><button className="secondary" onClick={() => { setValues(initial); setErrors({}); setStatus('idle'); }}>Fazer novo cadastro <Icon type="arrow" /></button></div> : <>
          <div className="intro"><p>Preencha seus dados para se cadastrar na Eucerin.</p></div>
          <div className="section-heading"><span>Seus dados</span><small>* Campos obrigatórios</small></div>
          <form onSubmit={submit} noValidate>
            <fieldset disabled={status === 'sending'}>
              {field('fullName', 'Nome completo', 'Como você se chama?', { autoComplete: 'name', maxLength: 120 })}
              <div className="field-row">
                {field('crm', 'CRM', 'Número do CRM', { inputMode: 'numeric', maxLength: 10 })}
                <div className="field"><label htmlFor="state">Estado <span>*</span></label><select id="state" name="state" value={values.state} onChange={change} required aria-invalid={!!errors.state} aria-describedby={errors.state ? 'state-error' : undefined}><option value="">Selecione a UF</option>{states.map((state) => <option key={state}>{state}</option>)}</select>{errors.state && <small className="field-error" id="state-error">{errors.state}</small>}</div>
              </div>
              {field('phone', 'Telefone', '(00) 00000-0000', { type: 'tel', autoComplete: 'tel-national', maxLength: 16 })}
              {field('email', 'E-mail', 'voce@exemplo.com.br', { type: 'email', autoComplete: 'email', maxLength: 254 })}
              <div className="consent"><label htmlFor="consent"><input type="checkbox" id="consent" name="consent" checked={values.consent} onChange={change} required aria-invalid={!!errors.consent} aria-describedby={errors.consent ? 'consent-error' : undefined} /><span>{consentText}</span></label>{errors.consent && <small className="field-error" id="consent-error">{errors.consent}</small>}</div>
              {message && <p className="error-banner" role="alert">{message}</p>}
              <button className="submit" type="submit">{status === 'sending' ? 'Enviando cadastro…' : 'Concluir cadastro'}{status === 'sending' ? <span className="spinner" /> : <Icon type="arrow" />}</button>
            </fieldset>
          </form>
          <p className="privacy-note"><Icon type="lock" width="14" height="14" /> Seus dados serão usados para cadastro e contato.</p>
        </>}
      </section>
    </main>
    <footer><span>EUCERIN</span></footer>
  </div>;
}
createRoot(document.getElementById('root')).render(<App />);
