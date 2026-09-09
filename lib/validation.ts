import { z } from "zod";

/**
 * Shared validation (PRD §16.4). One Zod schema, imported by the client
 * form and the server route handler — client validation is a courtesy,
 * server validation is authoritative.
 */

/** Strips spaces, hyphens, a leading +91 or a leading 0, per §16.4. */
export function normalizePhone(raw: string): string {
  let s = raw.trim().replace(/[\s-]/g, "");
  if (s.startsWith("+91")) s = s.slice(3);
  else if (s.startsWith("91") && s.length === 12) s = s.slice(2);
  else if (s.startsWith("0")) s = s.slice(1);
  return s;
}

const phoneRegex = /^[6-9]\d{9}$/;

export const phoneSchema = z
  .string()
  .transform(normalizePhone)
  .refine((v) => phoneRegex.test(v), {
    message: "Enter a 10-digit mobile number",
  });

export const pincodeSchema = z
  .string()
  .trim()
  .refine((v) => /^\d{6}$/.test(v), { message: "Enter a 6-digit pincode" });

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Please enter your name")
  .max(60, "Please enter your name");

export const addressSchema = z
  .string()
  .trim()
  .min(10, "Please enter your full address")
  .max(200, "Please enter your full address");

export const citySchema = z.string().trim().min(2, "Please enter your city").max(40);

export const emailSchema = z
  .string()
  .trim()
  .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
    message: "Please check this email address",
  })
  .optional();

export const notesSchema = z.string().max(500).optional();

export const preferredCallTimeSchema = z
  .enum(["anytime", "morning", "afternoon", "evening"])
  .optional();

export const enquiryCustomerSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  whatsapp: phoneSchema.optional().or(z.literal("").transform(() => undefined)),
  email: emailSchema,
  address: addressSchema,
  apartment: z.string().trim().max(100).optional(),
  city: citySchema,
  pincode: pincodeSchema,
  landmark: z.string().trim().max(100).optional(),
  preferredCallTime: preferredCallTimeSchema,
  notes: notesSchema,
});

export const enquiryItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1),
});

export const enquirySchema = z.object({
  customer: enquiryCustomerSchema,
  items: z.array(enquiryItemSchema).min(1),
  captainCode: z
    .string()
    .trim()
    .toUpperCase()
    .optional()
    .transform((v) => (v ? v : undefined)),
  // Honeypot (§30.2): a hidden field named 'company'. Any non-empty value is a bot.
  company: z.string().max(0).optional(),
  meta: z
    .object({
      sourceUrl: z.string().optional(),
      formRenderedAt: z.number().optional(),
    })
    .optional(),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;
export type EnquiryCustomerInput = z.infer<typeof enquiryCustomerSchema>;
