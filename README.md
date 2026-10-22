# Personal Vault — Supabase Ready

This React/Vite app is wired to the existing Supabase project. The frontend uses the Supabase **publishable key** only; never put a secret/service-role key in this project.

## 1. Connect the app

Create a `.env` file in the project root (do not commit it):

```env
VITE_SUPABASE_URL=https://fmlehgsfgjqcbquwhccj.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```

Get the publishable key from the Supabase Dashboard **Connect** dialog or **Settings → API Keys → Publishable key**. Supabase currently recommends the publishable key for browser apps.

Then run:

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

The Vite app runs on port `3000` in this project.

## 2. Existing Supabase project

Project ref: `fmlehgsfgjqcbquwhccj`

The existing database schema is used as-is. The app does not recreate or reset the database. It uses:

- `vault_items` — links, videos, notes, files and visibility
- `profiles` — member status
- `admin_users` — administrator access
- `item_permissions` — private-item member access
- `share_links` — unlisted secure links, expiry and revocation
- `activity_logs` — audit trail
- private Storage bucket `vault-files` — uploaded files

## 3. Admin setup

Do not put an admin password in source code. Create the administrator through Supabase Auth, then add that user's UUID to the existing `admin_users` table using your existing admin/bootstrap mechanism.

There is currently no admin user in the connected project.

## 4. Branding

Put these two image files in `public/`:

```text
public/Logo.png
public/Tab_Logo.png
```

`Logo.png` is used for visible website branding. `Tab_Logo.png` is used only for the browser favicon/tab.

## 5. Security model

Keep RLS enabled. The browser must use only the publishable key. Access to public/private/unlisted content and private files must be enforced by Supabase RLS/Storage policies, not just by hiding UI.

No database reset or schema recreation is required for this project.
