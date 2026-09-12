// Public CliQ payment details shown to students at checkout — not a secret,
// but must match the center's real bank-registered CliQ alias.
export const CLIQ_ALIAS = process.env.NEXT_PUBLIC_CLIQ_ALIAS || "MindMatrixAcademy";
export const CLIQ_BANK_NAME = process.env.NEXT_PUBLIC_CLIQ_BANK_NAME || "اسم البنك";
