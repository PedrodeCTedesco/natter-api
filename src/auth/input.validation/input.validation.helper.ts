import { Response } from 'express';

export function validateUserInput(name: string, owner: string, res: Response): boolean {
    if (!name || name.length > 255) {
        res.status(400).json({ error: 'O campo "name" deve ter no máximo 255 caracteres.' });
        throw new Error('ValidationError: O campo "name" deve ter no máximo 255 caracteres.');
    }

    if (!owner || owner.length > 255) {
        res.status(400).json({ error: 'O campo "owner" deve ter no máximo 255 caracteres.' });
        throw new Error('ValidationError: O campo "owner" deve ter no máximo 255 caracteres.');
    }
    return true;
}

export function validateUserInputFormat(name: string, owner: string, res: Response): boolean {
    const regex = /^[a-zA-Z][a-zA-Z0-9 ]{1,29}$/;
    if (!regex.test(name)) {
        res.status(400).json({ error: 'O campo "name" é inválido. Ele deve começar com uma letra e conter apenas letras e números, com no máximo 30 caracteres.' });
        throw new Error('ValidationError: O campo "name" é inválido.');
    }

    if (!regex.test(owner)) {
        res.status(400).json({ error: 'O campo "owner" é inválido. Ele deve começar com uma letra e conter apenas letras e números, com no máximo 30 caracteres.' });
        throw new Error('ValidationError: O campo "owner" é inválido.');
    }
    return true;
}

export function validateSpaceId(spaceId: number, res: Response): boolean {
    if (!spaceId || isNaN(Number(spaceId))) {
        res.status(400).json({ error: 'O campo "spaceId" é inválido.' });
        throw new Error('ValidationError: O campo "spaceId" é inválido.');
    }
    return true;
}

export function validateMessageId(messageId: number, res: Response): boolean {
    if (!messageId || isNaN(Number(messageId))) {
        res.status(400).json({ error: 'O campo "messageId" é inválido.' });
        throw new Error('ValidationError: O campo "messageId" é inválido.');
    }
    return true;
}

export function validateUserMessage(message: string, res: Response): boolean {
    if (!message || message.length > 255) {
        res.status(400).json({ error: 'O campo "message" deve ter no máximo 255 caracteres.' });
        throw new Error('ValidationError: O campo "message" é inválido.');
      }

    return true;
}

export function validateUserMessageFormat(message: string, res: Response): boolean {
    // Permitir letras, números, espaços e pontuação segura, sem caracteres HTML
    const regex = /^[a-zA-Z0-9 .,?!áéíóúàèìòùãõçÁÉÍÓÚÀÈÌÒÙÃÕÇ-]+$/;
    if (!regex.test(message)) {
      res.status(400).json({ error: 'O campo "message" contém caracteres inválidos.' });
      throw new Error('ValidationError: O campo "message" é inválido.');
    }
  
    return true;
}

export function validateDate(date: string): boolean {
    const regex = /^([0-2][0-9]|(3)[0-1])\/(0[1-9]|1[0-2])\/\d{4}$/;
  
    if (!regex.test(date)) {
      throw new Error('ValidationError: O formato da data deve ser dd/mm/aaaa.');
    }
  
    return true;
}

export function escapeSpecialCharacters(input: string): string {
    return input
      .replace(/&/g, '&amp;')  // & -> &amp;
      .replace(/</g, '&lt;')   // < -> &lt;
      .replace(/>/g, '&gt;')   // > -> &gt;
      .replace(/"/g, '&quot;') // " -> &quot;
      .replace(/'/g, '&#039;') // ' -> &#039;
      .replace(/\//g, '&#047;'); // / -> &#047;
}
  