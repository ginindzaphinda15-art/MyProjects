const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const BASE_URL = process.env.MOMO_BASE_URL;
const SUBSCRIPTION_KEY = process.env.MOMO_SUBSCRIPTION_KEY;
const API_USER = process.env.MOMO_API_USER;
const API_KEY = process.env.MOMO_API_KEY;
const TARGET_ENV = process.env.MOMO_TARGET_ENVIRONMENT || 'sandbox';
const CALLBACK_URL = process.env.MOMO_CALLBACK_URL;
const CURRENCY = process.env.MOMO_CURRENCY || 'SZL';

let cachedToken = null;
let tokenExpiresAt = 0;

/**
 * Gets a short-lived OAuth access token from the MoMo Collections API,
 * caching it until shortly before it expires.
 */
async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  const credentials = Buffer.from(`${API_USER}:${API_KEY}`).toString('base64');

  const { data } = await axios.post(
    `${BASE_URL}/collection/token/`,
    {},
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
      },
    }
  );

  cachedToken = data.access_token;
  // Refresh a minute before actual expiry to be safe.
  tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
  return cachedToken;
}

/**
 * Normalizes an Eswatini mobile number to the MSISDN format MoMo expects (268XXXXXXXX).
 */
function normalizeMsisdn(phone) {
  const digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('268')) return digits;
  return `268${digits}`;
}

/**
 * Kicks off a "Request to Pay" — the customer gets a prompt on their phone
 * to approve the charge. Returns MoMo's referenceId, which is used to poll status.
 */
async function requestToPay({ amount, phone, description }) {
  const token = await getAccessToken();
  const referenceId = uuidv4();

  await axios.post(
    `${BASE_URL}/collection/v1_0/requesttopay`,
    {
      amount: String(amount),
      currency: CURRENCY,
      externalId: referenceId,
      payer: {
        partyIdType: 'MSISDN',
        partyId: normalizeMsisdn(phone),
      },
      payerMessage: description || 'Payment to eSebeLink vendor',
      payeeNote: description || 'Marketplace payment',
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Reference-Id': referenceId,
        'X-Target-Environment': TARGET_ENV,
        'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
        'Content-Type': 'application/json',
        'X-Callback-Url': CALLBACK_URL,
      },
    }
  );

  return { referenceId, status: 'PENDING' };
}

/**
 * Polls MoMo for the status of a previously-initiated request to pay.
 * Status is one of: PENDING, SUCCESSFUL, FAILED.
 */
async function getPaymentStatus(referenceId) {
  const token = await getAccessToken();

  const { data } = await axios.get(
    `${BASE_URL}/collection/v1_0/requesttopay/${referenceId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Target-Environment': TARGET_ENV,
        'Ocp-Apim-Subscription-Key': SUBSCRIPTION_KEY,
      },
    }
  );

  return data; // { status, amount, currency, payer, financialTransactionId, ... }
}

module.exports = { requestToPay, getPaymentStatus, normalizeMsisdn };
