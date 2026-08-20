# KadeNetwork — Architecture & Page Documentation

**KadeNetwork** is an inter-shop inventory exchange platform designed for local retail clusters in Sri Lanka (e.g., Unity Plaza, Majestic City, Liberty Plaza, Pettah Market). It allows merchants to find neighboring stock instantly, maintain profit margins with B2B trade pricing, and never lose a walk-in customer.

---

## 📁 Project Structure & Page Overview

```text
KadeNetwork/
├── app/
│   ├── components/
│   │   └── LocationPickerModal.tsx   # Google Maps Modal with Places Search & Draggable Pin
│   ├── login/
│   │   └── page.tsx                  # Merchant Sign In Portal
│   ├── register/
│   │   └── page.tsx                  # Full Shop Onboarding & Verification Page
│   ├── globals.css                   # Global Tailwind CSS Styles
│   ├── layout.tsx                    # Root Layout (Sticky Navigation, Branding, Footer)
│   └── page.tsx                      # Landing / Home Page
├── .env.local                        # Local Environment Variables (API Keys)
├── package.json                      # Dependencies & Scripts
├── tsconfig.json                     # TypeScript Configuration
└── README.md                         # Project Readme
```

---

## 📄 Detailed Breakdown of Pages & Components

### 1. Root Layout ([app/layout.tsx](file:///Users/sachini/Desktop/Nisal/Projects/KadeNetwork/app/layout.tsx))
* **Purpose**: Serves as the overarching shell for the entire Next.js application.
* **Key Features**:
  * **Global SEO Metadata**: Configures the title (`KadeNetwork | Inter-Shop Inventory Exchange`) and meta descriptions.
  * **Sticky Header Navigation**: Displays the KadeNetwork logo and quick navigation buttons (`Shop Login` and `Register Shop`).
  * **Global Footer**: Displays copyright and regional context.

---

### 2. Home / Landing Page ([app/page.tsx](file:///Users/sachini/Desktop/Nisal/Projects/KadeNetwork/app/page.tsx))
* **Purpose**: Explains the platform's value proposition to visiting shop owners.
* **Key Features**:
  * **Hero Section**: Sri Lankan merchant badge and primary call-to-action buttons.
  * **Direct Routing**:
    * **"Register Your Shop"** button routes directly to `/register`.
    * **"Existing Merchant Login"** button routes directly to `/login`.
  * **Feature Highlights Grid**:
    1. *Hyper-Local Radius Search* (Search within 500m, 1km, or specific floors).
    2. *Trade Pricing (B2B)* (Peer-to-peer trade prices to preserve margins).
    3. *Direct Click-to-Call* (Instant one-tap dialing for quick stock confirmations).

---

### 3. Merchant Sign In Page ([app/login/page.tsx](file:///Users/sachini/Desktop/Nisal/Projects/KadeNetwork/app/login/page.tsx))
* **Purpose**: Authentication portal for registered shop owners.
* **Key Features**:
  * Clean credentials form (Email + Password).
  * Direct redirect link to the full registration page for new merchants (`Don't have an account yet? Register your shop`).
  * Built-in hook for future Supabase Auth integration (`signInWithPassword`).

---

### 4. Shop Registration & Onboarding ([app/register/page.tsx](file:///Users/sachini/Desktop/Nisal/Projects/KadeNetwork/app/register/page.tsx))
* **Purpose**: Multi-step business registration and anti-fraud verification portal.
* **Key Sections**:
  1. **Shop Information**:
     * Shop Name and Owner/Manager Name.
     * Store Address / Physical Location.
     * **Google Maps Integration**: Trigger button for the interactive location picker modal.
     * Visual Confirmation badge showing pinned `Latitude` and `Longitude`.
  2. **Contact Numbers & Mobile Verification**:
     * Primary Contact No with **SMS OTP verification** (Mock code: `123456`).
     * Optional Secondary Contact No.
  3. **Credentials & Email Verification**:
     * Email address with **Email OTP verification** (Mock code: `654321`).
     * Account Password (minimum 8 characters).
  4. **Guard Clause**:
     * The `Complete Registration` button is automatically disabled until **both** mobile and email channels are verified.

---

### 5. Interactive Google Map Modal ([app/components/LocationPickerModal.tsx](file:///Users/sachini/Desktop/Nisal/Projects/KadeNetwork/app/components/LocationPickerModal.tsx))
* **Purpose**: Provides high-precision geolocation and address autocomplete for Sri Lankan shopping malls and streets.
* **Key Features**:
  * **Google Places Autocomplete**: Real-time search bar with suggestions restricted to Sri Lanka (`country: 'lk'`).
  * **Interactive Draggable Pin**: Allows merchants to drag the marker directly to their exact shop entrance or stall.
  * **Reverse Geocoding**: Automatically converts GPS coordinates to readable street addresses.
  * **"My Location" Button**: Uses HTML5 Geolocation to jump the map to the merchant's current position.
  * **API Key Safety Notice**: Displays a friendly guide banner if `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is missing in `.env.local`.

---

## ⚙️ Environment Variables & Setup

Create or edit your `.env.local` file in the root directory:

```env
# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### Required Google Cloud APIs:
Ensure the following APIs are enabled in your [Google Cloud Console](https://console.cloud.google.com/):
1. **Maps JavaScript API** (For rendering the map & marker)
2. **Places API (New)** (For place search & autocomplete)
3. **Geocoding API** (For converting coordinates to street addresses)

---

## 🛠️ Verification & Testing Commands

To test and build the project locally:

```bash
# Run the development server
npm run dev

# Check for TypeScript errors
npx tsc --noEmit

# Run ESLint check
npm run lint
```
