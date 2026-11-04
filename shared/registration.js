export const states = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
export const consentText = 'Autorizo a Entera a utilizar os dados informados para realizar meu cadastro e entrar em contato comigo.';
export const consentVersion = '1.0';

export function validateRegistration(body) {
  const source = body && typeof body === 'object' ? body : {};
  const clean = (key) => typeof source[key] === 'string' ? source[key].trim() : '';
  const data = {
    fullName: clean('fullName').replace(/\s+/g, ' '),
    crm: clean('crm'),
    state: clean('state').toUpperCase(),
    phone: clean('phone').replace(/[\s()+-]/g, ''),
    email: clean('email').toLowerCase(),
    consent: source.consent === true,
  };
  const errors = {};
  if (data.fullName.length > 120 || !/^\p{L}[\p{L}\p{M}'’-]*(?:\s+[\p{L}\p{M}'’-]+)+$/u.test(data.fullName)) errors.fullName = 'Informe seu nome e sobrenome.';
  if (!/^\d{1,10}$/.test(data.crm)) errors.crm = 'Informe somente os números do CRM.';
  if (!states.includes(data.state)) errors.state = 'Selecione o estado do seu CRM.';
  if (!/^[1-9]{2}\d{8,9}$/.test(data.phone)) errors.phone = 'Informe um telefone com DDD (10 ou 11 dígitos).';
  if (data.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = 'Informe um e-mail válido.';
  if (!data.consent) errors.consent = 'É necessário aceitar para concluir o cadastro.';
  return { data, errors, valid: Object.keys(errors).length === 0 };
}
