## HealthBeats backend test

This project was Build with [koajs](https://github.com/koajs/koa).

## Requirements

- 2-FA code is to be stored in a database, and it should be encrypted.
- 2-FA code should be for single use only. (It will be invalid / expired after single use)
- 2-FA code will expire in 2 minutes. After which user needs to request for a resend of 2-FA code.
- There needs to be at least 10 seconds interval between 2 attempts. An error will be shown to the user enters 2 tries within 10 seconds.
- The account will be locked after 3 failed attempts during the 2-FA.

## How to

   - Clone this project
   - Install mongo DB [From documentation](https://docs.mongodb.com/manual/installation/)
   - Configure database connection inside **/config/server.js**
   - Configure your mail SMTP inside file **config/mail.js**
   - Run `npm install`
   - Then `node app`
   - Done