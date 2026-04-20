Patched Agri-Invest AI source

Frontend changes included:
- original UI kept
- farmer profile/wallet/my projects/soil pH pages added
- investor profile/wallet/my projects/payments/returns pages added
- agri-partner available projects/assigned work/profile/wallet pages added
- admin dashboard simplified with project approvals and partner request review
- back buttons added
- contact info updated to thrishaanju2@gmail.com and 8951441328
- dashboard cards start from real stored values instead of fake hardcoded values
- role-based routing tightened

Run:
Frontend:
  npm install
  npm run dev

Backend:
  mvn spring-boot:run

Admin demo login:
  username: admin
  password: admin123
