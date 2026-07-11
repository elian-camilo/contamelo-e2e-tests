import { type APIRequestContext, request as playwrightRequest } from '@playwright/test';
import { getEnvConfig } from '../utils/environment';
import type { DebtDirection } from '../pages/DebtModal';
import type { TrustLevel, Gender } from '../pages/ContactModal';

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
}

export interface ContactPublic {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  trust_level: TrustLevel;
}

export interface DebtPublic {
  id: string;
  amount: number;
  remaining_amount: number;
  is_settled: boolean;
  created_at: string;
}

export interface AbonoPublic {
  id: string;
  debt_id: string;
  amount: number;
  created_at: string;
}

/** Cliente API dedicado a seed/cleanup de datos de prueba. No se usa para las acciones bajo prueba. */
export class ApiClient {
  private context: APIRequestContext;
  private accessToken: string;

  private constructor(context: APIRequestContext, accessToken: string) {
    this.context = context;
    this.accessToken = accessToken;
  }

  static async login(email: string, password: string): Promise<ApiClient> {
    const { apiURL } = getEnvConfig();
    const context = await playwrightRequest.newContext({ baseURL: apiURL });

    // Login es form-encoded (OAuth2PasswordRequestForm), no JSON.
    const response = await context.post('users/login', {
      form: { username: email, password },
    });
    if (!response.ok()) {
      throw new Error(`Login failed: ${response.status()} ${await response.text()}`);
    }
    const token: TokenResponse = await response.json();

    return new ApiClient(context, token.access_token);
  }

  private authHeaders() {
    return { Authorization: `Bearer ${this.accessToken}` };
  }

  async createContact(data: { name: string; phone: string; trustLevel: TrustLevel; gender: Gender }): Promise<ContactPublic> {
    const response = await this.context.post('contacts/', {
      headers: this.authHeaders(),
      data: {
        name: data.name,
        phone: data.phone,
        trust_level: data.trustLevel,
        gender: data.gender,
      },
    });
    if (!response.ok()) {
      throw new Error(`createContact failed: ${response.status()} ${await response.text()}`);
    }
    return response.json();
  }

  async createDebt(data: {
    contactId: string;
    contactName: string;
    amount: number;
    direction: DebtDirection;
    description: string;
    dueDate: Date;
  }): Promise<DebtPublic> {
    const response = await this.context.post('debts/', {
      headers: this.authHeaders(),
      data: {
        contact_id: data.contactId,
        contact_name: data.contactName,
        amount: data.amount,
        debt_direction: data.direction,
        description: data.description,
        due_date: data.dueDate.toISOString(),
      },
    });
    if (!response.ok()) {
      throw new Error(`createDebt failed: ${response.status()} ${await response.text()}`);
    }
    return response.json();
  }

  async createAbono(data: { debtId: string; amount: number }): Promise<AbonoPublic> {
    const response = await this.context.post('abonos/', {
      headers: this.authHeaders(),
      data: {
        debt_id: data.debtId,
        amount: data.amount,
      },
    });
    if (!response.ok()) {
      throw new Error(`createAbono failed: ${response.status()} ${await response.text()}`);
    }
    return response.json();
  }

  async listContacts(): Promise<ContactPublic[]> {
    const response = await this.context.get('contacts/', {
      headers: this.authHeaders(),
    });
    if (!response.ok()) {
      throw new Error(`listContacts failed: ${response.status()} ${await response.text()}`);
    }
    return response.json();
  }

  async deleteContact(contactId: string): Promise<void> {
    const response = await this.context.delete(`contacts/${contactId}`, {
      headers: this.authHeaders(),
    });
    if (!response.ok()) {
      throw new Error(`deleteContact failed: ${response.status()} ${await response.text()}`);
    }
  }

  async dispose() {
    await this.context.dispose();
  }
}
