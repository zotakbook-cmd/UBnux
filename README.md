# ZilaBiz

ZilaBiz is a district-based local business marketplace.

## Features

- Local business discovery
- District filtering
- Category filtering
- Business search
- Business profiles
- Product support
- Service support
- Enquiries
- Appointments
- Orders
- Browser caching
- API pagination
- Responsive design

## Architecture

GitHub
↓
Cloudflare Pages
↓
Apps Script API
↓
Apps Script CacheService
↓
Google Sheets

## Frontend

The frontend is static HTML, CSS and JavaScript.

No database credentials should be stored in the frontend.

## Configuration

Open:

`js/config.js`

Set:

`API_URL`

to the deployed Google Apps Script Web App URL.

## Deployment

This repository can be connected directly to Cloudflare Pages.

Build command:

None

Build output directory:

`/`

The website is a static frontend.

## Backend

The backend runs separately using Google Apps Script.

The Google Sheets database is not exposed directly to the browser.

## Important

Never put:

- Google service account credentials
- Private API keys
- Admin passwords
- Database passwords
- Secret tokens

inside frontend files.