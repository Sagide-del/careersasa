import axios from "axios";

function baseUrl() {
  const env = (process.env.MPESA_ENV || "sandbox").toLowerCase();
  return env === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";
}

export async function getAccessToken(): Promise<string> {
  const key = process.env.MPESA_CONSUMER_KEY || "";
  const secret = process.env.MPESA_CONSUMER_SECRET || "";
  if (!key || !secret) throw new Error("MPESA_CONSUMER_KEY/SECRET missing");

  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const res = await axios.get(`${baseUrl()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  return res.data.access_token;
}

export function mpesaPassword(timestamp: string) {
  const shortcode = process.env.MPESA_SHORTCODE || "";
  const passkey = process.env.MPESA_PASSKEY || "";
  const raw = `${shortcode}${passkey}${timestamp}`;
  return Buffer.from(raw).toString("base64");
}

export async function stkPush(opts: { phone: string; amount: number; accountRef: string; desc: string }) {
  const token = await getAccessToken();
  const shortcode = process.env.MPESA_SHORTCODE || "";
  const callback = process.env.MPESA_CALLBACK_URL || "";
  if (!shortcode || !callback) throw new Error("MPESA_SHORTCODE or MPESA_CALLBACK_URL missing");

  const timestamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const password = mpesaPassword(timestamp);

  const body = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: opts.amount,
    PartyA: opts.phone,
    PartyB: shortcode,
    PhoneNumber: opts.phone,
    CallBackURL: callback,
    AccountReference: opts.accountRef,
    TransactionDesc: opts.desc,
  };

  const res = await axios.post(`${baseUrl()}/mpesa/stkpush/v1/processrequest`, body, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return res.data;
}
