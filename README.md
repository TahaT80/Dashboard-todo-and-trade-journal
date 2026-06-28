# TahaEth Pro Dashboard

داشبورد شخصی مدیریت روزانه — ترید، باشگاه، تغذیه، AI و ژورنال.

## امکانات

- 📊 **نمای کلی** — ردیابی هفتگی، نمودار تکمیل، توزیع فعالیت، استریک‌ها
- 📅 **برنامه روزانه** — بلاک‌های زمانی با قابلیت ویرایش، حالت استراحت
- 🥗 **تغذیه** — برنامه غذایی باشگاه و استراحت با ماکروها
- 📝 **ژورنال** — یادداشت روزانه، چک‌لیست، حال روز
- 📈 **ترید** — ثبت معاملات، آمار وین ریت، نمودار PnL، هیت‌مپ، عملکرد سشن
- 🌗 **تم تاریک و روشن**
- 📱 **ریسپانسیو** — مناسب گوشی و دسکتاپ
- 🔄 **تقویم شمسی**
- 📤 **خروجی JSON و CSV**

## نصب سریع

```bash
git clone https://github.com/TahaT80/Dashboard-todo-and-trade-journal.git
cd Dashboard-todo-and-trade-journal
npm install
npm start
```

برنامه روی `http://localhost:3000` اجرا میشه.

## تکنولوژی‌ها

- **Backend:** Node.js + Express + SQLite (sql.js)
- **Frontend:** HTML/CSS/JS (Vanilla SPA)
- **Auth:** JWT + bcrypt
- **Font:** Vazirmatn + JetBrains Mono

## ساختار پروژه

```
├── server.js          # سرور Express + SQLite
├── package.json       # پکیج‌ها
├── public/
│   └── index.html     # فرانت‌اند (SPA)
├── .gitignore
└── README.md
```

---

# 🚀 راهنمای نصب روی سرور لینوکس

## پیش‌نیازها
- سرور لینوکس (Ubuntu 20.04+ / Debian 11+)
- دسترسی root یا sudo
- دامنه (اختیاری ولی پیشنهادی)

---

## مرحله ۱: نصب Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

node -v
npm -v
```

---

## مرحله ۲: آپلود فایل‌ها

```bash
sudo mkdir -p /var/www/tahaeth
sudo chown $USER:$USER /var/www/tahaeth

# روش ۱: با scp
scp -r /path/to/web/* user@server-ip:/var/www/tahaeth/

# روش ۲: با git
cd /var/www/tahaeth
git clone https://github.com/TahaT80/Dashboard-todo-and-trade-journal.git .

# روش ۳: آپلود دستی با FileZilla یا WinSCP
```

---

## مرحله ۳: نصب پکیج‌ها

```bash
cd /var/www/tahaeth
npm install
```

---

## مرحله ۴: تنظیم متغیرهای محیطی

```bash
nano /var/www/tahaeth/.env
```

محتوای فایل:
```env
PORT=3000
JWT_SECRET=یک-رمز-طولانی-و-تصادفی-اینجا-بنویس
```

> حتماً یک رمز قوی و تصادفی برای `JWT_SECRET` انتخاب کن.

---

## مرحله ۵: تست اجرای برنامه

```bash
cd /var/www/tahaeth
node server.js
```

اگه پیام `🚀 TahaEth Pro running on http://localhost:3000` رو دیدی، یعنی درسته.

---

## مرحله ۶: راه‌اندازی با PM2

```bash
sudo npm install -g pm2

cd /var/www/tahaeth
pm2 start server.js --name tahaeth

pm2 startup
pm2 save

# دستورات مفید
pm2 status
pm2 logs tahaeth
pm2 restart tahaeth
```

---

## مرحله ۷: نصب Nginx

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/tahaeth
```

محتوا:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/tahaeth /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## مرحله ۸: تنظیم فایروال

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## مرحله ۹: SSL رایگان با Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
sudo certbot renew --dry-run
```

---

## مرحله ۱۰: بکاپ دیتابیس

```bash
mkdir -p /var/www/tahaeth/backups

# بکاپ دستی
cp /var/www/tahaeth/data.db /var/www/tahaeth/data.db.backup-$(date +%Y%m%d)

# بکاپ خودکار روزانه
crontab -e
# اضافه کردن:
0 3 * * * cp /var/www/tahaeth/data.db /var/www/tahaeth/backups/data-$(date +\%Y\%m\%d).db
```

---

## عیب‌یابی

| مشکل | راه حل |
|-------|--------|
| پورت 3000 بسته‌ست | `sudo ufw allow 3000` |
| Nginx 502 Bad Gateway | `pm2 status` |
| دیتابیس قفل شده | `pm2 restart tahaeth` |
| SSL کار نمیکنه | `sudo certbot renew` |
| لاگ خطا | `pm2 logs tahaeth --err` |
