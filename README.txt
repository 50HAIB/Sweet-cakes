SWEET CAKES — CAKE ORDERING WEBSITE
==================================

WHAT'S INCLUDED
- Responsive cake storefront with cake photos and category filters
- Cake customizer: half pound, 1 lb, 1.5 lb, 2 lb, 3 lb sizes
- Extra toppings, quantity, message written on cake, special instructions
- Firebase Authentication login/signup
- Firestore order storage and customer order history
- Secure Firestore rules: customer reads only their own orders; no public admin panel
- Cloud Functions: complete order details emailed to msohaib1845@gmail.com, customer order confirmation email, and email when status becomes "ready"
- Payment method selection: COD, Cash, EasyPaisa, JazzCash
- Mobile-friendly CSS media queries

IMPORTANT
This is a project starter, not a live-connected production website. Firebase and email provider credentials must be configured by you. Bakery order emails are set to msohaib1845@gmail.com in functions/index.js. Never put SMTP passwords or service account keys in frontend files.

1) FIREBASE SETUP
- Create a project at https://console.firebase.google.com/
- Add a Web App and copy its config into firebase-config.js
- Enable Authentication > Sign-in method > Email/Password
- Create Firestore Database
- Deploy rules from this folder (see step 3)
- Enable billing/Blaze if required by Cloud Functions and your region/provider.
- Set up authorized domains for your hosted website.

2) RUN THE WEBSITE
Because app.js uses ES modules, do not simply open index.html as a file. Run it on a local web server or deploy to Firebase Hosting.
Quick option if Node.js is installed:
  npx serve .
Then open the local URL shown by the command.

3) DEPLOY FIREBASE BACKEND
Install Node.js and Firebase CLI:
  npm install -g firebase-tools
Sign in:
  firebase login
From this project folder, select your Firebase project:
  firebase use --add
Deploy Firestore rules:
  firebase deploy --only firestore:rules
Install backend dependencies:
  cd functions
  npm install
  cd ..
Deploy functions:
  firebase deploy --only functions

4) CONFIGURE EMAIL
Use an SMTP provider/account suitable for transactional email. For Gmail, use an App Password only if your account is eligible and 2-step verification is enabled; do not use your normal account password.
Bakery order email recipient is already set to msohaib1845@gmail.com in functions/index.js. Set these SMTP secrets:
  firebase functions:secrets:set SMTP_HOST
  firebase functions:secrets:set SMTP_PORT
  firebase functions:secrets:set SMTP_USER
  firebase functions:secrets:set SMTP_PASS
  firebase functions:secrets:set EMAIL_FROM
Then redeploy functions:
  firebase deploy --only functions

6) MARK AN ORDER READY — WITHOUT AN ADMIN PANEL
- Open Firebase Console > Firestore Database > orders.
- Open the order document and change the status field from "pending" to "ready" (lowercase).
- The onOrderReady Cloud Function sends the ready email to the customer's registered email.
- Do not let customers update order status. The provided rules block client updates.
- Keep Firebase Console access private to you/trusted staff only. A future secure staff-only tool can be added if desired, but this build intentionally has no public admin panel.

PAYMENTS
Payment options in the checkout are choices only. This project does not charge or verify EasyPaisa/JazzCash transactions. Confirm digital payment details manually or integrate an approved merchant/payment API before treating an order as paid.

SECURITY / PRODUCTION CHECKLIST
- Review Firestore rules and test them with Firebase Emulator Suite before launch.
- Consider App Check, rate limiting, bot protection, input validation, and order spam controls.
- Configure transactional email SPF/DKIM and provider sender verification.
- Image URLs are remotely hosted example images; replace with your own licensed cake photos for the real bakery.
- Prices and topping charges are sample PKR amounts. Update them in app.js.
- No admin panel is included. Order status is updated privately in Firebase Console.
