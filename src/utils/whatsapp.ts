export function generateWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  const encodedMsg = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMsg}`;
}

export function buildAppointmentReminderMessage(tutorName: string, petName: string, dateStr: string, serviceName: string): string {
  return `Olá ${tutorName}! 🐾\nLembramos do agendamento de banho/tosa para o(a) seu(sua) pet *${petName}* (${serviceName}) na data de *${dateStr}*.\nConfirmamos sua presença? Estamos ansiosos para recebê-lo(a)! 🐶🐱`;
}

export function buildPetReadyMessage(tutorName: string, petName: string): string {
  return `Olá ${tutorName}! ✂️✨\nÓtimas notícias: o(a) *${petName}* já está prontinho(a), cheirosinho(a) e aguardando para voltar para casa!\nPode vir buscar quando desejar. Atenciosamente, PetGestor 🐾`;
}

export function buildBirthdayMessage(tutorName: string, petName: string): string {
  return `Parabéns pra você nesta data querida! 🎉🎂🎈\nHoje o(a) querido(a) *${petName}* está de aniversário! Desejamos muita saúde e patinhas felizes. Venha comemorar conosco com um presente especial do nosso Pet Shop! 🎁🐾`;
}

export function buildReceiptMessage(tutorName: string, totalStr: string, orderNum: string): string {
  return `Olá ${tutorName}! 🧾\nAgradecemos a preferência! Segue o comprovante do seu atendimento #${orderNum} no valor total de *${totalStr}*.\nQualquer dúvida estamos à disposição! 🐾`;
}
