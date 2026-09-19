# Kolagalam SEO Launch & Custom Domain Migration Checklist

This document provides step-by-step instructions for launching Kolagalam (கோலாகலம்) on Google Search Console, configuring Vercel environment variables, transitioning to a custom domain (e.g. `kolagalam.in`) with zero lost rankings and zero duplicate content, setting up Google Business Profile & social profiles, building foundational citations, and maintaining the target keyword map.

---

## 1. Google Search Console Setup & Verification

### Step 1: Add Property to Search Console
1. Log in to [Google Search Console](https://search.google.com/search-console).
2. Choose your property type:
   - **During Preview / Current Staging (`dancrackers.vercel.app`)**: Use the **URL prefix** property type: `https://dancrackers.vercel.app/`.
   - **When Custom Domain is Live (`kolagalam.in`)**: Use the **Domain** property type: `kolagalam.in` (this covers all subdomains and http/https protocols).

### Step 2: Site Verification
- **Method A: HTML Tag (Recommended for Vercel)**:
  1. In GSC, select **Settings → Ownership Verification → HTML tag**.
  2. Copy the token inside `content="..."` (e.g., `content="abc123xyz..."`).
  3. In your Vercel project dashboard, set the environment variable:
     ```bash
     NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION="abc123xyz..."
     ```
  4. Redeploy the application.
  5. Return to GSC and click **Verify**.

- **Method B: DNS TXT Record (For custom domain)**:
  1. If using the Domain property in GSC, copy the `google-site-verification=...` TXT record.
  2. Add the TXT record in your DNS provider (e.g., Cloudflare, Namecheap, GoDaddy).
  3. Click **Verify** in GSC.

### Step 3: Submit the Sitemap
1. Navigate to **Sitemaps** in the left menu.
2. Enter `sitemap.xml` in the **Add a new sitemap** input field.
3. Click **Submit**.
4. Confirm status displays **Success** with detected URLs (~200 pages including products and categories).

### Step 4: Ongoing Monitoring Schedule
- **Day 1**:
  - Use the **URL Inspection** tool on `https://<site>/` and one product page (`/product/<slug>`).
  - Click **Test Live URL** to confirm Googlebot can fetch the page and render the title, meta description, and JSON-LD structured data.
  - Click **Request Indexing** for the homepage.
- **Week 1**:
  - Check **Pages → Indexing** to ensure no valid pages are reported as "Duplicate without user-selected canonical" or "Blocked by robots.txt".
  - Verify that `/cart` and `/enquiry` are correctly excluded from the index.
- **Month 1**:
  - Review the **Performance** report for search queries containing "Kolagalam", "கோலாகலம்", "Sivakasi crackers price list", and click-through rates.

---

## 2. Vercel Environment Variables Configuration

Set these variables in the **Vercel Dashboard → Project Settings → Environment Variables**:

| Variable Name | Production Value (Current) | Production Value (Custom Domain) | Target Environments |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SITE_URL` | `https://dancrackers.vercel.app` | `https://kolagalam.in` | Production, Preview |
| `NEXT_PUBLIC_CANONICAL_HOST` | *(leave blank)* | `kolagalam.in` | Production |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | *(token from GSC)* | *(token from GSC)* | Production |
| `NEXT_PUBLIC_BING_SITE_VERIFICATION` | *(token from Bing)* | *(token from Bing)* | Production |

> [!NOTE]
> `NEXT_PUBLIC_CANONICAL_HOST` activates an automated 308 permanent redirect in `next.config.ts` for all requests hitting secondary domains (like `dancrackers.vercel.app` or `www.kolagalam.in`), routing them immediately to the canonical host.

---

## 3. Custom Domain Migration Playbook (Zero-Downtime & Zero Ranking Loss)

When the custom domain (e.g. `kolagalam.in`) is purchased:

1. **Add Domain in Vercel**:
   - Go to **Vercel Project Settings → Domains**.
   - Add `kolagalam.in` and `www.kolagalam.in`.
   - Configure DNS records per Vercel's instructions:
     - `A` record for `@` pointing to `76.76.21.21`
     - `CNAME` for `www` pointing to `cname.vercel-dns.com`
   - Wait until SSL certificates show green checkmarks in Vercel.

2. **Update Environment Variables**:
   - Change `NEXT_PUBLIC_SITE_URL` to `https://kolagalam.in`.
   - Set `NEXT_PUBLIC_CANONICAL_HOST` to `kolagalam.in`.
   - Trigger a new production deployment:
     ```bash
     git commit --allow-empty -m "chore: trigger deployment with custom domain env vars"
     git push origin main
     ```

3. **Verify 308 Permanent Redirects**:
   - Run `curl -I https://dancrackers.vercel.app/`
   - Verify that HTTP status is `308 Permanent Redirect` with `location: https://kolagalam.in/`.
   - Run `curl -I https://dancrackers.vercel.app/products`
   - Verify redirection to `https://kolagalam.in/products`.

4. **Google Search Console "Change of Address"**:
   - In GSC, open the old property (`dancrackers.vercel.app`).
   - Go to **Settings → Change of address**.
   - Select the newly verified property (`kolagalam.in`).
   - Run validation and confirm the transfer.
   - Submit `https://kolagalam.in/sitemap.xml` in the new GSC property.

---

## 4. Google Business Profile (GBP) Profile Copy

Use this copy to create or claim the Google Business Profile:

- **Business Name**: `Kolagalam Sivakasi Crackers (கோலாகலம் பட்டாசு)`
- **Primary Category**: `Fireworks store` or `Wholesale firework supplier`
- **Secondary Category**: `Distribution service`
- **Address**: `Avudiyapuram, Virudhunagar District, Tamil Nadu 626204`
- **Service Areas**: Chennai, Coimbatore, Madurai, Salem, Tiruchirappalli, Tirunelveli, Erode, Vellore, Thanjavur, and all Tamil Nadu districts.
- **Phone Number**: `+91 82483 65737`
- **Website**: `https://kolagalam.in` (or `https://dancrackers.vercel.app`)

### Description (English)
> Kolagalam (கோலாகலம்) is a trusted Diwali crackers order enquiry facilitator based in Virudhunagar district, Tamil Nadu. We connect families, bulk buyers, and businesses directly with authentic, quality-tested fireworks manufactured by licensed Sivakasi factories. Browse our 2026 price list online with photos and Tamil names, select your products to build your enquiry, and our team will call within 2 hours to confirm your order details and direct supplier dispatch. Enjoy honest prices, door delivery across Tamil Nadu, and dedicated customer support.

### Description (Tamil)
> கோலாகலம் (Kolagalam) — சிவகாசி பட்டாசு ஆர்டர் மற்றும் விலைப்பட்டியல் சேவை. சிவகாசியில் உள்ள உரிமம் பெற்ற முன்னணி தொழிற்சாலைகளிலிருந்து தரமான மற்றும் பாதுகாப்பான பட்டாசுகளை உங்கள் இல்லத்திற்கே நேரடியாகப் பெற உதவுகிறோம். எங்கள் இணையதளத்தில் தீபாவளி 2026-க்கான முழு விலைப்பட்டியலை புகைப்படங்களுடன் பார்த்து, உங்கள் பட்டாசுப் பட்டியலை எளிதாகத் தேர்ந்தெடுக்கலாம். கட்டணம் எதுவும் இணையதளத்தில் வசூலிக்கப்படுவதில்லை; உங்கள் பட்டியலை அனுப்பிய 2 மணி நேரத்தில் எங்கள் குழுவினர் உங்களை அழைத்து ஆர்டரை உறுதிசெய்வார்கள்.

### 10 Recommended Photos to Upload
1. **Brand Identity**: Kolagalam high-resolution logo mark and banner.
2. **Ground Chakkars**: Packaging box of Deluxe / Special Ground Chakkars showing Sivakasi manufacturer stamp.
3. **Flower Pots**: Assorted flower pots (Asoka, Colour Koti) display packaging.
4. **Sparklers**: 10cm, 15cm, and 30cm colour and electric sparkler boxes.
5. **Aerial Sky Shots**: 12-shot and multi-colour aerial repeater display boxes.
6. **Festival Combo Pack**: Neatly packed family gift box with varieties displayed.
7. **Quality & Packaging**: Professional packaging showing safety warning stickers and tamper-proof packing.
8. **Direct Dispatch**: Parcel boxes staged for delivery with transport consignment stickers.
9. **Safety Guidelines**: Tamil and English safety instruction chart card included with parcels.
10. **Customer Support Desk**: Friendly customer service representative team on phones assisting customers.

---

## 5. Social Profiles Ready-to-Paste Bios

### Instagram (`@kolagalam.in` or `@kolagalam_crackers`)
- **Name**: `Kolagalam | சிவகாசி பட்டாசு`
- **Bio**:
  ✨ Authentic Sivakasi Crackers direct to your doorstep.
  🧨 Diwali 2026 Price List & Enquiries.
  📞 We call you to confirm • Direct supplier dispatch.
  📍 Sivakasi / Virudhunagar • Delivery across TN.
  👇 View Full Catalogue & Prices:
  [https://kolagalam.in]

### Facebook Page
- **Name**: `Kolagalam Sivakasi Crackers - கோலாகலம் பட்டாசு`
- **About**:
  Kolagalam facilitates authentic Sivakasi firecracker order enquiries for Diwali 2026. Browse our transparent price list online with photos, Tamil names, and family gift boxes. No online payments; our team calls within 2 hours to verify details and arrange direct dispatch from licensed Sivakasi manufacturers across Tamil Nadu. Call or WhatsApp: +91 82483 65737.

### YouTube Channel
- **Channel Name**: `Kolagalam Crackers`
- **Channel Description**:
  Welcome to Kolagalam (கோலாகலம்)! Watch fireworks demonstrations, testing videos, Diwali combo pack unboxings, and cracker safety guides straight from Sivakasi. Browse our 2026 price list and send your enquiry at https://kolagalam.in or WhatsApp us at +91 82483 65737.

> [!TIP]
> Once social profile handles are finalized, paste their URLs into `brandConfig.contact.social` in `config/brandConfig.ts` (`instagram`, `facebook`, `youtube`). They will automatically be included in Schema.org `sameAs` structured data on the homepage.

---

## 6. Ten Foundational Backlinks & Free Citations

1. **Google Business Profile (Maps)**: Claim profile and add link to canonical homepage.
2. **IndiaMART Listing**: Register as an enquiry facilitator / supplier for Sivakasi Crackers with website link.
3. **TradeIndia Listing**: Create business listing under fireworks order facilitators in Virudhunagar / Sivakasi.
4. **Justdial Listing**: List under Fireworks Retailers / Facilitators in Virudhunagar District with address and phone.
5. **Sulekha Business**: Submit listing in Tamil Nadu business directory under Diwali Crackers / Fireworks.
6. **Virudhunagar & Sivakasi Business Directory**: Local district commerce listings and community business portals.
7. **WhatsApp Channel**: Create an official verified WhatsApp Channel "Kolagalam Crackers" with link in bio and updates.
8. **YouTube Channel Bio & Video Links**: Add canonical website link in channel header and every video description.
9. **Facebook Business Page**: Profile link, call-to-action button linking to `/products`.
10. **Instagram Link in Bio**: Link to canonical site with UTM parameters (e.g. `?utm_source=instagram`).

---

## 7. Target Keyword Map (English & Tamil)

*Note: All Tamil terms should be reviewed by a native speaker to ensure regional Tamil Nadu dialect alignment.*

| Page URL | Primary English Keyword | Secondary English Keywords | Primary Tamil Keyword | Secondary Tamil Keywords |
| :--- | :--- | :--- | :--- | :--- |
| `/` | Kolagalam Sivakasi crackers | Sivakasi crackers price list 2026, authentic crackers direct from Sivakasi | கோலாகலம் பட்டாசு | சிவகாசி பட்டாசு விலை பட்டியல், தீபாவளி பட்டாசு ஆர்டர் |
| `/products` | Sivakasi crackers price list | buy crackers online Sivakasi, Diwali crackers catalogue, crackers rate 2026 | சிவகாசி பட்டாசு விலை | பட்டாசு வகைகள், தீபாவளி பட்டாசு விலை பட்டியல் 2026 |
| `/products/ground-chakkars` | ground chakkars price list | Sivakasi chakkar wheel, deluxe spinning chakkars | தரை சக்கரம் | சிவகாசி சக்கரம் விலை, ஸ்பெஷல் தரை சக்கரம் |
| `/products/sparklers` | sparklers crackers Sivakasi | colour sparklers, electric sparklers 15cm 30cm | கம்பி மத்தாப்பு | கலர் கம்பி மத்தாப்பு, சிவகாசி மத்தாப்பு விலை |
| `/products/flower-pots` | flower pots crackers | colour koti flower pot, Sivakasi anar fireworks | பூந்தொட்டி பட்டாசு | கலர் பூந்தொட்டி, சிவகாசி பூந்தொட்டி விலை பட்டியல் |
| `/products/aerial-shots` | aerial sky shots fireworks | multi shot repeaters, 12 shot sky shots Sivakasi | வானவெடி பட்டாசு | சிவகாசி வானவெடி விலை, கலர் ஸ்கை ஷாட்ஸ் |
| `/product/[slug]` | [Product Name] Sivakasi price | [Product Name] rate per box, order [Product Name] | [தமிழ் பெயர்] பட்டாசு | [தமிழ் பெயர்] விலை, சிவகாசி [தமிழ் பெயர்] |
| `/how-it-works` | how to order Sivakasi crackers | cracker booking enquiry process, direct supplier payment | பட்டாசு ஆர்டர் செய்வது எப்படி | பட்டாசு வாங்குவது எப்படி, சிவகாசி ஆர்டர் முறை |
| `/safety` | firecracker safety instructions | Diwali fireworks safety tips, crackers handling guidelines | பட்டாசு பாதுகாப்பு முறைகள் | தீபாவளி பட்டாசு பாதுகாப்பு விதிகள், குழந்தைகள் பட்டாசு பாதுகாப்பு |
| `/about` | about Kolagalam crackers | Sivakasi crackers order facilitator, authentic Tamil Nadu fireworks | கோலாகலம் பற்றி | சிவகாசி பட்டாசு விநியோகஸ்தர், தரமான பட்டாசுகள் |
| `/contact` | contact Kolagalam | Sivakasi crackers WhatsApp number, cracker enquiry phone | கோலாகலம் தொடர்பு | சிவகாசி பட்டாசு வாட்ஸ்அப் எண், தொடர்பு முகவரி |
| `/faq` | Sivakasi crackers ordering FAQ | cracker booking enquiry questions, fireworks delivery Tamil Nadu | பட்டாசு சந்தேகங்கள் கேள்வி பதில் | சிவகாசி பட்டாசு டெலிவரி விவரங்கள் |
| `/compliance` | firecrackers legal compliance | explosives act fireworks facilitator, Supreme Court firecracker guidelines | சட்டப்பூர்வ அறிவிப்பு | பட்டாசு விற்பனை விதிகள், வெடிபொருட்கள் சட்டம் |

---

## 8. Summary of Brand & Verification Constraints

- **Compliance Rules**: Always maintain the facilitator model. Never state or imply direct online checkouts or payment processing on this site.
- **Structured Data Rules**: Do NOT introduce `offers`, `aggregateRating`, or `review` into the schema unless official third-party audited review feeds and direct checkout exist.
- **Tagline**: `"Authentic Sivakasi Crackers Direct To Your Doorstep"`
- **Titles & Descriptions**: Ensure all static titles remain $\le 60$ characters and all descriptions $\le 155$ characters.
