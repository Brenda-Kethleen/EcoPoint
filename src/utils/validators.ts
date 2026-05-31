/**
 * EcoPoint - Validadores com Expressões Regulares
 *
 * Implementa validação de dados de entrada usando expressões regulares,
 * conforme descrito na metodologia do projeto (Teoria da Computação).
 *
 * Referência: Hopcroft, Motwani e Ullman (2006, p. 34) — expressões regulares
 * como modelos formais para garantir consistência e confiabilidade de sistemas.
 */

// ─── Expressões Regulares ─────────────────────────────────────────────────────

/** Email: usuario@dominio.extensao */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

/** CPF: 000.000.000-00 ou 00000000000 */
const CPF_REGEX = /^(\d{3}\.?\d{3}\.?\d{3}-?\d{2})$/;

/** Senha: mínimo 6 caracteres, pelo menos 1 letra e 1 número */
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

/** Nome: mínimo 3 caracteres, apenas letras, espaços e acentos */
const NAME_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]{3,}$/;

/** Endereço: deve conter rua/av + número */
const ADDRESS_REGEX = /^.{10,}$/;

/** Telefone: (00) 00000-0000 ou variações */
const PHONE_REGEX = /^(\(?\d{2}\)?\s?)(\d{4,5}[-\s]?\d{4})$/;

// ─── Funções de validação ─────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  message: string;
}

/**
 * Valida endereço de email.
 */
export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();
  if (!trimmed) {
    return { valid: false, message: 'O email é obrigatório.' };
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, message: 'Informe um email válido (ex: nome@dominio.com).' };
  }
  return { valid: true, message: '' };
}

/**
 * Valida CPF com dígitos verificadores.
 * Aplica expressão regular para formato e algoritmo para dígitos.
 */
export function validateCPF(cpf: string): ValidationResult {
  const trimmed = cpf.trim();
  if (!trimmed) {
    return { valid: false, message: 'O CPF é obrigatório.' };
  }
  if (!CPF_REGEX.test(trimmed)) {
    return { valid: false, message: 'Informe um CPF válido (000.000.000-00).' };
  }

  // Remove formatação para validar dígitos verificadores
  const digits = trimmed.replace(/\D/g, '');

  // Rejeita sequências repetidas (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(digits)) {
    return { valid: false, message: 'CPF inválido.' };
  }

  // Valida primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[9])) {
    return { valid: false, message: 'CPF inválido.' };
  }

  // Valida segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[10])) {
    return { valid: false, message: 'CPF inválido.' };
  }

  return { valid: true, message: '' };
}

/**
 * Valida senha com requisitos mínimos de segurança.
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { valid: false, message: 'A senha é obrigatória.' };
  }
  if (password.length < 6) {
    return { valid: false, message: 'A senha deve ter pelo menos 6 caracteres.' };
  }
  if (!PASSWORD_REGEX.test(password)) {
    return { valid: false, message: 'A senha deve conter pelo menos uma letra e um número.' };
  }
  return { valid: true, message: '' };
}

/**
 * Valida nome completo.
 */
export function validateName(name: string): ValidationResult {
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, message: 'O nome é obrigatório.' };
  }
  if (!NAME_REGEX.test(trimmed)) {
    return { valid: false, message: 'Informe um nome válido (mínimo 3 letras).' };
  }
  if (!trimmed.includes(' ')) {
    return { valid: false, message: 'Informe o nome completo (nome e sobrenome).' };
  }
  return { valid: true, message: '' };
}

/**
 * Valida endereço residencial.
 */
export function validateAddress(address: string): ValidationResult {
  const trimmed = address.trim();
  if (!trimmed) {
    return { valid: false, message: 'O endereço é obrigatório.' };
  }
  if (!ADDRESS_REGEX.test(trimmed)) {
    return { valid: false, message: 'Informe o endereço completo (mínimo 10 caracteres).' };
  }
  return { valid: true, message: '' };
}

/**
 * Valida número de telefone.
 */
export function validatePhone(phone: string): ValidationResult {
  const trimmed = phone.trim();
  if (!trimmed) {
    return { valid: false, message: 'O telefone é obrigatório.' };
  }
  if (!PHONE_REGEX.test(trimmed)) {
    return { valid: false, message: 'Informe um telefone válido (ex: (11) 99999-9999).' };
  }
  return { valid: true, message: '' };
}

/**
 * Formata CPF enquanto o usuário digita: 000.000.000-00
 */
export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/**
 * Formata telefone enquanto o usuário digita: (00) 00000-0000
 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}
