// Geração de "Pix Copia e Cola" (BR Code / padrão EMV® MPM do Banco Central).
//
// Um BR Code estático pode embutir o VALOR do pagamento (campo 54). Quando o
// usuário cola esse código no app do banco (PicPay etc.), o valor já vem
// preenchido — que é o objetivo aqui. A chave Pix "pura" (só o email/telefone)
// NÃO carrega valor; por isso montamos o payload completo abaixo.
//
// Referência: EMV QRCPS-MPM + Manual de Padrões para Iniciação do Pix (BCB).

export interface DadosPix {
  chave: string;   // chave Pix do recebedor
  nome: string;    // nome do recebedor (campo 59) — máx. 25 caracteres
  cidade: string;  // cidade do recebedor (campo 60) — máx. 15 caracteres
  valor?: number;  // valor em reais (campo 54); omitido gera código sem valor
  txid?: string;   // identificador (campo 62/05); "***" = sem txid específico
}

// Monta um campo EMV: ID (2 dígitos) + tamanho (2 dígitos, zero à esquerda) + valor.
function campo(id: string, valor: string): string {
  const tamanho = valor.length.toString().padStart(2, '0');
  return `${id}${tamanho}${valor}`;
}

// Normaliza texto para ASCII maiúsculo sem acentos e recorta no limite.
// Nome/cidade com acento ou minúsculas são aceitos por alguns bancos, mas a
// forma "limpa" é a mais compatível e é o que consta nos comprovantes.
function sanitize(texto: string, max: number): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos (marcas combinantes)
    .replace(/[^A-Za-z0-9 ]/g, '')   // só letras, números e espaço
    .toUpperCase()
    .trim()
    .slice(0, max);
}

// CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF). Calculado sobre todo o
// payload incluindo "6304"; resultado em hexadecimal maiúsculo de 4 caracteres.
function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Gera a string "Pix Copia e Cola" pronta para colar no app do banco.
export function buildPixPayload({ chave, nome, cidade, valor, txid = '***' }: DadosPix): string {
  // Campo 26 — Merchant Account Information (identifica que é Pix + a chave).
  const merchantAccount = campo('00', 'br.gov.bcb.pix') + campo('01', chave.trim());

  // Campo 62 — Additional Data Field (leva o txid; "***" quando não há um).
  const additionalData = campo('05', txid);

  const partes = [
    campo('00', '01'),                       // Payload Format Indicator
    campo('26', merchantAccount),            // Merchant Account Information — Pix
    campo('52', '0000'),                     // Merchant Category Code (não usado)
    campo('53', '986'),                      // Moeda: BRL (ISO 4217)
  ];

  // Valor (campo 54) só entra quando informado e maior que zero.
  if (valor != null && valor > 0) {
    partes.push(campo('54', valor.toFixed(2)));
  }

  partes.push(
    campo('58', 'BR'),                       // País
    campo('59', sanitize(nome, 25)),         // Nome do recebedor
    campo('60', sanitize(cidade, 15)),       // Cidade do recebedor
    campo('62', additionalData),             // Additional Data Field
  );

  // O CRC (campo 63) é calculado sobre o payload + "6304" e concatenado no fim.
  const semCrc = partes.join('') + '6304';
  return semCrc + crc16(semCrc);
}
