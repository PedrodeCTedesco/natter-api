import { BadRequestException } from '@nestjs/common';
import { Response } from 'express';

export function validateUserInput(name: string, owner: string): boolean {
    if (!name || name.length > 255) throw new BadRequestException({ status: 400, message: 'o campo "name" deve ter no máximo 255 caracteres.'});
    if (!owner || owner.length > 255) throw new BadRequestException({ status: 400, message: 'o campo "owner" deve ter no máximo 255 caracteres.'});
    return true;
}

export function validateUserInputFormat(name: string, owner: string): boolean {
    const regex: RegExp = /^[a-zA-Z][a-zA-Z0-9 ]{1,29}$/;
    if (!regex.test(name)) throw new BadRequestException({ status: 400, message: 'O campo "name" é inválido. Ele deve começar com uma letra e conter apenas letras e números, com no máximo 30 caracteres.'});
    if (!regex.test(owner)) throw new BadRequestException({ status: 400, message: 'O campo "owner" é inválido. Ele deve começar com uma letra e conter apenas letras e números, com no máximo 30 caracteres.' });
    return true;
}

export function validateSpaceId(spaceId: number, res?: Response): boolean {
    if (!spaceId || isNaN(Number(spaceId))) {
        res?.status(400).json({ error: 'O campo "spaceId" é inválido.' });
        throw new Error('ValidationError: O campo "spaceId" é inválido.');
    }
    return true;
}

export function validateMessageId(messageId: number, res?: Response): boolean {
    if (!messageId || isNaN(Number(messageId))) {
        res?.status(400).json({ error: 'O campo "messageId" é inválido.' });
        throw new Error('ValidationError: O campo "messageId" é inválido.');
    }
    return true;
}

export function validateUserMessage(message: string, res?: Response): boolean {
    if (!message || message.length > 255) {
        res?.status(400).json({ error: 'O campo "message" deve ter no máximo 255 caracteres.' });
        throw new Error('ValidationError: O campo "message" é inválido.');
      }

    return true;
}

export function validateUserMessageFormat(message: string, res?: Response): boolean {
    const regex: RegExp = /^[a-zA-Z0-9 .,?!áéíóúàèìòùãõçÁÉÍÓÚÀÈÌÒÙÃÕÇ-]+$/;
    if (!regex.test(message)) {
      res?.status(400).json({ error: 'O campo "message" contém caracteres inválidos.' });
      throw new Error('ValidationError: O campo "message" é inválido.');
    }
  
    return true;
}

export function validateDate(date: string): boolean {
    const regex: RegExp = /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/;
    if (!regex.test(date)) throw new BadRequestException({ status: 400, message: 'ValidationError: O formato da data deve ser dd/mm/aaaa.'});
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

export function validateUsername(username: string): boolean {
    const regex: RegExp = /^[a-zA-Z][a-zA-Z0-9 ]{1,29}$/;
    if(!username) throw new BadRequestException({ status: 400, message: 'o campo "username" não pode estar vazio.' });
    if (!regex.test(username)) throw new BadRequestException({ 
        status: 400, 
        message: 'O campo "username" é inválido. Ele deve começar com uma letra e conter apenas letras e números, ter no máximo 30 caracteres e não possuir caracteres especiais.'});
    return true;
}

export function validatePassword(password: string): boolean {
    const regex: RegExp = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{9,255}$/;

    if (!password) {
        throw new BadRequestException({
            status: 400,
            message: 'O campo "password" não pode estar vazio.'
        });
    }

    if (password.length < 8 || password.length > 255) {
        throw new BadRequestException({
            status: 400,
            message: 'O campo "password" deve ter entre 9 e 255 caracteres.'
        });
    }

    if (!regex.test(password)) {
        console.log('Validation failed: Missing required characters.');
        throw new BadRequestException({ 
            status: 400, 
            message: 'A senha deve conter pelo menos uma letra, um número e um caractere especial.' 
        });
    }

    return true;
}

export function validatePermissions(permissions: string): boolean {
    const regex: RegExp = /^[arwd]$/;
    if(!permissions || permissions.length > 5) throw new BadRequestException({ status: 400, message: 'o campo "permissions" não pode ter mais do que 4 caracteres.' });
    if(!regex.test(permissions)) throw new BadRequestException({ status: 400, message: 'A permissão não está no formato adequado' });
    return true;
}