import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, scryptSync } from 'crypto';
import { Roles } from './roles';

@Injectable()
export class TokenService {
  private password = 'secret key';
  private iv = Buffer.from([
    112, 198, 32, 157, 182, 206, 232, 23, 156, 221, 17, 59, 19, 184, 100, 112,
  ]);

  private key = scryptSync(this.password, 'salt', 32);

  async create({
    exp,
    workspaceName,
    roles,
  }: {
    workspaceName: string;
    exp?: number;
    roles?: string[];
  }): Promise<string> {
    const cipher = createCipheriv('aes-256-ctr', this.key, this.iv);

    const textToEncrypt = JSON.stringify({
      workspace: workspaceName,
      exp,
      roles,
    });

    const encryptedText = Buffer.concat([
      cipher.update(textToEncrypt),
      cipher.final(),
    ]);

    return encryptedText.toString('base64');
  }

  async validateToken(
    token: string,
    includesRoles: Roles[] = []
  ): Promise<boolean> {
    const decipher = createDecipheriv('aes-256-ctr', this.key, this.iv);

    const decryptedText = Buffer.concat([
      decipher.update(token, 'base64'),
      decipher.final(),
    ]).toString();

    try {
      const { exp, roles = [] } = JSON.parse(decryptedText);

      if (exp && exp < Date.now()) {
        return false;
      }

      if (includesRoles.length) {
        return !!includesRoles.find((role) => roles.includes(role));
      }

      return true;
    } catch (e) {
      return false;
    }
  }
}
